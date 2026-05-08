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

export type ConfirmedPracticeSentence = {
  bookId: string;
  pageId: string;
  pageOrder: number;
  pageImageUrl?: string;
  sentenceId: string;
  sentenceText: string;
  knowledgeLinks: Array<
    Omit<PracticeKnowledgeTarget, "knowledgeVariantId"> & {
      id: string;
    }
  >;
};

export type TodayPracticeExercise = StoredPracticeExercise & {
  mastery: PracticeMasteryStat;
};

export type TodayPractice = {
  exercises: TodayPracticeExercise[];
  latestAttempt: PracticeAttemptSummary | null;
};

export type SubmitPracticeAttemptInput = {
  childId: string;
  exerciseId: string;
  answerText: string;
  now: Date;
};

export type PracticeAttemptSummary = {
  id: string;
  exerciseId: string;
  childId: string;
  inputMode: AttemptInputMode;
  answerText: string;
  isCorrect: boolean;
  score: 0 | 1;
  errorTags: string[];
  masteryScore: number;
  nextReviewAt: Date;
};

export type PracticeRepository = {
  version: string;
  ensurePracticeExercisesFromConfirmedContent(
    sentences: ConfirmedPracticeSentence[],
  ): Promise<void>;
  ensureFillBlankExercisesFromConfirmedContent(
    sentences: ConfirmedPracticeSentence[],
  ): Promise<void>;
  getTodayPractice(input: {
    childId: string;
    now: Date;
    limit: number;
  }): Promise<TodayPractice>;
  submitAttempt(input: SubmitPracticeAttemptInput): Promise<{
    attempt: PracticeAttemptSummary;
    answerText: string;
    isCorrect: boolean;
    score: 0 | 1;
    mastery: PracticeMasteryStat;
    reviewQueueItem: PracticeReviewQueueItem;
  }>;
};

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

export function createInMemoryPracticeRepository(): PracticeRepository {
  const exercises = new Map<string, StoredPracticeExercise>();
  const exerciseKeys = new Set<string>();
  const masteryStats = new Map<string, PracticeMasteryStat>();
  const reviewQueueItems: PracticeReviewQueueItem[] = [];
  const latestAttempts = new Map<string, PracticeAttemptSummary>();
  const attemptedExerciseKeys = new Set<string>();
  let nextId = 1;

  function createId(prefix: string): string {
    const id = `${prefix}_${nextId}`;
    nextId += 1;
    return id;
  }

  function getMastery(childId: string, exercise: StoredPracticeExercise): PracticeMasteryStat {
    const target = exercise.targetItems[0];
    const key = createMasteryKey({
      childId,
      knowledgeItemId: target.knowledgeItemId,
      knowledgeVariantId: target.knowledgeVariantId,
      exerciseType: exercise.type,
    });
    let mastery = masteryStats.get(key);

    if (!mastery) {
      mastery = {
        childId,
        knowledgeItemId: target.knowledgeItemId,
        knowledgeVariantId: target.knowledgeVariantId,
        exerciseType: exercise.type,
        attempts: 0,
        errors: 0,
        consecutiveCorrect: 0,
        lastAttemptedAt: null,
        lastErrorAt: null,
        masteryScore: 0,
        nextReviewAt: null,
      };
      masteryStats.set(key, mastery);
    }

    return mastery;
  }

  return {
    version: PRACTICE_REPOSITORY_VERSION,

    async ensurePracticeExercisesFromConfirmedContent(sentences) {
      for (const sentence of sentences) {
        if (!sentence.pageImageUrl) {
          await this.ensureFillBlankExercisesFromConfirmedContent([sentence]);
          continue;
        }

        const drafts = generateDeterministicPracticeExercises({
          bookId: sentence.bookId,
          pageId: sentence.pageId,
          pageImageUrl: sentence.pageImageUrl,
          sentenceId: sentence.sentenceId,
          sentenceText: sentence.sentenceText,
          knowledgeLinks: sentence.knowledgeLinks.map((link) => ({
            ...link,
            knowledgeVariantId: link.id,
          })),
        });

        for (const draft of drafts) {
          const target = draft.targetItems[0];
          const exerciseKey = `${draft.sentenceId}:${draft.type}:${target.knowledgeVariantId}`;

          if (exerciseKeys.has(exerciseKey)) {
            continue;
          }

          exerciseKeys.add(exerciseKey);
          const exercise: StoredPracticeExercise = {
            ...draft,
            id: createId("exercise"),
            createdOrder: nextId,
          };
          exercises.set(exercise.id, exercise);
        }
      }
    },

    async ensureFillBlankExercisesFromConfirmedContent(sentences) {
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

        if (!draft) {
          continue;
        }

        const target = draft.targetItems[0];
        const exerciseKey = `${draft.sentenceId}:${draft.type}:${target.knowledgeVariantId}`;

        if (exerciseKeys.has(exerciseKey)) {
          continue;
        }

        exerciseKeys.add(exerciseKey);
        const exercise: StoredPracticeExercise = {
          ...draft,
          id: createId("exercise"),
          createdOrder: nextId,
        };
        exercises.set(exercise.id, exercise);
      }
    },

    async getTodayPractice(input) {
      const availableExercises = Array.from(exercises.values())
        .sort((left, right) => right.createdOrder - left.createdOrder)
        .map((exercise) => ({
          ...exercise,
          mastery: getMastery(input.childId, exercise),
        }))
        .filter((exercise) => {
          if (!attemptedExerciseKeys.has(`${input.childId}:${exercise.id}`)) {
            return true;
          }

          const nextReviewAt = exercise.mastery.nextReviewAt;
          return !nextReviewAt || nextReviewAt <= input.now;
        })
        .slice(0, input.limit);

      return {
        exercises: availableExercises,
        latestAttempt: latestAttempts.get(input.childId) ?? null,
      };
    },

    async submitAttempt(input) {
      const exercise = exercises.get(input.exerciseId);

      if (!exercise) {
        throw new Error("Practice exercise was not found");
      }

      const grading = gradePracticeAnswer({
        exerciseType: exercise.type,
        expectedAnswer: exercise.expectedAnswer,
        answerText: input.answerText,
      });
      attemptedExerciseKeys.add(`${input.childId}:${exercise.id}`);
      const mastery = getMastery(input.childId, exercise);
      const nextMastery = calculateNextMastery({
        previousScore: mastery.masteryScore,
        wasCorrect: grading.isCorrect,
        consecutiveCorrect: mastery.consecutiveCorrect,
      });
      const nextReviewAt = scheduleNextReview({
        from: input.now,
        wasCorrect: grading.isCorrect,
        consecutiveCorrect: nextMastery.consecutiveCorrect,
      });

      mastery.attempts += 1;
      mastery.errors += grading.isCorrect ? 0 : 1;
      mastery.consecutiveCorrect = nextMastery.consecutiveCorrect;
      mastery.lastAttemptedAt = input.now;
      mastery.lastErrorAt = grading.isCorrect ? mastery.lastErrorAt : input.now;
      mastery.masteryScore = nextMastery.score;
      mastery.nextReviewAt = nextReviewAt;

      const reviewQueueItem: PracticeReviewQueueItem = {
        id: createId("review_queue_item"),
        childId: input.childId,
        exerciseId: exercise.id,
        dueAt: nextReviewAt,
        priority: grading.isCorrect ? 10 : 100,
        sourceReason: grading.isCorrect ? "correct_attempt" : "wrong_attempt",
      };
      reviewQueueItems.push(reviewQueueItem);

      const attempt: PracticeAttemptSummary = {
        id: createId("attempt"),
        exerciseId: exercise.id,
        childId: input.childId,
        inputMode: AttemptInputMode.Keyboard,
        answerText: input.answerText,
        isCorrect: grading.isCorrect,
        score: grading.score,
        errorTags: grading.errorTags,
        masteryScore: mastery.masteryScore,
        nextReviewAt,
      };
      latestAttempts.set(input.childId, attempt);

      return {
        attempt,
        answerText: input.answerText,
        isCorrect: grading.isCorrect,
        score: grading.score,
        mastery,
        reviewQueueItem,
      };
    },
  };
}

const globalForPracticeRepository = globalThis as unknown as {
  practiceRepository?: PracticeRepository;
};

const PRACTICE_REPOSITORY_VERSION = "practice-v5";

export function getPracticeRepository(): PracticeRepository {
  if (globalForPracticeRepository.practiceRepository?.version !== PRACTICE_REPOSITORY_VERSION) {
    globalForPracticeRepository.practiceRepository = createInMemoryPracticeRepository();
  }

  return globalForPracticeRepository.practiceRepository;
}
