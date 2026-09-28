import { Role } from "@prisma/client";
import { db } from "@/lib/db";

export interface SessionWithDetails {
  id: string;
  cohortId: string;
  trackId: string | null;
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date;
  meetingUrl: string | null;
  recordingUrl: string | null;
  notes: string | null;
  checkinCode: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  cohort: { id: string; name: string };
  track: { id: string; name: string } | null;
  createdBy: { id: string; name: string; email: string };
}

/**
 * Retrieves sessions visible to a student:
 * - session.trackId matches active enrollment track
 * OR
 * - session.trackId is null (Shared session) AND session.cohortId matches student's cohort
 *
 * Checkin codes are strictly sanitized to null for students.
 */
export async function getStudentSessions(userId: string): Promise<{
  upcoming: SessionWithDetails[];
  past: SessionWithDetails[];
  activeTrackName: string | null;
}> {
  const now = new Date();

  // 1. Check database for active student enrollment
  const activeEnrollment = await db.enrollment.findFirst({
    where: {
      userId,
      startDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gt: now } }],
    },
    include: {
      track: true,
    },
  });

  if (!activeEnrollment) {
    return {
      upcoming: [],
      past: [],
      activeTrackName: null,
    };
  }

  const sessions = await db.session.findMany({
    where: {
      OR: [
        { trackId: activeEnrollment.trackId },
        {
          trackId: null,
          cohortId: activeEnrollment.track.cohortId,
        },
      ],
    },
    include: {
      cohort: { select: { id: true, name: true } },
      track: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { startsAt: "asc" },
  });

  const sanitizeSessionForStudent = (s: SessionWithDetails): SessionWithDetails => ({
    ...s,
    checkinCode: null,
  });

  const upcoming = sessions
    .filter((s) => new Date(s.endsAt) >= now)
    .map(sanitizeSessionForStudent);
  const past = sessions
    .filter((s) => new Date(s.endsAt) < now)
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
    .map(sanitizeSessionForStudent);

  return {
    upcoming,
    past,
    activeTrackName: activeEnrollment.track.name,
  };
}

/**
 * Retrieves sessions visible to an instructor:
 * - session.trackId belongs to instructor's assigned tracks
 * OR
 * - shared session belongs to a cohort containing an assigned track
 */
export async function getInstructorSessions(
  userId: string,
  filterTrackId?: string
): Promise<{
  upcoming: SessionWithDetails[];
  past: SessionWithDetails[];
  assignedTracks: { id: string; name: string }[];
}> {
  const now = new Date();

  const assignments = await db.trackInstructor.findMany({
    where: { userId },
    include: {
      track: { select: { id: true, name: true, cohortId: true } },
    },
  });

  if (assignments.length === 0) {
    return {
      upcoming: [],
      past: [],
      assignedTracks: [],
    };
  }

  const assignedTracks = assignments.map((a) => ({
    id: a.track.id,
    name: a.track.name,
  }));
  const assignedTrackIds = assignedTracks.map((t) => t.id);
  const cohortIds = Array.from(new Set(assignments.map((a) => a.track.cohortId)));

  const where: Record<string, unknown> = {};
  if (filterTrackId && filterTrackId !== "all") {
    if (filterTrackId === "shared") {
      where.trackId = null;
      where.cohortId = { in: cohortIds };
    } else {
      where.trackId = filterTrackId;
    }
  } else {
    where.OR = [
      { trackId: { in: assignedTrackIds } },
      { trackId: null, cohortId: { in: cohortIds } },
    ];
  }

  const sessions = await db.session.findMany({
    where,
    include: {
      cohort: { select: { id: true, name: true } },
      track: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { startsAt: "asc" },
  });

  const upcoming = sessions.filter((s) => new Date(s.endsAt) >= now);
  const past = sessions
    .filter((s) => new Date(s.endsAt) < now)
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());

  return {
    upcoming,
    past,
    assignedTracks,
  };
}

/**
 * Retrieves all sessions across the platform for Admin management views.
 */
export async function getAdminSessions(
  filterTrackId?: string,
  filterCohortId?: string
): Promise<{
  upcoming: SessionWithDetails[];
  past: SessionWithDetails[];
  tracks: { id: string; name: string }[];
  cohorts: { id: string; name: string }[];
}> {
  const now = new Date();

  const [tracks, cohorts] = await Promise.all([
    db.track.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.cohort.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const where: Record<string, unknown> = {};
  if (filterTrackId && filterTrackId !== "all") {
    if (filterTrackId === "shared") {
      where.trackId = null;
    } else {
      where.trackId = filterTrackId;
    }
  }
  if (filterCohortId && filterCohortId !== "all") {
    where.cohortId = filterCohortId;
  }

  const sessions = await db.session.findMany({
    where,
    include: {
      cohort: { select: { id: true, name: true } },
      track: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { startsAt: "asc" },
  });

  const upcoming = sessions.filter((s) => new Date(s.endsAt) >= now);
  const past = sessions
    .filter((s) => new Date(s.endsAt) < now)
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());

  return {
    upcoming,
    past,
    tracks,
    cohorts,
  };
}

/**
 * Retrieves a single session by ID with authorization verification.
 */
export async function getSessionById(
  sessionId: string,
  userId: string,
  role: Role
): Promise<SessionWithDetails | null> {
  const now = new Date();

  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: {
      cohort: { select: { id: true, name: true } },
      track: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!session) return null;

  if (role === Role.ADMIN) {
    return session;
  }

  if (role === Role.INSTRUCTOR) {
    if (session.trackId) {
      const assignment = await db.trackInstructor.findUnique({
        where: {
          trackId_userId: {
            trackId: session.trackId,
            userId,
          },
        },
      });
      if (!assignment) return null;
    } else {
      const instructorTracks = await db.trackInstructor.findMany({
        where: { userId },
        include: { track: true },
      });
      const teachesInCohort = instructorTracks.some(
        (t) => t.track.cohortId === session.cohortId
      );
      if (!teachesInCohort) return null;
    }
    return session;
  }

  if (role === Role.STUDENT) {
    const enrollment = await db.enrollment.findFirst({
      where: {
        userId,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gt: now } }],
      },
      include: { track: true },
    });

    if (!enrollment) return null;

    if (session.trackId) {
      if (session.trackId !== enrollment.trackId) return null;
    } else {
      if (session.cohortId !== enrollment.track.cohortId) return null;
    }

    return {
      ...session,
      checkinCode: null,
    };
  }

  return null;
}

/**
 * Creates a new session with server-side authorization check
 */
export async function createSession(
  data: {
    cohortId: string;
    trackId: string | null;
    title: string;
    description?: string;
    startsAt: Date;
    endsAt: Date;
    meetingUrl?: string;
    recordingUrl?: string;
    notes?: string;
  },
  userId: string,
  role: Role
): Promise<SessionWithDetails> {
  if (!data.title?.trim()) {
    throw new Error("Session title is required.");
  }
  if (!data.cohortId) {
    throw new Error("Cohort is required.");
  }
  if (data.endsAt <= data.startsAt) {
    throw new Error("Session end time must be after start time.");
  }

  if (role === Role.STUDENT) {
    throw new Error("Unauthorized: Students cannot create sessions.");
  }

  if (role === Role.INSTRUCTOR) {
    if (data.trackId) {
      const assignment = await db.trackInstructor.findUnique({
        where: {
          trackId_userId: {
            trackId: data.trackId,
            userId,
          },
        },
      });
      if (!assignment) {
        throw new Error("Unauthorized: You are not assigned to this track.");
      }
    } else {
      const assignments = await db.trackInstructor.findMany({
        where: { userId },
        include: { track: true },
      });
      const hasCohort = assignments.some(
        (a) => a.track.cohortId === data.cohortId
      );
      if (!hasCohort) {
        throw new Error("Unauthorized: You cannot create shared sessions for this cohort.");
      }
    }
  }

  const session = await db.session.create({
    data: {
      cohortId: data.cohortId,
      trackId: data.trackId,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      meetingUrl: data.meetingUrl?.trim() || null,
      recordingUrl: data.recordingUrl?.trim() || null,
      notes: data.notes?.trim() || null,
      createdById: userId,
    },
    include: {
      cohort: { select: { id: true, name: true } },
      track: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return session;
}

/**
 * Updates an existing session with server-side authorization check
 */
export async function updateSession(
  sessionId: string,
  data: {
    title: string;
    description?: string;
    startsAt: Date;
    endsAt: Date;
    meetingUrl?: string;
    recordingUrl?: string;
    notes?: string;
    cohortId: string;
    trackId: string | null;
  },
  userId: string,
  role: Role
): Promise<SessionWithDetails> {
  const existing = await getSessionById(sessionId, userId, role);
  if (!existing) {
    throw new Error("Session not found or unauthorized.");
  }

  if (role === Role.STUDENT) {
    throw new Error("Unauthorized: Students cannot update sessions.");
  }

  if (role === Role.INSTRUCTOR) {
    if (data.trackId && data.trackId !== existing.trackId) {
      const assignment = await db.trackInstructor.findUnique({
        where: {
          trackId_userId: {
            trackId: data.trackId,
            userId,
          },
        },
      });
      if (!assignment) {
        throw new Error("Unauthorized: You cannot assign session to an unassigned track.");
      }
    }
  }

  const updated = await db.session.update({
    where: { id: sessionId },
    data: {
      title: data.title.trim(),
      description: data.description?.trim() || null,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      meetingUrl: data.meetingUrl?.trim() || null,
      recordingUrl: data.recordingUrl?.trim() || null,
      notes: data.notes?.trim() || null,
      cohortId: data.cohortId,
      trackId: data.trackId,
    },
    include: {
      cohort: { select: { id: true, name: true } },
      track: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return updated;
}

/**
 * Deletes a session safely without destroying historical attendance records
 */
export async function deleteSession(
  sessionId: string,
  userId: string,
  role: Role
): Promise<void> {
  const existing = await getSessionById(sessionId, userId, role);
  if (!existing) {
    throw new Error("Session not found or unauthorized.");
  }

  if (role === Role.STUDENT) {
    throw new Error("Unauthorized: Students cannot delete sessions.");
  }

  const attendanceCount = await db.attendance.count({
    where: { sessionId },
  });

  if (attendanceCount > 0) {
    throw new Error(
      "Cannot delete this session because historical attendance records exist. Deleting this session would destroy attendance history."
    );
  }

  await db.session.delete({
    where: { id: sessionId },
  });
}
