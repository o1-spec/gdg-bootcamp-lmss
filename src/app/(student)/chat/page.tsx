import { requireStudent } from "@/lib/auth/session";
import { getStudentChannels } from "@/lib/chat/queries";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

export default async function StudentChatPage() {
  const user = await requireStudent();
  const channels = await getStudentChannels(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chat"
        description="Cohort discussions, questions, and track communications"
      />

      {channels.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E7E3DA] bg-white p-10 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7F4ED] text-[#737373]">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
            </svg>
          </div>
          <h4 className="mt-3 text-sm font-semibold text-[#171717]">No chat channels available</h4>
          <p className="mt-1 text-xs text-[#737373]">
            You will be automatically added to cohort channels once enrolled in an active track.
          </p>
        </div>
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2">
          {channels.map((ch) => (
            <Link
              key={ch.id}
              href={`/chat/${ch.id}`}
              className="group flex items-center gap-4 rounded-2xl border border-[#E7E3DA] bg-white p-4.5 shadow-xs transition-all hover:border-[#171717]/40 hover:bg-[#F7F4ED]/40"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F7F4ED] border border-[#E7E3DA] text-[#171717] font-bold text-sm">
                #
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[#171717]">
                    {ch.name}
                  </p>
                  <span className="rounded-md bg-[#F7F4ED] border border-[#E7E3DA] px-1.5 py-0.5 text-3xs font-medium text-[#737373]">
                    {ch.trackId ? "Track" : "Cohort"}
                  </span>
                </div>
                <p className="text-2xs text-[#737373] mt-0.5">
                  {ch._count.messages} {ch._count.messages === 1 ? "message" : "messages"}
                </p>
              </div>
              <svg
                className="h-4 w-4 shrink-0 text-[#737373] transition-transform group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
