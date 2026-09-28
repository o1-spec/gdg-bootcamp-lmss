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
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Assignments
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/instructor/grading?assignment=${assignment.id}`}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Grading Queue ({assignment.submissionCount || 0})
          </Link>
          <Link
            href={`/instructor/assignments/${assignment.id}/edit`}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow-2xs hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Edit Assignment
          </Link>
          <DeleteAssignmentButton
            assignmentId={assignment.id}
            assignmentTitle={assignment.title}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950 sm:p-8 space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {assignment.track ? (
              <Badge variant="neutral">{assignment.track.name} Track</Badge>
            ) : (
              <Badge variant="warning">Shared (All Cohort)</Badge>
            )}

            <span className="text-xs text-zinc-400 dark:text-zinc-500">•</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {assignment.cohort.name}
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            {assignment.title}
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-xl border border-zinc-100 bg-zinc-50/75 p-4 dark:border-zinc-800/60 dark:bg-zinc-900/40 sm:grid-cols-3 text-xs">
          <div>
            <span className="text-zinc-400 font-medium">Due Date & Schedule</span>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
              {dateFormatter.format(assignment.dueAt)}
            </p>
            <p className="text-2xs text-zinc-500 dark:text-zinc-400">{timeFormatter.format(assignment.dueAt)}</p>
          </div>

          <div>
            <span className="text-zinc-400 font-medium">Scoring Basis</span>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
              {assignment.maxScore} Max Points
            </p>
            <p className="text-2xs text-zinc-500 dark:text-zinc-400">Standard grading scale</p>
          </div>

          <div>
            <span className="text-zinc-400 font-medium">Late Policy</span>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
              {assignment.allowLateSubmission ? "Late Submissions Permitted" : "No Late Submissions"}
            </p>
            <p className="text-2xs text-zinc-500 dark:text-zinc-400">
              {assignment.submissionCount} total student submissions
            </p>
          </div>
        </div>

        <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-800/80 pt-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Problem Description & Specifications
          </h2>
          <div className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
            {assignment.description}
          </div>
        </div>

        {/* Rubric Section */}
        <div className="space-y-3 border-t border-zinc-100 dark:border-zinc-800/80 pt-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Grading Rubric
            </h2>
            {rubric && <RubricDeleteButton assignmentId={id} />}
          </div>
          {rubric ? (
            <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
              {rubric.criteria.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{c.title}</p>
                    {c.description && <p className="text-xs text-zinc-500">{c.description}</p>}
                  </div>
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{c.maxScore} pts</span>
                </div>
              ))}
              <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/40 px-4 py-3">
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Total</span>
                <span className="text-xs font-bold">{rubric.criteria.reduce((s, c) => s + c.maxScore, 0)} / {assignment.maxScore} pts</span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
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

