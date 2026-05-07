import { describe, expect, it } from "vitest";
import { KnowledgeItemType } from "@/domain/enums";
import { createInMemoryBookIngestionRepository } from "./repository";

describe("book ingestion repository", () => {
  it("creates a draft book with page OCR drafts and loads it for review", async () => {
    const repository = createInMemoryBookIngestionRepository();

    const draft = await repository.createBookDraft({
      familyId: "family_1",
      title: "My First Book",
      readingDate: "2026-05-07",
      tags: ["animals", "school"],
      pages: [
        {
          pageOrder: 1,
          originalImageUrl: "data:image/png;base64,page-one",
          ocrDraft: {
            sourceFileName: "page-one.png",
            sentences: [{ text: "I see a dog.", confidence: 0.9 }],
            knowledgeCandidates: [
              { type: KnowledgeItemType.Word, surfaceForm: "dog", variantKind: "base" },
            ],
          },
        },
      ],
    });

    await expect(repository.getBookForReview(draft.bookId)).resolves.toMatchObject({
      id: draft.bookId,
      title: "My First Book",
      tags: ["animals", "school"],
      pages: [
        {
          pageOrder: 1,
          status: "draft",
          ocrDraft: {
            sentences: [{ text: "I see a dog.", confidence: 0.9 }],
          },
        },
      ],
    });
  });

  it("confirms page drafts into official sentences and knowledge links only after parent confirmation", async () => {
    const repository = createInMemoryBookIngestionRepository();
    const draft = await repository.createBookDraft({
      familyId: "family_1",
      title: "School Book",
      pages: [
        {
          pageOrder: 1,
          originalImageUrl: "data:image/png;base64,page-one",
          ocrDraft: {
            sourceFileName: "page-one.png",
            sentences: [{ text: " I like school. " }],
            knowledgeCandidates: [
              { type: KnowledgeItemType.Word, surfaceForm: "school", variantKind: "base" },
            ],
          },
        },
      ],
    });
    const book = await repository.getBookForReview(draft.bookId);
    const page = book?.pages[0];

    expect(page).toBeDefined();
    await expect(
      repository.confirmPage({
        bookId: draft.bookId,
        pageId: page?.id ?? "",
        parentConfirmed: false,
        sentenceDrafts: [{ text: "I like school." }],
        knowledgeCandidates: [{ type: KnowledgeItemType.Word, surfaceForm: "school" }],
      }),
    ).rejects.toThrow("Parent confirmation is required");

    await repository.confirmPage({
      bookId: draft.bookId,
      pageId: page?.id ?? "",
      parentConfirmed: true,
      sentenceDrafts: [{ text: " I like school. " }],
      knowledgeCandidates: [{ type: KnowledgeItemType.Word, surfaceForm: "school" }],
    });

    await expect(repository.getBookForReview(draft.bookId)).resolves.toMatchObject({
      status: "confirmed",
      pages: [
        {
          status: "confirmed",
          sentences: [
            {
              text: "I like school.",
              knowledgeLinks: [
                {
                  canonical: "school",
                  surfaceForm: "school",
                  variantKind: "base",
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it("links confirmed knowledge candidates only to sentences that contain them", async () => {
    const repository = createInMemoryBookIngestionRepository();
    const draft = await repository.createBookDraft({
      familyId: "family_1",
      title: "Two Sentence Book",
      pages: [
        {
          pageOrder: 1,
          originalImageUrl: "data:image/png;base64,page-one",
          ocrDraft: {
            sourceFileName: "page-one.png",
            sentences: [
              { text: "I can see page one." },
              { text: "This is a good book." },
            ],
            knowledgeCandidates: [
              { type: KnowledgeItemType.Word, surfaceForm: "page", variantKind: "base" },
              { type: KnowledgeItemType.Phrase, surfaceForm: "good book", variantKind: "base" },
            ],
          },
        },
      ],
    });
    const book = await repository.getBookForReview(draft.bookId);
    const page = book?.pages[0];

    await repository.confirmPage({
      bookId: draft.bookId,
      pageId: page?.id ?? "",
      parentConfirmed: true,
      sentenceDrafts: [
        { text: "I can see page one." },
        { text: "This is a good book." },
      ],
      knowledgeCandidates: [
        { type: KnowledgeItemType.Word, surfaceForm: "page" },
        { type: KnowledgeItemType.Phrase, surfaceForm: "good book" },
      ],
    });

    await expect(repository.getBookForReview(draft.bookId)).resolves.toMatchObject({
      pages: [
        {
          sentences: [
            { text: "I can see page one.", knowledgeLinks: [{ surfaceForm: "page" }] },
            { text: "This is a good book.", knowledgeLinks: [{ surfaceForm: "good book" }] },
          ],
        },
      ],
    });
  });
});
