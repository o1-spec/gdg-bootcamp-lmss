import { db } from "@/lib/db";
import { deriveCompletion, type CompletionResult } from "./policy";

/**
 * Compute completion status for a single student in a specific track.
 */
export async function getStudentCompletion(
  userId: string,
  trackId: string
): Promise<CompletionResult> {
  const now = new Date();

  // 1. Fetch all sessions for this track that have already ended
  const sessions = await db.session.findMany({
    where: { trackId, endsAt: { lte: now } },
    select: { id: true },
  });
  const sessionIds = sessions.map((s) => s.id);
  const totalCompletedSessions = sessionIds.length;

  // 2. Count present/late attendance
  const attendanceRows = await db.attendance.findMany({
    where: {
      sessionId: { in: sessionIds },
      userId,
    },
    select: { id: true, status: true },
  });
  const presentOrLate = attendanceRows.filter(
    (a) => a.status === "PRESENT" || a.status === "LATE"
  ).length;

  // 3. Count approved excuses (reduces denominator)
  const excusedCount = await db.attendanceExcuse.count({
    where: {
      userId,
      sessionId: { in: sessionIds },
      status: "APPROVED",
    },
  });

  // 4. Assignments for this track (or cohort-wide, null trackId)
  const enrollment = await db.enrollment.findFirst({
    where: { userId, trackId },
    include: { track: { select: { cohortId: true } } },
  });
  const cohortId = enrollment?.track.cohortId;

  const assignments = cohortId
    ? await db.assignment.findMany({
        where: {
          OR: [{ trackId }, { cohortId, trackId: null }],
        },
        select: { id: true },
      })
    : [];
  const assignmentIds = assignments.map((a) => a.id);
  const assignmentsTotal = assignmentIds.length;

  // 5. Count submissions
  const submissions = cohortId
    ? await db.submission.findMany({
        where: {
          userId,
          assignmentId: { in: assignmentIds },
        },
        select: { id: true, released: true },
      })
    : [];
  const assignmentsSubmitted = submissions.length;
  const releasedGrades = submissions.filter((s) => s.released).length;

  return deriveCompletion({
    totalCompletedSessions,
    approvedExcusedAbsences: excusedCount,
    presentOrLate,
    assignmentsTotal,
    assignmentsSubmitted,
    releasedGrades,
  });
}

/**
 * Batch completion for all students in a track (instructor / admin use).
 */
export async function getTrackCompletion(trackId: string): Promise<
  { userId: string; name: string; email: string; completion: CompletionResult }[]
> {
  const enrollments = await db.enrollment.findMany({
    where: { trackId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  const results = await Promise.all(
    enrollments.map(async ({ user }) => ({
      userId: user.id,
      name: user.name,
      email: user.email,
      completion: await getStudentCompletion(user.id, trackId),
    }))
  );
  return results;
}
