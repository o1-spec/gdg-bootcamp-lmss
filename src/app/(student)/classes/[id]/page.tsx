import React from "react";
import { notFound } from "next/navigation";
import { requireStudent } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getSessionById } from "@/lib/sessions/queries";
import { SessionDetails } from "@/components/sessions/session-details";
import { StudentCheckinCard } from "@/components/attendance/student-checkin-card";

interface StudentSessionPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: StudentSessionPageProps) {
  const { id } = await params;
  return {
    title: `Class Details: ${id} | Bootcamp LMS`,
  };
}

export default async function StudentSessionDetailPage({
  params,
}: StudentSessionPageProps) {
  const { id } = await params;
  const user = await requireStudent();

  const session = await getSessionById(id, user.id, user.role);

  if (!session) {
    notFound();
  }

  let existingAttendance = null;
  try {
    const record = await db.attendance.findUnique({
      where: {
        sessionId_userId: {
          sessionId: id,
          userId: user.id,
        },
      },
    });

    if (record) {
      existingAttendance = {
        status: record.status,
        markedAt: record.markedAt,
      };
    }
  } catch (err) {
    console.warn("DB attendance lookup fallback", err);
  }

  const isPast = new Date(session.endsAt) < new Date();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SessionDetails session={session} basePath="/classes" canEdit={false} />

      {!isPast && (
        <StudentCheckinCard
          sessionId={session.id}
          sessionTitle={session.title}
          startsAt={session.startsAt}
          endsAt={session.endsAt}
          existingAttendance={existingAttendance}
        />
      )}
    </div>
  );
}
