/**
 * Local-calendar helpers for practice streaks (uses the runtime's default timezone).
 */

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** YYYY-MM-DD in the environment local calendar. */
export function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

export function endOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

/** Previous calendar day in local time (same clock as `d`). */
export function previousLocalDay(d: Date): Date {
  const t = startOfLocalDay(d);
  t.setDate(t.getDate() - 1);
  return t;
}

/**
 * Consecutive local calendar days with ≥1 attempt.
 * If there are no attempts on `now`'s calendar day, counting starts from yesterday
 * (so the child still sees their streak before practicing today).
 */
export function computeDailyPracticeStreak(now: Date, practiceDateKeys: ReadonlySet<string>): number {
  const todayKey = localDateKey(now);
  const anchor = practiceDateKeys.has(todayKey) ? todayKey : localDateKey(previousLocalDay(now));

  if (!practiceDateKeys.has(anchor)) {
    return 0;
  }

  let streak = 0;
  let cursor = parseLocalDateKey(anchor);

  while (practiceDateKeys.has(localDateKey(cursor))) {
    streak += 1;
    cursor = previousLocalDay(cursor);
  }

  return streak;
}

function parseLocalDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map((x) => Number.parseInt(x, 10));
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}
