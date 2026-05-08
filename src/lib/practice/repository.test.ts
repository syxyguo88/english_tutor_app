import { describe, expect, it } from "vitest";
import { ExerciseType } from "@/domain/enums";
import { LOW_MASTERY_SCORE_THRESHOLD, createInMemoryPracticeRepository } from "./repository";

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
});
