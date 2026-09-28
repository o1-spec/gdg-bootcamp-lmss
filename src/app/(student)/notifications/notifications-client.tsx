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

const typeIcon: Record<string, string> = {
  ASSIGNMENT: "📋",
  GRADE_RELEASED: "🏆",
  ANNOUNCEMENT: "📢",
  CLASS: "🎓",
};

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
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {unread > 0 ? (
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{unread} unread</span>
          ) : (
            "All caught up!"
          )}
        </p>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 underline-offset-2 hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* List */}
      {notifications.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-3xl mb-3">🔔</p>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No notifications yet</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            We&apos;ll notify you when assignments are posted or grades are released.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
          {notifications.map((n) => {
            const isUnread = !n.readAt;
            const icon = typeIcon[n.type] ?? "🔔";

            const inner = (
              <div
                className={`flex items-start gap-3 px-4 py-3.5 transition-colors ${
                  isUnread
                    ? "bg-blue-50/50 dark:bg-blue-950/10"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                }`}
              >
                <span className="mt-0.5 text-lg shrink-0">{icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-xs font-semibold ${isUnread ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-700 dark:text-zinc-300"}`}>
                      {n.title}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-[10px] text-zinc-400 whitespace-nowrap">
                        {formatRelative(n.createdAt)}
                      </span>
                      {isUnread && (
                        <button
                          onClick={(e) => { e.preventDefault(); markOneRead(n.id); }}
                          className="h-1.5 w-1.5 rounded-full bg-blue-500 hover:bg-blue-700 transition-colors"
                          aria-label="Mark as read"
                        />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{n.body}</p>
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
