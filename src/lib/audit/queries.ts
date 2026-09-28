import { db } from "@/lib/db";

export async function getAuditLogs(filter?: {
  action?: string;
  actorId?: string;
  targetType?: string;
  from?: string;
  to?: string;
}, limit = 200) {
  return db.auditLog.findMany({
    where: {
      ...(filter?.action ? { action: filter.action } : {}),
      ...(filter?.actorId ? { actorId: filter.actorId } : {}),
      ...(filter?.targetType ? { targetType: filter.targetType } : {}),
      ...(filter?.from || filter?.to
        ? {
            createdAt: {
              ...(filter?.from ? { gte: new Date(filter.from) } : {}),
              ...(filter?.to ? { lte: new Date(filter.to + "T23:59:59Z") } : {}),
            },
          }
        : {}),
    },
    include: {
      actor: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getAuditLogActions() {
  const rows = await db.auditLog.groupBy({
    by: ["action"],
    _count: { action: true },
    orderBy: { _count: { action: "desc" } },
  });
  return rows.map((r) => ({ action: r.action, count: r._count.action }));
}
