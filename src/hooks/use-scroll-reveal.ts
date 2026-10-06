"use client";

/*
|--------------------------------------------------
| npm imports
|--------------------------------------------------
*/
import { useEffect, useRef, RefObject } from "react";

/*
|--------------------------------------------------
| types
|--------------------------------------------------
*/
interface ScrollRevealOptions {
  /** Fraction of the element that must be visible before triggering (default 0.12) */
  threshold?: number;
  /** Trigger once only — don't re-animate on scroll back (default true) */
  once?: boolean;
  /** Root margin offset (default "0px 0px -40px 0px" — triggers slightly before edge) */
  rootMargin?: string;
}

/*
|----------------------------------------------------------------------------------------------------
| useScrollReveal
|----------------------------------------------------------------------------------------------------
| Attaches IntersectionObserver to a container ref.
| Adds .is-visible to the element when it enters the viewport.
| Works with the .reveal and .reveal-stagger CSS classes.
*/
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: ScrollRevealOptions = {}
): RefObject<T | null> {
  /*
  |--------------------------------------------------
  | constants
  |--------------------------------------------------
  */
  const {
    threshold = 0.12,
    once = true,
    rootMargin = "0px 0px -40px 0px",
  } = options;

  /*
  |--------------------------------------------------
  | refs
  |--------------------------------------------------
  */
  const ref = useRef<T | null>(null);

  /*
  |--------------------------------------------------
  | useEffect — observe element visibility
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

  /*
  |--------------------------------------------------
  | return
  |--------------------------------------------------
  */
  return ref;
}

/*
|----------------------------------------------------------------------------------------------------
| useScrollRevealChildren
|----------------------------------------------------------------------------------------------------
| Observe multiple children at once — each child gets .is-visible independently.
| Works with static NodeLists inside a container.
*/
export function useScrollRevealChildren<T extends HTMLElement = HTMLDivElement>(
  selector: string = ".reveal",
  options: ScrollRevealOptions = {}
): RefObject<T | null> {
  /*
  |--------------------------------------------------
  | constants
  |--------------------------------------------------
  */
  const {
    threshold = 0.1,
    once = true,
    rootMargin = "0px 0px -30px 0px",
  } = options;

  /*
  |--------------------------------------------------
  | refs
  |--------------------------------------------------
  */
  const ref = useRef<T | null>(null);

  /*
  |--------------------------------------------------
  | useEffect — observe children elements
  |--------------------------------------------------
  */
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

  /*
  |--------------------------------------------------
  | return
  |--------------------------------------------------
  */
  return ref;
}
