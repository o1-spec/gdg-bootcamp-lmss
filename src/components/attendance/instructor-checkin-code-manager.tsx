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
    <div className="rounded-2xl border border-[#E7E3DA] bg-white p-6 shadow-xs sm:p-7 space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#E7E3DA]">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-[#171717]">
            Session Check-in Code
          </h3>
          <p className="mt-0.5 text-xs text-[#737373]">
            Present this code to students during live class. Codes are only valid during the scheduled session window.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#34A853]/15 px-2.5 py-0.5 text-xs font-semibold text-[#34A853] border border-[#34A853]/30">
              <span className="h-1.5 w-1.5 rounded-full bg-[#34A853] animate-pulse" />
              Check-in Window Open
            </span>
          ) : (
            <span className="rounded-md bg-[#F7F4ED] border border-[#E7E3DA] px-2.5 py-0.5 text-xs font-medium text-[#737373]">
              Window Closed
            </span>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-[#EA4335]/30 bg-[#EA4335]/10 p-3 text-xs text-[#EA4335] font-medium">
          {errorMsg}
        </div>
      )}

      {/* Code Display & Primary Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-[#E7E3DA] bg-[#F7F4ED]/60 p-5">
        <div className="flex items-center gap-4">
          <div className="text-center sm:text-left">
            <span className="text-3xs font-semibold uppercase tracking-wider text-[#737373]">
              Active Code
            </span>
            <div className="mt-1 font-mono text-2xl sm:text-3xl font-bold tracking-widest text-[#171717]">
              {code ? (isRevealed ? code : "••••••") : "NO CODE SET"}
            </div>
          </div>

          {code && (
            <button
              type="button"
              onClick={() => setIsRevealed(!isRevealed)}
              className="rounded-xl border border-[#E7E3DA] bg-white px-3 py-1.5 text-xs font-semibold text-[#171717] hover:bg-[#F7F4ED] transition-colors"
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
              className="inline-flex h-9 items-center justify-center rounded-xl border border-[#E7E3DA] bg-white px-3.5 text-xs font-semibold text-[#171717] hover:bg-[#F7F4ED] transition-colors shadow-2xs"
            >
              {copied ? "Copied!" : "Copy Code"}
            </button>
          )}

          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerate}
            className="inline-flex h-9 items-center justify-center rounded-xl bg-[#171717] px-4 text-xs font-semibold text-white hover:bg-black transition-colors disabled:opacity-50 shadow-xs"
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
            className="text-xs text-[#737373] hover:text-[#171717] hover:underline px-1 transition-colors"
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
            className="rounded-xl border border-[#E7E3DA] bg-white px-3.5 py-2 text-xs font-mono uppercase text-[#171717] placeholder-[#737373] focus:border-[#171717] focus:outline-hidden"
          />
          <button
            type="submit"
            disabled={isGenerating || !customCode.trim()}
            className="rounded-xl bg-[#171717] px-4 py-2 text-xs font-semibold text-white hover:bg-black disabled:opacity-50 transition-colors shadow-xs"
          >
            Save Code
          </button>
        </form>
      )}
    </div>
  );
}
