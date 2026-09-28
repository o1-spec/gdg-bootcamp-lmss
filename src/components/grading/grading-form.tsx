"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SubmissionForGrading } from "@/lib/assignments/queries";
import { gradeSubmissionAction, releaseGradeAction } from "@/lib/assignments/actions";

interface GradingFormProps {
  submissionData: SubmissionForGrading;
  backHref: string;
}

export function GradingForm({ submissionData, backHref }: GradingFormProps) {
  const { submission, assignment } = submissionData;

  const [score, setScore] = useState(
    submission.score !== null ? String(submission.score) : ""
  );
  const [feedback, setFeedback] = useState(submission.feedback || "");
  const [isReleased, setIsReleased] = useState(submission.released);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const handleSave = async (releaseNow: boolean) => {
    setFormError(null);
    setFormSuccess(null);

    if (score === "") {
      setFormError("Please enter a numeric score.");
      return;
    }

    const numScore = parseFloat(score);
    if (isNaN(numScore)) {
      setFormError("Score must be a valid number.");
      return;
    }
    if (numScore < 0) {
      setFormError("Score cannot be negative.");
      return;
    }
    if (numScore > assignment.maxScore) {
      setFormError(
        `Score cannot exceed maximum points (${assignment.maxScore}).`
      );
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("score", score);
    formData.append("feedback", feedback);
    formData.append("release", releaseNow ? "true" : "false");

    const result = await gradeSubmissionAction(submission.id, formData);
    setIsSubmitting(false);

    if (result.success) {
      if (releaseNow) {
        setIsReleased(true);
        setFormSuccess("Grade and feedback saved and released to the student.");
      } else {
        setFormSuccess("Grade draft saved. Result remains hidden from the student until released.");
      }
    } else {
      setFormError(result.message || "Failed to save grade.");
    }
  };

  const handleDirectRelease = async () => {
    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    const result = await releaseGradeAction(submission.id);
    setIsSubmitting(false);

    if (result.success) {
      setIsReleased(true);
      setFormSuccess("Grade released successfully.");
    } else {
      setFormError(result.message || "Failed to release grade.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Top Nav */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Grading Queue
        </Link>

        <div>
          {isReleased ? (
            <Badge variant="success">Grade Released to Student</Badge>
          ) : submission.score !== null ? (
            <Badge variant="warning">Draft Saved (Hidden from Student)</Badge>
          ) : (
            <Badge variant="neutral">Ungraded Submission</Badge>
          )}
        </div>
      </div>

      {formError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {formError}
        </div>
      )}

      {formSuccess && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          {formSuccess}
        </div>
      )}

      {/* Student & Submission Details Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-900">
          <div>
            <span className="text-2xs font-semibold uppercase tracking-wider text-zinc-400">
              Student Work Review
            </span>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
              {submission.studentName}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {submission.studentEmail} • {submission.trackName}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              {assignment.title}
            </span>
            <p className="text-2xs text-zinc-500 dark:text-zinc-400">
              Max Score: {assignment.maxScore} pts
            </p>
          </div>
        </div>

        {/* Submission Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-zinc-100 bg-zinc-50/60 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/40 text-xs">
          <div>
            <span className="text-zinc-400 font-medium">Submitted Link:</span>
            {submission.submissionUrl ? (
              <a
                href={submission.submissionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center gap-1.5 font-semibold text-zinc-900 hover:underline dark:text-zinc-100 truncate"
              >
                <svg className="h-3.5 w-3.5 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                <span className="truncate">{submission.submissionUrl}</span>
              </a>
            ) : (
              <p className="text-zinc-400 italic mt-1">No URL provided</p>
            )}

            {submission.fileUrl && (
              <div className="mt-2 pt-2 border-t border-zinc-200/40 dark:border-zinc-800/40">
                <span className="text-zinc-400 font-medium">Attached File:</span>
                <a
                  href={submission.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1.5 font-semibold text-emerald-600 hover:underline dark:text-emerald-400 truncate"
                >
                  <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                  </svg>
                  <span>Download / View File</span>
                </a>
              </div>
            )}
          </div>

          <div>
            <span className="text-zinc-400 font-medium">Submitted Time:</span>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-zinc-900 dark:text-zinc-100">
                {new Date(submission.submittedAt).toLocaleString()}
              </span>
              {submission.isLate ? (
                <span className="rounded bg-amber-100 px-2 py-0.5 text-2xs font-medium text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  Late
                </span>
              ) : (
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-2xs font-medium text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  On-Time
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Assignment Problem Prompt Description */}
        <div className="space-y-1.5 border-t border-zinc-100 dark:border-zinc-900 pt-4">
          <span className="text-2xs font-semibold uppercase tracking-wider text-zinc-400">
            Problem Description & Constraints
          </span>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
            {assignment.description}
          </p>
        </div>
      </div>

      {/* Evaluation & Grading Form */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950 sm:p-7 space-y-5">
        <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 pb-3 border-b border-zinc-100 dark:border-zinc-900">
          Evaluation, Score & Written Feedback
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5 sm:col-span-1">
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Score (Out of {assignment.maxScore}) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              max={assignment.maxScore}
              required
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="e.g. 95"
              className="w-full rounded-xl border border-zinc-200 bg-transparent px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-zinc-100"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Grade Visibility Status
            </label>
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40">
              {isReleased ? (
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  Visible to student on their assignments portal.
                </span>
              ) : (
                <span className="text-zinc-500 dark:text-zinc-400">
                  Currently hidden. Clicking <strong>Save Draft</strong> retains privacy. Clicking <strong>Release Grade</strong> reveals it.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Written Feedback */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Written Feedback & Code Review Notes
          </label>
          <textarea
            rows={5}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Highlight correct algorithmic design, edge cases handled, and optimization recommendations..."
            className="w-full rounded-xl border border-zinc-200 bg-transparent px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-zinc-100"
          />
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSave(false)}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            {isSubmitting ? "Saving..." : "Save Draft (Unreleased)"}
          </button>

          {!isReleased ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave(true)}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isSubmitting ? "Releasing..." : "Save & Release Grade"}
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave(true)}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSubmitting ? "Updating..." : "Update Released Grade"}
            </button>
          )}

          {!isReleased && submission.score !== null && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleDirectRelease}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700 disabled:opacity-50"
            >
              Release Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
