import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: {
    text: string;
    variant?: "success" | "warning" | "info" | "neutral" | "danger";
  };
  icon?: React.ReactNode;
}

export function StatCard({
  title,
  value,
  subtitle,
  badge,
  icon,
}: StatCardProps) {
  const badgeStyles = {
    neutral:
      "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    success:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    warning:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
    info:
      "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
    danger:
      "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {title}
        </span>
        {icon && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-100 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {value}
        </span>
        {badge && (
          <span
            className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
              badgeStyles[badge.variant || "neutral"]
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          {subtitle}
        </p>
      )}
    </div>
  );
}
