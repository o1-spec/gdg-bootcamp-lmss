"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createRubric, deleteRubric, saveRubricScores } from "./queries";
import { db } from "@/lib/db";

// ── Create rubric ─────────────────────────────────────────────────────────────

export async function createRubricAction(
  assignmentId: string,
  title: string,
  criteria: { title: string; description?: string; maxScore: number }[]
): Promise<{ success: boolean; error?: string }> {
  const user = await requireUser();
  if (user.role === "STUDENT") return { success: false, error: "Access denied." };

  try {
    await createRubric(assignmentId, title, criteria);
    revalidatePath(`/instructor/assignments/${assignmentId}`);
    revalidatePath(`/admin/assignments/${assignmentId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed." };
  }
}

// ── Delete rubric ─────────────────────────────────────────────────────────────

export async function deleteRubricAction(
  assignmentId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await requireUser();
  if (user.role === "STUDENT") return { success: false, error: "Access denied." };

  try {
    await deleteRubric(assignmentId);
    revalidatePath(`/instructor/assignments/${assignmentId}`);
    revalidatePath(`/admin/assignments/${assignmentId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed." };
  }
}

// ── Grade with rubric ─────────────────────────────────────────────────────────

export async function gradeWithRubricAction(
  submissionId: string,
  scores: { criterionId: string; score: number; feedback?: string }[],
  feedback: string,
  release: boolean
): Promise<{ success: boolean; error?: string }> {
  const user = await requireUser();
  if (user.role === "STUDENT") return { success: false, error: "Access denied." };

  try {
    const total = await saveRubricScores(submissionId, scores);
    await db.submission.update({
      where: { id: submissionId },
      data: {
        score: total,
        feedback,
        gradedById: user.id,
        gradedAt: new Date(),
        released: release,
      },
    });
    revalidatePath(`/instructor/grading/${submissionId}`);
    revalidatePath(`/admin/grading/${submissionId}`);
    revalidatePath("/instructor/grading");
    revalidatePath("/admin/grading");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed." };
  }
}
