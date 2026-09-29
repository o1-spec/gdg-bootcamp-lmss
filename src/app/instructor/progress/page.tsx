import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { requireInstructor } from "@/lib/auth/session";
import { getInstructorProgress } from "@/lib/progress/queries";
import { getTrackCompletion } from "@/lib/completion/queries";

export const metadata = {
  title: "Track Progress | Instructor Portal",
};

interface InstructorProgressPageProps {
  searchParams: Promise<{ trackId?: string }>;
}

export default async function InstructorProgressPage({
  searchParams,
}: InstructorProgressPageProps) {
  const instructor = await requireInstructor();
  const { trackId } = await searchParams;

  const data = await getInstructorProgress(instructor.id, trackId);

  if (data.assignedTracks.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Track Progress & Monitoring"
          description="Monitor student learning velocity, attendance patterns, and grading status"
        />
        <div className="rounded-2xl border border-dashed border-[#E7E3DA] bg-white p-10 text-center">
          <p className="text-sm font-semibold text-[#171717]">
            No Assigned Tracks
          </p>
          <p className="mt-1 text-xs text-[#737373]">
            You are not currently assigned as lead instructor to any bootcamp tracks.
          </p>
        </div>
      </div>
    );
  }

  const { trackProgress } = data;
  const completionMap = trackProgress && data.selectedTrackId
    ? new Map(
        (await getTrackCompletion(data.selectedTrackId)).map((c) => [
          c.userId,
          c.completion,
        ])
      )
    : new Map();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Track Progress & Roster Monitoring"
        description="Monitor student attendance, assignment completion rates, and released grade pacing"
        action={
          data.assignedTracks.length > 1 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#737373]">Track:</span>
              <div className="flex rounded-xl border border-[#E7E3DA] bg-white p-1">
                {data.assignedTracks.map((t) => (
                  <Link
                    key={t.id}
                    href={`/instructor/progress?trackId=${t.id}`}
                    className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                      t.id === data.selectedTrackId
                        ? "bg-[#171717] text-white"
                        : "text-[#737373] hover:text-[#171717]"
                    }`}
                  >
                    {t.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : undefined
        }
      />

      {trackProgress ? (
        <>
          {/* Summary Stat Cards */}
          <ScrollReveal mode="stagger" innerClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Active Students"
              value={trackProgress.totalActiveStudents}
              subtitle={`${trackProgress.trackName} Track`}
              badge={{ text: "Enrolled", variant: "info" }}
            />

            <StatCard
              title="Track Attendance"
              value={`${trackProgress.averageAttendanceRate}%`}
              subtitle={`${trackProgress.completedSessionsCount} completed sessions`}
              badge={{
                text: trackProgress.averageAttendanceRate >= 85 ? "Healthy" : "Low",
                variant: trackProgress.averageAttendanceRate >= 85 ? "success" : "warning",
              }}
            />

            <StatCard
              title="Submission Rate"
              value={`${trackProgress.assignmentSubmissionRate}%`}
              subtitle="Track assignments turned in"
              badge={{
                text: `${trackProgress.assignmentSubmissionRate}%`,
                variant: trackProgress.assignmentSubmissionRate >= 80 ? "success" : "neutral",
              }}
            />

            <StatCard
              title="Grading Backlog"
              value={trackProgress.gradingBacklog}
              subtitle={
                trackProgress.recentReleasedGradeAverage !== null
                  ? `Avg released: ${trackProgress.recentReleasedGradeAverage}%`
                  : "No released grades"
              }
              badge={{
                text: trackProgress.gradingBacklog === 0 ? "Clear" : `${trackProgress.gradingBacklog} Pending`,
                variant: trackProgress.gradingBacklog === 0 ? "success" : "warning",
              }}
            />
          </ScrollReveal>

          {/* Student Roster Progress Table */}
          <ScrollReveal>
            <div className="rounded-2xl border border-[#E7E3DA] bg-white shadow-2xs">
            <div className="flex flex-col gap-1 border-b border-[#E7E3DA] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-[#171717]">
                  Student Progress Overview ({trackProgress.trackName} Track)
                </h3>
                <p className="text-xs text-[#737373]">
                  Non-comparative progress monitoring across attendance and assignment submissions
                </p>
              </div>
              <span className="text-xs text-[#737373]">
                {trackProgress.students.length} students enrolled
              </span>
            </div>

            {trackProgress.students.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#737373]">
                No active students currently enrolled in this track.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#E7E3DA] bg-[#F7F4ED]/60 text-[11px] font-medium text-[#737373]">
                    <tr>
                      <th className="px-5 py-3.5 sm:px-6 font-semibold text-[#171717]">Student Name</th>
                      <th className="px-4 py-3.5 font-semibold text-[#171717]">Attendance</th>
                      <th className="px-4 py-3.5 font-semibold text-[#171717]">Submissions</th>
                      <th className="px-4 py-3.5 font-semibold text-[#171717]">Missing</th>
                      <th className="px-4 py-3.5 font-semibold text-[#171717]">Completion Status</th>
                      <th className="px-4 py-3.5 font-semibold text-[#171717]">Released Average</th>
                      <th className="px-5 py-3.5 sm:px-6 font-semibold text-[#171717]">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E3DA]">
                    {trackProgress.students.map((student) => {
                      const comp = completionMap.get(student.userId);
                      return (
                        <tr
                          key={student.userId}
                          className="hover:bg-[#F7F4ED]/40 transition-colors"
                        >
                          <td className="px-5 py-4 sm:px-6">
                            <div>
                              <span className="font-semibold text-[#171717]">
                                {student.name}
                              </span>
                              <p className="text-[11px] text-[#737373]">{student.email}</p>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`font-semibold ${
                                student.attendanceRate >= 80
                                  ? "text-[#34A853]"
                                  : "text-[#B45309]"
                              }`}
                            >
                              {student.attendanceRate}%
                            </span>
                          </td>

                          <td className="px-4 py-4 font-medium text-[#171717]">
                            {student.assignmentsSubmitted}
                          </td>

                          <td className="px-4 py-4">
                            {student.assignmentsMissing > 0 ? (
                              <span className="rounded-full bg-red-50 px-2 py-0.5 text-2xs font-semibold text-[#EA4335] border border-[#EA4335]/30">
                                {student.assignmentsMissing} missing
                              </span>
                            ) : (
                              <span className="text-[#737373]">0</span>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            {comp ? (
                              <Badge
                                variant={
                                  comp.status === "COMPLETED"
                                    ? "success"
                                    : comp.status === "IN_PROGRESS"
                                    ? "warning"
                                    : "danger"
                                }
                              >
                                {comp.status === "COMPLETED"
                                  ? "Completed"
                                  : comp.status === "IN_PROGRESS"
                                  ? "In Progress"
                                  : "Not Met"}
                              </Badge>
                            ) : (
                              <span className="text-[#737373] text-2xs">—</span>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            {student.releasedGradeAverage !== null ? (
                              <span className="font-semibold text-[#171717]">
                                {student.releasedGradeAverage}%
                              </span>
                            ) : (
                              <span className="text-[#737373]">None released</span>
                            )}
                          </td>

                          <td className="px-5 py-4 sm:px-6 text-[#737373]">
                            {student.lastActivity || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </ScrollReveal>
        </>
      ) : null}
    </div>
  );
}
