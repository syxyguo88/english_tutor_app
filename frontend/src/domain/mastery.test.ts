import { describe, expect, it } from "vitest";
import { ExerciseType } from "./enums";
import {
  calculateNextMastery,
  createMasteryKey,
  scheduleNextReview,
} from "./mastery";

describe("mastery foundation", () => {
  it("keys mastery by child, item, variant, and exercise type", () => {
    expect(
      createMasteryKey({
        childId: "child_1",
        knowledgeItemId: "item_book",
        knowledgeVariantId: "variant_books",
        exerciseType: ExerciseType.FillBlank,
      }),
    ).toBe("child_1:item_book:variant_books:fill_blank");
  });

  it("raises mastery after a correct answer", () => {
    const next = calculateNextMastery({
      previousScore: 40,
      wasCorrect: true,
      consecutiveCorrect: 1,
    });

    expect(next).toEqual({
      score: 52,
      consecutiveCorrect: 2,
    });
  });

  it("lowers mastery and resets streak after a wrong answer", () => {
    const next = calculateNextMastery({
      previousScore: 70,
      wasCorrect: false,
      consecutiveCorrect: 3,
    });

    expect(next).toEqual({
      score: 52,
      consecutiveCorrect: 0,
    });
  });

  it("uses shorter review intervals for wrong answers", () => {
    const from = new Date("2026-05-05T00:00:00.000Z");
    expect(scheduleNextReview({ from, wasCorrect: false, consecutiveCorrect: 0 }).toISOString()).toBe(
      "2026-05-06T00:00:00.000Z",
    );
    expect(scheduleNextReview({ from, wasCorrect: true, consecutiveCorrect: 3 }).toISOString()).toBe(
      "2026-05-19T00:00:00.000Z",
    );
  });
});
