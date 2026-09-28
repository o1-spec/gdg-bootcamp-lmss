"use client";

import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { DashboardHeader } from "./dashboard-header";
import { UserRole } from "@/types";

interface AppShellProps {
  role: UserRole;
  title: string;
  user: {
    name: string;
    email: string;
    initials: string;
    detail?: string;
  };
  children: React.ReactNode;
}

export function AppShell({ role, title, user, children }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-zinc-50/60 dark:bg-black">
      {/* Sidebar */}
      <Sidebar
        role={role}
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader
          title={title}
          role={role}
          user={user}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
