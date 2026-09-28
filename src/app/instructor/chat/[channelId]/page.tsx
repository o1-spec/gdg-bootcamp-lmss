import { notFound } from "next/navigation";
import Link from "next/link";
import { requireInstructor } from "@/lib/auth/session";
import { getChannelIfAuthorized, getChannelMessages, getMutesForCohort } from "@/lib/chat/queries";
import { ModeratorChatWindow } from "./chat-client";

interface Props {
  params: Promise<{ channelId: string }>;
}

export default async function InstructorChannelPage({ params }: Props) {
  const { channelId } = await params;
  const user = await requireInstructor();

  const channel = await getChannelIfAuthorized(channelId, user.id, user.role);
  if (!channel) notFound();

  const [messages, mutes] = await Promise.all([
    getChannelMessages(channelId),
    getMutesForCohort(channel.cohortId),
  ]);

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 9rem)" }}>
      <Link
        href="/instructor/chat"
        className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        All channels
      </Link>

      <div className="flex-1 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <ModeratorChatWindow
          channelId={channelId}
          channelName={channel.name}
          cohortId={channel.cohortId}
          initialMessages={messages}
          initialMutes={mutes}
          currentUserId={user.id}
          currentUserRole="INSTRUCTOR"
          backHref="/instructor/chat"
        />
      </div>
    </div>
  );
}
