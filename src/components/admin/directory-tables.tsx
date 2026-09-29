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
          <p className="font-semibold text-[#171717]">{item.name}</p>
          <p className="text-[11px] text-[#737373]">{item.email}</p>
        </div>
      ),
    },
    {
      header: "Track",
      accessorKey: "trackName",
      cell: (item) => (
        <span className="font-medium text-[#171717]">
          {item.trackName || "Unassigned"}
        </span>
      ),
    },
    {
      header: "Cohort",
      accessorKey: "cohortName",
      cell: (item) => <span className="text-[#737373]">{item.cohortName}</span>,
    },
    {
      header: "Attendance",
      cell: (item) => (
        <span
          className={`font-semibold ${
            item.attendanceRate >= 80
              ? "text-[#34A853]"
              : item.attendanceRate >= 60
              ? "text-[#FBBC04]"
              : "text-[#EA4335]"
          }`}
        >
          {item.attendanceRate}%
        </span>
      ),
    },
    {
      header: "Assignments",
      cell: (item) => (
        <span className="text-[#171717]">
          {item.assignmentsCompleted} / {item.totalAssignments}
        </span>
      ),
    },
    {
      header: "Avg Score",
      cell: (item) => (
        <span className="font-semibold text-[#171717]">
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
    <div>
      {/* Desktop Table */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={students}
          keyExtractor={(item) => item.id}
        />
      </div>

      {/* Mobile Stacked Cards */}
      <div className="space-y-3 md:hidden">
        {students.length === 0 ? (
          <div className="rounded-2xl border border-[#E7E3DA] bg-white p-6 text-center text-xs text-[#737373]">
            No student records found.
          </div>
        ) : (
          students.map((student) => (
            <div
              key={student.id}
              className="rounded-2xl border border-[#E7E3DA] bg-white p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-[#171717]">{student.name}</p>
                  <p className="text-xs text-[#737373]">{student.email}</p>
                </div>
                <Badge
                  variant={
                    student.status === "Active"
                      ? "success"
                      : student.status === "At Risk"
                      ? "warning"
                      : "neutral"
                  }
                >
                  {student.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-t border-[#E7E3DA] pt-3">
                <div>
                  <span className="text-[#737373]">Track:</span>{" "}
                  <span className="font-medium text-[#171717]">
                    {student.trackName}
                  </span>
                </div>
                <div>
                  <span className="text-[#737373]">Attendance:</span>{" "}
                  <span className="font-semibold text-[#171717]">
                    {student.attendanceRate}%
                  </span>
                </div>
                <div>
                  <span className="text-[#737373]">Tasks:</span>{" "}
                  <span className="font-medium text-[#171717]">
                    {student.assignmentsCompleted}/{student.totalAssignments}
                  </span>
                </div>
                <div>
                  <span className="text-[#737373]">Avg Score:</span>{" "}
                  <span className="font-semibold text-[#171717]">
                    {student.averageScore}%
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function AdminCohortsTable({ cohorts }: { cohorts: Cohort[] }) {
  const columns: Column<Cohort>[] = [
    {
      header: "Cohort Name",
      accessorKey: "name",
      cell: (item) => (
        <div>
          <p className="font-semibold text-[#171717]">{item.name}</p>
          <p className="text-[11px] text-[#737373]">
            {item.startDate} – {item.endDate}
          </p>
        </div>
      ),
    },
    {
      header: "Tracks",
      cell: (item) => <span className="text-[#737373]">{item.tracksCount} Tracks</span>,
    },
    {
      header: "Students Enrolled",
      cell: (item) => (
        <span className="font-medium text-[#171717]">
          {item.totalStudents} Students
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
              : item.status === "Upcoming"
              ? "info"
              : "neutral"
          }
        >
          {item.status}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={cohorts}
          keyExtractor={(item) => item.id}
        />
      </div>

      <div className="space-y-3 md:hidden">
        {cohorts.length === 0 ? (
          <div className="rounded-2xl border border-[#E7E3DA] bg-white p-6 text-center text-xs text-[#737373]">
            No cohorts found.
          </div>
        ) : (
          cohorts.map((cohort) => (
            <div
              key={cohort.id}
              className="rounded-2xl border border-[#E7E3DA] bg-white p-4 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-[#171717]">{cohort.name}</p>
                  <p className="text-xs text-[#737373]">
                    {cohort.startDate} – {cohort.endDate}
                  </p>
                </div>
                <Badge
                  variant={
                    cohort.status === "Active"
                      ? "success"
                      : cohort.status === "Upcoming"
                      ? "info"
                      : "neutral"
                  }
                >
                  {cohort.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-[#737373] pt-1">
                <span>{cohort.tracksCount} Tracks</span>
                <span>•</span>
                <span>{cohort.totalStudents} Students</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function AdminInstructorsTable({ instructors }: { instructors: Instructor[] }) {
  const columns: Column<Instructor>[] = [
    {
      header: "Instructor",
      accessorKey: "name",
      cell: (item) => (
        <div>
          <p className="font-semibold text-[#171717]">{item.name}</p>
          <p className="text-[11px] text-[#737373]">{item.email}</p>
        </div>
      ),
    },
    {
      header: "Assigned Tracks",
      cell: (item) => (
        <span className="font-medium text-[#171717]">
          {item.assignedTracks.length > 0
            ? item.assignedTracks.join(", ")
            : "No tracks assigned"}
        </span>
      ),
    },
    {
      header: "Students",
      cell: (item) => <span className="text-[#737373]">{item.totalStudents} enrolled</span>,
    },
    {
      header: "Weekly Sessions",
      cell: (item) => <span className="text-[#737373]">{item.activeSessions} sessions</span>,
    },
    {
      header: "Status",
      cell: () => <Badge variant="success">Active</Badge>,
    },
  ];

  return (
    <div>
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={instructors}
          keyExtractor={(item) => item.id}
        />
      </div>

      <div className="space-y-3 md:hidden">
        {instructors.length === 0 ? (
          <div className="rounded-2xl border border-[#E7E3DA] bg-white p-6 text-center text-xs text-[#737373]">
            No instructors found.
          </div>
        ) : (
          instructors.map((inst) => (
            <div
              key={inst.id}
              className="rounded-2xl border border-[#E7E3DA] bg-white p-4 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-[#171717]">{inst.name}</p>
                  <p className="text-xs text-[#737373]">{inst.email}</p>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
              <p className="text-xs text-[#737373]">
                Tracks:{" "}
                <span className="text-[#171717]">
                  {inst.assignedTracks.length > 0
                    ? inst.assignedTracks.join(", ")
                    : "Unassigned"}
                </span>
              </p>
              <div className="flex items-center gap-3 text-xs text-[#737373] pt-1">
                <span>{inst.totalStudents} students</span>
                <span>•</span>
                <span>{inst.activeSessions} sessions</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function AdminTracksTable({ tracks }: { tracks: Track[] }) {
  const columns: Column<Track>[] = [
    {
      header: "Track Name",
      accessorKey: "name",
      cell: (item) => (
        <div>
          <p className="font-semibold text-[#171717]">{item.name}</p>
          <p className="text-[11px] text-[#737373]">
            {item.description || "No description provided"}
          </p>
        </div>
      ),
    },
    {
      header: "Cohort",
      accessorKey: "cohortName",
      cell: (item) => <span className="text-[#737373]">{item.cohortName}</span>,
    },
    {
      header: "Lead Instructor",
      cell: (item) => (
        <span className="font-medium text-[#171717]">
          {item.instructorName}
        </span>
      ),
    },
    {
      header: "Enrollment",
      cell: (item) => <span className="text-[#737373]">{item.studentsCount} Students</span>,
    },
    {
      header: "Status",
      cell: () => <Badge variant="neutral">Active</Badge>,
    },
  ];

  return (
    <div>
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={tracks}
          keyExtractor={(item) => item.id}
        />
      </div>

      <div className="space-y-3 md:hidden">
        {tracks.length === 0 ? (
          <div className="rounded-2xl border border-[#E7E3DA] bg-white p-6 text-center text-xs text-[#737373]">
            No tracks found.
          </div>
        ) : (
          tracks.map((track) => (
            <div
              key={track.id}
              className="rounded-2xl border border-[#E7E3DA] bg-white p-4 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-[#171717]">{track.name}</p>
                  <p className="text-xs text-[#737373]">{track.cohortName}</p>
                </div>
                <Badge variant="neutral">Active</Badge>
              </div>
              <p className="text-xs text-[#737373]">
                Instructor: <span className="text-[#171717]">{track.instructorName}</span>
              </p>
              <p className="text-xs text-[#737373]">
                Students: <span className="text-[#171717]">{track.studentsCount}</span>
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function AdminEnrollmentsTable({ enrollments }: { enrollments: Enrollment[] }) {
  const columns: Column<Enrollment>[] = [
    {
      header: "Student",
      accessorKey: "studentName",
      cell: (item) => (
        <div>
          <p className="font-semibold text-[#171717]">{item.studentName}</p>
          <p className="text-[11px] text-[#737373]">{item.studentEmail}</p>
        </div>
      ),
    },
    {
      header: "Assigned Track",
      accessorKey: "trackName",
      cell: (item) => (
        <span className="font-medium text-[#171717]">
          {item.trackName}
        </span>
      ),
    },
    {
      header: "Cohort",
      accessorKey: "cohortName",
      cell: (item) => <span className="text-[#737373]">{item.cohortName}</span>,
    },
    {
      header: "Enrolled Date",
      accessorKey: "enrolledDate",
      cell: (item) => <span className="text-[#737373]">{item.enrolledDate}</span>,
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
    <div>
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={enrollments}
          keyExtractor={(item) => item.id}
        />
      </div>

      <div className="space-y-3 md:hidden">
        {enrollments.length === 0 ? (
          <div className="rounded-2xl border border-[#E7E3DA] bg-white p-6 text-center text-xs text-[#737373]">
            No enrollments found.
          </div>
        ) : (
          enrollments.map((enr) => (
            <div
              key={enr.id}
              className="rounded-2xl border border-[#E7E3DA] bg-white p-4 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-[#171717]">{enr.studentName}</p>
                  <p className="text-xs text-[#737373]">{enr.studentEmail}</p>
                </div>
                <Badge
                  variant={
                    enr.status === "Active"
                      ? "success"
                      : enr.status === "Pending"
                      ? "warning"
                      : "neutral"
                  }
                >
                  {enr.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#737373]">
                <span>{enr.trackName}</span>
                <span>•</span>
                <span>{enr.cohortName}</span>
              </div>
              <p className="text-[11px] text-[#737373]">
                Enrolled: {enr.enrolledDate}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
