"use client";

import React, { useState } from "react";
import Link from "next/link";
import { createSessionAction, updateSessionAction } from "@/lib/sessions/actions";
import { SessionWithDetails } from "@/lib/sessions/queries";

interface SessionFormProps {
  initialSession?: SessionWithDetails;
  cohorts: { id: string; name: string }[];
  tracks: { id: string; name: string }[];
  cancelHref: string;
}

export function SessionForm({
  initialSession,
  cohorts,
  tracks,
  cancelHref,
}: SessionFormProps) {
  const isEditing = !!initialSession;

  // Format initial values
  const defaultDate = initialSession
    ? new Date(initialSession.startsAt).toISOString().split("T")[0]
    : "";

  const formatTime = (date: Date) => {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const defaultStartTime = initialSession ? formatTime(initialSession.startsAt) : "18:00";
  const defaultEndTime = initialSession ? formatTime(initialSession.endsAt) : "20:00";

  const [title, setTitle] = useState(initialSession?.title || "");
  const [description, setDescription] = useState(initialSession?.description || "");
  const [cohortId, setCohortId] = useState(initialSession?.cohortId || cohorts[0]?.id || "");
  const [isShared, setIsShared] = useState(initialSession ? initialSession.trackId === null : false);
  const [trackId, setTrackId] = useState(initialSession?.trackId || tracks[0]?.id || "");
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState(defaultStartTime);
  const [endTime, setEndTime] = useState(defaultEndTime);
  const [meetingUrl, setMeetingUrl] = useState(initialSession?.meetingUrl || "");
  const [recordingUrl, setRecordingUrl] = useState(initialSession?.recordingUrl || "");
  const [notes, setNotes] = useState(initialSession?.notes || "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError("Session title is required.");
      return;
    }
    if (!cohortId) {
      setFormError("Please select a cohort.");
      return;
    }
    if (!isShared && !trackId) {
      setFormError("Please select an assigned track or mark the session as cohort-wide.");
      return;
    }
    if (!date) {
      setFormError("Please choose a date.");
      return;
    }
    if (endTime <= startTime) {
      setFormError("End time must be later than start time.");
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
      formData.append("date", date);
      formData.append("startTime", startTime);
      formData.append("endTime", endTime);
      formData.append("meetingUrl", meetingUrl);
      formData.append("recordingUrl", recordingUrl);
      formData.append("notes", notes);

      if (isEditing && initialSession) {
        await updateSessionAction(initialSession.id, formData);
      } else {
        await createSessionAction(formData);
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
        <div className="rounded-xl border border-[#EA4335]/30 bg-[#EA4335]/10 p-3.5 text-xs text-[#EA4335] font-medium">
          {formError}
        </div>
      )}

      <div className="rounded-2xl border border-[#E7E3DA] bg-white p-6 shadow-xs sm:p-8 space-y-5">
        <h3 className="text-sm font-semibold tracking-tight text-[#171717] pb-3 border-b border-[#E7E3DA]">
          Basic Information
        </h3>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#171717]">
            Session Title <span className="text-[#EA4335]">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Sliding Window & Two-Pointer Strategies"
            className="w-full rounded-xl border border-[#E7E3DA] bg-white px-3.5 py-2.5 text-xs text-[#171717] placeholder-[#737373] focus:border-[#171717] focus:outline-hidden"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#171717]">
            Description (Optional)
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief agenda, topics covered, and key outcomes..."
            className="w-full rounded-xl border border-[#E7E3DA] bg-white px-3.5 py-2.5 text-xs text-[#171717] placeholder-[#737373] focus:border-[#171717] focus:outline-hidden leading-relaxed"
          />
        </div>

        {/* Cohort & Track Assignment */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-1">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#171717]">
              Cohort <span className="text-[#EA4335]">*</span>
            </label>
            <select
              value={cohortId}
              onChange={(e) => setCohortId(e.target.value)}
              className="w-full rounded-xl border border-[#E7E3DA] bg-white px-3.5 py-2.5 text-xs text-[#171717] focus:border-[#171717] focus:outline-hidden"
            >
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#171717]">
              Assigned Track {!isShared && <span className="text-[#EA4335]">*</span>}
            </label>
            <select
              disabled={isShared}
              value={trackId}
              onChange={(e) => setTrackId(e.target.value)}
              className="w-full rounded-xl border border-[#E7E3DA] bg-white px-3.5 py-2.5 text-xs text-[#171717] focus:border-[#171717] focus:outline-hidden disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} Track
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Shared Session Checkbox */}
        <div className="flex items-center gap-2 pt-1">
          <input
            id="isShared"
            type="checkbox"
            checked={isShared}
            onChange={(e) => setIsShared(e.target.checked)}
            className="h-4 w-4 rounded border-[#E7E3DA] text-[#171717] focus:ring-[#171717]"
          />
          <label htmlFor="isShared" className="text-xs text-[#171717]">
            <strong className="font-semibold">Cohort-Wide Session:</strong> Open to all students and tracks in this cohort
          </label>
        </div>
      </div>

      {/* Date & Time Scheduling */}
      <div className="rounded-2xl border border-[#E7E3DA] bg-white p-6 shadow-xs sm:p-8 space-y-5">
        <h3 className="text-sm font-semibold tracking-tight text-[#171717] pb-3 border-b border-[#E7E3DA]">
          Schedule & Meeting Links
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#171717]">
              Date <span className="text-[#EA4335]">*</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-[#E7E3DA] bg-white px-3.5 py-2.5 text-xs text-[#171717] focus:border-[#171717] focus:outline-hidden"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#171717]">
              Start Time <span className="text-[#EA4335]">*</span>
            </label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-xl border border-[#E7E3DA] bg-white px-3.5 py-2.5 text-xs text-[#171717] focus:border-[#171717] focus:outline-hidden"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#171717]">
              End Time <span className="text-[#EA4335]">*</span>
            </label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-xl border border-[#E7E3DA] bg-white px-3.5 py-2.5 text-xs text-[#171717] focus:border-[#171717] focus:outline-hidden"
            />
          </div>
        </div>

        {/* Meeting URL */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-semibold text-[#171717]">
            Meeting URL (Google Meet / Zoom)
          </label>
          <input
            type="url"
            value={meetingUrl}
            onChange={(e) => setMeetingUrl(e.target.value)}
            placeholder="https://meet.google.com/abc-defg-hij"
            className="w-full rounded-xl border border-[#E7E3DA] bg-white px-3.5 py-2.5 text-xs text-[#171717] placeholder-[#737373] focus:border-[#171717] focus:outline-hidden"
          />
          <p className="text-2xs text-[#737373]">
            Students will see a &ldquo;Join Class&rdquo; button linking directly to this meeting.
          </p>
        </div>

        {/* Recording URL */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-semibold text-[#171717]">
            Recording URL {isEditing ? "(Post-Class Replay)" : "(Typically added after class)"}
          </label>
          <input
            type="url"
            value={recordingUrl}
            onChange={(e) => setRecordingUrl(e.target.value)}
            placeholder="https://drive.google.com/... or https://youtube.com/..."
            className="w-full rounded-xl border border-[#E7E3DA] bg-white px-3.5 py-2.5 text-xs text-[#171717] placeholder-[#737373] focus:border-[#171717] focus:outline-hidden"
          />
        </div>

        {/* Notes */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-semibold text-[#171717]">
            Preparation Notes & Resources (Optional)
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Pre-reading links, required starter repos, or setup instructions..."
            className="w-full rounded-xl border border-[#E7E3DA] bg-white px-3.5 py-2.5 text-xs text-[#171717] placeholder-[#737373] focus:border-[#171717] focus:outline-hidden leading-relaxed"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href={cancelHref}
          className="rounded-xl border border-[#E7E3DA] bg-white px-4 py-2.5 text-xs font-semibold text-[#171717] hover:bg-[#F7F4ED] transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-[#171717] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-black disabled:opacity-50"
        >
          {isSubmitting
            ? "Saving Session..."
            : isEditing
            ? "Update Session"
            : "Create Session"}
        </button>
      </div>
    </form>
  );
}
