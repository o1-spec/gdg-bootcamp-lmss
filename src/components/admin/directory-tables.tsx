"use client";

import React from "react";
import { DataTable, Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Student, Cohort, Instructor, Track, Enrollment } from "@/types";

export function AdminStudentsTable({ students }: { students: Student[] }) {
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
          {item.trackName || "Unassigned"}
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
  ];

  return (
    <DataTable
      columns={columns}
      data={students}
      keyExtractor={(item) => item.id}
    />
  );
}

export function AdminCohortsTable({ cohorts }: { cohorts: Cohort[] }) {
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
  ];

  return (
    <DataTable
      columns={columns}
      data={cohorts}
      keyExtractor={(item) => item.id}
    />
  );
}

export function AdminInstructorsTable({ instructors }: { instructors: Instructor[] }) {
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
      header: "Assigned Tracks",
      cell: (item) => (
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {item.assignedTracks.length > 0
            ? item.assignedTracks.join(", ")
            : "No tracks assigned"}
        </span>
      ),
    },
    {
      header: "Students",
      cell: (item) => <span>{item.totalStudents} enrolled</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={instructors}
      keyExtractor={(item) => item.id}
    />
  );
}

export function AdminTracksTable({ tracks }: { tracks: Track[] }) {
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
            {item.description || "No description"}
          </p>
        </div>
      ),
    },
    {
      header: "Cohort",
      accessorKey: "cohortName",
    },
    {
      header: "Instructor",
      cell: (item) => (
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {item.instructorName}
        </span>
      ),
    },
    {
      header: "Enrollment",
      cell: (item) => <span>{item.studentsCount} Students</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={tracks}
      keyExtractor={(item) => item.id}
    />
  );
}

export function AdminEnrollmentsTable({ enrollments }: { enrollments: Enrollment[] }) {
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
  ];

  return (
    <DataTable
      columns={columns}
      data={enrollments}
      keyExtractor={(item) => item.id}
    />
  );
}
