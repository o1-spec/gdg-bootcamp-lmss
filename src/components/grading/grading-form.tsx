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
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#737373] hover:text-[#171717] transition-colors"
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
        <div className="rounded-xl border border-[#EA4335]/30 bg-red-50 p-4 text-xs text-[#EA4335]">
          {formError}
        </div>
      )}

      {formSuccess && (
        <div className="rounded-xl border border-[#34A853]/30 bg-green-50 p-4 text-xs text-[#34A853] font-medium">
          {formSuccess}
        </div>
      )}

      {/* Student & Submission Details Card */}
      <div className="rounded-2xl border border-[#E7E3DA] bg-white p-6 shadow-2xs sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#E7E3DA]">
          <div>
            <span className="text-2xs font-semibold uppercase tracking-wider text-[#737373]">
              Student Work Review
            </span>
            <h2 className="text-lg font-bold text-[#171717] mt-0.5">
              {submission.studentName}
            </h2>
            <p className="text-xs text-[#737373]">
              {submission.studentEmail} • {submission.trackName}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs font-semibold text-[#171717]">
              {assignment.title}
            </span>
            <p className="text-2xs text-[#737373]">
              Max Score: {assignment.maxScore} pts
            </p>
          </div>
        </div>

        {/* Submission Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-[#E7E3DA] bg-[#F7F4ED]/60 p-4 text-xs">
          <div>
            <span className="text-[#737373] font-medium">Submitted Link:</span>
            {submission.submissionUrl ? (
              <a
                href={submission.submissionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center gap-1.5 font-semibold text-[#171717] hover:underline truncate"
              >
                <svg className="h-3.5 w-3.5 text-[#737373] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                <span className="truncate">{submission.submissionUrl}</span>
              </a>
            ) : (
              <p className="text-[#737373] italic mt-1">No URL provided</p>
            )}

            {submission.fileUrl && (
              <div className="mt-2 pt-2 border-t border-[#E7E3DA]">
                <span className="text-[#737373] font-medium">Attached File:</span>
                <a
                  href={submission.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1.5 font-semibold text-[#34A853] hover:underline truncate"
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
            <span className="text-[#737373] font-medium">Submitted Time:</span>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[#171717] font-medium">
                {new Date(submission.submittedAt).toLocaleString()}
              </span>
              {submission.isLate ? (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-2xs font-semibold text-[#B45309] border border-[#FBBC04]/40">
                  Late
                </span>
              ) : (
                <span className="rounded-full bg-green-50 px-2 py-0.5 text-2xs font-semibold text-[#34A853] border border-[#34A853]/30">
                  On-Time
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Assignment Problem Prompt Description */}
        <div className="space-y-1.5 border-t border-[#E7E3DA] pt-4">
          <span className="text-2xs font-semibold uppercase tracking-wider text-[#737373]">
            Problem Description & Constraints
          </span>
          <p className="text-xs text-[#171717] leading-relaxed whitespace-pre-wrap">
            {assignment.description}
          </p>
        </div>
      </div>

      {/* Evaluation & Grading Form */}
      <div className="rounded-2xl border border-[#E7E3DA] bg-white p-6 shadow-2xs sm:p-7 space-y-5">
        <h3 className="text-sm font-semibold tracking-tight text-[#171717] pb-3 border-b border-[#E7E3DA]">
          Evaluation, Score & Written Feedback
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5 sm:col-span-1">
            <label className="block text-xs font-medium text-[#171717]">
              Score (Out of {assignment.maxScore}) <span className="text-[#EA4335]">*</span>
            </label>
            <input
              type="number"
              min="0"
              max={assignment.maxScore}
              required
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="e.g. 95"
              className="w-full h-12 rounded-xl border border-[#E7E3DA] bg-white px-3.5 text-xs text-[#171717] placeholder-[#737373]/60 focus:border-[#171717] focus:outline-hidden"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-medium text-[#171717]">
              Grade Visibility Status
            </label>
            <div className="rounded-xl border border-[#E7E3DA] bg-[#F7F4ED]/60 p-3 text-xs text-[#737373]">
              {isReleased ? (
                <span className="font-semibold text-[#34A853]">
                  Visible to student on their assignments portal.
                </span>
              ) : (
                <span>
                  Currently hidden. Clicking <strong>Save Draft</strong> retains privacy. Clicking <strong>Release Grade</strong> reveals it.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Written Feedback */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[#171717]">
            Written Feedback & Code Review Notes
          </label>
          <textarea
            rows={5}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Highlight correct algorithmic design, edge cases handled, and optimization recommendations..."
            className="w-full rounded-xl border border-[#E7E3DA] bg-white p-3.5 text-xs text-[#171717] placeholder-[#737373]/60 focus:border-[#171717] focus:outline-hidden"
          />
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSave(false)}
            className="rounded-xl border border-[#E7E3DA] bg-white px-4 py-2.5 text-xs font-medium text-[#171717] hover:bg-[#F7F4ED] transition-colors"
          >
            {isSubmitting ? "Saving..." : "Save Draft (Unreleased)"}
          </button>

          {!isReleased ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave(true)}
              className="rounded-xl bg-[#171717] px-5 py-2.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-black disabled:opacity-50"
            >
              {isSubmitting ? "Releasing..." : "Save & Release Grade"}
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave(true)}
              className="rounded-xl bg-[#34A853] px-5 py-2.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-[#2d9247] disabled:opacity-50"
            >
              {isSubmitting ? "Updating..." : "Update Released Grade"}
            </button>
          )}

          {!isReleased && submission.score !== null && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleDirectRelease}
              className="rounded-xl bg-[#34A853] px-5 py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#2d9247] disabled:opacity-50 transition-colors"
            >
              Release Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
