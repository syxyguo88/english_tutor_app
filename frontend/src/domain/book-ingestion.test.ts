import { describe, expect, it } from "vitest";
import { KnowledgeItemType } from "./enums";
import {
  buildConfirmedPageContent,
  normalizeKnowledgeCandidates,
  normalizeSentenceDrafts,
} from "./book-ingestion";

describe("book ingestion domain helpers", () => {
  it("normalizes sentence drafts by trimming text, dropping empties, and preserving order", () => {
    expect(
      normalizeSentenceDrafts([
        { text: "  I see a dog.  ", confidence: 0.91 },
        { text: " " },
        { text: "The dog can run.", confidence: 0.82 },
      ]),
    ).toEqual([
      { text: "I see a dog.", confidence: 0.91, draftOrder: 0 },
      { text: "The dog can run.", confidence: 0.82, draftOrder: 1 },
    ]);
  });

  it("normalizes word and phrase candidates into canonical knowledge variants", () => {
    expect(
      normalizeKnowledgeCandidates([
        { type: KnowledgeItemType.Word, surfaceForm: " Dogs ", variantKind: "plural" },
        { type: KnowledgeItemType.Phrase, surfaceForm: " by bus " },
        { type: KnowledgeItemType.Word, surfaceForm: "" },
      ]),
    ).toEqual([
      {
        type: KnowledgeItemType.Word,
        canonical: "dogs",
        surfaceForm: "Dogs",
        variantKind: "plural",
      },
      {
        type: KnowledgeItemType.Phrase,
        canonical: "by bus",
        surfaceForm: "by bus",
        variantKind: "base",
      },
    ]);
  });

  it("requires explicit parent confirmation before producing confirmed content", () => {
    expect(() =>
      buildConfirmedPageContent({
        parentConfirmed: false,
        sentenceDrafts: [{ text: "I like school." }],
        knowledgeCandidates: [{ type: KnowledgeItemType.Word, surfaceForm: "school" }],
      }),
    ).toThrow("Parent confirmation is required");

    expect(
      buildConfirmedPageContent({
        parentConfirmed: true,
        sentenceDrafts: [{ text: "I like school." }],
        knowledgeCandidates: [{ type: KnowledgeItemType.Word, surfaceForm: "school" }],
      }),
    ).toEqual({
      sentences: [{ text: "I like school.", confidence: undefined, draftOrder: 0 }],
      knowledgeCandidates: [
        {
          type: KnowledgeItemType.Word,
          canonical: "school",
          surfaceForm: "school",
          variantKind: "base",
        },
      ],
    });
  });
});
