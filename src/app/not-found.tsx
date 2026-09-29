// src/app/not-found.tsx
// Global 404 page — shown for any unmatched route.
// Matches the existing app design system.
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F4ED] px-4">
      <div className="text-center max-w-md w-full rounded-2xl border border-[#E7E3DA] bg-white p-8 sm:p-10 shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F7F4ED] text-[#737373] border border-[#E7E3DA] mb-4">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>
        <h1 className="text-lg font-semibold text-[#171717]">
          Page not found
        </h1>
        <p className="mt-2 text-xs text-[#737373] leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or you don&apos;t
          have permission to view it.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#171717] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-black"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
