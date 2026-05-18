import { describe, expect, it } from "vitest";
import { ExerciseType } from "@/domain/enums";
import {
  LOW_MASTERY_SCORE_THRESHOLD,
  RECENT_ATTEMPTS_BUFFER_SIZE,
  createInMemoryPracticeRepository,
} from "./repository";

describe("practice repository", () => {
  it("counts zero low-mastery knowledge when there are no attempts", async () => {
    const repository = createInMemoryPracticeRepository();
    await repository.ensureFillBlankExercisesFromConfirmedContent([
      {
        bookId: "book_1",
        pageId: "page_1",
        pageOrder: 1,
        sentenceId: "sentence_1",
        sentenceText: "I can see page one.",
        knowledgeLinks: [
          {
            id: "knowledge_variant_1",
            knowledgeItemId: "knowledge_item_1",
            surfaceForm: "page",
            canonical: "page",
            variantKind: "base",
          },
        ],
      },
    ]);

    await repository.getTodayPractice({
      childId: "prototype-child",
      now: new Date("2026-05-08T00:00:00.000Z"),
      limit: 5,
    });

    await expect(
      repository.countLowMasteryKnowledge({ childId: "prototype-child" }),
    ).resolves.toBe(0);
  });

  it("includes a mastery row in low-mastery count after a wrong attempt drops score below the threshold", async () => {
    const repository = createInMemoryPracticeRepository();
    await repository.ensureFillBlankExercisesFromConfirmedContent([
      {
        bookId: "book_1",
        pageId: "page_1",
        pageOrder: 1,
        sentenceId: "sentence_1",
        sentenceText: "I can see page one.",
        knowledgeLinks: [
          {
            id: "knowledge_variant_1",
            knowledgeItemId: "knowledge_item_1",
            surfaceForm: "page",
            canonical: "page",
            variantKind: "base",
          },
        ],
      },
    ]);
    const today = await repository.getTodayPractice({
      childId: "prototype-child",
      now: new Date("2026-05-08T00:00:00.000Z"),
      limit: 5,
    });

    await repository.submitAttempt({
      childId: "prototype-child",
      exerciseId: today.exercises[0]?.id ?? "",
      answerText: "wrong",
      now: new Date("2026-05-08T00:00:00.000Z"),
    });

    await expect(
      repository.countLowMasteryKnowledge({ childId: "prototype-child" }),
    ).resolves.toBe(1);
  });

  it("does not count low mastery for a different child", async () => {
    const repository = createInMemoryPracticeRepository();
    await repository.ensureFillBlankExercisesFromConfirmedContent([
      {
        bookId: "book_1",
        pageId: "page_1",
        pageOrder: 1,
        sentenceId: "sentence_1",
        sentenceText: "I can see page one.",
        knowledgeLinks: [
          {
            id: "knowledge_variant_1",
            knowledgeItemId: "knowledge_item_1",
            surfaceForm: "page",
            canonical: "page",
            variantKind: "base",
          },
        ],
      },
    ]);
    const today = await repository.getTodayPractice({
      childId: "prototype-child",
      now: new Date("2026-05-08T00:00:00.000Z"),
      limit: 5,
    });

    await repository.submitAttempt({
      childId: "prototype-child",
      exerciseId: today.exercises[0]?.id ?? "",
      answerText: "wrong",
      now: new Date("2026-05-08T00:00:00.000Z"),
    });

    await expect(
      repository.countLowMasteryKnowledge({ childId: "other-child" }),
    ).resolves.toBe(0);
  });

  it("excludes scores at or above the threshold and respects a custom threshold", async () => {
    const repository = createInMemoryPracticeRepository();
    await repository.ensureFillBlankExercisesFromConfirmedContent([
      {
        bookId: "book_1",
        pageId: "page_1",
        pageOrder: 1,
        sentenceId: "sentence_1",
        sentenceText: "I can see page one.",
        knowledgeLinks: [
          {
            id: "knowledge_variant_1",
            knowledgeItemId: "knowledge_item_1",
            surfaceForm: "page",
            canonical: "page",
            variantKind: "base",
          },
        ],
      },
    ]);
    const today = await repository.getTodayPractice({
      childId: "prototype-child",
      now: new Date("2026-05-08T00:00:00.000Z"),
      limit: 5,
    });

    await repository.submitAttempt({
      childId: "prototype-child",
      exerciseId: today.exercises[0]?.id ?? "",
      answerText: " Page ",
      now: new Date("2026-05-08T00:00:00.000Z"),
    });

    await expect(
      repository.countLowMasteryKnowledge({
        childId: "prototype-child",
        masteryScoreThreshold: LOW_MASTERY_SCORE_THRESHOLD,
      }),
    ).resolves.toBe(1);

    await expect(
      repository.countLowMasteryKnowledge({
        childId: "prototype-child",
        masteryScoreThreshold: 8,
      }),
    ).resolves.toBe(0);
  });

  it("creates today's deterministic practice set from confirmed content", async () => {
    const repository = createInMemoryPracticeRepository();

    await repository.ensurePracticeExercisesFromConfirmedContent([
      {
        bookId: "book_1",
        pageId: "page_1",
        pageOrder: 1,
        pageImageUrl: "data:image/png;base64,page-one",
        sentenceId: "sentence_1",
        sentenceText: "This is a good book.",
        knowledgeLinks: [
          {
            id: "knowledge_variant_1",
            knowledgeItemId: "knowledge_item_1",
            surfaceForm: "good book",
            canonical: "good book",
            variantKind: "base",
          },
        ],
      },
    ]);

    await expect(
      repository.getTodayPractice({
        childId: "prototype-child",
        now: new Date("2026-05-08T00:00:00.000Z"),
        limit: 5,
      }),
    ).resolves.toMatchObject({
      exercises: [
        { type: ExerciseType.SentenceCreation },
        { type: ExerciseType.GrammarCorrection },
        { type: ExerciseType.PictureSentence },
        { type: ExerciseType.FillBlank },
      ],
    });
  });

  it("creates today's fill-blank practice from confirmed content", async () => {
    const repository = createInMemoryPracticeRepository();

    await repository.ensureFillBlankExercisesFromConfirmedContent([
      {
        bookId: "book_1",
        pageId: "page_1",
        pageOrder: 1,
        sentenceId: "sentence_1",
        sentenceText: "I can see page one.",
        knowledgeLinks: [
          {
            id: "knowledge_variant_1",
            knowledgeItemId: "knowledge_item_1",
            surfaceForm: "page",
            canonical: "page",
            variantKind: "base",
          },
        ],
      },
    ]);

    await expect(
      repository.getTodayPractice({
        childId: "prototype-child",
        now: new Date("2026-05-08T00:00:00.000Z"),
        limit: 5,
      }),
    ).resolves.toMatchObject({
      exercises: [
        {
          type: ExerciseType.FillBlank,
          prompt: { textWithBlank: "I can see ____ one." },
          expectedAnswer: { text: "page" },
          mastery: {
            attempts: 0,
            errors: 0,
            masteryScore: 0,
          },
        },
      ],
      latestAttempt: null,
    });
  });

  it("records attempts, updates mastery, and schedules review", async () => {
    const repository = createInMemoryPracticeRepository();
    await repository.ensureFillBlankExercisesFromConfirmedContent([
      {
        bookId: "book_1",
        pageId: "page_1",
        pageOrder: 1,
        sentenceId: "sentence_1",
        sentenceText: "I can see page one.",
        knowledgeLinks: [
          {
            id: "knowledge_variant_1",
            knowledgeItemId: "knowledge_item_1",
            surfaceForm: "page",
            canonical: "page",
            variantKind: "base",
          },
        ],
      },
    ]);
    const today = await repository.getTodayPractice({
      childId: "prototype-child",
      now: new Date("2026-05-08T00:00:00.000Z"),
      limit: 5,
    });

    const attempt = await repository.submitAttempt({
      childId: "prototype-child",
      exerciseId: today.exercises[0]?.id ?? "",
      answerText: " Page ",
      now: new Date("2026-05-08T00:00:00.000Z"),
    });

    expect(attempt).toMatchObject({
      answerText: " Page ",
      isCorrect: true,
      score: 1,
      mastery: {
        attempts: 1,
        errors: 0,
        consecutiveCorrect: 1,
        masteryScore: 8,
        nextReviewAt: new Date("2026-05-11T00:00:00.000Z"),
      },
      reviewQueueItem: {
        dueAt: new Date("2026-05-11T00:00:00.000Z"),
        priority: 10,
        sourceReason: "correct_attempt",
      },
    });

    await expect(
      repository.getTodayPractice({
        childId: "prototype-child",
        now: new Date("2026-05-08T00:00:00.000Z"),
        limit: 5,
      }),
    ).resolves.toMatchObject({
      latestAttempt: {
        isCorrect: true,
        masteryScore: 8,
      },
    });
  });

  it("lowers mastery and prioritizes next-day review after a wrong answer", async () => {
    const repository = createInMemoryPracticeRepository();
    await repository.ensureFillBlankExercisesFromConfirmedContent([
      {
        bookId: "book_1",
        pageId: "page_1",
        pageOrder: 1,
        sentenceId: "sentence_1",
        sentenceText: "I can see page one.",
        knowledgeLinks: [
          {
            id: "knowledge_variant_1",
            knowledgeItemId: "knowledge_item_1",
            surfaceForm: "page",
            canonical: "page",
            variantKind: "base",
          },
        ],
      },
    ]);
    const today = await repository.getTodayPractice({
      childId: "prototype-child",
      now: new Date("2026-05-08T00:00:00.000Z"),
      limit: 5,
    });

    const attempt = await repository.submitAttempt({
      childId: "prototype-child",
      exerciseId: today.exercises[0]?.id ?? "",
      answerText: "book",
      now: new Date("2026-05-08T00:00:00.000Z"),
    });

    expect(attempt).toMatchObject({
      isCorrect: false,
      score: 0,
      mastery: {
        attempts: 1,
        errors: 1,
        consecutiveCorrect: 0,
        masteryScore: 0,
        nextReviewAt: new Date("2026-05-09T00:00:00.000Z"),
      },
      reviewQueueItem: {
        dueAt: new Date("2026-05-09T00:00:00.000Z"),
        priority: 100,
        sourceReason: "wrong_attempt",
      },
    });
  });

  it("keeps newly generated exercises available even when the same target is scheduled for review later", async () => {
    const repository = createInMemoryPracticeRepository();
    await repository.ensureFillBlankExercisesFromConfirmedContent([
      {
        bookId: "book_1",
        pageId: "page_1",
        pageOrder: 1,
        sentenceId: "sentence_1",
        sentenceText: "I can see page one.",
        knowledgeLinks: [
          {
            id: "knowledge_variant_1",
            knowledgeItemId: "knowledge_item_1",
            surfaceForm: "page",
            canonical: "page",
            variantKind: "base",
          },
        ],
      },
    ]);
    const firstPractice = await repository.getTodayPractice({
      childId: "prototype-child",
      now: new Date("2026-05-08T00:00:00.000Z"),
      limit: 5,
    });
    await repository.submitAttempt({
      childId: "prototype-child",
      exerciseId: firstPractice.exercises[0]?.id ?? "",
      answerText: "page",
      now: new Date("2026-05-08T00:00:00.000Z"),
    });

    await repository.ensureFillBlankExercisesFromConfirmedContent([
      {
        bookId: "book_2",
        pageId: "page_2",
        pageOrder: 1,
        sentenceId: "sentence_2",
        sentenceText: "Please turn the page.",
        knowledgeLinks: [
          {
            id: "knowledge_variant_1",
            knowledgeItemId: "knowledge_item_1",
            surfaceForm: "page",
            canonical: "page",
            variantKind: "base",
          },
        ],
      },
    ]);

    await expect(
      repository.getTodayPractice({
        childId: "prototype-child",
        now: new Date("2026-05-08T00:00:00.000Z"),
        limit: 5,
      }),
    ).resolves.toMatchObject({
      exercises: [
        {
          sentenceId: "sentence_2",
          prompt: {
            textWithBlank: "Please turn the ____.",
          },
        },
      ],
    });
  });

  it("offers the newest unattempted exercises first", async () => {
    const repository = createInMemoryPracticeRepository();
    await repository.ensureFillBlankExercisesFromConfirmedContent([
      {
        bookId: "book_1",
        pageId: "page_1",
        pageOrder: 1,
        sentenceId: "sentence_1",
        sentenceText: "I can see page one.",
        knowledgeLinks: [
          {
            id: "knowledge_variant_1",
            knowledgeItemId: "knowledge_item_1",
            surfaceForm: "page",
            canonical: "page",
            variantKind: "base",
          },
        ],
      },
      {
        bookId: "book_2",
        pageId: "page_2",
        pageOrder: 1,
        sentenceId: "sentence_2",
        sentenceText: "Please turn the page.",
        knowledgeLinks: [
          {
            id: "knowledge_variant_1",
            knowledgeItemId: "knowledge_item_1",
            surfaceForm: "page",
            canonical: "page",
            variantKind: "base",
          },
        ],
      },
    ]);

    await expect(
      repository.getTodayPractice({
        childId: "prototype-child",
        now: new Date("2026-05-08T00:00:00.000Z"),
        limit: 5,
      }),
    ).resolves.toMatchObject({
      exercises: [
        {
          sentenceId: "sentence_2",
        },
        {
          sentenceId: "sentence_1",
        },
      ],
    });
  });

  it("getRecentAttempts returns newest-first after two submits and respects limit", async () => {
    const repository = createInMemoryPracticeRepository();
    await repository.ensureFillBlankExercisesFromConfirmedContent([
      {
        bookId: "book_1",
        pageId: "page_1",
        pageOrder: 1,
        sentenceId: "sentence_1",
        sentenceText: "I can see page one.",
        knowledgeLinks: [
          {
            id: "knowledge_variant_1",
            knowledgeItemId: "knowledge_item_1",
            surfaceForm: "page",
            canonical: "page",
            variantKind: "base",
          },
        ],
      },
      {
        bookId: "book_2",
        pageId: "page_2",
        pageOrder: 1,
        sentenceId: "sentence_2",
        sentenceText: "Please turn the page.",
        knowledgeLinks: [
          {
            id: "knowledge_variant_1",
            knowledgeItemId: "knowledge_item_1",
            surfaceForm: "page",
            canonical: "page",
            variantKind: "base",
          },
        ],
      },
    ]);

    const today = await repository.getTodayPractice({
      childId: "prototype-child",
      now: new Date("2026-05-08T00:00:00.000Z"),
      limit: 5,
    });

    const exerciseA = today.exercises.find((exercise) => exercise.sentenceId === "sentence_1")?.id;
    const exerciseB = today.exercises.find((exercise) => exercise.sentenceId === "sentence_2")?.id;
    expect(exerciseA).toBeDefined();
    expect(exerciseB).toBeDefined();

    const first = await repository.submitAttempt({
      childId: "prototype-child",
      exerciseId: exerciseA ?? "",
      answerText: "first-answer",
      now: new Date("2026-05-08T00:00:00.000Z"),
    });
    const second = await repository.submitAttempt({
      childId: "prototype-child",
      exerciseId: exerciseB ?? "",
      answerText: "second-answer",
      now: new Date("2026-05-08T00:00:01.000Z"),
    });

    await expect(
      repository.getRecentAttempts({ childId: "prototype-child" }),
    ).resolves.toEqual([
      expect.objectContaining({
        id: second.attempt.id,
        answerText: "second-answer",
        exerciseType: ExerciseType.FillBlank,
      }),
      expect.objectContaining({
        id: first.attempt.id,
        answerText: "first-answer",
        exerciseType: ExerciseType.FillBlank,
      }),
    ]);

    await expect(
      repository.getRecentAttempts({ childId: "prototype-child", limit: 1 }),
    ).resolves.toEqual([
      expect.objectContaining({
        id: second.attempt.id,
      }),
    ]);
  });

  it("drops oldest attempts when recent buffer exceeds RECENT_ATTEMPTS_BUFFER_SIZE", async () => {
    const repository = createInMemoryPracticeRepository();
    await repository.ensureFillBlankExercisesFromConfirmedContent([
      {
        bookId: "book_1",
        pageId: "page_1",
        pageOrder: 1,
        sentenceId: "sentence_1",
        sentenceText: "I can see page one.",
        knowledgeLinks: [
          {
            id: "knowledge_variant_1",
            knowledgeItemId: "knowledge_item_1",
            surfaceForm: "page",
            canonical: "page",
            variantKind: "base",
          },
        ],
      },
    ]);

    const today = await repository.getTodayPractice({
      childId: "prototype-child",
      now: new Date("2026-05-08T00:00:00.000Z"),
      limit: 5,
    });

    const exerciseId = today.exercises[0]?.id ?? "";
    const attemptIds: string[] = [];
    const baseTime = new Date("2026-05-08T12:00:00.000Z");

    for (let index = 0; index < RECENT_ATTEMPTS_BUFFER_SIZE + 1; index += 1) {
      const result = await repository.submitAttempt({
        childId: "prototype-child",
        exerciseId,
        answerText: `ans-${index}`,
        now: new Date(baseTime.getTime() + index * 1000),
      });
      attemptIds.push(result.attempt.id);
    }

    const recent = await repository.getRecentAttempts({
      childId: "prototype-child",
      limit: RECENT_ATTEMPTS_BUFFER_SIZE,
    });

    expect(recent).toHaveLength(RECENT_ATTEMPTS_BUFFER_SIZE);
    expect(recent.map((attempt) => attempt.id)).not.toContain(attemptIds[0]);
    expect(recent[0]?.id).toBe(attemptIds[attemptIds.length - 1]);
    expect(recent[RECENT_ATTEMPTS_BUFFER_SIZE - 1]?.id).toBe(attemptIds[1]);
  });

  it("getChildPracticeOverview reflects streak and totals", async () => {
    const repository = createInMemoryPracticeRepository();
    await repository.ensureFillBlankExercisesFromConfirmedContent([
      {
        bookId: "book_1",
        pageId: "page_1",
        pageOrder: 1,
        sentenceId: "sentence_1",
        sentenceText: "I can see page one.",
        knowledgeLinks: [
          {
            id: "knowledge_variant_1",
            knowledgeItemId: "knowledge_item_1",
            surfaceForm: "page",
            canonical: "page",
            variantKind: "base",
          },
        ],
      },
    ]);

    const practice = await repository.getTodayPractice({
      childId: "prototype-child",
      now: new Date(2026, 4, 9, 10, 0, 0),
      limit: 5,
    });
    const exerciseId = practice.exercises[0]?.id ?? "";

    await expect(
      repository.getChildPracticeOverview({
        childId: "prototype-child",
        now: new Date(2026, 4, 9, 11, 0, 0),
      }),
    ).resolves.toEqual({
      practiceStreakDays: 0,
      attemptsToday: 0,
      attemptsTotal: 0,
    });

    await repository.submitAttempt({
      childId: "prototype-child",
      exerciseId,
      answerText: "first",
      now: new Date(2026, 4, 8, 9, 0, 0),
    });

    await repository.submitAttempt({
      childId: "prototype-child",
      exerciseId,
      answerText: "second",
      now: new Date(2026, 4, 9, 10, 0, 0),
    });

    await expect(
      repository.getChildPracticeOverview({
        childId: "prototype-child",
        now: new Date(2026, 4, 9, 12, 0, 0),
      }),
    ).resolves.toMatchObject({
      practiceStreakDays: 2,
      attemptsToday: 1,
      attemptsTotal: 2,
    });
  });
});
