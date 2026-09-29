"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { claimCertificateAction } from "@/lib/certificates/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface ClaimCertificateButtonProps {
  trackId: string;
  existingCertificateCode?: string | null;
}

export function ClaimCertificateButton({
  trackId,
  existingCertificateCode,
}: ClaimCertificateButtonProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
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
      setConfirmOpen(false);
      router.push(`/certificate/${res.certificateCode}`);
    } else {
      setError(res.error || "Failed to claim certificate.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-[#171717] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-black transition-colors focus:outline-hidden focus:ring-2 focus:ring-[#171717]/20"
      >
        <svg className="h-4 w-4 text-[#FBBC04]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
        Claim Official Certificate
      </button>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setError(null);
        }}
        onConfirm={handleClaim}
        title="Claim your certificate?"
        description={
          <>
            This will generate your official{" "}
            <strong className="font-semibold text-[#171717]">
              Certificate of Completion
            </strong>{" "}
            for this track. Your certificate will reflect your current
            progress. Once issued, it is permanently attached to your record.
          </>
        }
        confirmLabel="Yes, claim my certificate"
        cancelLabel="Not yet"
        variant="primary"
        loading={loading}
        error={error}
        icon={
          <svg
            className="h-6 w-6 text-[#FBBC04]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5"
            />
          </svg>
        }
      />
    </>
  );
}
