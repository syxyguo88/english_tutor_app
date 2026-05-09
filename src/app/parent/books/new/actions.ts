"use server";

import { redirect } from "next/navigation";
import { extractMockBookPages, type MockUploadedPage } from "@/lib/book-ingestion/mock-extractor";
import { getBookIngestionRepository } from "@/lib/book-ingestion/repository";
import {
  MAX_BOOK_PAGE_IMAGE_BYTES,
  bookPageImageTooLargeMessage,
} from "@/lib/book-ingestion/upload-limits";
import { ensurePrototypeSession } from "@/lib/prototype-session";

export async function createBookDraftAction(formData: FormData): Promise<void> {
  const title = String(formData.get("title") ?? "").trim();
  const readingDate = String(formData.get("readingDate") ?? "").trim();
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const pageFiles = formData
    .getAll("pages")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (!title) {
    throw new Error("Book title is required");
  }

  if (pageFiles.length === 0) {
    throw new Error("At least one page image is required");
  }

  for (const file of pageFiles) {
    if (file.size > MAX_BOOK_PAGE_IMAGE_BYTES) {
      throw new Error(
        bookPageImageTooLargeMessage({
          fileName: file.name || "page",
          sizeBytes: file.size,
        }),
      );
    }
  }

  const session = await ensurePrototypeSession();
  const uploadedPages = await Promise.all(pageFiles.map(fileToMockUploadedPage));
  const extractedPages = await extractMockBookPages(uploadedPages);
  const draft = await getBookIngestionRepository().createBookDraft({
    familyId: session.familyId,
    title,
    readingDate: readingDate || undefined,
    tags,
    pages: extractedPages,
  });

  redirect(`/parent/books/${draft.bookId}/review`);
}

async function fileToMockUploadedPage(file: File): Promise<MockUploadedPage> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return {
    fileName: file.name || "page.png",
    dataUrl: `data:${file.type || "application/octet-stream"};base64,${buffer.toString("base64")}`,
  };
}
