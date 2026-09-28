"use client";

import React from "react";
import { UserRole } from "@/types";

interface DashboardHeaderProps {
  title: string;
  role: UserRole;
  user: {
    name: string;
    email: string;
    initials: string;
    detail?: string;
  };
  onOpenMobileNav: () => void;
}

export function DashboardHeader({
  title,
  role,
  user,
  onOpenMobileNav,
}: DashboardHeaderProps) {
  const roleLabels: Record<UserRole, string> = {
    student: "Student",
    instructor: "Instructor",
    admin: "Admin",
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur-xs dark:border-zinc-800 dark:bg-zinc-950/95 sm:px-6 lg:px-8">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100 lg:hidden"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </button>

        <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-lg">
          {title}
        </h1>
      </div>

      {/* Right: Authenticated User Info */}
      <div className="flex items-center gap-3 sm:gap-4">
        <span className="hidden rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 sm:inline-block">
          {roleLabels[role]}
        </span>

        {/* User initials & metadata */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-zinc-200 dark:border-zinc-800">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              {user.name}
            </p>
            {user.detail && (
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {user.detail}
              </p>
            )}
          </div>

          <div
            title={`${user.name} (${user.email})`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-medium text-white ring-2 ring-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:ring-zinc-800"
          >
            {user.initials}
          </div>
        </div>
      </div>
    </header>
  );
}
