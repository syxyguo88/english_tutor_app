import { describe, expect, it } from "vitest";
import { KnowledgeItemType } from "@/domain/enums";
import { extractMockBookPages } from "./mock-extractor";

describe("mock book page extractor", () => {
  it("returns deterministic page drafts for uploaded page images", async () => {
    await expect(
      extractMockBookPages([
        {
          fileName: "page-one.png",
          dataUrl: "data:image/png;base64,page-one",
        },
        {
          fileName: "page-two.png",
          dataUrl: "data:image/png;base64,page-two",
        },
      ]),
    ).resolves.toEqual([
      {
        pageOrder: 1,
        originalImageUrl: "data:image/png;base64,page-one",
        ocrDraft: {
          sourceFileName: "page-one.png",
          sentences: [
            { text: "I can see page one.", confidence: 0.92 },
            { text: "This is a good book.", confidence: 0.88 },
          ],
          knowledgeCandidates: [
            { type: KnowledgeItemType.Word, surfaceForm: "page", variantKind: "base" },
            { type: KnowledgeItemType.Phrase, surfaceForm: "good book", variantKind: "base" },
          ],
        },
      },
      {
        pageOrder: 2,
        originalImageUrl: "data:image/png;base64,page-two",
        ocrDraft: {
          sourceFileName: "page-two.png",
          sentences: [
            { text: "I can see page two.", confidence: 0.92 },
            { text: "This is a good book.", confidence: 0.88 },
          ],
          knowledgeCandidates: [
            { type: KnowledgeItemType.Word, surfaceForm: "page", variantKind: "base" },
            { type: KnowledgeItemType.Phrase, surfaceForm: "good book", variantKind: "base" },
          ],
        },
      },
    ]);
  });
});
