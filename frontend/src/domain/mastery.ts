import { ExerciseType } from "./enums";

export type MasteryKeyInput = {
  childId: string;
  knowledgeItemId: string;
  knowledgeVariantId: string;
  exerciseType: ExerciseType;
};

export type MasteryInput = {
  previousScore: number;
  wasCorrect: boolean;
  consecutiveCorrect: number;
};

export type MasteryResult = {
  score: number;
  consecutiveCorrect: number;
};

export type ReviewScheduleInput = {
  from: Date;
  wasCorrect: boolean;
  consecutiveCorrect: number;
};

export function createMasteryKey(input: MasteryKeyInput): string {
  return [
    input.childId,
    input.knowledgeItemId,
    input.knowledgeVariantId,
    input.exerciseType,
  ].join(":");
}

export function calculateNextMastery(input: MasteryInput): MasteryResult {
  const boundedPrevious = clamp(input.previousScore, 0, 100);

  if (input.wasCorrect) {
    return {
      score: clamp(boundedPrevious + 8 + input.consecutiveCorrect * 4, 0, 100),
      consecutiveCorrect: input.consecutiveCorrect + 1,
    };
  }

  return {
    score: clamp(boundedPrevious - 18, 0, 100),
    consecutiveCorrect: 0,
  };
}

export function scheduleNextReview(input: ReviewScheduleInput): Date {
  const days = input.wasCorrect ? intervalForCorrectStreak(input.consecutiveCorrect) : 1;
  const next = new Date(input.from);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function intervalForCorrectStreak(consecutiveCorrect: number): number {
  if (consecutiveCorrect >= 5) return 30;
  if (consecutiveCorrect >= 3) return 14;
  if (consecutiveCorrect >= 2) return 7;
  return 3;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
