// src/app/admin/loading.tsx
// Loading state for all admin routes.
export default function AdminLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E7E3DA] border-t-[#171717]" />
    </div>
  );
}
