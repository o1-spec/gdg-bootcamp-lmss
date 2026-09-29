import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminAttendanceSessions } from "@/lib/attendance/queries";

export const metadata = {
  title: "Platform Attendance | Admin Console",
  description: "Global attendance oversight and compliance across all cohorts, tracks, and sessions",
};

interface AdminAttendancePageProps {
  searchParams: Promise<{ track?: string; cohort?: string }>;
}

export default async function AdminAttendancePage({
  searchParams,
}: AdminAttendancePageProps) {
  await requireAdmin();
  const { track: trackFilter, cohort: cohortFilter } = await searchParams;

  const { sessions, tracks, cohorts } = await getAdminAttendanceSessions(
    trackFilter,
    cohortFilter
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

  const liveSessions = sessions.filter((s) => s.isLive);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Attendance Oversight"
        description="Global platform attendance rates, session check-in codes, and administrator override controls"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Bootcamp-Wide Attendance"
          value={`${avgAttendance}%`}
          subtitle="Across all active tracks"
          badge={{
            text: avgAttendance >= 85 ? "Optimal" : "Attention Needed",
            variant: avgAttendance >= 85 ? "success" : "warning",
          }}
        />
        <StatCard
          title="Active Live Sessions"
          value={liveSessions.length > 0 ? `${liveSessions.length} Live` : "0 Live"}
          subtitle="Currently inside check-in window"
          badge={{
            text: liveSessions.length > 0 ? "Active Now" : "Idle",
            variant: liveSessions.length > 0 ? "success" : "neutral",
          }}
        />
        <StatCard
          title="Total Sessions"
          value={`${sessions.length} sessions`}
          subtitle={`${cohorts.length} active cohort${cohorts.length === 1 ? "" : "s"}`}
          badge={{ text: "All Tracks", variant: "info" }}
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#E7E3DA] bg-white p-4">
        <span className="text-xs font-medium text-[#737373]">
          Filter:
        </span>

        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            href="/admin/attendance"
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
              !trackFilter || trackFilter === "all"
                ? "bg-[#171717] text-white"
                : "border border-[#E7E3DA] bg-white text-[#737373] hover:bg-[#F7F4ED] hover:text-[#171717]"
            }`}
          >
            All Tracks
          </Link>
          <Link
            href="/admin/attendance?track=shared"
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
              trackFilter === "shared"
                ? "bg-[#171717] text-white"
                : "border border-[#E7E3DA] bg-white text-[#737373] hover:bg-[#F7F4ED] hover:text-[#171717]"
            }`}
          >
            Cohort Shared
          </Link>
          {tracks.map((t) => (
            <Link
              key={t.id}
              href={`/admin/attendance?track=${t.id}`}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                trackFilter === t.id
                  ? "bg-[#171717] text-white"
                  : "border border-[#E7E3DA] bg-white text-[#737373] hover:bg-[#F7F4ED] hover:text-[#171717]"
              }`}
            >
              {t.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Session Roster List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#171717]">
            Sessions & Attendance Records
          </h2>
          <span className="text-xs text-[#737373]">
            {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
          </span>
        </div>

        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E7E3DA] bg-white p-10 text-center">
            <p className="text-xs text-[#737373]">
              No sessions found matching this filter criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#E7E3DA] bg-white p-5 hover:border-[#171717]/30 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {session.isLive ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#34A853]/20 bg-[#34A853]/10 px-2.5 py-0.5 text-xs font-medium text-[#34A853]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#34A853] animate-pulse" />
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

                    <span className="text-xs text-[#737373]">•</span>
                    <span className="text-xs text-[#737373]">{session.cohortName}</span>

                    {session.checkinCode && (
                      <span className="font-mono text-xs font-semibold text-[#171717] bg-[#F7F4ED] px-2 py-0.5 rounded border border-[#E7E3DA]">
                        Code: {session.checkinCode}
                      </span>
                    )}
                  </div>

                  <div>
                    <Link
                      href={`/admin/classes/${session.id}/attendance`}
                      className="text-base font-semibold text-[#171717] hover:underline"
                    >
                      {session.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-[#737373]">
                      {dateFormatter.format(session.startsAt)} • {timeFormatter.format(session.startsAt)} – {timeFormatter.format(session.endsAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    <span className="text-[#34A853] font-medium">
                      {session.presentCount} Present
                    </span>
                    <span className="text-[#E7E3DA]">•</span>
                    <span className="text-[#FBBC04] font-medium">
                      {session.lateCount} Late
                    </span>
                    <span className="text-[#E7E3DA]">•</span>
                    <span className="text-[#EA4335] font-medium">
                      {session.absentCount} Absent
                    </span>
                    <span className="text-[#E7E3DA]">•</span>
                    <span className="text-[#737373]">
                      {session.unmarkedCount} Unmarked
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#E7E3DA]">
                  <div className="text-left sm:text-right">
                    <span className="text-sm font-bold text-[#171717]">
                      {session.attendanceRate}%
                    </span>
                    <p className="text-[11px] text-[#737373]">Attendance Rate</p>
                  </div>

                  <Link
                    href={`/admin/classes/${session.id}/attendance`}
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-[#171717] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#171717]/90"
                  >
                    Manage Roster →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
