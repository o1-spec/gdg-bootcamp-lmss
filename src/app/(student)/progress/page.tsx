import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { requireStudent } from "@/lib/auth/session";
import { getStudentProgress } from "@/lib/progress/queries";
import { getStudentCompletion } from "@/lib/completion/queries";
import { getCertificate } from "@/lib/certificates/queries";
import { ClaimCertificateButton } from "@/components/certificates/claim-certificate-button";
import { db } from "@/lib/db";

export const metadata = {
  title: "My Progress | Bootcamp LMS",
};

export default async function StudentProgressPage() {
  const student = await requireStudent();
  const [progress, enrollment] = await Promise.all([
    getStudentProgress(student.id),
    db.enrollment.findFirst({
      where: { userId: student.id },
      select: { trackId: true },
    }),
  ]);

  const completion = enrollment
    ? await getStudentCompletion(student.id, enrollment.trackId)
    : null;

  const existingCert = enrollment
    ? await getCertificate(student.id, enrollment.trackId)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personal Progress & Performance"
        description={`${progress.studentName} • ${progress.trackName} Track • ${progress.cohortName}`}
      />

      {/* Completion Status & Certificate Eligibility */}
      {completion && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-900">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Bootcamp Completion Status
                </h2>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    completion.status === "COMPLETED"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : completion.status === "IN_PROGRESS"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                  }`}
                >
                  {completion.status === "COMPLETED"
                    ? "Completed"
                    : completion.status === "IN_PROGRESS"
                    ? "In Progress"
                    : "Requirements Not Met"}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Official graduation and certificate eligibility criteria
              </p>
            </div>

            {completion.status === "COMPLETED" && enrollment && (
              <ClaimCertificateButton
                trackId={enrollment.trackId}
                existingCertificateCode={existingCert?.certificateCode}
              />
            )}
          </div>

          {/* Requirements Overview */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">Attendance Threshold</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {completion.attendanceRate !== null ? `${completion.attendanceRate}%` : "—"} (Min. 75%)
                </span>
              </div>
              <p className="text-2xs text-zinc-500 dark:text-zinc-400">
                {completion.presentCount} attended / {completion.eligibleSessions} eligible completed sessions
              </p>
            </div>

            <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">Assignments Requirement</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {completion.assignmentsSubmitted} / {completion.assignmentsTotal} submitted
                </span>
              </div>
              <p className="text-2xs text-zinc-500 dark:text-zinc-400">
                All curriculum assignments must be submitted
              </p>
            </div>
          </div>

          {/* Unmet requirements list if any */}
          {completion.unmetRequirements.length > 0 && (
            <div className="mt-4 rounded-xl bg-amber-50/60 p-4 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
              <h4 className="text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1">
                Remaining Requirements
              </h4>
              <ul className="list-disc list-inside space-y-0.5 text-xs text-amber-800 dark:text-amber-300">
                {completion.unmetRequirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Primary Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Attendance Rate"
          value={`${progress.attendanceRate}%`}
          subtitle={`${progress.presentCount + progress.lateCount} of ${progress.totalCompletedSessions} completed sessions`}
          badge={{
            text: progress.attendanceRate >= 80 ? "On Track" : "Action Needed",
            variant: progress.attendanceRate >= 80 ? "success" : "warning",
          }}
        />

        <StatCard
          title="Assignments Submitted"
          value={`${progress.submittedAssignments} / ${progress.totalVisibleAssignments}`}
          subtitle={`${progress.missingAssignments} past due & unsubmitted`}
          badge={{
            text: progress.missingAssignments === 0 ? "Up to Date" : `${progress.missingAssignments} Missing`,
            variant: progress.missingAssignments === 0 ? "success" : "danger",
          }}
        />

        <StatCard
          title="Graded Assignments"
          value={`${progress.gradedAssignments} / ${progress.submittedAssignments}`}
          subtitle={`${progress.releasedGradesCount} grades released`}
          badge={{
            text: `${progress.releasedGradesCount} Released`,
            variant: "info",
          }}
        />

        <StatCard
          title="Average Released Score"
          value={
            progress.averageReleasedScore !== null
              ? `${progress.averageReleasedScore}%`
              : "—"
          }
          subtitle={
            progress.averageReleasedScore !== null
              ? "Across all released assignments"
              : "No released grades yet"
          }
          badge={{
            text:
              progress.averageReleasedScore !== null
                ? progress.averageReleasedScore >= 80
                  ? "Passing"
                  : "Needs Review"
                : "Pending",
            variant:
              progress.averageReleasedScore !== null && progress.averageReleasedScore >= 80
                ? "success"
                : "neutral",
          }}
        />
      </div>

      {/* Attendance Detail Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Attendance Breakdown Card */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950 sm:p-6 lg:col-span-1">
          <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 pb-3 border-b border-zinc-100 dark:border-zinc-900">
            Attendance Record
          </h3>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-600 dark:text-zinc-400">Present</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {progress.presentCount}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-600 dark:text-zinc-400">Late</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {progress.lateCount}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-600 dark:text-zinc-400">Absent / Missed</span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                {progress.absentCount}
              </span>
            </div>
            <div className="border-t border-zinc-100 pt-3 dark:border-zinc-900 flex items-center justify-between text-xs font-semibold">
              <span className="text-zinc-900 dark:text-zinc-100">Total Completed Sessions</span>
              <span>{progress.totalCompletedSessions}</span>
            </div>
          </div>

          <div className="mt-6 border-t border-zinc-100 pt-4 dark:border-zinc-900">
            <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Recent Attendance History
            </h4>
            {progress.recentAttendance.length === 0 ? (
              <p className="text-xs text-zinc-400">No completed sessions yet.</p>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {progress.recentAttendance.map((att) => (
                  <div key={att.sessionId} className="flex items-center justify-between py-2 text-xs">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100 line-clamp-1">
                        {att.sessionTitle}
                      </p>
                      <p className="text-[11px] text-zinc-400">{att.date}</p>
                    </div>
                    <Badge
                      variant={
                        att.status === "PRESENT"
                          ? "success"
                          : att.status === "LATE"
                          ? "warning"
                          : "danger"
                      }
                    >
                      {att.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Released Grades and Feedback */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950 sm:p-6 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-900">
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Released Grades & Feedback
              </h3>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Instructor evaluations and detailed written feedback
              </p>
            </div>
            <span className="text-xs font-medium text-zinc-500">
              {progress.releasedGradesCount} released
            </span>
          </div>

          {progress.recentGrades.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500 dark:text-zinc-400">
              <svg className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              <p className="mt-2 font-medium text-zinc-900 dark:text-zinc-100">No released grades yet</p>
              <p className="mt-0.5 text-zinc-400">
                Grades and instructor feedback will appear here as soon as they are released.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {progress.recentGrades.map((grade) => (
                <div key={grade.assignmentId} className="py-4 first:pt-3 last:pb-0 space-y-2">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 sm:text-sm">
                        {grade.assignmentTitle}
                      </h4>
                      {grade.gradedAt && (
                        <p className="text-[11px] text-zinc-400">
                          Evaluated on {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(grade.gradedAt)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {grade.score} / {grade.maxScore}
                      </span>
                      <Badge variant={grade.percentage >= 80 ? "success" : "warning"}>
                        {grade.percentage}%
                      </Badge>
                    </div>
                  </div>

                  {grade.feedback && (
                    <div className="rounded-lg bg-zinc-50 p-3 text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        Instructor Feedback:{" "}
                      </span>
                      {grade.feedback}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
