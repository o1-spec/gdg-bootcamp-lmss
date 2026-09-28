import React from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getSessionById } from "@/lib/sessions/queries";
import { SessionDetails } from "@/components/sessions/session-details";

interface InstructorSessionPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: InstructorSessionPageProps) {
  const { id } = await params;
  return {
    title: `Session Details: ${id} | Instructor Portal`,
  };
}

export default async function InstructorSessionDetailPage({
  params,
}: InstructorSessionPageProps) {
  const { id } = await params;
  const user = await requireUser();

  const session = await getSessionById(id, user.id, user.role);

  if (!session) {
    notFound();
  }

  return (
    <SessionDetails
      session={session}
      basePath="/instructor/classes"
      canEdit={true}
    />
  );
}
