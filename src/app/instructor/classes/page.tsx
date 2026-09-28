import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/session";
import { getInstructorSessions } from "@/lib/sessions/queries";
import { SessionCard } from "@/components/sessions/session-card";

export const metadata = {
  title: "Class Sessions | Instructor Portal",
  description: "Schedule live classes, manage meeting links, and upload recordings",
};

interface InstructorClassesPageProps {
  searchParams: Promise<{ track?: string }>;
}

export default async function InstructorClassesPage({
  searchParams,
}: InstructorClassesPageProps) {
  const { track: trackFilter } = await searchParams;
  const user = await requireUser();

  const { upcoming, past, assignedTracks } = await getInstructorSessions(
    user.id,
    trackFilter
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Class Sessions & Meeting Links"
          description="Schedule live classes, manage Zoom/Google Meet links, and upload post-session recordings"
        />

        <Link
          href="/instructor/classes/new"
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Schedule Session</span>
        </Link>
      </div>

      {/* Empty State: No assigned tracks */}
      {assignedTracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-12 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
          <div className="rounded-full bg-amber-50 p-3 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h3 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            No Tracks Assigned
          </h3>
          <p className="mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400">
            You are not currently assigned to instruct any tracks. Contact an administrator to receive track assignments.
          </p>
        </div>
      ) : (
        <>
          {/* Track Filter if multiple assigned tracks */}
          {assignedTracks.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 pb-4 dark:border-zinc-800/80">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mr-1">
                Filter by Track:
              </span>
              <Link
                href="/instructor/classes"
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
                  href={`/instructor/classes?track=${t.id}`}
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

          {/* Upcoming Sessions Section */}
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
                    basePath="/instructor/classes"
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  No upcoming classes scheduled. Click &ldquo;Schedule Session&rdquo; above to create a new session.
                </p>
              </div>
            )}
          </section>

          {/* Past Sessions Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Past Sessions & Recordings
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
                    basePath="/instructor/classes"
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
        </>
      )}
    </div>
  );
}
