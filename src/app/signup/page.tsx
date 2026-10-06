"use client";

/*
|--------------------------------------------------
| npm imports
|--------------------------------------------------
*/
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

/*
|----------------------------------------------------------------------------------------------------
| SignupPage
|----------------------------------------------------------------------------------------------------
| Renders the student self-service signup form.
| Validates credentials and creates an account matching administrative enrollment.
*/
export default function SignupPage() {
  /*
  |--------------------------------------------------
  | hooks
  |--------------------------------------------------
  */
  const router = useRouter();

  /*
  |--------------------------------------------------
  | states
  |--------------------------------------------------
  */
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  /*
  |--------------------------------------------------
  | handlers
  |--------------------------------------------------
  */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsPending(true);
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? "Unable to create your account.");
        return;
      }
      router.push(data?.redirectTo ?? "/dashboard");
      router.refresh();
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  /*
  |--------------------------------------------------
  | return
  |--------------------------------------------------
  */

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F4ED] px-4 py-10 sm:px-6">
      <section className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Image src="/GDGOC-LASU-logo.webp" alt="Google Developer Groups on Campus - Lagos State University" width={260} height={50} className="h-10 w-auto object-contain" priority />
        </div>
        <div className="rounded-2xl border border-[#E7E3DA] bg-white p-7 shadow-xs sm:p-9">
          <h1 className="text-2xl font-bold tracking-tight text-[#171717]">Create your account</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-[#737373]">Use the email address registered by your bootcamp administrator.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-[#171717]">Full name</label>
              <input id="name" name="name" required autoComplete="name" disabled={isPending} className="mt-1.5 h-12 w-full rounded-xl border border-[#E7E3DA] px-3.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#171717] disabled:cursor-not-allowed disabled:bg-[#F7F4ED]" />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-[#171717]">Email address</label>
              <input id="email" name="email" type="email" required autoComplete="email" disabled={isPending} className="mt-1.5 h-12 w-full rounded-xl border border-[#E7E3DA] px-3.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#171717] disabled:cursor-not-allowed disabled:bg-[#F7F4ED]" />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-[#171717]">Password</label>
              <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" disabled={isPending} aria-describedby="password-help" className="mt-1.5 h-12 w-full rounded-xl border border-[#E7E3DA] px-3.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#171717] disabled:cursor-not-allowed disabled:bg-[#F7F4ED]" />
              <p id="password-help" className="mt-1.5 text-[11px] text-[#737373]">At least 8 characters, including a letter and a number.</p>
            </div>

            {error && <p role="alert" className="rounded-xl border border-[#EA4335]/20 bg-[#EA4335]/5 p-3 text-xs font-medium text-[#EA4335]">{error}</p>}

            <button type="submit" disabled={isPending} className="flex h-12 w-full items-center justify-center rounded-xl bg-[#171717] text-sm font-semibold text-[#F7F4ED] transition-colors hover:bg-[#262626] disabled:cursor-not-allowed disabled:opacity-50">
              {isPending ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>
        <p className="mt-5 text-center text-xs text-[#737373]">Already have an account? <Link href="/login" className="font-semibold text-[#171717] underline underline-offset-2">Sign in</Link></p>
      </section>
    </main>
  );
}
