import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { requireInstructor } from "@/lib/auth/session";
import { getInstructorAttendanceSessions } from "@/lib/attendance/queries";

export const metadata = {
  title: "Track Attendance | Instructor Portal",
  description: "Monitor class attendance rates, manage live check-in codes, and override student records",
};

interface InstructorAttendancePageProps {
  searchParams: Promise<{ track?: string }>;
}

export default async function InstructorAttendancePage({
  searchParams,
}: InstructorAttendancePageProps) {
  const { track: trackFilter } = await searchParams;
  const user = await requireInstructor();

  const { sessions, assignedTracks } = await getInstructorAttendanceSessions(
    user.id,
    trackFilter
  );

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

  // Calculate high-level summary KPIs across sessions
  const pastSessions = sessions.filter((s) => s.isPast);
  const avgAttendance =
    pastSessions.length > 0
      ? Math.round(
          pastSessions.reduce((acc, s) => acc + s.attendanceRate, 0) /
            pastSessions.length
        )
      : sessions.length > 0
      ? Math.round(
          sessions.reduce((acc, s) => acc + s.attendanceRate, 0) / sessions.length
        )
      : 0;

  const liveCount = sessions.filter((s) => s.isLive).length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Attendance Management"
        description="Monitor class attendance compliance, review live check-in codes, and manage rosters"
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Track Average Attendance"
          value={`${avgAttendance}%`}
          subtitle={assignedTracks.map((t) => t.name).join(", ") || "Assigned tracks"}
          badge={{
            text: avgAttendance >= 85 ? "Exceeding Target" : "Under Target (<85%)",
            variant: avgAttendance >= 85 ? "success" : "warning",
          }}
        />
        <StatCard
          title="Live Sessions Today"
          value={liveCount > 0 ? `${liveCount} Live Now` : "None Active"}
          subtitle="Real-time check-in window"
          badge={{
            text: liveCount > 0 ? "Active" : "Idle",
            variant: liveCount > 0 ? "success" : "neutral",
          }}
        />
        <StatCard
          title="Total Sessions Tracked"
          value={`${sessions.length} sessions`}
          subtitle={`${pastSessions.length} completed`}
          badge={{ text: "Active Roster", variant: "info" }}
        />
      </div>

      {assignedTracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-12 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            You do not currently have any assigned tracks. Contact an administrator to receive track assignments.
          </p>
        </div>
      ) : (
        <>
          {/* Track Filter if multiple assigned tracks */}
          {assignedTracks.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 pb-4 dark:border-zinc-800/80">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mr-1">
                Filter:
              </span>
              <Link
                href="/instructor/attendance"
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  !trackFilter || trackFilter === "all"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                All Assigned Tracks
              </Link>
              {assignedTracks.map((t) => (
                <Link
                  key={t.id}
                  href={`/instructor/attendance?track=${t.id}`}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    trackFilter === t.id
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  {t.name} Track
                </Link>
              ))}
            </div>
          )}

          {/* Session Attendance List */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Sessions & Rosters
              </h2>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
              </span>
            </div>

            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-10 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  No sessions found for this track. Schedule a class to start tracking attendance.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {session.isLive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live Now
                          </span>
                        ) : session.isPast ? (
                          <Badge variant="neutral">Completed</Badge>
                        ) : (
                          <Badge variant="info">Upcoming</Badge>
                        )}

                        {session.trackName ? (
                          <Badge variant="neutral">{session.trackName} Track</Badge>
                        ) : (
                          <Badge variant="warning">Shared Cohort</Badge>
                        )}

                        {session.checkinCode && (
                          <span className="font-mono text-xs font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                            Code: {session.checkinCode}
                          </span>
                        )}
                      </div>

                      <div>
                        <Link
                          href={`/instructor/classes/${session.id}/attendance`}
                          className="text-base font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
                        >
                          {session.title}
                        </Link>
                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                          {dateFormatter.format(session.startsAt)} • {timeFormatter.format(session.startsAt)} – {timeFormatter.format(session.endsAt)}
                        </p>
                      </div>

                      {/* Attendance Breakdown Pills */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                          {session.presentCount} Present
                        </span>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <span className="text-amber-700 dark:text-amber-300 font-medium">
                          {session.lateCount} Late
                        </span>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <span className="text-rose-700 dark:text-rose-300 font-medium">
                          {session.absentCount} Absent
                        </span>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {session.unmarkedCount} Unmarked
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-100 dark:border-zinc-900">
                      <div className="text-left sm:text-right">
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {session.attendanceRate}%
                        </span>
                        <p className="text-[11px] text-zinc-400">Attendance Rate</p>
                      </div>

                      <Link
                        href={`/instructor/classes/${session.id}/attendance`}
                        className="inline-flex h-8 items-center justify-center rounded-lg bg-zinc-900 px-3.5 text-xs font-semibold text-white shadow-2xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                      >
                        Manage Roster →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
