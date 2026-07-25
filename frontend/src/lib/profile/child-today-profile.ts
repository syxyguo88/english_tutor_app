const LOG_PREFIX = "[profile:child-today]";

export function isChildTodayProfiling(): boolean {
  return process.env.PROFILE_CHILD_TODAY === "1";
}

/**
 * Detail-level profiling, used to gate verbose structured JSON output. True only when
 * `PROFILE_CHILD_TODAY=1` **and** `PROFILE_CHILD_TODAY_JSON=1` are both set, so detail
 * never runs without base profiling and the default `PROFILE_CHILD_TODAY=1` stays quiet.
 */
export function isChildTodayProfileDetail(): boolean {
  return (
    isChildTodayProfiling() && process.env.PROFILE_CHILD_TODAY_JSON === "1"
  );
}

/** Logs only when `PROFILE_CHILD_TODAY=1`. */
export function childTodayProfileLog(
  phase: string,
  durationMs: number,
  extras?: Record<string, unknown>,
): void {
  if (!isChildTodayProfiling()) {
    return;
  }
  const extra =
    extras && Object.keys(extras).length > 0 ? ` ${JSON.stringify(extras)}` : "";
  console.info(
    `${LOG_PREFIX} phase=${phase} durationMs=${durationMs.toFixed(2)}${extra}`,
  );
}

export function childTodayProfileNow(): number {
  return performance.now();
}

/**
 * One JSON object per line after the standard prefix. Gated by
 * {@link isChildTodayProfileDetail} so callers do not need to duplicate the env check
 * — a plain `PROFILE_CHILD_TODAY=1` run stays free of structured JSON noise.
 */
export function childTodayProfileLogJson(record: Record<string, unknown>): void {
  if (!isChildTodayProfileDetail()) {
    return;
  }
  console.info(`${LOG_PREFIX} ${JSON.stringify(record)}`);
}
