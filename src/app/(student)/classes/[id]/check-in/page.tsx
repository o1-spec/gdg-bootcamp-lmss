import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStudent } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getSessionById } from "@/lib/sessions/queries";
import { StudentCheckinCard } from "@/components/attendance/student-checkin-card";
import { PageHeader } from "@/components/ui/page-header";

interface CheckInPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CheckInPageProps) {
  const { id } = await params;
  return {
    title: `Class Check-in: ${id} | Student Portal`,
  };
}

export default async function StudentClassCheckInPage({ params }: CheckInPageProps) {
  const { id } = await params;
  const user = await requireStudent();

  const session = await getSessionById(id, user.id, user.role);

  if (!session) {
    notFound();
  }

  // Look for existing attendance record
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/classes/${session.id}`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Back to Class Details
      </Link>

      <PageHeader
        title={`Check-In: ${session.title}`}
        description="Verify your attendance for today's live session with the instructor check-in code"
      />

      <StudentCheckinCard
        sessionId={session.id}
        sessionTitle={session.title}
        startsAt={session.startsAt}
        endsAt={session.endsAt}
        existingAttendance={existingAttendance}
      />
    </div>
  );
}
