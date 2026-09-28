import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { getAdminSessions } from "@/lib/sessions/queries";
import { SessionCard } from "@/components/sessions/session-card";

export const metadata = {
  title: "All Classes & Sessions | Admin Console",
  description: "Global schedule oversight across all tracks, cohorts, and instructors",
};

interface AdminClassesPageProps {
  searchParams: Promise<{ track?: string; cohort?: string }>;
}

export default async function AdminClassesPage({
  searchParams,
}: AdminClassesPageProps) {
  const { track: trackFilter, cohort: cohortFilter } = await searchParams;

  const { upcoming, past, tracks, cohorts } = await getAdminSessions(
    trackFilter,
    cohortFilter
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="All Classes & Workshops"
          description="Manage live schedules, Zoom/Meet links, and published recordings across all tracks and cohorts"
        />

        <Link
          href="/admin/classes/new"
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Schedule New Session</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Filters:
        </span>

        {/* Track Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            href="/admin/classes"
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              !trackFilter || trackFilter === "all"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            All Tracks
          </Link>
          <Link
            href="/admin/classes?track=shared"
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              trackFilter === "shared"
                ? "bg-amber-600 text-white dark:bg-amber-500 dark:text-zinc-950 font-semibold"
                : "border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            Cohort Shared
          </Link>
          {tracks.map((t) => (
            <Link
              key={t.id}
              href={`/admin/classes?track=${t.id}`}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                trackFilter === t.id
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              {t.name}
            </Link>
          ))}
        </div>

        {cohorts.length > 1 && (
          <div className="ml-auto text-xs text-zinc-400">
            {cohorts.map((c) => c.name).join(", ")}
          </div>
        )}
      </div>

      {/* Upcoming Classes Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Upcoming & Live Sessions
          </h2>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {upcoming.length} {upcoming.length === 1 ? "session" : "sessions"}
          </span>
        </div>

        {upcoming.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {upcoming.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                basePath="/admin/classes"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              No upcoming classes scheduled. Click &ldquo;Schedule New Session&rdquo; above to create one.
            </p>
          </div>
        )}
      </section>

      {/* Past Classes Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Past Classes & Recordings
          </h2>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {past.length} completed
          </span>
        </div>

        {past.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {past.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                basePath="/admin/classes"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              No past sessions recorded yet.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
