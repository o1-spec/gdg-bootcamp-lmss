import React from "react";
import Link from "next/link";
import { ClassSession } from "@/types";

interface UpcomingClassesProps {
  classes: ClassSession[];
}

export function UpcomingClasses({ classes }: UpcomingClassesProps) {
  return (
    <div className="rounded-2xl border border-[#E7E3DA] bg-white p-6 shadow-2xs">
      <div className="flex items-center justify-between pb-4 border-b border-[#E7E3DA]">
        <div>
          <h3 className="text-base font-bold tracking-tight text-[#171717]">
            Upcoming Classes
          </h3>
          <p className="mt-0.5 text-xs text-[#737373]">
            Upcoming sessions scheduled for your cohort
          </p>
        </div>
        <Link
          href="/classes"
          className="text-xs font-semibold text-[#171717] hover:underline"
        >
          View all
        </Link>
      </div>

      <div className="divide-y divide-[#E7E3DA]">
        {classes.slice(0, 4).map((cls) => (
          <div
            key={cls.id}
            className="flex flex-col gap-2.5 py-4 first:pt-4 last:pb-1 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold text-[#171717] truncate">
                  {cls.title}
                </span>
                <span className="rounded-full bg-[#F7F4ED] px-2 py-0.5 text-[10px] font-medium text-[#737373] border border-[#E7E3DA]">
                  {cls.track || cls.type}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#737373]">
                <span>
                  {cls.date} • {cls.time}
                </span>
                {cls.instructor?.name && (
                  <>
                    <span className="text-[#E7E3DA]" aria-hidden="true">•</span>
                    <span>Instructor: {cls.instructor.name}</span>
                  </>
                )}
              </div>
            </div>

            <div className="shrink-0 self-start sm:self-center">
              {cls.meetingUrl ? (
                <a
                  href={cls.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center justify-center rounded-xl border border-[#E7E3DA] bg-white px-3.5 text-xs font-medium text-[#171717] hover:bg-[#F7F4ED] transition-colors"
                >
                  Join Link
                </a>
              ) : (
                <span className="inline-flex h-8 items-center justify-center rounded-xl bg-[#F7F4ED] px-3 text-xs font-medium text-[#737373] border border-[#E7E3DA]">
                  Scheduled
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
