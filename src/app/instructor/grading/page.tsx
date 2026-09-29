import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { requireInstructor } from "@/lib/auth/session";
import { getInstructorGradingQueue } from "@/lib/assignments/queries";
import { GradingQueueTable } from "@/components/grading/grading-queue-table";
import { BulkReleasePanel } from "@/components/grading/bulk-release-panel";

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
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-[#B45309] border border-[#FBBC04]/40">
              {ungradedCount} Ungraded
            </span>
          )}
          {gradedPendingCount > 0 && (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#4285F4] border border-[#4285F4]/30">
              {gradedPendingCount} Ready to Release
            </span>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E7E3DA] bg-white p-4 sm:p-5 shadow-2xs">
        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-[#737373] mr-1">
            Status:
          </span>
          <Link
            href={`/instructor/grading?${new URLSearchParams({
              ...(track ? { track } : {}),
              ...(assignment ? { assignment } : {}),
            }).toString()}`}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
              !status || status === "all"
                ? "bg-[#171717] text-white"
                : "border border-[#E7E3DA] bg-white text-[#737373] hover:text-[#171717] hover:bg-[#F7F4ED]"
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
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
              status === "ungraded"
                ? "bg-[#171717] text-white"
                : "border border-[#E7E3DA] bg-white text-[#737373] hover:text-[#171717] hover:bg-[#F7F4ED]"
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
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
              status === "graded"
                ? "bg-[#171717] text-white"
                : "border border-[#E7E3DA] bg-white text-[#737373] hover:text-[#171717] hover:bg-[#F7F4ED]"
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
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
              status === "released"
                ? "bg-[#171717] text-white"
                : "border border-[#E7E3DA] bg-white text-[#737373] hover:text-[#171717] hover:bg-[#F7F4ED]"
            }`}
          >
            Released
          </Link>
        </div>

        {/* Assignment & Track Selector Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          {tracks.length > 1 && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[#737373]">Track:</span>
              <Link
                href={`/instructor/grading`}
                className="text-[#171717] font-semibold hover:underline"
              >
                Reset
              </Link>
            </div>
          )}

          {assignments.length > 1 && (
            <div className="flex items-center gap-1.5 text-xs text-[#737373]">
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

      {/* Bulk Release Panel */}
      {gradedPendingCount > 0 && (
        <div className="space-y-4">
          <div className="border-t border-[#E7E3DA] pt-6">
            <h2 className="text-sm font-semibold text-[#171717] mb-1">
              Bulk Grade Release
            </h2>
            <p className="text-xs text-[#737373] mb-4">
              Select multiple graded submissions to release to students at once.
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
        </div>
      )}
    </div>
  );
}
