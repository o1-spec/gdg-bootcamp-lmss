import React from "react";
import { DashboardSummary } from "@/types";

interface SummaryCardsProps {
  summary: DashboardSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      title: "Attendance",
      value: `${summary.attendancePercentage}%`,
      subtitle: `${summary.attendedSessions} of ${summary.totalSessions} sessions attended`,
      icon: (
        <svg
          className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.75}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      ),
      badgeText: "In good standing",
      badgeColor: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300",
    },
    {
      title: "Assignments",
      value: `${summary.completedAssignments} / ${summary.totalAssignments}`,
      subtitle: `${summary.pendingReviewAssignments} currently pending review`,
      icon: (
        <svg
          className="h-4 w-4 text-sky-600 dark:text-sky-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.75}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
          />
        </svg>
      ),
      badgeText: "80% completed",
      badgeColor: "text-sky-700 bg-sky-50 dark:bg-sky-950/60 dark:text-sky-300",
    },
    {
      title: "Average Score",
      value: `${summary.averageScore}%`,
      subtitle: "Across all graded submissions",
      icon: (
        <svg
          className="h-4 w-4 text-amber-600 dark:text-amber-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.75}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
          />
        </svg>
      ),
      badgeText: "Grade A",
      badgeColor: "text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {card.title}
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
              {card.icon}
            </div>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {card.value}
            </span>
            <span
              className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${card.badgeColor}`}
            >
              {card.badgeText}
            </span>
          </div>

          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            {card.subtitle}
          </p>
        </div>
      ))}
    </div>
  );
}
