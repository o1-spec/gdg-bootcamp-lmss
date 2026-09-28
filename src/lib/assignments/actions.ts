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
import {
  notifyAssignmentCreated,
  notifyGradeReleased,
} from "@/lib/notifications/queries";
import { audit } from "@/lib/audit/logger";
import { db } from "@/lib/db";

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

  const assignment = await createAssignment(
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

  // Notify enrolled students (fire-and-forget — do not block redirect)
  notifyAssignmentCreated(assignment.id, cohortId, trackId, title).catch(() => {});

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

import { uploadToCloudinary } from "@/lib/storage/cloudinary";

export async function submitAssignmentAction(
  assignmentId: string,
  formData: FormData
): Promise<{ success: boolean; message: string; fileUrl?: string | null; submissionUrl?: string | null }> {
  const user = await requireUser();
  const submissionUrl = formData.get("submissionUrl")?.toString().trim() || null;
  const file = formData.get("file") as File | null;

  let fileUrl: string | null = null;

  try {
    if (file && file.size > 0) {
      const MAX_SIZE = 25 * 1024 * 1024; // 25 MB
      if (file.size > MAX_SIZE) {
        return {
          success: false,
          message: "Uploaded file exceeds the maximum size limit of 25MB.",
        };
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fileUrl = await uploadToCloudinary(buffer, file.name, file.type);
    }

    if (!submissionUrl && !fileUrl) {
      return {
        success: false,
        message: "Please provide either a submission link or upload a file.",
      };
    }

    const result = await submitAssignment(
      assignmentId,
      { submissionUrl, fileUrl },
      user.id
    );

    revalidatePath("/assignments");
    revalidatePath(`/assignments/${assignmentId}`);
    revalidatePath("/instructor/grading");
    revalidatePath("/admin/grading");

    return {
      ...result,
      fileUrl,
      submissionUrl,
    };
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

    audit(user.id, "GRADE_SAVED", "Submission", submissionId, {
      score,
      shouldRelease,
    });

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
    const sub = await releaseGrade(submissionId, user.id, user.role);

    // Notify the student
    notifyGradeReleased(
      submissionId,
      sub.userId,
      sub.assignment?.title ?? "assignment"
    ).catch(() => {});

    audit(user.id, "GRADE_RELEASED", "Submission", submissionId, {
      studentId: sub.userId,
      assignmentTitle: sub.assignment?.title,
    });

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

// ── Bulk grade release ────────────────────────────────────────────────────────

export async function bulkReleaseGradesAction(
  submissionIds: string[]
): Promise<{ success: boolean; released: number; skipped: number; error?: string }> {
  const user = await requireUser();
  if (user.role === "STUDENT") {
    return { success: false, released: 0, skipped: 0, error: "Access denied." };
  }

  if (!submissionIds.length) {
    return { success: false, released: 0, skipped: 0, error: "No submissions selected." };
  }

  // Fetch submissions and verify access
  const submissions = await db.submission.findMany({
    where: { id: { in: submissionIds }, score: { not: null } },
    include: {
      assignment: { select: { title: true, trackId: true, cohortId: true } },
    },
  });

  // Instructors: only release submissions in their assigned tracks
  let allowed = submissions;
  if (user.role === "INSTRUCTOR") {
    const trackAssignments = await db.trackInstructor.findMany({
      where: { userId: user.id },
      select: { trackId: true },
    });
    const allowedTrackIds = new Set(trackAssignments.map((t) => t.trackId));
    allowed = submissions.filter(
      (s) => s.assignment.trackId === null || allowedTrackIds.has(s.assignment.trackId ?? "")
    );
  }

  const skipped = submissionIds.length - allowed.length;
  if (!allowed.length) {
    return { success: false, released: 0, skipped, error: "No authorized submissions to release." };
  }

  // Bulk update in a transaction
  await db.$transaction(
    allowed.map((s) =>
      db.submission.update({
        where: { id: s.id },
        data: { released: true },
      })
    )
  );

  // Fire-and-forget notifications
  for (const s of allowed) {
    notifyGradeReleased(s.id, s.userId, s.assignment.title).catch(() => {});
  }

  audit(user.id, "BULK_GRADES_RELEASED", "Submission", allowed[0]?.id ?? "", {
    count: allowed.length,
    submissionIds: allowed.map((s) => s.id),
  });

  revalidatePath("/instructor/grading");
  revalidatePath("/admin/grading");
  revalidatePath("/assignments");

  return { success: true, released: allowed.length, skipped };
}
