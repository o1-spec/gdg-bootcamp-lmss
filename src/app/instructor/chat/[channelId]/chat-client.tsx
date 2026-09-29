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
      <div className="shrink-0 w-64 border-l border-[#E7E3DA] bg-white overflow-y-auto">
        <div className="p-3 border-b border-[#E7E3DA]">
          <button
            type="button"
            onClick={() => setShowMutePanel(!showMutePanel)}
            className="w-full rounded-xl border border-[#E7E3DA] bg-[#F7F4ED] px-3 py-2 text-xs font-semibold text-[#171717] hover:bg-[#E7E3DA]/50 transition-colors"
          >
            {showMutePanel ? "↑ Hide Mute Panel" : "🔇 Mute User"}
          </button>
        </div>

        {showMutePanel && (
          <div className="p-3.5 space-y-2.5 border-b border-[#E7E3DA] bg-[#F7F4ED]/40">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">
              Mute User
            </p>
            {muteError && (
              <p className="text-[11px] text-[#EA4335]">{muteError}</p>
            )}
            <input
              type="text"
              value={muteUserId}
              onChange={(e) => setMuteUserId(e.target.value)}
              placeholder="User ID"
              className="w-full h-10 rounded-xl border border-[#E7E3DA] bg-white px-3 text-xs text-[#171717] focus:border-[#171717] focus:outline-hidden"
            />
            <input
              type="text"
              value={muteReason}
              onChange={(e) => setMuteReason(e.target.value)}
              placeholder="Reason (optional)"
              className="w-full h-10 rounded-xl border border-[#E7E3DA] bg-white px-3 text-xs text-[#171717] focus:border-[#171717] focus:outline-hidden"
            />
            <button
              type="button"
              onClick={handleMute}
              className="w-full rounded-xl bg-[#EA4335] px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors shadow-2xs"
            >
              Confirm Mute
            </button>
          </div>
        )}

        {/* Active mutes */}
        <div className="p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#737373] mb-2.5">
            Active Mutes ({mutes.length})
          </p>
          {mutes.length === 0 ? (
            <p className="text-xs text-[#737373]">No active mutes.</p>
          ) : (
            <ul className="space-y-2">
              {mutes.map((m) => (
                <li
                  key={m.id}
                  className="rounded-xl border border-[#E7E3DA] bg-[#F7F4ED]/40 p-2.5 text-xs"
                >
                  <p className="font-semibold text-[#171717]">{m.user.name}</p>
                  <p className="text-2xs text-[#737373]">{m.user.email}</p>
                  {m.reason && <p className="text-2xs text-[#737373] italic mt-1">{m.reason}</p>}
                  <button
                    type="button"
                    onClick={() => handleUnmute(m.user.id)}
                    className="mt-2 rounded-lg border border-[#34A853]/30 bg-green-50 px-2.5 py-1 text-2xs font-semibold text-[#34A853] hover:bg-green-100 transition-colors"
                  >
                    Unmute User
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
