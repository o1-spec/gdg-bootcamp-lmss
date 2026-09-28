import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable, Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { mockCohorts } from "@/lib/mock-data";
import { Cohort } from "@/types";

export const metadata = {
  title: "Cohorts | Admin Console",
};

export default function AdminCohortsPage() {
  const columns: Column<Cohort>[] = [
    {
      header: "Cohort Name",
      accessorKey: "name",
      cell: (item) => (
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
            {item.name}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {item.startDate} – {item.endDate}
          </p>
        </div>
      ),
    },
    {
      header: "Tracks",
      cell: (item) => <span>{item.tracksCount} Tracks</span>,
    },
    {
      header: "Students Enrolled",
      cell: (item) => (
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {item.totalStudents} Students
        </span>
      ),
    },
    {
      header: "Status",
      cell: (item) => (
        <Badge variant={item.status === "Active" ? "success" : "neutral"}>
          {item.status}
        </Badge>
      ),
    },
    {
      header: "Actions",
      cell: (item) => (
        <button
          type="button"
          onClick={() => alert(`Configuring cohort: ${item.name}`)}
          className="rounded-md border border-zinc-200 px-2.5 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Manage
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cohort Management"
        description="Oversee active bootcamp programs, enrollment windows, and graduation schedules"
        action={
          <button
            type="button"
            onClick={() => alert("Create cohort dialog triggered")}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-900 px-3.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            + Create Cohort
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Active Cohorts"
          value="1"
          subtitle="DSA Bootcamp 2026"
          badge={{ text: "Active", variant: "success" }}
        />
        <StatCard
          title="Total Students in Programs"
          value="84"
          subtitle="Across active tracks"
          badge={{ text: "Spring 2026", variant: "info" }}
        />
        <StatCard
          title="Historical Cohorts"
          value="1"
          subtitle="Full Stack Winter 2025"
          badge={{ text: "Completed", variant: "neutral" }}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          All Cohorts
        </h3>
        <DataTable
          columns={columns}
          data={mockCohorts}
          keyExtractor={(item) => item.id}
        />
      </div>
    </div>
  );
}
