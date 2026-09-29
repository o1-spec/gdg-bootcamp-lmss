"use client";

import React from "react";
import { DashboardSummary } from "@/types";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

interface SummaryCardsProps {
  summary: DashboardSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const gridRef = useScrollReveal<HTMLDivElement>({ threshold: 0.08 });

  const cards = [
    {
      title: "Attendance",
      value: `${summary.attendancePercentage}%`,
      subtitle: `${summary.attendedSessions} of ${summary.totalSessions} sessions attended`,
      accentDot: "bg-[#34A853]",
      statusText: summary.attendancePercentage >= 75 ? "On track" : "Attention needed",
      statusColor: summary.attendancePercentage >= 75 ? "text-[#34A853]" : "text-[#EA4335]",
      icon: (
        <svg
          className="h-4 w-4 text-[#34A853]"
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
    },
    {
      title: "Assignments",
      value: `${summary.completedAssignments} / ${summary.totalAssignments}`,
      subtitle:
        summary.pendingReviewAssignments > 0
          ? `${summary.pendingReviewAssignments} pending review`
          : "All submissions up to date",
      accentDot: "bg-[#4285F4]",
      statusText: `${Math.round(
        (summary.completedAssignments / Math.max(1, summary.totalAssignments)) * 100
      )}% done`,
      statusColor: "text-[#4285F4]",
      icon: (
        <svg
          className="h-4 w-4 text-[#4285F4]"
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
    },
    {
      title: "Average Score",
      value: summary.averageScore > 0 ? `${summary.averageScore}%` : "—",
      subtitle: "Across all graded submissions",
      accentDot: "bg-[#FBBC04]",
      statusText:
        summary.averageScore >= 80
          ? "Good performance"
          : summary.averageScore > 0
          ? "In progress"
          : "Not yet graded",
      statusColor: summary.averageScore >= 80 ? "text-[#34A853]" : "text-[#737373]",
      icon: (
        <svg
          className="h-4 w-4 text-[#FBBC04]"
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
    },
  ];

  return (
    <div
      ref={gridRef}
      className="reveal-stagger grid grid-cols-1 gap-4 sm:grid-cols-3"
    >
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-2xl border border-[#E7E3DA] bg-white p-5 shadow-2xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-[#D4D0C8] active:scale-[0.99] active:translate-y-0"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${card.accentDot}`} />
              <span className="text-xs font-medium text-[#737373]">
                {card.title}
              </span>
            </div>

            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F7F4ED] border border-[#E7E3DA] transition-transform duration-200 hover:scale-110">
              {card.icon}
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <span className="stat-value text-2xl font-bold tracking-tight text-[#171717] sm:text-3xl">
              {card.value}
            </span>
            <span className={`text-[11px] font-medium ${card.statusColor}`}>
              {card.statusText}
            </span>
          </div>

          <p className="mt-2 text-xs text-[#737373] leading-relaxed">
            {card.subtitle}
          </p>
        </div>
      ))}
    </div>
  );
}
