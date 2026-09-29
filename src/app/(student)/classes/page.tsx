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
          title="Classes & Workshops"
          description="Join interactive live sessions, review agendas, and watch past recordings"
        />

        {activeTrackName && (
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs text-[#737373]">Enrolled Track:</span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#171717] border border-[#E7E3DA] shadow-2xs">
              {activeTrackName}
            </span>
          </div>
        )}
      </div>

      {/* Upcoming Classes Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-[#E7E3DA]">
          <h3 className="text-base font-bold tracking-tight text-[#171717]">
            Upcoming Classes
          </h3>
          <span className="text-xs text-[#737373]">
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
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E7E3DA] bg-white p-10 text-center shadow-2xs">
            <div className="rounded-xl bg-[#F7F4ED] p-3 text-[#737373] border border-[#E7E3DA]">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v7.5" />
              </svg>
            </div>
            <h4 className="mt-3 text-sm font-semibold text-[#171717]">
              No upcoming classes scheduled
            </h4>
            <p className="mt-1 max-w-sm text-xs text-[#737373] leading-relaxed">
              Your instructor has not scheduled any new classes for your track yet. Check back soon or review past recordings below.
            </p>
          </div>
        )}
      </section>

      {/* Past Classes & Recordings Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-[#E7E3DA]">
          <h3 className="text-base font-bold tracking-tight text-[#171717]">
            Past Classes & Recordings
          </h3>
          <span className="text-xs text-[#737373]">
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
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E7E3DA] bg-white p-10 text-center shadow-2xs">
            <div className="rounded-xl bg-[#F7F4ED] p-3 text-[#737373] border border-[#E7E3DA]">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </div>
            <h4 className="mt-3 text-sm font-semibold text-[#171717]">
              No past recordings yet
            </h4>
            <p className="mt-1 max-w-sm text-xs text-[#737373] leading-relaxed">
              Recorded sessions will be archived here once classes are completed.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
