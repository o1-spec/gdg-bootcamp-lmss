/*
|--------------------------------------------------
| npm imports
|--------------------------------------------------
*/
import React from "react";
import { notFound } from "next/navigation";

/*
|--------------------------------------------------
| custom imports
|--------------------------------------------------
*/
import { requireInstructor } from "@/lib/auth/session";
import { getSessionById } from "@/lib/sessions/queries";
import { SessionDetails } from "@/components/sessions/session-details";
import { InstructorCheckinCodeManager } from "@/components/attendance/instructor-checkin-code-manager";

/*
|--------------------------------------------------
| types
|--------------------------------------------------
*/
interface InstructorSessionPageProps {
  params: Promise<{ id: string }>;
}

/*
|----------------------------------------------------------------------------------------------------
| generateMetadata
|----------------------------------------------------------------------------------------------------
| Handler implementation for generate Metadata.
*/
export async function generateMetadata({ params }: InstructorSessionPageProps) {
  const { id } = await params;
  return {
    title: `Session Details: ${id} | Instructor Portal`,
  };
}

/*
|----------------------------------------------------------------------------------------------------
| InstructorSessionDetailPage
|----------------------------------------------------------------------------------------------------
| Renders the Instructor Session Detail page view.
*/
export default async function InstructorSessionDetailPage({
  params,
}: InstructorSessionPageProps) {
  const { id } = await params;
  const user = await requireInstructor();

  const session = await getSessionById(id, user.id, user.role);

  if (!session) {
    notFound();
  }

  const now = new Date();
  const startsAt = new Date(session.startsAt);
  const endsAt = new Date(session.endsAt);
  const isLive = startsAt <= now && now <= endsAt;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SessionDetails
        session={session}
        basePath="/instructor/classes"
        canEdit={true}
      />

      <InstructorCheckinCodeManager
        sessionId={session.id}
        initialCode={session.checkinCode}
        isLive={isLive}
        startsAt={session.startsAt}
        endsAt={session.endsAt}
      />
    </div>
  );
}
