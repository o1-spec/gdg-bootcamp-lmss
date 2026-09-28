"use client";

import React, { useState } from "react";
import type { AttendanceStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { SessionRosterStudent } from "@/lib/attendance/queries";
import { markAttendanceAction } from "@/lib/attendance/actions";

interface SessionRosterTableProps {
  sessionId: string;
  roster: SessionRosterStudent[];
}

export function SessionRosterTable({
  sessionId,
  roster: initialRoster,
}: SessionRosterTableProps) {
  const [roster, setRoster] = useState<SessionRosterStudent[]>(initialRoster);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleMark = async (studentId: string, status: AttendanceStatus) => {
    setUpdatingId(studentId);
    setErrorMsg(null);

    // Optimistic update
    setRoster((prev) =>
      prev.map((student) => {
        if (student.userId === studentId) {
          return {
            ...student,
            status,
            method: "MANUAL",
            markedAt: new Date(),
          };
        }
        return student;
      })
    );

    try {
      const res = await markAttendanceAction(sessionId, studentId, status);
      if (!res.success) {
        setErrorMsg(res.message || "Failed to update attendance.");
      }
    } catch {
      setErrorMsg("An unexpected network error occurred.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {errorMsg}
        </div>
      )}

      {/* Header with Export CTA */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Student Attendance Roster
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {roster.length} eligible {roster.length === 1 ? "student" : "students"} for this session
          </p>
        </div>

        <a
          href={`/api/attendance/export?sessionId=${sessionId}`}
          download
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800 shadow-2xs hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 self-start sm:self-auto"
        >
          <svg className="h-3.5 w-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
          <span>Export CSV</span>
        </a>
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-950">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-zinc-200 bg-zinc-50/75 dark:border-zinc-800 dark:bg-zinc-900/40">
            <tr>
              <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                Student
              </th>
              <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                Track
              </th>
              <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                Status
              </th>
              <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                Method & Timestamp
              </th>
              <th className="px-4 py-3 font-semibold text-right text-zinc-900 dark:text-zinc-100">
                Manual Override
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {roster.map((student) => {
              const isUpdating = updatingId === student.userId;

              return (
                <tr
                  key={student.userId}
                  className="transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30"
                >
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {student.name}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {student.email}
                    </p>
                  </td>

                  <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-400">
                    {student.trackName}
                  </td>

                  <td className="px-4 py-3.5">
                    {student.status === "PRESENT" ? (
                      <Badge variant="success">Present</Badge>
                    ) : student.status === "LATE" ? (
                      <Badge variant="warning">Late</Badge>
                    ) : student.status === "ABSENT" ? (
                      <Badge variant="danger">Absent</Badge>
                    ) : (
                      <Badge variant="neutral">Unmarked</Badge>
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-zinc-500 dark:text-zinc-400 text-[11px]">
                    {student.method ? (
                      <div>
                        <span>{student.method === "CHECK_IN" ? "Self Check-in" : "Manual Override"}</span>
                        {student.markedByName && ` by ${student.markedByName}`}
                        {student.markedAt && (
                          <p className="text-2xs text-zinc-400">
                            {new Date(student.markedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="italic">Not marked yet</span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleMark(student.userId, "PRESENT")}
                        className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                          student.status === "PRESENT"
                            ? "bg-emerald-600 text-white font-semibold"
                            : "border border-zinc-200 text-zinc-700 hover:bg-emerald-50 hover:text-emerald-700 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-emerald-950/40"
                        }`}
                      >
                        Present
                      </button>

                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleMark(student.userId, "LATE")}
                        className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                          student.status === "LATE"
                            ? "bg-amber-600 text-white font-semibold"
                            : "border border-zinc-200 text-zinc-700 hover:bg-amber-50 hover:text-amber-700 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-amber-950/40"
                        }`}
                      >
                        Late
                      </button>

                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleMark(student.userId, "ABSENT")}
                        className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                          student.status === "ABSENT"
                            ? "bg-rose-600 text-white font-semibold"
                            : "border border-zinc-200 text-zinc-700 hover:bg-rose-50 hover:text-rose-700 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-rose-950/40"
                        }`}
                      >
                        Absent
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="space-y-3 sm:hidden">
        {roster.map((student) => {
          const isUpdating = updatingId === student.userId;

          return (
            <div
              key={student.userId}
              className="rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {student.name}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {student.email} • {student.trackName}
                  </p>
                </div>

                {student.status === "PRESENT" ? (
                  <Badge variant="success">Present</Badge>
                ) : student.status === "LATE" ? (
                  <Badge variant="warning">Late</Badge>
                ) : student.status === "ABSENT" ? (
                  <Badge variant="danger">Absent</Badge>
                ) : (
                  <Badge variant="neutral">Unmarked</Badge>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-zinc-100 pt-2 dark:border-zinc-900">
                <span className="text-[11px] text-zinc-400">Manual Mark:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleMark(student.userId, "PRESENT")}
                    className={`rounded px-2 py-1 text-[11px] font-medium ${
                      student.status === "PRESENT"
                        ? "bg-emerald-600 text-white font-semibold"
                        : "border border-zinc-200 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    Present
                  </button>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleMark(student.userId, "LATE")}
                    className={`rounded px-2 py-1 text-[11px] font-medium ${
                      student.status === "LATE"
                        ? "bg-amber-600 text-white font-semibold"
                        : "border border-zinc-200 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    Late
                  </button>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleMark(student.userId, "ABSENT")}
                    className={`rounded px-2 py-1 text-[11px] font-medium ${
                      student.status === "ABSENT"
                        ? "bg-rose-600 text-white font-semibold"
                        : "border border-zinc-200 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    Absent
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
