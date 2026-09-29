import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { requireStudent } from "@/lib/auth/session";
import { getStudentProgress } from "@/lib/progress/queries";
import { getStudentCompletion } from "@/lib/completion/queries";
import { getCertificate } from "@/lib/certificates/queries";
import { ClaimCertificateButton } from "@/components/certificates/claim-certificate-button";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
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
        title="My Progress"
        description={`${progress.studentName} • ${progress.trackName} Track • ${progress.cohortName}`}
      />

      {/* Top 4 Summary Cards */}
      <ScrollReveal mode="stagger" innerClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Attendance Rate"
          value={`${progress.attendanceRate}%`}
          subtitle={`${progress.presentCount + progress.lateCount} of ${progress.totalCompletedSessions} completed sessions`}
          badge={{
            text: progress.attendanceRate >= 75 ? "On Track" : "Action Needed",
            variant: progress.attendanceRate >= 75 ? "success" : "warning",
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

        <StatCard
          title="Completion Status"
          value={
            completion
              ? completion.status === "COMPLETED"
                ? "Completed"
                : completion.status === "IN_PROGRESS"
                ? "In Progress"
                : "Not Met"
              : "In Progress"
          }
          subtitle={completion ? `${completion.unmetRequirements.length} requirements pending` : "Tracking active"}
          badge={{
            text: completion?.status === "COMPLETED" ? "Eligible" : "Underway",
            variant: completion?.status === "COMPLETED" ? "success" : "info",
          }}
        />
      </ScrollReveal>

      {/* Completion Status & Certificate Eligibility Card */}
      {completion && (
        <ScrollReveal>
          <div className="rounded-2xl border border-[#E7E3DA] bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E7E3DA]">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm font-semibold text-[#171717]">
                  Bootcamp Completion & Certificate
                </h2>
                <span
                  className={`inline-flex rounded-md px-2.5 py-0.5 text-2xs font-semibold ${
                    completion.status === "COMPLETED"
                      ? "bg-[#34A853]/10 text-[#34A853]"
                      : completion.status === "IN_PROGRESS"
                      ? "bg-[#FBBC04]/15 text-[#171717]"
                      : "bg-[#EA4335]/10 text-[#EA4335]"
                  }`}
                >
                  {completion.status === "COMPLETED"
                    ? "Completed"
                    : completion.status === "IN_PROGRESS"
                    ? "In Progress"
                    : "Requirements Not Met"}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#737373]">
                Official graduation threshold criteria (75% attendance + all assignments submitted)
              </p>
            </div>

            {completion.status === "COMPLETED" && enrollment && (
              <ClaimCertificateButton
                trackId={enrollment.trackId}
                existingCertificateCode={existingCert?.certificateCode}
              />
            )}
          </div>

          {/* Progress Bars & Requirements Detail */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-[#F7F4ED]/60 p-4 border border-[#E7E3DA] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-[#171717]">Attendance Progress</span>
                <span className="font-semibold text-[#171717]">
                  {completion.attendanceRate !== null ? `${completion.attendanceRate}%` : "—"} (Min. 75%)
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-2 w-full rounded-full bg-[#E7E3DA] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    (completion.attendanceRate ?? 0) >= 75
                      ? "bg-[#34A853]"
                      : "bg-[#FBBC04]"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, completion.attendanceRate ?? 0))}%` }}
                />
              </div>
              <p className="text-2xs text-[#737373]">
                {completion.presentCount} attended of {completion.eligibleSessions} eligible completed sessions
              </p>
            </div>

            <div className="rounded-xl bg-[#F7F4ED]/60 p-4 border border-[#E7E3DA] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-[#171717]">Assignment Submissions</span>
                <span className="font-semibold text-[#171717]">
                  {completion.assignmentsSubmitted} / {completion.assignmentsTotal} ({completion.assignmentsTotal > 0 ? Math.round((completion.assignmentsSubmitted / completion.assignmentsTotal) * 100) : 0}%)
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-2 w-full rounded-full bg-[#E7E3DA] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    completion.assignmentsSubmitted >= completion.assignmentsTotal && completion.assignmentsTotal > 0
                      ? "bg-[#34A853]"
                      : "bg-[#4285F4]"
                  }`}
                  style={{
                    width: `${
                      completion.assignmentsTotal > 0
                        ? Math.min(100, Math.round((completion.assignmentsSubmitted / completion.assignmentsTotal) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
              <p className="text-2xs text-[#737373]">
                All visible curriculum assignments must be submitted to earn a certificate
              </p>
            </div>
          </div>

          {/* Unmet requirements list if any */}
          {completion.unmetRequirements.length > 0 && (
            <div className="mt-4 rounded-xl bg-[#FBBC04]/10 p-4 border border-[#FBBC04]/30">
              <h4 className="text-xs font-semibold text-[#171717] mb-1.5 flex items-center gap-1.5">
                <svg className="h-4 w-4 text-[#FBBC04]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                Remaining Requirements to Graduate
              </h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-[#737373]">
                {completion.unmetRequirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        </ScrollReveal>
      )}

      {/* Attendance Record & Released Grades Detail */}
      <ScrollReveal innerClassName="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Attendance Breakdown Card */}
        <div className="rounded-2xl border border-[#E7E3DA] bg-white p-5 sm:p-6 shadow-xs lg:col-span-1">
          <h3 className="text-sm font-semibold tracking-tight text-[#171717] pb-3 border-b border-[#E7E3DA]">
            Attendance Breakdown
          </h3>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#737373]">Present</span>
              <span className="font-semibold text-[#34A853]">
                {progress.presentCount}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#737373]">Late</span>
              <span className="font-semibold text-[#FBBC04]">
                {progress.lateCount}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#737373]">Absent / Missed</span>
              <span className="font-semibold text-[#EA4335]">
                {progress.absentCount}
              </span>
            </div>
            <div className="border-t border-[#E7E3DA] pt-3 flex items-center justify-between text-xs font-semibold">
              <span className="text-[#171717]">Total Completed Sessions</span>
              <span className="text-[#171717]">{progress.totalCompletedSessions}</span>
            </div>
          </div>

          <div className="mt-6 border-t border-[#E7E3DA] pt-4">
            <h4 className="text-xs font-semibold text-[#171717] mb-2.5">
              Recent Attendance History
            </h4>
            {progress.recentAttendance.length === 0 ? (
              <p className="text-xs text-[#737373]">No completed sessions recorded yet.</p>
            ) : (
              <div className="divide-y divide-[#E7E3DA]">
                {progress.recentAttendance.map((att) => (
                  <div key={att.sessionId} className="flex items-center justify-between py-2 text-xs">
                    <div>
                      <p className="font-medium text-[#171717] line-clamp-1">
                        {att.sessionTitle}
                      </p>
                      <p className="text-2xs text-[#737373]">{att.date}</p>
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
        <div className="rounded-2xl border border-[#E7E3DA] bg-white p-5 sm:p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-[#E7E3DA]">
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-[#171717]">
                Released Grades & Feedback
              </h3>
              <p className="mt-0.5 text-xs text-[#737373]">
                Instructor evaluations and detailed written feedback
              </p>
            </div>
            <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-[#F7F4ED] text-[#737373] border border-[#E7E3DA]">
              {progress.releasedGradesCount} released
            </span>
          </div>

          {progress.recentGrades.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#737373]">
              <svg className="mx-auto h-8 w-8 text-[#737373]/40" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              <p className="mt-2 font-medium text-[#171717]">No released grades yet</p>
              <p className="mt-0.5 text-[#737373]">
                Grades and instructor feedback will appear here as soon as they are officially released.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E7E3DA]">
              {progress.recentGrades.map((grade) => (
                <div key={grade.assignmentId} className="py-4 first:pt-3 last:pb-0 space-y-2.5">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-[#171717] sm:text-sm">
                        {grade.assignmentTitle}
                      </h4>
                      {grade.gradedAt && (
                        <p className="text-2xs text-[#737373]">
                          Evaluated on {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(grade.gradedAt)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#171717]">
                        {grade.score} / {grade.maxScore}
                      </span>
                      <Badge variant={grade.percentage >= 80 ? "success" : "warning"}>
                        {grade.percentage}%
                      </Badge>
                    </div>
                  </div>

                  {grade.feedback && (
                    <div className="rounded-xl bg-[#F7F4ED] p-3 text-xs text-[#171717] border border-[#E7E3DA]">
                      <span className="font-semibold text-[#171717]">
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
      </ScrollReveal>
    </div>
  );
}
