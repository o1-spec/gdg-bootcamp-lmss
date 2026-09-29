"use client";

import { useEffect, useRef, RefObject } from "react";

interface ScrollRevealOptions {
  /** Fraction of the element that must be visible before triggering (default 0.12) */
  threshold?: number;
  /** Trigger once only — don't re-animate on scroll back (default true) */
  once?: boolean;
  /** Root margin offset (default "0px 0px -40px 0px" — triggers slightly before edge) */
  rootMargin?: string;
}

/**
 * Attaches IntersectionObserver to a container ref.
 * Adds `.is-visible` to the element when it enters the viewport.
 * Works with the `.reveal` and `.reveal-stagger` CSS classes.
 *
 * Usage:
 *   const ref = useScrollReveal<HTMLDivElement>();
 *   <div ref={ref} className="reveal"> ... </div>
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: ScrollRevealOptions = {}
): RefObject<T | null> {
  const {
    threshold = 0.12,
    once = true,
    rootMargin = "0px 0px -40px 0px",
  } = options;

  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            entry.target.classList.remove("is-visible");
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once, rootMargin]);

  return ref;
}

/**
 * Observe multiple children at once — each child gets .is-visible independently.
 * Works with static NodeLists inside a container.
 *
 * Usage:
 *   const ref = useScrollRevealChildren<HTMLDivElement>(".reveal");
 *   <div ref={ref}> <div className="reveal">...</div> </div>
 */
export function useScrollRevealChildren<T extends HTMLElement = HTMLDivElement>(
  selector: string = ".reveal",
  options: ScrollRevealOptions = {}
): RefObject<T | null> {
  const {
    threshold = 0.1,
    once = true,
    rootMargin = "0px 0px -30px 0px",
  } = options;

  const ref = useRef<T | null>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const targets = Array.from(container.querySelectorAll<HTMLElement>(selector));
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            entry.target.classList.remove("is-visible");
          }
        });
      },
      { threshold, rootMargin }
    );

    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [selector, threshold, once, rootMargin]);

  return ref;
}
