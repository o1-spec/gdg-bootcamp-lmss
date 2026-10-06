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
import { requireInstructor } from "@/lib/auth/session";
import { getAnnouncements } from "@/lib/announcements/queries";
import { AnnouncementFeed } from "@/components/announcements/announcement-feed";
import { getInstructorSessions } from "@/lib/sessions/queries";

/*
|--------------------------------------------------
| metadata
|--------------------------------------------------
*/
export const metadata = {
  title: "Track Announcements | Instructor Portal",
};

/*
|----------------------------------------------------------------------------------------------------
| InstructorAnnouncementsPage
|----------------------------------------------------------------------------------------------------
| Renders the Instructor Announcements page view.
*/
export default async function InstructorAnnouncementsPage() {
  const instructor = await requireInstructor();
  const announcements = await getAnnouncements(instructor.id, instructor.role);
  const { assignedTracks } = await getInstructorSessions(instructor.id);

  const cohortId = "coh-2026-1";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Instructor Announcements"
        description="Broadcast important notices, schedule changes, and problem set hints to your track"
      />

      <AnnouncementFeed
        announcements={announcements}
        canCreate={assignedTracks.length > 0}
        createButtonText="+ Post Announcement"
        tracks={assignedTracks.map((t) => ({ id: t.id, name: t.name }))}
        cohortId={cohortId}
      />
    </div>
  );
}
