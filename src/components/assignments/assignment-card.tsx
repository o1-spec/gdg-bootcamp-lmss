import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { StudentAssignmentItem } from "@/lib/assignments/queries";

interface AssignmentCardProps {
  assignment: StudentAssignmentItem;
  basePath?: string;
}

export function AssignmentCard({
  assignment,
  basePath = "/assignments",
}: AssignmentCardProps) {
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

  const formattedDueDate = dateFormatter.format(assignment.dueAt);
  const formattedDueTime = timeFormatter.format(assignment.dueAt);

  return (
    <div className="rounded-2xl border border-[#E7E3DA] bg-white p-5 shadow-2xs transition-shadow hover:shadow-xs sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Main Details */}
        <div className="space-y-2.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {assignment.trackName ? (
              <span className="rounded-full bg-[#F7F4ED] px-2.5 py-0.5 text-xs font-medium text-[#737373] border border-[#E7E3DA]">
                {assignment.trackName} Track
              </span>
            ) : (
              <span className="rounded-full bg-[#FBBC04]/15 px-2.5 py-0.5 text-xs font-medium text-[#996500] border border-[#FBBC04]/30">
                Shared (All Cohort)
              </span>
            )}

            {/* Submission / Grade status badge */}
            {assignment.status === "GRADE_RELEASED" && assignment.submission?.score !== null ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#34A853]/10 px-2.5 py-0.5 text-xs font-semibold text-[#34A853] border border-[#34A853]/25">
                <span className="h-1.5 w-1.5 rounded-full bg-[#34A853]" />
                Score: {assignment.submission?.score} / {assignment.maxScore}
              </span>
            ) : assignment.status === "GRADED_PENDING_RELEASE" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#4285F4]/10 px-2.5 py-0.5 text-xs font-medium text-[#4285F4] border border-[#4285F4]/25">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4285F4]" />
                Graded (Pending Release)
              </span>
            ) : assignment.status === "SUBMITTED_LATE" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FBBC04]/15 px-2.5 py-0.5 text-xs font-medium text-[#996500] border border-[#FBBC04]/30">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FBBC04]" />
                Submitted Late
              </span>
            ) : assignment.status === "SUBMITTED" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#4285F4]/10 px-2.5 py-0.5 text-xs font-medium text-[#4285F4] border border-[#4285F4]/25">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4285F4]" />
                Submitted
              </span>
            ) : assignment.isPastDue ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EA4335]/10 px-2.5 py-0.5 text-xs font-medium text-[#EA4335] border border-[#EA4335]/25">
                <span className="h-1.5 w-1.5 rounded-full bg-[#EA4335]" />
                Past Due
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F7F4ED] px-2.5 py-0.5 text-xs font-medium text-[#737373] border border-[#E7E3DA]">
                Not Submitted
              </span>
            )}
          </div>

          <div>
            <Link
              href={`${basePath}/${assignment.id}`}
              className="text-base font-bold tracking-tight text-[#171717] hover:underline"
            >
              {assignment.title}
            </Link>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#737373]">
              {assignment.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-[#737373]">
            {/* Due date */}
            <div className="flex items-center gap-1.5">
              <svg
                className="h-3.5 w-3.5 text-[#737373]"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.75}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.253M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v7.5"
                />
              </svg>
              <span>
                Due: {formattedDueDate} at {formattedDueTime}
              </span>
            </div>

            {/* Max Score */}
            <div className="flex items-center gap-1.5">
              <svg
                className="h-3.5 w-3.5 text-[#737373]"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.75}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.004 0H9.496m5.004 0a3 3 0 0 0 3-3V6.75a3 3 0 0 0-3-3h-4.5a3 3 0 0 0-3 3v5.625a3 3 0 0 0 3 3Z"
                />
              </svg>
              <span>{assignment.maxScore} Points Max</span>
            </div>

            {assignment.allowLateSubmission && (
              <span className="text-[11px] text-[#737373] italic">
                Late submissions allowed
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex shrink-0 items-center pt-2 sm:pt-0">
          <Link
            href={`${basePath}/${assignment.id}`}
            className="inline-flex h-9 items-center justify-center rounded-xl bg-[#171717] px-4 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-[#262626]"
          >
            {assignment.status === "GRADE_RELEASED"
              ? "View Feedback →"
              : assignment.submission
              ? "View Submission →"
              : "Submit Work →"}
          </Link>
        </div>
      </div>
    </div>
  );
}
