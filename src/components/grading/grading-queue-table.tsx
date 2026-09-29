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
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E7E3DA] bg-white p-12 text-center">
        <div className="rounded-2xl bg-[#F7F4ED] p-3 text-[#737373]">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
          </svg>
        </div>
        <h3 className="mt-3 text-sm font-semibold text-[#171717]">
          No submissions in this queue
        </h3>
        <p className="mt-1 max-w-sm text-xs text-[#737373]">
          All pending submissions have been graded or no student work matches your current filter.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden sm:block overflow-hidden rounded-2xl border border-[#E7E3DA] bg-white shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-[#E7E3DA] bg-[#F7F4ED]/60">
            <tr>
              <th className="px-5 py-3.5 font-semibold text-[#171717]">
                Student
              </th>
              <th className="px-5 py-3.5 font-semibold text-[#171717]">
                Assignment
              </th>
              <th className="px-5 py-3.5 font-semibold text-[#171717]">
                Submitted
              </th>
              <th className="px-5 py-3.5 font-semibold text-[#171717]">
                Status
              </th>
              <th className="px-5 py-3.5 font-semibold text-[#171717]">
                Score
              </th>
              <th className="px-5 py-3.5 font-semibold text-right text-[#171717]">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E3DA]">
            {submissions.map((sub) => (
              <tr
                key={sub.id}
                className="transition-colors hover:bg-[#F7F4ED]/40"
              >
                <td className="px-5 py-4">
                  <p className="font-semibold text-[#171717]">
                    {sub.studentName}
                  </p>
                  <p className="text-[11px] text-[#737373]">
                    {sub.studentEmail} • {sub.trackName}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <p className="font-semibold text-[#171717]">
                    {sub.assignmentTitle}
                  </p>
                  <p className="text-[11px] text-[#737373]">
                    Max: {sub.maxScore} pts
                  </p>
                </td>

                <td className="px-5 py-4 text-[#737373]">
                  {dateFormatter.format(sub.submittedAt)}
                  {sub.isLate && (
                    <span className="ml-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-2xs font-semibold text-[#B45309] border border-[#FBBC04]/40">
                      Late
                    </span>
                  )}
                </td>

                <td className="px-5 py-4">
                  {sub.released ? (
                    <Badge variant="success">Released</Badge>
                  ) : sub.score !== null ? (
                    <Badge variant="warning">Graded (Hidden)</Badge>
                  ) : (
                    <Badge variant="neutral">Ungraded</Badge>
                  )}
                </td>

                <td className="px-5 py-4 text-[#171717] font-semibold">
                  {sub.score !== null ? (
                    <span>
                      {sub.score} / {sub.maxScore}
                    </span>
                  ) : (
                    <span className="text-[#737373] font-normal italic">—</span>
                  )}
                </td>

                <td className="px-5 py-4 text-right">
                  <Link
                    href={`${basePath}/${sub.id}`}
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-[#171717] px-3.5 text-xs font-semibold text-white shadow-2xs hover:bg-black transition-colors"
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
            className="rounded-2xl border border-[#E7E3DA] bg-white p-4 shadow-2xs space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-[#171717]">
                  {sub.studentName}
                </p>
                <p className="text-[11px] text-[#737373]">
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

            <div className="flex items-center justify-between border-t border-[#E7E3DA] pt-2.5 text-[11px] text-[#737373]">
              <span>
                {dateFormatter.format(sub.submittedAt)}
                {sub.isLate && " (Late)"}
              </span>

              <Link
                href={`${basePath}/${sub.id}`}
                className="font-semibold text-[#171717] hover:underline"
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
