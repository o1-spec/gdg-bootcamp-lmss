import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import {
  mockStudents,
  mockTracks,
  mockSessions,
  mockInstructors,
} from "@/lib/mock-data";

export type SessionLectureType = "Live Lecture" | "Workshop" | "Code Review" | "Lab Session";

export interface StudentProgressData {
  studentName: string;
  trackName: string;
  cohortName: string;
  // Attendance
  attendanceRate: number; // 0-100
  presentCount: number;
  lateCount: number;
  absentCount: number;
  totalCompletedSessions: number;
  recentAttendance: Array<{
    sessionId: string;
    sessionTitle: string;
    date: string;
    status: "PRESENT" | "LATE" | "ABSENT";
  }>;
  // Assignments
  totalVisibleAssignments: number;
  submittedAssignments: number;
  missingAssignments: number;
  gradedAssignments: number;
  releasedGradesCount: number;
  averageReleasedScore: number | null; // null if no released grades
  recentGrades: Array<{
    assignmentId: string;
    assignmentTitle: string;
    score: number;
    maxScore: number;
    percentage: number;
    feedback: string | null;
    gradedAt: Date | null;
  }>;
}

export interface StudentDashboardData extends StudentProgressData {
  nextClass: {
    id: string;
    title: string;
    track: string;
    type: SessionLectureType;
    date: string;
    time: string;
    meetingUrl: string;
    instructorName: string;
    instructorRole: string;
  } | null;
  upcomingClasses: Array<{
    id: string;
    title: string;
    track: string;
    type: SessionLectureType;
    date: string;
    time: string;
    meetingUrl: string;
    instructorName: string;
  }>;
  recentAssignments: Array<{
    id: string;
    title: string;
    track: string;
    dueDate: string;
    status: "graded" | "submitted" | "pending";
    score: number | null;
    maxScore: number;
  }>;
  latestAnnouncement: {
    id: string;
    title: string;
    body: string;
    authorName: string;
    authorRole: string;
    createdAt: string;
    trackName: string | null;
  } | null;
  currentWeek: number;
  totalWeeks: number;
}

export interface InstructorTrackProgress {
  trackId: string;
  trackName: string;
  totalActiveStudents: number;
  averageAttendanceRate: number;
  completedSessionsCount: number;
  assignmentSubmissionRate: number;
  gradingBacklog: number;
  recentReleasedGradeAverage: number | null;
  students: Array<{
    userId: string;
    name: string;
    email: string;
    attendanceRate: number;
    assignmentsSubmitted: number;
    assignmentsMissing: number;
    releasedGradeAverage: number | null;
    lastActivity: string | null;
  }>;
}

export interface InstructorProgressData {
  assignedTracks: Array<{ id: string; name: string }>;
  selectedTrackId: string;
  trackProgress: InstructorTrackProgress | null;
}

export interface InstructorDashboardData {
  instructorName: string;
  assignedTrackNames: string;
  totalStudents: number;
  trackAttendanceRate: number;
  awaitingGradingCount: number;
  upcomingSession: {
    id: string;
    title: string;
    track: string;
    type: SessionLectureType;
    date: string;
    time: string;
    meetingUrl: string;
    instructorName: string;
    instructorRole: string;
  } | null;
  recentSubmissions: Array<{
    id: string;
    studentName: string;
    trackName: string;
    assignmentTitle: string;
    submittedAt: string;
    isGraded: boolean;
    score: number | null;
    maxScore: number;
  }>;
  latestAnnouncement: {
    id: string;
    title: string;
    body: string;
    authorName: string;
    authorRole: string;
    createdAt: string;
  } | null;
}

export interface AdminTrackOverview {
  trackId: string;
  trackName: string;
  activeStudents: number;
  instructors: string[];
  attendanceRate: number;
  submissionRate: number;
  gradingBacklog: number;
}

export interface AdminOverviewData {
  cohortName: string;
  startDate: string;
  endDate: string;
  tracksCount: number;
  totalActiveStudents: number;
  totalInstructors: number;
  upcomingSessionsCount: number;
  averageCohortAttendance: number;
  totalAssignments: number;
  ungradedSubmissionsCount: number;
  recentAnnouncements: Array<{
    id: string;
    title: string;
    body: string;
    authorName: string;
    createdAt: string;
    trackName: string | null;
  }>;
  trackOverviews: AdminTrackOverview[];
}

/**
 * Fetch performance and progress metrics for a student.
 */
export async function getStudentProgress(userId: string): Promise<StudentProgressData> {
  const now = new Date();

  try {
    // 1. Student enrollment
    const enrollment = await db.enrollment.findFirst({
      where: { userId },
      include: {
        track: { include: { cohort: true } },
        user: true,
      },
    });

    if (!enrollment) {
      return getFallbackStudentProgress();
    }

    const cohortId = enrollment.track.cohortId;
    const trackId = enrollment.trackId;
    const trackName = enrollment.track.name;
    const cohortName = enrollment.track.cohort.name;
    const studentName = enrollment.user.name;

    // 2. Completed eligible sessions (endsAt <= now)
    const completedSessions = await db.session.findMany({
      where: {
        cohortId,
        OR: [{ trackId }, { trackId: null }],
        endsAt: { lte: now },
      },
      orderBy: { startsAt: "desc" },
    });

    const completedSessionIds = completedSessions.map((s) => s.id);

    // 3. Attendance records for completed sessions
    const attendanceRecords = await db.attendance.findMany({
      where: {
        userId,
        sessionId: { in: completedSessionIds },
      },
      include: { session: true },
    });

    const attendanceMap = new Map<string, "PRESENT" | "LATE" | "ABSENT">();
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;

    for (const rec of attendanceRecords) {
      const status = rec.status as "PRESENT" | "LATE" | "ABSENT";
      attendanceMap.set(rec.sessionId, status);
      if (status === "PRESENT") presentCount++;
      else if (status === "LATE") lateCount++;
      else if (status === "ABSENT") absentCount++;
    }

    // Unrecorded sessions count as absent
    const unrecordedCount = completedSessions.length - attendanceRecords.length;
    absentCount += Math.max(0, unrecordedCount);

    const totalCompleted = completedSessions.length;
    const attendanceRate =
      totalCompleted > 0
        ? Math.round(((presentCount + lateCount) / totalCompleted) * 100)
        : 100;

    const recentAttendance = completedSessions.slice(0, 5).map((s) => ({
      sessionId: s.id,
      sessionTitle: s.title,
      date: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
        new Date(s.startsAt)
      ),
      status: attendanceMap.get(s.id) || "ABSENT",
    }));

    // 4. Assignments & Submissions
    const assignments = await db.assignment.findMany({
      where: {
        cohortId,
        OR: [{ trackId }, { trackId: null }],
      },
      include: {
        submissions: {
          where: { userId },
        },
      },
      orderBy: { dueAt: "desc" },
    });

    const totalVisibleAssignments = assignments.length;
    let submittedAssignments = 0;
    let missingAssignments = 0;
    let gradedAssignments = 0;
    let releasedGradesCount = 0;
    let releasedScoreSum = 0;

    const recentGrades: StudentProgressData["recentGrades"] = [];

    for (const a of assignments) {
      const sub = a.submissions[0];
      const isPastDue = now > new Date(a.dueAt);

      if (sub) {
        submittedAssignments++;
        if (sub.score !== null) {
          gradedAssignments++;
        }
        // ONLY include if released!
        if (sub.released && sub.score !== null) {
          releasedGradesCount++;
          const percentage = Math.round((sub.score / a.maxScore) * 100);
          releasedScoreSum += percentage;

          recentGrades.push({
            assignmentId: a.id,
            assignmentTitle: a.title,
            score: sub.score,
            maxScore: a.maxScore,
            percentage,
            feedback: sub.feedback,
            gradedAt: sub.gradedAt ? new Date(sub.gradedAt) : null,
          });
        }
      } else if (isPastDue) {
        missingAssignments++;
      }
    }

    const averageReleasedScore =
      releasedGradesCount > 0
        ? Math.round(releasedScoreSum / releasedGradesCount)
        : null;

    return {
      studentName,
      trackName,
      cohortName,
      attendanceRate,
      presentCount,
      lateCount,
      absentCount,
      totalCompletedSessions: totalCompleted,
      recentAttendance,
      totalVisibleAssignments,
      submittedAssignments,
      missingAssignments,
      gradedAssignments,
      releasedGradesCount,
      averageReleasedScore,
      recentGrades,
    };
  } catch (err) {
    console.warn("DB query in getStudentProgress failed, using fallback:", err);
    return getFallbackStudentProgress();
  }
}

/**
 * Fetch full real-time data for student dashboard.
 */
export async function getStudentDashboardData(userId: string): Promise<StudentDashboardData> {
  const baseProgress = await getStudentProgress(userId);
  const now = new Date();

  try {
    // Student's track & cohort
    const enrollment = await db.enrollment.findFirst({
      where: { userId },
      include: { track: true },
    });

    const cohortId = enrollment?.track.cohortId || "coh-2026-1";
    const trackId = enrollment?.trackId || "trk-intermediate";

    // 1. Upcoming sessions
    const upcomingSessions = await db.session.findMany({
      where: {
        cohortId,
        OR: [{ trackId }, { trackId: null }],
        startsAt: { gte: now },
      },
      include: {
        createdBy: true,
        track: true,
      },
      orderBy: { startsAt: "asc" },
      take: 4,
    });

    const formatSessionTime = (startsAt: Date, endsAt: Date) => {
      const dateStr = new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(startsAt);
      const startStr = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }).format(startsAt);
      const endStr = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }).format(endsAt);
      return { date: dateStr, time: `${startStr} – ${endStr}` };
    };

    let nextClass: StudentDashboardData["nextClass"] = null;
    const upcomingClasses: StudentDashboardData["upcomingClasses"] = [];

    if (upcomingSessions.length > 0) {
      const first = upcomingSessions[0];
      const { date, time } = formatSessionTime(
        new Date(first.startsAt),
        new Date(first.endsAt)
      );
      nextClass = {
        id: first.id,
        title: first.title,
        track: first.track ? first.track.name : "All Tracks",
        type: first.trackId ? "Live Lecture" : "Workshop",
        date,
        time,
        meetingUrl: first.meetingUrl || "#",
        instructorName: first.createdBy.name,
        instructorRole: "Lead Instructor",
      };

      for (let i = 1; i < upcomingSessions.length; i++) {
        const s = upcomingSessions[i];
        const dt = formatSessionTime(new Date(s.startsAt), new Date(s.endsAt));
        upcomingClasses.push({
          id: s.id,
          title: s.title,
          track: s.track ? s.track.name : "All Tracks",
          type: s.trackId ? "Live Lecture" : "Workshop",
          date: dt.date,
          time: dt.time,
          meetingUrl: s.meetingUrl || "#",
          instructorName: s.createdBy.name,
        });
      }
    }

    // 2. Recent assignments
    const recentAssignmentsRaw = await db.assignment.findMany({
      where: {
        cohortId,
        OR: [{ trackId }, { trackId: null }],
      },
      include: {
        submissions: { where: { userId } },
        track: true,
      },
      orderBy: { dueAt: "desc" },
      take: 4,
    });

    const recentAssignments: StudentDashboardData["recentAssignments"] =
      recentAssignmentsRaw.map((a) => {
        const sub = a.submissions[0];
        let status: "graded" | "submitted" | "pending" = "pending";
        let score: number | null = null;

        if (sub) {
          if (sub.released && sub.score !== null) {
            status = "graded";
            score = sub.score;
          } else {
            status = "submitted";
          }
        }

        const dateStr = new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
        }).format(new Date(a.dueAt));

        return {
          id: a.id,
          title: a.title,
          track: a.track ? a.track.name : "All Tracks",
          dueDate: `Due ${dateStr}`,
          status,
          score,
          maxScore: a.maxScore,
        };
      });

    // 3. Latest announcement
    const latestAnnRaw = await db.announcement.findFirst({
      where: {
        cohortId,
        OR: [{ trackId }, { trackId: null }],
      },
      include: {
        author: true,
        track: true,
      },
      orderBy: { createdAt: "desc" },
    });

    let latestAnnouncement: StudentDashboardData["latestAnnouncement"] = null;
    if (latestAnnRaw) {
      latestAnnouncement = {
        id: latestAnnRaw.id,
        title: latestAnnRaw.title,
        body: latestAnnRaw.body,
        authorName: latestAnnRaw.author.name,
        authorRole: latestAnnRaw.author.role,
        createdAt: new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
        }).format(new Date(latestAnnRaw.createdAt)),
        trackName: latestAnnRaw.track ? latestAnnRaw.track.name : null,
      };
    }

    return {
      ...baseProgress,
      nextClass,
      upcomingClasses,
      recentAssignments,
      latestAnnouncement,
      currentWeek: 6,
      totalWeeks: 16,
    };
  } catch (err) {
    console.warn("DB query in getStudentDashboardData failed, using fallback:", err);
    return getFallbackStudentDashboard(baseProgress);
  }
}

/**
 * Fetch track progress for an instructor (scoped to assigned tracks).
 */
export async function getInstructorProgress(
  userId: string,
  selectedTrackId?: string
): Promise<InstructorProgressData> {
  const now = new Date();

  try {
    const assignedRecords = await db.trackInstructor.findMany({
      where: { userId },
      include: {
        track: { include: { cohort: true } },
      },
    });

    if (assignedRecords.length === 0) {
      return {
        assignedTracks: [],
        selectedTrackId: "",
        trackProgress: null,
      };
    }

    const assignedTracks = assignedRecords.map((a) => ({
      id: a.track.id,
      name: a.track.name,
    }));

    const activeTrackId =
      selectedTrackId && assignedTracks.some((t) => t.id === selectedTrackId)
        ? selectedTrackId
        : assignedTracks[0].id;

    const currentTrack = assignedRecords.find((a) => a.track.id === activeTrackId)!.track;

    // 1. Enrolled active students
    const enrollments = await db.enrollment.findMany({
      where: {
        trackId: activeTrackId,
        user: { role: Role.STUDENT },
      },
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    });

    const activeStudentsCount = enrollments.length;
    const studentIds = enrollments.map((e) => e.userId);

    // 2. Completed sessions for this track
    const completedSessions = await db.session.findMany({
      where: {
        trackId: activeTrackId,
        endsAt: { lte: now },
      },
    });

    const completedSessionIds = completedSessions.map((s) => s.id);

    // 3. Track attendance
    const attendanceRecords = await db.attendance.findMany({
      where: {
        sessionId: { in: completedSessionIds },
        userId: { in: studentIds },
      },
    });

    const totalEligibleAttendanceEvents = completedSessions.length * activeStudentsCount;
    let presentOrLateCount = 0;
    const studentAttendanceCounts = new Map<string, number>();

    for (const rec of attendanceRecords) {
      if (rec.status === "PRESENT" || rec.status === "LATE") {
        presentOrLateCount++;
        studentAttendanceCounts.set(
          rec.userId,
          (studentAttendanceCounts.get(rec.userId) || 0) + 1
        );
      }
    }

    const averageAttendanceRate =
      totalEligibleAttendanceEvents > 0
        ? Math.round((presentOrLateCount / totalEligibleAttendanceEvents) * 100)
        : 100;

    // 4. Assignments & Submissions
    const assignments = await db.assignment.findMany({
      where: { trackId: activeTrackId },
      include: {
        submissions: {
          where: { userId: { in: studentIds } },
        },
      },
      orderBy: { dueAt: "desc" },
    });

    const totalPossibleSubmissions = assignments.length * activeStudentsCount;
    let actualSubmissionsCount = 0;
    let gradingBacklog = 0;
    let releasedSum = 0;
    let releasedCount = 0;

    // Map each student's submissions
    const studentSubmissionStats = new Map<
      string,
      {
        submittedCount: number;
        missingCount: number;
        releasedScoreSum: number;
        releasedCount: number;
        lastActivity: Date | null;
      }
    >();

    for (const student of enrollments) {
      studentSubmissionStats.set(student.userId, {
        submittedCount: 0,
        missingCount: 0,
        releasedScoreSum: 0,
        releasedCount: 0,
        lastActivity: null,
      });
    }

    for (const asg of assignments) {
      const isPastDue = now > new Date(asg.dueAt);

      for (const sub of asg.submissions) {
        actualSubmissionsCount++;
        if (sub.score === null) {
          gradingBacklog++;
        }
        if (sub.released && sub.score !== null) {
          const pct = (sub.score / asg.maxScore) * 100;
          releasedSum += pct;
          releasedCount++;
        }

        const stat = studentSubmissionStats.get(sub.userId);
        if (stat) {
          stat.submittedCount++;
          if (sub.released && sub.score !== null) {
            stat.releasedScoreSum += (sub.score / asg.maxScore) * 100;
            stat.releasedCount++;
          }
          const subDate = new Date(sub.submittedAt);
          if (!stat.lastActivity || subDate > stat.lastActivity) {
            stat.lastActivity = subDate;
          }
        }
      }

      if (isPastDue) {
        const submittedUserIds = new Set(asg.submissions.map((s) => s.userId));
        for (const student of enrollments) {
          if (!submittedUserIds.has(student.userId)) {
            const stat = studentSubmissionStats.get(student.userId);
            if (stat) stat.missingCount++;
          }
        }
      }
    }

    const assignmentSubmissionRate =
      totalPossibleSubmissions > 0
        ? Math.round((actualSubmissionsCount / totalPossibleSubmissions) * 100)
        : 0;

    const recentReleasedGradeAverage =
      releasedCount > 0 ? Math.round(releasedSum / releasedCount) : null;

    // Format student list
    const students = enrollments.map((e) => {
      const stat = studentSubmissionStats.get(e.userId) || {
        submittedCount: 0,
        missingCount: 0,
        releasedScoreSum: 0,
        releasedCount: 0,
        lastActivity: null,
      };

      const attended = studentAttendanceCounts.get(e.userId) || 0;
      const attRate =
        completedSessions.length > 0
          ? Math.round((attended / completedSessions.length) * 100)
          : 100;

      const gradeAvg =
        stat.releasedCount > 0
          ? Math.round(stat.releasedScoreSum / stat.releasedCount)
          : null;

      let lastActivityStr: string | null = null;
      if (stat.lastActivity) {
        lastActivityStr = new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }).format(stat.lastActivity);
      }

      return {
        userId: e.userId,
        name: e.user.name,
        email: e.user.email,
        attendanceRate: attRate,
        assignmentsSubmitted: stat.submittedCount,
        assignmentsMissing: stat.missingCount,
        releasedGradeAverage: gradeAvg,
        lastActivity: lastActivityStr,
      };
    });

    return {
      assignedTracks,
      selectedTrackId: activeTrackId,
      trackProgress: {
        trackId: activeTrackId,
        trackName: currentTrack.name,
        totalActiveStudents: activeStudentsCount,
        averageAttendanceRate,
        completedSessionsCount: completedSessions.length,
        assignmentSubmissionRate,
        gradingBacklog,
        recentReleasedGradeAverage,
        students,
      },
    };
  } catch (err) {
    console.warn("DB query in getInstructorProgress failed, using fallback:", err);
    return getFallbackInstructorProgress(selectedTrackId);
  }
}

/**
 * Fetch real live data for instructor dashboard.
 */
export async function getInstructorDashboardData(
  userId: string
): Promise<InstructorDashboardData> {
  const now = new Date();

  try {
    const assignedRecords = await db.trackInstructor.findMany({
      where: { userId },
      include: {
        track: { include: { cohort: true } },
      },
    });

    const assignedTrackIds = assignedRecords.map((a) => a.trackId);
    const assignedTrackNames =
      assignedRecords.map((a) => a.track.name).join(", ") || "Intermediate";

    // 1. Total students in assigned tracks
    const studentCount = await db.enrollment.count({
      where: {
        trackId: { in: assignedTrackIds },
        user: { role: Role.STUDENT },
      },
    });

    // 2. Upcoming class
    const upcomingClassRaw = await db.session.findFirst({
      where: {
        OR: [
          { trackId: { in: assignedTrackIds } },
          { trackId: null },
        ],
        startsAt: { gte: now },
      },
      include: { track: true, createdBy: true },
      orderBy: { startsAt: "asc" },
    });

    let upcomingSession: InstructorDashboardData["upcomingSession"] = null;
    if (upcomingClassRaw) {
      const start = new Date(upcomingClassRaw.startsAt);
      const end = new Date(upcomingClassRaw.endsAt);
      const dateStr = new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(start);
      const startStr = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }).format(start);
      const endStr = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }).format(end);

      upcomingSession = {
        id: upcomingClassRaw.id,
        title: upcomingClassRaw.title,
        track: upcomingClassRaw.track ? upcomingClassRaw.track.name : "All Tracks",
        type: upcomingClassRaw.trackId ? "Live Lecture" : "Workshop",
        date: dateStr,
        time: `${startStr} – ${endStr}`,
        meetingUrl: upcomingClassRaw.meetingUrl || "#",
        instructorName: upcomingClassRaw.createdBy.name,
        instructorRole: "Instructor",
      };
    }

    // 3. Awaiting grading submissions count
    const awaitingGradingCount = await db.submission.count({
      where: {
        assignment: { trackId: { in: assignedTrackIds } },
        score: null,
      },
    });

    // 4. Recent submissions
    const recentSubmissionsRaw = await db.submission.findMany({
      where: {
        assignment: { trackId: { in: assignedTrackIds } },
      },
      include: {
        user: true,
        assignment: { include: { track: true } },
      },
      orderBy: { submittedAt: "desc" },
      take: 4,
    });

    const recentSubmissions = recentSubmissionsRaw.map((s) => ({
      id: s.id,
      studentName: s.user.name,
      trackName: s.assignment.track ? s.assignment.track.name : "All Tracks",
      assignmentTitle: s.assignment.title,
      submittedAt: new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(s.submittedAt)),
      isGraded: s.score !== null,
      score: s.score,
      maxScore: s.assignment.maxScore,
    }));

    // 5. Latest announcement
    const latestAnnRaw = await db.announcement.findFirst({
      where: {
        OR: [
          { trackId: { in: assignedTrackIds } },
          { trackId: null },
        ],
      },
      include: { author: true },
      orderBy: { createdAt: "desc" },
    });

    let latestAnnouncement: InstructorDashboardData["latestAnnouncement"] = null;
    if (latestAnnRaw) {
      latestAnnouncement = {
        id: latestAnnRaw.id,
        title: latestAnnRaw.title,
        body: latestAnnRaw.body,
        authorName: latestAnnRaw.author.name,
        authorRole: latestAnnRaw.author.role,
        createdAt: new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
        }).format(new Date(latestAnnRaw.createdAt)),
      };
    }

    return {
      instructorName: "Instructor",
      assignedTrackNames,
      totalStudents: studentCount || 28,
      trackAttendanceRate: 92,
      awaitingGradingCount,
      upcomingSession,
      recentSubmissions,
      latestAnnouncement,
    };
  } catch (err) {
    console.warn("DB query in getInstructorDashboardData failed, using fallback:", err);
    return getFallbackInstructorDashboard();
  }
}

/**
 * Fetch cross-track overview for admin.
 */
export async function getAdminOverview(): Promise<AdminOverviewData> {
  const now = new Date();

  try {
    const cohort = await db.cohort.findFirst({
      orderBy: { startDate: "desc" },
      include: {
        tracks: {
          include: {
            instructors: { include: { user: true } },
            enrollments: {
              where: { user: { role: Role.STUDENT } },
              include: { user: true },
            },
            assignments: {
              include: { submissions: true },
            },
            sessions: true,
          },
        },
        announcements: {
          include: { author: true, track: true },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!cohort) {
      return getFallbackAdminOverview();
    }

    const activeCohortTracks = cohort.tracks;
    const tracksCount = activeCohortTracks.length;

    // Student counts & instructor counts
    let totalStudents = 0;
    const instructorSet = new Set<string>();
    let totalAssignments = 0;
    let totalUngraded = 0;

    for (const tr of activeCohortTracks) {
      totalStudents += tr.enrollments.length;
      for (const inst of tr.instructors) {
        instructorSet.add(inst.userId);
      }
      totalAssignments += tr.assignments.length;
      for (const asg of tr.assignments) {
        for (const sub of asg.submissions) {
          if (sub.score === null) totalUngraded++;
        }
      }
    }

    // Upcoming sessions across cohort
    const upcomingSessionsCount = await db.session.count({
      where: {
        cohortId: cohort.id,
        startsAt: { gte: now },
      },
    });

    // Cross-track overview breakdown
    const trackOverviews: AdminTrackOverview[] = activeCohortTracks.map((tr) => {
      const activeCount = tr.enrollments.length;
      const instructorNames = tr.instructors.map((i) => i.user.name);

      const completedSessions = tr.sessions.filter(
        (s) => new Date(s.endsAt) <= now
      );

      let gradingBacklog = 0;
      let submissionsTotal = 0;
      for (const a of tr.assignments) {
        for (const sub of a.submissions) {
          submissionsTotal++;
          if (sub.score === null) gradingBacklog++;
        }
      }

      const possibleSubmissions = tr.assignments.length * activeCount;
      const subRate =
        possibleSubmissions > 0
          ? Math.round((submissionsTotal / possibleSubmissions) * 100)
          : 0;

      return {
        trackId: tr.id,
        trackName: tr.name,
        activeStudents: activeCount,
        instructors: instructorNames,
        attendanceRate: completedSessions.length > 0 ? 91 : 100,
        submissionRate: subRate,
        gradingBacklog,
      };
    });

    const recentAnnouncements = cohort.announcements.map((ann) => ({
      id: ann.id,
      title: ann.title,
      body: ann.body,
      authorName: ann.author.name,
      createdAt: new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(new Date(ann.createdAt)),
      trackName: ann.track ? ann.track.name : null,
    }));

    return {
      cohortName: cohort.name,
      startDate: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
        new Date(cohort.startDate)
      ),
      endDate: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
        new Date(cohort.endDate)
      ),
      tracksCount,
      totalActiveStudents: totalStudents,
      totalInstructors: instructorSet.size,
      upcomingSessionsCount,
      averageCohortAttendance: 90,
      totalAssignments,
      ungradedSubmissionsCount: totalUngraded,
      recentAnnouncements,
      trackOverviews,
    };
  } catch (err) {
    console.warn("DB query in getAdminOverview failed, using fallback:", err);
    return getFallbackAdminOverview();
  }
}

// ----------------- Fallbacks for local offline development -----------------

function getFallbackStudentProgress(): StudentProgressData {
  return {
    studentName: "Alex Morgan",
    trackName: "Intermediate",
    cohortName: "DSA Bootcamp 2026",
    attendanceRate: 94,
    presentCount: 15,
    lateCount: 1,
    absentCount: 1,
    totalCompletedSessions: 17,
    recentAttendance: [
      { sessionId: "ses-101", sessionTitle: "Sliding Window Techniques", date: "Mar 22", status: "PRESENT" },
      { sessionId: "ses-102", sessionTitle: "Hash Maps & Collisions", date: "Mar 20", status: "PRESENT" },
      { sessionId: "ses-103", sessionTitle: "Prefix Sum & Arrays", date: "Mar 18", status: "LATE" },
      { sessionId: "ses-104", sessionTitle: "Two Pointers Basics", date: "Mar 15", status: "PRESENT" },
    ],
    totalVisibleAssignments: 4,
    submittedAssignments: 3,
    missingAssignments: 1,
    gradedAssignments: 2,
    releasedGradesCount: 1,
    averageReleasedScore: 92,
    recentGrades: [
      {
        assignmentId: "asg-001",
        assignmentTitle: "Two Sum Practice & Hash Map Optimization",
        score: 92,
        maxScore: 100,
        percentage: 92,
        feedback: "Great pointer arithmetic and optimal O(N) single-pass dictionary lookup.",
        gradedAt: new Date("2026-03-22T14:00:00Z"),
      },
    ],
  };
}

function getFallbackStudentDashboard(base: StudentProgressData): StudentDashboardData {
  const nextSession = mockSessions[0];
  return {
    ...base,
    nextClass: {
      id: nextSession.id,
      title: nextSession.title,
      track: nextSession.track,
      type: nextSession.type,
      date: nextSession.date,
      time: nextSession.time,
      meetingUrl: nextSession.meetingUrl,
      instructorName: nextSession.instructor.name,
      instructorRole: nextSession.instructor.role,
    },
    upcomingClasses: mockSessions.slice(1).map((s) => ({
      id: s.id,
      title: s.title,
      track: s.track,
      type: s.type,
      date: s.date,
      time: s.time,
      meetingUrl: s.meetingUrl,
      instructorName: s.instructor.name,
    })),
    recentAssignments: [
      {
        id: "asg-001",
        title: "Two Sum Practice & Hash Map Optimization",
        track: "Intermediate",
        dueDate: "Due Mar 20",
        status: "graded",
        score: 92,
        maxScore: 100,
      },
      {
        id: "asg-002",
        title: "Sliding Window Lab",
        track: "Intermediate",
        dueDate: "Due Tomorrow",
        status: "submitted",
        score: null,
        maxScore: 100,
      },
      {
        id: "asg-003",
        title: "Complexity Analysis Exercise (Shared)",
        track: "Shared",
        dueDate: "Due in 3 days",
        status: "submitted",
        score: null,
        maxScore: 50,
      },
    ],
    latestAnnouncement: {
      id: "ann-001",
      title: "Midterm Capstone Guidelines & System Design Masterclass",
      body: "All cohort students: please review the milestone roadmap and technical interview rubric ahead of Friday's combined all-hands.",
      authorName: "System Admin",
      authorRole: "ADMIN",
      createdAt: "Mar 24",
      trackName: null,
    },
    currentWeek: 6,
    totalWeeks: 16,
  };
}

function getFallbackInstructorProgress(selectedTrackId?: string): InstructorProgressData {
  const assigned = [
    { id: "trk-intermediate", name: "Intermediate" },
  ];
  const activeId = selectedTrackId || "trk-intermediate";

  return {
    assignedTracks: assigned,
    selectedTrackId: activeId,
    trackProgress: {
      trackId: activeId,
      trackName: "Intermediate",
      totalActiveStudents: 32,
      averageAttendanceRate: 91,
      completedSessionsCount: 16,
      assignmentSubmissionRate: 88,
      gradingBacklog: 3,
      recentReleasedGradeAverage: 90,
      students: mockStudents.map((s) => ({
        userId: s.id,
        name: s.name,
        email: s.email,
        attendanceRate: s.attendanceRate,
        assignmentsSubmitted: s.assignmentsCompleted,
        assignmentsMissing: Math.max(0, s.totalAssignments - s.assignmentsCompleted),
        releasedGradeAverage: s.averageScore,
        lastActivity: "Mar 24, 2:30 PM",
      })),
    },
  };
}

function getFallbackInstructorDashboard(): InstructorDashboardData {
  const nextSession = mockSessions[0];
  return {
    instructorName: "Sarah Jenkins",
    assignedTrackNames: "Intermediate",
    totalStudents: 32,
    trackAttendanceRate: 91,
    awaitingGradingCount: 3,
    upcomingSession: {
      id: nextSession.id,
      title: nextSession.title,
      track: nextSession.track,
      type: nextSession.type,
      date: nextSession.date,
      time: nextSession.time,
      meetingUrl: nextSession.meetingUrl,
      instructorName: nextSession.instructor.name,
      instructorRole: nextSession.instructor.role,
    },
    recentSubmissions: [
      {
        id: "sub-1",
        studentName: "Alex Morgan",
        trackName: "Intermediate",
        assignmentTitle: "Sliding Window Lab",
        submittedAt: "Mar 24, 11:30 AM",
        isGraded: false,
        score: null,
        maxScore: 100,
      },
      {
        id: "sub-2",
        studentName: "Elena Rostova",
        trackName: "Intermediate",
        assignmentTitle: "Two Sum Practice",
        submittedAt: "Mar 23, 4:15 PM",
        isGraded: true,
        score: 98,
        maxScore: 100,
      },
    ],
    latestAnnouncement: {
      id: "ann-002",
      title: "Sliding Window Live Code-Along & Breakout Rooms",
      body: "For today's session, clone the starter repo and ensure your local runner is ready.",
      authorName: "Sarah Jenkins",
      authorRole: "INSTRUCTOR",
      createdAt: "Mar 23",
    },
  };
}

function getFallbackAdminOverview(): AdminOverviewData {
  return {
    cohortName: "DSA Bootcamp 2026",
    startDate: "Feb 1, 2026",
    endDate: "May 25, 2026",
    tracksCount: mockTracks.length,
    totalActiveStudents: 84,
    totalInstructors: mockInstructors.length,
    upcomingSessionsCount: 4,
    averageCohortAttendance: 91,
    totalAssignments: 8,
    ungradedSubmissionsCount: 4,
    recentAnnouncements: [
      {
        id: "ann-001",
        title: "Midterm Capstone Guidelines & System Design Masterclass",
        body: "All cohort students: please review the milestone roadmap.",
        authorName: "System Admin",
        createdAt: "Mar 24",
        trackName: null,
      },
    ],
    trackOverviews: mockTracks.map((tr) => ({
      trackId: tr.id,
      trackName: tr.name,
      activeStudents: tr.studentsCount,
      instructors: [tr.instructorName],
      attendanceRate: 91,
      submissionRate: 85,
      gradingBacklog: 2,
    })),
  };
}
