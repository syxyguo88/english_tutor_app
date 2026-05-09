const LOG_PREFIX = "[profile:child-today]";

export function isChildTodayProfiling(): boolean {
  return process.env.PROFILE_CHILD_TODAY === "1";
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

/** One JSON object per line after the standard prefix (for structured profiling). */
export function childTodayProfileLogJson(record: Record<string, unknown>): void {
  if (!isChildTodayProfiling()) {
    return;
  }
  console.info(`${LOG_PREFIX} ${JSON.stringify(record)}`);
}
