import React from "react";
import Link from "next/link";
import { Assignment } from "@/types";

interface RecentAssignmentsProps {
  assignments: Assignment[];
}

export function RecentAssignments({ assignments }: RecentAssignmentsProps) {
  const renderStatus = (assignment: Assignment) => {
    switch (assignment.status) {
      case "graded":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#34A853]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#34A853] border border-[#34A853]/25">
            <span className="h-1.5 w-1.5 rounded-full bg-[#34A853]" />
            Graded {assignment.score !== undefined ? `• ${assignment.score}/${assignment.maxScore}` : ""}
          </span>
        );
      case "submitted":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#4285F4]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#4285F4] border border-[#4285F4]/25">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4285F4]" />
            Submitted
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FBBC04]/15 px-2.5 py-0.5 text-[11px] font-medium text-[#996500] border border-[#FBBC04]/30">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FBBC04]" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F7F4ED] px-2.5 py-0.5 text-[11px] font-medium text-[#737373] border border-[#E7E3DA]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#737373]" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-[#E7E3DA] bg-white p-6 shadow-2xs">
      <div className="flex items-center justify-between pb-4 border-b border-[#E7E3DA]">
        <div>
          <h3 className="text-base font-bold tracking-tight text-[#171717]">
            Recent Assignments
          </h3>
          <p className="mt-0.5 text-xs text-[#737373]">
            Track submissions, reviews, and deadlines
          </p>
        </div>
        <Link
          href="/assignments"
          className="text-xs font-semibold text-[#171717] hover:underline"
        >
          View all
        </Link>
      </div>

      {assignments.length === 0 ? (
        <p className="py-6 text-center text-xs text-[#737373]">
          No assignments assigned yet.
        </p>
      ) : (
        <div className="divide-y divide-[#E7E3DA]">
          {assignments.slice(0, 5).map((assignment) => (
            <div
              key={assignment.id}
              className="flex flex-col gap-2.5 py-4 first:pt-4 last:pb-1 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1.5 min-w-0">
                <Link
                  href={`/assignments/${assignment.id}`}
                  className="text-xs sm:text-sm font-semibold text-[#171717] hover:underline truncate block"
                >
                  {assignment.title}
                </Link>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#737373]">
                  <span>Track: {assignment.track}</span>
                  <span className="text-[#E7E3DA]" aria-hidden="true">•</span>
                  <span>Due {assignment.dueDate}</span>
                </div>
              </div>

              <div className="shrink-0 self-start sm:self-center">
                {renderStatus(assignment)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
