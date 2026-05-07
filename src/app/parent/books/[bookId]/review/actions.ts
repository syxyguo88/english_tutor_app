"use server";

import { revalidatePath } from "next/cache";
import { KnowledgeItemType } from "@/domain/enums";
import { getBookIngestionRepository } from "@/lib/book-ingestion/repository";

export async function confirmBookPageAction(formData: FormData): Promise<void> {
  const bookId = String(formData.get("bookId") ?? "");
  const pageId = String(formData.get("pageId") ?? "");
  const sentences = formData
    .getAll("sentences")
    .map((value) => ({ text: String(value) }));
  const knowledgeTypes = formData.getAll("knowledgeType").map(String);
  const knowledgeSurfaceForms = formData.getAll("knowledgeSurfaceForm").map(String);
  const knowledgeVariantKinds = formData.getAll("knowledgeVariantKind").map(String);

  await getBookIngestionRepository().confirmPage({
    bookId,
    pageId,
    parentConfirmed: true,
    sentenceDrafts: sentences,
    knowledgeCandidates: knowledgeSurfaceForms.map((surfaceForm, index) => ({
      type: parseKnowledgeItemType(knowledgeTypes[index]),
      surfaceForm,
      variantKind: knowledgeVariantKinds[index] || "base",
    })),
  });

  revalidatePath(`/parent/books/${bookId}/review`);
}

function parseKnowledgeItemType(value: string | undefined): KnowledgeItemType.Word | KnowledgeItemType.Phrase {
  return value === KnowledgeItemType.Phrase ? KnowledgeItemType.Phrase : KnowledgeItemType.Word;
}
