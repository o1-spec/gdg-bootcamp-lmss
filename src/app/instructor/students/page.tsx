import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable, Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { mockStudents } from "@/lib/mock-data";
import { Student } from "@/types";

export const metadata = {
  title: "Track Students | Instructor Portal",
};

export default function InstructorStudentsPage() {
  const intermediateStudents = mockStudents.filter(
    (s) => s.trackName === "Intermediate"
  );

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
        title="Assigned Students (Intermediate Track)"
        description="Monitor student engagement, attendance compliance, and academic benchmarks"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Enrolled in Track"
          value={intermediateStudents.length}
          subtitle="Cohort 2026 Active"
          badge={{ text: "Intermediate", variant: "info" }}
        />
        <StatCard
          title="Average Attendance"
          value="93%"
          subtitle="Above 85% requirement"
          badge={{ text: "Good", variant: "success" }}
        />
        <StatCard
          title="Students in Good Standing"
          value={intermediateStudents.length}
          subtitle="0 students currently at risk"
          badge={{ text: "100%", variant: "success" }}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Student Roster
        </h3>
        <DataTable
          columns={columns}
          data={intermediateStudents}
          keyExtractor={(item) => item.id}
        />
      </div>
    </div>
  );
}
