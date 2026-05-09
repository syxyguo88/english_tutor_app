/**
 * Book ingestion persistence uses explicit string IDs: `book_${uuid}`, `page_${uuid}`,
 * `sentence_${uuid}`, `knowledge_item_${uuid}`, `knowledge_variant_${uuid}` so creates
 * do not rely on DB defaults and remain clearly traceable in logs.
 */
import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import {
  BookPageStatus as PrismaBookPageStatus,
  BookStatus as PrismaBookStatus,
  KnowledgeItemType as PrismaKnowledgeItemType,
  TextRemovedImageStatus as PrismaTextRemovedImageStatus,
} from "@prisma/client";
import {
  buildConfirmedPageContent,
  type NormalizedKnowledgeCandidate,
} from "@/domain/book-ingestion";
import { BookPageStatus, BookStatus, KnowledgeItemType } from "@/domain/enums";
import type { MockPageOcrDraft } from "./mock-extractor";
import type {
  BookForReview,
  BookIngestionRepository,
  BookReviewPage,
  ConfirmedKnowledgeLink,
  ConfirmedPracticeContent,
  CreateBookDraftInput,
  CreateBookDraftResult,
  ConfirmPageInput,
  FamilyBookSummary,
  ParentDashboardMetrics,
} from "./repository";

function newBookId() {
  return `book_${randomUUID()}`;
}

function newPageId() {
  return `page_${randomUUID()}`;
}

function newSentenceId() {
  return `sentence_${randomUUID()}`;
}

function newKnowledgeItemId() {
  return `knowledge_item_${randomUUID()}`;
}

function newKnowledgeVariantId() {
  return `knowledge_variant_${randomUUID()}`;
}

function newSentenceKnowledgeLinkId() {
  return `sentence_knowledge_link_${randomUUID()}`;
}

function toPrismaKnowledgeItemType(
  type: NormalizedKnowledgeCandidate["type"],
): PrismaKnowledgeItemType {
  return type === KnowledgeItemType.Word ? PrismaKnowledgeItemType.word : PrismaKnowledgeItemType.phrase;
}

function mapBookStatus(status: PrismaBookStatus): BookStatus {
  switch (status) {
    case PrismaBookStatus.draft:
      return BookStatus.Draft;
    case PrismaBookStatus.processing:
      return BookStatus.Processing;
    case PrismaBookStatus.ready_for_review:
      return BookStatus.ReadyForReview;
    case PrismaBookStatus.confirmed:
      return BookStatus.Confirmed;
    default:
      return BookStatus.Draft;
  }
}

function mapBookPageStatus(status: PrismaBookPageStatus): BookPageStatus {
  return status === PrismaBookPageStatus.confirmed ? BookPageStatus.Confirmed : BookPageStatus.Draft;
}

function mapTextRemovedImageStatus(
  status: PrismaTextRemovedImageStatus,
): BookReviewPage["textRemovedImageStatus"] {
  switch (status) {
    case PrismaTextRemovedImageStatus.not_started:
      return "not_started";
    case PrismaTextRemovedImageStatus.processing:
      return "processing";
    case PrismaTextRemovedImageStatus.accepted:
      return "accepted";
    case PrismaTextRemovedImageStatus.failed:
      return "failed";
    case PrismaTextRemovedImageStatus.excluded:
      return "excluded";
    default:
      return "not_started";
  }
}

function parseOcrDraft(value: unknown): MockPageOcrDraft {
  if (value === null || value === undefined || typeof value !== "object") {
    return { sourceFileName: "", sentences: [], knowledgeCandidates: [] };
  }
  return value as MockPageOcrDraft;
}

function mapKnowledgeLinkFromDb(link: {
  knowledgeVariant: {
    id: string;
    knowledgeItemId: string;
    surfaceForm: string;
    variantKind: string;
    knowledgeItem: { type: PrismaKnowledgeItemType; canonical: string };
  };
}): ConfirmedKnowledgeLink {
  const v = link.knowledgeVariant;
  const domainType =
    v.knowledgeItem.type === PrismaKnowledgeItemType.phrase
      ? KnowledgeItemType.Phrase
      : KnowledgeItemType.Word;

  return {
    id: v.id,
    knowledgeItemId: v.knowledgeItemId,
    type: domainType,
    canonical: v.knowledgeItem.canonical,
    surfaceForm: v.surfaceForm,
    variantKind: v.variantKind,
  };
}

function sentenceContainsKnowledge(sentenceText: string, candidate: NormalizedKnowledgeCandidate): boolean {
  return sentenceText.toLowerCase().includes(candidate.surfaceForm.toLowerCase());
}

type ResolvedKnowledgeVariant = NormalizedKnowledgeCandidate & {
  id: string;
  knowledgeItemId: string;
};

export function createPrismaBookIngestionRepository(
  db: PrismaClient,
): BookIngestionRepository {
  return {
    async createBookDraft(input: CreateBookDraftInput): Promise<CreateBookDraftResult> {
      const bookId = newBookId();

      await db.book.create({
        data: {
          id: bookId,
          familyId: input.familyId,
          title: input.title,
          status: PrismaBookStatus.draft,
          readingDate: input.readingDate ? new Date(input.readingDate) : null,
          tags: input.tags ?? [],
          pages: {
            create: input.pages.map((page) => ({
              id: newPageId(),
              pageOrder: page.pageOrder,
              status: PrismaBookPageStatus.draft,
              originalImageUrl: page.originalImageUrl,
              textRemovedImageStatus: PrismaTextRemovedImageStatus.not_started,
              ocrDraft: page.ocrDraft,
            })),
          },
        },
      });

      return { bookId };
    },

    async getBookForReview(bookId: string): Promise<BookForReview | null> {
      const book = await db.book.findUnique({
        where: { id: bookId },
        include: {
          pages: {
            orderBy: { pageOrder: "asc" },
            include: {
              sentences: {
                orderBy: { id: "asc" },
                include: {
                  knowledgeLinks: {
                    include: {
                      knowledgeVariant: {
                        include: { knowledgeItem: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!book) {
        return null;
      }

      return {
        id: book.id,
        familyId: book.familyId,
        title: book.title,
        status: mapBookStatus(book.status),
        readingDate: book.readingDate ? book.readingDate.toISOString().slice(0, 10) : null,
        tags: book.tags,
        confirmedAt: book.confirmedAt,
        pages: book.pages.map((page): BookReviewPage => ({
          id: page.id,
          pageOrder: page.pageOrder,
          status: mapBookPageStatus(page.status),
          originalImageUrl: page.originalImageUrl,
          textRemovedImageStatus: mapTextRemovedImageStatus(page.textRemovedImageStatus),
          ocrDraft: parseOcrDraft(page.ocrDraft),
          confirmedAt: page.confirmedAt,
          sentences: page.sentences.map((sentence) => ({
            id: sentence.id,
            text: sentence.text,
            knowledgeLinks: sentence.knowledgeLinks.map(mapKnowledgeLinkFromDb),
          })),
        })),
      };
    },

    async confirmPage(input: ConfirmPageInput): Promise<void> {
      const bookRecord = await db.book.findUnique({
        where: { id: input.bookId },
        include: { pages: true },
      });

      if (!bookRecord) {
        throw new Error("Book page was not found");
      }

      const pageRecord = bookRecord.pages.find((p) => p.id === input.pageId);
      if (!pageRecord) {
        throw new Error("Book page was not found");
      }

      const confirmedContent = buildConfirmedPageContent(input);
      const now = new Date();

      await db.$transaction(async (tx) => {
        await tx.sentence.deleteMany({ where: { bookPageId: input.pageId } });

        const resolvedVariants: ResolvedKnowledgeVariant[] = [];
        for (const candidate of confirmedContent.knowledgeCandidates) {
          const item = await tx.knowledgeItem.upsert({
            where: {
              type_canonical: {
                type: toPrismaKnowledgeItemType(candidate.type),
                canonical: candidate.canonical,
              },
            },
            create: {
              id: newKnowledgeItemId(),
              type: toPrismaKnowledgeItemType(candidate.type),
              canonical: candidate.canonical,
            },
            update: {},
          });

          const variant = await tx.knowledgeVariant.upsert({
            where: {
              knowledgeItemId_surfaceForm_variantKind: {
                knowledgeItemId: item.id,
                surfaceForm: candidate.surfaceForm,
                variantKind: candidate.variantKind,
              },
            },
            create: {
              id: newKnowledgeVariantId(),
              knowledgeItemId: item.id,
              surfaceForm: candidate.surfaceForm,
              variantKind: candidate.variantKind,
            },
            update: {},
          });

          resolvedVariants.push({
            ...candidate,
            id: variant.id,
            knowledgeItemId: item.id,
          });
        }

        for (const sentenceDraft of confirmedContent.sentences) {
          const linksForSentence = resolvedVariants.filter((v) =>
            sentenceContainsKnowledge(sentenceDraft.text, v),
          );

          const sentence = await tx.sentence.create({
            data: {
              id: newSentenceId(),
              bookPageId: input.pageId,
              text: sentenceDraft.text,
              confirmedAt: now,
            },
          });

          for (const variant of linksForSentence) {
            await tx.sentenceKnowledgeLink.create({
              data: {
                id: newSentenceKnowledgeLinkId(),
                sentenceId: sentence.id,
                knowledgeItemId: variant.knowledgeItemId,
                knowledgeVariantId: variant.id,
              },
            });
          }
        }

        await tx.bookPage.update({
          where: { id: input.pageId },
          data: {
            status: PrismaBookPageStatus.confirmed,
            confirmedAt: now,
          },
        });

        const pendingPages = await tx.bookPage.count({
          where: {
            bookId: input.bookId,
            status: { not: PrismaBookPageStatus.confirmed },
          },
        });

        if (pendingPages === 0) {
          await tx.book.update({
            where: { id: input.bookId },
            data: {
              status: PrismaBookStatus.confirmed,
              confirmedAt: now,
            },
          });
        }
      });
    },

    async getConfirmedPracticeContent(): Promise<ConfirmedPracticeContent[]> {
      const sentences = await db.sentence.findMany({
        where: {
          bookPage: {
            status: PrismaBookPageStatus.confirmed,
          },
        },
        orderBy: [{ bookPage: { bookId: "asc" } }, { bookPage: { pageOrder: "asc" } }, { id: "asc" }],
        include: {
          bookPage: {
            include: { book: true },
          },
          knowledgeLinks: {
            include: {
              knowledgeVariant: {
                include: { knowledgeItem: true },
              },
            },
          },
        },
      });

      return sentences.map((sentence): ConfirmedPracticeContent => ({
        bookId: sentence.bookPage.book.id,
        pageId: sentence.bookPage.id,
        pageOrder: sentence.bookPage.pageOrder,
        pageImageUrl: sentence.bookPage.originalImageUrl,
        sentenceId: sentence.id,
        sentenceText: sentence.text,
        knowledgeLinks: sentence.knowledgeLinks.map(mapKnowledgeLinkFromDb),
      }));
    },

    async getParentDashboardMetrics(): Promise<ParentDashboardMetrics> {
      const [draftBooks, pagesAwaitingReview] = await Promise.all([
        db.book.count({
          where: { status: { not: PrismaBookStatus.confirmed } },
        }),
        db.bookPage.count({
          where: { status: { not: PrismaBookPageStatus.confirmed } },
        }),
      ]);

      return { draftBooks, pagesAwaitingReview };
    },

    async listBooksForFamily(familyId: string): Promise<FamilyBookSummary[]> {
      const rows = await db.book.findMany({
        where: { familyId },
        orderBy: { updatedAt: "desc" },
        include: {
          _count: { select: { pages: true } },
        },
      });

      return rows.map((book) => ({
        id: book.id,
        title: book.title,
        status: mapBookStatus(book.status),
        pageCount: book._count.pages,
        readingDate: book.readingDate ? book.readingDate.toISOString().slice(0, 10) : null,
        updatedAt: book.updatedAt,
      }));
    },
  };
}
