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
        <div className="rounded-xl border border-[#EA4335]/30 bg-red-50 p-3.5 text-xs text-[#EA4335]">
          {errorMsg}
        </div>
      )}

      {/* Header with Export CTA */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-[#171717]">
            Student Attendance Roster
          </h3>
          <p className="text-xs text-[#737373]">
            {roster.length} eligible {roster.length === 1 ? "student" : "students"} for this session
          </p>
        </div>

        <a
          href={`/api/attendance/export?sessionId=${sessionId}`}
          download
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#E7E3DA] bg-white px-3.5 text-xs font-medium text-[#171717] shadow-2xs hover:bg-[#F7F4ED] transition-colors self-start sm:self-auto"
        >
          <svg className="h-4 w-4 text-[#737373]" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
          <span>Export CSV</span>
        </a>
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-hidden rounded-2xl border border-[#E7E3DA] bg-white shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-[#E7E3DA] bg-[#F7F4ED]/60">
            <tr>
              <th className="px-5 py-3.5 font-semibold text-[#171717]">
                Student
              </th>
              <th className="px-5 py-3.5 font-semibold text-[#171717]">
                Track
              </th>
              <th className="px-5 py-3.5 font-semibold text-[#171717]">
                Status
              </th>
              <th className="px-5 py-3.5 font-semibold text-[#171717]">
                Method & Timestamp
              </th>
              <th className="px-5 py-3.5 font-semibold text-right text-[#171717]">
                Manual Override
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E3DA]">
            {roster.map((student) => {
              const isUpdating = updatingId === student.userId;

              return (
                <tr
                  key={student.userId}
                  className="transition-colors hover:bg-[#F7F4ED]/40"
                >
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[#171717]">
                      {student.name}
                    </p>
                    <p className="text-[11px] text-[#737373]">
                      {student.email}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-[#737373]">
                    {student.trackName}
                  </td>

                  <td className="px-5 py-4">
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

                  <td className="px-5 py-4 text-[#737373] text-[11px]">
                    {student.method ? (
                      <div>
                        <span className="font-medium text-[#171717]">{student.method === "CHECK_IN" ? "Self Check-in" : "Manual Override"}</span>
                        {student.markedByName && ` by ${student.markedByName}`}
                        {student.markedAt && (
                          <p className="text-2xs text-[#737373]">
                            {new Date(student.markedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="italic text-[#737373]/70">Not marked yet</span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleMark(student.userId, "PRESENT")}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                          student.status === "PRESENT"
                            ? "bg-[#34A853] text-white font-semibold shadow-xs"
                            : "border border-[#E7E3DA] bg-white text-[#171717] hover:border-[#34A853] hover:text-[#34A853]"
                        }`}
                      >
                        Present
                      </button>

                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleMark(student.userId, "LATE")}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                          student.status === "LATE"
                            ? "bg-[#FBBC04] text-[#171717] font-semibold shadow-xs"
                            : "border border-[#E7E3DA] bg-white text-[#171717] hover:border-[#FBBC04] hover:text-[#B45309]"
                        }`}
                      >
                        Late
                      </button>

                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleMark(student.userId, "ABSENT")}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                          student.status === "ABSENT"
                            ? "bg-[#EA4335] text-white font-semibold shadow-xs"
                            : "border border-[#E7E3DA] bg-white text-[#171717] hover:border-[#EA4335] hover:text-[#EA4335]"
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
              className="rounded-2xl border border-[#E7E3DA] bg-white p-4 shadow-2xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-[#171717]">
                    {student.name}
                  </p>
                  <p className="text-[11px] text-[#737373]">
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

              <div className="flex items-center justify-between border-t border-[#E7E3DA] pt-2.5">
                <span className="text-[11px] text-[#737373]">Manual Mark:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleMark(student.userId, "PRESENT")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      student.status === "PRESENT"
                        ? "bg-[#34A853] text-white font-semibold"
                        : "border border-[#E7E3DA] bg-white text-[#171717]"
                    }`}
                  >
                    Present
                  </button>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleMark(student.userId, "LATE")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      student.status === "LATE"
                        ? "bg-[#FBBC04] text-[#171717] font-semibold"
                        : "border border-[#E7E3DA] bg-white text-[#171717]"
                    }`}
                  >
                    Late
                  </button>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleMark(student.userId, "ABSENT")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      student.status === "ABSENT"
                        ? "bg-[#EA4335] text-white font-semibold"
                        : "border border-[#E7E3DA] bg-white text-[#171717]"
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
