// src/app/admin/loading.tsx
// Loading state for all admin routes.
export default function AdminLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700 dark:border-zinc-700 dark:border-t-zinc-300" />
    </div>
  );
}
