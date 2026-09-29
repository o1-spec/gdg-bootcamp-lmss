"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { UserRole } from "@/types";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  role: UserRole;
  user: {
    name: string;
    email: string;
    initials: string;
    detail?: string;
  };
  unreadNotifications?: number;
  onOpenMobileNav: () => void;
}

export function DashboardHeader({
  title,
  subtitle,
  role,
  user,
  unreadNotifications = 0,
  onOpenMobileNav,
}: DashboardHeaderProps) {
  const roleLabels: Record<UserRole, string> = {
    student: "Student",
    instructor: "Instructor",
    admin: "Admin",
  };

  return (
    <header className="animate-fade-down sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#E7E3DA] bg-[#F7F4ED]/90 px-4 backdrop-blur-xs sm:px-6 lg:px-10">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E7E3DA] bg-white text-[#171717] hover:bg-[#EFECE4] transition-all duration-150 active:scale-90 lg:hidden"
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

        <div className="lg:hidden flex h-7 w-7 rounded-lg overflow-hidden shrink-0 border border-[#E7E3DA] bg-[#F7F4ED]">
          <Image
            src="/icon.png"
            alt="GDG Logo"
            width={28}
            height={28}
            className="h-full w-full object-cover"
          />
        </div>

        <div>
          <h1 className="text-base font-bold tracking-tight text-[#171717] sm:text-lg">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-[#737373] hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: Authenticated User Info & Actions */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Notifications Icon Link */}
        <Link
          href="/notifications"
          aria-label="View notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#E7E3DA] bg-white text-[#737373] hover:text-[#171717] hover:bg-[#EFECE4] transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
            />
          </svg>
          {unreadNotifications > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#EA4335] opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#EA4335]" />
            </span>
          )}
        </Link>

        {/* Role Pill */}
        <span className="hidden rounded-full border border-[#E7E3DA] bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#737373] sm:inline-block">
          {roleLabels[role]}
        </span>

        {/* User initials & profile metadata */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-[#E7E3DA]">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-semibold text-[#171717]">
              {user.name}
            </p>
            {user.detail && (
              <p className="text-[11px] text-[#737373]">
                {user.detail}
              </p>
            )}
          </div>

          <div
            title={`${user.name} (${user.email})`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#171717] text-xs font-semibold text-[#F7F4ED] ring-2 ring-white"
          >
            {user.initials}
          </div>
        </div>
      </div>
    </header>
  );
}
