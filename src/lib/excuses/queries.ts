import { db } from "@/lib/db";

// ── Query helpers ─────────────────────────────────────────────────────────────

export async function getSessionExcuses(sessionId: string) {
  return db.attendanceExcuse.findMany({
    where: { sessionId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { id: true, name: true } },
      attendance: { select: { status: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getStudentExcuses(userId: string) {
  return db.attendanceExcuse.findMany({
    where: { userId },
    include: {
      session: { select: { id: true, title: true, startsAt: true } },
      reviewedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInstructorExcuses(instructorId: string) {
  // Get tracks assigned to this instructor
  const trackIds = (
    await db.trackInstructor.findMany({
      where: { userId: instructorId },
      select: { trackId: true },
    })
  ).map((t) => t.trackId);

  return db.attendanceExcuse.findMany({
    where: {
      session: {
        OR: [
          { trackId: { in: trackIds } },
          // Cohort-wide sessions for cohorts containing instructor's tracks
          { trackId: null, cohortId: { in: await getCohortIdsForTracks(trackIds) } },
        ],
      },
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      session: { select: { id: true, title: true, startsAt: true, trackId: true } },
      reviewedBy: { select: { name: true } },
      attendance: { select: { status: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

async function getCohortIdsForTracks(trackIds: string[]) {
  const tracks = await db.track.findMany({
    where: { id: { in: trackIds } },
    select: { cohortId: true },
  });
  return [...new Set(tracks.map((t) => t.cohortId))];
}

export async function getAllExcuses(filter?: {
  status?: string;
  sessionId?: string;
}) {
  return db.attendanceExcuse.findMany({
    where: {
      ...(filter?.status ? { status: filter.status as "PENDING" | "APPROVED" | "REJECTED" } : {}),
      ...(filter?.sessionId ? { sessionId: filter.sessionId } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      session: { select: { id: true, title: true, startsAt: true, trackId: true } },
      reviewedBy: { select: { name: true } },
      attendance: { select: { status: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export async function getExcuseById(id: string) {
  return db.attendanceExcuse.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      session: { select: { id: true, title: true, startsAt: true } },
      attendance: { select: { status: true } },
    },
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function submitExcuse(
  userId: string,
  sessionId: string,
  reason: string
) {
  // Check if excuse already reviewed
  const existing = await db.attendanceExcuse.findUnique({
    where: { sessionId_userId: { sessionId, userId } },
  });
  if (existing && existing.status !== "PENDING") {
    throw new Error("This excuse has already been reviewed and cannot be modified.");
  }

  // Find existing attendance record
  const attendance = await db.attendance.findUnique({
    where: { sessionId_userId: { sessionId, userId } },
    select: { id: true },
  });

  // Upsert — student can update if still pending
  return db.attendanceExcuse.upsert({
    where: { sessionId_userId: { sessionId, userId } },
    update: { reason, status: "PENDING", reviewNote: null, reviewedById: null, reviewedAt: null },
    create: {
      sessionId,
      userId,
      reason,
      attendanceId: attendance?.id ?? null,
    },
  });
}

export async function reviewExcuse(
  excuseId: string,
  reviewerId: string,
  decision: "APPROVED" | "REJECTED",
  reviewNote?: string,
  allowOverride = false
) {
  const excuse = await db.attendanceExcuse.findUnique({
    where: { id: excuseId },
  });
  if (!excuse) throw new Error("Excuse not found.");
  if (excuse.status !== "PENDING" && !allowOverride) {
    throw new Error("Excuse has already been reviewed.");
  }

  return db.attendanceExcuse.update({
    where: { id: excuseId },
    data: {
      status: decision,
      reviewedById: reviewerId,
      reviewedAt: new Date(),
      reviewNote: reviewNote ?? null,
    },
  });
}
