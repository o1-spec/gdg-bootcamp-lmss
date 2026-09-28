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
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
        </svg>
        Import Meet/Zoom CSV
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Import Meeting Attendance CSV
                </h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {sessionTitle} • Match participant emails against enrolled bootcamp students
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (importId) discardImportAction(importId);
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300">
                {error}
              </div>
            )}

            {appliedCount !== null && (
              <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                Successfully imported and marked Present for {appliedCount} student{appliedCount === 1 ? "" : "s"}!
              </div>
            )}

            {!preview ? (
              <form onSubmit={handlePreview} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Upload CSV File
                  </label>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-zinc-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 dark:file:bg-zinc-800 dark:file:text-zinc-300"
                  />
                  <p className="mt-1 text-2xs text-zinc-400">
                    Supports Google Meet attendance reports, Zoom meeting logs, and standard CSVs with an &ldquo;Email&rdquo; column.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="csv-raw-text"
                    className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                  >
                    Or Paste CSV Content
                  </label>
                  <textarea
                    id="csv-raw-text"
                    rows={6}
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    placeholder="Name,Email,Join Time,Leave Time&#10;Alice Smith,alice@example.com,10:00,11:30"
                    className="w-full font-mono rounded-lg border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !csvText.trim()}
                    className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                  >
                    {loading ? "Parsing CSV..." : "Preview Matches"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-4 space-y-4">
                {/* Match Stats */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-zinc-50 p-2.5 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <p className="text-xs text-zinc-500">CSV Total</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {preview.totalRows}
                    </p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-2.5 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">Enrolled Students Matched</p>
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                      {preview.matched.length}
                    </p>
                  </div>
                  <div className="rounded-lg bg-zinc-50 p-2.5 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <p className="text-xs text-zinc-500">Unmatched / Guests</p>
                    <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
                      {preview.unmatched.length}
                    </p>
                  </div>
                </div>

                {/* Matched Students Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      Select Students to Mark Present ({selectedUserIds.size} selected)
                    </h4>
                    <button
                      type="button"
                      onClick={toggleAll}
                      className="text-2xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                      {selectedUserIds.size === preview.matched.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>

                  {preview.matched.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-zinc-200 p-4 text-center text-xs text-zinc-500 dark:border-zinc-800">
                      No emails matched enrolled students in this track/cohort.
                    </p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-50 text-2xs text-zinc-500 dark:bg-zinc-900">
                          <tr>
                            <th className="px-3 py-2 w-8">
                              <input
                                type="checkbox"
                                checked={selectedUserIds.size === preview.matched.length && preview.matched.length > 0}
                                onChange={toggleAll}
                              />
                            </th>
                            <th className="px-3 py-2">Student</th>
                            <th className="px-3 py-2">Email</th>
                            <th className="px-3 py-2">Current LMS Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                          {preview.matched.map((m) => (
                            <tr
                              key={m.userId}
                              onClick={() => toggleUser(m.userId)}
                              className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                            >
                              <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={selectedUserIds.has(m.userId)}
                                  onChange={() => toggleUser(m.userId)}
                                />
                              </td>
                              <td className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-100">
                                {m.name}
                              </td>
                              <td className="px-3 py-2 text-zinc-500">{m.email}</td>
                              <td className="px-3 py-2">
                                <span className="inline-flex rounded-full px-2 py-0.5 text-2xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
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
                  <div className="space-y-1">
                    <h5 className="text-2xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Unmatched Participants ({preview.unmatched.length})
                    </h5>
                    <p className="text-2xs text-zinc-400">
                      These participants from the meeting are not enrolled students in this track/cohort.
                    </p>
                    <div className="max-h-24 overflow-y-auto rounded-lg border border-zinc-100 bg-zinc-50/50 p-2 text-2xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/30">
                      {preview.unmatched.map((u, idx) => (
                        <div key={idx} className="flex justify-between py-0.5">
                          <span>{u.name || "Unknown"}</span>
                          <span className="font-mono text-zinc-400">{u.email}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-900">
                  <button
                    type="button"
                    onClick={handleDiscard}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Discard & Re-upload
                  </button>

                  <button
                    type="button"
                    disabled={loading || selectedUserIds.size === 0}
                    onClick={handleApply}
                    className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-700 dark:hover:bg-emerald-600"
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
