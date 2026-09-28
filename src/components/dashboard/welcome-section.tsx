import React from "react";
import { StudentProfile } from "@/types";

interface WelcomeSectionProps {
  student: StudentProfile;
}

export function WelcomeSection({ student }: WelcomeSectionProps) {
  const progressPercent = Math.round(
    (student.currentWeek / student.totalWeeks) * 100
  );

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
          Welcome back, {student.name.split(" ")[0]}
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
          {student.track} • {student.cohort}
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="text-right">
          <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            Cohort Progress
          </p>
          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            Week {student.currentWeek} of {student.totalWeeks} ({progressPercent}%)
          </p>
        </div>
        <div className="h-7 w-7 rounded-full bg-zinc-100 p-1 dark:bg-zinc-900">
          <svg
            className="h-full w-full -rotate-90 text-zinc-900 dark:text-zinc-100"
            viewBox="0 0 36 36"
          >
            <circle
              className="text-zinc-200 dark:text-zinc-800"
              strokeWidth="4"
              stroke="currentColor"
              fill="none"
              r="14"
              cx="18"
              cy="18"
            />
            <circle
              className="text-zinc-900 dark:text-zinc-100"
              strokeWidth="4"
              strokeDasharray={88}
              strokeDashoffset={88 - (88 * progressPercent) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              r="14"
              cx="18"
              cy="18"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
