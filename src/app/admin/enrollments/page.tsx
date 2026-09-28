import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable, Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { mockEnrollments } from "@/lib/mock-data";
import { Enrollment } from "@/types";

export const metadata = {
  title: "Enrollments | Admin Console",
};

export default function AdminEnrollmentsPage() {
  const columns: Column<Enrollment>[] = [
    {
      header: "Student",
      accessorKey: "studentName",
      cell: (item) => (
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
            {item.studentName}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {item.studentEmail}
          </p>
        </div>
      ),
    },
    {
      header: "Assigned Track",
      accessorKey: "trackName",
      cell: (item) => (
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {item.trackName}
        </span>
      ),
    },
    {
      header: "Cohort",
      accessorKey: "cohortName",
    },
    {
      header: "Enrolled Date",
      accessorKey: "enrolledDate",
    },
    {
      header: "Status",
      cell: (item) => (
        <Badge
          variant={
            item.status === "Active"
              ? "success"
              : item.status === "Pending"
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
        <div className="flex items-center gap-2">
          {item.status === "Pending" ? (
            <button
              type="button"
              onClick={() => alert(`Approving enrollment for ${item.studentName}`)}
              className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
            >
              Approve
            </button>
          ) : (
            <button
              type="button"
              onClick={() => alert(`Switch track for ${item.studentName}`)}
              className="rounded-md border border-zinc-200 px-2.5 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Change Track
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Enrollments & Track Allocations"
        description="Process new cohort applications, assign tracks, and handle track transfers"
        action={
          <button
            type="button"
            onClick={() => alert("Batch enrollment dialog triggered")}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-900 px-3.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            + Enroll Student
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Active Enrollments"
          value="84"
          subtitle="DSA Bootcamp 2026"
          badge={{ text: "Confirmed", variant: "success" }}
        />
        <StatCard
          title="Pending Review"
          value="1"
          subtitle="Lucas Vance (Foundations)"
          badge={{ text: "Action Needed", variant: "warning" }}
        />
        <StatCard
          title="Total Cohort Capacity"
          value="105 Seats"
          subtitle="80% filled"
          badge={{ text: "Optimal", variant: "info" }}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Enrollment Applications & Status
        </h3>
        <DataTable
          columns={columns}
          data={mockEnrollments}
          keyExtractor={(item) => item.id}
        />
      </div>
    </div>
  );
}
