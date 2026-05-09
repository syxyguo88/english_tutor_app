import { describe, expect, it, vi } from "vitest";
import { BookStatus, KnowledgeItemType } from "@/domain/enums";
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

  it("exposes only confirmed sentence content for practice generation", async () => {
    const repository = createInMemoryBookIngestionRepository();
    const draft = await repository.createBookDraft({
      familyId: "family_1",
      title: "Practice Source Book",
      pages: [
        {
          pageOrder: 1,
          originalImageUrl: "data:image/png;base64,page-one",
          ocrDraft: {
            sourceFileName: "page-one.png",
            sentences: [{ text: "I can see page one." }],
            knowledgeCandidates: [
              { type: KnowledgeItemType.Word, surfaceForm: "page", variantKind: "base" },
            ],
          },
        },
      ],
    });

    await expect(repository.getConfirmedPracticeContent()).resolves.toEqual([]);

    const book = await repository.getBookForReview(draft.bookId);
    const page = book?.pages[0];
    await repository.confirmPage({
      bookId: draft.bookId,
      pageId: page?.id ?? "",
      parentConfirmed: true,
      sentenceDrafts: [{ text: "I can see page one." }],
      knowledgeCandidates: [{ type: KnowledgeItemType.Word, surfaceForm: "page" }],
    });

    await expect(repository.getConfirmedPracticeContent()).resolves.toMatchObject([
      {
        bookId: draft.bookId,
        pageId: page?.id,
        pageOrder: 1,
        pageImageUrl: "data:image/png;base64,page-one",
        sentenceText: "I can see page one.",
        knowledgeLinks: [
          {
            knowledgeItemId: expect.stringMatching(/^knowledge_item_/),
            id: expect.stringMatching(/^knowledge_variant_/),
            surfaceForm: "page",
            canonical: "page",
            variantKind: "base",
          },
        ],
      },
    ]);
  });

  it("lists books for the family with pageCount and title after create", async () => {
    const repository = createInMemoryBookIngestionRepository();
    const draft = await repository.createBookDraft({
      familyId: "family_list",
      title: "Listed Book",
      pages: [
        {
          pageOrder: 1,
          originalImageUrl: "data:image/png;base64,p1",
          ocrDraft: {
            sourceFileName: "p.png",
            sentences: [{ text: "Hello." }],
            knowledgeCandidates: [],
          },
        },
        {
          pageOrder: 2,
          originalImageUrl: "data:image/png;base64,p2",
          ocrDraft: {
            sourceFileName: "p2.png",
            sentences: [{ text: "World." }],
            knowledgeCandidates: [],
          },
        },
      ],
    });

    await expect(repository.listBooksForFamily("family_list")).resolves.toEqual([
      expect.objectContaining({
        id: draft.bookId,
        title: "Listed Book",
        status: BookStatus.Draft,
        pageCount: 2,
        readingDate: null,
        updatedAt: expect.any(Date),
      }),
    ]);

    await expect(repository.listBooksForFamily("other_family")).resolves.toEqual([]);
  });

  it("orders family books by updatedAt descending, including after confirmPage", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-09T10:00:00.000Z"));

    const repository = createInMemoryBookIngestionRepository();
    const first = await repository.createBookDraft({
      familyId: "family_order",
      title: "First Book",
      pages: [
        {
          pageOrder: 1,
          originalImageUrl: "data:image/png;base64,a",
          ocrDraft: {
            sourceFileName: "a.png",
            sentences: [{ text: "One." }],
            knowledgeCandidates: [{ type: KnowledgeItemType.Word, surfaceForm: "one", variantKind: "base" }],
          },
        },
      ],
    });

    vi.setSystemTime(new Date("2026-05-09T10:00:01.000Z"));
    await repository.createBookDraft({
      familyId: "family_order",
      title: "Second Book",
      pages: [
        {
          pageOrder: 1,
          originalImageUrl: "data:image/png;base64,b",
          ocrDraft: {
            sourceFileName: "b.png",
            sentences: [{ text: "Two." }],
            knowledgeCandidates: [{ type: KnowledgeItemType.Word, surfaceForm: "two", variantKind: "base" }],
          },
        },
      ],
    });

    let titles = (await repository.listBooksForFamily("family_order")).map((b) => b.title);
    expect(titles).toEqual(["Second Book", "First Book"]);

    const firstBook = await repository.getBookForReview(first.bookId);
    const firstPage = firstBook?.pages[0];
    expect(firstPage).toBeDefined();

    vi.setSystemTime(new Date("2026-05-09T10:00:02.000Z"));
    await repository.confirmPage({
      bookId: first.bookId,
      pageId: firstPage?.id ?? "",
      parentConfirmed: true,
      sentenceDrafts: [{ text: "One." }],
      knowledgeCandidates: [{ type: KnowledgeItemType.Word, surfaceForm: "one" }],
    });

    titles = (await repository.listBooksForFamily("family_order")).map((b) => b.title);
    expect(titles).toEqual(["First Book", "Second Book"]);

    vi.useRealTimers();
  });
});
