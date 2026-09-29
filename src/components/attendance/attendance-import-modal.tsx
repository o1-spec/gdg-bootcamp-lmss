"use client";

import React, { useState } from "react";
import {
  parseAttendanceImportAction,
  applyAttendanceImportAction,
  discardImportAction,
} from "@/lib/attendance/import-actions";

interface AttendanceImportModalProps {
  sessionId: string;
  sessionTitle: string;
}

export function AttendanceImportModal({
  sessionId,
  sessionTitle,
}: AttendanceImportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importId, setImportId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    matched: { email: string; name: string; userId: string; lmsStatus: string | null }[];
    unmatched: { email: string; name: string }[];
    totalRows: number;
  } | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [appliedCount, setAppliedCount] = useState<number | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) setCsvText(content);
    };
    reader.readAsText(file);
  }

  async function handlePreview(e: React.FormEvent) {
    e.preventDefault();
    if (!csvText.trim()) return;

    setLoading(true);
    setError(null);

    const res = await parseAttendanceImportAction(sessionId, csvText);
    setLoading(false);

    if (res.success && res.importId && res.preview) {
      setImportId(res.importId);
      setPreview(res.preview);
      // Pre-select all matched users
      setSelectedUserIds(new Set(res.preview.matched.map((m) => m.userId)));
    } else {
      setError(res.error || "Failed to parse CSV file.");
    }
  }

  async function handleApply() {
    if (!importId) return;

    setLoading(true);
    setError(null);

    const res = await applyAttendanceImportAction(
      importId,
      Array.from(selectedUserIds)
    );
    setLoading(false);

    if (res.success) {
      setAppliedCount(res.updated);
      setTimeout(() => {
        setIsOpen(false);
        setPreview(null);
        setImportId(null);
        setAppliedCount(null);
        setCsvText("");
      }, 1500);
    } else {
      setError(res.error || "Failed to apply attendance import.");
    }
  }

  async function handleDiscard() {
    if (importId) {
      await discardImportAction(importId);
    }
    setPreview(null);
    setImportId(null);
    setError(null);
  }

  function toggleUser(userId: string) {
    const next = new Set(selectedUserIds);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    setSelectedUserIds(next);
  }

  function toggleAll() {
    if (!preview) return;
    if (selectedUserIds.size === preview.matched.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(preview.matched.map((m) => m.userId)));
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#E7E3DA] bg-white px-3.5 text-xs font-medium text-[#171717] hover:bg-[#F7F4ED] transition-colors"
      >
        <svg className="h-4 w-4 text-[#737373]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
        </svg>
        <span>Import Meet/Zoom CSV</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#E7E3DA] bg-white p-6 sm:p-7 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#171717]">
                  Import Meeting Attendance CSV
                </h3>
                <p className="mt-1 text-xs text-[#737373]">
                  {sessionTitle} • Match participant emails against enrolled students
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (importId) discardImportAction(importId);
                }}
                className="text-[#737373] hover:text-[#171717] p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-[#EA4335]/30 bg-red-50 p-3.5 text-xs text-[#EA4335]">
                {error}
              </div>
            )}

            {appliedCount !== null && (
              <div className="mt-4 rounded-xl border border-[#34A853]/30 bg-green-50 p-3.5 text-xs text-[#34A853] font-medium">
                Successfully imported and marked Present for {appliedCount} student{appliedCount === 1 ? "" : "s"}!
              </div>
            )}

            {!preview ? (
              <form onSubmit={handlePreview} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#171717] mb-1.5">
                    Upload CSV File
                  </label>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-[#737373] file:mr-4 file:py-2 file:px-3.5 file:rounded-xl file:border file:border-[#E7E3DA] file:text-xs file:font-medium file:bg-[#F7F4ED] file:text-[#171717] hover:file:bg-[#E7E3DA]/50 transition-colors"
                  />
                  <p className="mt-1.5 text-2xs text-[#737373]">
                    Supports Google Meet attendance reports, Zoom meeting logs, and standard CSVs with an &ldquo;Email&rdquo; column.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="csv-raw-text"
                    className="block text-xs font-medium text-[#171717] mb-1.5"
                  >
                    Or Paste CSV Content
                  </label>
                  <textarea
                    id="csv-raw-text"
                    rows={6}
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    placeholder="Name,Email,Join Time,Leave Time&#10;Alice Smith,alice@example.com,10:00,11:30"
                    className="w-full font-mono rounded-xl border border-[#E7E3DA] bg-white p-3 text-xs text-[#171717] placeholder-[#737373]/60 focus:border-[#171717] focus:outline-hidden"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl border border-[#E7E3DA] bg-white px-4 py-2 text-xs font-medium text-[#171717] hover:bg-[#F7F4ED] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !csvText.trim()}
                    className="rounded-xl bg-[#171717] px-4 py-2 text-xs font-semibold text-white hover:bg-black transition-colors disabled:opacity-50"
                  >
                    {loading ? "Parsing CSV..." : "Preview Matches"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-5 space-y-4">
                {/* Match Stats */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-[#F7F4ED]/60 p-3 border border-[#E7E3DA]">
                    <p className="text-xs text-[#737373]">CSV Total</p>
                    <p className="text-base font-bold text-[#171717] mt-0.5">
                      {preview.totalRows}
                    </p>
                  </div>
                  <div className="rounded-xl bg-green-50/70 p-3 border border-[#34A853]/30">
                    <p className="text-xs text-[#34A853] font-medium">Students Matched</p>
                    <p className="text-base font-bold text-[#34A853] mt-0.5">
                      {preview.matched.length}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#F7F4ED]/60 p-3 border border-[#E7E3DA]">
                    <p className="text-xs text-[#737373]">Unmatched / Guests</p>
                    <p className="text-base font-bold text-[#737373] mt-0.5">
                      {preview.unmatched.length}
                    </p>
                  </div>
                </div>

                {/* Matched Students Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-[#171717]">
                      Select Students to Mark Present ({selectedUserIds.size} selected)
                    </h4>
                    <button
                      type="button"
                      onClick={toggleAll}
                      className="text-2xs font-medium text-[#737373] hover:text-[#171717]"
                    >
                      {selectedUserIds.size === preview.matched.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>

                  {preview.matched.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-[#E7E3DA] p-5 text-center text-xs text-[#737373]">
                      No emails matched enrolled students in this track/cohort.
                    </p>
                  ) : (
                    <div className="max-h-52 overflow-y-auto rounded-xl border border-[#E7E3DA]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#F7F4ED]/75 text-2xs text-[#737373]">
                          <tr>
                            <th className="px-3.5 py-2.5 w-8">
                              <input
                                type="checkbox"
                                checked={selectedUserIds.size === preview.matched.length && preview.matched.length > 0}
                                onChange={toggleAll}
                                className="rounded border-[#E7E3DA]"
                              />
                            </th>
                            <th className="px-3.5 py-2.5 font-semibold text-[#171717]">Student</th>
                            <th className="px-3.5 py-2.5 font-semibold text-[#171717]">Email</th>
                            <th className="px-3.5 py-2.5 font-semibold text-[#171717]">Current Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E7E3DA]">
                          {preview.matched.map((m) => (
                            <tr
                              key={m.userId}
                              onClick={() => toggleUser(m.userId)}
                              className="cursor-pointer hover:bg-[#F7F4ED]/40 transition-colors"
                            >
                              <td className="px-3.5 py-2.5" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={selectedUserIds.has(m.userId)}
                                  onChange={() => toggleUser(m.userId)}
                                  className="rounded border-[#E7E3DA]"
                                />
                              </td>
                              <td className="px-3.5 py-2.5 font-medium text-[#171717]">
                                {m.name}
                              </td>
                              <td className="px-3.5 py-2.5 text-[#737373]">{m.email}</td>
                              <td className="px-3.5 py-2.5">
                                <span className="inline-flex rounded-full px-2 py-0.5 text-2xs font-medium bg-[#F7F4ED] text-[#737373] border border-[#E7E3DA]">
                                  {m.lmsStatus || "UNMARKED"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Unmatched list if any */}
                {preview.unmatched.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <h5 className="text-2xs font-semibold text-[#737373] uppercase tracking-wider">
                      Unmatched Participants ({preview.unmatched.length})
                    </h5>
                    <p className="text-2xs text-[#737373]">
                      These participants from the meeting are not enrolled students in this track/cohort.
                    </p>
                    <div className="max-h-24 overflow-y-auto rounded-xl border border-[#E7E3DA] bg-[#F7F4ED]/40 p-2.5 text-2xs text-[#737373]">
                      {preview.unmatched.map((u, idx) => (
                        <div key={idx} className="flex justify-between py-0.5">
                          <span className="font-medium text-[#171717]">{u.name || "Unknown"}</span>
                          <span className="font-mono text-[#737373]">{u.email}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-[#E7E3DA]">
                  <button
                    type="button"
                    onClick={handleDiscard}
                    className="rounded-xl border border-[#E7E3DA] bg-white px-3.5 py-2 text-xs font-medium text-[#171717] hover:bg-[#F7F4ED] transition-colors"
                  >
                    Discard & Re-upload
                  </button>

                  <button
                    type="button"
                    disabled={loading || selectedUserIds.size === 0}
                    onClick={handleApply}
                    className="rounded-xl bg-[#34A853] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2d9247] disabled:opacity-50 transition-colors shadow-xs"
                  >
                    {loading
                      ? "Applying..."
                      : `Confirm & Apply (${selectedUserIds.size} Students)`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
