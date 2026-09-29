"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { sendMessageAction } from "@/lib/chat/actions";

interface Message {
  id: string;
  body: string;
  createdAt: Date | string;
  sender: { id: string; name: string; role: string };
}

interface ChatWindowProps {
  channelId: string;
  channelName: string;
  initialMessages: Message[];
  currentUserId: string;
  currentUserRole: string;
  onDeleteMessage?: (messageId: string) => Promise<void>;
}

function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(date: Date | string) {
  const d = new Date(date);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ChatWindow({
  channelId,
  channelName,
  initialMessages,
  currentUserId,
  currentUserRole,
  onDeleteMessage,
}: ChatWindowProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Poll for new messages every 8 seconds
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/${channelId}/messages`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages);
        }
      } catch {
        // Network error — stay on stale messages
      }
    }, 8000);
    return () => clearInterval(id);
  }, [channelId]);

  function handleSend() {
    const trimmed = body.trim();
    if (!trimmed) return;
    setError(null);

    startTransition(async () => {
      const result = await sendMessageAction(channelId, trimmed);
      if (result.success) {
        setBody("");
        // Optimistically add
        setMessages((prev) => [
          ...prev,
          {
            id: `optimistic-${Date.now()}`,
            body: trimmed,
            createdAt: new Date(),
            sender: { id: currentUserId, name: "You", role: currentUserRole },
          },
        ]);
      } else {
        setError(result.error ?? "Failed to send.");
      }
    });
  }

  // Pre-compute date group labels to avoid mutation inside render
  const groupedMessages = messages.reduce<
    { msg: typeof messages[number]; showDate: boolean; dateLabel: string }[]
  >((acc, msg) => {
    const dateLabel = formatDate(msg.createdAt);
    const prev = acc[acc.length - 1];
    const showDate = !prev || prev.dateLabel !== dateLabel;
    acc.push({ msg, showDate, dateLabel });
    return acc;
  }, []);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="shrink-0 border-b border-[#E7E3DA] px-5 py-3.5 bg-white">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#171717]">#</span>
          <h2 className="text-sm font-semibold text-[#171717]">
            {channelName}
          </h2>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7F4ED] text-[#737373] mb-3">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-[#171717]">
              No messages yet
            </p>
            <p className="text-2xs text-[#737373] mt-1">
              Be the first to post a message in #{channelName}
            </p>
          </div>
        )}

        {groupedMessages.map(({ msg, showDate, dateLabel }) => {
          const isOwn = msg.sender.id === currentUserId;

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-[#E7E3DA]" />
                  <span className="text-3xs font-medium text-[#737373] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F7F4ED] border border-[#E7E3DA]">
                    {dateLabel}
                  </span>
                  <div className="flex-1 h-px bg-[#E7E3DA]" />
                </div>
              )}

              <div className={`group flex items-start gap-2.5 ${isOwn ? "flex-row-reverse" : ""}`}>
                {/* Avatar */}
                <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-xl bg-[#F7F4ED] border border-[#E7E3DA] text-2xs font-bold text-[#171717] uppercase">
                  {msg.sender.name[0]}
                </div>

                <div className={`max-w-[78%] sm:max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                  <div className="flex items-baseline gap-1.5 mb-1 px-1">
                    {!isOwn && (
                      <span className="text-2xs font-semibold text-[#171717]">
                        {msg.sender.name}
                      </span>
                    )}
                    <span className="text-3xs text-[#737373]">{formatTime(msg.createdAt)}</span>
                  </div>

                  <div className="relative group/bubble">
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed break-words ${isOwn
                          ? "bg-[#171717] text-white rounded-tr-xs shadow-xs"
                          : "bg-[#F7F4ED]/80 text-[#171717] border border-[#E7E3DA] rounded-tl-xs"
                        }`}
                    >
                      {msg.body}
                    </div>

                    {/* Delete button for moderators / own messages */}
                    {onDeleteMessage && (isOwn || currentUserRole !== "STUDENT") && (
                      <button
                        onClick={() => onDeleteMessage(msg.id)}
                        className="absolute -top-2 right-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity rounded-md bg-white border border-[#E7E3DA] px-1.5 py-0.5 text-3xs text-[#EA4335] hover:bg-[#F7F4ED] shadow-xs"
                        aria-label="Delete message"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-[#E7E3DA] px-4 sm:px-6 py-3.5 bg-white">
        {error && (
          <p className="text-xs text-[#EA4335] mb-2">{error}</p>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={`Message #${channelName}`}
            maxLength={2000}
            className="flex-1 rounded-xl border border-[#E7E3DA] bg-white px-3.5 py-2 text-xs text-[#171717] placeholder-[#737373] focus:border-[#171717] focus:outline-hidden"
          />
          <button
            onClick={handleSend}
            disabled={isPending || !body.trim()}
            className="rounded-xl bg-[#171717] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-black disabled:opacity-40 shadow-xs"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
