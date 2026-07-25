import { unstable_cache } from "next/cache";
import { getBookIngestionRepository } from "@/lib/book-ingestion/repository";
import {
  childTodayProfileLog,
  childTodayProfileNow,
  isChildTodayProfiling,
} from "@/lib/profile/child-today-profile";
import { getPracticeRepository } from "@/lib/practice/repository";

/** Invalidate with `revalidateTag` when confirmed book/sentence data changes (e.g. after `confirmPage`). */
export const CONFIRMED_PRACTICE_SYNC_TAG = "confirmed-practice-sync";

async function runSyncConfirmedPracticeExercises(): Promise<number> {
  const bodyT0 = childTodayProfileNow();
  const tContent = childTodayProfileNow();
  const content = await getBookIngestionRepository().getConfirmedPracticeContent();
  if (isChildTodayProfiling()) {
    childTodayProfileLog("sync_getConfirmedPracticeContent", childTodayProfileNow() - tContent, {
      sentenceCount: content.length,
    });
  }
  const tEnsure = childTodayProfileNow();
  await getPracticeRepository().ensurePracticeExercisesFromConfirmedContent(content);
  if (isChildTodayProfiling()) {
    childTodayProfileLog("sync_ensurePracticeExercisesFromConfirmedContent", childTodayProfileNow() - tEnsure);
    childTodayProfileLog("sync_runSyncConfirmedPracticeExercises_total", childTodayProfileNow() - bodyT0);
  }
  return content.length;
}

/**
 * Loads confirmed sentences and upserts derived {@link Exercise} rows.
 * Cached so repeat visits to `/child/today` stay fast; data is static until a page is confirmed.
 */
const syncConfirmedPracticeExercisesCached = unstable_cache(runSyncConfirmedPracticeExercises, [
  "sync-confirmed-practice-exercises-v2",
], {
  tags: [CONFIRMED_PRACTICE_SYNC_TAG],
  revalidate: 3600,
});

export async function syncConfirmedPracticeExercises(): Promise<void> {
  await syncConfirmedPracticeExercisesCached();
}
