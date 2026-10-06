/*
|--------------------------------------------------
| npm imports
|--------------------------------------------------
*/
import React from "react";

/*
|--------------------------------------------------
| types
|--------------------------------------------------
*/
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}

/*
|----------------------------------------------------------------------------------------------------
| Card
|----------------------------------------------------------------------------------------------------
| Base container card component with optional hover elevation and interactive states.
*/
export function Card({ children, className = "", interactive = false, ...props }: CardProps) {
  /*
  |--------------------------------------------------
  | return
  |--------------------------------------------------
  */
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

/*
|----------------------------------------------------------------------------------------------------
| CardHeader
|----------------------------------------------------------------------------------------------------
| Card header layout section with bottom border divider.
*/
export function CardHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  /*
  |--------------------------------------------------
  | return
  |--------------------------------------------------
  */
  return (
    <div className={`mb-4 flex items-center justify-between gap-2 border-b border-[#E7E3DA] pb-4 ${className}`}>
      {children}
    </div>
  );
}

/*
|----------------------------------------------------------------------------------------------------
| CardTitle
|----------------------------------------------------------------------------------------------------
| Card headline heading with semibold typography.
*/
export function CardTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  /*
  |--------------------------------------------------
  | return
  |--------------------------------------------------
  */
  return (
    <h3
      className={`text-base font-bold tracking-tight text-[#171717] ${className}`}
    >
      {children}
    </h3>
  );
}
