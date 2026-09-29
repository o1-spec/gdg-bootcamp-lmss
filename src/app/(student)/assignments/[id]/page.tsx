import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStudent } from "@/lib/auth/session";
import { getAssignmentById } from "@/lib/assignments/queries";
import { StudentSubmissionForm } from "@/components/assignments/student-submission-form";

interface StudentAssignmentPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: StudentAssignmentPageProps) {
  const { id } = await params;
  return {
    title: `Assignment: ${id} | Student Portal`,
  };
}

export default async function StudentAssignmentDetailPage({
  params,
}: StudentAssignmentPageProps) {
  const { id } = await params;
  const user = await requireStudent();

  const data = await getAssignmentById(id, user.id, user.role);

  if (!data) {
    notFound();
  }

  const { assignment, studentSubmission } = data;

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
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
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Top Nav */}
      <Link
        href="/assignments"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#737373] hover:text-[#171717] hover:underline"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Back to Assignments
      </Link>

      {/* Main Assignment Details Card */}
      <div className="rounded-2xl border border-[#E7E3DA] bg-white p-6 shadow-2xs sm:p-8 space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {assignment.track ? (
              <span className="rounded-full bg-[#F7F4ED] px-2.5 py-0.5 text-xs font-medium text-[#737373] border border-[#E7E3DA]">
                {assignment.track.name} Track
              </span>
            ) : (
              <span className="rounded-full bg-[#FBBC04]/15 px-2.5 py-0.5 text-xs font-medium text-[#996500] border border-[#FBBC04]/30">
                Shared (All Cohort)
              </span>
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

        {/* Schedule & Rules Grid */}
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-[#E7E3DA] bg-[#F7F4ED] p-4 sm:grid-cols-3 text-xs">
          <div>
            <span className="text-[#737373] font-medium">Due Date & Time</span>
            <p className="font-semibold text-[#171717] mt-1">
              {formattedDueDate}
            </p>
            <p className="text-2xs text-[#737373]">{formattedDueTime}</p>
          </div>

          <div>
            <span className="text-[#737373] font-medium">Scoring Basis</span>
            <p className="font-semibold text-[#171717] mt-1">
              {assignment.maxScore} Maximum Points
            </p>
            <p className="text-2xs text-[#737373]">100% scale</p>
          </div>

          <div>
            <span className="text-[#737373] font-medium">Late Policy</span>
            <p className="font-semibold text-[#171717] mt-1">
              {assignment.allowLateSubmission ? "Late Submissions Permitted" : "No Late Submissions"}
            </p>
            <p className="text-2xs text-[#737373]">
              {assignment.allowLateSubmission ? "Flagged as late upon turn-in" : "Locked after due date"}
            </p>
          </div>
        </div>

        {/* Problem Requirements */}
        <div className="space-y-2 border-t border-[#E7E3DA] pt-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#737373]">
            Problem Description & Specifications
          </h2>
          <div className="text-xs leading-relaxed text-[#171717] whitespace-pre-wrap">
            {assignment.description}
          </div>
        </div>
      </div>

      {/* Submission Form Area */}
      <StudentSubmissionForm
        assignmentId={assignment.id}
        dueAt={assignment.dueAt}
        maxScore={assignment.maxScore}
        allowLateSubmission={assignment.allowLateSubmission}
        initialSubmission={studentSubmission}
      />
    </div>
  );
}
