import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
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
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            No Assigned Tracks
          </p>
          <p className="mt-1 text-xs text-zinc-500">
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
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Track:</span>
              <div className="flex rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
                {data.assignedTracks.map((t) => (
                  <Link
                    key={t.id}
                    href={`/instructor/progress?trackId=${t.id}`}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      t.id === data.selectedTrackId
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          </div>

          {/* Student Roster Progress Table */}
          <div className="rounded-xl border border-zinc-200 bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex flex-col gap-1 border-b border-zinc-100 p-5 dark:border-zinc-900 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Student Progress Overview ({trackProgress.trackName} Track)
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Non-comparative progress monitoring across attendance and assignment submissions
                </p>
              </div>
              <span className="text-xs text-zinc-400">
                {trackProgress.students.length} students enrolled
              </span>
            </div>

            {trackProgress.students.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                No active students currently enrolled in this track.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-100 bg-zinc-50 text-[11px] font-medium text-zinc-500 dark:border-zinc-900 dark:bg-zinc-900/50 dark:text-zinc-400">
                    <tr>
                      <th className="px-5 py-3 sm:px-6">Student Name</th>
                      <th className="px-4 py-3">Attendance</th>
                      <th className="px-4 py-3">Submissions</th>
                      <th className="px-4 py-3">Missing</th>
                      <th className="px-4 py-3">Completion Status</th>
                      <th className="px-4 py-3">Released Average</th>
                      <th className="px-5 py-3 sm:px-6">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                    {trackProgress.students.map((student) => {
                      const comp = completionMap.get(student.userId);
                      return (
                        <tr
                          key={student.userId}
                          className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors"
                        >
                          <td className="px-5 py-3.5 sm:px-6">
                            <div>
                              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {student.name}
                              </span>
                              <p className="text-[11px] text-zinc-400">{student.email}</p>
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <span
                              className={`font-medium ${
                                student.attendanceRate >= 80
                                  ? "text-emerald-700 dark:text-emerald-400"
                                  : "text-amber-700 dark:text-amber-400"
                              }`}
                            >
                              {student.attendanceRate}%
                            </span>
                          </td>

                          <td className="px-4 py-3.5 font-medium text-zinc-900 dark:text-zinc-100">
                            {student.assignmentsSubmitted}
                          </td>

                          <td className="px-4 py-3.5">
                            {student.assignmentsMissing > 0 ? (
                              <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-950/60 dark:text-red-300">
                                {student.assignmentsMissing} missing
                              </span>
                            ) : (
                              <span className="text-zinc-400">0</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5">
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
                              <span className="text-zinc-400 text-2xs">—</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5">
                            {student.releasedGradeAverage !== null ? (
                              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                {student.releasedGradeAverage}%
                              </span>
                            ) : (
                              <span className="text-zinc-400">None released</span>
                            )}
                          </td>

                          <td className="px-5 py-3.5 sm:px-6 text-zinc-500 dark:text-zinc-400">
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
        </>
      ) : null}
    </div>
  );
}
