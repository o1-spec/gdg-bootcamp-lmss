import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth/session";
import { getManagementAssignments } from "@/lib/assignments/queries";

export const metadata = {
  title: "Assignments | Admin Console",
  description: "Global assignment oversight across all cohorts, tracks, and student submissions",
};

interface AdminAssignmentsPageProps {
  searchParams: Promise<{ track?: string }>;
}

export default async function AdminAssignmentsPage({
  searchParams,
}: AdminAssignmentsPageProps) {
  const { track: trackFilter } = await searchParams;
  const user = await requireAdmin();

  const { assignments, tracks, cohorts } = await getManagementAssignments(
    user.id,
    user.role,
    trackFilter
  );

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="All Assignments"
          description="Manage curriculum problem sets, due dates, and grading policies across all tracks"
        />

        <Link
          href="/admin/assignments/new"
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Create New Assignment</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mr-1">
            Filter:
          </span>
          <Link
            href="/admin/assignments"
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              !trackFilter || trackFilter === "all"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            All Tracks
          </Link>
          <Link
            href="/admin/assignments?track=shared"
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              trackFilter === "shared"
                ? "bg-amber-600 text-white dark:bg-amber-500 dark:text-zinc-950 font-semibold"
                : "border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            Cohort Shared
          </Link>
          {tracks.map((t) => (
            <Link
              key={t.id}
              href={`/admin/assignments?track=${t.id}`}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                trackFilter === t.id
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              {t.name}
            </Link>
          ))}
        </div>

        {cohorts.length > 0 && (
          <div className="text-xs text-zinc-400">
            {cohorts.map((c) => c.name).join(", ")}
          </div>
        )}
      </div>

      {/* Assignment List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Curriculum Assignments
          </h2>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {assignments.length} {assignments.length === 1 ? "assignment" : "assignments"}
          </span>
        </div>

        {assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-10 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              No assignments found matching this filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {assignments.map((asg) => (
              <div
                key={asg.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {asg.track ? (
                      <Badge variant="neutral">{asg.track.name} Track</Badge>
                    ) : (
                      <Badge variant="warning">Shared (All Cohort)</Badge>
                    )}

                    <span className="text-xs text-zinc-400 dark:text-zinc-500">•</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{asg.cohort.name}</span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">•</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">Max: {asg.maxScore} pts</span>
                  </div>

                  <div>
                    <Link
                      href={`/admin/assignments/${asg.id}`}
                      className="text-base font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
                    >
                      {asg.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      Due: {dateFormatter.format(asg.dueAt)} at {timeFormatter.format(asg.dueAt)}
                    </p>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    <strong>{asg.submissionCount}</strong> student submission{asg.submissionCount === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2 pt-2 sm:pt-0">
                  <Link
                    href={`/admin/grading?assignment=${asg.id}`}
                    className="inline-flex h-8 items-center justify-center rounded-lg bg-zinc-900 px-3 text-xs font-semibold text-white shadow-2xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    Grading Queue →
                  </Link>

                  <Link
                    href={`/admin/assignments/${asg.id}`}
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
