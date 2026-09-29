import React from "react";

type BadgeVariant = "default" | "success" | "warning" | "info" | "neutral" | "danger";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({
  children,
  variant = "neutral",
  className = "",
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    neutral:
      "bg-[#F7F4ED] text-[#737373] border-[#E7E3DA]",
    default:
      "bg-[#171717] text-[#F7F4ED] border-[#171717]",
    success:
      "bg-[#34A853]/10 text-[#207238] border-[#34A853]/25",
    warning:
      "bg-[#FBBC04]/15 text-[#946200] border-[#FBBC04]/35",
    info:
      "bg-[#4285F4]/10 text-[#1A56B5] border-[#4285F4]/25",
    danger:
      "bg-[#EA4335]/10 text-[#C5221F] border-[#EA4335]/25",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-tight ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
