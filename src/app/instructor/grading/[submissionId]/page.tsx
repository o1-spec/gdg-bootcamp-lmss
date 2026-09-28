import React from "react";
import { notFound } from "next/navigation";
import { requireInstructor } from "@/lib/auth/session";
import { getSubmissionForGrading } from "@/lib/assignments/queries";
import { GradingForm } from "@/components/grading/grading-form";

interface InstructorGradeSubmissionPageProps {
  params: Promise<{ submissionId: string }>;
}

export async function generateMetadata({
  params,
}: InstructorGradeSubmissionPageProps) {
  const { submissionId } = await params;
  return {
    title: `Grade Submission: ${submissionId} | Instructor Portal`,
  };
}

export default async function InstructorGradeSubmissionPage({
  params,
}: InstructorGradeSubmissionPageProps) {
  const { submissionId } = await params;
  const user = await requireInstructor();

  const data = await getSubmissionForGrading(submissionId, user.id, user.role);

  if (!data) {
    notFound();
  }

  return (
    <GradingForm
      submissionData={data}
      backHref="/instructor/grading"
    />
  );
}
