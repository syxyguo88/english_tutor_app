import { KnowledgeItemType } from "@/domain/enums";
import type { KnowledgeCandidateInput, SentenceDraftInput } from "@/domain/book-ingestion";

export type MockUploadedPage = {
  fileName: string;
  dataUrl: string;
};

export type MockPageOcrDraft = {
  sourceFileName: string;
  sentences: SentenceDraftInput[];
  knowledgeCandidates: KnowledgeCandidateInput[];
};

export type MockExtractedPageDraft = {
  pageOrder: number;
  originalImageUrl: string;
  ocrDraft: MockPageOcrDraft;
};

export async function extractMockBookPages(
  pages: MockUploadedPage[],
): Promise<MockExtractedPageDraft[]> {
  return pages.map((page, index) => {
    const pageOrder = index + 1;

    return {
      pageOrder,
      originalImageUrl: page.dataUrl,
      ocrDraft: {
        sourceFileName: page.fileName,
        sentences: [
          { text: `I can see page ${numberToWord(pageOrder)}.`, confidence: 0.92 },
          { text: "This is a good book.", confidence: 0.88 },
        ],
        knowledgeCandidates: [
          { type: KnowledgeItemType.Word, surfaceForm: "page", variantKind: "base" },
          { type: KnowledgeItemType.Phrase, surfaceForm: "good book", variantKind: "base" },
        ],
      },
    };
  });
}

function numberToWord(value: number): string {
  const words = ["zero", "one", "two", "three", "four", "five", "six"];
  return words[value] ?? String(value);
}
