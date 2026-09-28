import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable, Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { mockStudents } from "@/lib/mock-data";
import { Student } from "@/types";

export const metadata = {
  title: "Students | Admin Console",
};

export default function AdminStudentsPage() {
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
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {item.trackName}
        </span>
      ),
    },
    {
      header: "Attendance",
      cell: (item) => <span>{item.attendanceRate}%</span>,
    },
    {
      header: "Avg Score",
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
    {
      header: "Actions",
      cell: (item) => (
        <button
          type="button"
          onClick={() => alert(`Managing student record: ${item.name}`)}
          className="rounded-md border border-zinc-200 px-2.5 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          View Profile
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Directory"
        description="Comprehensive view of all enrolled students across Bootcamp tracks"
        action={
          <button
            type="button"
            onClick={() => alert("Enroll student dialog triggered")}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-900 px-3.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            + Add Student
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Registered"
          value="84"
          subtitle="Cohort 2026 active"
          badge={{ text: "Active", variant: "success" }}
        />
        <StatCard
          title="Average Attendance"
          value="91.5%"
          subtitle="Across all 3 tracks"
          badge={{ text: "Healthy", variant: "success" }}
        />
        <StatCard
          title="Academic Warning"
          value="1 Student"
          subtitle="Attendance below 80%"
          badge={{ text: "Action Needed", variant: "warning" }}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Student Records ({mockStudents.length} sample displayed)
        </h3>
        <DataTable
          columns={columns}
          data={mockStudents}
          keyExtractor={(item) => item.id}
        />
      </div>
    </div>
  );
}
