"use client";

import { useState, useTransition } from "react";
import { deleteMessageAction, muteUserAction, unmuteUserAction } from "@/lib/chat/actions";
import { ChatWindow } from "@/components/chat/chat-window";

interface Mute {
  id: string;
  user: { id: string; name: string; email: string };
  mutedBy: { id: string; name: string };
  reason: string | null;
  expiresAt: Date | string | null;
}

interface Message {
  id: string;
  body: string;
  createdAt: Date | string;
  sender: { id: string; name: string; role: string };
}

interface ModeratorChatWindowProps {
  channelId: string;
  channelName: string;
  cohortId: string;
  initialMessages: Message[];
  initialMutes: Mute[];
  currentUserId: string;
  currentUserRole: string;
  backHref: string;
}

export function ModeratorChatWindow({
  channelId,
  channelName,
  cohortId,
  initialMessages,
  initialMutes,
  currentUserId,
  currentUserRole,
}: ModeratorChatWindowProps) {
  const [mutes, setMutes] = useState(initialMutes);
  const [showMutePanel, setShowMutePanel] = useState(false);
  const [muteUserId, setMuteUserId] = useState("");
  const [muteReason, setMuteReason] = useState("");
  const [muteError, setMuteError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function handleDelete(messageId: string) {
    startTransition(async () => {
      await deleteMessageAction(messageId);
    });
  }

  async function handleMute() {
    if (!muteUserId.trim()) return;
    setMuteError(null);
    startTransition(async () => {
      const res = await muteUserAction(muteUserId.trim(), cohortId, null, muteReason || undefined);
      if (res.success) {
        setMuteUserId("");
        setMuteReason("");
        setShowMutePanel(false);
      } else {
        setMuteError(res.error ?? "Failed to mute.");
      }
    });
  }

  async function handleUnmute(userId: string) {
    startTransition(async () => {
      await unmuteUserAction(userId, cohortId);
      setMutes((prev) => prev.filter((m) => m.user.id !== userId));
    });
  }

  return (
    <div className="flex h-full">
      {/* Main chat */}
      <div className="flex-1 overflow-hidden">
        <ChatWindow
          channelId={channelId}
          channelName={channelName}
          initialMessages={initialMessages}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onDeleteMessage={handleDelete}
        />
      </div>

      {/* Moderation panel toggle */}
      <div className="shrink-0 w-64 border-l border-zinc-200 dark:border-zinc-800 overflow-y-auto">
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setShowMutePanel(!showMutePanel)}
            className="w-full rounded-lg bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {showMutePanel ? "↑ Hide" : "🔇 Mute user"}
          </button>
        </div>

        {showMutePanel && (
          <div className="p-3 space-y-2 border-b border-zinc-200 dark:border-zinc-800">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Mute user
            </p>
            {muteError && (
              <p className="text-[11px] text-red-600 dark:text-red-400">{muteError}</p>
            )}
            <input
              type="text"
              value={muteUserId}
              onChange={(e) => setMuteUserId(e.target.value)}
              placeholder="User ID"
              className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
            />
            <input
              type="text"
              value={muteReason}
              onChange={(e) => setMuteReason(e.target.value)}
              placeholder="Reason (optional)"
              className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button
              onClick={handleMute}
              className="w-full rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
            >
              Mute
            </button>
          </div>
        )}

        {/* Active mutes */}
        <div className="p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            Active mutes ({mutes.length})
          </p>
          {mutes.length === 0 ? (
            <p className="text-xs text-zinc-400">No active mutes.</p>
          ) : (
            <ul className="space-y-2">
              {mutes.map((m) => (
                <li
                  key={m.id}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-2 text-xs"
                >
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200">{m.user.name}</p>
                  <p className="text-zinc-500">{m.user.email}</p>
                  {m.reason && <p className="text-zinc-400 italic mt-0.5">{m.reason}</p>}
                  <button
                    onClick={() => handleUnmute(m.user.id)}
                    className="mt-1.5 rounded px-2 py-0.5 text-[10px] font-semibold text-green-700 bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-400 dark:hover:bg-green-900/40"
                  >
                    Unmute
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
