import React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { requireAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Console | Bootcamp LMS",
  description: "Platform management, cohort oversight, and bootcamp enrollment controls",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <AppShell
      role="admin"
      title="Admin Console"
      user={{
        name: user.name,
        email: user.email,
        initials: initials || "AD",
        detail: "Administrator",
      }}
    >
      {children}
    </AppShell>
  );
}
