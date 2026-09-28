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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          # {channelName}
        </h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="text-3xl mb-3">💬</div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              No messages yet
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Be the first to say something in #{channelName}
            </p>
          </div>
        )}

        {groupedMessages.map(({ msg, showDate, dateLabel }) => {
          const isOwn = msg.sender.id === currentUserId;

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                  <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    {dateLabel}
                  </span>
                  <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                </div>
              )}

              <div className={`group flex items-start gap-2.5 ${isOwn ? "flex-row-reverse" : ""}`}>
                {/* Avatar */}
                <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase">
                  {msg.sender.name[0]}
                </div>

                <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                  <div className="flex items-baseline gap-1.5 mb-0.5">
                    {!isOwn && (
                      <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                        {msg.sender.name}
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-400">{formatTime(msg.createdAt)}</span>
                  </div>

                  <div className="relative">
                    <div
                      className={`rounded-2xl px-3 py-2 text-xs leading-relaxed break-words ${
                        isOwn
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-tr-sm"
                          : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 rounded-tl-sm"
                      }`}
                    >
                      {msg.body}
                    </div>

                    {/* Delete button for moderators / own messages */}
                    {onDeleteMessage && (isOwn || currentUserRole !== "STUDENT") && (
                      <button
                        onClick={() => onDeleteMessage(msg.id)}
                        className="absolute -top-1 right-0 opacity-0 group-hover:opacity-100 transition-opacity rounded px-1 py-0.5 text-[10px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
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
      <div className="shrink-0 border-t border-zinc-200 dark:border-zinc-800 px-4 py-3">
        {error && (
          <p className="text-[11px] text-red-600 dark:text-red-400 mb-2">{error}</p>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={`Message #${channelName}`}
            maxLength={2000}
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
          <button
            onClick={handleSend}
            disabled={isPending || !body.trim()}
            className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
