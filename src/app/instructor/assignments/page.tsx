import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { requireInstructor } from "@/lib/auth/session";
import { getManagementAssignments } from "@/lib/assignments/queries";

export const metadata = {
  title: "Assignments | Instructor Portal",
  description: "Create and manage track assignments, due dates, and problem prompts",
};

interface InstructorAssignmentsPageProps {
  searchParams: Promise<{ track?: string }>;
}

export default async function InstructorAssignmentsPage({
  searchParams,
}: InstructorAssignmentsPageProps) {
  const { track: trackFilter } = await searchParams;
  const user = await requireInstructor();

  const { assignments, tracks } = await getManagementAssignments(
    user.id,
    user.role,
    trackFilter
  );

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Track Assignments"
          description="Create problem sets, configure deadlines, and review student submission counts"
        />

        <Link
          href="/instructor/assignments/new"
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#171717] px-4 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-black"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Create Assignment</span>
        </Link>
      </div>

      {tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E7E3DA] bg-white p-12 text-center">
          <p className="text-xs text-[#737373]">
            You do not currently have any assigned tracks. Contact an administrator to receive track assignments.
          </p>
        </div>
      ) : (
        <>
          {tracks.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 border-b border-[#E7E3DA] pb-4">
              <span className="text-xs font-medium text-[#737373] mr-1">
                Filter:
              </span>
              <Link
                href="/instructor/assignments"
                className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  !trackFilter || trackFilter === "all"
                    ? "bg-[#171717] text-white"
                    : "border border-[#E7E3DA] bg-white text-[#737373] hover:text-[#171717] hover:bg-[#F7F4ED]"
                }`}
              >
                All Assigned Tracks
              </Link>
              {tracks.map((t) => (
                <Link
                  key={t.id}
                  href={`/instructor/assignments?track=${t.id}`}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    trackFilter === t.id
                      ? "bg-[#171717] text-white"
                      : "border border-[#E7E3DA] bg-white text-[#737373] hover:text-[#171717] hover:bg-[#F7F4ED]"
                  }`}
                >
                  {t.name} Track
                </Link>
              ))}
            </div>
          )}

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#171717]">
                All Assignments
              </h2>
              <span className="text-xs text-[#737373]">
                {assignments.length} {assignments.length === 1 ? "task" : "tasks"}
              </span>
            </div>

            {assignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E7E3DA] bg-white p-10 text-center">
                <p className="text-xs text-[#737373]">
                  No assignments created yet. Click &ldquo;Create Assignment&rdquo; above to publish one.
                </p>
              </div>
            ) : (
              <ScrollReveal mode="stagger" innerClassName="grid grid-cols-1 gap-4">
                {assignments.map((asg) => (
                  <div
                    key={asg.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#E7E3DA] bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-[#D4D0C8]"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {asg.track ? (
                          <Badge variant="neutral">{asg.track.name} Track</Badge>
                        ) : (
                          <Badge variant="warning">Shared (All Cohort)</Badge>
                        )}

                        <span className="text-xs text-[#E7E3DA]">•</span>
                        <span className="text-xs font-medium text-[#737373]">
                          Max: {asg.maxScore} pts
                        </span>

                        {asg.allowLateSubmission && (
                          <span className="text-[11px] text-[#737373] italic">
                            Late submissions allowed
                          </span>
                        )}
                      </div>

                      <div>
                        <Link
                          href={`/instructor/assignments/${asg.id}`}
                          className="text-base font-semibold text-[#171717] hover:underline"
                        >
                          {asg.title}
                        </Link>
                        <p className="mt-0.5 text-xs text-[#737373]">
                          Due: {dateFormatter.format(asg.dueAt)} at {timeFormatter.format(asg.dueAt)}
                        </p>
                      </div>

                      <p className="text-xs text-[#737373]">
                        <strong className="text-[#171717]">{asg.submissionCount}</strong> student submission{asg.submissionCount === 1 ? "" : "s"} recorded
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 pt-2 sm:pt-0">
                      <Link
                        href={`/instructor/grading?assignment=${asg.id}`}
                        className="inline-flex h-9 items-center justify-center rounded-xl bg-[#171717] px-3.5 text-xs font-semibold text-white shadow-2xs hover:bg-black transition-colors"
                      >
                        Grading Queue →
                      </Link>

                      <Link
                        href={`/instructor/assignments/${asg.id}`}
                        className="inline-flex h-9 items-center justify-center rounded-xl border border-[#E7E3DA] bg-white px-3.5 text-xs font-medium text-[#171717] hover:bg-[#F7F4ED] transition-colors"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                ))}
              </ScrollReveal>
            )}
          </section>
        </>
      )}
    </div>
  );
}
