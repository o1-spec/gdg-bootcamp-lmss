"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import {
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  gradeSubmission,
  releaseGrade,
} from "./queries";

export async function createAssignmentAction(formData: FormData) {
  const user = await requireUser();

  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim();
  const cohortId = formData.get("cohortId")?.toString().trim();
  const isShared = formData.get("isShared") === "true" || formData.get("isShared") === "on";
  const trackIdRaw = formData.get("trackId")?.toString().trim();
  const trackId = isShared || !trackIdRaw ? null : trackIdRaw;

  const dueDateStr = formData.get("dueDate")?.toString().trim();
  const dueTimeStr = formData.get("dueTime")?.toString().trim() || "23:59";
  const maxScoreRaw = parseInt(formData.get("maxScore")?.toString() || "100", 10);
  const maxScore = isNaN(maxScoreRaw) || maxScoreRaw <= 0 ? 100 : maxScoreRaw;
  const allowLateSubmission =
    formData.get("allowLateSubmission") === "true" ||
    formData.get("allowLateSubmission") === "on";

  if (!title) {
    throw new Error("Title is required.");
  }
  if (!description) {
    throw new Error("Description is required.");
  }
  if (!cohortId) {
    throw new Error("Cohort is required.");
  }
  if (!isShared && !trackId) {
    throw new Error("Track is required unless assignment is cohort-wide shared.");
  }
  if (!dueDateStr) {
    throw new Error("Due date is required.");
  }

  const dueAt = new Date(`${dueDateStr}T${dueTimeStr}:00`);
  if (isNaN(dueAt.getTime())) {
    throw new Error("Invalid due date or time entered.");
  }

  await createAssignment(
    {
      cohortId,
      trackId,
      title,
      description,
      dueAt,
      maxScore,
      allowLateSubmission,
    },
    user.id,
    user.role
  );

  revalidatePath("/assignments");
  revalidatePath("/instructor/assignments");
  revalidatePath("/admin/assignments");

  const target = user.role === "ADMIN" ? "/admin/assignments" : "/instructor/assignments";
  redirect(target);
}

export async function updateAssignmentAction(
  assignmentId: string,
  formData: FormData
) {
  const user = await requireUser();

  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim();
  const cohortId = formData.get("cohortId")?.toString().trim();
  const isShared = formData.get("isShared") === "true" || formData.get("isShared") === "on";
  const trackIdRaw = formData.get("trackId")?.toString().trim();
  const trackId = isShared || !trackIdRaw ? null : trackIdRaw;

  const dueDateStr = formData.get("dueDate")?.toString().trim();
  const dueTimeStr = formData.get("dueTime")?.toString().trim() || "23:59";
  const maxScoreRaw = parseInt(formData.get("maxScore")?.toString() || "100", 10);
  const maxScore = isNaN(maxScoreRaw) || maxScoreRaw <= 0 ? 100 : maxScoreRaw;
  const allowLateSubmission =
    formData.get("allowLateSubmission") === "true" ||
    formData.get("allowLateSubmission") === "on";

  if (!title) {
    throw new Error("Title is required.");
  }
  if (!description) {
    throw new Error("Description is required.");
  }
  if (!cohortId) {
    throw new Error("Cohort is required.");
  }
  if (!isShared && !trackId) {
    throw new Error("Track is required unless assignment is cohort-wide shared.");
  }
  if (!dueDateStr) {
    throw new Error("Due date is required.");
  }

  const dueAt = new Date(`${dueDateStr}T${dueTimeStr}:00`);
  if (isNaN(dueAt.getTime())) {
    throw new Error("Invalid due date or time entered.");
  }

  await updateAssignment(
    assignmentId,
    {
      cohortId,
      trackId,
      title,
      description,
      dueAt,
      maxScore,
      allowLateSubmission,
    },
    user.id,
    user.role
  );

  revalidatePath("/assignments");
  revalidatePath(`/assignments/${assignmentId}`);
  revalidatePath("/instructor/assignments");
  revalidatePath(`/instructor/assignments/${assignmentId}`);
  revalidatePath("/admin/assignments");
  revalidatePath(`/admin/assignments/${assignmentId}`);

  const target =
    user.role === "ADMIN"
      ? `/admin/assignments/${assignmentId}`
      : `/instructor/assignments/${assignmentId}`;
  redirect(target);
}

export async function deleteAssignmentAction(assignmentId: string) {
  const user = await requireUser();

  await deleteAssignment(assignmentId, user.id, user.role);

  revalidatePath("/assignments");
  revalidatePath("/instructor/assignments");
  revalidatePath("/admin/assignments");

  const target = user.role === "ADMIN" ? "/admin/assignments" : "/instructor/assignments";
  redirect(target);
}

export async function submitAssignmentAction(
  assignmentId: string,
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  const user = await requireUser();
  const submissionUrl = formData.get("submissionUrl")?.toString().trim();

  if (!submissionUrl) {
    return { success: false, message: "Please provide a submission link." };
  }

  try {
    const result = await submitAssignment(assignmentId, submissionUrl, user.id);

    revalidatePath("/assignments");
    revalidatePath(`/assignments/${assignmentId}`);
    revalidatePath("/instructor/grading");
    revalidatePath("/admin/grading");

    return result;
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { success: false, message: err.message };
    }
    return { success: false, message: "Submission failed. Please try again." };
  }
}

export async function gradeSubmissionAction(
  submissionId: string,
  formData: FormData
): Promise<{ success: boolean; message?: string }> {
  const user = await requireUser();

  const scoreStr = formData.get("score")?.toString();
  const feedback = formData.get("feedback")?.toString() || "";
  const shouldRelease = formData.get("release") === "true";

  if (scoreStr === undefined || scoreStr === "") {
    return { success: false, message: "Score is required." };
  }

  const score = parseFloat(scoreStr);
  if (isNaN(score)) {
    return { success: false, message: "Score must be a valid number." };
  }

  try {
    await gradeSubmission(
      submissionId,
      score,
      feedback,
      shouldRelease,
      user.id,
      user.role
    );

    revalidatePath(`/instructor/grading/${submissionId}`);
    revalidatePath(`/admin/grading/${submissionId}`);
    revalidatePath("/instructor/grading");
    revalidatePath("/admin/grading");
    revalidatePath("/assignments");

    return { success: true };
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { success: false, message: err.message };
    }
    return { success: false, message: "Grading failed." };
  }
}

export async function releaseGradeAction(
  submissionId: string
): Promise<{ success: boolean; message?: string }> {
  const user = await requireUser();

  try {
    await releaseGrade(submissionId, user.id, user.role);

    revalidatePath(`/instructor/grading/${submissionId}`);
    revalidatePath(`/admin/grading/${submissionId}`);
    revalidatePath("/instructor/grading");
    revalidatePath("/admin/grading");
    revalidatePath("/assignments");

    return { success: true };
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { success: false, message: err.message };
    }
    return { success: false, message: "Failed to release grade." };
  }
}
