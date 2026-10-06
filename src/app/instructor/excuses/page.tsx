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
import { getInstructorExcuses } from "@/lib/excuses/queries";
import { ExcuseReviewTable } from "@/components/excuses/excuse-review-table";

/*
|--------------------------------------------------
| metadata
|--------------------------------------------------
*/
export const metadata = {
  title: "Review Attendance Excuses | Instructor Portal",
};

/*
|----------------------------------------------------------------------------------------------------
| InstructorExcusesPage
|----------------------------------------------------------------------------------------------------
| Renders the Instructor Excuses page view.
*/
export default async function InstructorExcusesPage() {
  const user = await requireInstructor();
  const rawExcuses = await getInstructorExcuses(user.id);

  const excuses = rawExcuses.map((e) => ({
    id: e.id,
    reason: e.reason,
    status: e.status,
    reviewNote: e.reviewNote,
    createdAt: e.createdAt,
    reviewedAt: e.reviewedAt,
    user: e.user,
    session: e.session,
    reviewedBy: e.reviewedBy,
    attendance: e.attendance,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Excuses"
        description="Review student absence and late excuses for your assigned tracks"
      />

      <ExcuseReviewTable excuses={excuses} isAdmin={false} />
    </div>
  );
}
