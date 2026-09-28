import { Role } from "@prisma/client";
import { db } from "@/lib/db";

export interface StudentAssignmentItem {
  id: string;
  title: string;
  description: string;
  cohortId: string;
  trackId: string | null;
  trackName: string | null;
  cohortName: string;
  dueAt: Date;
  maxScore: number;
  allowLateSubmission: boolean;
  isPastDue: boolean;
  submission: {
    id: string;
    submissionUrl: string | null;
    fileUrl: string | null;
    submittedAt: Date;
    isLate: boolean;
    isGraded: boolean;
    isReleased: boolean;
    score: number | null;
    feedback: string | null;
    gradedAt: Date | null;
  } | null;
  status:
    | "NOT_SUBMITTED"
    | "SUBMITTED"
    | "SUBMITTED_LATE"
    | "GRADED_PENDING_RELEASE"
    | "GRADE_RELEASED";
}

export interface AssignmentWithDetails {
  id: string;
  cohortId: string;
  trackId: string | null;
  title: string;
  description: string;
  dueAt: Date;
  maxScore: number;
  allowLateSubmission: boolean;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  submissionCount?: number;
  track: { id: string; name: string } | null;
  cohort: { id: string; name: string };
  createdBy: { id: string; name: string; email: string };
}

export interface GradingQueueItem {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  trackName: string;
  cohortName?: string;
  dueAt?: Date;
  maxScore: number;
  submissionUrl: string | null;
  fileUrl: string | null;
  submittedAt: Date;
  isLate: boolean;
  score: number | null;
  feedback: string | null;
  gradedAt: Date | null;
  gradedByName: string | null;
  released: boolean;
}

export interface SubmissionForGrading {
  submission: GradingQueueItem;
  assignment: {
    id: string;
    title: string;
    description: string;
    dueAt: Date;
    maxScore: number;
    allowLateSubmission: boolean;
    trackName: string | null;
    cohortName: string;
  };
}

/**
 * Retrieves assignments visible to a student:
 * - track-specific assignments for student's active track
 * - cohort-wide shared assignments
 * Strips unreleased scores and feedback to ensure privacy!
 */
export async function getStudentAssignments(
  userId: string
): Promise<{
  upcoming: StudentAssignmentItem[];
  submitted: StudentAssignmentItem[];
  pastDue: StudentAssignmentItem[];
}> {
  const now = new Date();

  const enrollment = await db.enrollment.findFirst({
    where: {
      userId,
      startDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gt: now } }],
    },
    include: { track: true },
  });

  if (!enrollment) {
    return { upcoming: [], submitted: [], pastDue: [] };
  }

  const assignments = await db.assignment.findMany({
    where: {
      OR: [
        { trackId: enrollment.trackId },
        { trackId: null, cohortId: enrollment.track.cohortId },
      ],
    },
    include: {
      track: { select: { id: true, name: true } },
      cohort: { select: { id: true, name: true } },
      submissions: {
        where: { userId },
      },
    },
    orderBy: { dueAt: "asc" },
  });

  const allItems: StudentAssignmentItem[] = assignments.map((a) => {
    const sub = a.submissions[0];
    const isPastDue = now > new Date(a.dueAt);

    let submissionData = null;
    let status: StudentAssignmentItem["status"] = "NOT_SUBMITTED";

    if (sub) {
      const isLate = new Date(sub.submittedAt) > new Date(a.dueAt);
      const isGraded = sub.score !== null;
      const isReleased = sub.released;

      // PRIVACY RULE: Do not expose score or feedback unless released === true!
      submissionData = {
        id: sub.id,
        submissionUrl: sub.submissionUrl,
        fileUrl: sub.fileUrl,
        submittedAt: new Date(sub.submittedAt),
        isLate,
        isGraded,
        isReleased,
        score: isReleased ? sub.score : null,
        feedback: isReleased ? sub.feedback : null,
        gradedAt: isReleased && sub.gradedAt ? new Date(sub.gradedAt) : null,
      };

      if (isReleased) {
        status = "GRADE_RELEASED";
      } else if (isGraded) {
        status = "GRADED_PENDING_RELEASE";
      } else if (isLate) {
        status = "SUBMITTED_LATE";
      } else {
        status = "SUBMITTED";
      }
    }

    return {
      id: a.id,
      title: a.title,
      description: a.description,
      cohortId: a.cohortId,
      trackId: a.trackId,
      trackName: a.track ? a.track.name : null,
      cohortName: a.cohort.name,
      dueAt: new Date(a.dueAt),
      maxScore: a.maxScore,
      allowLateSubmission: a.allowLateSubmission,
      isPastDue,
      submission: submissionData,
      status,
    };
  });

  const upcoming = allItems.filter(
    (item) => !item.submission && !item.isPastDue
  );
  const submitted = allItems.filter((item) => !!item.submission);
  const pastDue = allItems.filter(
    (item) => !item.submission && item.isPastDue
  );

  return { upcoming, submitted, pastDue };
}

/**
 * Retrieves a single assignment by ID with authorization and role-based data projection.
 */
export async function getAssignmentById(
  assignmentId: string,
  userId: string,
  role: Role
): Promise<{
  assignment: AssignmentWithDetails;
  studentSubmission: StudentAssignmentItem["submission"] | null;
} | null> {
  const now = new Date();

  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      track: { select: { id: true, name: true } },
      cohort: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      submissions:
        role === Role.STUDENT
          ? { where: { userId } }
          : true,
    },
  });

  if (!assignment) return null;

  // Role-based visibility check
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

    if (assignment.trackId && assignment.trackId !== enrollment.trackId) {
      return null;
    }
    if (!assignment.trackId && assignment.cohortId !== enrollment.track.cohortId) {
      return null;
    }

    const sub = assignment.submissions[0];
    let studentSubmission = null;

    if (sub) {
      const isLate = new Date(sub.submittedAt) > new Date(assignment.dueAt);
      const isGraded = sub.score !== null;
      const isReleased = sub.released;

      studentSubmission = {
        id: sub.id,
        submissionUrl: sub.submissionUrl,
        fileUrl: sub.fileUrl,
        submittedAt: new Date(sub.submittedAt),
        isLate,
        isGraded,
        isReleased,
        score: isReleased ? sub.score : null,
        feedback: isReleased ? sub.feedback : null,
        gradedAt: isReleased && sub.gradedAt ? new Date(sub.gradedAt) : null,
      };
    }

    return {
      assignment: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        cohortId: assignment.cohortId,
        trackId: assignment.trackId,
        track: assignment.track,
        cohort: assignment.cohort,
        dueAt: new Date(assignment.dueAt),
        maxScore: assignment.maxScore,
        allowLateSubmission: assignment.allowLateSubmission,
        createdById: assignment.createdById,
        createdBy: assignment.createdBy,
        createdAt: new Date(assignment.createdAt),
        updatedAt: new Date(assignment.updatedAt),
        submissionCount: Array.isArray(assignment.submissions) ? assignment.submissions.length : 0,
      },
      studentSubmission,
    };
  }

  if (role === Role.INSTRUCTOR) {
    if (assignment.trackId) {
      const assignmentRecord = await db.trackInstructor.findUnique({
        where: {
          trackId_userId: {
            trackId: assignment.trackId,
            userId,
          },
        },
      });
      if (!assignmentRecord) return null;
    } else {
      const instructorTracks = await db.trackInstructor.findMany({
        where: { userId },
        include: { track: true },
      });
      const teachesInCohort = instructorTracks.some(
        (t) => t.track.cohortId === assignment.cohortId
      );
      if (!teachesInCohort) return null;
    }
  }

  return {
    assignment: {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      cohortId: assignment.cohortId,
      trackId: assignment.trackId,
      track: assignment.track,
      cohort: assignment.cohort,
      dueAt: new Date(assignment.dueAt),
      maxScore: assignment.maxScore,
      allowLateSubmission: assignment.allowLateSubmission,
      createdById: assignment.createdById,
      createdBy: assignment.createdBy,
      createdAt: new Date(assignment.createdAt),
      updatedAt: new Date(assignment.updatedAt),
      submissionCount: Array.isArray(assignment.submissions) ? assignment.submissions.length : 0,
    },
    studentSubmission: null,
  };
}

/**
 * Creates an assignment directly in PostgreSQL.
 */
export async function createAssignment(
  data: {
    cohortId: string;
    trackId: string | null;
    title: string;
    description: string;
    dueAt: Date;
    maxScore: number;
    allowLateSubmission: boolean;
  },
  userId: string,
  role: Role
): Promise<AssignmentWithDetails> {
  if (role === Role.STUDENT) {
    throw new Error("Unauthorized: Students cannot create assignments.");
  }

  if (role === Role.INSTRUCTOR) {
    if (data.trackId) {
      const assignmentRecord = await db.trackInstructor.findUnique({
        where: {
          trackId_userId: {
            trackId: data.trackId,
            userId,
          },
        },
      });
      if (!assignmentRecord) {
        throw new Error("Unauthorized: You do not teach this track.");
      }
    } else {
      const instructorTracks = await db.trackInstructor.findMany({
        where: { userId },
        include: { track: true },
      });
      const teachesInCohort = instructorTracks.some(
        (t) => t.track.cohortId === data.cohortId
      );
      if (!teachesInCohort) {
        throw new Error("Unauthorized: You cannot create shared assignments for this cohort.");
      }
    }
  }

  const created = await db.assignment.create({
    data: {
      cohortId: data.cohortId,
      trackId: data.trackId,
      title: data.title.trim(),
      description: data.description.trim(),
      dueAt: data.dueAt,
      maxScore: data.maxScore,
      allowLateSubmission: data.allowLateSubmission,
      createdById: userId,
    },
    include: {
      track: { select: { id: true, name: true } },
      cohort: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return created;
}

/**
 * Updates an assignment directly in PostgreSQL.
 */
export async function updateAssignment(
  assignmentId: string,
  data: {
    cohortId: string;
    trackId: string | null;
    title: string;
    description: string;
    dueAt: Date;
    maxScore: number;
    allowLateSubmission: boolean;
  },
  userId: string,
  role: Role
): Promise<AssignmentWithDetails> {
  const existing = await getAssignmentById(assignmentId, userId, role);
  if (!existing) {
    throw new Error("Assignment not found or unauthorized.");
  }

  if (role === Role.STUDENT) {
    throw new Error("Unauthorized: Students cannot update assignments.");
  }

  if (role === Role.INSTRUCTOR && data.trackId && data.trackId !== existing.assignment.trackId) {
    const assignmentRecord = await db.trackInstructor.findUnique({
      where: {
        trackId_userId: {
          trackId: data.trackId,
          userId,
        },
      },
    });
    if (!assignmentRecord) {
      throw new Error("Unauthorized: You do not teach this track.");
    }
  }

  const updated = await db.assignment.update({
    where: { id: assignmentId },
    data: {
      cohortId: data.cohortId,
      trackId: data.trackId,
      title: data.title.trim(),
      description: data.description.trim(),
      dueAt: data.dueAt,
      maxScore: data.maxScore,
      allowLateSubmission: data.allowLateSubmission,
    },
    include: {
      track: { select: { id: true, name: true } },
      cohort: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return updated;
}

/**
 * Deletes an assignment with historical student submission protection.
 */
export async function deleteAssignment(
  assignmentId: string,
  userId: string,
  role: Role
): Promise<void> {
  const existing = await getAssignmentById(assignmentId, userId, role);
  if (!existing) {
    throw new Error("Assignment not found or unauthorized.");
  }

  if (role === Role.STUDENT) {
    throw new Error("Unauthorized.");
  }

  const submissionCount = await db.submission.count({
    where: { assignmentId },
  });

  if (submissionCount > 0) {
    throw new Error(
      `Cannot delete this assignment because ${submissionCount} student submission(s) exist. Deleting this assignment would destroy historical student work.`
    );
  }

  await db.assignment.delete({
    where: { id: assignmentId },
  });
}

/**
 * Submits or resubmits student work via web link.
 */
export async function submitAssignment(
  assignmentId: string,
  submissionUrl: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  const now = new Date();
  const cleanUrl = submissionUrl.trim();

  try {
    const parsed = new URL(cleanUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("Please enter a valid HTTP or HTTPS submission URL.");
    }
  } catch {
    throw new Error("Invalid URL format. Please provide a valid web link.");
  }

  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
    include: { track: true },
  });

  if (!assignment) {
    throw new Error("Assignment not found.");
  }

  const enrollment = await db.enrollment.findFirst({
    where: {
      userId,
      startDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gt: now } }],
    },
    include: { track: true },
  });

  if (!enrollment) {
    throw new Error("You do not have an active enrollment in this bootcamp.");
  }

  if (assignment.trackId && assignment.trackId !== enrollment.trackId) {
    throw new Error("You are not enrolled in the track for this assignment.");
  }

  if (!assignment.trackId && assignment.cohortId !== enrollment.track.cohortId) {
    throw new Error("You are not enrolled in the cohort for this shared assignment.");
  }

  if (now > new Date(assignment.dueAt) && !assignment.allowLateSubmission) {
    throw new Error(
      "The submission deadline has passed and late submissions are disabled for this assignment."
    );
  }

  const existing = await db.submission.findUnique({
    where: {
      assignmentId_userId: {
        assignmentId,
        userId,
      },
    },
  });

  if (existing && existing.score !== null) {
    throw new Error(
      "This assignment has already been evaluated and graded. Resubmission is not permitted."
    );
  }

  await db.submission.upsert({
    where: {
      assignmentId_userId: {
        assignmentId,
        userId,
      },
    },
    create: {
      assignmentId,
      userId,
      submissionUrl: cleanUrl,
      submittedAt: now,
    },
    update: {
      submissionUrl: cleanUrl,
      submittedAt: now,
    },
  });

  return {
    success: true,
    message: now > new Date(assignment.dueAt)
      ? "Assignment submitted (Late)."
      : "Assignment submitted successfully.",
  };
}

/**
 * Retrieves instructor grading queue scoped to assigned tracks.
 */
export async function getInstructorGradingQueue(
  userId: string,
  role: Role,
  filtersOrAssignmentId?:
    | string
    | {
        status?: string;
        trackId?: string;
        assignmentId?: string;
      },
  filterTrackIdArg?: string,
  filterStatusArg?: "all" | "pending" | "graded"
): Promise<{
  submissions: GradingQueueItem[];
  assignments: { id: string; title: string }[];
  tracks: { id: string; name: string }[];
}> {
  let filterAssignmentId: string | undefined;
  let filterTrackId: string | undefined;
  let filterStatus: "all" | "pending" | "graded" | undefined;

  if (typeof filtersOrAssignmentId === "object" && filtersOrAssignmentId !== null) {
    filterAssignmentId = filtersOrAssignmentId.assignmentId;
    filterTrackId = filtersOrAssignmentId.trackId;
    filterStatus = filtersOrAssignmentId.status as "all" | "pending" | "graded" | undefined;
  } else {
    filterAssignmentId = filtersOrAssignmentId;
    filterTrackId = filterTrackIdArg;
    filterStatus = filterStatusArg;
  }
  let allowedTrackIds: string[] = [];

  if (role === Role.ADMIN) {
    const allTracks = await db.track.findMany({ select: { id: true } });
    allowedTrackIds = allTracks.map((t) => t.id);
  } else if (role === Role.INSTRUCTOR) {
    const assignments = await db.trackInstructor.findMany({
      where: { userId },
      select: { trackId: true },
    });
    allowedTrackIds = assignments.map((a) => a.trackId);
  }

  const [dbTracks, dbAssignments] = await Promise.all([
    db.track.findMany({
      where: role === Role.ADMIN ? {} : { id: { in: allowedTrackIds } },
      select: { id: true, name: true },
    }),
    db.assignment.findMany({
      where:
        role === Role.ADMIN
          ? {}
          : {
              OR: [{ trackId: { in: allowedTrackIds } }, { trackId: null }],
            },
      select: { id: true, title: true },
    }),
  ]);

  const where: Record<string, unknown> = {};

  if (filterAssignmentId && filterAssignmentId !== "all") {
    where.assignmentId = filterAssignmentId;
  }

  if (filterStatus === "pending") {
    where.score = null;
  } else if (filterStatus === "graded") {
    where.score = { not: null };
  }

  where.user = {
    enrollments: {
      some: {
        trackId:
          filterTrackId && filterTrackId !== "all"
            ? filterTrackId
            : { in: allowedTrackIds },
      },
    },
  };

  const submissions = await db.submission.findMany({
    where,
    include: {
      assignment: {
        include: {
          track: { select: { id: true, name: true } },
          cohort: { select: { id: true, name: true } },
        },
      },
      user: {
        include: {
          enrollments: {
            include: { track: { select: { id: true, name: true } } },
          },
        },
      },
      gradedBy: { select: { id: true, name: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  const items = submissions.map((s) => {
    const isLate = new Date(s.submittedAt) > new Date(s.assignment.dueAt);
    const activeEnrollment = s.user.enrollments[0];

    return {
      id: s.id,
      assignmentId: s.assignmentId,
      assignmentTitle: s.assignment.title,
      trackName: activeEnrollment?.track?.name || s.assignment.track?.name || "Shared",
      cohortName: s.assignment.cohort.name,
      dueAt: new Date(s.assignment.dueAt),
      maxScore: s.assignment.maxScore,
      studentId: s.user.id,
      studentName: s.user.name,
      studentEmail: s.user.email,
      submissionUrl: s.submissionUrl,
      fileUrl: s.fileUrl,
      submittedAt: new Date(s.submittedAt),
      isLate,
      score: s.score,
      feedback: s.feedback,
      gradedAt: s.gradedAt ? new Date(s.gradedAt) : null,
      gradedByName: s.gradedBy ? s.gradedBy.name : null,
      released: s.released,
    };
  });

  return {
    submissions: items,
    assignments: dbAssignments,
    tracks: dbTracks,
  };
}

/**
 * Retrieves a submission for grading by ID, verifying instructor/admin authorization.
 */
export async function getSubmissionForGrading(
  submissionId: string,
  userId: string,
  role: Role
): Promise<SubmissionForGrading | null> {
  const sub = await db.submission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: {
        include: {
          track: { select: { id: true, name: true } },
          cohort: { select: { id: true, name: true } },
        },
      },
      user: {
        include: {
          enrollments: {
            include: { track: { select: { id: true, name: true } } },
          },
        },
      },
      gradedBy: { select: { id: true, name: true } },
    },
  });

  if (!sub) return null;

  if (role === Role.INSTRUCTOR) {
    const activeEnrollment = sub.user.enrollments[0];
    if (!activeEnrollment) return null;

    const assignmentRecord = await db.trackInstructor.findUnique({
      where: {
        trackId_userId: {
          trackId: activeEnrollment.trackId,
          userId,
        },
      },
    });
    if (!assignmentRecord) return null;
  }

  const studentEnrollment = sub.user.enrollments[0];
  const isLate = new Date(sub.submittedAt) > new Date(sub.assignment.dueAt);

  return {
    submission: {
      id: sub.id,
      assignmentId: sub.assignmentId,
      assignmentTitle: sub.assignment.title,
      maxScore: sub.assignment.maxScore,
      studentId: sub.user.id,
      studentName: sub.user.name,
      studentEmail: sub.user.email,
      trackName: studentEnrollment?.track?.name || "Enrolled Track",
      submissionUrl: sub.submissionUrl,
      fileUrl: sub.fileUrl,
      submittedAt: new Date(sub.submittedAt),
      isLate,
      score: sub.score,
      feedback: sub.feedback,
      gradedAt: sub.gradedAt ? new Date(sub.gradedAt) : null,
      gradedByName: sub.gradedBy ? sub.gradedBy.name : null,
      released: sub.released,
    },
    assignment: {
      id: sub.assignment.id,
      title: sub.assignment.title,
      description: sub.assignment.description,
      dueAt: new Date(sub.assignment.dueAt),
      maxScore: sub.assignment.maxScore,
      allowLateSubmission: sub.assignment.allowLateSubmission,
      trackName: sub.assignment.track ? sub.assignment.track.name : null,
      cohortName: sub.assignment.cohort.name,
    },
  };
}

/**
 * Saves a score and feedback for a submission, optionally releasing it immediately.
 */
export async function gradeSubmission(
  submissionId: string,
  score: number,
  feedback: string,
  release: boolean,
  graderId: string,
  role: Role
): Promise<void> {
  const existing = await getSubmissionForGrading(submissionId, graderId, role);
  if (!existing) {
    throw new Error("Submission not found or unauthorized.");
  }

  if (score < 0) {
    throw new Error("Score cannot be negative.");
  }
  if (score > existing.assignment.maxScore) {
    throw new Error(
      `Score (${score}) cannot exceed the maximum score (${existing.assignment.maxScore}).`
    );
  }

  await db.submission.update({
    where: { id: submissionId },
    data: {
      score: Math.round(score),
      feedback: feedback.trim() || null,
      gradedById: graderId,
      gradedAt: new Date(),
      released: release ? true : existing.submission.released,
    },
  });
}

/**
 * Explicitly releases a grade to make it visible to the student.
 */
export async function releaseGrade(
  submissionId: string,
  graderId: string,
  role: Role
): Promise<void> {
  const existing = await getSubmissionForGrading(submissionId, graderId, role);
  if (!existing) {
    throw new Error("Submission not found or unauthorized.");
  }

  if (existing.submission.score === null) {
    throw new Error("Cannot release an ungraded submission. Please score first.");
  }

  await db.submission.update({
    where: { id: submissionId },
    data: { released: true },
  });
}

/**
 * Retrieves all assignments for instructor or admin management views.
 */
export async function getManagementAssignments(
  userId: string,
  role: Role,
  trackFilter?: string
): Promise<{
  assignments: (AssignmentWithDetails & { submissionCount: number })[];
  tracks: { id: string; name: string }[];
  cohorts: { id: string; name: string }[];
}> {
  let allowedTrackIds: string[] = [];

  if (role === Role.ADMIN) {
    const allTracks = await db.track.findMany({ select: { id: true } });
    allowedTrackIds = allTracks.map((t) => t.id);
  } else if (role === Role.INSTRUCTOR) {
    const assignments = await db.trackInstructor.findMany({
      where: { userId },
      select: { trackId: true },
    });
    allowedTrackIds = assignments.map((a) => a.trackId);
  }

  const [tracks, cohorts] = await Promise.all([
    db.track.findMany({
      where: role === Role.ADMIN ? {} : { id: { in: allowedTrackIds } },
      select: { id: true, name: true },
    }),
    db.cohort.findMany({ select: { id: true, name: true } }),
  ]);

  const where: Record<string, unknown> = {};
  if (trackFilter && trackFilter !== "all") {
    where.trackId = trackFilter === "shared" ? null : trackFilter;
  } else if (role === Role.INSTRUCTOR) {
    where.OR = [
      { trackId: { in: allowedTrackIds } },
      { trackId: null },
    ];
  }

  const assignments = await db.assignment.findMany({
    where,
    include: {
      track: { select: { id: true, name: true } },
      cohort: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      submissions: { select: { id: true } },
    },
    orderBy: { dueAt: "desc" },
  });

  const formatted = assignments.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    cohortId: a.cohortId,
    trackId: a.trackId,
    track: a.track,
    cohort: a.cohort,
    dueAt: new Date(a.dueAt),
    maxScore: a.maxScore,
    allowLateSubmission: a.allowLateSubmission,
    createdById: a.createdById,
    createdBy: a.createdBy,
    createdAt: new Date(a.createdAt),
    updatedAt: new Date(a.updatedAt),
    submissionCount: a.submissions.length,
  }));

  return {
    assignments: formatted,
    tracks,
    cohorts,
  };
}
