import React from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getCertificateByCode } from "@/lib/certificates/queries";
import Link from "next/link";
import { PrintButton } from "./print-button";

interface CertificatePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CertificatePageProps) {
  const { id } = await params;
  return {
    title: `Certificate ${id} | Bootcamp LMS`,
  };
}

export default async function CertificateDetailPage({ params }: CertificatePageProps) {
  const { id } = await params;
  const user = await requireUser();

  const cert = await getCertificateByCode(id);
  if (!cert) {
    notFound();
  }

  // Access check: only student recipient, or instructor, or admin
  if (user.role === "STUDENT" && cert.userId !== user.id) {
    notFound();
  }

  const issueDateFormatted = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(cert.issuedAt));

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Navigation & Print Actions (hidden on print) */}
      <div className="print:hidden flex items-center justify-between">
        <Link
          href="/progress"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#737373] hover:text-[#171717] transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Progress
        </Link>

        <div className="flex items-center gap-3">
          <PrintButton />
        </div>
      </div>

      {/* Certificate Frame */}
      <div className="relative rounded-3xl border border-[#E7E3DA] bg-white p-8 sm:p-14 text-center shadow-xs print:border print:shadow-none print:m-0 print:p-8 print:bg-white">
        {/* Inner subtle frame */}
        <div className="rounded-2xl border border-[#E7E3DA] bg-[#F7F4ED]/30 p-8 sm:p-12 print:border-none print:p-0 print:bg-white">
          {/* Restrained Accent Emblem */}
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-[#E7E3DA] text-[#171717] shadow-xs">
            <svg className="h-7 w-7 text-[#34A853]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
            </svg>
          </div>

          <p className="text-2xs font-semibold tracking-widest text-[#737373] uppercase">
            Bootcamp Certificate of Completion
          </p>

          <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-[#171717]">
            Certificate of Achievement
          </h1>

          <p className="mt-6 text-2xs text-[#737373] uppercase tracking-widest font-medium">
            This is proudly awarded to
          </p>

          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-[#171717] tracking-tight">
            {cert.user.name}
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-xs sm:text-sm text-[#737373] leading-relaxed">
            for successfully satisfying all attendance requirements, hands-on engineering assignments, and curriculum benchmarks in the
          </p>

          <div className="mt-4 inline-block rounded-xl bg-white px-6 py-2.5 border border-[#E7E3DA] shadow-xs">
            <p className="text-sm sm:text-base font-bold text-[#171717]">
              {cert.track.name} Track
            </p>
            <p className="text-2xs text-[#737373]">
              {cert.cohort.name}
            </p>
          </div>

          {/* Certificate Details Footer */}
          <div className="mt-12 pt-6 border-t border-[#E7E3DA] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#737373]">
            <div className="text-center sm:text-left">
              <p className="font-semibold text-[#171717]">Date of Issue</p>
              <p className="text-2xs text-[#737373]">{issueDateFormatted}</p>
            </div>

            <div className="text-center sm:text-right">
              <p className="font-semibold text-[#171717]">Certificate Identifier</p>
              <p className="font-mono text-xs text-[#171717] font-bold">{cert.certificateCode}</p>
              <p className="text-3xs text-[#737373]">Official tamper-evident credential ID</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
