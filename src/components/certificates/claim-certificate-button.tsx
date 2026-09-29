"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { claimCertificateAction } from "@/lib/certificates/actions";

interface ClaimCertificateButtonProps {
  trackId: string;
  existingCertificateCode?: string | null;
}

export function ClaimCertificateButton({
  trackId,
  existingCertificateCode,
}: ClaimCertificateButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (existingCertificateCode) {
    return (
      <button
        type="button"
        onClick={() => router.push(`/certificate/${existingCertificateCode}`)}
        className="inline-flex items-center gap-2 rounded-xl bg-[#171717] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-black transition-colors focus:outline-hidden focus:ring-2 focus:ring-[#171717]/20"
      >
        <svg className="h-4 w-4 text-[#34A853]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        View Certificate ({existingCertificateCode})
      </button>
    );
  }

  async function handleClaim() {
    setLoading(true);
    setError(null);

    const res = await claimCertificateAction(trackId);
    setLoading(false);

    if (res.success && res.certificateCode) {
      router.push(`/certificate/${res.certificateCode}`);
    } else {
      setError(res.error || "Failed to claim certificate.");
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={loading}
        onClick={handleClaim}
        className="inline-flex items-center gap-2 rounded-xl bg-[#171717] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-black disabled:opacity-50 transition-colors focus:outline-hidden focus:ring-2 focus:ring-[#171717]/20"
      >
        <svg className="h-4 w-4 text-[#FBBC04]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
        {loading ? "Generating Certificate..." : "Claim Official Certificate"}
      </button>
      {error && <p className="text-xs text-[#EA4335] font-medium">{error}</p>}
    </div>
  );
}
