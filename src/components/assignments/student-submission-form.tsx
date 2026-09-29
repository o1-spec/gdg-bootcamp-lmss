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
    <div className="rounded-2xl border border-[#E7E3DA] bg-white p-6 shadow-2xs sm:p-7 space-y-6">
      <div className="flex flex-col gap-1 pb-4 border-b border-[#E7E3DA]">
        <h3 className="text-base font-bold tracking-tight text-[#171717]">
          Your Submission & Evaluation
        </h3>
        <p className="text-xs text-[#737373]">
          Submit via project repository link, direct file upload (ZIP, PDF, document), or both.
        </p>
      </div>

      {/* Grade Released View */}
      {isReleased && submission?.score !== null && (
        <div className="rounded-2xl border border-[#34A853]/30 bg-[#34A853]/10 p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#34A853]">
              Evaluated Grade & Feedback
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#34A853] border border-[#34A853]/30 shadow-2xs">
              Score: {submission.score} / {maxScore} (
              {Math.round((submission.score / maxScore) * 100)}%)
            </span>
          </div>

          {submission.feedback && (
            <div className="pt-2 text-xs leading-relaxed text-[#171717] whitespace-pre-wrap">
              <strong className="block text-2xs uppercase tracking-wider font-semibold text-[#34A853] mb-1">
                Instructor Feedback:
              </strong>
              {submission.feedback}
            </div>
          )}

          {submission.gradedAt && (
            <p className="text-2xs text-[#737373] pt-1">
              Evaluated on {new Date(submission.gradedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Graded but Unreleased View */}
      {isGradedClosed && (
        <div className="rounded-2xl border border-[#E7E3DA] bg-[#F7F4ED] p-4 flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white border border-[#E7E3DA] text-[#737373]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#171717]">
              Grading completed — result pending cohort release
            </p>
            <p className="text-2xs text-[#737373]">
              Your instructor has reviewed your submission. Grades and feedback will appear here once released to the cohort.
            </p>
          </div>
        </div>
      )}

      {/* Current Submission Summary */}
      {submission && (
        <div className="rounded-2xl border border-[#E7E3DA] bg-[#F7F4ED] p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-semibold uppercase tracking-wider text-[#737373]">
              Recorded Submission
            </span>
            {submission.isLate ? (
              <span className="rounded-full bg-[#FBBC04]/15 px-2.5 py-0.5 text-2xs font-semibold text-[#996500] border border-[#FBBC04]/30">
                Submitted Late
              </span>
            ) : (
              <span className="rounded-full bg-[#34A853]/10 px-2.5 py-0.5 text-2xs font-semibold text-[#34A853] border border-[#34A853]/25">
                On-Time
              </span>
            )}
          </div>

          {/* Submitted Link */}
          {submission.submissionUrl && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1">
              <div className="flex items-center gap-1.5 truncate max-w-md">
                <span className="text-2xs text-[#737373] font-medium">Link:</span>
                <a
                  href={submission.submissionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-[#171717] hover:underline truncate"
                >
                  {submission.submissionUrl}
                </a>
              </div>
            </div>
          )}

          {/* Submitted File */}
          {submission.fileUrl && (
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E7E3DA]">
              <div className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-[#34A853]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                </svg>
                <span className="text-2xs text-[#737373] font-medium">Uploaded File:</span>
                <a
                  href={submission.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-[#34A853] hover:underline"
                >
                  Download / View Attached Document
                </a>
              </div>
            </div>
          )}

          <div className="pt-1 text-2xs text-[#737373]">
            Submitted: {new Date(submission.submittedAt).toLocaleString()}
          </div>
        </div>
      )}

      {/* Feedback / Alert messages */}
      {errorMsg && (
        <div className="rounded-xl border border-[#EA4335]/30 bg-[#EA4335]/10 p-3.5 text-xs font-medium text-[#EA4335]">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="rounded-xl border border-[#34A853]/30 bg-[#34A853]/10 p-3.5 text-xs font-medium text-[#34A853]">
          {successMsg}
        </div>
      )}

      {/* Form or Closed State */}
      {cannotSubmit ? (
        <div className="rounded-2xl border border-[#EA4335]/30 bg-[#EA4335]/10 p-4 text-xs font-medium text-[#EA4335]">
          The deadline for this assignment has passed and late submissions are disabled.
        </div>
      ) : isGraded ? (
        <div className="rounded-2xl border border-[#E7E3DA] bg-[#F7F4ED] p-4 text-xs text-[#737373]">
          This assignment has been evaluated. Resubmission is closed.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#171717]">
              Project / Code Repository URL
            </label>
            <input
              type="url"
              value={submissionUrl}
              onChange={(e) => setSubmissionUrl(e.target.value)}
              placeholder="https://github.com/username/project or Google Drive link"
              className="w-full rounded-xl border border-[#E7E3DA] bg-white px-3.5 py-2.5 text-xs text-[#171717] placeholder-[#737373]/50 focus:border-[#171717] focus:outline-none shadow-2xs"
            />
            <p className="text-[11px] text-[#737373]">
              GitHub repository, Figma, Google Drive, or live deployed URL.
            </p>
          </div>

          {/* Direct File Upload via Cloudinary */}
          <div className="rounded-2xl border border-dashed border-[#E7E3DA] bg-[#F7F4ED] p-5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="assignment-file" className="font-semibold text-[#171717] cursor-pointer">
                Direct File Upload (ZIP, PDF, Code, Docs)
              </label>
              <span className="text-2xs text-[#737373]">Max 25MB</span>
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
              className="block w-full text-xs text-[#737373] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#171717] file:text-white hover:file:bg-[#262626] cursor-pointer"
            />
            {selectedFile && (
              <p className="text-xs text-[#34A853] font-semibold flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#34A853]" />
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
            <p className="text-[11px] text-[#737373] leading-relaxed">
              Files are securely stored and directly accessible to instructors for grading.
            </p>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmitting || (!submissionUrl.trim() && !selectedFile)}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#171717] px-6 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-[#262626] disabled:opacity-50"
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
