import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminOverview } from "@/lib/progress/queries";
import { db } from "@/lib/db";

export const metadata = {
  title: "Cross-Track Progress | Admin Console",
};

export default async function AdminProgressPage() {
  await requireAdmin();
  const [overview, enrollments, certificates, submissions] = await Promise.all([
    getAdminOverview(),
    db.enrollment.findMany({ select: { trackId: true, userId: true } }),
    db.certificate.findMany({ select: { trackId: true, userId: true } }),
    db.submission.findMany({
      where: { released: true, score: { not: null } },
      select: { score: true, assignment: { select: { maxScore: true, trackId: true } } },
    }),
  ]);

  // Overall calculations
  const totalStudents = overview.totalActiveStudents;
  const avgAttendance = overview.averageCohortAttendance;
  const avgSubmissionRate =
    overview.trackOverviews.length > 0
      ? Math.round(
          overview.trackOverviews.reduce((acc, t) => acc + t.submissionRate, 0) /
            overview.trackOverviews.length
        )
      : 0;

  // Average released score
  let totalScorePct = 0;
  let scoredCount = 0;
  for (const s of submissions) {
    if (s.score !== null && s.assignment.maxScore > 0) {
      totalScorePct += (s.score / s.assignment.maxScore) * 100;
      scoredCount++;
    }
  }
  const avgReleasedScore = scoredCount > 0 ? Math.round(totalScorePct / scoredCount) : 0;

  // Overall Completion Rate
  const totalEnrollments = enrollments.length;
  const overallCompletionRate =
    totalEnrollments > 0
      ? Math.round((certificates.length / totalEnrollments) * 100)
      : 0;

  // Track completion map
  const trackCertMap = new Map<string, number>();
  for (const c of certificates) {
    trackCertMap.set(c.trackId, (trackCertMap.get(c.trackId) || 0) + 1);
  }

  const trackEnrollmentMap = new Map<string, number>();
  for (const e of enrollments) {
    trackEnrollmentMap.set(e.trackId, (trackEnrollmentMap.get(e.trackId) || 0) + 1);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Cross-Track Progress & Operational Analytics"
        description={`Aggregated cohort progress for ${overview.cohortName} across all tracks`}
      />

      {/* Top Cohort Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Students"
          value={totalStudents}
          subtitle="Cohort enrollment"
          badge={{ text: "Active", variant: "info" }}
        />
        <StatCard
          title="Average Attendance"
          value={`${avgAttendance}%`}
          subtitle="All tracks combined"
          badge={{
            text: avgAttendance >= 85 ? "Optimal" : "Attention",
            variant: avgAttendance >= 85 ? "success" : "warning",
          }}
        />
        <StatCard
          title="Submission Rate"
          value={`${avgSubmissionRate}%`}
          subtitle="Pacing across assignments"
          badge={{ text: "Track Average", variant: "neutral" }}
        />
        <StatCard
          title="Avg Released Score"
          value={`${avgReleasedScore}%`}
          subtitle="Graded problem sets"
          badge={{ text: `${scoredCount} Graded`, variant: "success" }}
        />
        <StatCard
          title="Completion Rate"
          value={`${overallCompletionRate}%`}
          subtitle={`${certificates.length} Certified`}
          badge={{ text: "Cohort Final", variant: "neutral" }}
        />
      </div>

      {/* Track Breakdown Table */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[#171717]">
            Track Breakdown
          </h2>
          <p className="text-xs text-[#737373]">
            Track performance, attendance rates, submission velocity, and certification rates
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#E7E3DA] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E7E3DA] bg-[#F7F4ED]/60 text-[11px] font-medium text-[#737373]">
                <tr>
                  <th className="px-5 py-3 sm:px-6">Track</th>
                  <th className="px-4 py-3">Students</th>
                  <th className="px-4 py-3">Attendance</th>
                  <th className="px-4 py-3">Submission Rate</th>
                  <th className="px-4 py-3">Grading Backlog</th>
                  <th className="px-4 py-3">Completion Rate</th>
                  <th className="px-5 py-3 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E3DA]">
                {overview.trackOverviews.map((track) => {
                  const enrCount = trackEnrollmentMap.get(track.trackId) || track.activeStudents;
                  const certCount = trackCertMap.get(track.trackId) || 0;
                  const trackCompletionRate = enrCount > 0 ? Math.round((certCount / enrCount) * 100) : 0;

                  return (
                    <tr
                      key={track.trackId}
                      className="hover:bg-[#F7F4ED]/40 transition-colors"
                    >
                      <td className="px-5 py-3.5 sm:px-6 font-semibold text-[#171717]">
                        {track.trackName}
                      </td>
                      <td className="px-4 py-3.5 text-[#171717]">
                        {track.activeStudents}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`font-semibold ${
                            track.attendanceRate >= 85
                              ? "text-[#34A853]"
                              : track.attendanceRate >= 70
                              ? "text-[#FBBC04]"
                              : "text-[#EA4335]"
                          }`}
                        >
                          {track.attendanceRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-[#171717]">
                        {track.submissionRate}%
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={track.gradingBacklog === 0 ? "success" : "warning"}>
                          {track.gradingBacklog} pending
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-[#171717]">
                        {trackCompletionRate}% ({certCount})
                      </td>
                      <td className="px-5 py-3.5 sm:px-6 text-right">
                        <Link
                          href={`/admin/grading?trackId=${track.trackId}`}
                          className="inline-flex h-8 items-center rounded-lg border border-[#E7E3DA] bg-white px-3 text-xs font-medium text-[#171717] hover:bg-[#F7F4ED] transition-colors"
                        >
                          Grading Queue
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
