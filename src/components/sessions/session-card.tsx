import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SessionWithDetails } from "@/lib/sessions/queries";

interface SessionCardProps {
  session: SessionWithDetails;
  basePath?: string; // "/classes", "/instructor/classes", or "/admin/classes"
}

export function SessionCard({ session, basePath = "/classes" }: SessionCardProps) {
  const now = new Date();
  const startsAt = new Date(session.startsAt);
  const endsAt = new Date(session.endsAt);

  const isLive = startsAt <= now && now <= endsAt;
  const isPast = endsAt < now;

  // Formatting date and time with native Intl APIs
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

  const formattedDate = dateFormatter.format(startsAt);
  const formattedStartTime = timeFormatter.format(startsAt);
  const formattedEndTime = timeFormatter.format(endsAt);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Main Details */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
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
          </div>

          <div>
            <Link
              href={`${basePath}/${session.id}`}
              className="text-base font-semibold tracking-tight text-zinc-900 hover:underline dark:text-zinc-100"
            >
              {session.title}
            </Link>
            {session.description && (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                {session.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-zinc-600 dark:text-zinc-300">
            {/* Date and Time */}
            <div className="flex items-center gap-1.5">
              <svg
                className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.75}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              <span>
                {formattedDate} • {formattedStartTime} – {formattedEndTime}
              </span>
            </div>

            {/* Instructor */}
            <div className="flex items-center gap-1.5">
              <svg
                className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.75}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
              <span>{session.createdBy.name}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex shrink-0 flex-row items-center gap-2 pt-2 sm:flex-col sm:items-end sm:pt-0">
          {/* Upcoming or Live: Join Meeting Link */}
          {!isPast && (
            session.meetingUrl ? (
              <a
                href={session.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                <span>Join Class</span>
              </a>
            ) : (
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                Meeting link pending
              </span>
            )
          )}

          {/* Past: View Recording Link */}
          {isPast && (
            session.recordingUrl ? (
              <a
                href={session.recordingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                <svg className="h-3.5 w-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                <span>View Recording</span>
              </a>
            ) : (
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                Recording not available
              </span>
            )
          )}

          {basePath === "/classes" && isLive && (
            <Link
              href={`/classes/${session.id}/check-in`}
              className="inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              <span>Check In</span>
            </Link>
          )}

          <div className="flex items-center gap-2">
            {(basePath === "/instructor/classes" || basePath === "/admin/classes") && (
              <Link
                href={`${basePath}/${session.id}/attendance`}
                className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Attendance
              </Link>
            )}

            <Link
              href={`${basePath}/${session.id}`}
              className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
