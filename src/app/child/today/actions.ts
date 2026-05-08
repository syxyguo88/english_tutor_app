"use server";

import { revalidatePath } from "next/cache";
import { getPracticeRepository } from "@/lib/practice/repository";
import { ensurePrototypeSession } from "@/lib/prototype-session";

export async function submitPracticeAttemptAction(formData: FormData): Promise<void> {
  const exerciseId = String(formData.get("exerciseId") ?? "");
  const answerText = String(formData.get("answer") ?? "");
  const session = await ensurePrototypeSession();

  await getPracticeRepository().submitAttempt({
    childId: session.childUserId,
    exerciseId,
    answerText,
    now: new Date(),
  });

  revalidatePath("/child/today");
}
