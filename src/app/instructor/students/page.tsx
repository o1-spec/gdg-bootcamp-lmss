import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable, Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { requireInstructor } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Student } from "@/types";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Track Students | Instructor Portal",
};

export default async function InstructorStudentsPage() {
  const user = await requireInstructor();

  const assignments = await db.trackInstructor.findMany({
    where: { userId: user.id },
    include: {
      track: {
        include: {
          cohort: true,
          enrollments: {
            where: { user: { role: Role.STUDENT } },
            include: { user: true },
          },
          sessions: true,
          assignments: {
            include: { submissions: true },
          },
        },
      },
    },
  });

  const students: Student[] = [];
  let totalAttendanceSum = 0;
  let totalStudentsCount = 0;
  const now = new Date();

  for (const asg of assignments) {
    const track = asg.track;
    const completedSessions = track.sessions.filter((s) => new Date(s.endsAt) <= now);
    const totalTrackAssignments = track.assignments.length;

    for (const enr of track.enrollments) {
      const studentUser = enr.user;

      let assignmentsCompleted = 0;
      let scoreSum = 0;
      let scoredCount = 0;

      for (const a of track.assignments) {
        const sub = a.submissions.find((s) => s.userId === studentUser.id);
        if (sub) {
          assignmentsCompleted++;
          if (sub.score !== null) {
            scoreSum += (sub.score / a.maxScore) * 100;
            scoredCount++;
          }
        }
      }

      let attendanceRate = 100;
      if (completedSessions.length > 0) {
        const studentAttendances = await db.attendance.count({
          where: {
            userId: studentUser.id,
            sessionId: { in: completedSessions.map((s) => s.id) },
            status: { in: ["PRESENT", "LATE"] },
          },
        });
        attendanceRate = Math.round((studentAttendances / completedSessions.length) * 100);
      }

      const avgScore = scoredCount > 0 ? Math.round(scoreSum / scoredCount) : 0;
      const status: Student["status"] =
        attendanceRate < 80 || (totalTrackAssignments > 0 && assignmentsCompleted / totalTrackAssignments < 0.5)
          ? "At Risk"
          : "Active";

      const initials = studentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      students.push({
        id: studentUser.id,
        name: studentUser.name,
        email: studentUser.email,
        initials,
        trackId: track.id,
        trackName: track.name,
        cohortName: track.cohort.name,
        attendanceRate,
        assignmentsCompleted,
        totalAssignments: totalTrackAssignments,
        averageScore: avgScore,
        status,
      });

      totalAttendanceSum += attendanceRate;
      totalStudentsCount++;
    }
  }

  const avgAttendance = totalStudentsCount > 0 ? Math.round(totalAttendanceSum / totalStudentsCount) : 100;
  const goodStandingCount = students.filter((s) => s.status === "Active").length;

  const columns: Column<Student>[] = [
    {
      header: "Student",
      accessorKey: "name",
      cell: (item) => (
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
            {item.name}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {item.email}
          </p>
        </div>
      ),
    },
    {
      header: "Track",
      accessorKey: "trackName",
      cell: (item) => (
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          {item.trackName}
        </span>
      ),
    },
    {
      header: "Attendance",
      cell: (item) => (
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          {item.attendanceRate}%
        </span>
      ),
    },
    {
      header: "Assignments",
      cell: (item) => (
        <span>
          {item.assignmentsCompleted} / {item.totalAssignments}
        </span>
      ),
    },
    {
      header: "Average Score",
      cell: (item) => (
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {item.averageScore}%
        </span>
      ),
    },
    {
      header: "Status",
      cell: (item) => (
        <Badge
          variant={
            item.status === "Active"
              ? "success"
              : item.status === "At Risk"
              ? "warning"
              : "neutral"
          }
        >
          {item.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assigned Students"
        description="Monitor student engagement, attendance compliance, and academic benchmarks for your assigned tracks"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Enrolled in Track"
          value={totalStudentsCount}
          subtitle="Active track students"
          badge={{ text: `${assignments.length} Track(s)`, variant: "info" }}
        />
        <StatCard
          title="Average Attendance"
          value={`${avgAttendance}%`}
          subtitle="Across assigned tracks"
          badge={{
            text: avgAttendance >= 80 ? "Good" : "At Risk",
            variant: avgAttendance >= 80 ? "success" : "warning",
          }}
        />
        <StatCard
          title="Students in Good Standing"
          value={goodStandingCount}
          subtitle={`${totalStudentsCount - goodStandingCount} student(s) currently at risk`}
          badge={{
            text: totalStudentsCount > 0 ? `${Math.round((goodStandingCount / totalStudentsCount) * 100)}%` : "100%",
            variant: "success",
          }}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Student Roster
        </h3>
        <DataTable
          columns={columns}
          data={students}
          keyExtractor={(item) => item.id}
        />
      </div>
    </div>
  );
}
