"use client";

/*
|--------------------------------------------------
| npm imports
|--------------------------------------------------
*/
import { useTransition } from "react";

/*
|--------------------------------------------------
| custom imports
|--------------------------------------------------
*/
import { deleteMessageAction } from "@/lib/chat/actions";
import { ChatWindow } from "@/components/chat/chat-window";

/*
|--------------------------------------------------
| types
|--------------------------------------------------
*/
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

/*
|----------------------------------------------------------------------------------------------------
| StudentChatWindow
|----------------------------------------------------------------------------------------------------
| Handler implementation for Student Chat Window.
*/
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
