/**
 * Per-page upload size cap for book ingestion. Enforced before files are converted to
 * data URLs and persisted, so we do not bloat Postgres with very large base64 blobs
 * (Exercise rows already carry these URLs as part of their JSON `prompt`).
 *
 * The whole multipart request is still bound by Next's `serverActions.bodySizeLimit`
 * in `next.config.ts` (currently `25mb`); this constant is the stricter per-file cap.
 */
export const MAX_BOOK_PAGE_IMAGE_BYTES = 5 * 1024 * 1024;

const ONE_MIB = 1024 * 1024;

/** Format bytes as a short MiB string (e.g. `5.0`) for user-facing copy. */
export function formatMebibytes(bytes: number): string {
  return (bytes / ONE_MIB).toFixed(1);
}

export function bookPageImageTooLargeMessage(input: {
  fileName: string;
  sizeBytes: number;
  maxBytes?: number;
}): string {
  const max = input.maxBytes ?? MAX_BOOK_PAGE_IMAGE_BYTES;
  return (
    `单页图片超过限制（${formatMebibytes(max)} MiB）：${input.fileName} ` +
    `(${formatMebibytes(input.sizeBytes)} MiB). ` +
    `Per-page image exceeds limit (${formatMebibytes(max)} MiB).`
  );
}
