import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { requireInstructor } from "@/lib/auth/session";
import { getInstructorGradingQueue } from "@/lib/assignments/queries";
import { GradingQueueTable } from "@/components/grading/grading-queue-table";

export const metadata = {
  title: "Grading Queue | Instructor Portal",
  description: "Evaluate student code submissions, record points, and release grade feedback",
};

interface InstructorGradingPageProps {
  searchParams: Promise<{
    status?: string;
    track?: string;
    assignment?: string;
  }>;
}

export default async function InstructorGradingPage({
  searchParams,
}: InstructorGradingPageProps) {
  const { status, track, assignment } = await searchParams;
  const user = await requireInstructor();

  const { submissions, assignments, tracks } = await getInstructorGradingQueue(
    user.id,
    user.role,
    {
      status,
      trackId: track,
      assignmentId: assignment,
    }
  );

  const ungradedCount = submissions.filter((s) => s.score === null).length;
  const gradedPendingCount = submissions.filter(
    (s) => s.score !== null && !s.released
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Grading Queue"
          description="Evaluate code submissions, record points, and publish feedback to students"
        />

        <div className="flex items-center gap-2">
          {ungradedCount > 0 && (
            <span className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
              {ungradedCount} Ungraded
            </span>
          )}
          {gradedPendingCount > 0 && (
            <span className="rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60">
              {gradedPendingCount} Ready to Release
            </span>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950">
        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mr-1">
            Status:
          </span>
          <Link
            href={`/instructor/grading?${new URLSearchParams({
              ...(track ? { track } : {}),
              ...(assignment ? { assignment } : {}),
            }).toString()}`}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              !status || status === "all"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            All ({submissions.length})
          </Link>
          <Link
            href={`/instructor/grading?${new URLSearchParams({
              status: "ungraded",
              ...(track ? { track } : {}),
              ...(assignment ? { assignment } : {}),
            }).toString()}`}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              status === "ungraded"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            Ungraded
          </Link>
          <Link
            href={`/instructor/grading?${new URLSearchParams({
              status: "graded",
              ...(track ? { track } : {}),
              ...(assignment ? { assignment } : {}),
            }).toString()}`}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              status === "graded"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            Graded (Unreleased)
          </Link>
          <Link
            href={`/instructor/grading?${new URLSearchParams({
              status: "released",
              ...(track ? { track } : {}),
              ...(assignment ? { assignment } : {}),
            }).toString()}`}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              status === "released"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            Released
          </Link>
        </div>

        {/* Assignment & Track Selector Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          {tracks.length > 1 && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-zinc-400">Track:</span>
              <Link
                href={`/instructor/grading`}
                className="text-zinc-700 dark:text-zinc-300 font-medium hover:underline"
              >
                Reset
              </Link>
            </div>
          )}

          {assignments.length > 1 && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span>{assignments.length} assignments</span>
            </div>
          )}
        </div>
      </div>

      {/* Submissions List */}
      <GradingQueueTable
        submissions={submissions}
        basePath="/instructor/grading"
      />
    </div>
  );
}
