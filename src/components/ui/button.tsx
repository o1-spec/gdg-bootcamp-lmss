import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717] disabled:pointer-events-none disabled:opacity-50";

  const sizeStyles = {
    sm: "h-8 px-3 text-xs rounded-xl gap-1.5",
    md: "h-10 px-4 text-xs font-semibold rounded-xl gap-2",
    lg: "h-11 px-5 text-sm rounded-xl gap-2",
  };

  const variantStyles = {
    primary:
      "bg-[#171717] text-white hover:bg-[#262626] shadow-2xs",
    secondary:
      "bg-white border border-[#E7E3DA] text-[#171717] hover:bg-[#F7F4ED] shadow-2xs",
    outline:
      "border border-[#E7E3DA] bg-transparent text-[#171717] hover:bg-[#F7F4ED]",
    ghost:
      "text-[#737373] hover:text-[#171717] hover:bg-[#F7F4ED]",
    danger:
      "bg-[#EA4335] text-white hover:bg-[#D93025] shadow-2xs",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
