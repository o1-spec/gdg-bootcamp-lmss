import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { requireInstructor } from "@/lib/auth/session";
import { getInstructorSessions } from "@/lib/sessions/queries";
import { SessionCard } from "@/components/sessions/session-card";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

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
  const user = await requireInstructor();

  const { upcoming, past, assignedTracks } = await getInstructorSessions(
    user.id,
    trackFilter
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Classes"
          description="Schedule live classes, manage meeting links, and upload post-session recordings"
        />

        <Link
          href="/instructor/classes/new"
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#171717] px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-black"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Schedule Class</span>
        </Link>
      </div>

      {/* Empty State: No assigned tracks */}
      {assignedTracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E7E3DA] bg-white p-12 text-center">
          <div className="rounded-xl bg-[#FBBC04]/15 p-3 text-[#171717]">
            <svg className="h-6 w-6 text-[#FBBC04]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h3 className="mt-3 text-sm font-semibold text-[#171717]">
            No Tracks Assigned
          </h3>
          <p className="mt-1 max-w-sm text-xs text-[#737373]">
            You are not currently assigned to instruct any tracks. Contact an administrator to receive track assignments.
          </p>
        </div>
      ) : (
        <>
          {/* Track Filter if multiple assigned tracks */}
          {assignedTracks.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 border-b border-[#E7E3DA] pb-4">
              <span className="text-xs font-medium text-[#737373] mr-1">
                Filter by Track:
              </span>
              <Link
                href="/instructor/classes"
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                  !trackFilter || trackFilter === "all"
                    ? "bg-[#171717] text-white"
                    : "border border-[#E7E3DA] bg-white text-[#171717] hover:bg-[#F7F4ED]"
                }`}
              >
                All Assigned Tracks
              </Link>
              {assignedTracks.map((t) => (
                <Link
                  key={t.id}
                  href={`/instructor/classes?track=${t.id}`}
                  className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                    trackFilter === t.id
                      ? "bg-[#171717] text-white"
                      : "border border-[#E7E3DA] bg-white text-[#171717] hover:bg-[#F7F4ED]"
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
              <h2 className="text-sm font-semibold text-[#171717]">
                Upcoming & Live Sessions
              </h2>
              <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-[#F7F4ED] text-[#737373] border border-[#E7E3DA]">
                {upcoming.length} {upcoming.length === 1 ? "session" : "sessions"}
              </span>
            </div>

            {upcoming.length > 0 ? (
              <ScrollReveal mode="stagger" innerClassName="grid grid-cols-1 gap-4">
                {upcoming.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    basePath="/instructor/classes"
                  />
                ))}
              </ScrollReveal>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E7E3DA] bg-white p-8 text-center">
                <p className="text-xs text-[#737373]">
                  No upcoming classes scheduled. Click &ldquo;Schedule Class&rdquo; above to create a new session.
                </p>
              </div>
            )}
          </section>

          {/* Past Sessions Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#171717]">
                Past Sessions & Recordings
              </h2>
              <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-[#F7F4ED] text-[#737373] border border-[#E7E3DA]">
                {past.length} completed
              </span>
            </div>

            {past.length > 0 ? (
              <ScrollReveal mode="stagger" innerClassName="grid grid-cols-1 gap-4">
                {past.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    basePath="/instructor/classes"
                  />
                ))}
              </ScrollReveal>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E7E3DA] bg-white p-8 text-center">
                <p className="text-xs text-[#737373]">
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
