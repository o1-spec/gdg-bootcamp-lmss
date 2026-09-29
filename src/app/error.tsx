"use client";
// src/app/error.tsx
// Global error boundary — catches unexpected server/client errors.
// Displays a safe message with no stack traces or internals.
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to server-side error tracking in the future (e.g. Sentry)
    console.error("[GlobalError]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F4ED] px-4">
      <div className="text-center max-w-md w-full rounded-2xl border border-[#E7E3DA] bg-white p-8 sm:p-10 shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EA4335]/10 text-[#EA4335] mb-4">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <h1 className="text-lg font-semibold text-[#171717]">
          Something went wrong
        </h1>
        <p className="mt-2 text-xs text-[#737373] leading-relaxed">
          An unexpected error occurred while loading this page. Please try again or reach out if the issue persists.
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#171717] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-black"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
