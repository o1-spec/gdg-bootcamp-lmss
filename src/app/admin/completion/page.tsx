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
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2">
          {(["ALL", "COMPLETED", "IN_PROGRESS", "NOT_COMPLETED"] as const).map((tab) => (
            <Link
              key={tab}
              href={`/admin/completion?status=${tab}${trackId !== "ALL" ? `&trackId=${trackId}` : ""}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                status === tab
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {tab === "ALL"
                ? "All Students"
                : tab === "COMPLETED"
                ? "Completed"
                : tab === "IN_PROGRESS"
                ? "In Progress"
                : "Not Completed"}
              <span className="ml-1.5 text-2xs opacity-75">({counts[tab]})</span>
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
        <div className="rounded-xl border border-dashed border-zinc-200 p-10 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          No students match the selected completion filters.
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
                  Attendance
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                  Assignments
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                  Status
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                  Unmet Criteria
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100 text-right">
                  Certificate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filtered.map((row) => (
                <tr
                  key={`${row.userId}_${row.trackId}`}
                  className="transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30"
                >
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {row.name}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {row.email}
                    </p>
                  </td>

                  <td className="px-4 py-3.5">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {row.trackName}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {row.cohortName}
                    </p>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {row.completion.attendanceRate !== null
                        ? `${row.completion.attendanceRate}%`
                        : "—"}
                    </span>
                    <p className="text-2xs text-zinc-400">
                      {row.completion.presentCount} / {row.completion.eligibleSessions} sessions
                    </p>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {row.completion.assignmentsSubmitted} / {row.completion.assignmentsTotal}
                    </span>
                    <p className="text-2xs text-zinc-400">
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
                        : "Not Met"}
                    </Badge>
                  </td>

                  <td className="px-4 py-3.5 max-w-xs">
                    {row.completion.unmetRequirements.length > 0 ? (
                      <p className="text-2xs text-amber-700 dark:text-amber-300">
                        {row.completion.unmetRequirements.join("; ")}
                      </p>
                    ) : (
                      <span className="text-2xs text-emerald-600 dark:text-emerald-400">
                        All criteria satisfied
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    {row.certificateCode ? (
                      <Link
                        href={`/certificate/${row.certificateCode}`}
                        className="inline-flex items-center gap-1 font-mono text-2xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                      >
                        {row.certificateCode}
                      </Link>
                    ) : (
                      <span className="text-2xs text-zinc-400 italic">Not issued</span>
                    )}
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
