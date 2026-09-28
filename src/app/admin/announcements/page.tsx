import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { requireAdmin } from "@/lib/auth/session";
import { getAnnouncements } from "@/lib/announcements/queries";
import { AnnouncementFeed } from "@/components/announcements/announcement-feed";
import { mockTracks } from "@/lib/mock-data";

export const metadata = {
  title: "Announcements | Admin Console",
};

export default async function AdminAnnouncementsPage() {
  const admin = await requireAdmin();
  const announcements = await getAnnouncements(admin.id, admin.role);

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
        tracks={mockTracks.map((t) => ({ id: t.id, name: t.name }))}
        cohortId="coh-2026-1"
      />
    </div>
  );
}
