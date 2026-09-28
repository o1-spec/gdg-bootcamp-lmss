import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { requireStudent } from "@/lib/auth/session";
import { getAnnouncements } from "@/lib/announcements/queries";
import { AnnouncementFeed } from "@/components/announcements/announcement-feed";

export const metadata = {
  title: "Cohort Announcements | Bootcamp LMS",
};

export default async function StudentAnnouncementsPage() {
  const student = await requireStudent();
  const announcements = await getAnnouncements(student.id, student.role);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cohort Announcements"
        description="Important notifications, schedule revisions, and curriculum broadcasts"
      />

      <AnnouncementFeed
        announcements={announcements}
        canCreate={false}
      />
    </div>
  );
}
