import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { Instructor } from "@/types";
import { AdminInstructorsTable } from "@/components/admin/directory-tables";

export const metadata = {
  title: "Instructors | Admin Console",
};

export default async function AdminInstructorsPage() {
  await requireAdmin();

  const instructorUsers = await db.user.findMany({
    where: { role: Role.INSTRUCTOR },
    include: {
      trackAssignments: {
        include: {
          track: {
            include: {
              enrollments: true,
              sessions: true,
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const totalTracks = await db.track.count();

  const instructors: Instructor[] = instructorUsers.map((u) => {
    const assignedTrackNames = u.trackAssignments.map((ti) => ti.track.name);
    const studentIds = new Set<string>();
    let totalSessions = 0;

    for (const ti of u.trackAssignments) {
      for (const e of ti.track.enrollments) {
        studentIds.add(e.userId);
      }
      totalSessions += ti.track.sessions.length;
    }

    const initials = u.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      initials,
      assignedTracks: assignedTrackNames,
      totalStudents: studentIds.size,
      activeSessions: totalSessions,
      roleTitle: "Instructor",
    };
  });

  const assignedTracksCount = new Set(
    instructorUsers.flatMap((u) => u.trackAssignments.map((ti) => ti.trackId))
  ).size;

  const totalWeeklySessions = instructors.reduce(
    (acc, inst) => acc + inst.activeSessions,
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Instructor Directory & Staffing"
        description="Assign lead instructors to bootcamp tracks, monitor teaching workloads, and manage permissions"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Active Instructors"
          value={instructors.length}
          subtitle="Registered instructional staff"
          badge={{ text: "Active", variant: "success" }}
        />
        <StatCard
          title="Tracks Assigned"
          value={`${assignedTracksCount} / ${totalTracks}`}
          subtitle={`${totalTracks > 0 ? Math.round((assignedTracksCount / totalTracks) * 100) : 0}% of tracks covered`}
          badge={{ text: "Staffed", variant: "info" }}
        />
        <StatCard
          title="Total Scheduled Sessions"
          value={totalWeeklySessions}
          subtitle="Workshops & lectures"
          badge={{ text: "Optimal", variant: "neutral" }}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold tracking-tight text-[#171717]">
          Instructor Roster ({instructors.length} staff)
        </h3>
        <AdminInstructorsTable instructors={instructors} />
      </div>
    </div>
  );
}
