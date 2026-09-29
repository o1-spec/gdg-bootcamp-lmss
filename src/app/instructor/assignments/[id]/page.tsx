import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { requireInstructor } from "@/lib/auth/session";
import { getAssignmentById } from "@/lib/assignments/queries";
import { DeleteAssignmentButton } from "@/components/assignments/delete-assignment-button";
import { getRubricByAssignment } from "@/lib/rubrics/queries";
import { RubricBuilder, RubricDeleteButton } from "@/components/rubrics/rubric-components";

interface InstructorAssignmentDetailsProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: InstructorAssignmentDetailsProps) {
  const { id } = await params;
  return {
    title: `Assignment: ${id} | Instructor Portal`,
  };
}

export default async function InstructorAssignmentDetailsPage({
  params,
}: InstructorAssignmentDetailsProps) {
  const { id } = await params;
  const user = await requireInstructor();

  const data = await getAssignmentById(id, user.id, user.role);

  if (!data) {
    notFound();
  }

  const { assignment } = data;
  const rubric = await getRubricByAssignment(id);

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
          href="/instructor/assignments"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#737373] hover:text-[#171717] transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Assignments
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/instructor/grading?assignment=${assignment.id}`}
            className="rounded-xl bg-[#171717] px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-black transition-colors"
          >
            Grading Queue ({assignment.submissionCount || 0})
          </Link>
          <Link
            href={`/instructor/assignments/${assignment.id}/edit`}
            className="rounded-xl border border-[#E7E3DA] bg-white px-3.5 py-2 text-xs font-semibold text-[#171717] shadow-2xs hover:bg-[#F7F4ED] transition-colors"
          >
            Edit Assignment
          </Link>
          <DeleteAssignmentButton
            assignmentId={assignment.id}
            assignmentTitle={assignment.title}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-[#E7E3DA] bg-white p-6 shadow-2xs sm:p-8 space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {assignment.track ? (
              <Badge variant="neutral">{assignment.track.name} Track</Badge>
            ) : (
              <Badge variant="warning">Shared (All Cohort)</Badge>
            )}

            <span className="text-xs text-[#E7E3DA]">•</span>
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
            <p className="text-2xs text-[#737373]">{timeFormatter.format(assignment.dueAt)}</p>
          </div>

          <div>
            <span className="text-[#737373] font-medium">Scoring Basis</span>
            <p className="font-semibold text-[#171717] mt-1">
              {assignment.maxScore} Max Points
            </p>
            <p className="text-2xs text-[#737373]">Standard grading scale</p>
          </div>

          <div>
            <span className="text-[#737373] font-medium">Late Policy</span>
            <p className="font-semibold text-[#171717] mt-1">
              {assignment.allowLateSubmission ? "Late Submissions Permitted" : "No Late Submissions"}
            </p>
            <p className="text-2xs text-[#737373]">
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

        {/* Rubric Section */}
        <div className="space-y-3 border-t border-[#E7E3DA] pt-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#737373]">
              Grading Rubric
            </h2>
            {rubric && <RubricDeleteButton assignmentId={id} />}
          </div>
          {rubric ? (
            <div className="divide-y divide-[#E7E3DA] rounded-xl border border-[#E7E3DA] bg-white overflow-hidden">
              {rubric.criteria.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold text-[#171717]">{c.title}</p>
                    {c.description && <p className="text-xs text-[#737373] mt-0.5">{c.description}</p>}
                  </div>
                  <span className="text-xs font-bold text-[#171717]">{c.maxScore} pts</span>
                </div>
              ))}
              <div className="flex items-center justify-between bg-[#F7F4ED]/60 px-4 py-3">
                <span className="text-xs font-semibold text-[#737373]">Total</span>
                <span className="text-xs font-bold text-[#171717]">{rubric.criteria.reduce((s, c) => s + c.maxScore, 0)} / {assignment.maxScore} pts</span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#E7E3DA] bg-[#F7F4ED]/30 p-5">
              <p className="text-xs text-[#737373] mb-3">
                No rubric yet. Add one to enable per-criterion grading.
              </p>
              <RubricBuilder
                assignmentId={id}
                assignmentMaxScore={assignment.maxScore}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

