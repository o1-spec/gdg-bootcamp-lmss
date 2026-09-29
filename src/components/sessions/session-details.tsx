import React from "react";
import Link from "next/link";
import { SessionWithDetails } from "@/lib/sessions/queries";
import { DeleteSessionButton } from "./delete-session-button";

interface SessionDetailsProps {
  session: SessionWithDetails;
  basePath: string; // "/classes", "/instructor/classes", or "/admin/classes"
  canEdit?: boolean;
}

export function SessionDetails({
  session,
  basePath,
  canEdit = false,
}: SessionDetailsProps) {
  const now = new Date();
  const startsAt = new Date(session.startsAt);
  const endsAt = new Date(session.endsAt);

  const isLive = startsAt <= now && now <= endsAt;
  const isPast = endsAt < now;

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const formattedDate = dateFormatter.format(startsAt);
  const formattedStartTime = timeFormatter.format(startsAt);
  const formattedEndTime = timeFormatter.format(endsAt);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Top Navigation & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href={basePath}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#737373] hover:text-[#171717] hover:underline"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Classes
        </Link>

        {canEdit ? (
          <div className="flex items-center gap-2">
            <Link
              href={`${basePath}/${session.id}/attendance`}
              className="rounded-xl bg-[#171717] px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#262626] transition-colors"
            >
              Manage Attendance
            </Link>
            <Link
              href={`${basePath}/${session.id}/edit`}
              className="rounded-xl border border-[#E7E3DA] bg-white px-3.5 py-2 text-xs font-semibold text-[#171717] shadow-2xs hover:bg-[#F7F4ED] transition-colors"
            >
              Edit Session
            </Link>
            <DeleteSessionButton
              sessionId={session.id}
              sessionTitle={session.title}
            />
          </div>
        ) : (
          !isPast && (
            <Link
              href={`/classes/${session.id}/check-in`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#34A853] px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#2D8E47] transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              <span>Check In Now</span>
            </Link>
          )
        )}
      </div>

      {/* Main Content Card */}
      <div className="rounded-2xl border border-[#E7E3DA] bg-white p-6 shadow-2xs sm:p-8 space-y-6">
        {/* Header badges and title */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#34A853]/15 px-2.5 py-0.5 text-xs font-semibold text-[#34A853] border border-[#34A853]/30">
                <span className="h-1.5 w-1.5 rounded-full bg-[#34A853] animate-pulse" />
                Live Now
              </span>
            ) : isPast ? (
              <span className="rounded-full bg-[#F7F4ED] px-2.5 py-0.5 text-xs font-medium text-[#737373] border border-[#E7E3DA]">
                Completed
              </span>
            ) : (
              <span className="rounded-full bg-[#4285F4]/10 px-2.5 py-0.5 text-xs font-medium text-[#4285F4] border border-[#4285F4]/25">
                Upcoming
              </span>
            )}

            {session.track ? (
              <span className="rounded-full bg-[#F7F4ED] px-2.5 py-0.5 text-xs font-medium text-[#737373] border border-[#E7E3DA]">
                {session.track.name} Track
              </span>
            ) : (
              <span className="rounded-full bg-[#FBBC04]/15 px-2.5 py-0.5 text-xs font-medium text-[#996500] border border-[#FBBC04]/30">
                Shared (All Cohort)
              </span>
            )}

            <span className="text-xs text-[#E7E3DA]">•</span>
            <span className="text-xs text-[#737373]">{session.cohort.name}</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#171717] sm:text-3xl">
            {session.title}
          </h1>

          {session.description && (
            <p className="text-sm leading-relaxed text-[#737373]">
              {session.description}
            </p>
          )}
        </div>

        {/* Schedule & Info Grid */}
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-[#E7E3DA] bg-[#F7F4ED] p-4 sm:grid-cols-2">
          {/* Time & Date */}
          <div className="space-y-1">
            <span className="text-xs font-medium text-[#737373]">Date & Schedule</span>
            <p className="text-sm font-semibold text-[#171717]">
              {formattedDate}
            </p>
            <p className="text-xs text-[#737373]">
              {formattedStartTime} – {formattedEndTime} (Local Time)
            </p>
          </div>

          {/* Instructor / Host */}
          <div className="space-y-1">
            <span className="text-xs font-medium text-[#737373]">Instructor / Host</span>
            <p className="text-sm font-semibold text-[#171717]">
              {session.createdBy.name}
            </p>
            <p className="text-xs text-[#737373]">
              {session.createdBy.email}
            </p>
          </div>
        </div>

        {/* Meeting & Recording Links */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Live Meeting Link Box */}
          <div className="rounded-xl border border-[#E7E3DA] p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#171717]">
                Live Class Meeting
              </span>
              <span className="text-2xs text-[#737373]">Google Meet / Zoom</span>
            </div>

            {session.meetingUrl ? (
              <div className="pt-2">
                <a
                  href={session.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#171717] px-5 text-xs font-semibold text-white shadow-2xs hover:bg-[#262626] transition-colors w-full sm:w-auto"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                  <span>Launch Meeting</span>
                </a>
                <p className="mt-2 text-2xs truncate text-[#737373]">
                  {session.meetingUrl}
                </p>
              </div>
            ) : (
              <p className="pt-2 text-xs text-[#737373] italic">
                Meeting link has not been provided yet.
              </p>
            )}
          </div>

          {/* Recording Link Box */}
          <div className="rounded-xl border border-[#E7E3DA] p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#171717]">
                Session Recording
              </span>
              <span className="text-2xs text-[#737373]">Video Replay</span>
            </div>

            {session.recordingUrl ? (
              <div className="pt-2">
                <a
                  href={session.recordingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#E7E3DA] bg-white px-5 text-xs font-semibold text-[#171717] shadow-2xs hover:bg-[#F7F4ED] transition-colors w-full sm:w-auto"
                >
                  <svg className="h-4 w-4 text-[#737373]" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                  <span>Watch Recording</span>
                </a>
                <p className="mt-2 text-2xs truncate text-[#737373]">
                  {session.recordingUrl}
                </p>
              </div>
            ) : (
              <p className="pt-2 text-xs text-[#737373] italic">
                {isPast
                  ? "Recording not available yet. The instructor will upload it soon."
                  : "Recording will be uploaded here after the live session finishes."}
              </p>
            )}
          </div>
        </div>

        {/* Agenda / Preparation Notes */}
        {session.notes && (
          <div className="space-y-2 border-t border-[#E7E3DA] pt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#737373]">
              Class Notes & Resources
            </h3>
            <div className="rounded-xl border border-[#E7E3DA] bg-[#F7F4ED] p-4 text-xs leading-relaxed text-[#171717] whitespace-pre-wrap">
              {session.notes}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
