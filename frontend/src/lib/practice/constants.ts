export const LOW_MASTERY_SCORE_THRESHOLD = 40;

/** Max attempts surfaced per child in “recent” queries (matches former in-memory ring buffer size). */
export const RECENT_ATTEMPTS_BUFFER_SIZE = 10;

/**
 * Max {@link Exercise} rows loaded when building “today” practice (newest-first scan until `limit`
 * eligible items). Avoids `findMany` without `take`, which was very slow once many exercises exist.
 */
export const TODAY_PRACTICE_EXERCISE_SCAN_CAP = 600;
