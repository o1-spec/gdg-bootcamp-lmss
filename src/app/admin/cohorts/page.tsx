import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Cohort } from "@/types";
import { AdminCohortsTable } from "@/components/admin/directory-tables";
import { Role } from "@prisma/client";

export const metadata = {
  title: "Cohorts | Admin Console",
};

export default async function AdminCohortsPage() {
  await requireAdmin();

  const now = new Date();

  const dbCohorts = await db.cohort.findMany({
    include: {
      tracks: {
        include: {
          enrollments: {
            where: { user: { role: Role.STUDENT } },
          },
        },
      },
    },
    orderBy: { startDate: "desc" },
  });

  const cohorts: Cohort[] = dbCohorts.map((c) => {
    let status: Cohort["status"] = "Active";
    if (now < new Date(c.startDate)) {
      status = "Upcoming";
    } else if (now > new Date(c.endDate)) {
      status = "Completed";
    }

    const totalStudents = c.tracks.reduce(
      (sum, t) => sum + t.enrollments.length,
      0
    );

    const startFmt = new Intl.DateTimeFormat("en-US", {
      month: "short",
      year: "numeric",
    }).format(new Date(c.startDate));
    const endFmt = new Intl.DateTimeFormat("en-US", {
      month: "short",
      year: "numeric",
    }).format(new Date(c.endDate));

    return {
      id: c.id,
      name: c.name,
      status,
      startDate: startFmt,
      endDate: endFmt,
      totalStudents,
      tracksCount: c.tracks.length,
    };
  });

  const activeCohortsCount = cohorts.filter((c) => c.status === "Active").length;
  const totalStudents = cohorts.reduce((sum, c) => sum + c.totalStudents, 0);
  const completedCohortsCount = cohorts.filter((c) => c.status === "Completed").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cohort Management"
        description="Oversee active bootcamp programs, enrollment windows, and graduation schedules"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Active Cohorts"
          value={activeCohortsCount}
          subtitle="Currently running programs"
          badge={{ text: "Active", variant: "success" }}
        />
        <StatCard
          title="Total Students in Programs"
          value={totalStudents}
          subtitle="Across active tracks"
          badge={{ text: "Enrolled", variant: "info" }}
        />
        <StatCard
          title="Historical Cohorts"
          value={completedCohortsCount}
          subtitle="Completed programs"
          badge={{ text: "Completed", variant: "neutral" }}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold tracking-tight text-[#171717]">
          All Cohorts ({cohorts.length})
        </h3>
        <AdminCohortsTable cohorts={cohorts} />
      </div>
    </div>
  );
}
