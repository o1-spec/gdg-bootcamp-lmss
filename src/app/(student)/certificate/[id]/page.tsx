import React from "react";
import Image from "next/image";
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
          {/* Official GDGOC LASU Logo */}
          <div className="mx-auto mb-6 flex justify-center">
            <Image
              src="/GDGOC-LASU-logo.webp"
              alt="Google Developer Groups on Campus - Lagos State University"
              width={260}
              height={50}
              className="h-10 sm:h-12 w-auto object-contain"
              priority
            />
          </div>

          <p className="text-2xs font-semibold tracking-widest text-[#737373] uppercase">
            Certificate of Completion
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
