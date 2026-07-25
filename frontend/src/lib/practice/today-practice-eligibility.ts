import { localDateKey } from "./practice-calendar";

export function isEligibleForTodayPractice(input: {
  attempted: boolean;
  nextReviewAt: Date | null;
  lastAttemptedAt: Date | null;
  now: Date;
}): boolean {
  return (
    !input.attempted ||
    !input.nextReviewAt ||
    input.nextReviewAt <= input.now ||
    (input.lastAttemptedAt !== null &&
      localDateKey(input.lastAttemptedAt) === localDateKey(input.now))
  );
}
