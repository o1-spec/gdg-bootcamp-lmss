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
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-zinc-100 dark:border-zinc-900">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Live Class Check-In
            </h3>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Window: {timeFormatter.format(startsAt)} – {timeFormatter.format(endsAt)}
          </p>
        </div>

        <Link
          href="/attendance"
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          View Attendance History →
        </Link>
      </div>

      <div className="mt-5">
        {checkedInStatus ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/40">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                  {successMessage || "Check-in Confirmed"}
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Status: <strong className="font-semibold uppercase">{checkedInStatus}</strong>
                </p>
              </div>
            </div>
            <span className="rounded-md bg-emerald-200/60 px-2.5 py-1 text-2xs font-semibold text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200">
              Recorded
            </span>
          </div>
        ) : isBefore ? (
          <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
            <svg className="h-5 w-5 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Check-in is not open yet. It will open promptly when class begins at{" "}
              <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">
                {timeFormatter.format(startsAt)}
              </strong>.
            </p>
          </div>
        ) : isAfter ? (
          <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
            <svg className="h-5 w-5 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Check-in window has closed. This session ended at{" "}
              <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">
                {timeFormatter.format(endsAt)}
              </strong>.
            </p>
          </div>
        ) : isLive ? (
          <form onSubmit={handleCheckIn} className="space-y-4">
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Enter the 6-character check-in code provided on-screen by your instructor during class.
            </p>

            {errorMessage && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                {errorMessage}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                maxLength={10}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. SLID26"
                className="w-full sm:max-w-xs rounded-xl border border-zinc-200 bg-transparent px-4 py-2.5 text-center font-mono text-base font-bold tracking-widest uppercase text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-zinc-100"
              />

              <button
                type="submit"
                disabled={isSubmitting || !code.trim()}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-6 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
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
