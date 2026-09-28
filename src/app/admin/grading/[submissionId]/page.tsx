import React from "react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { getSubmissionForGrading } from "@/lib/assignments/queries";
import { GradingForm } from "@/components/grading/grading-form";

interface AdminGradeSubmissionPageProps {
  params: Promise<{ submissionId: string }>;
}

export async function generateMetadata({
  params,
}: AdminGradeSubmissionPageProps) {
  const { submissionId } = await params;
  return {
    title: `Grade Submission: ${submissionId} | Admin Console`,
  };
}

export default async function AdminGradeSubmissionPage({
  params,
}: AdminGradeSubmissionPageProps) {
  const { submissionId } = await params;
  const user = await requireAdmin();

  const data = await getSubmissionForGrading(submissionId, user.id, user.role);

  if (!data) {
    notFound();
  }

  return (
    <GradingForm
      submissionData={data}
      backHref="/admin/grading"
    />
  );
}
