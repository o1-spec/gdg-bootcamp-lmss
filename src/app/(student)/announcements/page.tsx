/*
|--------------------------------------------------
| npm imports
|--------------------------------------------------
*/
import React from "react";

/*
|--------------------------------------------------
| custom imports
|--------------------------------------------------
*/
import { PageHeader } from "@/components/ui/page-header";
import { requireStudent } from "@/lib/auth/session";
import { getAnnouncements } from "@/lib/announcements/queries";
import { AnnouncementFeed } from "@/components/announcements/announcement-feed";

/*
|--------------------------------------------------
| metadata
|--------------------------------------------------
*/
export const metadata = {
  title: "Cohort Announcements | Bootcamp LMS",
};

/*
|----------------------------------------------------------------------------------------------------
| StudentAnnouncementsPage
|----------------------------------------------------------------------------------------------------
| Renders the Student Announcements page view.
*/
export default async function StudentAnnouncementsPage() {
  const student = await requireStudent();
  const announcements = await getAnnouncements(student.id, student.role);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Updates, schedule revisions, and curriculum broadcasts"
      />

      <AnnouncementFeed
        announcements={announcements}
        canCreate={false}
      />
    </div>
  );
}
