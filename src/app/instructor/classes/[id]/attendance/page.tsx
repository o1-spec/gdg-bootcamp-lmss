import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireInstructor } from "@/lib/auth/session";
import { getSessionAttendance } from "@/lib/attendance/queries";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { InstructorCheckinCodeManager } from "@/components/attendance/instructor-checkin-code-manager";
import { SessionRosterTable } from "@/components/attendance/session-roster-table";

import { AttendanceImportModal } from "@/components/attendance/attendance-import-modal";

interface SessionAttendancePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: SessionAttendancePageProps) {
  const { id } = await params;
  return {
    title: `Attendance Roster: ${id} | Instructor Portal`,
  };
}

export default async function InstructorSessionAttendancePage({
  params,
}: SessionAttendancePageProps) {
  const { id } = await params;
  const user = await requireInstructor();

  const attendanceData = await getSessionAttendance(id, user.id, user.role);

  if (!attendanceData) {
    notFound();
  }

  const { session, stats, roster } = attendanceData;

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
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
    <div className="space-y-6">
      {/* Top Breadcrumb & Link */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href={`/instructor/classes/${session.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#737373] hover:text-[#171717] transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Class Details
        </Link>

        <div className="flex items-center gap-2.5">
          <AttendanceImportModal
            sessionId={session.id}
            sessionTitle={session.title}
          />

          {session.isLive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#34A853]/15 px-2.5 py-0.5 text-xs font-semibold text-[#34A853] border border-[#34A853]/30">
              <span className="h-1.5 w-1.5 rounded-full bg-[#34A853] animate-pulse" />
              Live Class
            </span>
          ) : session.isPast ? (
            <Badge variant="neutral">Completed</Badge>
          ) : (
            <Badge variant="info">Upcoming</Badge>
          )}

          {session.trackName ? (
            <Badge variant="neutral">{session.trackName} Track</Badge>
          ) : (
            <Badge variant="warning">Shared (All Cohort)</Badge>
          )}
        </div>
      </div>

      {/* Page Header */}
      <PageHeader
        title={`Attendance: ${session.title}`}
        description={`${dateFormatter.format(session.startsAt)} • ${timeFormatter.format(session.startsAt)} – ${timeFormatter.format(session.endsAt)}`}
      />

      {/* Check-in Code Management Widget */}
      <InstructorCheckinCodeManager
        sessionId={session.id}
        initialCode={session.checkinCode}
        isLive={session.isLive}
        startsAt={session.startsAt}
        endsAt={session.endsAt}
      />

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          title="Present"
          value={stats.presentCount}
          subtitle="Self-checkin or marked"
          badge={{ text: "On Time", variant: "success" }}
        />
        <StatCard
          title="Late"
          value={stats.lateCount}
          subtitle="Tardy arrivals"
          badge={{ text: "Late", variant: "warning" }}
        />
        <StatCard
          title="Absent"
          value={stats.absentCount}
          subtitle="Confirmed absences"
          badge={{ text: "Missed", variant: "danger" }}
        />
        <StatCard
          title="Unmarked"
          value={stats.unmarkedCount}
          subtitle={`Out of ${stats.totalEligible} eligible`}
          badge={{ text: "Pending", variant: "neutral" }}
        />
      </div>

      {/* Student Roster & Manual Overrides Table */}
      <SessionRosterTable
        sessionId={session.id}
        roster={roster}
      />
    </div>
  );
}
