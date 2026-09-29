"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { AttendanceStatus } from "@/types";
import { checkInAction } from "@/lib/attendance/actions";

interface StudentCheckinCardProps {
  sessionId: string;
  sessionTitle: string;
  startsAt: string | Date;
  endsAt: string | Date;
  existingAttendance?: {
    status: AttendanceStatus;
    markedAt: string | Date;
  } | null;
}

export function StudentCheckinCard({
  sessionId,
  startsAt: rawStartsAt,
  endsAt: rawEndsAt,
  existingAttendance,
}: StudentCheckinCardProps) {
  const startsAt = new Date(rawStartsAt);
  const endsAt = new Date(rawEndsAt);
  const now = new Date();

  const isLive = startsAt <= now && now <= endsAt;
  const isBefore = now < startsAt;
  const isAfter = now > endsAt;

  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkedInStatus, setCheckedInStatus] = useState<AttendanceStatus | null>(
    existingAttendance ? existingAttendance.status : null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    existingAttendance ? `You are checked in as ${existingAttendance.status}` : null
  );

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setErrorMessage("Please enter the check-in code.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("code", code.trim());

    const result = await checkInAction(sessionId, formData);
    setIsSubmitting(false);

    if (result.success) {
      setCheckedInStatus(result.status || "PRESENT");
      setSuccessMessage(result.message);
      setCode("");
    } else {
      setErrorMessage(result.message);
    }
  };

  return (
    <div className="rounded-2xl border border-[#E7E3DA] bg-white p-6 shadow-2xs sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#E7E3DA]">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#34A853] animate-pulse" />
            <h3 className="text-sm font-bold tracking-tight text-[#171717]">
              Live Class Check-In
            </h3>
          </div>
          <p className="mt-1 text-xs text-[#737373]">
            Window: {timeFormatter.format(startsAt)} – {timeFormatter.format(endsAt)}
          </p>
        </div>

        <Link
          href="/attendance"
          className="text-xs font-semibold text-[#171717] hover:underline"
        >
          View Attendance History →
        </Link>
      </div>

      <div className="mt-5">
        {checkedInStatus ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-[#34A853]/30 bg-[#34A853]/10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#34A853] text-white shadow-2xs">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-[#171717]">
                  {successMessage || "Check-in Confirmed"}
                </p>
                <p className="text-[11px] text-[#34A853] font-semibold">
                  Status: <span className="uppercase">{checkedInStatus}</span>
                </p>
              </div>
            </div>
            <span className="rounded-full bg-white px-3 py-0.5 text-2xs font-semibold text-[#34A853] border border-[#34A853]/30 shadow-2xs">
              Recorded
            </span>
          </div>
        ) : isBefore ? (
          <div className="flex items-center gap-3 rounded-2xl border border-[#E7E3DA] bg-[#F7F4ED] p-4">
            <svg className="h-5 w-5 text-[#737373] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <p className="text-xs text-[#737373]">
              Check-in is not open yet. It will open promptly when class begins at{" "}
              <strong className="text-[#171717] font-semibold">
                {timeFormatter.format(startsAt)}
              </strong>.
            </p>
          </div>
        ) : isAfter ? (
          <div className="flex items-center gap-3 rounded-2xl border border-[#E7E3DA] bg-[#F7F4ED] p-4">
            <svg className="h-5 w-5 text-[#737373] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <p className="text-xs text-[#737373]">
              Check-in window has closed. This session ended at{" "}
              <strong className="text-[#171717] font-semibold">
                {timeFormatter.format(endsAt)}
              </strong>.
            </p>
          </div>
        ) : isLive ? (
          <form onSubmit={handleCheckIn} className="space-y-4">
            <p className="text-xs text-[#737373]">
              Enter the 6-character check-in code provided on-screen by your instructor during class.
            </p>

            {errorMessage && (
              <div className="rounded-xl border border-[#EA4335]/30 bg-[#EA4335]/10 p-3 text-xs font-medium text-[#EA4335]">
                {errorMessage}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                maxLength={10}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. SLID26"
                className="w-full sm:max-w-xs rounded-xl border border-[#E7E3DA] bg-white px-4 py-2.5 text-center font-mono text-base font-bold tracking-widest uppercase text-[#171717] placeholder:text-[#737373]/50 focus:border-[#171717] focus:outline-none shadow-2xs"
              />

              <button
                type="submit"
                disabled={isSubmitting || !code.trim()}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#171717] px-6 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-[#262626] disabled:opacity-50"
              >
                {isSubmitting ? "Verifying..." : "Confirm Check In"}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}
