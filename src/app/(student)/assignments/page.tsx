import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { requireStudent } from "@/lib/auth/session";
import { getStudentAssignments } from "@/lib/assignments/queries";
import { AssignmentCard } from "@/components/assignments/assignment-card";

export const metadata = {
  title: "Assignments | Student Portal",
  description: "View problem prompts, submit work, and access instructor code feedback",
};

export default async function StudentAssignmentsPage() {
  const user = await requireStudent();
  const { upcoming, submitted, pastDue } = await getStudentAssignments(user.id);

  const totalAssigned = upcoming.length + submitted.length + pastDue.length;
  const gradedReleased = submitted.filter((s) => s.status === "GRADE_RELEASED");
  const avgScore =
    gradedReleased.length > 0
      ? Math.round(
          gradedReleased.reduce(
            (acc, curr) =>
              acc +
              ((curr.submission?.score || 0) / curr.maxScore) * 100,
            0
          ) / gradedReleased.length
        )
      : null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Assignments & Lab Exercises"
        description="Submit algorithm solutions, verify due dates, and view instructor code feedback"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Assignments Completed"
          value={`${submitted.length} / ${totalAssigned}`}
          subtitle={`${upcoming.length} upcoming task${upcoming.length === 1 ? "" : "s"}`}
          badge={{
            text:
              totalAssigned > 0
                ? `${Math.round((submitted.length / totalAssigned) * 100)}% Done`
                : "100%",
            variant: "info",
          }}
        />
        <StatCard
          title="Average Score"
          value={avgScore !== null ? `${avgScore}%` : "Pending"}
          subtitle={
            gradedReleased.length > 0
              ? `Across ${gradedReleased.length} released grade${gradedReleased.length === 1 ? "" : "s"}`
              : "Awaiting grade release"
          }
          badge={{
            text: avgScore && avgScore >= 90 ? "Excellent" : "In Progress",
            variant: avgScore && avgScore >= 90 ? "success" : "neutral",
          }}
        />
        <StatCard
          title="Past Due / Missing"
          value={pastDue.length}
          subtitle="Unsubmitted overdue tasks"
          badge={{
            text: pastDue.length === 0 ? "Zero Missing" : "Action Required",
            variant: pastDue.length === 0 ? "success" : "danger",
          }}
        />
      </div>

      {/* Due Soon / Upcoming Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-[#E7E3DA]">
          <h3 className="text-base font-bold tracking-tight text-[#171717]">
            Due Soon & In Progress
          </h3>
          <span className="text-xs text-[#737373]">
            {upcoming.length} pending
          </span>
        </div>

        {upcoming.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {upcoming.map((asg) => (
              <AssignmentCard
                key={asg.id}
                assignment={asg}
                basePath="/assignments"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E7E3DA] bg-white p-8 text-center shadow-2xs">
            <p className="text-xs text-[#737373]">
              No upcoming assignments. You are all caught up!
            </p>
          </div>
        )}
      </section>

      {/* Submitted Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-[#E7E3DA]">
          <h3 className="text-base font-bold tracking-tight text-[#171717]">
            Submitted Work
          </h3>
          <span className="text-xs text-[#737373]">
            {submitted.length} submitted
          </span>
        </div>

        {submitted.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {submitted.map((asg) => (
              <AssignmentCard
                key={asg.id}
                assignment={asg}
                basePath="/assignments"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E7E3DA] bg-white p-8 text-center shadow-2xs">
            <p className="text-xs text-[#737373]">
              No submitted assignments yet.
            </p>
          </div>
        )}
      </section>

      {/* Past Due Section */}
      {pastDue.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-[#E7E3DA]">
            <h3 className="text-base font-bold tracking-tight text-[#171717]">
              Past Due (Unsubmitted)
            </h3>
            <span className="text-xs text-[#EA4335] font-semibold">
              {pastDue.length} missed
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {pastDue.map((asg) => (
              <AssignmentCard
                key={asg.id}
                assignment={asg}
                basePath="/assignments"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
