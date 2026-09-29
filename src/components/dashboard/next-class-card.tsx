import React from "react";
import { ClassSession } from "@/types";

interface NextClassCardProps {
  session: ClassSession;
}

export function NextClassCard({ session }: NextClassCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#262626] bg-[#171717] p-6 text-white shadow-2xs sm:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          {/* Header pill & status */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-[#34A853]/15 px-2.5 py-0.5 text-[11px] font-medium text-[#34A853] border border-[#34A853]/30">
              <span className="h-1.5 w-1.5 rounded-full bg-[#34A853] animate-pulse" />
              Next Live Class
            </span>

            <span className="rounded-full bg-[#262626] px-2.5 py-0.5 text-[11px] font-medium text-zinc-300 border border-[#333333]">
              {session.track}
            </span>

            {session.type && (
              <span className="rounded-full bg-[#262626] px-2.5 py-0.5 text-[11px] font-medium text-zinc-400 border border-[#333333]">
                {session.type}
              </span>
            )}
          </div>

          {/* Title */}
          <div>
            <h3 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              {session.title}
            </h3>
          </div>

          {/* Metadata: Date, Time & Instructor */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-zinc-400">
            {/* Date and Time */}
            <div className="flex items-center gap-1.5">
              <svg
                className="h-4 w-4 text-zinc-500"
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
            {session.instructor?.name && (
              <div className="flex items-center gap-1.5">
                <svg
                  className="h-4 w-4 text-zinc-500"
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
                  {session.instructor.name}
                  {session.instructor.role ? ` (${session.instructor.role})` : ""}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Join Class Action */}
        <div className="shrink-0 pt-2 sm:pt-0">
          {session.meetingUrl ? (
            <a
              href={session.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-6 text-xs font-semibold text-[#171717] hover:bg-[#F7F4ED] transition-colors sm:w-auto"
            >
              <svg
                className="h-4 w-4 text-[#171717]"
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
          ) : (
            <span className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#262626] px-5 text-xs font-medium text-zinc-400 sm:w-auto border border-[#333333]">
              Link Available Soon
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
