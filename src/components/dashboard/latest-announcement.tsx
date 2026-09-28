import React from "react";
import Link from "next/link";
import { Announcement } from "@/types";

interface LatestAnnouncementProps {
  announcement: Announcement;
}

export function LatestAnnouncement({ announcement }: LatestAnnouncementProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-900">
            <svg
              className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400"
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
          </div>
          <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Latest Announcement
          </h3>
          {announcement.isPinned && (
            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
              Pinned
            </span>
          )}
        </div>

        <Link
          href="/announcements"
          className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          View all
        </Link>
      </div>

      <div className="mt-2 space-y-2">
        <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 sm:text-sm">
          {announcement.title}
        </h4>
        <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          {announcement.content}
        </p>
        <div className="pt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
          Posted by {announcement.author.name} ({announcement.author.role}) •{" "}
          {announcement.date}
        </div>
      </div>
    </div>
  );
}
