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
  pageId?: string;
  pageImageUrl?: string;
  sentenceId: string;
  sentenceText: string;
  knowledgeLinks: PracticeKnowledgeTarget[];
};

export type FillBlankExerciseDraft = {
  bookId: string;
  pageId?: string;
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

export type PictureSentenceExerciseDraft = {
  bookId: string;
  pageId: string;
  sentenceId: string;
  type: ExerciseType.PictureSentence;
  prompt: {
    imageUrl: string;
    instruction: string;
  };
  expectedAnswer: {
    text: string;
  };
  targetItems: PracticeKnowledgeTarget[];
};

export type GrammarCorrectionExerciseDraft = {
  bookId: string;
  pageId?: string;
  sentenceId: string;
  type: ExerciseType.GrammarCorrection;
  prompt: {
    incorrectText: string;
    instruction: string;
  };
  expectedAnswer: {
    text: string;
  };
  targetItems: PracticeKnowledgeTarget[];
};

export type SentenceCreationExerciseDraft = {
  bookId: string;
  pageId?: string;
  sentenceId: string;
  type: ExerciseType.SentenceCreation;
  prompt: {
    targetText: string;
    instruction: string;
  };
  expectedAnswer: {
    requiredText: string;
  };
  targetItems: PracticeKnowledgeTarget[];
};

export type PracticeExerciseDraft =
  | FillBlankExerciseDraft
  | PictureSentenceExerciseDraft
  | GrammarCorrectionExerciseDraft
  | SentenceCreationExerciseDraft;

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
    pageId: input.pageId,
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

export function generateDeterministicPracticeExercises(
  input: FillBlankGenerationInput & { pageId: string; pageImageUrl: string },
): PracticeExerciseDraft[] {
  const target = input.knowledgeLinks[0];
  const exercises: PracticeExerciseDraft[] = [];
  const fillBlank = generateFillBlankExercise(input);

  if (!target || !fillBlank) {
    return exercises;
  }

  exercises.push(fillBlank);
  exercises.push({
    bookId: input.bookId,
    pageId: input.pageId,
    sentenceId: input.sentenceId,
    type: ExerciseType.PictureSentence,
    prompt: {
      imageUrl: input.pageImageUrl,
      instruction: "看图写出这页的一句英文。",
    },
    expectedAnswer: {
      text: input.sentenceText,
    },
    targetItems: [target],
  });

  const incorrectText = createGrammarMistake(input.sentenceText);
  if (incorrectText) {
    exercises.push({
      bookId: input.bookId,
      pageId: input.pageId,
      sentenceId: input.sentenceId,
      type: ExerciseType.GrammarCorrection,
      prompt: {
        incorrectText,
        instruction: "请改正句子里的语法错误。",
      },
      expectedAnswer: {
        text: input.sentenceText,
      },
      targetItems: [target],
    });
  }

  exercises.push({
    bookId: input.bookId,
    pageId: input.pageId,
    sentenceId: input.sentenceId,
    type: ExerciseType.SentenceCreation,
    prompt: {
      targetText: target.surfaceForm,
      instruction: "用这个单词或短语造句。",
    },
    expectedAnswer: {
      requiredText: target.surfaceForm,
    },
    targetItems: [target],
  });

  return exercises;
}

export function gradePracticeAnswer(input: {
  exerciseType: ExerciseType;
  expectedAnswer: { text: string } | { requiredText: string };
  answerText: string;
}): FillBlankGradingResult {
  if ("requiredText" in input.expectedAnswer) {
    const normalizedExpected = normalizeAnswer(input.expectedAnswer.requiredText);
    const normalizedAnswer = normalizeAnswer(input.answerText);
    const isCorrect = containsRequiredTerm(normalizedAnswer, normalizedExpected);

    return {
      isCorrect,
      score: isCorrect ? 1 : 0,
      normalizedExpected,
      normalizedAnswer,
      errorTags: isCorrect ? [] : ["missing_word"],
    };
  }

  const exactGrade = gradeExactAnswer({
    expectedAnswer: input.expectedAnswer.text,
    answerText: input.answerText,
  });

  if (exactGrade.isCorrect || input.exerciseType !== ExerciseType.GrammarCorrection) {
    return exactGrade;
  }

  return {
    ...exactGrade,
    errorTags: ["grammar"],
  };
}

export function gradeFillBlankAnswer(input: {
  expectedAnswer: string;
  answerText: string;
}): FillBlankGradingResult {
  return gradeExactAnswer(input);
}

function gradeExactAnswer(input: {
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

function createGrammarMistake(sentenceText: string): string | null {
  if (sentenceText.includes(" is ")) {
    return sentenceText.replace(" is ", " are ");
  }

  if (sentenceText.includes(" can ")) {
    return sentenceText.replace(" can ", " cans ");
  }

  return null;
}

function containsRequiredTerm(normalizedAnswer: string, normalizedExpected: string): boolean {
  const escapedExpected = normalizedExpected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const boundaryPattern = new RegExp(`(^|[^a-z0-9])${escapedExpected}([^a-z0-9]|$)`);
  return boundaryPattern.test(normalizedAnswer);
}

function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
