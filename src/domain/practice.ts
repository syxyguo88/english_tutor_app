import { ExerciseType } from "./enums";

export type PracticeKnowledgeTarget = {
  knowledgeItemId: string;
  knowledgeVariantId: string;
  surfaceForm: string;
  canonical: string;
  variantKind: string;
};

export type FillBlankGenerationInput = {
  bookId: string;
  sentenceId: string;
  sentenceText: string;
  knowledgeLinks: PracticeKnowledgeTarget[];
};

export type FillBlankExerciseDraft = {
  bookId: string;
  sentenceId: string;
  type: ExerciseType.FillBlank;
  prompt: {
    textWithBlank: string;
  };
  expectedAnswer: {
    text: string;
  };
  targetItems: PracticeKnowledgeTarget[];
};

export type FillBlankGradingResult = {
  isCorrect: boolean;
  score: 0 | 1;
  normalizedExpected: string;
  normalizedAnswer: string;
  errorTags: string[];
};

export function generateFillBlankExercise(
  input: FillBlankGenerationInput,
): FillBlankExerciseDraft | null {
  const target = input.knowledgeLinks[0];

  if (!target) {
    return null;
  }

  const matchIndex = input.sentenceText.toLowerCase().indexOf(target.surfaceForm.toLowerCase());

  if (matchIndex < 0) {
    return null;
  }

  const textWithBlank = [
    input.sentenceText.slice(0, matchIndex),
    "____",
    input.sentenceText.slice(matchIndex + target.surfaceForm.length),
  ].join("");

  return {
    bookId: input.bookId,
    sentenceId: input.sentenceId,
    type: ExerciseType.FillBlank,
    prompt: {
      textWithBlank,
    },
    expectedAnswer: {
      text: target.surfaceForm,
    },
    targetItems: [target],
  };
}

export function gradeFillBlankAnswer(input: {
  expectedAnswer: string;
  answerText: string;
}): FillBlankGradingResult {
  const normalizedExpected = normalizeAnswer(input.expectedAnswer);
  const normalizedAnswer = normalizeAnswer(input.answerText);
  const isCorrect = normalizedAnswer === normalizedExpected;

  return {
    isCorrect,
    score: isCorrect ? 1 : 0,
    normalizedExpected,
    normalizedAnswer,
    errorTags: isCorrect ? [] : ["meaning_mismatch"],
  };
}

function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
