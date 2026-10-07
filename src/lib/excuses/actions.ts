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
import { requireUser, requireStudent } from "@/lib/auth/session";
import { submitExcuse, reviewExcuse } from "./queries";
import { audit } from "@/lib/audit/logger";
import { db } from "@/lib/db";

/*
|----------------------------------------------------------------------------------------------------
| submitExcuseAction
|----------------------------------------------------------------------------------------------------
| Server action handling submit Excuse workflows and cache revalidations.
*/
export async function submitExcuseAction(
  sessionId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const user = await requireStudent();
  const trimmed = reason.trim();
  if (!trimmed || trimmed.length < 10) {
    return { success: false, error: "Please provide a meaningful reason (at least 10 characters)." };
  }
  if (trimmed.length > 1000) {
    return { success: false, error: "Reason is too long (max 1000 characters)." };
  }

  // Verify student is enrolled in a track for this session
  const session = await db.session.findUnique({
    where: { id: sessionId },
    select: { cohortId: true, trackId: true, endsAt: true },
  });
  if (!session) return { success: false, error: "Session not found." };

  const enrolled = await db.enrollment.findFirst({
    where: {
      userId: user.id,
      track: { cohortId: session.cohortId },
      ...(session.trackId ? { trackId: session.trackId } : {}),
    },
  });
  if (!enrolled) return { success: false, error: "You are not enrolled in this session's track." };

  try {
    await submitExcuse(user.id, sessionId, trimmed);
    await audit(user.id, "EXCUSE_SUBMITTED", "Session", sessionId, { reason: trimmed.substring(0, 100) });
    revalidatePath("/attendance");
    revalidatePath(`/classes/${sessionId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to submit excuse." };
  }
}

/*
|----------------------------------------------------------------------------------------------------
| reviewExcuseAction
|----------------------------------------------------------------------------------------------------
| Server action handling review Excuse workflows and cache revalidations.
*/
export async function reviewExcuseAction(
  excuseId: string,
  decision: "APPROVED" | "REJECTED",
  reviewNote?: string
): Promise<{ success: boolean; error?: string }> {
  const user = await requireUser();
  if (user.role === "STUDENT") return { success: false, error: "Access denied." };

  // Instructor scope check
  if (user.role === "INSTRUCTOR") {
    const excuse = await db.attendanceExcuse.findUnique({
      where: { id: excuseId },
      include: { session: { select: { trackId: true, cohortId: true } } },
    });
    if (!excuse) return { success: false, error: "Excuse not found." };

    // Track sessions: instructor must teach that track. Shared sessions:
    // instructor must teach the track the excused student is enrolled in.
    const scopeTrackIds = excuse.session.trackId
      ? [excuse.session.trackId]
      : (
          await db.enrollment.findMany({
            where: { userId: excuse.userId, track: { cohortId: excuse.session.cohortId } },
            select: { trackId: true },
          })
        ).map((e) => e.trackId);
    const assigned = scopeTrackIds.length
      ? await db.trackInstructor.findFirst({
          where: { userId: user.id, trackId: { in: scopeTrackIds } },
        })
      : null;
    if (!assigned) return { success: false, error: "You are not assigned to this student's track." };
  }

  try {
    const allowOverride = user.role === "ADMIN";
    await reviewExcuse(excuseId, user.id, decision, reviewNote, allowOverride);
    await audit(user.id, decision === "APPROVED" ? "EXCUSE_APPROVED" : "EXCUSE_REJECTED", "AttendanceExcuse", excuseId, {
      reviewNote: reviewNote?.substring(0, 200),
      isOverride: allowOverride,
    });
    revalidatePath("/instructor/excuses");
    revalidatePath("/admin/excuses");
    revalidatePath("/attendance");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Review failed." };
  }
}
