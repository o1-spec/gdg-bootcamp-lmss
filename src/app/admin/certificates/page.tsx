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
        <div className="rounded-2xl border border-dashed border-[#E7E3DA] bg-white p-10 text-center text-xs text-[#737373]">
          No certificates have been issued yet. Students who meet all completion criteria can claim their certificate.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E7E3DA] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E7E3DA] bg-[#F7F4ED]/60 text-[11px] font-medium text-[#737373]">
                <tr>
                  <th className="px-5 py-3 sm:px-6">Student</th>
                  <th className="px-4 py-3">Track / Cohort</th>
                  <th className="px-4 py-3">Certificate ID</th>
                  <th className="px-4 py-3">Issued Date</th>
                  <th className="px-5 py-3 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E3DA]">
                {certificates.map((cert) => (
                  <tr
                    key={cert.id}
                    className="hover:bg-[#F7F4ED]/40 transition-colors"
                  >
                    <td className="px-5 py-3.5 sm:px-6">
                      <p className="font-semibold text-[#171717]">
                        {cert.user.name}
                      </p>
                      <p className="text-[11px] text-[#737373]">
                        {cert.user.email}
                      </p>
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-medium text-[#171717]">
                        {cert.track.name}
                      </p>
                      <p className="text-[11px] text-[#737373]">
                        {cert.cohort.name}
                      </p>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[#171717] font-semibold">
                      {cert.certificateCode}
                    </td>

                    <td className="px-4 py-3.5 text-[#737373]">
                      {dateFormatter.format(new Date(cert.issuedAt))}
                    </td>

                    <td className="px-5 py-3.5 sm:px-6 text-right">
                      <Link
                        href={`/certificate/${cert.certificateCode}`}
                        className="inline-flex h-8 items-center justify-center rounded-lg bg-[#171717] px-3 text-xs font-medium text-white transition-colors hover:bg-[#171717]/90"
                      >
                        View / Print
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
