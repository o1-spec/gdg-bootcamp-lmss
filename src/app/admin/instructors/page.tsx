import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable, Column } from "@/components/ui/data-table";
import { mockInstructors } from "@/lib/mock-data";
import { Instructor } from "@/types";

export const metadata = {
  title: "Instructors | Admin Console",
};

export default function AdminInstructorsPage() {
  const columns: Column<Instructor>[] = [
    {
      header: "Instructor",
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
      header: "Role Title",
      accessorKey: "roleTitle",
      cell: (item) => (
        <span className="text-zinc-700 dark:text-zinc-300">
          {item.roleTitle}
        </span>
      ),
    },
    {
      header: "Assigned Tracks",
      cell: (item) => (
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {item.assignedTracks.join(", ")}
        </span>
      ),
    },
    {
      header: "Students",
      cell: (item) => <span>{item.totalStudents} enrolled</span>,
    },
    {
      header: "Active Sessions",
      cell: (item) => <span>{item.activeSessions} scheduled</span>,
    },
    {
      header: "Actions",
      cell: (item) => (
        <button
          type="button"
          onClick={() => alert(`Managing instructor assignments: ${item.name}`)}
          className="rounded-md border border-zinc-200 px-2.5 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Assign Tracks
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Instructor Directory & Staffing"
        description="Assign lead instructors to bootcamp tracks, monitor teaching workloads, and manage permissions"
        action={
          <button
            type="button"
            onClick={() => alert("Invite instructor dialog triggered")}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-900 px-3.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            + Invite Instructor
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Active Instructors"
          value={mockInstructors.length}
          subtitle="Full staffing coverage"
          badge={{ text: "Active", variant: "success" }}
        />
        <StatCard
          title="Tracks Assigned"
          value="3 / 3"
          subtitle="100% of tracks covered"
          badge={{ text: "Staffed", variant: "info" }}
        />
        <StatCard
          title="Weekly Live Sessions"
          value="16"
          subtitle="Workshops & lectures"
          badge={{ text: "Optimal", variant: "neutral" }}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Instructor Roster
        </h3>
        <DataTable
          columns={columns}
          data={mockInstructors}
          keyExtractor={(item) => item.id}
        />
      </div>
    </div>
  );
}
