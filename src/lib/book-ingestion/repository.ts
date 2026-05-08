import {
  buildConfirmedPageContent,
  type KnowledgeCandidateInput,
  type NormalizedKnowledgeCandidate,
  type SentenceDraftInput,
} from "@/domain/book-ingestion";
import { BookPageStatus, BookStatus, type KnowledgeItemType } from "@/domain/enums";
import { prisma } from "@/lib/db";
import type { MockExtractedPageDraft, MockPageOcrDraft } from "./mock-extractor";
import { createPrismaBookIngestionRepository } from "./prisma-book-repository";

export type CreateBookDraftInput = {
  familyId: string;
  title: string;
  readingDate?: string;
  tags?: string[];
  pages: MockExtractedPageDraft[];
};

export type CreateBookDraftResult = {
  bookId: string;
};

export type BookReviewPage = {
  id: string;
  pageOrder: number;
  status: BookPageStatus;
  originalImageUrl: string;
  textRemovedImageStatus: "not_started" | "processing" | "accepted" | "failed" | "excluded";
  ocrDraft: MockPageOcrDraft;
  confirmedAt: Date | null;
  sentences: Array<{
    id: string;
    text: string;
    knowledgeLinks: ConfirmedKnowledgeLink[];
  }>;
};

export type ConfirmedKnowledgeLink = NormalizedKnowledgeCandidate & {
  id: string;
  knowledgeItemId: string;
};

export type ConfirmedPracticeContent = {
  bookId: string;
  pageId: string;
  pageOrder: number;
  pageImageUrl: string;
  sentenceId: string;
  sentenceText: string;
  knowledgeLinks: ConfirmedKnowledgeLink[];
};

export type BookForReview = {
  id: string;
  familyId: string;
  title: string;
  status: BookStatus;
  readingDate: string | null;
  tags: string[];
  confirmedAt: Date | null;
  pages: BookReviewPage[];
};

export type ConfirmPageInput = {
  bookId: string;
  pageId: string;
  parentConfirmed: boolean;
  sentenceDrafts: SentenceDraftInput[];
  knowledgeCandidates: KnowledgeCandidateInput[];
};

export type ParentDashboardMetrics = {
  draftBooks: number;
  pagesAwaitingReview: number;
};

export type BookIngestionRepository = {
  createBookDraft(input: CreateBookDraftInput): Promise<CreateBookDraftResult>;
  getBookForReview(bookId: string): Promise<BookForReview | null>;
  confirmPage(input: ConfirmPageInput): Promise<void>;
  getConfirmedPracticeContent(): Promise<ConfirmedPracticeContent[]>;
  getParentDashboardMetrics(): Promise<ParentDashboardMetrics>;
};

type StoredKnowledgeItem = {
  id: string;
  type: KnowledgeItemType;
  canonical: string;
};

type StoredKnowledgeVariant = NormalizedKnowledgeCandidate & {
  id: string;
  knowledgeItemId: string;
};

export function createInMemoryBookIngestionRepository(): BookIngestionRepository {
  const books = new Map<string, BookForReview>();
  const knowledgeItems = new Map<string, StoredKnowledgeItem>();
  const knowledgeVariants = new Map<string, StoredKnowledgeVariant>();
  let nextId = 1;

  function createId(prefix: string): string {
    const id = `${prefix}_${nextId}`;
    nextId += 1;
    return id;
  }

  function upsertKnowledgeVariant(candidate: NormalizedKnowledgeCandidate): StoredKnowledgeVariant {
    const itemKey = `${candidate.type}:${candidate.canonical}`;
    let item = knowledgeItems.get(itemKey);

    if (!item) {
      item = {
        id: createId("knowledge_item"),
        type: candidate.type,
        canonical: candidate.canonical,
      };
      knowledgeItems.set(itemKey, item);
    }

    const variantKey = `${item.id}:${candidate.surfaceForm}:${candidate.variantKind}`;
    let variant = knowledgeVariants.get(variantKey);

    if (!variant) {
      variant = {
        ...candidate,
        id: createId("knowledge_variant"),
        knowledgeItemId: item.id,
      };
      knowledgeVariants.set(variantKey, variant);
    }

    return variant;
  }

  return {
    async createBookDraft(input) {
      const bookId = createId("book");
      const book: BookForReview = {
        id: bookId,
        familyId: input.familyId,
        title: input.title,
        status: BookStatus.Draft,
        readingDate: input.readingDate ?? null,
        tags: input.tags ?? [],
        confirmedAt: null,
        pages: input.pages.map((page) => ({
          id: createId("page"),
          pageOrder: page.pageOrder,
          status: BookPageStatus.Draft,
          originalImageUrl: page.originalImageUrl,
          textRemovedImageStatus: "not_started",
          ocrDraft: page.ocrDraft,
          confirmedAt: null,
          sentences: [],
        })),
      };

      books.set(bookId, book);
      return { bookId };
    },

    async getBookForReview(bookId) {
      return books.get(bookId) ?? null;
    },

    async confirmPage(input) {
      const book = books.get(input.bookId);
      const page = book?.pages.find((candidate) => candidate.id === input.pageId);

      if (!book || !page) {
        throw new Error("Book page was not found");
      }

      const confirmedContent = buildConfirmedPageContent(input);
      const knowledgeLinks = confirmedContent.knowledgeCandidates.map(upsertKnowledgeVariant);

      page.status = BookPageStatus.Confirmed;
      page.confirmedAt = new Date();
      page.sentences = confirmedContent.sentences.map((sentence) => ({
        id: createId("sentence"),
        text: sentence.text,
        knowledgeLinks: knowledgeLinks.filter((link) => sentenceContainsKnowledge(sentence.text, link)),
      }));

      if (book.pages.every((bookPage) => bookPage.status === BookPageStatus.Confirmed)) {
        book.status = BookStatus.Confirmed;
        book.confirmedAt = new Date();
      }
    },

    async getConfirmedPracticeContent() {
      return Array.from(books.values()).flatMap((book) =>
        book.pages
          .filter((page) => page.status === BookPageStatus.Confirmed)
          .flatMap((page) =>
            page.sentences.map((sentence) => ({
              bookId: book.id,
              pageId: page.id,
              pageOrder: page.pageOrder,
              pageImageUrl: page.originalImageUrl,
              sentenceId: sentence.id,
              sentenceText: sentence.text,
              knowledgeLinks: sentence.knowledgeLinks,
            })),
          ),
      );
    },

    async getParentDashboardMetrics() {
      const allBooks = Array.from(books.values());
      return {
        draftBooks: allBooks.filter((book) => book.status !== BookStatus.Confirmed).length,
        pagesAwaitingReview: allBooks.flatMap((book) => book.pages).filter(
          (page) => page.status !== BookPageStatus.Confirmed,
        ).length,
      };
    },
  };
}

function sentenceContainsKnowledge(sentenceText: string, candidate: NormalizedKnowledgeCandidate): boolean {
  return sentenceText.toLowerCase().includes(candidate.surfaceForm.toLowerCase());
}

const globalForBookIngestionRepository = globalThis as unknown as {
  bookIngestionRepository?: BookIngestionRepository;
};

export function getBookIngestionRepository(): BookIngestionRepository {
  // Restart the dev server after changing the repository implementation.
  if (!globalForBookIngestionRepository.bookIngestionRepository) {
    globalForBookIngestionRepository.bookIngestionRepository =
      createPrismaBookIngestionRepository(prisma);
  }

  return globalForBookIngestionRepository.bookIngestionRepository;
}
