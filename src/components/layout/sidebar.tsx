"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserRole } from "@/types";

interface SidebarProps {
  role: UserRole;
  isOpen: boolean;
  onClose: () => void;
  unreadNotifications?: number;
}

interface NavItem {
  name: string;
  href: string;
  icon: (props: { className?: string }) => React.JSX.Element;
}

// Icons (Zero packages, accessible inline SVG)
const HomeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const VideoIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
  </svg>
);

const CalendarCheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.253M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
  </svg>
);

const FileTextIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
  </svg>
);

const ChartBarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
  </svg>
);

const BellIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
  </svg>
);

const ChatIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
  </svg>
);

const CheckBadgeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
  </svg>
);

const ClipboardCheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-3 2.25 2.25L15 13.5" />
  </svg>
);

const LayersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 9.75 5.25 9.75-5.25M2.25 12l9.75 5.25 9.75-5.25M2.25 8.25l9.75 5.25 9.75-5.25L12 3 2.25 8.25Z" />
  </svg>
);

const FolderIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
  </svg>
);

const IdentificationIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.364a4.125 4.125 0 0 0-6.338 0 .75.75 0 0 0 .544 1.261h5.25a.75.75 0 0 0 .544-1.261Z" />
  </svg>
);

const UserPlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.765Z" />
  </svg>
);

const ShieldCheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
  </svg>
);

const AcademicCapIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
  </svg>
);

// Navigation Configs per Role
const studentNavItems: NavItem[] = [
  { name: "Overview", href: "/dashboard", icon: HomeIcon },
  { name: "Classes", href: "/classes", icon: VideoIcon },
  { name: "Attendance", href: "/attendance", icon: CalendarCheckIcon },
  { name: "Assignments", href: "/assignments", icon: FileTextIcon },
  { name: "Progress", href: "/progress", icon: ChartBarIcon },
  { name: "Announcements", href: "/announcements", icon: BellIcon },
  { name: "Chat", href: "/chat", icon: ChatIcon },
  { name: "Notifications", href: "/notifications", icon: BellIcon },
];

const instructorNavItems: NavItem[] = [
  { name: "Overview", href: "/instructor/dashboard", icon: HomeIcon },
  { name: "Students", href: "/instructor/students", icon: UsersIcon },
  { name: "Classes", href: "/instructor/classes", icon: VideoIcon },
  { name: "Attendance", href: "/instructor/attendance", icon: CalendarCheckIcon },
  { name: "Excuses", href: "/instructor/excuses", icon: ClipboardCheckIcon },
  { name: "Assignments", href: "/instructor/assignments", icon: FileTextIcon },
  { name: "Grading", href: "/instructor/grading", icon: CheckBadgeIcon },
  { name: "Progress", href: "/instructor/progress", icon: ChartBarIcon },
  { name: "Chat", href: "/instructor/chat", icon: ChatIcon },
  { name: "Announcements", href: "/instructor/announcements", icon: BellIcon },
];

const adminNavItems: NavItem[] = [
  { name: "Overview", href: "/admin/dashboard", icon: HomeIcon },
  { name: "Classes", href: "/admin/classes", icon: VideoIcon },
  { name: "Attendance", href: "/admin/attendance", icon: CalendarCheckIcon },
  { name: "Excuses", href: "/admin/excuses", icon: ClipboardCheckIcon },
  { name: "Assignments", href: "/admin/assignments", icon: FileTextIcon },
  { name: "Grading", href: "/admin/grading", icon: CheckBadgeIcon },
  { name: "Progress", href: "/admin/progress", icon: ChartBarIcon },
  { name: "Completion", href: "/admin/completion", icon: AcademicCapIcon },
  { name: "Certificates", href: "/admin/certificates", icon: CheckBadgeIcon },
  { name: "Chat", href: "/admin/chat", icon: ChatIcon },
  { name: "Cohorts", href: "/admin/cohorts", icon: FolderIcon },
  { name: "Tracks", href: "/admin/tracks", icon: LayersIcon },
  { name: "Students", href: "/admin/students", icon: UsersIcon },
  { name: "Instructors", href: "/admin/instructors", icon: IdentificationIcon },
  { name: "Enrollments", href: "/admin/enrollments", icon: UserPlusIcon },
  { name: "Audit Log", href: "/admin/audit-log", icon: ShieldCheckIcon },
  { name: "Announcements", href: "/admin/announcements", icon: BellIcon },
];

export function Sidebar({ role, isOpen, onClose, unreadNotifications = 0 }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems =
    role === "admin"
      ? adminNavItems
      : role === "instructor"
      ? instructorNavItems
      : studentNavItems;

  const roleLabel =
    role === "admin"
      ? "Admin"
      : role === "instructor"
      ? "Instructor"
      : "Student";

  const renderNavLinks = () => (
    <div className="flex flex-1 flex-col justify-between">
      {/* Primary Navigation Section */}
      <div className="space-y-1">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          Navigation
        </p>

        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              item.href !== "/instructor/dashboard" &&
              item.href !== "/admin/dashboard" &&
              pathname.startsWith(item.href));

          const isNotificationItem = item.href === "/notifications";
          const showBadge = isNotificationItem && unreadNotifications > 0;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-[#262626] font-semibold text-white shadow-2xs"
                  : "text-zinc-400 hover:bg-[#262626]/50 hover:text-zinc-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive
                      ? "text-white"
                      : "text-zinc-500 group-hover:text-zinc-300"
                  }`}
                />
                <span>{item.name}</span>
              </div>

              {showBadge && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EA4335] px-1.5 text-[10px] font-bold text-white">
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom Account & System Section */}
      <div className="mt-8 space-y-3 pt-4 border-t border-[#262626]">
        <button
          type="button"
          onClick={async () => {
            onClose();
            try {
              await fetch("/api/auth/logout", { method: "POST" });
            } finally {
              router.push("/login");
              router.refresh();
            }
          }}
          className="group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-red-950/20 hover:text-red-400"
        >
          <svg
            className="h-4 w-4 shrink-0 text-zinc-500 group-hover:text-red-400 transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
            />
          </svg>
          <span>Sign Out</span>
        </button>

        <div className="px-3 pt-2 text-[11px] text-zinc-600 font-mono flex items-center justify-between">
          <span>Bootcamp LMS</span>
          <span>v1.0</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Charcoal #171717) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[#262626] bg-[#171717] text-white lg:flex sticky top-0 h-screen">
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-[#262626] px-6">
          <div className="flex items-center gap-2.5">
            {/* 4 Accent Dots */}
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#4285F4]" aria-hidden="true" />
              <span className="h-2 w-2 rounded-full bg-[#EA4335]" aria-hidden="true" />
              <span className="h-2 w-2 rounded-full bg-[#FBBC04]" aria-hidden="true" />
              <span className="h-2 w-2 rounded-full bg-[#34A853]" aria-hidden="true" />
            </div>
            <span className="text-xs font-semibold tracking-wider uppercase text-zinc-200">
              Bootcamp LMS
            </span>
          </div>

          <span className="rounded-md border border-[#333333] bg-[#262626]/70 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
            {roleLabel}
          </span>
        </div>

        {/* Navigation List */}
        <nav className="flex flex-1 flex-col p-4 overflow-y-auto">{renderNavLinks()}</nav>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Content */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[#262626] bg-[#171717] text-white transition-transform duration-200 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-[#262626] px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#4285F4]" aria-hidden="true" />
              <span className="h-2 w-2 rounded-full bg-[#EA4335]" aria-hidden="true" />
              <span className="h-2 w-2 rounded-full bg-[#FBBC04]" aria-hidden="true" />
              <span className="h-2 w-2 rounded-full bg-[#34A853]" aria-hidden="true" />
            </div>
            <span className="text-xs font-semibold tracking-wider uppercase text-zinc-200">
              Bootcamp LMS
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-[#262626] hover:text-white"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-1 flex-col p-4 overflow-y-auto">{renderNavLinks()}</nav>
      </aside>
    </>
  );
}
