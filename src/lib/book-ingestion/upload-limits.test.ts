import { describe, expect, it } from "vitest";
import {
  MAX_BOOK_PAGE_IMAGE_BYTES,
  bookPageImageTooLargeMessage,
  formatMebibytes,
} from "./upload-limits";

describe("upload-limits", () => {
  it("MAX_BOOK_PAGE_IMAGE_BYTES is 5 MiB", () => {
    expect(MAX_BOOK_PAGE_IMAGE_BYTES).toBe(5 * 1024 * 1024);
  });

  it("formatMebibytes renders one decimal", () => {
    expect(formatMebibytes(5 * 1024 * 1024)).toBe("5.0");
    expect(formatMebibytes(6 * 1024 * 1024 + 512 * 1024)).toBe("6.5");
  });

  it("bookPageImageTooLargeMessage includes filename, max, and Chinese + English copy", () => {
    const message = bookPageImageTooLargeMessage({
      fileName: "page-3.png",
      sizeBytes: 7 * 1024 * 1024,
    });

    expect(message).toContain("page-3.png");
    expect(message).toContain("5.0 MiB");
    expect(message).toContain("7.0 MiB");
    expect(message).toContain("单页图片超过限制");
    expect(message).toContain("Per-page image exceeds limit");
  });
});
