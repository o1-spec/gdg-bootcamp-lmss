import React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { requireStudent } from "@/lib/auth/session";
import { getUnreadCount } from "@/lib/notifications/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Student Portal | Bootcamp LMS",
  description: "Track progress, join live classes, and submit assignments",
};

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireStudent();
  const unreadCount = await getUnreadCount(user.id).catch(() => 0);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <AppShell
      role="student"
      title="Student Portal"
      unreadNotifications={unreadCount}
      user={{
        name: user.name,
        email: user.email,
        initials: initials || "ST",
        detail: "Active Student",
      }}
    >
      {children}
    </AppShell>
  );
}
