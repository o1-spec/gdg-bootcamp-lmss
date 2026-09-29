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
        <div className="rounded-2xl border border-dashed border-[#E7E3DA] bg-white p-10 text-center">
          <p className="text-xs text-[#737373]">
            No chat channels available. You must be assigned to at least one track.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {channels.map((ch) => (
            <Link
              key={ch.id}
              href={`/instructor/chat/${ch.id}`}
              className="group flex items-center gap-4 rounded-2xl border border-[#E7E3DA] bg-white p-5 transition-colors hover:border-[#171717]/30 hover:bg-[#F7F4ED]/40 shadow-2xs"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F7F4ED] text-lg border border-[#E7E3DA]">
                {ch.trackId ? "🎯" : "🌐"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#171717]">
                  # {ch.name}
                </p>
                <p className="text-xs text-[#737373] mt-0.5">
                  {ch.trackId ? "Track channel" : "General cohort channel"} ·{" "}
                  {ch._count.messages} messages
                </p>
              </div>
              <svg className="h-4 w-4 shrink-0 text-[#737373] transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
