import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth/session";
import { getAssignmentById } from "@/lib/assignments/queries";
import { DeleteAssignmentButton } from "@/components/assignments/delete-assignment-button";

interface AdminAssignmentDetailsProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AdminAssignmentDetailsProps) {
  const { id } = await params;
  return {
    title: `Assignment: ${id} | Admin Console`,
  };
}

export default async function AdminAssignmentDetailsPage({
  params,
}: AdminAssignmentDetailsProps) {
  const { id } = await params;
  const user = await requireAdmin();

  const data = await getAssignmentById(id, user.id, user.role);

  if (!data) {
    notFound();
  }

  const { assignment } = data;

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

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/admin/assignments"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#737373] hover:text-[#171717] transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Assignments
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/grading?assignment=${assignment.id}`}
            className="inline-flex h-9 items-center justify-center rounded-xl bg-[#171717] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#171717]/90"
          >
            Grading Queue ({assignment.submissionCount || 0})
          </Link>
          <Link
            href={`/admin/assignments/${assignment.id}/edit`}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-[#E7E3DA] bg-white px-3.5 text-xs font-medium text-[#171717] hover:bg-[#F7F4ED] transition-colors"
          >
            Edit Assignment
          </Link>
          <DeleteAssignmentButton
            assignmentId={assignment.id}
            assignmentTitle={assignment.title}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-[#E7E3DA] bg-white p-6 sm:p-8 space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {assignment.track ? (
              <Badge variant="neutral">{assignment.track.name} Track</Badge>
            ) : (
              <Badge variant="warning">Shared (All Cohort)</Badge>
            )}

            <span className="text-xs text-[#737373]">•</span>
            <span className="text-xs text-[#737373]">
              {assignment.cohort.name}
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#171717] sm:text-3xl">
            {assignment.title}
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-xl border border-[#E7E3DA] bg-[#F7F4ED]/60 p-4 sm:grid-cols-3 text-xs">
          <div>
            <span className="text-[#737373] font-medium">Due Date & Schedule</span>
            <p className="font-semibold text-[#171717] mt-1">
              {dateFormatter.format(assignment.dueAt)}
            </p>
            <p className="text-[11px] text-[#737373]">{timeFormatter.format(assignment.dueAt)}</p>
          </div>

          <div>
            <span className="text-[#737373] font-medium">Scoring Basis</span>
            <p className="font-semibold text-[#171717] mt-1">
              {assignment.maxScore} Max Points
            </p>
            <p className="text-[11px] text-[#737373]">Standard grading scale</p>
          </div>

          <div>
            <span className="text-[#737373] font-medium">Late Policy</span>
            <p className="font-semibold text-[#171717] mt-1">
              {assignment.allowLateSubmission ? "Late Submissions Permitted" : "No Late Submissions"}
            </p>
            <p className="text-[11px] text-[#737373]">
              {assignment.submissionCount} total student submissions
            </p>
          </div>
        </div>

        <div className="space-y-2 border-t border-[#E7E3DA] pt-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#737373]">
            Problem Description & Specifications
          </h2>
          <div className="text-xs leading-relaxed text-[#171717] whitespace-pre-wrap">
            {assignment.description}
          </div>
        </div>
      </div>
    </div>
  );
}
