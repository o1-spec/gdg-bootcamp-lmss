// src/app/not-found.tsx
// Global 404 page — shown for any unmatched route.
// Matches the existing app design system.
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="text-center max-w-sm">
        <p className="text-5xl font-bold text-zinc-200 dark:text-zinc-800 select-none">
          404
        </p>
        <h1 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          The page you&apos;re looking for doesn&apos;t exist or you don&apos;t
          have permission to view it.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
