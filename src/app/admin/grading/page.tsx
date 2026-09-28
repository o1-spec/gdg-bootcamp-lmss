import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { requireAdmin } from "@/lib/auth/session";
import { getInstructorGradingQueue } from "@/lib/assignments/queries";
import { GradingQueueTable } from "@/components/grading/grading-queue-table";
import { BulkReleasePanel } from "@/components/grading/bulk-release-panel";

export const metadata = {
  title: "Grading Queue | Admin Console",
  description: "Global grading oversight across all tracks, cohorts, and student submissions",
};

interface AdminGradingPageProps {
  searchParams: Promise<{
    status?: string;
    track?: string;
    assignment?: string;
  }>;
}

export default async function AdminGradingPage({
  searchParams,
}: AdminGradingPageProps) {
  const { status, track, assignment } = await searchParams;
  const user = await requireAdmin();

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
          title="Platform Grading Queue"
          description="Global evaluation queue for all student submissions across tracks and cohorts"
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
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mr-1">
            Status:
          </span>
          <Link
            href={`/admin/grading?${new URLSearchParams({
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
            href={`/admin/grading?${new URLSearchParams({
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
            href={`/admin/grading?${new URLSearchParams({
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
            href={`/admin/grading?${new URLSearchParams({
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

        {/* Tracks Info */}
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span>{tracks.length} tracks</span>
          <span>•</span>
          <span>{assignments.length} assignments</span>
        </div>
      </div>

      {/* Submissions List */}
      <GradingQueueTable
        submissions={submissions}
        basePath="/admin/grading"
      />

      {/* Bulk Release Panel */}
      {submissions.filter((s) => s.score !== null && !s.released).length > 0 && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Bulk Grade Release
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Select multiple graded submissions to release at once.
          </p>
          <BulkReleasePanel
            submissions={submissions.map((s) => ({
              id: s.id,
              userId: s.studentId,
              score: s.score,
              released: s.released,
              user: { name: s.studentName, email: s.studentEmail },
              assignment: { title: s.assignmentTitle },
            }))}
          />
        </div>
      )}
    </div>
  );
}
