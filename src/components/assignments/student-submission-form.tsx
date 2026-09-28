"use client";

import React, { useState } from "react";
import { submitAssignmentAction } from "@/lib/assignments/actions";
import { StudentAssignmentItem } from "@/lib/assignments/queries";

interface StudentSubmissionFormProps {
  assignmentId: string;
  dueAt: string | Date;
  maxScore: number;
  allowLateSubmission: boolean;
  initialSubmission: StudentAssignmentItem["submission"] | null;
}

export function StudentSubmissionForm({
  assignmentId,
  dueAt: rawDueAt,
  maxScore,
  allowLateSubmission,
  initialSubmission,
}: StudentSubmissionFormProps) {
  const dueAt = new Date(rawDueAt);
  const now = new Date();
  const isPastDue = now > dueAt;

  const [submission, setSubmission] = useState(initialSubmission);
  const [submissionUrl, setSubmissionUrl] = useState(
    initialSubmission?.submissionUrl || ""
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isGraded = submission?.isGraded;
  const isReleased = submission?.isReleased;
  const cannotSubmit = isPastDue && !allowLateSubmission && !submission;
  const isGradedClosed = isGraded && !isReleased;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionUrl.trim() && !selectedFile) {
      setErrorMsg("Please provide either a submission URL or choose a file to upload.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData();
    if (submissionUrl.trim()) {
      formData.append("submissionUrl", submissionUrl.trim());
    }
    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    const result = await submitAssignmentAction(assignmentId, formData);
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMsg(result.message);
      setSubmission({
        id: submission?.id || `sub-${Date.now()}`,
        submissionUrl: result.submissionUrl || submissionUrl.trim() || null,
        fileUrl: result.fileUrl || submission?.fileUrl || null,
        submittedAt: new Date(),
        isLate: isPastDue,
        isGraded: false,
        isReleased: false,
        score: null,
        feedback: null,
        gradedAt: null,
      });
      setSelectedFile(null);
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950 sm:p-7 space-y-6">
      <div className="flex flex-col gap-1 pb-4 border-b border-zinc-100 dark:border-zinc-900">
        <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Your Submission & Evaluation
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Submit via project repository link, direct file upload (ZIP, PDF, document), or both.
        </p>
      </div>

      {/* Grade Released View */}
      {isReleased && submission?.score !== null && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 dark:border-emerald-900/60 dark:bg-emerald-950/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Evaluated Grade & Feedback
            </span>
            <span className="rounded-md bg-emerald-200/60 px-2 py-0.5 text-xs font-bold text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200">
              Score: {submission.score} / {maxScore} (
              {Math.round((submission.score / maxScore) * 100)}%)
            </span>
          </div>

          {submission.feedback && (
            <div className="pt-2 text-xs leading-relaxed text-emerald-950 dark:text-emerald-200 whitespace-pre-wrap">
              <strong className="block text-2xs uppercase tracking-wider font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                Instructor Feedback:
              </strong>
              {submission.feedback}
            </div>
          )}

          {submission.gradedAt && (
            <p className="text-2xs text-emerald-700/80 dark:text-emerald-400/80 pt-1">
              Evaluated on {new Date(submission.gradedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Graded but Unreleased View */}
      {isGradedClosed && (
        <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4 dark:border-sky-900/60 dark:bg-sky-950/40 flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-sky-950 dark:text-sky-200">
              Grading completed — result not yet released
            </p>
            <p className="text-2xs text-sky-700 dark:text-sky-400">
              Your instructor has reviewed your submission. Grades and feedback will appear here once released to the cohort.
            </p>
          </div>
        </div>
      )}

      {/* Current Submission Summary */}
      {submission && (
        <div className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/40 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-semibold uppercase tracking-wider text-zinc-400">
              Recorded Submission
            </span>
            {submission.isLate ? (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-2xs font-medium text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                Submitted Late
              </span>
            ) : (
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-2xs font-medium text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                On-Time
              </span>
            )}
          </div>

          {/* Submitted Link */}
          {submission.submissionUrl && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1">
              <div className="flex items-center gap-1.5 truncate max-w-md">
                <span className="text-2xs text-zinc-400 font-medium">Link:</span>
                <a
                  href={submission.submissionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-zinc-900 hover:underline dark:text-zinc-100 truncate"
                >
                  {submission.submissionUrl}
                </a>
              </div>
            </div>
          )}

          {/* Submitted File */}
          {submission.fileUrl && (
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-200/40 dark:border-zinc-800/40">
              <div className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                </svg>
                <span className="text-2xs text-zinc-400 font-medium">Uploaded File:</span>
                <a
                  href={submission.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  Download / View Attached Document
                </a>
              </div>
            </div>
          )}

          <div className="pt-1 text-2xs text-zinc-400">
            Submitted: {new Date(submission.submittedAt).toLocaleString()}
          </div>
        </div>
      )}

      {/* Feedback / Alert messages */}
      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          {successMsg}
        </div>
      )}

      {/* Form or Closed State */}
      {cannotSubmit ? (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/30">
          The deadline for this assignment has passed and late submissions are disabled.
        </div>
      ) : isGraded ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/30">
          This assignment has been evaluated. Resubmission is closed.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Project / Code Repository URL
            </label>
            <input
              type="url"
              value={submissionUrl}
              onChange={(e) => setSubmissionUrl(e.target.value)}
              placeholder="https://github.com/username/project or Google Drive link"
              className="w-full rounded-xl border border-zinc-200 bg-transparent px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-zinc-100"
            />
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              GitHub repository, Figma, Google Drive, or live deployed URL.
            </p>
          </div>

          {/* Direct File Upload via Cloudinary */}
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-900/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="assignment-file" className="font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer">
                Direct File Upload (ZIP, PDF, Code, Docs)
              </label>
              <span className="text-2xs text-zinc-400">Max 25MB</span>
            </div>
            <input
              id="assignment-file"
              type="file"
              accept=".zip,.pdf,.doc,.docx,.tar,.gz,.txt,.js,.ts,.py,.json,.csv"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                } else {
                  setSelectedFile(null);
                }
              }}
              className="block w-full text-xs text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-white hover:file:bg-zinc-800 dark:file:bg-zinc-100 dark:file:text-zinc-900 dark:hover:file:bg-zinc-200 cursor-pointer"
            />
            {selectedFile && (
              <p className="text-2xs text-emerald-600 dark:text-emerald-400 font-medium">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
              Files are securely stored and directly accessible to instructors for grading.
            </p>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmitting || (!submissionUrl.trim() && !selectedFile)}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isSubmitting
                ? selectedFile
                  ? "Uploading file & submitting..."
                  : "Submitting..."
                : submission
                ? "Update Submission"
                : "Submit Assignment"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
