"use client";

import { useTransition } from "react";
import { deleteMessageAction } from "@/lib/chat/actions";
import { ChatWindow } from "@/components/chat/chat-window";

interface Message {
  id: string;
  body: string;
  createdAt: Date | string;
  sender: { id: string; name: string; role: string };
}

interface StudentChatWindowProps {
  channelId: string;
  channelName: string;
  initialMessages: Message[];
  currentUserId: string;
}

export function StudentChatWindow({
  channelId,
  channelName,
  initialMessages,
  currentUserId,
}: StudentChatWindowProps) {
  const [, startTransition] = useTransition();

  async function handleDelete(messageId: string) {
    startTransition(async () => {
      await deleteMessageAction(messageId);
    });
  }

  return (
    <ChatWindow
      channelId={channelId}
      channelName={channelName}
      initialMessages={initialMessages}
      currentUserId={currentUserId}
      currentUserRole="STUDENT"
      onDeleteMessage={handleDelete}
    />
  );
}
