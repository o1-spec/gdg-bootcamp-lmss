"use client";

/*
|--------------------------------------------------
| npm imports
|--------------------------------------------------
*/
import React, { useRef, useEffect } from "react";

/*
|--------------------------------------------------
| types
|--------------------------------------------------
*/
interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  /** Use "stagger" for multi-child staggered animation */
  mode?: "single" | "stagger";
  /** Extra tailwind/CSS classes for the inner wrapper */
  innerClassName?: string;
  threshold?: number;
  rootMargin?: string;
}

/*
|----------------------------------------------------------------------------------------------------
| ScrollReveal
|----------------------------------------------------------------------------------------------------
| Wraps any content in an IntersectionObserver-powered scroll reveal.
| Automatically adds .is-visible when the element enters the viewport.
|
| Modes:
| - single: uses .reveal class (animates the wrapper)
| - stagger: uses .reveal-stagger class (animates children)
*/
export function ScrollReveal({
  children,
  className = "",
  mode = "single",
  innerClassName = "",
  threshold = 0.1,
  rootMargin = "0px 0px -40px 0px",
}: ScrollRevealProps) {
  /*
  |--------------------------------------------------
  | refs
  |--------------------------------------------------
  */
  const ref = useRef<HTMLDivElement>(null);

  /*
  |--------------------------------------------------
  | useEffect — observe container visibility
  |--------------------------------------------------
  */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  /*
  |--------------------------------------------------
  | computed
  |--------------------------------------------------
  */
  const modeClass = mode === "stagger" ? "reveal-stagger" : "reveal";

  /*
  |--------------------------------------------------
  | return
  |--------------------------------------------------
  */
  return (
    <div
      ref={ref}
      className={`${modeClass} ${innerClassName} ${className}`}
    >
      {children}
    </div>
  );
}
