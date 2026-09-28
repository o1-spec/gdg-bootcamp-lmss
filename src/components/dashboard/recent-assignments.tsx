import React from "react";
import Link from "next/link";
import { Assignment } from "@/types";
import { Badge } from "@/components/ui/badge";

interface RecentAssignmentsProps {
  assignments: Assignment[];
}

export function RecentAssignments({ assignments }: RecentAssignmentsProps) {
  const renderStatus = (assignment: Assignment) => {
    switch (assignment.status) {
      case "graded":
        return (
          <Badge variant="success">
            Graded: {assignment.score}/{assignment.maxScore}
          </Badge>
        );
      case "submitted":
        return <Badge variant="info">Submitted (Pending)</Badge>;
      case "in_progress":
        return <Badge variant="warning">In Progress</Badge>;
      default:
        return <Badge variant="neutral">Pending</Badge>;
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
      <div className="flex items-center justify-between pb-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Recent Assignments
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Track submissions, feedback, and deadlines
          </p>
        </div>
        <Link
          href="/assignments"
          className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          View all
        </Link>
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className="flex flex-col gap-2 py-3.5 first:pt-2 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                {assignment.title}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                <span>Track: {assignment.track}</span>
                <span>•</span>
                <span>{assignment.dueDate}</span>
              </div>
            </div>

            <div className="self-start sm:self-center">
              {renderStatus(assignment)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
