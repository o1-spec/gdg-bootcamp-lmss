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
    <div className="space-y-6 max-w-4xl mx-auto py-4">
      {/* Navigation & Print Actions (hidden on print) */}
      <div className="print:hidden flex items-center justify-between">
        <Link
          href="/progress"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
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
      <div className="relative rounded-2xl border-8 border-double border-zinc-300 bg-white p-12 text-center shadow-lg dark:border-zinc-700 dark:bg-zinc-950 sm:p-16 print:border-4 print:shadow-none print:m-0 print:p-10">
        {/* Subtle Watermark Badge */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
          </svg>
        </div>

        <p className="text-xs font-semibold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
          Bootcamp Certificate of Completion
        </p>

        <h1 className="mt-4 font-serif text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Certificate of Achievement
        </h1>

        <p className="mt-6 text-xs text-zinc-500 uppercase tracking-widest">
          This is proudly presented to
        </p>

        <h2 className="mt-3 font-serif text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 underline decoration-zinc-300 decoration-1 underline-offset-8">
          {cert.user.name}
        </h2>

        <p className="mx-auto mt-6 max-w-xl text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          for successfully satisfying all academic requirements, rigorous hands-on projects, attendance compliance, and technical evaluations in the
        </p>

        <div className="mt-4 inline-block rounded-lg bg-zinc-50 px-6 py-2 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
          <p className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {cert.track.name} Track
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {cert.cohort.name}
          </p>
        </div>

        {/* Certificate Details Footer */}
        <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-zinc-500">
          <div className="text-left">
            <p className="font-semibold text-zinc-800 dark:text-zinc-200">Date of Issue</p>
            <p className="text-zinc-500">{issueDateFormatted}</p>
          </div>

          <div className="text-center sm:text-right">
            <p className="font-semibold text-zinc-800 dark:text-zinc-200">Certificate Identifier</p>
            <p className="font-mono text-zinc-900 dark:text-zinc-100 font-bold">{cert.certificateCode}</p>
            <p className="text-2xs text-zinc-400">Tamper-evident verification ID</p>
          </div>
        </div>
      </div>
    </div>
  );
}
