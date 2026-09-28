import { Role } from "@prisma/client";
import { db } from "@/lib/db";

export interface StudentProgressData {
  studentName: string;
  cohortName: string;
  trackName: string;
  attendanceRate: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  totalCompletedSessions: number;
  submittedAssignments: number;
  totalVisibleAssignments: number;
  missingAssignments: number;
  gradedAssignments: number;
  releasedGradesCount: number;
  averageReleasedScore: number | null;
  metrics: {
    attendanceRate: number;
    assignmentsSubmitted: number;
    totalAssignments: number;
    missingAssignments: number;
    averageReleasedScore: number | null;
  };
  recentGrades: {
    assignmentId: string;
    assignmentTitle: string;
    score: number;
    maxScore: number;
    percentage: number;
    feedback: string | null;
    gradedAt: Date | null;
  }[];
  recentAttendance: {
    sessionId: string;
    sessionTitle: string;
    date: string;
    status: "PRESENT" | "LATE" | "ABSENT";
  }[];
}

export interface StudentDashboardData {
  studentName: string;
  trackName: string;
  cohortName: string;
  currentWeek: number;
  totalWeeks: number;
  attendanceRate: number;
  presentCount: number;
  lateCount: number;
  totalCompletedSessions: number;
  submittedAssignments: number;
  totalVisibleAssignments: number;
  gradedAssignments: number;
  averageReleasedScore: number | null;
  activeTrackName: string | null;
  nextClass: {
    id: string;
    title: string;
    track: string;
    type: "Live Lecture" | "Workshop" | "Code Review" | "Lab Session";
    date: string;
    time: string;
    meetingUrl: string;
    instructorName: string;
    instructorRole: string;
    startsAt?: Date;
    endsAt?: Date;
    isLive?: boolean;
  } | null;
  upcomingClasses: {
    id: string;
    title: string;
    track: string;
    type: "Live Lecture" | "Workshop" | "Code Review" | "Lab Session";
    date: string;
    time: string;
    meetingUrl: string;
    instructorName: string;
    startsAt?: Date;
  }[];
  recentAssignments: {
    id: string;
    title: string;
    track: string;
    dueDate: string;
    status: "graded" | "submitted" | "in_progress" | "pending";
    score: number | null;
    maxScore: number;
  }[];
  latestAnnouncement: {
    id: string;
    title: string;
    body: string;
    authorName: string;
    authorRole: string;
    createdAt: string;
  } | null;
  recentAnnouncements: {
    id: string;
    title: string;
    body: string;
    authorName: string;
    createdAt: string;
    trackName: string | null;
  }[];
  metrics: {
    attendanceRate: number;
    completedClasses: number;
    submittedAssignments: number;
    missingAssignments: number;
    averageGrade: number | null;
  };
  pendingAssignments: {
    id: string;
    title: string;
    dueAt: Date;
    maxScore: number;
    isPastDue: boolean;
  }[];
}

export interface InstructorProgressData {
  assignedTracks: { id: string; name: string }[];
  selectedTrackId: string;
  trackProgress: {
    trackName: string;
    cohortName: string;
    activeStudentsCount: number;
    totalActiveStudents: number;
    completedSessionsCount: number;
    averageAttendanceRate: number;
    assignmentSubmissionRate: number;
    gradingBacklog: number;
    recentReleasedGradeAverage: number | null;
    students: {
      id: string;
      userId: string;
      name: string;
      email: string;
      attendanceRate: number;
      assignmentsSubmitted: number;
      missingAssignments: number;
      assignmentsMissing: number;
      averageScore: number | null;
      releasedGradeAverage: number | null;
      lastActivity: string;
    }[];
  } | null;
}

export interface InstructorDashboardData {
  assignedTracks: { id: string; name: string }[];
  selectedTrackId: string;
  assignedTrackNames: string;
  totalStudents: number;
  trackAttendanceRate: number;
  awaitingGradingCount: number;
  activeStudentsCount: number;
  gradingBacklogCount: number;
  averageAttendanceRate: number;
  upcomingSession: {
    id: string;
    title: string;
    track: string;
    type: "Live Lecture" | "Workshop" | "Code Review" | "Lab Session";
    date: string;
    time: string;
    meetingUrl: string;
    instructorName: string;
    instructorRole: string;
  } | null;
  nextClass: {
    id: string;
    title: string;
    startsAt: Date;
    endsAt: Date;
    trackName: string | null;
    checkinCode: string | null;
    meetingUrl: string | null;
    isLive: boolean;
  } | null;
  latestAnnouncement: {
    id: string;
    title: string;
    body: string;
    authorName: string;
    authorRole: string;
    createdAt: string;
  } | null;
  recentSubmissions: {
    id: string;
    assignmentTitle: string;
    studentName: string;
    studentEmail: string;
    trackName: string;
    submittedAt: string;
    isGraded: boolean;
    score: number | null;
    maxScore: number;
    isLate?: boolean;
    submissionUrl?: string | null;
  }[];
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
  recentAnnouncements: {
    id: string;
    title: string;
    body: string;
    authorName: string;
    createdAt: string;
    trackName: string | null;
  }[];
  trackOverviews: AdminTrackOverview[];
}

/**
 * Retrieves student progress metrics, grades, and recent attendance strictly from PostgreSQL.
 */
export async function getStudentProgress(userId: string): Promise<StudentProgressData> {
  const now = new Date();

  const enrollment = await db.enrollment.findFirst({
    where: { userId },
    include: {
      track: { include: { cohort: true } },
      user: true,
    },
  });

  if (!enrollment) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    return {
      studentName: user?.name || "Student",
      cohortName: "Not Enrolled",
      trackName: "None",
      attendanceRate: 100,
      presentCount: 0,
      lateCount: 0,
      absentCount: 0,
      totalCompletedSessions: 0,
      submittedAssignments: 0,
      totalVisibleAssignments: 0,
      missingAssignments: 0,
      gradedAssignments: 0,
      releasedGradesCount: 0,
      averageReleasedScore: null,
      metrics: {
        attendanceRate: 100,
        assignmentsSubmitted: 0,
        totalAssignments: 0,
        missingAssignments: 0,
        averageReleasedScore: null,
      },
      recentGrades: [],
      recentAttendance: [],
    };
  }

  const cohortId = enrollment.track.cohortId;
  const trackId = enrollment.trackId;
  const trackName = enrollment.track.name;
  const cohortName = enrollment.track.cohort.name;
  const studentName = enrollment.user.name;

  // 1. Completed eligible sessions (endsAt <= now)
  const completedSessions = await db.session.findMany({
    where: {
      cohortId,
      OR: [{ trackId }, { trackId: null }],
      endsAt: { lte: now },
    },
    orderBy: { startsAt: "desc" },
  });

  const completedSessionIds = completedSessions.map((s) => s.id);

  // 2. Attendance records for completed sessions
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
    status: attendanceMap.get(s.id) || ("ABSENT" as const),
  }));

  // 3. Assignments & Submissions
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
    cohortName,
    trackName,
    attendanceRate,
    presentCount,
    lateCount,
    absentCount,
    totalCompletedSessions: totalCompleted,
    submittedAssignments,
    totalVisibleAssignments,
    missingAssignments,
    gradedAssignments,
    releasedGradesCount,
    averageReleasedScore,
    metrics: {
      attendanceRate,
      assignmentsSubmitted: submittedAssignments,
      totalAssignments: totalVisibleAssignments,
      missingAssignments,
      averageReleasedScore,
    },
    recentGrades,
    recentAttendance,
  };
}

/**
 * Retrieves student home dashboard data directly from PostgreSQL.
 */
export async function getStudentDashboardData(userId: string): Promise<StudentDashboardData> {
  const now = new Date();

  const enrollment = await db.enrollment.findFirst({
    where: {
      userId,
      startDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gt: now } }],
    },
    include: {
      track: { include: { cohort: true } },
      user: true,
    },
  });

  if (!enrollment) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    return {
      studentName: user?.name || "Student",
      trackName: "General",
      cohortName: "Bootcamp",
      currentWeek: 1,
      totalWeeks: 12,
      attendanceRate: 100,
      presentCount: 0,
      lateCount: 0,
      totalCompletedSessions: 0,
      submittedAssignments: 0,
      totalVisibleAssignments: 0,
      gradedAssignments: 0,
      averageReleasedScore: null,
      activeTrackName: null,
      nextClass: null,
      upcomingClasses: [],
      recentAssignments: [],
      latestAnnouncement: null,
      recentAnnouncements: [],
      metrics: {
        attendanceRate: 100,
        completedClasses: 0,
        submittedAssignments: 0,
        missingAssignments: 0,
        averageGrade: null,
      },
      pendingAssignments: [],
    };
  }

  const studentName = enrollment.user.name;
  const trackId = enrollment.trackId;
  const trackName = enrollment.track.name;
  const cohortId = enrollment.track.cohortId;
  const cohortName = enrollment.track.cohort.name;

  // Calculate current week and total weeks
  const startDate = new Date(enrollment.track.cohort.startDate);
  const endDate = new Date(enrollment.track.cohort.endDate);
  const totalWeeks = Math.max(
    1,
    Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
  );
  const diffDays = Math.floor((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
  const currentWeek = Math.min(Math.max(1, Math.floor(diffDays / 7) + 1), totalWeeks);

  // 1. Next and upcoming classes
  const classes = await db.session.findMany({
    where: {
      cohortId,
      OR: [{ trackId }, { trackId: null }],
      endsAt: { gte: now },
    },
    include: {
      createdBy: { select: { name: true, role: true } },
      track: { select: { name: true } },
    },
    orderBy: { startsAt: "asc" },
    take: 5,
  });

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
  const formatTime = (start: Date, end: Date) => {
    const s = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(start);
    const e = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(end);
    return `${s} - ${e}`;
  };

  let nextClass = null;
  const upcomingClasses: StudentDashboardData["upcomingClasses"] = [];

  if (classes.length > 0) {
    const first = classes[0];
    const isLive = new Date(first.startsAt) <= now && now <= new Date(first.endsAt);
    nextClass = {
      id: first.id,
      title: first.title,
      track: first.track ? first.track.name : trackName,
      type: "Live Lecture" as const,
      date: formatDate(new Date(first.startsAt)),
      time: formatTime(new Date(first.startsAt), new Date(first.endsAt)),
      meetingUrl: first.meetingUrl || "",
      instructorName: first.createdBy.name,
      instructorRole: "Instructor",
      startsAt: new Date(first.startsAt),
      endsAt: new Date(first.endsAt),
      isLive,
    };

    for (let i = 1; i < classes.length; i++) {
      const cls = classes[i];
      upcomingClasses.push({
        id: cls.id,
        title: cls.title,
        track: cls.track ? cls.track.name : trackName,
        type: "Live Lecture" as const,
        date: formatDate(new Date(cls.startsAt)),
        time: formatTime(new Date(cls.startsAt), new Date(cls.endsAt)),
        meetingUrl: cls.meetingUrl || "",
        instructorName: cls.createdBy.name,
        startsAt: new Date(cls.startsAt),
      });
    }
  }

  // 2. Completed classes and student attendance
  const completedSessions = await db.session.findMany({
    where: {
      cohortId,
      OR: [{ trackId }, { trackId: null }],
      endsAt: { lte: now },
    },
  });

  const attendances = await db.attendance.findMany({
    where: {
      userId,
      sessionId: { in: completedSessions.map((s) => s.id) },
    },
  });

  let presentCount = 0;
  let lateCount = 0;
  for (const a of attendances) {
    if (a.status === "PRESENT") presentCount++;
    else if (a.status === "LATE") lateCount++;
  }

  const attendanceRate =
    completedSessions.length > 0
      ? Math.round(((presentCount + lateCount) / completedSessions.length) * 100)
      : 100;

  // 3. Assignments and grades
  const assignments = await db.assignment.findMany({
    where: {
      cohortId,
      OR: [{ trackId }, { trackId: null }],
    },
    include: {
      submissions: {
        where: { userId },
      },
      track: { select: { name: true } },
    },
    orderBy: { dueAt: "asc" },
  });

  let submittedCount = 0;
  let missingCount = 0;
  let gradedCount = 0;
  let releasedGradeSum = 0;
  let releasedGradeCount = 0;

  const pendingAssignments: StudentDashboardData["pendingAssignments"] = [];
  const recentAssignments: StudentDashboardData["recentAssignments"] = [];

  for (const a of assignments) {
    const sub = a.submissions[0];
    const isPastDue = now > new Date(a.dueAt);

    let status: "graded" | "submitted" | "in_progress" | "pending" = "pending";

    if (sub) {
      submittedCount++;
      if (sub.score !== null) {
        gradedCount++;
      }
      if (sub.released && sub.score !== null) {
        status = "graded";
        releasedGradeSum += (sub.score / a.maxScore) * 100;
        releasedGradeCount++;
      } else {
        status = "submitted";
      }
    } else {
      if (isPastDue) {
        missingCount++;
      }
      pendingAssignments.push({
        id: a.id,
        title: a.title,
        dueAt: new Date(a.dueAt),
        maxScore: a.maxScore,
        isPastDue,
      });
    }

    recentAssignments.push({
      id: a.id,
      title: a.title,
      track: a.track ? a.track.name : trackName,
      dueDate: formatDate(new Date(a.dueAt)),
      status,
      score: sub && sub.released ? sub.score : null,
      maxScore: a.maxScore,
    });
  }

  const averageGrade =
    releasedGradeCount > 0 ? Math.round(releasedGradeSum / releasedGradeCount) : null;

  // 4. Announcements
  const announcements = await db.announcement.findMany({
    where: {
      cohortId,
      OR: [{ trackId }, { trackId: null }],
    },
    include: {
      author: { select: { name: true, role: true } },
      track: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const recentAnnouncements = announcements.map((ann) => ({
    id: ann.id,
    title: ann.title,
    body: ann.body,
    authorName: ann.author.name,
    createdAt: formatDate(new Date(ann.createdAt)),
    trackName: ann.track ? ann.track.name : null,
  }));

  const latestAnnouncement =
    announcements.length > 0
      ? {
          id: announcements[0].id,
          title: announcements[0].title,
          body: announcements[0].body,
          authorName: announcements[0].author.name,
          authorRole: announcements[0].author.role,
          createdAt: formatDate(new Date(announcements[0].createdAt)),
        }
      : null;

  return {
    studentName,
    trackName,
    cohortName,
    currentWeek,
    totalWeeks,
    attendanceRate,
    presentCount,
    lateCount,
    totalCompletedSessions: completedSessions.length,
    submittedAssignments: submittedCount,
    totalVisibleAssignments: assignments.length,
    gradedAssignments: gradedCount,
    averageReleasedScore: averageGrade,
    activeTrackName: trackName,
    nextClass,
    upcomingClasses,
    recentAssignments: recentAssignments.slice(0, 5),
    latestAnnouncement,
    recentAnnouncements,
    metrics: {
      attendanceRate,
      completedClasses: completedSessions.length,
      submittedAssignments: submittedCount,
      missingAssignments: missingCount,
      averageGrade,
    },
    pendingAssignments,
  };
}

/**
 * Retrieves track progress for an instructor directly from PostgreSQL.
 */
export async function getInstructorProgress(
  userId: string,
  selectedTrackId?: string
): Promise<InstructorProgressData> {
  const now = new Date();

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

  const students = enrollments.map((e) => {
    const stat = studentSubmissionStats.get(e.userId) || {
      submittedCount: 0,
      missingCount: 0,
      releasedScoreSum: 0,
      releasedCount: 0,
      lastActivity: null,
    };

    const attendedCount = studentAttendanceCounts.get(e.userId) || 0;
    const attRate =
      completedSessions.length > 0
        ? Math.round((attendedCount / completedSessions.length) * 100)
        : 100;

    const avgScore =
      stat.releasedCount > 0
        ? Math.round(stat.releasedScoreSum / stat.releasedCount)
        : null;

    const lastActivityFormatted = stat.lastActivity
      ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
          stat.lastActivity
        )
      : "—";

    return {
      id: e.userId,
      userId: e.userId,
      name: e.user.name,
      email: e.user.email,
      attendanceRate: attRate,
      assignmentsSubmitted: stat.submittedCount,
      missingAssignments: stat.missingCount,
      assignmentsMissing: stat.missingCount,
      averageScore: avgScore,
      releasedGradeAverage: avgScore,
      lastActivity: lastActivityFormatted,
    };
  });

  return {
    assignedTracks,
    selectedTrackId: activeTrackId,
    trackProgress: {
      trackName: currentTrack.name,
      cohortName: currentTrack.cohort.name,
      activeStudentsCount,
      totalActiveStudents: activeStudentsCount,
      completedSessionsCount: completedSessions.length,
      averageAttendanceRate,
      assignmentSubmissionRate,
      gradingBacklog,
      recentReleasedGradeAverage,
      students,
    },
  };
}

/**
 * Retrieves instructor home dashboard data directly from PostgreSQL.
 */
export async function getInstructorDashboardData(
  userId: string,
  selectedTrackId?: string
): Promise<InstructorDashboardData> {
  const now = new Date();

  const assignments = await db.trackInstructor.findMany({
    where: { userId },
    include: {
      track: { select: { id: true, name: true, cohortId: true } },
    },
  });

  if (assignments.length === 0) {
    return {
      assignedTracks: [],
      selectedTrackId: "",
      assignedTrackNames: "None",
      totalStudents: 0,
      trackAttendanceRate: 100,
      awaitingGradingCount: 0,
      activeStudentsCount: 0,
      gradingBacklogCount: 0,
      averageAttendanceRate: 100,
      upcomingSession: null,
      nextClass: null,
      latestAnnouncement: null,
      recentSubmissions: [],
    };
  }

  const assignedTracks = assignments.map((a) => ({
    id: a.track.id,
    name: a.track.name,
  }));

  const assignedTrackNames = assignedTracks.map((t) => t.name).join(", ");

  const activeTrackId =
    selectedTrackId && assignedTracks.some((t) => t.id === selectedTrackId)
      ? selectedTrackId
      : assignedTracks[0].id;

  const currentTrack = assignments.find((a) => a.track.id === activeTrackId)!.track;

  // 1. Next class for this instructor
  const nextSession = await db.session.findFirst({
    where: {
      cohortId: currentTrack.cohortId,
      OR: [{ trackId: activeTrackId }, { trackId: null }],
      endsAt: { gte: now },
    },
    include: {
      track: { select: { name: true } },
      createdBy: { select: { name: true, role: true } },
    },
    orderBy: { startsAt: "asc" },
  });

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
  const formatTime = (start: Date, end: Date) => {
    const s = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(start);
    const e = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(end);
    return `${s} - ${e}`;
  };

  let upcomingSession = null;
  let nextClass = null;

  if (nextSession) {
    const isLive = new Date(nextSession.startsAt) <= now && now <= new Date(nextSession.endsAt);
    upcomingSession = {
      id: nextSession.id,
      title: nextSession.title,
      track: nextSession.track ? nextSession.track.name : "All Tracks",
      type: "Live Lecture" as const,
      date: formatDate(new Date(nextSession.startsAt)),
      time: formatTime(new Date(nextSession.startsAt), new Date(nextSession.endsAt)),
      meetingUrl: nextSession.meetingUrl || "",
      instructorName: nextSession.createdBy.name,
      instructorRole: "Lead Instructor",
    };

    nextClass = {
      id: nextSession.id,
      title: nextSession.title,
      startsAt: new Date(nextSession.startsAt),
      endsAt: new Date(nextSession.endsAt),
      trackName: nextSession.track ? nextSession.track.name : "All Tracks (Shared)",
      checkinCode: nextSession.checkinCode,
      meetingUrl: nextSession.meetingUrl,
      isLive,
    };
  }

  // 2. Active students
  const activeStudentsCount = await db.enrollment.count({
    where: {
      trackId: activeTrackId,
      user: { role: Role.STUDENT },
    },
  });

  // 3. Grading backlog
  const gradingBacklogCount = await db.submission.count({
    where: {
      score: null,
      user: {
        enrollments: {
          some: { trackId: activeTrackId },
        },
      },
    },
  });

  // 4. Attendance rate
  const completedSessions = await db.session.findMany({
    where: {
      trackId: activeTrackId,
      endsAt: { lte: now },
    },
    select: { id: true },
  });

  let averageAttendanceRate = 100;
  if (completedSessions.length > 0 && activeStudentsCount > 0) {
    const attendances = await db.attendance.findMany({
      where: {
        sessionId: { in: completedSessions.map((s) => s.id) },
        user: {
          enrollments: {
            some: { trackId: activeTrackId },
          },
        },
      },
      select: { status: true },
    });

    const presentOrLate = attendances.filter(
      (a) => a.status === "PRESENT" || a.status === "LATE"
    ).length;

    const totalPossible = completedSessions.length * activeStudentsCount;
    averageAttendanceRate =
      totalPossible > 0 ? Math.round((presentOrLate / totalPossible) * 100) : 100;
  }

  // 5. Recent submissions
  const submissions = await db.submission.findMany({
    where: {
      user: {
        enrollments: {
          some: { trackId: activeTrackId },
        },
      },
    },
    include: {
      assignment: { select: { title: true, dueAt: true, maxScore: true } },
      user: {
        include: {
          enrollments: {
            where: { trackId: activeTrackId },
            include: { track: { select: { name: true } } },
          },
        },
      },
    },
    orderBy: { submittedAt: "desc" },
    take: 5,
  });

  const recentSubmissions = submissions.map((sub) => {
    const isLate = new Date(sub.submittedAt) > new Date(sub.assignment.dueAt);
    return {
      id: sub.id,
      assignmentTitle: sub.assignment.title,
      studentName: sub.user.name,
      studentEmail: sub.user.email,
      trackName: sub.user.enrollments[0]?.track?.name || "General",
      submittedAt: formatDate(new Date(sub.submittedAt)),
      isGraded: sub.score !== null,
      score: sub.score,
      maxScore: sub.assignment.maxScore,
      isLate,
      submissionUrl: sub.submissionUrl,
    };
  });

  // 6. Latest Announcement
  const announcement = await db.announcement.findFirst({
    where: {
      cohortId: currentTrack.cohortId,
      OR: [{ trackId: activeTrackId }, { trackId: null }],
    },
    include: {
      author: { select: { name: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const latestAnnouncement = announcement
    ? {
        id: announcement.id,
        title: announcement.title,
        body: announcement.body,
        authorName: announcement.author.name,
        authorRole: announcement.author.role,
        createdAt: formatDate(new Date(announcement.createdAt)),
      }
    : null;

  return {
    assignedTracks,
    selectedTrackId: activeTrackId,
    assignedTrackNames,
    totalStudents: activeStudentsCount,
    trackAttendanceRate: averageAttendanceRate,
    awaitingGradingCount: gradingBacklogCount,
    activeStudentsCount,
    gradingBacklogCount,
    averageAttendanceRate,
    upcomingSession,
    nextClass,
    latestAnnouncement,
    recentSubmissions,
  };
}

/**
 * Retrieves platform-wide cross-track overview for administrators directly from PostgreSQL.
 */
export async function getAdminProgressOverview(
  cohortFilter?: string
): Promise<AdminOverviewData> {
  const now = new Date();

  const cohort = await db.cohort.findFirst({
    where: cohortFilter && cohortFilter !== "all" ? { id: cohortFilter } : {},
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
    return {
      cohortName: "No Active Cohort",
      startDate: "N/A",
      endDate: "N/A",
      tracksCount: 0,
      totalActiveStudents: 0,
      totalInstructors: 0,
      upcomingSessionsCount: 0,
      averageCohortAttendance: 100,
      totalAssignments: 0,
      ungradedSubmissionsCount: 0,
      recentAnnouncements: [],
      trackOverviews: [],
    };
  }

  const activeCohortTracks = cohort.tracks;
  const tracksCount = activeCohortTracks.length;

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

  const upcomingSessionsCount = await db.session.count({
    where: {
      cohortId: cohort.id,
      startsAt: { gte: now },
    },
  });

  const trackOverviews: AdminTrackOverview[] = [];

  for (const tr of activeCohortTracks) {
    const activeCount = tr.enrollments.length;
    const instructorNames = tr.instructors.map((i) => i.user.name);
    const completedSessions = tr.sessions.filter((s) => new Date(s.endsAt) <= now);
    const completedSessionIds = completedSessions.map((s) => s.id);
    const studentIds = tr.enrollments.map((e) => e.userId);

    let attRate = 100;
    if (completedSessionIds.length > 0 && studentIds.length > 0) {
      const attendances = await db.attendance.findMany({
        where: {
          sessionId: { in: completedSessionIds },
          userId: { in: studentIds },
        },
      });
      const presentOrLate = attendances.filter(
        (a) => a.status === "PRESENT" || a.status === "LATE"
      ).length;
      const totalPossible = completedSessionIds.length * studentIds.length;
      attRate = totalPossible > 0 ? Math.round((presentOrLate / totalPossible) * 100) : 100;
    }

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

    trackOverviews.push({
      trackId: tr.id,
      trackName: tr.name,
      activeStudents: activeCount,
      instructors: instructorNames,
      attendanceRate: attRate,
      submissionRate: subRate,
      gradingBacklog,
    });
  }

  const averageCohortAttendance =
    trackOverviews.length > 0
      ? Math.round(
          trackOverviews.reduce((acc, t) => acc + t.attendanceRate, 0) /
            trackOverviews.length
        )
      : 100;

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
    startDate: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(cohort.startDate)),
    endDate: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(cohort.endDate)),
    tracksCount,
    totalActiveStudents: totalStudents,
    totalInstructors: instructorSet.size,
    upcomingSessionsCount,
    averageCohortAttendance,
    totalAssignments,
    ungradedSubmissionsCount: totalUngraded,
    recentAnnouncements,
    trackOverviews,
  };
}

/**
 * Backwards-compatible alias for admin overview query.
 */
export const getAdminOverview = getAdminProgressOverview;
