import { requireAdmin } from "@/lib/auth/session";
import { getAllChannels } from "@/lib/chat/queries";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";

export default async function AdminChatPage() {
  await requireAdmin();
  const channels = await getAllChannels();

  return (
    <div className="space-y-6">
      <PageHeader title="Community Discussion Channels" description="Global oversight and moderation across all cohort and track channels" />

      {channels.length === 0 ? (
        <div className="rounded-2xl border border-[#E7E3DA] bg-white p-8 text-center">
          <p className="text-xs text-[#737373]">
            No channels exist yet. Channels are created automatically when students or instructors visit their chat pages.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {channels.map((ch) => (
            <Link
              key={ch.id}
              href={`/admin/chat/${ch.id}`}
              className="group flex items-center gap-4 rounded-2xl border border-[#E7E3DA] bg-white p-5 transition-all hover:border-[#171717]/30 hover:bg-[#F7F4ED]/40"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F7F4ED] text-base border border-[#E7E3DA]">
                {ch.trackId ? "🎯" : "🌐"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[#171717] truncate">
                    #{ch.name}
                  </p>
                  <Badge variant="neutral">
                    {ch.trackId ? "Track" : "General"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-[#737373]">
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
