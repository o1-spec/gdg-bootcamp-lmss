import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth/session";
import { getAuditLogs, getAuditLogActions } from "@/lib/audit/queries";
import { db } from "@/lib/db";
import Link from "next/link";

export const metadata = {
  title: "Audit Log | Admin Console",
};

interface AuditLogPageProps {
  searchParams: Promise<{
    action?: string;
    actorId?: string;
    targetType?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function AdminAuditLogPage({
  searchParams,
}: AuditLogPageProps) {
  await requireAdmin();
  const filters = await searchParams;

  const [logs, actionStats, actors, targetTypes] = await Promise.all([
    getAuditLogs({
      action: filters.action !== "ALL" ? filters.action : undefined,
      actorId: filters.actorId !== "ALL" ? filters.actorId : undefined,
      targetType: filters.targetType !== "ALL" ? filters.targetType : undefined,
      from: filters.from,
      to: filters.to,
    }),
    getAuditLogActions(),
    db.user.findMany({
      where: { auditLogs: { some: {} } },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
    db.auditLog.groupBy({
      by: ["targetType"],
      _count: { targetType: true },
    }),
  ]);

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="Immutable record of administrative, instructor, and student sensitive actions"
      />

      {/* Filter Controls */}
      <form
        method="GET"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 rounded-2xl border border-[#E7E3DA] bg-white p-4 text-xs"
      >
        <div>
          <label className="block text-[11px] font-semibold text-[#737373] uppercase tracking-wider mb-1">
            Action
          </label>
          <select
            name="action"
            defaultValue={filters.action || "ALL"}
            aria-label="Filter by action"
            className="w-full h-10 rounded-xl border border-[#E7E3DA] bg-white px-3 text-xs text-[#171717] focus:outline-hidden focus:ring-2 focus:ring-[#171717]"
          >
            <option value="ALL">All Actions ({actionStats.reduce((a, b) => a + b.count, 0)})</option>
            {actionStats.map((a) => (
              <option key={a.action} value={a.action}>
                {a.action} ({a.count})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[#737373] uppercase tracking-wider mb-1">
            Actor
          </label>
          <select
            name="actorId"
            defaultValue={filters.actorId || "ALL"}
            aria-label="Filter by actor"
            className="w-full h-10 rounded-xl border border-[#E7E3DA] bg-white px-3 text-xs text-[#171717] focus:outline-hidden focus:ring-2 focus:ring-[#171717]"
          >
            <option value="ALL">All Actors</option>
            {actors.map((act) => (
              <option key={act.id} value={act.id}>
                {act.name} ({act.role})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[#737373] uppercase tracking-wider mb-1">
            Target Type
          </label>
          <select
            name="targetType"
            defaultValue={filters.targetType || "ALL"}
            aria-label="Filter by target type"
            className="w-full h-10 rounded-xl border border-[#E7E3DA] bg-white px-3 text-xs text-[#171717] focus:outline-hidden focus:ring-2 focus:ring-[#171717]"
          >
            <option value="ALL">All Targets</option>
            {targetTypes.map((tt) => (
              <option key={tt.targetType} value={tt.targetType}>
                {tt.targetType} ({tt._count.targetType})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[#737373] uppercase tracking-wider mb-1">
            Date From
          </label>
          <input
            type="date"
            name="from"
            defaultValue={filters.from || ""}
            aria-label="Filter date from"
            className="w-full h-10 rounded-xl border border-[#E7E3DA] bg-white px-3 text-xs text-[#171717] focus:outline-hidden focus:ring-2 focus:ring-[#171717]"
          />
        </div>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="w-full h-10 rounded-xl bg-[#171717] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#171717]/90 cursor-pointer"
          >
            Apply Filters
          </button>
          <Link
            href="/admin/audit-log"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-[#E7E3DA] bg-white px-3 text-xs font-medium text-[#737373] hover:bg-[#F7F4ED] hover:text-[#171717] transition-colors"
          >
            Reset
          </Link>
        </div>
      </form>

      {/* Log Entries Table */}
      {logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E7E3DA] bg-white p-10 text-center text-xs text-[#737373]">
          No audit log entries match the current filters.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E7E3DA] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E7E3DA] bg-[#F7F4ED]/60 text-[11px] font-medium text-[#737373]">
                <tr>
                  <th className="px-5 py-3 sm:px-6">Timestamp</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-5 py-3 sm:px-6">Metadata Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E3DA]">
                {logs.map((log) => {
                  const actionBadgeVariant = log.action.includes("APPROVED") || log.action.includes("ISSUED")
                    ? "success"
                    : log.action.includes("REJECTED") || log.action.includes("DELETED")
                      ? "danger"
                      : log.action.includes("OVERRIDDEN") || log.action.includes("MUTE")
                        ? "warning"
                        : "neutral";

                  const metaString = log.metadata ? JSON.stringify(log.metadata) : null;

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-[#F7F4ED]/40 transition-colors"
                    >
                      <td className="px-5 py-3.5 sm:px-6 text-[#737373] font-mono text-[11px] whitespace-nowrap">
                        {dateFormatter.format(new Date(log.createdAt))}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[#171717]">
                            {log.actor.name}
                          </span>
                          <span className="rounded bg-[#F7F4ED] border border-[#E7E3DA] px-1.5 py-0.5 text-[10px] font-medium text-[#737373]">
                            {log.actor.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#737373]">{log.actor.email}</p>
                      </td>

                      <td className="px-4 py-3.5">
                        <Badge variant={actionBadgeVariant}>{log.action}</Badge>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-medium text-[#171717]">
                          {log.targetType}
                        </span>
                        {log.targetId && (
                          <p className="font-mono text-[11px] text-[#737373] truncate max-w-40">
                            {log.targetId.slice(0, 12)}...
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-3.5 sm:px-6 max-w-xs">
                        {metaString ? (
                          <span className="font-mono text-[11px] text-[#737373] bg-[#F7F4ED] px-2 py-1 rounded border border-[#E7E3DA] block truncate" title={metaString}>
                            {metaString}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#737373]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
