import React from "react";
import Link from "next/link";
import { ClassSession } from "@/types";
import { Badge } from "@/components/ui/badge";

interface UpcomingClassesProps {
  classes: ClassSession[];
}

export function UpcomingClasses({ classes }: UpcomingClassesProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
      <div className="flex items-center justify-between pb-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Upcoming Classes
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Sessions scheduled for this week
          </p>
        </div>
        <Link
          href="/classes"
          className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          View all
        </Link>
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
        {classes.map((cls) => (
          <div
            key={cls.id}
            className="flex flex-col gap-2 py-3.5 first:pt-2 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                  {cls.title}
                </span>
                <Badge variant="neutral">{cls.type}</Badge>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                <span>
                  {cls.date} • {cls.time}
                </span>
                <span>•</span>
                <span>Instructor: {cls.instructor.name}</span>
              </div>
            </div>

            <a
              href={cls.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-7 items-center justify-center rounded-md border border-zinc-200 px-3 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-100 sm:self-center"
            >
              Meeting Link
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
