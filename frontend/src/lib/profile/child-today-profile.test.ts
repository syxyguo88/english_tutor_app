import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  childTodayProfileLog,
  childTodayProfileLogJson,
  isChildTodayProfileDetail,
  isChildTodayProfiling,
} from "./child-today-profile";

const originalProfile = process.env.PROFILE_CHILD_TODAY;
const originalJson = process.env.PROFILE_CHILD_TODAY_JSON;

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

describe("child-today-profile env gates", () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    delete process.env.PROFILE_CHILD_TODAY;
    delete process.env.PROFILE_CHILD_TODAY_JSON;
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    infoSpy.mockRestore();
    restoreEnv("PROFILE_CHILD_TODAY", originalProfile);
    restoreEnv("PROFILE_CHILD_TODAY_JSON", originalJson);
  });

  it("isChildTodayProfiling reflects only the base flag", () => {
    expect(isChildTodayProfiling()).toBe(false);

    process.env.PROFILE_CHILD_TODAY = "1";
    expect(isChildTodayProfiling()).toBe(true);

    process.env.PROFILE_CHILD_TODAY = "0";
    expect(isChildTodayProfiling()).toBe(false);
  });

  it("isChildTodayProfileDetail requires both flags", () => {
    expect(isChildTodayProfileDetail()).toBe(false);

    process.env.PROFILE_CHILD_TODAY_JSON = "1";
    expect(isChildTodayProfileDetail()).toBe(false);

    process.env.PROFILE_CHILD_TODAY = "1";
    expect(isChildTodayProfileDetail()).toBe(true);

    process.env.PROFILE_CHILD_TODAY_JSON = "0";
    expect(isChildTodayProfileDetail()).toBe(false);
  });

  it("childTodayProfileLog emits with PROFILE_CHILD_TODAY=1 alone", () => {
    process.env.PROFILE_CHILD_TODAY = "1";

    childTodayProfileLog("phase_a", 12.345);

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy.mock.calls[0]?.[0]).toContain("phase=phase_a");
    expect(infoSpy.mock.calls[0]?.[0]).toContain("durationMs=12.35");
  });

  it("childTodayProfileLogJson stays silent with only the base flag", () => {
    process.env.PROFILE_CHILD_TODAY = "1";

    childTodayProfileLogJson({ phase: "noisy", durationMs: 1 });

    expect(infoSpy).not.toHaveBeenCalled();
  });

  it("childTodayProfileLogJson stays silent with only the JSON flag", () => {
    process.env.PROFILE_CHILD_TODAY_JSON = "1";

    childTodayProfileLogJson({ phase: "noisy", durationMs: 1 });

    expect(infoSpy).not.toHaveBeenCalled();
  });

  it("childTodayProfileLogJson emits when both flags are set", () => {
    process.env.PROFILE_CHILD_TODAY = "1";
    process.env.PROFILE_CHILD_TODAY_JSON = "1";

    childTodayProfileLogJson({ phase: "detail", durationMs: 2 });

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy.mock.calls[0]?.[0]).toContain('"phase":"detail"');
  });
});
