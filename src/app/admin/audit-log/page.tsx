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
        title="System Audit Log"
        description="Immutable record of administrative, instructor, and student sensitive actions"
      />

      {/* Filter Controls */}
      <form
        method="GET"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 text-xs"
      >
        <div>
          <label className="block text-2xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            Action
          </label>
          <select
            name="action"
            defaultValue={filters.action || "ALL"}
            className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-xs text-zinc-900 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
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
          <label className="block text-2xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            Actor
          </label>
          <select
            name="actorId"
            defaultValue={filters.actorId || "ALL"}
            className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-xs text-zinc-900 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
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
          <label className="block text-2xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            Target Type
          </label>
          <select
            name="targetType"
            defaultValue={filters.targetType || "ALL"}
            className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-xs text-zinc-900 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
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
          <label className="block text-2xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            Date From
          </label>
          <input
            type="date"
            name="from"
            defaultValue={filters.from || ""}
            className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-xs text-zinc-900 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            Apply Filters
          </button>
          <Link
            href="/admin/audit-log"
            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Reset
          </Link>
        </div>
      </form>

      {/* Log Entries Table */}
      {logs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 p-10 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          No audit log entries match the current filters.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-950">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 bg-zinc-50/75 dark:border-zinc-800 dark:bg-zinc-900/40">
              <tr>
                <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                  Timestamp
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                  Actor
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                  Action
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                  Target
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                  Metadata
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {logs.map((log) => {
                const actionBadgeVariant = log.action.includes("APPROVED") || log.action.includes("ISSUED")
                  ? "success"
                  : log.action.includes("REJECTED") || log.action.includes("DELETED")
                    ? "danger"
                    : log.action.includes("OVERRIDDEN") || log.action.includes("MUTE")
                      ? "warning"
                      : "info";

                return (
                  <tr
                    key={log.id}
                    className="transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30"
                  >
                    <td className="px-4 py-3 text-zinc-500 font-mono text-[11px] whitespace-nowrap">
                      {dateFormatter.format(new Date(log.createdAt))}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {log.actor.name}
                        </span>
                        <span className="rounded bg-zinc-100 px-1 py-0.2 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                          {log.actor.role}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400">{log.actor.email}</p>
                    </td>

                    <td className="px-4 py-3">
                      <Badge variant={actionBadgeVariant}>{log.action}</Badge>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">
                        {log.targetType}
                      </span>
                      <p className="font-mono text-2xs text-zinc-400 truncate max-w-35">
                        {log.targetId}
                      </p>
                    </td>

                    <td className="px-4 py-3 max-w-xs">
                      {log.metadata ? (
                        <pre className="font-mono text-2xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/60 p-1.5 rounded border border-zinc-100 dark:border-zinc-800 truncate">
                          {JSON.stringify(log.metadata)}
                        </pre>
                      ) : (
                        <span className="text-2xs text-zinc-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
