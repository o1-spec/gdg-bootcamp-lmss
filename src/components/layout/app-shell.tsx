"use client";

import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { DashboardHeader } from "./dashboard-header";
import { UserRole } from "@/types";

interface AppShellProps {
  role: UserRole;
  title: string;
  subtitle?: string;
  user: {
    name: string;
    email: string;
    initials: string;
    detail?: string;
  };
  unreadNotifications?: number;
  children: React.ReactNode;
}

export function AppShell({
  role,
  title,
  subtitle,
  user,
  unreadNotifications = 0,
  children,
}: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F7F4ED] text-[#171717] font-sans antialiased selection:bg-[#171717] selection:text-white">
      {/* Sidebar */}
      <Sidebar
        role={role}
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        unreadNotifications={unreadNotifications}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <DashboardHeader
          title={title}
          subtitle={subtitle}
          role={role}
          user={user}
          unreadNotifications={unreadNotifications}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-8">
          <div className="mx-auto max-w-6xl space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
