import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
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
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Manage Attendance
            </Link>
            <Link
              href={`${basePath}/${session.id}/edit`}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow-2xs hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700"
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
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950 sm:p-8 space-y-6">
        {/* Header badges and title */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Now
              </span>
            ) : isPast ? (
              <Badge variant="neutral">Completed</Badge>
            ) : (
              <Badge variant="info">Upcoming</Badge>
            )}

            {session.track ? (
              <Badge variant="neutral">{session.track.name} Track</Badge>
            ) : (
              <Badge variant="warning">Shared (All Cohort)</Badge>
            )}

            <span className="text-xs text-zinc-400 dark:text-zinc-500">•</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{session.cohort.name}</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            {session.title}
          </h1>

          {session.description && (
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              {session.description}
            </p>
          )}
        </div>

        {/* Schedule & Info Grid */}
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-zinc-100 bg-zinc-50/75 p-4 dark:border-zinc-800/60 dark:bg-zinc-900/40 sm:grid-cols-2">
          {/* Time & Date */}
          <div className="space-y-1">
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">Date & Schedule</span>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {formattedDate}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {formattedStartTime} – {formattedEndTime} (Local Time)
            </p>
          </div>

          {/* Instructor / Host */}
          <div className="space-y-1">
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">Instructor / Host</span>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {session.createdBy.name}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {session.createdBy.email}
            </p>
          </div>
        </div>

        {/* Meeting & Recording Links */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Live Meeting Link Box */}
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Live Class Meeting
              </span>
              <span className="text-2xs text-zinc-400">Google Meet / Zoom</span>
            </div>

            {session.meetingUrl ? (
              <div className="pt-1">
                <a
                  href={session.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-xs font-semibold text-white shadow-2xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 w-full sm:w-auto"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                  <span>Launch Meeting Link</span>
                </a>
                <p className="mt-2 text-2xs truncate text-zinc-400 dark:text-zinc-500">
                  {session.meetingUrl}
                </p>
              </div>
            ) : (
              <p className="pt-1 text-xs text-zinc-400 dark:text-zinc-500 italic">
                Meeting link has not been provided yet.
              </p>
            )}
          </div>

          {/* Recording Link Box */}
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Session Recording
              </span>
              <span className="text-2xs text-zinc-400">Video Replay</span>
            </div>

            {session.recordingUrl ? (
              <div className="pt-1">
                <a
                  href={session.recordingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-xs font-medium text-zinc-900 shadow-2xs hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 w-full sm:w-auto"
                >
                  <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                  <span>Watch Recording</span>
                </a>
                <p className="mt-2 text-2xs truncate text-zinc-400 dark:text-zinc-500">
                  {session.recordingUrl}
                </p>
              </div>
            ) : (
              <p className="pt-1 text-xs text-zinc-400 dark:text-zinc-500 italic">
                {isPast
                  ? "Recording not available yet. The instructor will upload it soon."
                  : "Recording will be uploaded here after the live session finishes."}
              </p>
            )}
          </div>
        </div>

        {/* Agenda / Preparation Notes */}
        {session.notes && (
          <div className="space-y-2 border-t border-zinc-100 pt-5 dark:border-zinc-800/80">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Class Notes & Resources
            </h3>
            <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-4 text-xs leading-relaxed text-zinc-700 whitespace-pre-wrap dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-300">
              {session.notes}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
