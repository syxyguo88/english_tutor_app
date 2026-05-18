import type { TodayPracticeExercise } from "@/lib/practice/repository";

/** Serializable exercise props for client components (ISO date strings in mastery). */
export type ClientPracticeExercise = Omit<TodayPracticeExercise, "mastery"> & {
  mastery: Omit<TodayPracticeExercise["mastery"], "lastAttemptedAt" | "lastErrorAt" | "nextReviewAt"> & {
    lastAttemptedAt: string | null;
    lastErrorAt: string | null;
    nextReviewAt: string | null;
  };
};

export function toClientExercise(exercise: TodayPracticeExercise): ClientPracticeExercise {
  return {
    ...exercise,
    mastery: {
      ...exercise.mastery,
      lastAttemptedAt: exercise.mastery.lastAttemptedAt?.toISOString() ?? null,
      lastErrorAt: exercise.mastery.lastErrorAt?.toISOString() ?? null,
      nextReviewAt: exercise.mastery.nextReviewAt?.toISOString() ?? null,
    },
  };
}
