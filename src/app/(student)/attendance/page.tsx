import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { requireStudent } from "@/lib/auth/session";
import { getStudentAttendance } from "@/lib/attendance/queries";

export const metadata = {
  title: "Attendance Records | Student Portal",
  description: "Verify class check-ins, punctuality records, and attendance compliance",
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
        description="Verify class check-ins, punctuality records, and attendance compliance"
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Overall Attendance"
          value={`${summary.attendanceRate}%`}
          subtitle="Policy: 85% minimum required"
          badge={{
            text: summary.attendanceRate >= 85 ? "Good Standing" : "Needs Attention",
            variant: summary.attendanceRate >= 85 ? "success" : "warning",
          }}
        />
        <StatCard
          title="Classes Present"
          value={`${summary.presentCount} / ${summary.totalCompletedEligible}`}
          subtitle={`${summary.lateCount} late check-in${summary.lateCount === 1 ? "" : "s"} recorded`}
          badge={{ text: "On-time", variant: "info" }}
        />
        <StatCard
          title="Unexcused Absences"
          value={`${summary.absentCount + summary.unmarkedCount}`}
          subtitle="Completed sessions without check-in"
          badge={{
            text: summary.absentCount + summary.unmarkedCount === 0 ? "Perfect Attendance" : "Recorded",
            variant: summary.absentCount + summary.unmarkedCount === 0 ? "success" : "neutral",
          }}
        />
        <StatCard
          title="Eligible Classes"
          value={`${summary.totalCompletedEligible} completed`}
          subtitle={`${summary.totalScheduled} total scheduled on syllabus`}
          badge={{ text: "Active Cohort", variant: "neutral" }}
        />
      </div>

      {/* Attendance History Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Attendance Log
          </h2>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {records.length} {records.length === 1 ? "session" : "sessions"} tracked
          </span>
        </div>

        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-10 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              No class sessions recorded yet. Attendance records will appear here as your cohort progresses.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-950">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-200 bg-zinc-50/75 dark:border-zinc-800 dark:bg-zinc-900/40">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                      Session
                    </th>
                    <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                      Date & Schedule
                    </th>
                    <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                      Status
                    </th>
                    <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                      Method
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {records.map((r) => (
                    <tr
                      key={r.sessionId}
                      className="transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30"
                    >
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {r.sessionTitle}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {r.trackName ? `${r.trackName} Track` : "Shared Cohort"} • Instructor: {r.instructorName}
                        </p>
                      </td>

                      <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-400">
                        {dateFormatter.format(r.startsAt)}
                        <p className="text-2xs text-zinc-400">
                          {timeFormatter.format(r.startsAt)} – {timeFormatter.format(r.endsAt)}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        {r.status === "PRESENT" ? (
                          <Badge variant="success">Present</Badge>
                        ) : r.status === "LATE" ? (
                          <Badge variant="warning">Late</Badge>
                        ) : r.status === "ABSENT" ? (
                          <Badge variant="danger">Absent</Badge>
                        ) : (
                          <Badge variant="neutral">Upcoming / Unmarked</Badge>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-zinc-500 dark:text-zinc-400">
                        {r.method === "CHECK_IN" ? (
                          <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                            Self Check-in
                          </span>
                        ) : r.method === "MANUAL" ? (
                          <span className="text-[11px] font-medium text-blue-700 dark:text-blue-300">
                            Instructor Marked
                          </span>
                        ) : (
                          <span className="text-2xs text-zinc-400 italic">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="space-y-3 sm:hidden">
              {records.map((r) => (
                <div
                  key={r.sessionId}
                  className="rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {r.sessionTitle}
                      </h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {r.trackName ? `${r.trackName} Track` : "Shared Cohort"}
                      </p>
                    </div>

                    {r.status === "PRESENT" ? (
                      <Badge variant="success">Present</Badge>
                    ) : r.status === "LATE" ? (
                      <Badge variant="warning">Late</Badge>
                    ) : r.status === "ABSENT" ? (
                      <Badge variant="danger">Absent</Badge>
                    ) : (
                      <Badge variant="neutral">Upcoming</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-100 pt-2 text-[11px] text-zinc-500 dark:border-zinc-900 dark:text-zinc-400">
                    <span>{dateFormatter.format(r.startsAt)}</span>
                    <span>
                      {r.method === "CHECK_IN"
                        ? "Self Check-in"
                        : r.method === "MANUAL"
                        ? "Instructor Marked"
                        : "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
