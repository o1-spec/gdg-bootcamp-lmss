import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import Link from "next/link";

export const metadata = {
  title: "Issued Certificates | Admin Console",
};

export default async function AdminCertificatesPage() {
  await requireAdmin();

  const certificates = await db.certificate.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      track: { select: { id: true, name: true } },
      cohort: { select: { id: true, name: true } },
    },
    orderBy: { issuedAt: "desc" },
  });

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Issued Certificates"
        description="Verify and inspect all tamper-evident graduation certificates issued to students"
      />

      {certificates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 p-10 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          No certificates have been issued yet. Students who meet all completion criteria can claim their certificate.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-950">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 bg-zinc-50/75 dark:border-zinc-800 dark:bg-zinc-900/40">
              <tr>
                <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                  Student
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                  Track / Cohort
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                  Certificate ID
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                  Issued Date
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {certificates.map((cert) => (
                <tr
                  key={cert.id}
                  className="transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30"
                >
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {cert.user.name}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {cert.user.email}
                    </p>
                  </td>

                  <td className="px-4 py-3.5">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {cert.track.name}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {cert.cohort.name}
                    </p>
                  </td>

                  <td className="px-4 py-3.5 font-mono text-zinc-900 dark:text-zinc-100 font-semibold">
                    {cert.certificateCode}
                  </td>

                  <td className="px-4 py-3.5 text-zinc-500 dark:text-zinc-400">
                    {dateFormatter.format(new Date(cert.issuedAt))}
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href={`/certificate/${cert.certificateCode}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                    >
                      View / Print
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
