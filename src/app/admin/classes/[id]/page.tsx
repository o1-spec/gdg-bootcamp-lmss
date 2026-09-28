import React from "react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { getSessionById } from "@/lib/sessions/queries";
import { SessionDetails } from "@/components/sessions/session-details";

interface AdminSessionDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AdminSessionDetailPageProps) {
  const { id } = await params;
  return {
    title: `Session Details: ${id} | Admin Console`,
  };
}

export default async function AdminSessionDetailPage({
  params,
}: AdminSessionDetailPageProps) {
  const { id } = await params;
  const user = await requireAdmin();

  const session = await getSessionById(id, user.id, user.role);

  if (!session) {
    notFound();
  }

  return (
    <SessionDetails
      session={session}
      basePath="/admin/classes"
      canEdit={true}
    />
  );
}
