import React from "react";
import { ClassSession } from "@/types";
import { Badge } from "@/components/ui/badge";

interface NextClassCardProps {
  session: ClassSession;
}

export function NextClassCard({ session }: NextClassCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Next Live Class
            </span>
            <Badge variant="neutral">{session.type}</Badge>
          </div>

          <div>
            <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-lg">
              {session.title}
            </h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Track: {session.track}
            </p>
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
                {session.date} • {session.time}
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
              <span>
                {session.instructor.name} ({session.instructor.role})
              </span>
            </div>
          </div>
        </div>

        {/* Join button */}
        <div className="shrink-0 pt-2 sm:pt-0">
          <a
            href={session.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 text-xs font-semibold text-white transition-all hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 sm:w-auto"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
            <span>Join Class</span>
          </a>
        </div>
      </div>
    </div>
  );
}
