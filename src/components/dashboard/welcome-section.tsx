"use client";

import React from "react";
import { StudentProfile } from "@/types";

interface WelcomeSectionProps {
  student: StudentProfile;
}

export function WelcomeSection({ student }: WelcomeSectionProps) {
  const firstName = student.name.split(" ")[0];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const progressPercent =
    student.totalWeeks > 0
      ? Math.round((student.currentWeek / student.totalWeeks) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#171717] sm:text-3xl">
          {getGreeting()}, {firstName}
        </h2>
        <p className="mt-1 text-sm text-[#737373]">
          Here’s what’s happening in your bootcamp today.
        </p>
      </div>

      <div className="inline-flex items-center gap-3 rounded-2xl border border-[#E7E3DA] bg-white px-4 py-2.5 shadow-2xs self-start sm:self-auto">
        <div className="space-y-0.5 text-left sm:text-right">
          <p className="text-[11px] font-medium text-[#737373]">
            {student.track} • {student.cohort}
          </p>
          <p className="text-xs font-semibold text-[#171717]">
            Week {student.currentWeek} of {student.totalWeeks} ({progressPercent}%)
          </p>
        </div>

        {/* Minimal Progress Ring */}
        <div className="h-7 w-7 shrink-0 rounded-full bg-[#F7F4ED] p-1 border border-[#E7E3DA]">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
            <circle
              className="text-[#E7E3DA]"
              strokeWidth="4"
              stroke="currentColor"
              fill="none"
              r="14"
              cx="18"
              cy="18"
            />
            <circle
              className="text-[#171717]"
              strokeWidth="4"
              strokeDasharray={88}
              strokeDashoffset={88 - (88 * Math.min(100, Math.max(0, progressPercent))) / 100}
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
