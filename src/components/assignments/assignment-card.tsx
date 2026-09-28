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
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Main Details */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {assignment.trackName ? (
              <Badge variant="neutral">{assignment.trackName} Track</Badge>
            ) : (
              <Badge variant="warning">Shared (All Cohort)</Badge>
            )}

            {/* Submission / Grade status badge */}
            {assignment.status === "GRADE_RELEASED" && assignment.submission?.score !== null ? (
              <Badge variant="success">
                Score: {assignment.submission?.score} / {assignment.maxScore}
              </Badge>
            ) : assignment.status === "GRADED_PENDING_RELEASE" ? (
              <Badge variant="info">Graded (Pending Release)</Badge>
            ) : assignment.status === "SUBMITTED_LATE" ? (
              <Badge variant="warning">Submitted Late</Badge>
            ) : assignment.status === "SUBMITTED" ? (
              <Badge variant="info">Submitted</Badge>
            ) : assignment.isPastDue ? (
              <Badge variant="danger">Past Due</Badge>
            ) : (
              <Badge variant="neutral">Not Submitted</Badge>
            )}
          </div>

          <div>
            <Link
              href={`${basePath}/${assignment.id}`}
              className="text-base font-semibold tracking-tight text-zinc-900 hover:underline dark:text-zinc-100"
            >
              {assignment.title}
            </Link>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              {assignment.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-zinc-600 dark:text-zinc-300">
            {/* Due date */}
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
                className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500"
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
              <span className="text-[11px] text-zinc-400 italic">
                Late submissions allowed
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex shrink-0 items-center pt-2 sm:pt-0">
          <Link
            href={`${basePath}/${assignment.id}`}
            className="inline-flex h-8 items-center justify-center rounded-lg bg-zinc-900 px-3.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
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
