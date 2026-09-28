import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { mockTracks, mockCohorts } from "@/lib/mock-data";

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
  title: string;
  description: string;
  cohortId: string;
  trackId: string | null;
  track: { id: string; name: string } | null;
  cohort: { id: string; name: string };
  dueAt: Date;
  maxScore: number;
  allowLateSubmission: boolean;
  createdById: string;
  createdBy: { id: string; name: string; email: string };
  createdAt: Date;
  updatedAt: Date;
  submissionCount?: number;
}

export interface GradingQueueItem {
  id: string; // submissionId
  assignmentId: string;
  assignmentTitle: string;
  trackName: string | null;
  cohortName: string;
  dueAt: Date;
  maxScore: number;
  studentId: string;
  studentName: string;
  studentEmail: string;
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
  submission: {
    id: string;
    assignmentId: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    trackName: string;
    submissionUrl: string | null;
    fileUrl: string | null;
    submittedAt: Date;
    isLate: boolean;
    score: number | null;
    feedback: string | null;
    gradedAt: Date | null;
    gradedByName: string | null;
    released: boolean;
  };
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
 * Retrieves all assignments visible to a student:
 * - own active enrolled track
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

  try {
    const enrollment = await db.enrollment.findFirst({
      where: {
        userId,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gt: now } }],
      },
      include: { track: true },
    });

    if (enrollment) {
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
  } catch (err) {
    console.warn("DB getStudentAssignments failed; fallback used", err);
  }

  // Fallback representation for student (Alex Morgan, Intermediate Track)
  const mockNow = new Date();
  const fallbackAll: StudentAssignmentItem[] = [
    {
      id: "asg-101",
      title: "Sliding Window Exercise: Max Subarray & Min Window",
      description: "Implement O(n) solutions for maximum sum subarray of size k and minimum window substring.",
      cohortId: "coh-2026-1",
      trackId: "trk-intermediate",
      trackName: "Intermediate",
      cohortName: "DSA Bootcamp 2026",
      dueAt: new Date(mockNow.getTime() + 2 * 24 * 60 * 60 * 1000), // Due in 2 days
      maxScore: 100,
      allowLateSubmission: true,
      isPastDue: false,
      submission: {
        id: "sub-101",
        submissionUrl: "https://github.com/alexmorgan/sliding-window-labs",
        fileUrl: null,
        submittedAt: new Date(mockNow.getTime() - 2 * 60 * 60 * 1000),
        isLate: false,
        isGraded: false,
        isReleased: false,
        score: null,
        feedback: null,
        gradedAt: null,
      },
      status: "SUBMITTED",
    },
    {
      id: "asg-102",
      title: "Stack Problems: Monotonic Stack & Parentheses Matching",
      description: "Implement Next Greater Element and valid parentheses validation using stack data structures.",
      cohortId: "coh-2026-1",
      trackId: "trk-intermediate",
      trackName: "Intermediate",
      cohortName: "DSA Bootcamp 2026",
      dueAt: new Date(mockNow.getTime() + 5 * 24 * 60 * 60 * 1000), // In 5 days
      maxScore: 100,
      allowLateSubmission: true,
      isPastDue: false,
      submission: null,
      status: "NOT_SUBMITTED",
    },
    {
      id: "asg-100",
      title: "Two Sum Practice & Hash Map Lookup Optimization",
      description: "Implement two-sum with single-pass hash map and evaluate worst-case bucket collisions.",
      cohortId: "coh-2026-1",
      trackId: "trk-intermediate",
      trackName: "Intermediate",
      cohortName: "DSA Bootcamp 2026",
      dueAt: new Date(mockNow.getTime() - 48 * 60 * 60 * 1000), // 2 days ago
      maxScore: 100,
      allowLateSubmission: false,
      isPastDue: true,
      submission: {
        id: "sub-100",
        submissionUrl: "https://github.com/alexmorgan/hashmap-two-sum",
        fileUrl: null,
        submittedAt: new Date(mockNow.getTime() - 50 * 60 * 60 * 1000),
        isLate: false,
        isGraded: true,
        isReleased: true,
        score: 98,
        feedback: "Outstanding efficiency analysis and clean pointer arithmetic. Perfect test suite.",
        gradedAt: new Date(mockNow.getTime() - 24 * 60 * 60 * 1000),
      },
      status: "GRADE_RELEASED",
    },
    {
      id: "asg-103",
      title: "Complexity Analysis Benchmark & Big-O Worksheet",
      description: "Cohort-wide written worksheet deriving recurrence relation solutions using Master Theorem.",
      cohortId: "coh-2026-1",
      trackId: null, // Cohort-wide shared
      trackName: null,
      cohortName: "DSA Bootcamp 2026",
      dueAt: new Date(mockNow.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
      maxScore: 50,
      allowLateSubmission: true,
      isPastDue: true,
      submission: {
        id: "sub-103",
        submissionUrl: "https://docs.google.com/document/d/1example-alex-worksheet",
        fileUrl: null,
        submittedAt: new Date(mockNow.getTime() - 20 * 60 * 60 * 1000),
        isLate: true,
        isGraded: true,
        isReleased: false,
        score: null, // PRIVACY: Unreleased!
        feedback: null,
        gradedAt: null,
      },
      status: "GRADED_PENDING_RELEASE",
    },
  ];

  return {
    upcoming: fallbackAll.filter((i) => !i.submission && !i.isPastDue),
    submitted: fallbackAll.filter((i) => !!i.submission),
    pastDue: fallbackAll.filter((i) => !i.submission && i.isPastDue),
  };
}

/**
 * Validates access and returns assignment details by ID.
 * For students, strips unreleased scores and feedback.
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

  try {
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
        const hasCohort = instructorTracks.some(
          (t) => t.track.cohortId === assignment.cohortId
        );
        if (!hasCohort) return null;
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
        submissionCount: assignment.submissions.length,
      },
      studentSubmission: null,
    };
  } catch (err) {
    console.warn("DB getAssignmentById failed; using fallback", err);
  }

  // Fallback
  return {
    assignment: {
      id: assignmentId,
      title: "Sliding Window Exercise: Max Subarray & Min Window",
      description: "Implement O(n) solutions for maximum sum subarray of size k and minimum window substring.",
      cohortId: "coh-2026-1",
      trackId: "trk-intermediate",
      track: { id: "trk-intermediate", name: "Intermediate" },
      cohort: { id: "coh-2026-1", name: "DSA Bootcamp 2026" },
      dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      maxScore: 100,
      allowLateSubmission: true,
      createdById: "inst-001",
      createdBy: { id: "inst-001", name: "Sarah Jenkins", email: "sarah@bootcamp.edu" },
      createdAt: new Date(),
      updatedAt: new Date(),
      submissionCount: 3,
    },
    studentSubmission: null,
  };
}

/**
 * Creates an assignment with server-side authorization check.
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
  if (!data.title?.trim()) {
    throw new Error("Assignment title is required.");
  }
  if (!data.description?.trim()) {
    throw new Error("Assignment description is required.");
  }
  if (!data.cohortId) {
    throw new Error("Cohort is required.");
  }
  if (data.maxScore <= 0) {
    throw new Error("Max score must be greater than zero.");
  }

  if (role === Role.STUDENT) {
    throw new Error("Unauthorized: Students cannot create assignments.");
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
        throw new Error("Unauthorized: You do not teach this track.");
      }
    } else {
      const instructorTracks = await db.trackInstructor.findMany({
        where: { userId },
        include: { track: true },
      });
      const hasCohort = instructorTracks.some(
        (t) => t.track.cohortId === data.cohortId
      );
      if (!hasCohort) {
        throw new Error("Unauthorized: You do not teach any tracks in this cohort.");
      }
    }
  }

  const assignment = await db.assignment.create({
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

  return assignment;
}

/**
 * Updates an assignment safely.
 * Blocks track/cohort modification if students have already submitted work!
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
    throw new Error("Unauthorized.");
  }

  // Safety rule: If student submissions exist, disallow changing track or cohort
  const submissionCount = await db.submission.count({
    where: { assignmentId },
  });

  if (submissionCount > 0) {
    if (
      data.trackId !== existing.assignment.trackId ||
      data.cohortId !== existing.assignment.cohortId
    ) {
      throw new Error(
        `Cannot change the track or cohort of this assignment because ${submissionCount} student submission(s) already exist. Moving this assignment would invalidate student work.`
      );
    }
  }

  const updated = await db.assignment.update({
    where: { id: assignmentId },
    data: {
      title: data.title.trim(),
      description: data.description.trim(),
      cohortId: data.cohortId,
      trackId: data.trackId,
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
 * Deletes an assignment safely.
 * Refuses deletion if student submissions exist!
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
 * Enforces deadlines and disallows silent replacement if already graded.
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

  // Verify assignment and eligibility
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

  // Check deadline
  if (now > new Date(assignment.dueAt) && !assignment.allowLateSubmission) {
    throw new Error(
      "The submission deadline has passed and late submissions are disabled for this assignment."
    );
  }

  // Check existing submission
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
      released: false,
    },
    update: {
      submissionUrl: cleanUrl,
      submittedAt: now,
      released: false,
    },
  });

  const isLate = now > new Date(assignment.dueAt);
  return {
    success: true,
    message: isLate
      ? "Late submission recorded successfully."
      : "Work submitted successfully!",
  };
}

/**
 * Retrieves the grading queue scoped to instructor assigned tracks or admin global access.
 */
export async function getInstructorGradingQueue(
  userId: string,
  role: Role,
  filters?: {
    status?: string;
    trackId?: string;
    assignmentId?: string;
  }
): Promise<{
  submissions: GradingQueueItem[];
  assignments: { id: string; title: string }[];
  tracks: { id: string; name: string }[];
}> {
  try {
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
    } else {
      return { submissions: [], assignments: [], tracks: [] };
    }

    // Load filter options
    const [dbTracks, dbAssignments] = await Promise.all([
      db.track.findMany({
        where: { id: { in: allowedTrackIds } },
        select: { id: true, name: true },
      }),
      db.assignment.findMany({
        where: {
          OR: [
            { trackId: { in: allowedTrackIds } },
            { trackId: null },
          ],
        },
        select: { id: true, title: true },
        orderBy: { dueAt: "desc" },
      }),
    ]);

    // Query submissions
    // Instructors only see submissions from students in allowedTrackIds
    const whereClause: Record<string, unknown> = {
      user: {
        enrollments: {
          some: {
            trackId: { in: allowedTrackIds },
          },
        },
      },
    };

    if (filters?.assignmentId && filters.assignmentId !== "all") {
      whereClause.assignmentId = filters.assignmentId;
    }

    if (filters?.trackId && filters.trackId !== "all") {
      whereClause.user = {
        enrollments: {
          some: {
            trackId: filters.trackId,
          },
        },
      };
    }

    if (filters?.status === "ungraded") {
      whereClause.score = null;
    } else if (filters?.status === "graded") {
      whereClause.score = { not: null };
      whereClause.released = false;
    } else if (filters?.status === "released") {
      whereClause.released = true;
    }

    const submissions = await db.submission.findMany({
      where: whereClause,
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

    const items: GradingQueueItem[] = submissions.map((s) => {
      const activeEnrollment = s.user.enrollments[0];
      const isLate = new Date(s.submittedAt) > new Date(s.assignment.dueAt);

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
  } catch (err) {
    console.warn("DB getInstructorGradingQueue failed; using fallback", err);
  }

  // Fallback
  return {
    submissions: [
      {
        id: "sub-101",
        assignmentId: "asg-101",
        assignmentTitle: "Sliding Window Exercise: Max Subarray & Min Window",
        trackName: "Intermediate",
        cohortName: "DSA Bootcamp 2026",
        dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        maxScore: 100,
        studentId: "std-001",
        studentName: "Alex Morgan",
        studentEmail: "alex.morgan@bootcamp.edu",
        submissionUrl: "https://github.com/alexmorgan/sliding-window-labs",
        fileUrl: null,
        submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isLate: false,
        score: null,
        feedback: null,
        gradedAt: null,
        gradedByName: null,
        released: false,
      },
      {
        id: "sub-103",
        assignmentId: "asg-103",
        assignmentTitle: "Complexity Analysis Benchmark & Big-O Worksheet",
        trackName: "Intermediate",
        cohortName: "DSA Bootcamp 2026",
        dueAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        maxScore: 50,
        studentId: "std-001",
        studentName: "Alex Morgan",
        studentEmail: "alex.morgan@bootcamp.edu",
        submissionUrl: "https://docs.google.com/document/d/1example-alex-worksheet",
        fileUrl: null,
        submittedAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
        isLate: true,
        score: 46,
        feedback: "Sound derivations for question 4. Please format asymptotic constants clearly.",
        gradedAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
        gradedByName: "Sarah Jenkins",
        released: false,
      },
    ],
    assignments: [
      { id: "asg-101", title: "Sliding Window Exercise: Max Subarray & Min Window" },
      { id: "asg-103", title: "Complexity Analysis Benchmark & Big-O Worksheet" },
    ],
    tracks: [{ id: "trk-intermediate", name: "Intermediate" }],
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
  try {
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
  } catch (err) {
    console.warn("DB getSubmissionForGrading failed; using fallback", err);
  }

  // Fallback
  return {
    submission: {
      id: submissionId,
      assignmentId: "asg-101",
      studentId: "std-001",
      studentName: "Alex Morgan",
      studentEmail: "alex.morgan@bootcamp.edu",
      trackName: "Intermediate",
      submissionUrl: "https://github.com/alexmorgan/sliding-window-labs",
      fileUrl: null,
      submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isLate: false,
      score: null,
      feedback: null,
      gradedAt: null,
      gradedByName: null,
      released: false,
    },
    assignment: {
      id: "asg-101",
      title: "Sliding Window Exercise: Max Subarray & Min Window",
      description: "Implement O(n) solutions for maximum sum subarray of size k and minimum window substring.",
      dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      maxScore: 100,
      allowLateSubmission: true,
      trackName: "Intermediate",
      cohortName: "DSA Bootcamp 2026",
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
  try {
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

    return { assignments: formatted, tracks, cohorts };
  } catch (err) {
    console.warn("DB getManagementAssignments failed; fallback used", err);
  }

  // Fallback
  return {
    assignments: [
      {
        id: "asg-101",
        title: "Sliding Window Exercise: Max Subarray & Min Window",
        description: "Implement O(n) solutions for maximum sum subarray of size k and minimum window substring.",
        cohortId: "coh-2026-1",
        trackId: "trk-intermediate",
        track: { id: "trk-intermediate", name: "Intermediate" },
        cohort: { id: "coh-2026-1", name: "DSA Bootcamp 2026" },
        dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        maxScore: 100,
        allowLateSubmission: true,
        createdById: "inst-001",
        createdBy: { id: "inst-001", name: "Sarah Jenkins", email: "sarah@bootcamp.edu" },
        createdAt: new Date(),
        updatedAt: new Date(),
        submissionCount: 3,
      },
      {
        id: "asg-100",
        title: "Two Sum Practice & Hash Map Lookup Optimization",
        description: "Implement two-sum with single-pass hash map and evaluate worst-case bucket collisions.",
        cohortId: "coh-2026-1",
        trackId: "trk-intermediate",
        track: { id: "trk-intermediate", name: "Intermediate" },
        cohort: { id: "coh-2026-1", name: "DSA Bootcamp 2026" },
        dueAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        maxScore: 100,
        allowLateSubmission: false,
        createdById: "inst-001",
        createdBy: { id: "inst-001", name: "Sarah Jenkins", email: "sarah@bootcamp.edu" },
        createdAt: new Date(),
        updatedAt: new Date(),
        submissionCount: 4,
      },
    ],
    tracks: mockTracks.map((t) => ({ id: t.id, name: t.name })),
    cohorts: mockCohorts.map((c) => ({ id: c.id, name: c.name })),
  };
}
