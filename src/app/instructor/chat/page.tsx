import { requireInstructor } from "@/lib/auth/session";
import { getInstructorChannels } from "@/lib/chat/queries";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

export default async function InstructorChatPage() {
  const user = await requireInstructor();
  const channels = await getInstructorChannels(user.id);

  return (
    <div className="space-y-6">
      <PageHeader title="Chat" description="Chat with your students across assigned tracks." />

      {channels.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No chat channels available. You must be assigned to at least one track.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {channels.map((ch) => (
            <Link
              key={ch.id}
              href={`/instructor/chat/${ch.id}`}
              className="group flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-lg dark:bg-zinc-800">
                {ch.trackId ? "🎯" : "🌐"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  # {ch.name}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {ch.trackId ? "Track channel" : "General cohort channel"} ·{" "}
                  {ch._count.messages} messages
                </p>
              </div>
              <svg className="h-4 w-4 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
