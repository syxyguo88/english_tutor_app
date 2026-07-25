import { describe, expect, it } from "vitest";
import {
  computeDailyPracticeStreak,
  localDateKey,
  previousLocalDay,
} from "./practice-calendar";

describe("computeDailyPracticeStreak", () => {
  it("returns 0 when no practice days", () => {
    const now = new Date(2026, 4, 9, 10, 0, 0);
    expect(computeDailyPracticeStreak(now, new Set())).toBe(0);
  });

  it("counts single day when only today has practice", () => {
    const now = new Date(2026, 4, 9, 10, 0, 0);
    const today = localDateKey(now);
    expect(computeDailyPracticeStreak(now, new Set([today]))).toBe(1);
  });

  it("counts streak across consecutive days ending today", () => {
    const now = new Date(2026, 4, 9, 10, 0, 0);
    const keys = new Set(["2026-05-07", "2026-05-08", "2026-05-09"]);
    expect(computeDailyPracticeStreak(now, keys)).toBe(3);
  });

  it("starts from yesterday when today has no practice yet", () => {
    const now = new Date(2026, 4, 9, 10, 0, 0);
    const keys = new Set(["2026-05-07", "2026-05-08"]);
    expect(computeDailyPracticeStreak(now, keys)).toBe(2);
  });

  it("breaks streak on gap", () => {
    const now = new Date(2026, 4, 9, 10, 0, 0);
    const keys = new Set(["2026-05-05", "2026-05-09"]);
    expect(computeDailyPracticeStreak(now, keys)).toBe(1);
  });

  it("uses previousLocalDay for anchor when today empty", () => {
    const now = new Date(2026, 4, 9, 10, 0, 0);
    const y = previousLocalDay(now);
    const yesterdayKey = localDateKey(y);
    expect(computeDailyPracticeStreak(now, new Set([yesterdayKey]))).toBe(1);
  });
});
