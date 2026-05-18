import { KnowledgeItemType } from "./enums";

export type SentenceDraftInput = {
  text: string;
  confidence?: number;
};

export type NormalizedSentenceDraft = {
  text: string;
  confidence: number | undefined;
  draftOrder: number;
};

export type KnowledgeCandidateInput = {
  type: KnowledgeItemType.Word | KnowledgeItemType.Phrase;
  surfaceForm: string;
  variantKind?: string;
};

export type NormalizedKnowledgeCandidate = {
  type: KnowledgeItemType.Word | KnowledgeItemType.Phrase;
  canonical: string;
  surfaceForm: string;
  variantKind: string;
};

export type ConfirmedPageContentInput = {
  parentConfirmed: boolean;
  sentenceDrafts: SentenceDraftInput[];
  knowledgeCandidates: KnowledgeCandidateInput[];
};

export type ConfirmedPageContent = {
  sentences: NormalizedSentenceDraft[];
  knowledgeCandidates: NormalizedKnowledgeCandidate[];
};

export function normalizeSentenceDrafts(
  sentenceDrafts: SentenceDraftInput[],
): NormalizedSentenceDraft[] {
  return sentenceDrafts
    .map((draft) => ({
      text: draft.text.trim(),
      confidence: draft.confidence,
    }))
    .filter((draft) => draft.text.length > 0)
    .map((draft, draftOrder) => ({
      ...draft,
      draftOrder,
    }));
}

export function normalizeKnowledgeCandidates(
  candidates: KnowledgeCandidateInput[],
): NormalizedKnowledgeCandidate[] {
  return candidates
    .map((candidate) => ({
      type: candidate.type,
      surfaceForm: candidate.surfaceForm.trim(),
      variantKind: candidate.variantKind?.trim() || "base",
    }))
    .filter((candidate) => candidate.surfaceForm.length > 0)
    .map((candidate) => ({
      ...candidate,
      canonical: candidate.surfaceForm.toLowerCase(),
    }));
}

export function buildConfirmedPageContent(input: ConfirmedPageContentInput): ConfirmedPageContent {
  if (!input.parentConfirmed) {
    throw new Error("Parent confirmation is required");
  }

  return {
    sentences: normalizeSentenceDrafts(input.sentenceDrafts),
    knowledgeCandidates: normalizeKnowledgeCandidates(input.knowledgeCandidates),
  };
}
