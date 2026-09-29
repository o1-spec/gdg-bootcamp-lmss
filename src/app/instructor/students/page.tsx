import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable, Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
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
          <p className="font-semibold text-[#171717]">
            {item.name}
          </p>
          <p className="text-2xs text-[#737373]">
            {item.email}
          </p>
        </div>
      ),
    },
    {
      header: "Track",
      accessorKey: "trackName",
      cell: (item) => (
        <span className="rounded-md bg-[#F7F4ED] border border-[#E7E3DA] px-2 py-0.5 text-2xs font-medium text-[#171717]">
          {item.trackName}
        </span>
      ),
    },
    {
      header: "Attendance",
      cell: (item) => (
        <span className="font-semibold text-[#171717]">
          {item.attendanceRate}%
        </span>
      ),
    },
    {
      header: "Assignments",
      cell: (item) => (
        <span className="text-xs text-[#171717]">
          {item.assignmentsCompleted} / {item.totalAssignments}
        </span>
      ),
    },
    {
      header: "Average Score",
      cell: (item) => (
        <span className="font-bold text-[#171717]">
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
        title="Students"
        description="Monitor student engagement, attendance compliance, and academic benchmarks for your assigned tracks"
      />

      <ScrollReveal mode="stagger" innerClassName="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
            text: avgAttendance >= 75 ? "Good" : "At Risk",
            variant: avgAttendance >= 75 ? "success" : "warning",
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
      </ScrollReveal>

      <ScrollReveal>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold tracking-tight text-[#171717]">
            Student Roster ({students.length})
          </h3>

        {/* Desktop Table View */}
        <div className="hidden sm:block">
          <DataTable
            columns={columns}
            data={students}
            keyExtractor={(item) => item.id}
          />
        </div>

        {/* Mobile Stacked Card View */}
        <div className="sm:hidden space-y-3">
          {students.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E7E3DA] bg-white p-8 text-center text-xs text-[#737373]">
              No students enrolled in your assigned tracks.
            </div>
          ) : (
            students.map((student) => (
              <div
                key={student.id}
                className="rounded-2xl border border-[#E7E3DA] bg-white p-4 shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm text-[#171717]">{student.name}</p>
                    <p className="text-2xs text-[#737373]">{student.email}</p>
                  </div>
                  <Badge variant={student.status === "Active" ? "success" : "warning"}>
                    {student.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E7E3DA] text-center">
                  <div className="rounded-xl bg-[#F7F4ED] p-2">
                    <p className="text-3xs text-[#737373] uppercase font-semibold">Track</p>
                    <p className="text-2xs font-bold text-[#171717] truncate">{student.trackName}</p>
                  </div>
                  <div className="rounded-xl bg-[#F7F4ED] p-2">
                    <p className="text-3xs text-[#737373] uppercase font-semibold">Attendance</p>
                    <p className="text-xs font-bold text-[#171717]">{student.attendanceRate}%</p>
                  </div>
                  <div className="rounded-xl bg-[#F7F4ED] p-2">
                    <p className="text-3xs text-[#737373] uppercase font-semibold">Score</p>
                    <p className="text-xs font-bold text-[#171717]">{student.averageScore}%</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      </ScrollReveal>
    </div>
  );
}
