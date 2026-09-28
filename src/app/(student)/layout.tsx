import React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { requireStudent } from "@/lib/auth/session";

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
