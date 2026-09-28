// src/app/instructor/loading.tsx
// Loading state for all instructor portal routes.
export default function InstructorLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700 dark:border-zinc-700 dark:border-t-zinc-300" />
    </div>
  );
}
