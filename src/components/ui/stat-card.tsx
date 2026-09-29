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
    neutral: "bg-[#F7F4ED] text-[#737373] border border-[#E7E3DA]",
    success: "bg-[#34A853]/10 text-[#34A853] border border-[#34A853]/25",
    warning: "bg-[#FBBC04]/15 text-[#996500] border border-[#FBBC04]/30",
    info: "bg-[#4285F4]/10 text-[#4285F4] border border-[#4285F4]/25",
    danger: "bg-[#EA4335]/10 text-[#EA4335] border border-[#EA4335]/25",
  };

  return (
    <div className="rounded-2xl border border-[#E7E3DA] bg-white p-5 shadow-2xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-[#D4D0C8] active:scale-[0.99] active:translate-y-0">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#737373]">
          {title}
        </span>
        {icon && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E7E3DA] bg-[#F7F4ED] text-[#171717] transition-transform duration-200 group-hover:scale-110">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="stat-value text-2xl font-bold tracking-tight text-[#171717] sm:text-3xl">
          {value}
        </span>
        {badge && (
          <span
            className={`badge-pop rounded-full px-2 py-0.5 text-[11px] font-medium ${
              badgeStyles[badge.variant || "neutral"]
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-[#737373] leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
