"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErrorMessage(data?.error || "Invalid email or password");
        setLoading(false);
        return;
      }

      // Successful login -> Navigate to role destination
      const destination = data?.redirectTo || "/dashboard";
      router.push(destination);
      router.refresh();
    } catch (err) {
      console.error("Login request failed:", err);
      setErrorMessage("Unable to connect to server. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F7F4ED]">
      {/* Mobile Header (< lg screens) */}
      <header className="lg:hidden bg-[#171717] text-white px-6 py-4 flex items-center justify-between border-b border-[#262626]">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4285F4]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#EA4335]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#FBBC04]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#34A853]" />
          </div>
          <span className="text-xs font-semibold tracking-wider uppercase text-zinc-200">
            Bootcamp LMS
          </span>
        </div>
        <span className="text-2xs text-zinc-400 font-mono tracking-wide">
          Focused Learning
        </span>
      </header>

      {/* Desktop Left Brand Panel (>= lg screens) */}
      <aside className="hidden lg:flex lg:w-[46%] xl:w-[44%] bg-[#171717] text-white flex-col justify-between p-12 xl:p-16 border-r border-[#262626] relative overflow-hidden">
        {/* Top: Branding with subtle accent dots */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#4285F4]" aria-hidden="true" />
              <span className="h-2 w-2 rounded-full bg-[#EA4335]" aria-hidden="true" />
              <span className="h-2 w-2 rounded-full bg-[#FBBC04]" aria-hidden="true" />
              <span className="h-2 w-2 rounded-full bg-[#34A853]" aria-hidden="true" />
            </div>
            <span className="text-xs font-semibold tracking-widest uppercase text-zinc-400">
              Bootcamp LMS
            </span>
          </div>
        </div>

        {/* Center: Headline & Value Proposition */}
        <div className="space-y-6 my-auto py-12">
          <h1 className="text-4xl xl:text-5xl font-bold tracking-tight text-white leading-[1.12]">
            Learn.<br />
            Practice.<br />
            Improve.
          </h1>
          <p className="text-sm xl:text-base text-zinc-400 font-normal leading-relaxed max-w-sm">
            One place for classes, attendance, assignments, feedback, and progress.
          </p>
        </div>

        {/* Bottom: Minimal Footnote */}
        <div className="pt-6 border-t border-[#262626] flex items-center justify-between text-xs text-zinc-500">
          <span>Built for focused learning.</span>
          <span className="font-mono text-2xs text-zinc-600">v1.0</span>
        </div>
      </aside>

      {/* Right Content Area: Centered Login Form on Warm Cream Background */}
      <main className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-16 xl:p-24 min-h-[calc(100vh-57px)] lg:min-h-screen">
        <div className="w-full max-w-105 space-y-6">
          {/* Form Card */}
          <div className="bg-white border border-[#E7E3DA] rounded-2xl p-7 sm:p-9 shadow-xs">
            {/* Header inside card */}
            <div className="space-y-1.5 mb-7">
              <h2 className="text-2xl font-bold tracking-tight text-[#171717]">
                Welcome back
              </h2>
              <p className="text-sm text-[#737373]">
                Sign in to access your track and dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Message */}
              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-xl border border-[#EA4335]/30 bg-[#EA4335]/5 px-4 py-3 text-xs text-[#EA4335] font-medium leading-relaxed"
                >
                  {errorMessage}
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-[#171717] tracking-tight"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="h-12 w-full rounded-xl border border-[#E7E3DA] bg-white px-3.5 text-sm text-[#171717] placeholder:text-[#A3A3A3] focus:border-[#171717] focus:ring-1 focus:ring-[#171717] focus:outline-none transition-colors"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-[#171717] tracking-tight"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="h-12 w-full rounded-xl border border-[#E7E3DA] bg-white px-3.5 pr-11 text-sm text-[#171717] placeholder:text-[#A3A3A3] focus:border-[#171717] focus:ring-1 focus:ring-[#171717] focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#737373] hover:text-[#171717] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#171717] rounded-lg transition-colors"
                  >
                    {showPassword ? (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.75}
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.75}
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-[#171717] text-sm font-semibold text-[#F7F4ED] hover:bg-[#262626] active:bg-[#000000] focus:outline-none focus:ring-2 focus:ring-[#171717] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#F7F4ED]/30 border-t-[#F7F4ED]" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>
          </div>

          {/* Footer note outside card */}
          <p className="text-center text-xs text-[#737373] leading-relaxed px-4">
            Accounts are managed by bootcamp administrators. Contact your instructor if you need credentials.
          </p>
        </div>
      </main>
    </div>
  );
}
