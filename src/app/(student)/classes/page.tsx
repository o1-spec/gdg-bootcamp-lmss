import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { requireStudent } from "@/lib/auth/session";
import { getStudentSessions } from "@/lib/sessions/queries";
import { SessionCard } from "@/components/sessions/session-card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Live Classes | Bootcamp LMS",
  description: "Join live class sessions and access past recordings",
};

export default async function StudentClassesPage() {
  const user = await requireStudent();
  const { upcoming, past, activeTrackName } = await getStudentSessions(user.id);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Live Classes & Workshops"
          description="Join interactive live sessions, review agendas, and watch past recordings"
        />

        {activeTrackName && (
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Enrolled Track:</span>
            <Badge variant="neutral">{activeTrackName}</Badge>
          </div>
        )}
      </div>

      {/* Upcoming Classes Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Upcoming Classes
          </h2>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {upcoming.length} {upcoming.length === 1 ? "session" : "sessions"} scheduled
          </span>
        </div>

        {upcoming.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {upcoming.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                basePath="/classes"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-10 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
            <div className="rounded-full bg-zinc-100 p-3 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v7.5" />
              </svg>
            </div>
            <h3 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              No upcoming classes scheduled
            </h3>
            <p className="mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400">
              Your instructor has not scheduled any new classes for your track yet. Check back soon or review past recordings below.
            </p>
          </div>
        )}
      </section>

      {/* Past Classes & Recordings Section */}
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
                basePath="/classes"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-10 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
            <div className="rounded-full bg-zinc-100 p-3 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </div>
            <h3 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              No past recordings yet
            </h3>
            <p className="mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400">
              Recorded sessions will be archived here once classes are completed.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
