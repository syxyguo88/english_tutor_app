/**
 * Prisma-backed {@link PracticeRepository}.
 *
 * Ordering: {@link Exercise.createdOrder} increments on each **new** exercise insert (deduped by
 * deterministic {@link Exercise.id}), matching in-memory “newest `createdOrder` first” semantics.
 */
import type { PrismaClient } from "@prisma/client";
import {
  AttemptInputMode as PrismaAttemptInputMode,
  ExerciseType as PrismaExerciseType,
  type Attempt,
  type ChildProfile,
  type Exercise,
  type MasteryStat,
} from "@prisma/client";
import { AttemptInputMode, ExerciseType } from "@/domain/enums";
import {
  calculateNextMastery,
  createMasteryKey,
  scheduleNextReview,
} from "@/domain/mastery";
import {
  generateDeterministicPracticeExercises,
  generateFillBlankExercise,
  gradePracticeAnswer,
  type PracticeExerciseDraft,
  type PracticeKnowledgeTarget,
} from "@/domain/practice";
import type {
  ChildPracticeOverviewStats,
  ConfirmedPracticeSentence,
  CountLowMasteryKnowledgeInput,
  PracticeAttemptSummary,
  PracticeRepository,
  SubmitPracticeAttemptInput,
  TodayPractice,
  TodayPracticeExercise,
} from "./repository";
import {
  childTodayProfileLog,
  childTodayProfileLogJson,
  childTodayProfileNow,
  isChildTodayProfiling,
} from "@/lib/profile/child-today-profile";
import {
  LOW_MASTERY_SCORE_THRESHOLD,
  RECENT_ATTEMPTS_BUFFER_SIZE,
  TODAY_PRACTICE_EXERCISE_SCAN_CAP,
} from "./constants";
import {
  computeDailyPracticeStreak,
  endOfLocalDay,
  localDateKey,
  startOfLocalDay,
} from "./practice-calendar";

type StoredPracticeExercise = PracticeExerciseDraft & {
  id: string;
  createdOrder: number;
};

type PracticeMasteryStat = {
  childId: string;
  knowledgeItemId: string;
  knowledgeVariantId: string;
  exerciseType: ExerciseType;
  attempts: number;
  errors: number;
  consecutiveCorrect: number;
  lastAttemptedAt: Date | null;
  lastErrorAt: Date | null;
  masteryScore: number;
  nextReviewAt: Date | null;
};

type PracticeReviewQueueItem = {
  id: string;
  childId: string;
  exerciseId: string;
  dueAt: Date;
  priority: number;
  sourceReason: "correct_attempt" | "wrong_attempt";
};

/** Dedupe key → deterministic PK: `sentenceId` + exercise type + knowledge variant id. */
function deterministicPracticeExerciseId(input: {
  sentenceId: string;
  exerciseType: ExerciseType;
  knowledgeVariantId: string;
}): string {
  return `pe:${input.sentenceId}:${input.exerciseType}:${input.knowledgeVariantId}`;
}

function toPrismaExerciseType(type: ExerciseType): PrismaExerciseType {
  switch (type) {
    case ExerciseType.FillBlank:
      return PrismaExerciseType.fill_blank;
    case ExerciseType.PictureSentence:
      return PrismaExerciseType.picture_sentence;
    case ExerciseType.GrammarCorrection:
      return PrismaExerciseType.grammar_correction;
    case ExerciseType.SentenceCreation:
      return PrismaExerciseType.sentence_creation;
    default:
      return PrismaExerciseType.fill_blank;
  }
}

function toDomainExerciseType(type: PrismaExerciseType): ExerciseType {
  switch (type) {
    case PrismaExerciseType.fill_blank:
      return ExerciseType.FillBlank;
    case PrismaExerciseType.picture_sentence:
      return ExerciseType.PictureSentence;
    case PrismaExerciseType.grammar_correction:
      return ExerciseType.GrammarCorrection;
    case PrismaExerciseType.sentence_creation:
      return ExerciseType.SentenceCreation;
    default:
      return ExerciseType.FillBlank;
  }
}

/** Columns needed to decide “due today” eligibility without loading heavy JSON blobs. */
const exerciseTodayScanSelect = {
  id: true,
  createdOrder: true,
  bookId: true,
  pageId: true,
  sentenceId: true,
  type: true,
  targetItems: true,
} as const;

function exerciseRowToStored(row: Exercise): StoredPracticeExercise {
  const type = toDomainExerciseType(row.type);
  const targetItems = row.targetItems as unknown as PracticeKnowledgeTarget[];
  const common = {
    bookId: row.bookId ?? "",
    sentenceId: row.sentenceId ?? "",
    type,
    prompt: row.prompt as PracticeExerciseDraft["prompt"],
    expectedAnswer: row.expectedAnswer as PracticeExerciseDraft["expectedAnswer"],
    targetItems,
  };

  const draftBase =
    row.pageId !== null && row.pageId !== undefined
      ? { ...common, pageId: row.pageId }
      : common;

  return {
    ...(draftBase as PracticeExerciseDraft),
    id: row.id,
    createdOrder: row.createdOrder,
  };
}

function masteryStatToPractice(
  row: MasteryStat,
  childId: string,
): PracticeMasteryStat {
  return {
    childId,
    knowledgeItemId: row.knowledgeItemId,
    knowledgeVariantId: row.knowledgeVariantId,
    exerciseType: toDomainExerciseType(row.exerciseType),
    attempts: row.attempts,
    errors: row.errors,
    consecutiveCorrect: row.consecutiveCorrect,
    lastAttemptedAt: row.lastAttemptedAt,
    lastErrorAt: row.lastErrorAt,
    masteryScore: row.masteryScore,
    nextReviewAt: row.nextReviewAt,
  };
}

function defaultMastery(
  childId: string,
  target: PracticeKnowledgeTarget,
  exerciseType: ExerciseType,
): PracticeMasteryStat {
  return {
    childId,
    knowledgeItemId: target.knowledgeItemId,
    knowledgeVariantId: target.knowledgeVariantId,
    exerciseType,
    attempts: 0,
    errors: 0,
    consecutiveCorrect: 0,
    lastAttemptedAt: null,
    lastErrorAt: null,
    masteryScore: 0,
    nextReviewAt: null,
  };
}

function attemptRowToSummary(
  row: Attempt & { exercise: Pick<Exercise, "type"> },
): PracticeAttemptSummary {
  const exerciseType = toDomainExerciseType(row.exercise.type);
  const scoreNum = row.score ?? 0;
  const isCorrect = scoreNum >= 1;
  const score: 0 | 1 = isCorrect ? 1 : 0;

  return {
    id: row.id,
    exerciseId: row.exerciseId,
    childId: row.childUserId,
    exerciseType,
    inputMode: AttemptInputMode.Keyboard,
    answerText: row.answerText,
    isCorrect,
    score,
    errorTags: row.errorTags,
    masteryScore: row.masteryScoreAfter ?? 0,
    nextReviewAt: row.nextReviewAtAfter ?? row.createdAt,
  };
}

export function createPrismaPracticeRepository(
  db: PrismaClient,
): PracticeRepository {
  async function persistNewExerciseDrafts(drafts: PracticeExerciseDraft[]): Promise<void> {
    const byId = new Map<string, PracticeExerciseDraft>();
    for (const draft of drafts) {
      const target = draft.targetItems[0];
      if (!target) {
        continue;
      }
      const id = deterministicPracticeExerciseId({
        sentenceId: draft.sentenceId,
        exerciseType: draft.type,
        knowledgeVariantId: target.knowledgeVariantId,
      });
      byId.set(id, draft);
    }

    const unique = [...byId.values()];
    if (unique.length === 0) {
      return;
    }

    await db.$transaction(async (tx) => {
      const ids = unique.map((draft) => {
        const target = draft.targetItems[0]!;
        return deterministicPracticeExerciseId({
          sentenceId: draft.sentenceId,
          exerciseType: draft.type,
          knowledgeVariantId: target.knowledgeVariantId,
        });
      });

      const existingRows = await tx.exercise.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      });
      const existingIds = new Set(existingRows.map((row) => row.id));

      const agg = await tx.exercise.aggregate({ _max: { createdOrder: true } });
      let nextOrder = (agg._max.createdOrder ?? 0) + 1;

      for (const draft of unique) {
        const target = draft.targetItems[0]!;
        const id = deterministicPracticeExerciseId({
          sentenceId: draft.sentenceId,
          exerciseType: draft.type,
          knowledgeVariantId: target.knowledgeVariantId,
        });
        if (existingIds.has(id)) {
          continue;
        }

        await tx.exercise.create({
          data: {
            id,
            bookId: draft.bookId || null,
            pageId: "pageId" in draft && draft.pageId ? draft.pageId : null,
            sentenceId: draft.sentenceId || null,
            type: toPrismaExerciseType(draft.type),
            prompt: draft.prompt as object,
            expectedAnswer: draft.expectedAnswer as object,
            targetItems: draft.targetItems as object,
            createdOrder: nextOrder,
          },
        });
        existingIds.add(id);
        nextOrder += 1;
      }
    });
  }

  return {
    async ensurePracticeExercisesFromConfirmedContent(sentences: ConfirmedPracticeSentence[]) {
      const drafts: PracticeExerciseDraft[] = [];

      for (const sentence of sentences) {
        if (!sentence.pageImageUrl) {
          const draft = generateFillBlankExercise({
            bookId: sentence.bookId,
            sentenceId: sentence.sentenceId,
            sentenceText: sentence.sentenceText,
            knowledgeLinks: sentence.knowledgeLinks.map((link) => ({
              ...link,
              knowledgeVariantId: link.id,
            })),
          });
          if (draft) {
            drafts.push(draft);
          }
          continue;
        }

        drafts.push(
          ...generateDeterministicPracticeExercises({
            bookId: sentence.bookId,
            pageId: sentence.pageId,
            pageImageUrl: sentence.pageImageUrl,
            sentenceId: sentence.sentenceId,
            sentenceText: sentence.sentenceText,
            knowledgeLinks: sentence.knowledgeLinks.map((link) => ({
              ...link,
              knowledgeVariantId: link.id,
            })),
          }),
        );
      }

      await persistNewExerciseDrafts(drafts);
    },

    async ensureFillBlankExercisesFromConfirmedContent(sentences: ConfirmedPracticeSentence[]) {
      const drafts: PracticeExerciseDraft[] = [];

      for (const sentence of sentences) {
        const draft = generateFillBlankExercise({
          bookId: sentence.bookId,
          sentenceId: sentence.sentenceId,
          sentenceText: sentence.sentenceText,
          knowledgeLinks: sentence.knowledgeLinks.map((link) => ({
            ...link,
            knowledgeVariantId: link.id,
          })),
        });

        if (draft) {
          drafts.push(draft);
        }
      }

      await persistNewExerciseDrafts(drafts);
    },

    async countLowMasteryKnowledge(input: CountLowMasteryKnowledgeInput) {
      const threshold = input.masteryScoreThreshold ?? LOW_MASTERY_SCORE_THRESHOLD;

      const profile = await db.childProfile.findUnique({
        where: { childUserId: input.childId },
      });

      if (!profile) {
        return 0;
      }

      return db.masteryStat.count({
        where: {
          childProfileId: profile.id,
          attempts: { gte: 1 },
          masteryScore: { lt: threshold },
        },
      });
    },

    async getTodayPractice(input: {
      childId: string;
      now: Date;
      limit: number;
    }): Promise<TodayPractice> {
      const getTodayT0 = childTodayProfileNow();
      const scanTake = Math.min(
        TODAY_PRACTICE_EXERCISE_SCAN_CAP,
        Math.max(100, input.limit * 35),
      );

      let exerciseScanRows: Awaited<
        ReturnType<typeof db.exercise.findMany<{ select: typeof exerciseTodayScanSelect }>>
      >;
      let profile: ChildProfile | null;
      let attemptedGroups;
      let latestAttemptRow: (Attempt & { exercise: Pick<Exercise, "type"> }) | null;

      if (isChildTodayProfiling()) {
        const tBatchWall = childTodayProfileNow();
        [exerciseScanRows, profile, attemptedGroups, latestAttemptRow] = await Promise.all([
          (async () => {
            const t = childTodayProfileNow();
            const rows = await db.exercise.findMany({
              select: exerciseTodayScanSelect,
              orderBy: { createdOrder: "desc" },
              take: scanTake,
            });
            childTodayProfileLogJson({
              phase: "getTodayPractice_exercise_scan_select",
              durationMs: Number((childTodayProfileNow() - t).toFixed(2)),
              exerciseScanRowCount: rows.length,
            });
            return rows;
          })(),
          (async () => {
            const t = childTodayProfileNow();
            const r = await db.childProfile.findUnique({
              where: { childUserId: input.childId },
            });
            childTodayProfileLogJson({
              phase: "getTodayPractice_childProfile_findUnique",
              durationMs: Number((childTodayProfileNow() - t).toFixed(2)),
            });
            return r;
          })(),
          (async () => {
            const t = childTodayProfileNow();
            const r = await db.attempt.groupBy({
              by: ["exerciseId"],
              where: { childUserId: input.childId },
            });
            childTodayProfileLogJson({
              phase: "getTodayPractice_attempt_groupBy",
              durationMs: Number((childTodayProfileNow() - t).toFixed(2)),
            });
            return r;
          })(),
          (async () => {
            const t = childTodayProfileNow();
            const r = await db.attempt.findFirst({
              where: { childUserId: input.childId },
              orderBy: { createdAt: "desc" },
              include: { exercise: true },
            });
            childTodayProfileLogJson({
              phase: "getTodayPractice_attempt_findFirst_include_exercise",
              durationMs: Number((childTodayProfileNow() - t).toFixed(2)),
            });
            return r;
          })(),
        ]);
        childTodayProfileLogJson({
          phase: "getTodayPractice_parallel_batch_wall_ms",
          durationMs: Number((childTodayProfileNow() - tBatchWall).toFixed(2)),
        });
      } else {
        [exerciseScanRows, profile, attemptedGroups, latestAttemptRow] = await Promise.all([
          db.exercise.findMany({
            select: exerciseTodayScanSelect,
            orderBy: { createdOrder: "desc" },
            take: scanTake,
          }),
          db.childProfile.findUnique({
            where: { childUserId: input.childId },
          }),
          db.attempt.groupBy({
            by: ["exerciseId"],
            where: { childUserId: input.childId },
          }),
          db.attempt.findFirst({
            where: { childUserId: input.childId },
            orderBy: { createdAt: "desc" },
            include: { exercise: true },
          }),
        ]);
      }

      const masteryByKey = new Map<string, PracticeMasteryStat>();

      let masteryRowCount = 0;
      if (profile) {
        const tMastery = childTodayProfileNow();
        const masteryRows = await db.masteryStat.findMany({
          where: { childProfileId: profile.id },
        });
        masteryRowCount = masteryRows.length;
        for (const row of masteryRows) {
          const key = createMasteryKey({
            childId: input.childId,
            knowledgeItemId: row.knowledgeItemId,
            knowledgeVariantId: row.knowledgeVariantId,
            exerciseType: toDomainExerciseType(row.exerciseType),
          });
          masteryByKey.set(key, masteryStatToPractice(row, input.childId));
        }
        if (isChildTodayProfiling()) {
          childTodayProfileLog("getTodayPractice_masteryStat_findMany", childTodayProfileNow() - tMastery, {
            masteryStatFindManyCount: masteryRowCount,
          });
        }
      }

      const attemptedExerciseIds = new Set(attemptedGroups.map((g) => g.exerciseId));

      const chosenIds: string[] = [];

      const tSelectLoop = childTodayProfileNow();
      for (const row of exerciseScanRows) {
        const targetItems = row.targetItems as unknown as PracticeKnowledgeTarget[];
        const target = targetItems[0];
        if (!target) {
          continue;
        }

        const exerciseType = toDomainExerciseType(row.type);
        const masteryKey = createMasteryKey({
          childId: input.childId,
          knowledgeItemId: target.knowledgeItemId,
          knowledgeVariantId: target.knowledgeVariantId,
          exerciseType,
        });
        const mastery =
          masteryByKey.get(masteryKey) ?? defaultMastery(input.childId, target, exerciseType);

        const attempted = attemptedExerciseIds.has(row.id);
        const eligible =
          !attempted ||
          !mastery.nextReviewAt ||
          mastery.nextReviewAt <= input.now;

        if (eligible) {
          chosenIds.push(row.id);
        }

        if (chosenIds.length >= input.limit) {
          break;
        }
      }
      if (isChildTodayProfiling()) {
        childTodayProfileLog("getTodayPractice_selection_loop", childTodayProfileNow() - tSelectLoop);
      }

      let exercisesFull: Exercise[] = [];
      if (chosenIds.length > 0) {
        const tFull = childTodayProfileNow();
        const rows = await db.exercise.findMany({
          where: { id: { in: chosenIds } },
        });
        const byId = new Map(rows.map((r) => [r.id, r]));
        exercisesFull = chosenIds
          .map((id) => byId.get(id))
          .filter((r): r is Exercise => r !== undefined);
        if (isChildTodayProfiling()) {
          childTodayProfileLogJson({
            phase: "getTodayPractice_exercise_full_by_ids",
            durationMs: Number((childTodayProfileNow() - tFull).toFixed(2)),
            exerciseFullCount: exercisesFull.length,
          });
        }
      }

      const tBuildReturn = childTodayProfileNow();
      const out: TodayPracticeExercise[] = exercisesFull.map((row) => {
        const stored = exerciseRowToStored(row);
        const target = stored.targetItems[0]!;
        const masteryKey = createMasteryKey({
          childId: input.childId,
          knowledgeItemId: target.knowledgeItemId,
          knowledgeVariantId: target.knowledgeVariantId,
          exerciseType: stored.type,
        });
        const mastery =
          masteryByKey.get(masteryKey) ?? defaultMastery(input.childId, target, stored.type);
        return { ...stored, mastery };
      });

      const result: TodayPractice = {
        exercises: out,
        latestAttempt: latestAttemptRow
          ? attemptRowToSummary(latestAttemptRow)
          : null,
      };
      if (isChildTodayProfiling()) {
        childTodayProfileLog("getTodayPractice_build_return", childTodayProfileNow() - tBuildReturn);
        childTodayProfileLog("getTodayPractice_total", childTodayProfileNow() - getTodayT0);
      }

      return result;
    },

    async getRecentAttempts(input: { childId: string; limit?: number }) {
      const limit = Math.min(
        input.limit ?? RECENT_ATTEMPTS_BUFFER_SIZE,
        RECENT_ATTEMPTS_BUFFER_SIZE,
      );

      const rows = await db.attempt.findMany({
        where: { childUserId: input.childId },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: { exercise: { select: { type: true } } },
      });

      return rows.map(attemptRowToSummary);
    },

    async getChildPracticeOverview(input: {
      childId: string;
      now: Date;
    }): Promise<ChildPracticeOverviewStats> {
      const start = startOfLocalDay(input.now);
      const end = endOfLocalDay(input.now);

      const [attemptsTotal, attemptsToday, dateRows] = await Promise.all([
        db.attempt.count({ where: { childUserId: input.childId } }),
        db.attempt.count({
          where: {
            childUserId: input.childId,
            createdAt: { gte: start, lte: end },
          },
        }),
        db.attempt.findMany({
          where: { childUserId: input.childId },
          select: { createdAt: true },
        }),
      ]);

      const practiceDateKeys = new Set(
        dateRows.map((r) => localDateKey(new Date(r.createdAt))),
      );
      const practiceStreakDays = computeDailyPracticeStreak(input.now, practiceDateKeys);

      return { practiceStreakDays, attemptsToday, attemptsTotal };
    },

    async submitAttempt(input: SubmitPracticeAttemptInput) {
      const result = await db.$transaction(async (tx) => {
        const exercise = await tx.exercise.findUnique({
          where: { id: input.exerciseId },
        });

        if (!exercise) {
          throw new Error("Practice exercise was not found");
        }

        const childProfile: ChildProfile | null = await tx.childProfile.findUnique({
          where: { childUserId: input.childId },
        });

        if (!childProfile) {
          throw new Error("Child profile was not found for practice submit");
        }

        const stored = exerciseRowToStored(exercise);
        const grading = gradePracticeAnswer({
          exerciseType: stored.type,
          expectedAnswer: stored.expectedAnswer,
          answerText: input.answerText,
        });

        const target = stored.targetItems[0];
        if (!target) {
          throw new Error("Practice exercise has no knowledge target");
        }

        const compoundId = {
          childProfileId: childProfile.id,
          knowledgeItemId: target.knowledgeItemId,
          knowledgeVariantId: target.knowledgeVariantId,
          exerciseType: exercise.type,
        };

        const existing = await tx.masteryStat.findUnique({
          where: {
            childProfileId_knowledgeItemId_knowledgeVariantId_exerciseType: compoundId,
          },
        });

        const previousMastery: PracticeMasteryStat = existing
          ? masteryStatToPractice(existing, input.childId)
          : defaultMastery(input.childId, target, stored.type);

        const nextMasteryCalc = calculateNextMastery({
          previousScore: previousMastery.masteryScore,
          wasCorrect: grading.isCorrect,
          consecutiveCorrect: previousMastery.consecutiveCorrect,
        });

        const nextReviewAt = scheduleNextReview({
          from: input.now,
          wasCorrect: grading.isCorrect,
          consecutiveCorrect: nextMasteryCalc.consecutiveCorrect,
        });

        const updatedMastery: PracticeMasteryStat = {
          ...previousMastery,
          attempts: previousMastery.attempts + 1,
          errors: previousMastery.errors + (grading.isCorrect ? 0 : 1),
          consecutiveCorrect: nextMasteryCalc.consecutiveCorrect,
          lastAttemptedAt: input.now,
          lastErrorAt: grading.isCorrect ? previousMastery.lastErrorAt : input.now,
          masteryScore: nextMasteryCalc.score,
          nextReviewAt,
        };

        await tx.masteryStat.upsert({
          where: {
            childProfileId_knowledgeItemId_knowledgeVariantId_exerciseType: compoundId,
          },
          create: {
            childProfileId: childProfile.id,
            knowledgeItemId: target.knowledgeItemId,
            knowledgeVariantId: target.knowledgeVariantId,
            exerciseType: exercise.type,
            attempts: 1,
            errors: grading.isCorrect ? 0 : 1,
            consecutiveCorrect: nextMasteryCalc.consecutiveCorrect,
            lastAttemptedAt: input.now,
            lastErrorAt: grading.isCorrect ? null : input.now,
            masteryScore: nextMasteryCalc.score,
            nextReviewAt,
          },
          update: {
            attempts: { increment: 1 },
            errors: { increment: grading.isCorrect ? 0 : 1 },
            consecutiveCorrect: nextMasteryCalc.consecutiveCorrect,
            lastAttemptedAt: input.now,
            lastErrorAt: grading.isCorrect ? undefined : input.now,
            masteryScore: nextMasteryCalc.score,
            nextReviewAt,
          },
        });

        const attemptRow = await tx.attempt.create({
          data: {
            exerciseId: exercise.id,
            childUserId: input.childId,
            inputMode: PrismaAttemptInputMode.keyboard,
            answerText: input.answerText,
            score: grading.score,
            errorTags: grading.errorTags,
            masteryScoreAfter: updatedMastery.masteryScore,
            nextReviewAtAfter: nextReviewAt,
          },
          include: { exercise: true },
        });

        const review = await tx.reviewQueueItem.create({
          data: {
            childProfileId: childProfile.id,
            exerciseId: exercise.id,
            dueAt: nextReviewAt,
            priority: grading.isCorrect ? 10 : 100,
            sourceReason: grading.isCorrect ? "correct_attempt" : "wrong_attempt",
          },
        });

        const reviewQueueItem: PracticeReviewQueueItem = {
          id: review.id,
          childId: input.childId,
          exerciseId: exercise.id,
          dueAt: nextReviewAt,
          priority: grading.isCorrect ? 10 : 100,
          sourceReason: grading.isCorrect ? "correct_attempt" : "wrong_attempt",
        };

        return {
          attempt: attemptRowToSummary(attemptRow),
          grading,
          mastery: updatedMastery,
          reviewQueueItem,
        };
      });

      return {
        attempt: result.attempt,
        answerText: input.answerText,
        isCorrect: result.grading.isCorrect,
        score: result.grading.score,
        mastery: result.mastery,
        reviewQueueItem: result.reviewQueueItem,
      };
    },
  };
}
