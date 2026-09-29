import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Student } from "@/types";
import { Role } from "@prisma/client";
import { AdminStudentsTable } from "@/components/admin/directory-tables";

export const metadata = {
  title: "Students | Admin Console",
};

export default async function AdminStudentsPage() {
  await requireAdmin();

  const now = new Date();

  const studentUsers = await db.user.findMany({
    where: { role: Role.STUDENT },
    include: {
      enrollments: {
        include: {
          track: {
            include: {
              cohort: true,
              sessions: true,
              assignments: {
                include: { submissions: true },
              },
            },
          },
        },
      },
      attendances: true,
    },
    orderBy: { name: "asc" },
  });

  const students: Student[] = [];
  let totalAttendanceSum = 0;

  for (const u of studentUsers) {
    const activeEnrollment = u.enrollments[0];
    const track = activeEnrollment?.track;
    const cohortName = track?.cohort?.name || "Unenrolled";
    const trackName = track?.name || "Unassigned";

    const completedSessions = track
      ? track.sessions.filter((s) => new Date(s.endsAt) <= now)
      : [];
    const totalAssignments = track ? track.assignments.length : 0;

    let assignmentsCompleted = 0;
    let scoreSum = 0;
    let scoredCount = 0;

    if (track) {
      for (const a of track.assignments) {
        const sub = a.submissions.find((s) => s.userId === u.id);
        if (sub) {
          assignmentsCompleted++;
          if (sub.score !== null) {
            scoreSum += (sub.score / a.maxScore) * 100;
            scoredCount++;
          }
        }
      }
    }

    let attendanceRate = 100;
    if (completedSessions.length > 0) {
      const presentCount = u.attendances.filter(
        (att) =>
          completedSessions.some((s) => s.id === att.sessionId) &&
          (att.status === "PRESENT" || att.status === "LATE")
      ).length;
      attendanceRate = Math.round((presentCount / completedSessions.length) * 100);
    }

    const averageScore = scoredCount > 0 ? Math.round(scoreSum / scoredCount) : 0;
    const status: Student["status"] =
      attendanceRate < 80 || (totalAssignments > 0 && assignmentsCompleted / totalAssignments < 0.5)
        ? "At Risk"
        : "Active";

    const initials = u.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    students.push({
      id: u.id,
      name: u.name,
      email: u.email,
      initials,
      trackId: track?.id || "",
      trackName,
      cohortName,
      attendanceRate,
      assignmentsCompleted,
      totalAssignments,
      averageScore,
      status,
    });

    totalAttendanceSum += attendanceRate;
  }

  const totalRegistered = students.length;
  const avgAttendance = totalRegistered > 0 ? Math.round(totalAttendanceSum / totalRegistered) : 100;
  const atRiskCount = students.filter((s) => s.status === "At Risk").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Directory"
        description="Comprehensive view of all enrolled students across Bootcamp tracks"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Registered"
          value={totalRegistered}
          subtitle="Enrolled student accounts"
          badge={{ text: "Active", variant: "success" }}
        />
        <StatCard
          title="Average Attendance"
          value={`${avgAttendance}%`}
          subtitle="Across all tracks"
          badge={{
            text: avgAttendance >= 80 ? "Healthy" : "Warning",
            variant: avgAttendance >= 80 ? "success" : "warning",
          }}
        />
        <StatCard
          title="Academic Warning"
          value={`${atRiskCount} Student${atRiskCount === 1 ? "" : "s"}`}
          subtitle="Attendance or submission risk"
          badge={{
            text: atRiskCount > 0 ? "Action Needed" : "All Good",
            variant: atRiskCount > 0 ? "warning" : "success",
          }}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold tracking-tight text-[#171717]">
          Student Records ({totalRegistered} registered)
        </h3>
        <AdminStudentsTable students={students} />
      </div>
    </div>
  );
}
