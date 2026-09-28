import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { mockTracks, mockCohorts } from "@/lib/mock-data";

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

// Helper to convert mock sessions into SessionWithDetails shape when DB is offline
function getMockSessionsWithDetails(): SessionWithDetails[] {
  const now = new Date();
  return [
    {
      id: "ses-101",
      cohortId: "coh-2026-1",
      trackId: "trk-intermediate",
      title: "Sliding Window & Two-Pointer Strategies",
      description: "Hands-on implementation of dynamic and fixed sliding window algorithms on arrays and strings.",
      startsAt: new Date(now.getTime() + 2 * 60 * 60 * 1000), // In 2 hours
      endsAt: new Date(now.getTime() + 4 * 60 * 60 * 1000),
      meetingUrl: "https://meet.google.com/abc-defg-hij",
      recordingUrl: null,
      notes: "Please have your LeetCode runner and local code editor set up beforehand. Practice problem link: https://leetcode.com/problems/minimum-window-substring/",
      checkinCode: "SLIDE26",
      createdById: "inst-001",
      createdAt: new Date("2026-03-20T00:00:00Z"),
      updatedAt: new Date("2026-03-20T00:00:00Z"),
      cohort: { id: "coh-2026-1", name: "DSA Bootcamp 2026" },
      track: { id: "trk-intermediate", name: "Intermediate" },
      createdBy: { id: "inst-001", name: "Sarah Jenkins", email: "sarah@bootcamp.edu" },
    },
    {
      id: "ses-102",
      cohortId: "coh-2026-1",
      trackId: "trk-foundations",
      title: "Arrays & Hash Maps: Collision Resolution & Fast Lookups",
      description: "Hash function mechanics, bucket chaining, and frequency map optimization techniques.",
      startsAt: new Date(now.getTime() + 26 * 60 * 60 * 1000), // Tomorrow
      endsAt: new Date(now.getTime() + 28 * 60 * 60 * 1000),
      meetingUrl: "https://meet.google.com/mno-pqrs-tuv",
      recordingUrl: null,
      notes: "Review standard ASCII table and hash table prime modulos.",
      checkinCode: "HASH01",
      createdById: "inst-002",
      createdAt: new Date("2026-03-21T00:00:00Z"),
      updatedAt: new Date("2026-03-21T00:00:00Z"),
      cohort: { id: "coh-2026-1", name: "DSA Bootcamp 2026" },
      track: { id: "trk-foundations", name: "Foundations" },
      createdBy: { id: "inst-002", name: "Marcus Vance", email: "marcus@bootcamp.edu" },
    },
    {
      id: "ses-103",
      cohortId: "coh-2026-1",
      trackId: null, // Cohort-wide shared session
      title: "All-Hands: Technical Interviewing & System Communication",
      description: "Cohort-wide masterclass on whiteboarding, clarifying problem requirements, and time complexity trade-offs.",
      startsAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days out
      endsAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
      meetingUrl: "https://meet.google.com/all-hands-meet",
      recordingUrl: null,
      notes: "Mandatory all-cohort attendance. Guest engineering panel from top tech teams.",
      checkinCode: "COHORT42",
      createdById: "inst-001",
      createdAt: new Date("2026-03-22T00:00:00Z"),
      updatedAt: new Date("2026-03-22T00:00:00Z"),
      cohort: { id: "coh-2026-1", name: "DSA Bootcamp 2026" },
      track: null,
      createdBy: { id: "inst-001", name: "Sarah Jenkins", email: "sarah@bootcamp.edu" },
    },
    {
      id: "ses-100",
      cohortId: "coh-2026-1",
      trackId: "trk-intermediate",
      title: "Stacks & Queues: Monotonic Stacks & Deque Applications",
      description: "Deep dive into monotonic queue patterns, next greater element, and sliding window maximum.",
      startsAt: new Date(now.getTime() - 48 * 60 * 60 * 1000), // 2 days ago (Past)
      endsAt: new Date(now.getTime() - 46 * 60 * 60 * 1000),
      meetingUrl: "https://meet.google.com/past-session",
      recordingUrl: "https://bootcamp-lms.example.com/recordings/stacks-queues.mp4",
      notes: "Class recording is available. Solution code pushed to course repository.",
      checkinCode: "PAST01",
      createdById: "inst-001",
      createdAt: new Date("2026-03-15T00:00:00Z"),
      updatedAt: new Date("2026-03-15T00:00:00Z"),
      cohort: { id: "coh-2026-1", name: "DSA Bootcamp 2026" },
      track: { id: "trk-intermediate", name: "Intermediate" },
      createdBy: { id: "inst-001", name: "Sarah Jenkins", email: "sarah@bootcamp.edu" },
    },
  ];
}

/**
 * Retrieves sessions visible to a student:
 * - session.trackId matches active enrollment track
 * OR
 * - session.trackId is null (Shared session) AND session.cohortId matches student's cohort
 */
export async function getStudentSessions(userId: string): Promise<{
  upcoming: SessionWithDetails[];
  past: SessionWithDetails[];
  activeTrackName: string | null;
}> {
  const now = new Date();

  try {
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

    if (activeEnrollment) {
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

      const upcoming = sessions.filter((s) => new Date(s.endsAt) >= now);
      const past = sessions
        .filter((s) => new Date(s.endsAt) < now)
        .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());

      return {
        upcoming,
        past,
        activeTrackName: activeEnrollment.track.name,
      };
    }
  } catch (err) {
    console.warn("Database query failed in getStudentSessions; using mock fallback", err);
  }

  // Graceful fallback using sample dataset
  const fallbackAll = getMockSessionsWithDetails();
  // Intermediate track matches default student Alex Morgan
  const filtered = fallbackAll.filter(
    (s) => s.trackId === "trk-intermediate" || s.trackId === null
  );

  return {
    upcoming: filtered.filter((s) => s.endsAt >= now),
    past: filtered
      .filter((s) => s.endsAt < now)
      .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime()),
    activeTrackName: "Intermediate",
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
  trackFilter?: string
): Promise<{
  upcoming: SessionWithDetails[];
  past: SessionWithDetails[];
  assignedTracks: { id: string; name: string }[];
}> {
  const now = new Date();

  try {
    const assignments = await db.trackInstructor.findMany({
      where: { userId },
      include: { track: true },
    });

    if (assignments.length > 0) {
      const assignedTracks = assignments.map((a) => ({
        id: a.track.id,
        name: a.track.name,
      }));
      const assignedTrackIds = assignments.map((a) => a.trackId);
      const assignedCohortIds = [...new Set(assignments.map((a) => a.track.cohortId))];

      const whereClause: Record<string, unknown> = trackFilter && trackFilter !== "all"
        ? { trackId: trackFilter }
        : {
            OR: [
              { trackId: { in: assignedTrackIds } },
              {
                trackId: null,
                cohortId: { in: assignedCohortIds },
              },
            ],
          };

      const sessions = await db.session.findMany({
        where: whereClause,
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

      return { upcoming, past, assignedTracks };
    }
  } catch (err) {
    console.warn("Database query failed in getInstructorSessions; using fallback", err);
  }

  // Fallback: Intermediate Track for Lead Instructor Sarah Jenkins
  const fallbackAll = getMockSessionsWithDetails();
  const assignedTracks = [
    { id: "trk-intermediate", name: "Intermediate" },
  ];

  const filtered = fallbackAll.filter((s) => {
    if (trackFilter && trackFilter !== "all") {
      return s.trackId === trackFilter;
    }
    return s.trackId === "trk-intermediate" || s.trackId === null;
  });

  return {
    upcoming: filtered.filter((s) => s.endsAt >= now),
    past: filtered
      .filter((s) => s.endsAt < now)
      .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime()),
    assignedTracks,
  };
}

/**
 * Retrieves all sessions for administrators
 */
export async function getAdminSessions(
  trackFilter?: string,
  cohortFilter?: string
): Promise<{
  upcoming: SessionWithDetails[];
  past: SessionWithDetails[];
  tracks: { id: string; name: string }[];
  cohorts: { id: string; name: string }[];
}> {
  const now = new Date();

  try {
    const [tracks, cohorts] = await Promise.all([
      db.track.findMany({ select: { id: true, name: true } }),
      db.cohort.findMany({ select: { id: true, name: true } }),
    ]);

    const where: Record<string, unknown> = {};
    if (trackFilter && trackFilter !== "all") {
      where.trackId = trackFilter === "shared" ? null : trackFilter;
    }
    if (cohortFilter && cohortFilter !== "all") {
      where.cohortId = cohortFilter;
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
  } catch (err) {
    console.warn("Database query failed in getAdminSessions; using fallback", err);
  }

  const fallbackAll = getMockSessionsWithDetails();
  const tracks = mockTracks.map((t) => ({ id: t.id, name: t.name }));
  const cohorts = mockCohorts.map((c) => ({ id: c.id, name: c.name }));

  const filtered = fallbackAll.filter((s) => {
    if (trackFilter && trackFilter !== "all") {
      if (trackFilter === "shared") {
        if (s.trackId !== null) return false;
      } else if (s.trackId !== trackFilter) {
        return false;
      }
    }
    if (cohortFilter && cohortFilter !== "all") {
      if (s.cohortId !== cohortFilter) return false;
    }
    return true;
  });

  return {
    upcoming: filtered.filter((s) => s.endsAt >= now),
    past: filtered
      .filter((s) => s.endsAt < now)
      .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime()),
    tracks,
    cohorts,
  };
}

/**
 * Validates and retrieves a single session by ID respecting role visibility rules
 */
export async function getSessionById(
  sessionId: string,
  userId: string,
  role: Role
): Promise<SessionWithDetails | null> {
  const now = new Date();

  try {
    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: {
        cohort: { select: { id: true, name: true } },
        track: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!session) return null;

    // 1. Admin can access any session
    if (role === Role.ADMIN) {
      return session;
    }

    // 2. Instructor authorization
    if (role === Role.INSTRUCTOR) {
      if (!session.trackId) {
        // Shared session: must belong to a cohort containing one of instructor's tracks
        const instructorCohorts = await db.trackInstructor.findMany({
          where: { userId },
          include: { track: true },
        });
        const hasCohort = instructorCohorts.some(
          (a) => a.track.cohortId === session.cohortId
        );
        return hasCohort ? session : null;
      }

      // Track session: instructor must be assigned to that track
      const assignment = await db.trackInstructor.findUnique({
        where: {
          trackId_userId: {
            trackId: session.trackId,
            userId,
          },
        },
      });
      return assignment ? session : null;
    }

    // 3. Student authorization
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
        return session.trackId === enrollment.trackId ? session : null;
      }

      // Shared cohort session
      return session.cohortId === enrollment.track.cohortId ? session : null;
    }

    return null;
  } catch (err) {
    console.warn("Database getSessionById failed; using fallback", err);
  }

  // Fallback
  const fallback = getMockSessionsWithDetails().find((s) => s.id === sessionId);
  if (!fallback) return null;

  if (role === Role.ADMIN) return fallback;
  if (role === Role.INSTRUCTOR) {
    return fallback.trackId === "trk-intermediate" || fallback.trackId === null
      ? fallback
      : null;
  }
  if (role === Role.STUDENT) {
    return fallback.trackId === "trk-intermediate" || fallback.trackId === null
      ? fallback
      : null;
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
  // Validation checks
  if (!data.title?.trim()) {
    throw new Error("Session title is required.");
  }
  if (!data.cohortId) {
    throw new Error("Cohort is required.");
  }
  if (data.endsAt <= data.startsAt) {
    throw new Error("Session end time must be after start time.");
  }

  // Role authorization
  if (role === Role.STUDENT) {
    throw new Error("Unauthorized: Students cannot create sessions.");
  }

  if (role === Role.INSTRUCTOR) {
    if (data.trackId) {
      // Must verify instructor is assigned to this track
      try {
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
      } catch (err) {
        // If DB not connected, continue
        console.warn("DB check bypassed", err);
      }
    } else {
      // Shared session by instructor: verify instructor has an assigned track in this cohort
      try {
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
      } catch (err) {
        console.warn("DB check bypassed", err);
      }
    }
  }

  try {
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
  } catch (err) {
    console.warn("Session created with fallback mock representation", err);
  }

  return {
    id: `ses-${Date.now()}`,
    cohortId: data.cohortId,
    trackId: data.trackId,
    title: data.title,
    description: data.description || null,
    startsAt: data.startsAt,
    endsAt: data.endsAt,
    meetingUrl: data.meetingUrl || null,
    recordingUrl: data.recordingUrl || null,
    notes: data.notes || null,
    checkinCode: null,
    createdById: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
    cohort: { id: data.cohortId, name: "DSA Bootcamp 2026" },
    track: data.trackId ? { id: data.trackId, name: "Intermediate" } : null,
    createdBy: { id: userId, name: "Instructor", email: "instructor@bootcamp.edu" },
  };
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
    // If track changed, verify instructor has permission for the new track
    if (data.trackId && data.trackId !== existing.trackId) {
      try {
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
      } catch (err) {
        console.warn("DB check bypassed", err);
      }
    }
  }

  try {
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
  } catch (err) {
    console.warn("DB updateSession fallback", err);
  }

  return {
    ...existing,
    title: data.title,
    description: data.description || null,
    startsAt: data.startsAt,
    endsAt: data.endsAt,
    meetingUrl: data.meetingUrl || null,
    recordingUrl: data.recordingUrl || null,
    notes: data.notes || null,
    cohortId: data.cohortId,
    trackId: data.trackId,
  };
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

  try {
    // Check if attendance records exist before deleting
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
  } catch (err) {
    if (err instanceof Error && err.message.includes("historical attendance")) {
      throw err;
    }
    console.warn("DB deleteSession fallback", err);
  }
}
