import React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { requireInstructor } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Instructor Portal | Bootcamp LMS",
  description: "Manage classes, track attendance, and grade student assignments",
};

export default async function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireInstructor();

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <AppShell
      role="instructor"
      title="Instructor Portal"
      user={{
        name: user.name,
        email: user.email,
        initials: initials || "IN",
        detail: "Track Instructor",
      }}
    >
      {children}
    </AppShell>
  );
}
