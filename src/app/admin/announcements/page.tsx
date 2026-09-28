import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { requireAdmin } from "@/lib/auth/session";
import { getAnnouncements } from "@/lib/announcements/queries";
import { AnnouncementFeed } from "@/components/announcements/announcement-feed";
import { db } from "@/lib/db";

export const metadata = {
  title: "Announcements | Admin Console",
};

export default async function AdminAnnouncementsPage() {
  const admin = await requireAdmin();
  const [announcements, tracks, cohort] = await Promise.all([
    getAnnouncements(admin.id, admin.role),
    db.track.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.cohort.findFirst({ select: { id: true }, orderBy: { startDate: "desc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cohort & System Announcements"
        description="Broadcast system-wide notices, holiday schedules, and cohort milestone updates"
      />

      <AnnouncementFeed
        announcements={announcements}
        canCreate={true}
        createButtonText="+ Broadcast Announcement"
        tracks={tracks}
        cohortId={cohort?.id || ""}
      />
    </div>
  );
}
