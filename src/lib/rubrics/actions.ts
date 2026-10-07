"use server";

/*
|--------------------------------------------------
| npm imports
|--------------------------------------------------
*/
import { revalidatePath } from "next/cache";

/*
|--------------------------------------------------
| custom imports
|--------------------------------------------------
*/
import { requireUser } from "@/lib/auth/session";
import { getSubmissionForGrading } from "@/lib/assignments/queries";
import { audit } from "@/lib/audit/logger";
import { notifyGradeReleased } from "@/lib/notifications/queries";
import { createRubric, deleteRubric, saveRubricScores } from "./queries";
import { db } from "@/lib/db";

/*
|----------------------------------------------------------------------------------------------------
| createRubricAction
|----------------------------------------------------------------------------------------------------
| Creates and persists a new Rubric Action record.
*/
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

/*
|----------------------------------------------------------------------------------------------------
| deleteRubricAction
|----------------------------------------------------------------------------------------------------
| Deletes or archives a Rubric Action record from the database.
*/
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

/*
|----------------------------------------------------------------------------------------------------
| gradeWithRubricAction
|----------------------------------------------------------------------------------------------------
| Server action handling grade With Rubric workflows and cache revalidations.
*/
export async function gradeWithRubricAction(
  submissionId: string,
  scores: { criterionId: string; score: number; feedback?: string }[],
  feedback: string,
  release: boolean
): Promise<{ success: boolean; error?: string }> {
  const user = await requireUser();
  if (user.role !== "INSTRUCTOR" && user.role !== "ADMIN") {
    return { success: false, error: "Access denied." };
  }

  // Same track/role authorisation as plain grading
  const existing = await getSubmissionForGrading(submissionId, user.id, user.role);
  if (!existing) {
    return { success: false, error: "Submission not found or unauthorized." };
  }

  // Criteria must belong to this assignment's rubric; scores must be whole numbers
  const criteria = await db.rubricCriterion.findMany({
    where: { rubric: { assignmentId: existing.assignment.id } },
    select: { id: true },
  });
  const validIds = new Set(criteria.map((c) => c.id));
  const seen = new Set<string>();
  for (const s of scores) {
    if (!validIds.has(s.criterionId) || seen.has(s.criterionId)) {
      return { success: false, error: "Invalid rubric criterion." };
    }
    seen.add(s.criterionId);
    if (!Number.isInteger(s.score)) {
      return { success: false, error: "Rubric scores must be whole numbers." };
    }
  }
  const sum = scores.reduce((acc, s) => acc + s.score, 0);
  if (sum > existing.assignment.maxScore) {
    return {
      success: false,
      error: `Total (${sum}) cannot exceed the maximum score (${existing.assignment.maxScore}).`,
    };
  }

  try {
    const total = await saveRubricScores(submissionId, scores);
    await db.submission.update({
      where: { id: submissionId },
      data: {
        score: total,
        feedback,
        gradedById: user.id,
        gradedAt: new Date(),
        released: release || existing.submission.released,
      },
    });
    if (existing.submission.released && existing.submission.score !== total) {
      await notifyGradeReleased(
        submissionId,
        existing.submission.studentId,
        existing.assignment.title
      ).catch(() => {});
    }
    await audit(user.id, "GRADE_SAVED", "Submission", submissionId, {
      score: total,
      previousScore: existing.submission.score,
      shouldRelease: release,
      rubric: true,
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
