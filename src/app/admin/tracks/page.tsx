import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable, Column } from "@/components/ui/data-table";
import { mockTracks } from "@/lib/mock-data";
import { Track } from "@/types";

export const metadata = {
  title: "Tracks | Admin Console",
};

export default function AdminTracksPage() {
  const columns: Column<Track>[] = [
    {
      header: "Track Name",
      accessorKey: "name",
      cell: (item) => (
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
            {item.name}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {item.description}
          </p>
        </div>
      ),
    },
    {
      header: "Lead Instructor",
      accessorKey: "instructorName",
      cell: (item) => (
        <div>
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            {item.instructorName}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {item.instructorEmail}
          </p>
        </div>
      ),
    },
    {
      header: "Enrollment",
      cell: (item) => <span>{item.studentsCount} Students</span>,
    },
    {
      header: "Schedule",
      accessorKey: "schedule",
    },
    {
      header: "Actions",
      cell: (item) => (
        <button
          type="button"
          onClick={() => alert(`Configuring track: ${item.name}`)}
          className="rounded-md border border-zinc-200 px-2.5 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Edit Track
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bootcamp Tracks"
        description="Configure track curriculums, assign instructional teams, and adjust track schedules"
        action={
          <button
            type="button"
            onClick={() => alert("Add track dialog triggered")}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-900 px-3.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            + Create Track
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Active Tracks"
          value={mockTracks.length}
          subtitle="Foundations, Intermediate, Advanced"
          badge={{ text: "Active", variant: "success" }}
        />
        <StatCard
          title="Total Track Enrollments"
          value="84"
          subtitle="DSA Bootcamp 2026"
          badge={{ text: "100% Assigned", variant: "info" }}
        />
        <StatCard
          title="Average Track Size"
          value="28 Students"
          subtitle="Target capacity: 35"
          badge={{ text: "Optimal", variant: "neutral" }}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Track Roster
        </h3>
        <DataTable
          columns={columns}
          data={mockTracks}
          keyExtractor={(item) => item.id}
        />
      </div>
    </div>
  );
}
