import { describe, expect, it } from "vitest";
import { ExerciseType } from "./enums";
import { generateFillBlankExercise, gradeFillBlankAnswer } from "./practice";

describe("practice domain", () => {
  it("generates a fill-blank exercise from a confirmed sentence knowledge link", () => {
    const exercise = generateFillBlankExercise({
      bookId: "book_1",
      sentenceId: "sentence_1",
      sentenceText: "I can see page one.",
      knowledgeLinks: [
        {
          knowledgeItemId: "knowledge_item_1",
          knowledgeVariantId: "knowledge_variant_1",
          surfaceForm: "page",
          canonical: "page",
          variantKind: "base",
        },
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
        {
          knowledgeItemId: "knowledge_item_1",
          knowledgeVariantId: "knowledge_variant_1",
          surfaceForm: "page",
          canonical: "page",
          variantKind: "base",
        },
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
    expect(gradeFillBlankAnswer({ expectedAnswer: "Good Book", answerText: " good   book " })).toEqual({
      isCorrect: true,
      score: 1,
      normalizedExpected: "good book",
      normalizedAnswer: "good book",
      errorTags: [],
    });

    expect(gradeFillBlankAnswer({ expectedAnswer: "page", answerText: "book" })).toEqual({
      isCorrect: false,
      score: 0,
      normalizedExpected: "page",
      normalizedAnswer: "book",
      errorTags: ["meaning_mismatch"],
    });
  });
});
