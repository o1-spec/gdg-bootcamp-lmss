/**
 * Completion Policy
 * =================
 * Single source of truth for all completion criteria.
 * Edit this file to change the thresholds — nothing else needs updating.
 *
 * DEVELOPMENT ASSUMPTION: These defaults reflect typical bootcamp standards.
 * They have NOT been confirmed by a product decision and should be reviewed
 * before the first cohort launch.
 */
export const COMPLETION_POLICY = {
  /** Minimum attendance rate required (0–100). Approved excuses are excluded from denominator. */
  minAttendanceRate: 75,

  /** Student must have submitted ALL assignments (at least one submission URL). */
  requireAllAssignmentsSubmitted: true,

  /** If true, at least one released grade must exist (prevents completion with only ungraded subs). */
  requireAtLeastOneReleasedGrade: false,
} as const;

export type CompletionStatus = "IN_PROGRESS" | "COMPLETED" | "NOT_COMPLETED";

export interface CompletionResult {
  status: CompletionStatus;
  attendanceRate: number | null; // null when no eligible sessions
  eligibleSessions: number;
  presentCount: number;
  assignmentsTotal: number;
  assignmentsSubmitted: number;
  releasedGrades: number;
  unmetRequirements: string[];
}

/**
 * Derive completion status from pre-computed metrics.
 * Pure function — no DB access.
 */
export function deriveCompletion(metrics: {
  totalCompletedSessions: number;
  approvedExcusedAbsences: number;
  presentOrLate: number;
  assignmentsTotal: number;
  assignmentsSubmitted: number;
  releasedGrades: number;
}): CompletionResult {
  const {
    totalCompletedSessions,
    approvedExcusedAbsences,
    presentOrLate,
    assignmentsTotal,
    assignmentsSubmitted,
    releasedGrades,
  } = metrics;

  const eligibleSessions = Math.max(
    0,
    totalCompletedSessions - approvedExcusedAbsences
  );

  const attendanceRate =
    eligibleSessions === 0
      ? null
      : Math.round((presentOrLate / eligibleSessions) * 100);

  const unmetRequirements: string[] = [];

  // Attendance check
  if (attendanceRate !== null && attendanceRate < COMPLETION_POLICY.minAttendanceRate) {
    unmetRequirements.push(
      `Attendance ${attendanceRate}% is below the required ${COMPLETION_POLICY.minAttendanceRate}%`
    );
  }

  // Assignments check
  if (
    COMPLETION_POLICY.requireAllAssignmentsSubmitted &&
    assignmentsTotal > 0 &&
    assignmentsSubmitted < assignmentsTotal
  ) {
    const missing = assignmentsTotal - assignmentsSubmitted;
    unmetRequirements.push(
      `${missing} assignment${missing !== 1 ? "s" : ""} not yet submitted`
    );
  }

  // Released grade check
  if (
    COMPLETION_POLICY.requireAtLeastOneReleasedGrade &&
    releasedGrades === 0
  ) {
    unmetRequirements.push("No grades have been released yet");
  }

  // Derive status
  let status: CompletionStatus;
  if (assignmentsTotal === 0 && eligibleSessions === 0) {
    status = "IN_PROGRESS";
  } else if (unmetRequirements.length === 0) {
    status = "COMPLETED";
  } else {
    status = "NOT_COMPLETED";
  }

  return {
    status,
    attendanceRate,
    eligibleSessions,
    presentCount: presentOrLate,
    assignmentsTotal,
    assignmentsSubmitted,
    releasedGrades,
    unmetRequirements,
  };
}
