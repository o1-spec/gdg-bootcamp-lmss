import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { requireAdmin } from "@/lib/auth/session";
import { getAllExcuses } from "@/lib/excuses/queries";
import { ExcuseReviewTable } from "@/components/excuses/excuse-review-table";

export const metadata = {
  title: "All Attendance Excuses | Admin Portal",
};

export default async function AdminExcusesPage() {
  await requireAdmin();
  const rawExcuses = await getAllExcuses();

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
        title="Attendance Excuses Management"
        description="Review all submitted excuses across all cohorts and tracks, with override authority"
      />

      <ExcuseReviewTable excuses={excuses} isAdmin={true} />
    </div>
  );
}
