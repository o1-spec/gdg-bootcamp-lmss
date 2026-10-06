// src/app/(student)/loading.tsx
// Loading state for all student portal routes.

/*
|----------------------------------------------------------------------------------------------------
| StudentLoading
|----------------------------------------------------------------------------------------------------
| Handler implementation for Student Loading.
*/
export default function StudentLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E7E3DA] border-t-[#171717]" />
    </div>
  );
}
