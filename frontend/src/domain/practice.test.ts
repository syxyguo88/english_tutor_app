import { describe, expect, it } from "vitest";
import { ExerciseType } from "./enums";
import {
  generateDeterministicPracticeExercises,
  generateFillBlankExercise,
  gradePracticeAnswer,
  type PracticeKnowledgeTarget,
} from "./practice";

const pageTarget: PracticeKnowledgeTarget = {
  knowledgeItemId: "knowledge_item_1",
  knowledgeVariantId: "knowledge_variant_1",
  surfaceForm: "page",
  canonical: "page",
  variantKind: "base",
};

describe("practice domain", () => {
  it("generates a fill-blank exercise from a confirmed sentence knowledge link", () => {
    const exercise = generateFillBlankExercise({
      bookId: "book_1",
      sentenceId: "sentence_1",
      sentenceText: "I can see page one.",
      knowledgeLinks: [
        pageTarget,
      ],
    });

    expect(exercise).toEqual({
      bookId: "book_1",
      sentenceId: "sentence_1",
      type: ExerciseType.FillBlank,
      prompt: {
        textWithBlank: "I can see ____ one.",
      },
      expectedAnswer: {
        text: "page",
      },
      targetItems: [
        pageTarget,
      ],
    });
  });

  it("skips fill-blank generation when the sentence does not contain the target", () => {
    expect(
      generateFillBlankExercise({
        bookId: "book_1",
        sentenceId: "sentence_1",
        sentenceText: "I can see page one.",
        knowledgeLinks: [
          {
            knowledgeItemId: "knowledge_item_1",
            knowledgeVariantId: "knowledge_variant_1",
            surfaceForm: "school",
            canonical: "school",
            variantKind: "base",
          },
        ],
      }),
    ).toBeNull();
  });

  it("grades fill-blank answers with case and whitespace normalization", () => {
    expect(
      gradePracticeAnswer({
        exerciseType: ExerciseType.FillBlank,
        expectedAnswer: { text: "Good Book" },
        answerText: " good   book ",
      }),
    ).toEqual({
      isCorrect: true,
      score: 1,
      normalizedExpected: "good book",
      normalizedAnswer: "good book",
      errorTags: [],
    });

    expect(
      gradePracticeAnswer({
        exerciseType: ExerciseType.FillBlank,
        expectedAnswer: { text: "page" },
        answerText: "book",
      }),
    ).toEqual({
      isCorrect: false,
      score: 0,
      normalizedExpected: "page",
      normalizedAnswer: "book",
      errorTags: ["meaning_mismatch"],
    });
  });

  it("generates deterministic practice exercises for all prototype exercise types", () => {
    const exercises = generateDeterministicPracticeExercises({
      bookId: "book_1",
      pageId: "page_1",
      pageImageUrl: "data:image/png;base64,page-one",
      sentenceId: "sentence_1",
      sentenceText: "This is a good book.",
      knowledgeLinks: [
        {
          knowledgeItemId: "knowledge_item_2",
          knowledgeVariantId: "knowledge_variant_2",
          surfaceForm: "good book",
          canonical: "good book",
          variantKind: "base",
        },
      ],
    });

    expect(exercises.map((exercise) => exercise.type)).toEqual([
      ExerciseType.FillBlank,
      ExerciseType.PictureSentence,
      ExerciseType.GrammarCorrection,
      ExerciseType.SentenceCreation,
    ]);
    expect(exercises).toMatchObject([
      {
        prompt: { textWithBlank: "This is a ____." },
        expectedAnswer: { text: "good book" },
      },
      {
        prompt: {
          imageUrl: "data:image/png;base64,page-one",
          instruction: "看图写出这页的一句英文。",
        },
        expectedAnswer: { text: "This is a good book." },
      },
      {
        prompt: {
          incorrectText: "This are a good book.",
          instruction: "请改正句子里的语法错误。",
        },
        expectedAnswer: { text: "This is a good book." },
      },
      {
        prompt: {
          targetText: "good book",
          instruction: "用这个单词或短语造句。",
        },
        expectedAnswer: { requiredText: "good book" },
      },
    ]);
  });

  it("grades deterministic picture, grammar, and sentence creation answers", () => {
    expect(
      gradePracticeAnswer({
        exerciseType: ExerciseType.PictureSentence,
        expectedAnswer: { text: "This is a good book." },
        answerText: " this is a good book. ",
      }),
    ).toMatchObject({ isCorrect: true, score: 1 });
    expect(
      gradePracticeAnswer({
        exerciseType: ExerciseType.GrammarCorrection,
        expectedAnswer: { text: "This is a good book." },
        answerText: "This are a good book.",
      }),
    ).toMatchObject({ isCorrect: false, score: 0, errorTags: ["grammar"] });
    expect(
      gradePracticeAnswer({
        exerciseType: ExerciseType.SentenceCreation,
        expectedAnswer: { requiredText: "good book" },
        answerText: "I read a good book.",
      }),
    ).toMatchObject({ isCorrect: true, score: 1 });
  });

  it("does not grade sentence creation by accidental substring matches", () => {
    expect(
      gradePracticeAnswer({
        exerciseType: ExerciseType.SentenceCreation,
        expectedAnswer: { requiredText: "page" },
        answerText: "I opened the homepage.",
      }),
    ).toMatchObject({
      isCorrect: false,
      score: 0,
      errorTags: ["missing_word"],
    });
  });
});
