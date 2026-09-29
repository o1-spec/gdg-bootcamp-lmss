import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getStudentCompletion } from "@/lib/completion/queries";
import Link from "next/link";
import { TrackFilterSelect } from "./track-filter";

export const metadata = {
  title: "Completion Overview | Admin Console",
};

interface AdminCompletionPageProps {
  searchParams: Promise<{ status?: string; trackId?: string }>;
}

export default async function AdminCompletionPage({
  searchParams,
}: AdminCompletionPageProps) {
  await requireAdmin();
  const { status = "ALL", trackId = "ALL" } = await searchParams;

  const [tracks, enrollments, certificates] = await Promise.all([
    db.track.findMany({
      select: { id: true, name: true, cohort: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    db.enrollment.findMany({
      where: trackId !== "ALL" ? { trackId } : undefined,
      include: {
        user: { select: { id: true, name: true, email: true } },
        track: { select: { id: true, name: true, cohort: { select: { name: true } } } },
      },
      orderBy: { user: { name: "asc" } },
    }),
    db.certificate.findMany({
      select: { userId: true, trackId: true, certificateCode: true },
    }),
  ]);

  const certMap = new Map(
    certificates.map((c) => [`${c.userId}_${c.trackId}`, c.certificateCode])
  );

  // Compute completion for each enrollment
  const rows = await Promise.all(
    enrollments.map(async (enr) => {
      const completion = await getStudentCompletion(enr.userId, enr.trackId);
      const certCode = certMap.get(`${enr.userId}_${enr.trackId}`) ?? null;
      return {
        userId: enr.userId,
        name: enr.user.name,
        email: enr.user.email,
        trackId: enr.trackId,
        trackName: enr.track.name,
        cohortName: enr.track.cohort.name,
        completion,
        certificateCode: certCode,
      };
    })
  );

  const filtered = rows.filter((r) => {
    if (status === "ALL") return true;
    return r.completion.status === status;
  });

  const counts = {
    ALL: rows.length,
    COMPLETED: rows.filter((r) => r.completion.status === "COMPLETED").length,
    IN_PROGRESS: rows.filter((r) => r.completion.status === "IN_PROGRESS").length,
    NOT_COMPLETED: rows.filter((r) => r.completion.status === "NOT_COMPLETED").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Completion & Graduation Overview"
        description="Monitor cohort-wide graduation thresholds, assignment completion, and certificate issuance"
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E7E3DA] bg-white p-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2">
          {(["ALL", "COMPLETED", "IN_PROGRESS", "NOT_COMPLETED"] as const).map((tab) => (
            <Link
              key={tab}
              href={`/admin/completion?status=${tab}${trackId !== "ALL" ? `&trackId=${trackId}` : ""}`}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                status === tab
                  ? "bg-[#171717] text-white"
                  : "border border-[#E7E3DA] bg-white text-[#737373] hover:bg-[#F7F4ED] hover:text-[#171717]"
              }`}
            >
              {tab === "ALL"
                ? "All Students"
                : tab === "COMPLETED"
                ? "Completed"
                : tab === "IN_PROGRESS"
                ? "In Progress"
                : "Not Completed"}
              <span className="ml-1.5 text-[11px] opacity-80">({counts[tab]})</span>
            </Link>
          ))}
        </div>

        {/* Track Filter */}
        <TrackFilterSelect
          currentStatus={status}
          currentTrackId={trackId}
          tracks={tracks}
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E7E3DA] bg-white p-10 text-center text-xs text-[#737373]">
          No students match the selected completion filters.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E7E3DA] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E7E3DA] bg-[#F7F4ED]/60 text-[11px] font-medium text-[#737373]">
                <tr>
                  <th className="px-5 py-3 sm:px-6">Student</th>
                  <th className="px-4 py-3">Track / Cohort</th>
                  <th className="px-4 py-3">Attendance</th>
                  <th className="px-4 py-3">Assignments</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Criteria Status</th>
                  <th className="px-5 py-3 sm:px-6 text-right">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E3DA]">
                {filtered.map((row) => (
                  <tr
                    key={`${row.userId}_${row.trackId}`}
                    className="hover:bg-[#F7F4ED]/40 transition-colors"
                  >
                    <td className="px-5 py-3.5 sm:px-6">
                      <p className="font-semibold text-[#171717]">
                        {row.name}
                      </p>
                      <p className="text-[11px] text-[#737373]">
                        {row.email}
                      </p>
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-medium text-[#171717]">
                        {row.trackName}
                      </p>
                      <p className="text-[11px] text-[#737373]">
                        {row.cohortName}
                      </p>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-[#171717]">
                        {row.completion.attendanceRate !== null
                          ? `${row.completion.attendanceRate}%`
                          : "—"}
                      </span>
                      <p className="text-[11px] text-[#737373]">
                        {row.completion.presentCount} / {row.completion.eligibleSessions} sessions
                      </p>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-[#171717]">
                        {row.completion.assignmentsSubmitted} / {row.completion.assignmentsTotal}
                      </span>
                      <p className="text-[11px] text-[#737373]">
                        {row.completion.releasedGrades} graded
                      </p>
                    </td>

                    <td className="px-4 py-3.5">
                      <Badge
                        variant={
                          row.completion.status === "COMPLETED"
                            ? "success"
                            : row.completion.status === "IN_PROGRESS"
                            ? "warning"
                            : "danger"
                        }
                      >
                        {row.completion.status === "COMPLETED"
                          ? "Completed"
                          : row.completion.status === "IN_PROGRESS"
                          ? "In Progress"
                          : "Not Completed"}
                      </Badge>
                    </td>

                    <td className="px-4 py-3.5 max-w-xs">
                      {row.completion.unmetRequirements.length > 0 ? (
                        <p className="text-[11px] text-[#EA4335]">
                          {row.completion.unmetRequirements.join("; ")}
                        </p>
                      ) : (
                        <span className="text-[11px] text-[#34A853]">
                          All criteria satisfied
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 sm:px-6 text-right">
                      {row.certificateCode ? (
                        <Link
                          href={`/certificate/${row.certificateCode}`}
                          className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#34A853] hover:underline"
                        >
                          {row.certificateCode}
                        </Link>
                      ) : (
                        <span className="text-[11px] text-[#737373] italic">Not issued</span>
                      )}
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
