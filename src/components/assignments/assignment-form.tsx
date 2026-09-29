"use client";

import React, { useState } from "react";
import Link from "next/link";
import { createAssignmentAction, updateAssignmentAction } from "@/lib/assignments/actions";
import { AssignmentWithDetails } from "@/lib/assignments/queries";

interface AssignmentFormProps {
  initialAssignment?: AssignmentWithDetails;
  cohorts: { id: string; name: string }[];
  tracks: { id: string; name: string }[];
  cancelHref: string;
}

export function AssignmentForm({
  initialAssignment,
  cohorts,
  tracks,
  cancelHref,
}: AssignmentFormProps) {
  const isEditing = !!initialAssignment;
  const hasSubmissions = (initialAssignment?.submissionCount || 0) > 0;

  const defaultDate = initialAssignment
    ? new Date(initialAssignment.dueAt).toISOString().split("T")[0]
    : "";

  const formatTime = (date: Date) => {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const defaultTime = initialAssignment ? formatTime(initialAssignment.dueAt) : "23:59";

  const [title, setTitle] = useState(initialAssignment?.title || "");
  const [description, setDescription] = useState(initialAssignment?.description || "");
  const [cohortId, setCohortId] = useState(
    initialAssignment?.cohortId || cohorts[0]?.id || ""
  );
  const [isShared, setIsShared] = useState(
    initialAssignment ? initialAssignment.trackId === null : false
  );
  const [trackId, setTrackId] = useState(
    initialAssignment?.trackId || tracks[0]?.id || ""
  );
  const [dueDate, setDueDate] = useState(defaultDate);
  const [dueTime, setDueTime] = useState(defaultTime);
  const [maxScore, setMaxScore] = useState(
    initialAssignment?.maxScore !== undefined ? String(initialAssignment.maxScore) : "100"
  );
  const [allowLateSubmission, setAllowLateSubmission] = useState(
    initialAssignment ? initialAssignment.allowLateSubmission : true
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError("Assignment title is required.");
      return;
    }
    if (!description.trim()) {
      setFormError("Assignment description is required.");
      return;
    }
    if (!cohortId) {
      setFormError("Please select a cohort.");
      return;
    }
    if (!isShared && !trackId) {
      setFormError("Please select an assigned track or mark as cohort-wide shared.");
      return;
    }
    if (!dueDate) {
      setFormError("Please select a due date.");
      return;
    }
    const scoreVal = parseInt(maxScore, 10);
    if (isNaN(scoreVal) || scoreVal <= 0) {
      setFormError("Max score must be greater than zero.");
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("cohortId", cohortId);
      formData.append("isShared", isShared ? "true" : "false");
      if (!isShared && trackId) {
        formData.append("trackId", trackId);
      }
      formData.append("dueDate", dueDate);
      formData.append("dueTime", dueTime);
      formData.append("maxScore", maxScore);
      formData.append("allowLateSubmission", allowLateSubmission ? "true" : "false");

      if (isEditing && initialAssignment) {
        await updateAssignmentAction(initialAssignment.id, formData);
      } else {
        await createAssignmentAction(formData);
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <div className="rounded-xl border border-[#EA4335]/30 bg-red-50 p-4 text-xs text-[#EA4335]">
          {formError}
        </div>
      )}

      {/* Section 1: Basic Information */}
      <div className="rounded-2xl border border-[#E7E3DA] bg-white p-6 sm:p-7 shadow-2xs space-y-4">
        <h3 className="text-sm font-semibold tracking-tight text-[#171717] pb-3 border-b border-[#E7E3DA]">
          Basic Information
        </h3>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[#171717]">
            Title <span className="text-[#EA4335]">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Sliding Window Exercise: Max Subarray & Min Window"
            className="w-full h-12 rounded-xl border border-[#E7E3DA] bg-white px-3.5 text-xs text-[#171717] placeholder-[#737373]/60 focus:border-[#171717] focus:outline-hidden"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[#171717]">
            Description & Problem Requirements <span className="text-[#EA4335]">*</span>
          </label>
          <textarea
            rows={5}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide problem prompts, test constraints, and submission expectations..."
            className="w-full rounded-xl border border-[#E7E3DA] bg-white p-3 text-xs text-[#171717] placeholder-[#737373]/60 focus:border-[#171717] focus:outline-hidden"
          />
        </div>

        {/* Cohort & Track Assignment */}
        {hasSubmissions && (
          <div className="rounded-xl border border-[#FBBC04]/40 bg-amber-50/60 p-3.5 text-xs text-[#B45309]">
            Track and cohort are locked because students have already submitted work for this assignment.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-1">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#171717]">
              Cohort <span className="text-[#EA4335]">*</span>
            </label>
            <select
              disabled={hasSubmissions}
              value={cohortId}
              onChange={(e) => setCohortId(e.target.value)}
              className="w-full h-12 rounded-xl border border-[#E7E3DA] bg-white px-3 text-xs text-[#171717] focus:border-[#171717] focus:outline-hidden disabled:opacity-50"
            >
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#171717]">
              Assigned Track {!isShared && <span className="text-[#EA4335]">*</span>}
            </label>
            <select
              disabled={hasSubmissions || isShared}
              value={trackId}
              onChange={(e) => setTrackId(e.target.value)}
              className="w-full h-12 rounded-xl border border-[#E7E3DA] bg-white px-3 text-xs text-[#171717] focus:border-[#171717] focus:outline-hidden disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} Track
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Shared Assignment Checkbox */}
        <div className="flex items-center gap-2 pt-1">
          <input
            id="isShared"
            type="checkbox"
            disabled={hasSubmissions}
            checked={isShared}
            onChange={(e) => setIsShared(e.target.checked)}
            className="h-4 w-4 rounded border-[#E7E3DA] text-[#171717] focus:ring-[#171717] disabled:opacity-50"
          />
          <label htmlFor="isShared" className="text-xs text-[#737373]">
            <strong className="text-[#171717]">Cohort-Wide Assignment:</strong> Assigned to all students across all tracks in this cohort
          </label>
        </div>
      </div>

      {/* Section 2: Submission Rules */}
      <div className="rounded-2xl border border-[#E7E3DA] bg-white p-6 sm:p-7 shadow-2xs space-y-4">
        <h3 className="text-sm font-semibold tracking-tight text-[#171717] pb-3 border-b border-[#E7E3DA]">
          Submission Rules
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#171717]">
              Due Date <span className="text-[#EA4335]">*</span>
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full h-12 rounded-xl border border-[#E7E3DA] bg-white px-3.5 text-xs text-[#171717] focus:border-[#171717] focus:outline-hidden"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#171717]">
              Due Time <span className="text-[#EA4335]">*</span>
            </label>
            <input
              type="time"
              required
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="w-full h-12 rounded-xl border border-[#E7E3DA] bg-white px-3.5 text-xs text-[#171717] focus:border-[#171717] focus:outline-hidden"
            />
          </div>
        </div>

        {/* Allow Late Submissions */}
        <div className="flex items-center gap-2 pt-2">
          <input
            id="allowLateSubmission"
            type="checkbox"
            checked={allowLateSubmission}
            onChange={(e) => setAllowLateSubmission(e.target.checked)}
            className="h-4 w-4 rounded border-[#E7E3DA] text-[#171717] focus:ring-[#171717]"
          />
          <label htmlFor="allowLateSubmission" className="text-xs text-[#737373]">
            Allow late submissions (students can submit after the deadline, flagged as Late)
          </label>
        </div>
      </div>

      {/* Section 3: Grading */}
      <div className="rounded-2xl border border-[#E7E3DA] bg-white p-6 sm:p-7 shadow-2xs space-y-4">
        <h3 className="text-sm font-semibold tracking-tight text-[#171717] pb-3 border-b border-[#E7E3DA]">
          Grading
        </h3>

        <div className="space-y-1.5 max-w-xs">
          <label className="block text-xs font-medium text-[#171717]">
            Max Score (Points) <span className="text-[#EA4335]">*</span>
          </label>
          <input
            type="number"
            min="1"
            required
            value={maxScore}
            onChange={(e) => setMaxScore(e.target.value)}
            className="w-full h-12 rounded-xl border border-[#E7E3DA] bg-white px-3.5 text-xs text-[#171717] focus:border-[#171717] focus:outline-hidden"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href={cancelHref}
          className="rounded-xl border border-[#E7E3DA] bg-white px-4 py-2 text-xs font-medium text-[#171717] hover:bg-[#F7F4ED] transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-[#171717] px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-black disabled:opacity-50 shadow-2xs"
        >
          {isSubmitting
            ? "Saving Assignment..."
            : isEditing
            ? "Update Assignment"
            : "Create Assignment"}
        </button>
      </div>
    </form>
  );
}
