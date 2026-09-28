"use client";

import React, { useState } from "react";
import { generateCheckinCodeAction, setCheckinCodeAction } from "@/lib/attendance/actions";

interface CheckinCodeManagerProps {
  sessionId: string;
  initialCode: string | null;
  isLive: boolean;
  startsAt: string | Date;
  endsAt: string | Date;
}

export function InstructorCheckinCodeManager({
  sessionId,
  initialCode,
  isLive,
}: CheckinCodeManagerProps) {
  const [code, setCode] = useState<string | null>(initialCode);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customCode, setCustomCode] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const res = await generateCheckinCodeAction(sessionId);
      if (res.success && res.code) {
        setCode(res.code);
        setIsRevealed(true);
      } else {
        setErrorMsg(res.message || "Failed to generate code.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSetCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCode.trim()) return;

    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append("code", customCode.trim());
      const res = await setCheckinCodeAction(sessionId, formData);
      if (res.success && res.code) {
        setCode(res.code);
        setIsRevealed(true);
        setShowCustomInput(false);
        setCustomCode("");
      } else {
        setErrorMsg(res.message || "Failed to set custom code.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950 sm:p-7 space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-zinc-100 dark:border-zinc-900">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Session Check-in Code
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Show this code to students during class. Codes are only redeemable during the session window.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Window Open
            </span>
          ) : (
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              Window Closed
            </span>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {errorMsg}
        </div>
      )}

      {/* Code Display & Primary Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex items-center gap-4">
          <div className="text-center sm:text-left">
            <span className="text-2xs font-semibold uppercase tracking-wider text-zinc-400">
              Active Code
            </span>
            <div className="mt-1 font-mono text-2xl font-bold tracking-widest text-zinc-900 dark:text-zinc-100">
              {code ? (isRevealed ? code : "••••••") : "NO CODE SET"}
            </div>
          </div>

          {code && (
            <button
              type="button"
              onClick={() => setIsRevealed(!isRevealed)}
              className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              title={isRevealed ? "Hide code" : "Reveal code"}
            >
              {isRevealed ? "Hide" : "Reveal"}
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {code && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {copied ? "Copied!" : "Copy Code"}
            </button>
          )}

          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerate}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-900 px-3.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isGenerating
              ? "Generating..."
              : code
              ? "Regenerate Code"
              : "Generate Code"}
          </button>

          <button
            type="button"
            onClick={() => setShowCustomInput(!showCustomInput)}
            className="text-xs text-zinc-500 hover:underline dark:text-zinc-400 px-1"
          >
            {showCustomInput ? "Cancel custom" : "Custom code"}
          </button>
        </div>
      </div>

      {/* Optional Custom Code Form */}
      {showCustomInput && (
        <form onSubmit={handleSetCustom} className="flex items-center gap-2 pt-1">
          <input
            type="text"
            maxLength={10}
            value={customCode}
            onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
            placeholder="ENTER 4-10 CHARS (e.g. SLIDE26)"
            className="rounded-lg border border-zinc-200 bg-transparent px-3 py-1.5 text-xs font-mono uppercase text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-zinc-100"
          />
          <button
            type="submit"
            disabled={isGenerating || !customCode.trim()}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Save Code
          </button>
        </form>
      )}
    </div>
  );
}
