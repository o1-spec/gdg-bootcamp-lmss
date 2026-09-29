import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { requireStudent } from "@/lib/auth/session";
import { getStudentAttendance } from "@/lib/attendance/queries";
import { SubmitExcuseModal } from "@/components/excuses/submit-excuse-modal";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export const metadata = {
  title: "Attendance Records | Student Portal",
  description: "Verify class check-ins, punctuality records, excuses, and compliance",
};

export default async function StudentAttendancePage() {
  const user = await requireStudent();
  const { records, summary } = await getStudentAttendance(user.id);

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Attendance Records"
        description="Verify class check-ins, punctuality records, excuse submissions, and compliance"
      />

      {/* Summary KPI Cards */}
      <ScrollReveal mode="stagger" innerClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Attendance Rate"
          value={summary.attendanceRate !== null ? `${summary.attendanceRate}%` : "—"}
          subtitle={
            summary.approvedExcusedCount > 0
              ? `${summary.approvedExcusedCount} approved excuse${summary.approvedExcusedCount === 1 ? "" : "s"} excluded`
              : "Policy: 75% minimum required"
          }
          badge={{
            text:
              summary.attendanceRate !== null
                ? summary.attendanceRate >= 75
                  ? "Good Standing"
                  : "Needs Attention"
                : "No Eligible Sessions",
            variant:
              summary.attendanceRate !== null
                ? summary.attendanceRate >= 75
                  ? "success"
                  : "warning"
                : "neutral",
          }}
        />
        <StatCard
          title="Classes Present"
          value={`${summary.presentCount} / ${summary.totalCompletedEligible}`}
          subtitle={`${summary.lateCount} late check-in${summary.lateCount === 1 ? "" : "s"} recorded`}
          badge={{ text: "On-time", variant: "success" }}
        />
        <StatCard
          title="Late Check-ins"
          value={`${summary.lateCount}`}
          subtitle="Arrived after class started"
          badge={{
            text: summary.lateCount > 0 ? "Late" : "Zero late",
            variant: summary.lateCount > 0 ? "warning" : "neutral",
          }}
        />
        <StatCard
          title="Excused Absences"
          value={`${summary.approvedExcusedCount}`}
          subtitle="Excluded from requirement score"
          badge={{
            text: summary.approvedExcusedCount > 0 ? "Excused" : "None",
            variant: summary.approvedExcusedCount > 0 ? "info" : "neutral",
          }}
        />
      </ScrollReveal>

      {/* Attendance History Section */}
      <ScrollReveal>
        <section className="space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-[#E7E3DA]">
          <div>
            <h3 className="text-base font-bold tracking-tight text-[#171717]">
              Attendance Log
            </h3>
            <p className="text-xs text-[#737373]">
              Approved excused absences are automatically excluded from your attendance rate calculation.
            </p>
          </div>
          <span className="text-xs text-[#737373]">
            {records.length} {records.length === 1 ? "session" : "sessions"} tracked
          </span>
        </div>

        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E7E3DA] bg-white p-10 text-center shadow-2xs">
            <p className="text-xs text-[#737373]">
              No class sessions recorded yet. Attendance records will appear here as your cohort progresses.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-hidden rounded-2xl border border-[#E7E3DA] bg-white shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#E7E3DA] bg-[#F7F4ED]">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold text-[#171717]">
                      Session
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-[#171717]">
                      Date & Schedule
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-[#171717]">
                      Status
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-[#171717]">
                      Method
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-[#171717] text-right">
                      Excuse / Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E3DA]">
                  {records.map((r) => {
                    const isCompleted = new Date(r.endsAt) < new Date();
                    return (
                      <tr
                        key={r.sessionId}
                        className="transition-colors hover:bg-[#F7F4ED]/50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-bold text-[#171717]">
                            {r.sessionTitle}
                          </p>
                          <p className="text-[11px] text-[#737373] mt-0.5">
                            {r.trackName ? `${r.trackName} Track` : "Shared Cohort"} • Instructor: {r.instructorName}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-[#737373]">
                          <span className="font-medium text-[#171717]">{dateFormatter.format(r.startsAt)}</span>
                          <p className="text-2xs text-[#737373] mt-0.5">
                            {timeFormatter.format(r.startsAt)} – {timeFormatter.format(r.endsAt)}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {r.status === "PRESENT" ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#34A853]/10 px-2.5 py-0.5 text-xs font-medium text-[#34A853] border border-[#34A853]/25">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#34A853]" />
                                Present
                              </span>
                            ) : r.status === "LATE" ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FBBC04]/15 px-2.5 py-0.5 text-xs font-medium text-[#996500] border border-[#FBBC04]/30">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#FBBC04]" />
                                Late
                              </span>
                            ) : r.status === "ABSENT" ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EA4335]/10 px-2.5 py-0.5 text-xs font-medium text-[#EA4335] border border-[#EA4335]/25">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#EA4335]" />
                                Absent
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F7F4ED] px-2.5 py-0.5 text-xs font-medium text-[#737373] border border-[#E7E3DA]">
                                Upcoming
                              </span>
                            )}

                            {r.excuseStatus === "APPROVED" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#4285F4]/10 px-2.5 py-0.5 text-xs font-medium text-[#4285F4] border border-[#4285F4]/25">
                                Excused
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-[#737373]">
                          {r.method === "CHECK_IN" ? (
                            <span className="text-[11px] font-semibold text-[#34A853]">
                              Self Check-in
                            </span>
                          ) : r.method === "MANUAL" ? (
                            <span className="text-[11px] font-semibold text-[#4285F4]">
                              Instructor Marked
                            </span>
                          ) : r.method === "IMPORT" ? (
                            <span className="text-[11px] font-semibold text-[#737373]">
                              Imported Report
                            </span>
                          ) : (
                            <span className="text-2xs text-[#737373] italic">—</span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {r.excuseStatus && (
                              <span
                                className={`text-2xs font-semibold px-2.5 py-0.5 rounded-full border ${
                                  r.excuseStatus === "APPROVED"
                                    ? "bg-[#34A853]/10 text-[#34A853] border-[#34A853]/25"
                                    : r.excuseStatus === "REJECTED"
                                    ? "bg-[#EA4335]/10 text-[#EA4335] border-[#EA4335]/25"
                                    : "bg-[#FBBC04]/15 text-[#996500] border-[#FBBC04]/30"
                                }`}
                              >
                                {r.excuseStatus === "PENDING"
                                  ? "Excuse Pending"
                                  : r.excuseStatus === "APPROVED"
                                  ? "Excuse Approved"
                                  : "Excuse Rejected"}
                              </span>
                            )}

                            {isCompleted && (
                              <SubmitExcuseModal
                                sessionId={r.sessionId}
                                sessionTitle={r.sessionTitle}
                                currentExcuse={
                                  r.excuseId
                                    ? {
                                        id: r.excuseId,
                                        reason: r.excuseReason || "",
                                        status: r.excuseStatus || "PENDING",
                                        reviewNote: r.excuseReviewNote,
                                      }
                                    : null
                                }
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="space-y-3 sm:hidden">
              {records.map((r) => {
                const isCompleted = new Date(r.endsAt) < new Date();
                return (
                  <div
                    key={r.sessionId}
                    className="rounded-2xl border border-[#E7E3DA] bg-white p-5 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-[#171717]">
                          {r.sessionTitle}
                        </h4>
                        <p className="text-[11px] text-[#737373] mt-0.5">
                          {r.trackName ? `${r.trackName} Track` : "Shared Cohort"}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {r.status === "PRESENT" ? (
                          <span className="rounded-full bg-[#34A853]/10 text-[#34A853] border border-[#34A853]/25 px-2 py-0.5 text-2xs font-semibold">
                            Present
                          </span>
                        ) : r.status === "LATE" ? (
                          <span className="rounded-full bg-[#FBBC04]/15 text-[#996500] border border-[#FBBC04]/30 px-2 py-0.5 text-2xs font-semibold">
                            Late
                          </span>
                        ) : r.status === "ABSENT" ? (
                          <span className="rounded-full bg-[#EA4335]/10 text-[#EA4335] border border-[#EA4335]/25 px-2 py-0.5 text-2xs font-semibold">
                            Absent
                          </span>
                        ) : (
                          <span className="rounded-full bg-[#F7F4ED] text-[#737373] border border-[#E7E3DA] px-2 py-0.5 text-2xs font-medium">
                            Upcoming
                          </span>
                        )}
                        {r.excuseStatus === "APPROVED" && (
                          <span className="rounded-full bg-[#4285F4]/10 text-[#4285F4] border border-[#4285F4]/25 px-2 py-0.5 text-2xs font-semibold">
                            Excused
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#E7E3DA] pt-3 text-xs text-[#737373]">
                      <span>{dateFormatter.format(r.startsAt)}</span>
                      <div className="flex items-center gap-2">
                        <span>
                          {r.method === "CHECK_IN"
                            ? "Self Check-in"
                            : r.method === "MANUAL"
                            ? "Instructor Marked"
                            : r.method === "IMPORT"
                            ? "Imported"
                            : "Pending"}
                        </span>
                        {isCompleted && (
                          <SubmitExcuseModal
                            sessionId={r.sessionId}
                            sessionTitle={r.sessionTitle}
                            currentExcuse={
                              r.excuseId
                                ? {
                                    id: r.excuseId,
                                    reason: r.excuseReason || "",
                                    status: r.excuseStatus || "PENDING",
                                    reviewNote: r.excuseReviewNote,
                                  }
                                : null
                            }
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
      </ScrollReveal>
    </div>
  );
}
