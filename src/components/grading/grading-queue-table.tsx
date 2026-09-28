import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { GradingQueueItem } from "@/lib/assignments/queries";

interface GradingQueueTableProps {
  submissions: GradingQueueItem[];
  basePath: string; // "/instructor/grading" or "/admin/grading"
}

export function GradingQueueTable({
  submissions,
  basePath,
}: GradingQueueTableProps) {
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-12 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
        <div className="rounded-full bg-zinc-100 p-3 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
          </svg>
        </div>
        <h3 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          No submissions in this queue
        </h3>
        <p className="mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400">
          All pending submissions have been graded or no student work matches your current filter.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden sm:block overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-950">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-zinc-200 bg-zinc-50/75 dark:border-zinc-800 dark:bg-zinc-900/40">
            <tr>
              <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                Student
              </th>
              <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                Assignment
              </th>
              <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                Submitted
              </th>
              <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                Status
              </th>
              <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                Score
              </th>
              <th className="px-4 py-3 font-semibold text-right text-zinc-900 dark:text-zinc-100">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {submissions.map((sub) => (
              <tr
                key={sub.id}
                className="transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30"
              >
                <td className="px-4 py-3.5">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {sub.studentName}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {sub.studentEmail} • {sub.trackName}
                  </p>
                </td>

                <td className="px-4 py-3.5">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {sub.assignmentTitle}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Max: {sub.maxScore} pts
                  </p>
                </td>

                <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-400">
                  {dateFormatter.format(sub.submittedAt)}
                  {sub.isLate && (
                    <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-2xs font-medium text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                      Late
                    </span>
                  )}
                </td>

                <td className="px-4 py-3.5">
                  {sub.released ? (
                    <Badge variant="success">Released</Badge>
                  ) : sub.score !== null ? (
                    <Badge variant="warning">Graded (Hidden)</Badge>
                  ) : (
                    <Badge variant="neutral">Ungraded</Badge>
                  )}
                </td>

                <td className="px-4 py-3.5 text-zinc-900 dark:text-zinc-100 font-semibold">
                  {sub.score !== null ? (
                    <span>
                      {sub.score} / {sub.maxScore}
                    </span>
                  ) : (
                    <span className="text-zinc-400 font-normal italic">—</span>
                  )}
                </td>

                <td className="px-4 py-3.5 text-right">
                  <Link
                    href={`${basePath}/${sub.id}`}
                    className="inline-flex h-8 items-center justify-center rounded-lg bg-zinc-900 px-3 text-xs font-semibold text-white shadow-2xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    {sub.score !== null ? "Review / Release →" : "Grade Work →"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="space-y-3 sm:hidden">
        {submissions.map((sub) => (
          <div
            key={sub.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {sub.studentName}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {sub.assignmentTitle}
                </p>
              </div>

              {sub.released ? (
                <Badge variant="success">Released</Badge>
              ) : sub.score !== null ? (
                <Badge variant="warning">Graded</Badge>
              ) : (
                <Badge variant="neutral">Ungraded</Badge>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-zinc-100 pt-2 text-[11px] text-zinc-500 dark:border-zinc-900 dark:text-zinc-400">
              <span>
                {dateFormatter.format(sub.submittedAt)}
                {sub.isLate && " (Late)"}
              </span>

              <Link
                href={`${basePath}/${sub.id}`}
                className="font-semibold text-zinc-900 dark:text-zinc-100 hover:underline"
              >
                Grade Work →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
