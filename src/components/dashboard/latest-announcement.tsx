import React from "react";
import Link from "next/link";
import { Announcement } from "@/types";

interface LatestAnnouncementProps {
  announcement: Announcement;
}

export function LatestAnnouncement({ announcement }: LatestAnnouncementProps) {
  return (
    <div className="rounded-2xl border border-[#E7E3DA] bg-white p-6 shadow-2xs">
      <div className="flex items-center justify-between pb-4 border-b border-[#E7E3DA]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F7F4ED] border border-[#E7E3DA]">
            <svg
              className="h-3.5 w-3.5 text-[#171717]"
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
          <div>
            <h3 className="text-base font-bold tracking-tight text-[#171717]">
              Announcement
            </h3>
          </div>
          {announcement.isPinned && (
            <span className="rounded-full bg-[#FBBC04]/15 px-2 py-0.5 text-[10px] font-medium text-[#996500] border border-[#FBBC04]/30">
              Pinned
            </span>
          )}
        </div>

        <Link
          href="/announcements"
          className="text-xs font-semibold text-[#171717] hover:underline"
        >
          View all
        </Link>
      </div>

      <div className="mt-4 space-y-2">
        <h4 className="text-sm font-semibold text-[#171717]">
          {announcement.title}
        </h4>
        <p className="text-xs leading-relaxed text-[#737373] line-clamp-3">
          {announcement.content}
        </p>
        <div className="pt-2 text-[11px] text-[#737373] border-t border-[#E7E3DA]/60">
          Posted by {announcement.author.name}
          {announcement.author.role ? ` (${announcement.author.role})` : ""} •{" "}
          {announcement.date}
        </div>
      </div>
    </div>
  );
}
