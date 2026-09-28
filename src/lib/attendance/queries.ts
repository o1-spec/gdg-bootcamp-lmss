import crypto from "crypto";
import { Role, AttendanceStatus, AttendanceMethod, ExcuseStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit/logger";

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
  excuseId?: string | null;
  excuseStatus?: ExcuseStatus | null;
  excuseReason?: string | null;
  excuseReviewNote?: string | null;
}

export interface AttendanceSummary {
  attendanceRate: number | null; // (PRESENT + LATE) / totalCompletedEligible * 100, null if 0 eligible
  presentCount: number;
  lateCount: number;
  absentCount: number;
  unmarkedCount: number;
  approvedExcusedCount: number;
  totalCompletedSessions: number;
  totalCompletedEligible: number; // completed sessions minus approved excused absences
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
}

/**
 * Retrieves attendance summary and full history for a student.
 */
export async function getStudentAttendance(userId: string): Promise<{
  records: StudentAttendanceRecord[];
  summary: AttendanceSummary;
}> {
  const now = new Date();

  // 1. Get student's active enrollment
  const enrollment = await db.enrollment.findFirst({
    where: {
      userId,
      startDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gt: now } }],
    },
    include: { track: true },
  });

  if (!enrollment) {
    return {
      records: [],
      summary: {
        attendanceRate: null,
        presentCount: 0,
        lateCount: 0,
        absentCount: 0,
        unmarkedCount: 0,
        approvedExcusedCount: 0,
        totalCompletedSessions: 0,
        totalCompletedEligible: 0,
        totalScheduled: 0,
      },
    };
  }

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
    },
    orderBy: { startsAt: "desc" },
  });

  const sessionIds = sessions.map((s) => s.id);

  // 3. Find student's attendance records and submitted excuses
  const [attendances, excuses] = await Promise.all([
    db.attendance.findMany({
      where: {
        userId,
        sessionId: { in: sessionIds },
      },
    }),
    db.attendanceExcuse.findMany({
      where: {
        userId,
        sessionId: { in: sessionIds },
      },
    }),
  ]);

  const attendanceMap = new Map(attendances.map((a) => [a.sessionId, a]));
  const excuseMap = new Map(excuses.map((e) => [e.sessionId, e]));

  let presentCount = 0;
  let lateCount = 0;
  let absentCount = 0;
  let unmarkedCount = 0;
  let totalCompletedSessions = 0;
  let approvedExcusedCount = 0;

  const records: StudentAttendanceRecord[] = sessions.map((sess) => {
    const isCompleted = new Date(sess.endsAt) < now;
    const att = attendanceMap.get(sess.id);
    const excuse = excuseMap.get(sess.id);

    let status: AttendanceStatus | "UNMARKED" = "UNMARKED";
    let method: AttendanceMethod | null = null;
    let markedAt: Date | null = null;

    if (att) {
      status = att.status;
      method = att.method;
      markedAt = new Date(att.markedAt);
    }

    if (isCompleted) {
      totalCompletedSessions++;
      if (excuse?.status === "APPROVED") {
        approvedExcusedCount++;
      }

      if (status === AttendanceStatus.PRESENT) presentCount++;
      else if (status === AttendanceStatus.LATE) lateCount++;
      else if (status === AttendanceStatus.ABSENT) absentCount++;
      else unmarkedCount++;
    }

    return {
      sessionId: sess.id,
      sessionTitle: sess.title,
      startsAt: new Date(sess.startsAt),
      endsAt: new Date(sess.endsAt),
      trackName: sess.track ? sess.track.name : null,
      instructorName: sess.createdBy.name,
      status,
      method,
      markedAt,
      excuseId: excuse?.id ?? null,
      excuseStatus: excuse?.status ?? null,
      excuseReason: excuse?.reason ?? null,
      excuseReviewNote: excuse?.reviewNote ?? null,
    };
  });

  /**
   * ATTENDANCE CALCULATION POLICY:
   * eligible completed sessions = completed sessions minus approved excused absences
   * attendance rate = (PRESENT + LATE) / eligible completed sessions * 100
   * If there are zero eligible sessions, attendanceRate is null (no percentage shown).
   */
  const totalCompletedEligible = Math.max(0, totalCompletedSessions - approvedExcusedCount);
  const attendanceRate =
    totalCompletedEligible > 0
      ? Math.round(((presentCount + lateCount) / totalCompletedEligible) * 100)
      : null;

  return {
    records,
    summary: {
      attendanceRate,
      presentCount,
      lateCount,
      absentCount,
      unmarkedCount,
      approvedExcusedCount,
      totalCompletedSessions,
      totalCompletedEligible,
      totalScheduled: sessions.length,
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

    if (session.trackId && !allowedTrackIds.includes(session.trackId)) {
      return null;
    }
  } else {
    return null;
  }

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

  audit(markerId, "ATTENDANCE_MARKED", "Session", sessionId, {
    targetUserId,
    status,
    method: "MANUAL",
  });
}

/**
 * Generates or updates the check-in code for a session (Instructor or Admin).
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
    throw new Error("Unauthorized: Students cannot set check-in codes.");
  }

  if (role === Role.INSTRUCTOR && session.trackId) {
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

  const code = customCode ? customCode.trim().toUpperCase() : generateRandomCode(6);

  await db.session.update({
    where: { id: sessionId },
    data: { checkinCode: code },
  });

  return code;
}

/**
 * Retrieves all sessions with attendance summaries for instructors.
 */
export async function getInstructorAttendanceSessions(
  userId: string,
  filterTrackId?: string
): Promise<{
  sessions: SessionAttendanceSummaryRow[];
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
    return { sessions: [], assignedTracks: [] };
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
      track: { select: { id: true, name: true } },
      cohort: { select: { id: true, name: true } },
      attendances: true,
    },
    orderBy: { startsAt: "desc" },
  });

  const rows: SessionAttendanceSummaryRow[] = await Promise.all(
    sessions.map(async (sess) => {
      const isLive = new Date(sess.startsAt) <= now && now <= new Date(sess.endsAt);
      const isPast = new Date(sess.endsAt) < now;

      const totalEligible = await db.enrollment.count({
        where: sess.trackId
          ? { trackId: sess.trackId }
          : { trackId: { in: assignedTrackIds } },
      });

      let presentCount = 0;
      let lateCount = 0;
      let absentCount = 0;

      for (const att of sess.attendances) {
        if (att.status === AttendanceStatus.PRESENT) presentCount++;
        else if (att.status === AttendanceStatus.LATE) lateCount++;
        else if (att.status === AttendanceStatus.ABSENT) absentCount++;
      }

      const unmarkedCount = Math.max(0, totalEligible - (presentCount + lateCount + absentCount));
      const attendanceRate =
        totalEligible > 0
          ? Math.round(((presentCount + lateCount) / totalEligible) * 100)
          : 0;

      return {
        id: sess.id,
        title: sess.title,
        startsAt: new Date(sess.startsAt),
        endsAt: new Date(sess.endsAt),
        trackName: sess.track ? sess.track.name : null,
        cohortName: sess.cohort.name,
        checkinCode: sess.checkinCode,
        isLive,
        isPast,
        totalEligible,
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

  const [tracks, cohorts] = await Promise.all([
    db.track.findMany({ select: { id: true, name: true } }),
    db.cohort.findMany({ select: { id: true, name: true } }),
  ]);

  const where: Record<string, unknown> = {};
  if (trackFilter && trackFilter !== "all") {
    if (trackFilter === "shared") {
      where.trackId = null;
    } else {
      where.trackId = trackFilter;
    }
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
    sessions.map(async (sess) => {
      const isLive = new Date(sess.startsAt) <= now && now <= new Date(sess.endsAt);
      const isPast = new Date(sess.endsAt) < now;

      const totalEligible = await db.enrollment.count({
        where: sess.trackId
          ? { trackId: sess.trackId }
          : { track: { cohortId: sess.cohortId } },
      });

      let presentCount = 0;
      let lateCount = 0;
      let absentCount = 0;

      for (const att of sess.attendances) {
        if (att.status === AttendanceStatus.PRESENT) presentCount++;
        else if (att.status === AttendanceStatus.LATE) lateCount++;
        else if (att.status === AttendanceStatus.ABSENT) absentCount++;
      }

      const unmarkedCount = Math.max(0, totalEligible - (presentCount + lateCount + absentCount));
      const attendanceRate =
        totalEligible > 0
          ? Math.round(((presentCount + lateCount) / totalEligible) * 100)
          : 0;

      return {
        id: sess.id,
        title: sess.title,
        startsAt: new Date(sess.startsAt),
        endsAt: new Date(sess.endsAt),
        trackName: sess.track ? sess.track.name : null,
        cohortName: sess.cohort.name,
        checkinCode: sess.checkinCode,
        isLive,
        isPast,
        totalEligible,
        presentCount,
        lateCount,
        absentCount,
        unmarkedCount,
        attendanceRate,
      };
    })
  );

  return { sessions: rows, tracks, cohorts };
}
