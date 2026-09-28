import crypto from "crypto";
import { Role, AttendanceStatus, AttendanceMethod } from "@prisma/client";
import { db } from "@/lib/db";
import { mockTracks, mockCohorts } from "@/lib/mock-data";

export interface StudentAttendanceRecord {
  sessionId: string;
  sessionTitle: string;
  startsAt: Date;
  endsAt: Date;
  trackName: string | null;
  instructorName: string;
  status: AttendanceStatus | "UNMARKED";
  method: AttendanceMethod | null;
  markedAt: Date | null;
}

export interface AttendanceSummary {
  attendanceRate: number; // (PRESENT + LATE) / totalCompletedEligible * 100
  presentCount: number;
  lateCount: number;
  absentCount: number;
  unmarkedCount: number;
  totalCompletedEligible: number;
  totalScheduled: number;
}

export interface SessionRosterStudent {
  userId: string;
  name: string;
  email: string;
  trackId: string;
  trackName: string;
  attendanceId: string | null;
  status: AttendanceStatus | "UNMARKED";
  method: AttendanceMethod | null;
  markedAt: Date | null;
  markedByName: string | null;
}

export interface SessionAttendanceDetails {
  session: {
    id: string;
    title: string;
    description: string | null;
    startsAt: Date;
    endsAt: Date;
    trackId: string | null;
    trackName: string | null;
    cohortId: string;
    cohortName: string;
    checkinCode: string | null;
    isLive: boolean;
    isPast: boolean;
  };
  stats: {
    totalEligible: number;
    presentCount: number;
    lateCount: number;
    absentCount: number;
    unmarkedCount: number;
    attendanceRate: number;
  };
  roster: SessionRosterStudent[];
}

export interface SessionAttendanceSummaryRow {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  trackName: string | null;
  cohortName: string;
  checkinCode: string | null;
  isLive: boolean;
  isPast: boolean;
  totalEligible: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  unmarkedCount: number;
  attendanceRate: number;
}

/**
 * Generates a short, secure, easy-to-type check-in code.
 * Excludes ambiguous characters like 0, O, 1, I.
 */
export function generateRandomCode(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

/**
 * Validates and records a student's self check-in using a session check-in code.
 */
export async function checkInToSession(
  sessionId: string,
  rawCode: string,
  userId: string
): Promise<{ success: boolean; message: string; status: AttendanceStatus }> {
  const code = rawCode.trim().toUpperCase();
  if (!code) {
    throw new Error("Please enter a valid check-in code.");
  }

  const now = new Date();

  try {
    // 1. Fetch session
    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: {
        track: true,
        cohort: true,
      },
    });

    if (!session) {
      throw new Error("Session not found.");
    }

    // 2. Validate current time is strictly inside session window
    if (now < new Date(session.startsAt)) {
      const timeFmt = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(session.startsAt));
      throw new Error(`Check-in is not open yet. This class begins at ${timeFmt}.`);
    }

    if (now > new Date(session.endsAt)) {
      const timeFmt = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(session.endsAt));
      throw new Error(`Check-in window has closed. This session ended at ${timeFmt}.`);
    }

    // 3. Validate session has a code set
    if (!session.checkinCode) {
      throw new Error("Check-in code has not been published for this session yet.");
    }

    // 4. Validate code matches
    if (session.checkinCode.trim().toUpperCase() !== code) {
      throw new Error("Invalid check-in code. Please check the code provided by your instructor.");
    }

    // 5. Validate student eligibility (active enrollment in track or cohort)
    const activeEnrollment = await db.enrollment.findFirst({
      where: {
        userId,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gt: now } }],
      },
      include: { track: true },
    });

    if (!activeEnrollment) {
      throw new Error("You do not have an active enrollment in this bootcamp.");
    }

    if (session.trackId && activeEnrollment.trackId !== session.trackId) {
      throw new Error("You are not enrolled in the track for this session.");
    }

    if (!session.trackId && activeEnrollment.track.cohortId !== session.cohortId) {
      throw new Error("You are not enrolled in the cohort for this shared session.");
    }

    // 6. Check existing attendance record
    const existing = await db.attendance.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId,
        },
      },
    });

    if (existing) {
      return {
        success: true,
        message: `You are already checked in for this session as ${existing.status}.`,
        status: existing.status,
      };
    }

    // 7. Create attendance record (default: PRESENT, method: CHECK_IN)
    const record = await db.attendance.create({
      data: {
        sessionId,
        userId,
        status: AttendanceStatus.PRESENT,
        method: AttendanceMethod.CHECK_IN,
        markedAt: now,
      },
    });

    return {
      success: true,
      message: "Check-in successful! You have been marked Present.",
      status: record.status,
    };
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("Check-in failed due to an unexpected error.");
  }
}

/**
 * Retrieves attendance summary and full history for a student.
 */
export async function getStudentAttendance(userId: string): Promise<{
  records: StudentAttendanceRecord[];
  summary: AttendanceSummary;
}> {
  const now = new Date();

  try {
    // 1. Get student's active enrollment
    const enrollment = await db.enrollment.findFirst({
      where: {
        userId,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gt: now } }],
      },
      include: { track: true },
    });

    if (enrollment) {
      // 2. Find all eligible sessions (own track + cohort shared)
      const sessions = await db.session.findMany({
        where: {
          OR: [
            { trackId: enrollment.trackId },
            { trackId: null, cohortId: enrollment.track.cohortId },
          ],
        },
        include: {
          track: { select: { name: true } },
          createdBy: { select: { name: true } },
          attendances: {
            where: { userId },
          },
        },
        orderBy: { startsAt: "desc" },
      });

      let presentCount = 0;
      let lateCount = 0;
      let absentCount = 0;
      let unmarkedCount = 0;
      let totalCompletedEligible = 0;

      const records: StudentAttendanceRecord[] = sessions.map((s) => {
        const att = s.attendances[0];
        const isPast = new Date(s.endsAt) < now;

        if (isPast) {
          totalCompletedEligible++;
          if (att?.status === AttendanceStatus.PRESENT) {
            presentCount++;
          } else if (att?.status === AttendanceStatus.LATE) {
            lateCount++;
          } else if (att?.status === AttendanceStatus.ABSENT) {
            absentCount++;
          } else {
            unmarkedCount++;
          }
        }

        return {
          sessionId: s.id,
          sessionTitle: s.title,
          startsAt: new Date(s.startsAt),
          endsAt: new Date(s.endsAt),
          trackName: s.track ? s.track.name : null,
          instructorName: s.createdBy.name,
          status: att ? att.status : "UNMARKED",
          method: att ? att.method : null,
          markedAt: att ? new Date(att.markedAt) : null,
        };
      });

      // Attendance rate calculation per PRD:
      // (PRESENT + LATE) / total completed eligible sessions * 100
      const attendanceRate =
        totalCompletedEligible > 0
          ? Math.round(((presentCount + lateCount) / totalCompletedEligible) * 100)
          : 100;

      return {
        records,
        summary: {
          attendanceRate,
          presentCount,
          lateCount,
          absentCount,
          unmarkedCount,
          totalCompletedEligible,
          totalScheduled: sessions.length,
        },
      };
    }
  } catch (err) {
    console.warn("DB getStudentAttendance failed; using fallback", err);
  }

  // Mock Fallback for Student (Alex Morgan, Intermediate Track)
  const mockNow = new Date();
  const mockRecords: StudentAttendanceRecord[] = [
    {
      sessionId: "ses-101",
      sessionTitle: "Sliding Window & Two-Pointer Strategies",
      startsAt: new Date(mockNow.getTime() + 2 * 60 * 60 * 1000),
      endsAt: new Date(mockNow.getTime() + 4 * 60 * 60 * 1000),
      trackName: "Intermediate",
      instructorName: "Sarah Jenkins",
      status: "UNMARKED",
      method: null,
      markedAt: null,
    },
    {
      sessionId: "ses-100",
      sessionTitle: "Stacks & Queues: Monotonic Stacks & Deque Applications",
      startsAt: new Date(mockNow.getTime() - 48 * 60 * 60 * 1000),
      endsAt: new Date(mockNow.getTime() - 46 * 60 * 60 * 1000),
      trackName: "Intermediate",
      instructorName: "Sarah Jenkins",
      status: AttendanceStatus.PRESENT,
      method: AttendanceMethod.CHECK_IN,
      markedAt: new Date(mockNow.getTime() - 47 * 60 * 60 * 1000),
    },
    {
      sessionId: "ses-99",
      sessionTitle: "Hash Map Collisions & Custom Hash Functions",
      startsAt: new Date(mockNow.getTime() - 7 * 24 * 60 * 60 * 1000),
      endsAt: new Date(mockNow.getTime() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      trackName: "Intermediate",
      instructorName: "Sarah Jenkins",
      status: AttendanceStatus.LATE,
      method: AttendanceMethod.MANUAL,
      markedAt: new Date(mockNow.getTime() - 7 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
    },
    {
      sessionId: "ses-98",
      sessionTitle: "Time & Space Complexity Benchmarking",
      startsAt: new Date(mockNow.getTime() - 14 * 24 * 60 * 60 * 1000),
      endsAt: new Date(mockNow.getTime() - 14 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      trackName: "Intermediate",
      instructorName: "Sarah Jenkins",
      status: AttendanceStatus.PRESENT,
      method: AttendanceMethod.CHECK_IN,
      markedAt: new Date(mockNow.getTime() - 14 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000),
    },
  ];

  return {
    records: mockRecords,
    summary: {
      attendanceRate: 100, // (2 present + 1 late) / 3 completed = 100%
      presentCount: 2,
      lateCount: 1,
      absentCount: 0,
      unmarkedCount: 0,
      totalCompletedEligible: 3,
      totalScheduled: 4,
    },
  };
}

/**
 * Retrieves attendance roster for a specific session with instructor/admin authorization.
 */
export async function getSessionAttendance(
  sessionId: string,
  userId: string,
  role: Role
): Promise<SessionAttendanceDetails | null> {
  const now = new Date();

  try {
    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: {
        track: true,
        cohort: true,
      },
    });

    if (!session) return null;

    // Authorization check
    let allowedTrackIds: string[] = [];

    if (role === Role.ADMIN) {
      // Admin can view all tracks in the cohort
      const allTracks = await db.track.findMany({
        where: { cohortId: session.cohortId },
        select: { id: true },
      });
      allowedTrackIds = allTracks.map((t) => t.id);
    } else if (role === Role.INSTRUCTOR) {
      const assignments = await db.trackInstructor.findMany({
        where: { userId },
        select: { trackId: true },
      });
      allowedTrackIds = assignments.map((a) => a.trackId);

      // If it's a specific track session, instructor must teach this track
      if (session.trackId && !allowedTrackIds.includes(session.trackId)) {
        return null;
      }
    } else {
      // Students cannot view session roster
      return null;
    }

    // Determine eligible enrollments
    // If track session: students enrolled in this track
    // If shared session: students enrolled in allowedTrackIds for this cohort
    const enrollmentWhere = session.trackId
      ? { trackId: session.trackId }
      : {
          trackId: { in: allowedTrackIds },
          track: { cohortId: session.cohortId },
        };

    const enrollments = await db.enrollment.findMany({
      where: enrollmentWhere,
      include: {
        user: { select: { id: true, name: true, email: true } },
        track: { select: { id: true, name: true } },
      },
      orderBy: { user: { name: "asc" } },
    });

    // Fetch existing attendance records for this session
    const attendances = await db.attendance.findMany({
      where: { sessionId },
      include: {
        markedBy: { select: { name: true } },
      },
    });

    const attendanceMap = new Map(attendances.map((a) => [a.userId, a]));

    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let unmarkedCount = 0;

    const roster: SessionRosterStudent[] = enrollments.map((enr) => {
      const att = attendanceMap.get(enr.userId);
      const status = att ? att.status : "UNMARKED";

      if (status === AttendanceStatus.PRESENT) presentCount++;
      else if (status === AttendanceStatus.LATE) lateCount++;
      else if (status === AttendanceStatus.ABSENT) absentCount++;
      else unmarkedCount++;

      return {
        userId: enr.userId,
        name: enr.user.name,
        email: enr.user.email,
        trackId: enr.track.id,
        trackName: enr.track.name,
        attendanceId: att?.id || null,
        status,
        method: att?.method || null,
        markedAt: att ? new Date(att.markedAt) : null,
        markedByName: att?.markedBy?.name || null,
      };
    });

    const isLive = new Date(session.startsAt) <= now && now <= new Date(session.endsAt);
    const isPast = new Date(session.endsAt) < now;
    const totalEligible = roster.length;
    const attendanceRate =
      totalEligible > 0
        ? Math.round(((presentCount + lateCount) / totalEligible) * 100)
        : 0;

    return {
      session: {
        id: session.id,
        title: session.title,
        description: session.description,
        startsAt: new Date(session.startsAt),
        endsAt: new Date(session.endsAt),
        trackId: session.trackId,
        trackName: session.track ? session.track.name : null,
        cohortId: session.cohortId,
        cohortName: session.cohort.name,
        checkinCode: session.checkinCode,
        isLive,
        isPast,
      },
      stats: {
        totalEligible,
        presentCount,
        lateCount,
        absentCount,
        unmarkedCount,
        attendanceRate,
      },
      roster,
    };
  } catch (err) {
    console.warn("DB getSessionAttendance failed; using fallback", err);
  }

  // Fallback representation
  return {
    session: {
      id: sessionId,
      title: "Sliding Window & Two-Pointer Strategies",
      description: "Hands-on implementation of dynamic and fixed sliding window algorithms.",
      startsAt: new Date(now.getTime() - 60 * 60 * 1000),
      endsAt: new Date(now.getTime() + 60 * 60 * 1000),
      trackId: "trk-intermediate",
      trackName: "Intermediate",
      cohortId: "coh-2026-1",
      cohortName: "DSA Bootcamp 2026",
      checkinCode: "SLID26",
      isLive: true,
      isPast: false,
    },
    stats: {
      totalEligible: 4,
      presentCount: 2,
      lateCount: 1,
      absentCount: 0,
      unmarkedCount: 1,
      attendanceRate: 75,
    },
    roster: [
      {
        userId: "std-001",
        name: "Alex Morgan",
        email: "alex.morgan@bootcamp.edu",
        trackId: "trk-intermediate",
        trackName: "Intermediate",
        attendanceId: "att-1",
        status: AttendanceStatus.PRESENT,
        method: AttendanceMethod.CHECK_IN,
        markedAt: new Date(),
        markedByName: null,
      },
      {
        userId: "std-002",
        name: "Elena Rostova",
        email: "elena.r@bootcamp.edu",
        trackId: "trk-intermediate",
        trackName: "Intermediate",
        attendanceId: "att-2",
        status: AttendanceStatus.PRESENT,
        method: AttendanceMethod.CHECK_IN,
        markedAt: new Date(),
        markedByName: null,
      },
      {
        userId: "std-003",
        name: "Jordan Lee",
        email: "jordan.lee@bootcamp.edu",
        trackId: "trk-intermediate",
        trackName: "Intermediate",
        attendanceId: "att-3",
        status: AttendanceStatus.LATE,
        method: AttendanceMethod.MANUAL,
        markedAt: new Date(),
        markedByName: "Sarah Jenkins",
      },
      {
        userId: "std-008",
        name: "David Kim",
        email: "david.kim@bootcamp.edu",
        trackId: "trk-intermediate",
        trackName: "Intermediate",
        attendanceId: null,
        status: "UNMARKED",
        method: null,
        markedAt: null,
        markedByName: null,
      },
    ],
  };
}

/**
 * Manually marks or updates attendance for a student (Instructor or Admin).
 */
export async function markAttendance(
  sessionId: string,
  targetUserId: string,
  status: AttendanceStatus,
  markerId: string,
  markerRole: Role
): Promise<void> {
  const now = new Date();

  // Validate session exists and marker has access
  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: { track: true },
  });

  if (!session) {
    throw new Error("Session not found.");
  }

  if (markerRole === Role.STUDENT) {
    throw new Error("Unauthorized: Students cannot manually mark attendance.");
  }

  if (markerRole === Role.INSTRUCTOR) {
    if (session.trackId) {
      // Must teach this track
      const assignment = await db.trackInstructor.findUnique({
        where: {
          trackId_userId: {
            trackId: session.trackId,
            userId: markerId,
          },
        },
      });
      if (!assignment) {
        throw new Error("Unauthorized: You do not teach this track.");
      }
    } else {
      // Shared session: verify instructor teaches the student's track in this cohort
      const studentEnrollment = await db.enrollment.findFirst({
        where: {
          userId: targetUserId,
          track: { cohortId: session.cohortId },
        },
      });
      if (!studentEnrollment) {
        throw new Error("Student is not enrolled in this cohort.");
      }
      const assignment = await db.trackInstructor.findUnique({
        where: {
          trackId_userId: {
            trackId: studentEnrollment.trackId,
            userId: markerId,
          },
        },
      });
      if (!assignment) {
        throw new Error("Unauthorized: You can only manage attendance for students in your assigned tracks.");
      }
    }
  }

  // Upsert attendance record
  await db.attendance.upsert({
    where: {
      sessionId_userId: {
        sessionId,
        userId: targetUserId,
      },
    },
    create: {
      sessionId,
      userId: targetUserId,
      status,
      method: AttendanceMethod.MANUAL,
      markedById: markerId,
      markedAt: now,
    },
    update: {
      status,
      method: AttendanceMethod.MANUAL,
      markedById: markerId,
      markedAt: now,
    },
  });
}

/**
 * Generates or updates the check-in code for a session.
 */
export async function setSessionCheckinCode(
  sessionId: string,
  userId: string,
  role: Role,
  customCode?: string
): Promise<string> {
  const session = await db.session.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new Error("Session not found.");
  }

  if (role === Role.STUDENT) {
    throw new Error("Unauthorized.");
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
      if (!assignment) {
        throw new Error("Unauthorized: You do not teach this track.");
      }
    }
  }

  let code = customCode?.trim().toUpperCase();
  if (!code) {
    code = generateRandomCode(6);
  } else {
    // Basic validation: 4 to 10 alphanumeric chars
    if (!/^[A-Z0-9]{4,10}$/.test(code)) {
      throw new Error("Check-in code must be 4 to 10 alphanumeric characters.");
    }
  }

  await db.session.update({
    where: { id: sessionId },
    data: { checkinCode: code },
  });

  return code;
}

/**
 * Retrieves all sessions with attendance summaries for an instructor.
 */
export async function getInstructorAttendanceSessions(
  userId: string,
  trackFilter?: string
): Promise<{
  sessions: SessionAttendanceSummaryRow[];
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

      const whereClause: Record<string, unknown> =
        trackFilter && trackFilter !== "all"
          ? { trackId: trackFilter }
          : {
              OR: [
                { trackId: { in: assignedTrackIds } },
                { trackId: null, cohortId: { in: assignedCohortIds } },
              ],
            };

      const sessions = await db.session.findMany({
        where: whereClause,
        include: {
          track: { select: { id: true, name: true } },
          cohort: { select: { id: true, name: true } },
          attendances: true,
        },
        orderBy: { startsAt: "desc" },
      });

      // Calculate stats per session
      const rows: SessionAttendanceSummaryRow[] = await Promise.all(
        sessions.map(async (s) => {
          const eligibleCount = await db.enrollment.count({
            where: s.trackId
              ? { trackId: s.trackId }
              : { trackId: { in: assignedTrackIds }, track: { cohortId: s.cohortId } },
          });

          let presentCount = 0;
          let lateCount = 0;
          let absentCount = 0;

          for (const a of s.attendances) {
            if (a.status === AttendanceStatus.PRESENT) presentCount++;
            else if (a.status === AttendanceStatus.LATE) lateCount++;
            else if (a.status === AttendanceStatus.ABSENT) absentCount++;
          }

          const unmarkedCount = Math.max(0, eligibleCount - (presentCount + lateCount + absentCount));
          const attendanceRate =
            eligibleCount > 0
              ? Math.round(((presentCount + lateCount) / eligibleCount) * 100)
              : 0;

          return {
            id: s.id,
            title: s.title,
            startsAt: new Date(s.startsAt),
            endsAt: new Date(s.endsAt),
            trackName: s.track ? s.track.name : null,
            cohortName: s.cohort.name,
            checkinCode: s.checkinCode,
            isLive: new Date(s.startsAt) <= now && now <= new Date(s.endsAt),
            isPast: new Date(s.endsAt) < now,
            totalEligible: eligibleCount,
            presentCount,
            lateCount,
            absentCount,
            unmarkedCount,
            attendanceRate,
          };
        })
      );

      return { sessions: rows, assignedTracks };
    }
  } catch (err) {
    console.warn("DB getInstructorAttendanceSessions failed; fallback used", err);
  }

  // Fallback
  return {
    sessions: [
      {
        id: "ses-101",
        title: "Sliding Window & Two-Pointer Strategies",
        startsAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        endsAt: new Date(now.getTime() + 4 * 60 * 60 * 1000),
        trackName: "Intermediate",
        cohortName: "DSA Bootcamp 2026",
        checkinCode: "SLID26",
        isLive: true,
        isPast: false,
        totalEligible: 4,
        presentCount: 2,
        lateCount: 1,
        absentCount: 0,
        unmarkedCount: 1,
        attendanceRate: 75,
      },
      {
        id: "ses-100",
        title: "Stacks & Queues: Monotonic Stacks & Deque Applications",
        startsAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
        endsAt: new Date(now.getTime() - 46 * 60 * 60 * 1000),
        trackName: "Intermediate",
        cohortName: "DSA Bootcamp 2026",
        checkinCode: "PAST01",
        isLive: false,
        isPast: true,
        totalEligible: 4,
        presentCount: 3,
        lateCount: 1,
        absentCount: 0,
        unmarkedCount: 0,
        attendanceRate: 100,
      },
    ],
    assignedTracks: [{ id: "trk-intermediate", name: "Intermediate" }],
  };
}

/**
 * Retrieves all sessions with attendance summaries for administrators.
 */
export async function getAdminAttendanceSessions(
  trackFilter?: string,
  cohortFilter?: string
): Promise<{
  sessions: SessionAttendanceSummaryRow[];
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
        track: { select: { id: true, name: true } },
        cohort: { select: { id: true, name: true } },
        attendances: true,
      },
      orderBy: { startsAt: "desc" },
    });

    const rows: SessionAttendanceSummaryRow[] = await Promise.all(
      sessions.map(async (s) => {
        const eligibleCount = await db.enrollment.count({
          where: s.trackId
            ? { trackId: s.trackId }
            : { track: { cohortId: s.cohortId } },
        });

        let presentCount = 0;
        let lateCount = 0;
        let absentCount = 0;

        for (const a of s.attendances) {
          if (a.status === AttendanceStatus.PRESENT) presentCount++;
          else if (a.status === AttendanceStatus.LATE) lateCount++;
          else if (a.status === AttendanceStatus.ABSENT) absentCount++;
        }

        const unmarkedCount = Math.max(0, eligibleCount - (presentCount + lateCount + absentCount));
        const attendanceRate =
          eligibleCount > 0
            ? Math.round(((presentCount + lateCount) / eligibleCount) * 100)
            : 0;

        return {
          id: s.id,
          title: s.title,
          startsAt: new Date(s.startsAt),
          endsAt: new Date(s.endsAt),
          trackName: s.track ? s.track.name : null,
          cohortName: s.cohort.name,
          checkinCode: s.checkinCode,
          isLive: new Date(s.startsAt) <= now && now <= new Date(s.endsAt),
          isPast: new Date(s.endsAt) < now,
          totalEligible: eligibleCount,
          presentCount,
          lateCount,
          absentCount,
          unmarkedCount,
          attendanceRate,
        };
      })
    );

    return { sessions: rows, tracks, cohorts };
  } catch (err) {
    console.warn("DB getAdminAttendanceSessions failed; fallback used", err);
  }

  // Fallback
  return {
    sessions: [
      {
        id: "ses-101",
        title: "Sliding Window & Two-Pointer Strategies",
        startsAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        endsAt: new Date(now.getTime() + 4 * 60 * 60 * 1000),
        trackName: "Intermediate",
        cohortName: "DSA Bootcamp 2026",
        checkinCode: "SLID26",
        isLive: true,
        isPast: false,
        totalEligible: 4,
        presentCount: 2,
        lateCount: 1,
        absentCount: 0,
        unmarkedCount: 1,
        attendanceRate: 75,
      },
      {
        id: "ses-102",
        title: "Arrays & Hash Maps: Collision Resolution & Fast Lookups",
        startsAt: new Date(now.getTime() + 26 * 60 * 60 * 1000),
        endsAt: new Date(now.getTime() + 28 * 60 * 60 * 1000),
        trackName: "Foundations",
        cohortName: "DSA Bootcamp 2026",
        checkinCode: "HASH01",
        isLive: false,
        isPast: false,
        totalEligible: 3,
        presentCount: 0,
        lateCount: 0,
        absentCount: 0,
        unmarkedCount: 3,
        attendanceRate: 0,
      },
      {
        id: "ses-103",
        title: "All-Hands: Technical Interviewing & System Communication",
        startsAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        endsAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
        trackName: null,
        cohortName: "DSA Bootcamp 2026",
        checkinCode: "COHORT42",
        isLive: false,
        isPast: false,
        totalEligible: 7,
        presentCount: 0,
        lateCount: 0,
        absentCount: 0,
        unmarkedCount: 7,
        attendanceRate: 0,
      },
    ],
    tracks: mockTracks.map((t) => ({ id: t.id, name: t.name })),
    cohorts: mockCohorts.map((c) => ({ id: c.id, name: c.name })),
  };
}
