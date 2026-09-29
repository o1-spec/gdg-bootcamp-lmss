import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  /** Add hover lift + press animation */
  interactive?: boolean;
}

export function Card({ children, className = "", interactive = false, ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-[#E7E3DA] bg-white p-6 text-[#171717] shadow-2xs ${
        interactive
          ? "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-[#D4D0C8] active:scale-[0.99] active:translate-y-0 cursor-pointer"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-4 flex items-center justify-between gap-2 border-b border-[#E7E3DA] pb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={`text-base font-bold tracking-tight text-[#171717] ${className}`}
    >
      {children}
    </h3>
  );
}
