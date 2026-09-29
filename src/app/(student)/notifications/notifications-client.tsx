"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { markReadAction, markAllReadAction } from "@/lib/notifications/actions";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  readAt: Date | string | null;
  createdAt: Date | string;
}

function renderNotificationIcon(type: string) {
  switch (type) {
    case "ASSIGNMENT":
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#4285F4]/10 text-[#4285F4]">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.09 1.976 1.053 1.976 2.188V18.75a2.25 2.25 0 0 1-2.25 2.25H6.75a2.25 2.25 0 0 1-2.25-2.25V6.108c0-1.135.845-2.098 1.976-2.188.374-.03.748-.057 1.124-.08" />
          </svg>
        </div>
      );
    case "GRADE_RELEASED":
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#34A853]/10 text-[#34A853]">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.004 0H9.496m5.004 0a3.75 3.75 0 0 0-.5-1.875 3.75 3.75 0 0 0-2-1.5m-3 3.375a3.75 3.75 0 0 1 .5-1.875 3.75 3.75 0 0 1 2-1.5m0 0V3.75" />
          </svg>
        </div>
      );
    case "ANNOUNCEMENT":
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FBBC04]/15 text-[#171717]">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
        </div>
      );
    case "CLASS":
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F7F4ED] text-[#171717] border border-[#E7E3DA]">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F7F4ED] text-[#737373] border border-[#E7E3DA]">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
        </div>
      );
  }
}

function formatRelative(date: Date | string) {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationsClient({
  initialNotifications,
}: {
  initialNotifications: Notification[];
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [, startTransition] = useTransition();

  const unread = notifications.filter((n) => !n.readAt).length;

  function markOneRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    );
    startTransition(async () => {
      await markReadAction(id);
    });
  }

  function markAllRead() {
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? now })));
    startTransition(async () => {
      await markAllReadAction();
    });
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#737373]">
          {unread > 0 ? (
            <span className="font-semibold text-[#171717]">{unread} unread</span>
          ) : (
            "All caught up"
          )}
        </p>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs font-medium text-[#737373] hover:text-[#171717] transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* List */}
      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E7E3DA] bg-white p-10 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7F4ED] text-[#737373]">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
          </div>
          <h4 className="mt-3 text-sm font-semibold text-[#171717]">No notifications yet</h4>
          <p className="mt-1 text-xs text-[#737373]">
            We&apos;ll notify you when assignments are posted, sessions begin, or grades are released.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[#E7E3DA] rounded-2xl border border-[#E7E3DA] bg-white overflow-hidden shadow-xs">
          {notifications.map((n) => {
            const isUnread = !n.readAt;

            const inner = (
              <div
                className={`flex items-start gap-3.5 px-4 py-3.5 transition-colors ${
                  isUnread
                    ? "bg-[#F7F4ED]/50"
                    : "hover:bg-[#F7F4ED]/30"
                }`}
              >
                {renderNotificationIcon(n.type)}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-xs font-semibold ${isUnread ? "text-[#171717]" : "text-[#737373]"}`}>
                      {n.title}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-2xs text-[#737373] whitespace-nowrap">
                        {formatRelative(n.createdAt)}
                      </span>
                      {isUnread && (
                        <button
                          onClick={(e) => { e.preventDefault(); markOneRead(n.id); }}
                          className="h-2 w-2 rounded-full bg-[#4285F4] hover:bg-[#4285F4]/80 transition-colors"
                          aria-label="Mark as read"
                        />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-[#737373] mt-0.5 leading-relaxed">{n.body}</p>
                </div>
              </div>
            );

            return (
              <li key={n.id}>
                {n.link ? (
                  <Link href={n.link} onClick={() => isUnread && markOneRead(n.id)}>
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
