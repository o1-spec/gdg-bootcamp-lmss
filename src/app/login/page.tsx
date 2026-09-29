"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const CAROUSEL_SLIDES = [
  {
    src: "/IMG_2242.jpg",
    alt: "Students actively collaborating on code at GDGOC LASU bootcamp",
    title: "Team Collaboration",
    caption: "Students building real-world projects together in teams",
  },
  {
    src: "/IMG_9342.jpg",
    alt: "Instructor delivering live session at GDGOC LASU bootcamp",
    title: "Interactive Workshops",
    caption: "Live coding sessions, guidance, and direct instructor feedback",
  },
  {
    src: "/IMG_2428.jpg",
    alt: "Bootcamp cohort session in the GDGOC LASU hall",
    title: "Vibrant Community",
    caption: "A supportive community of tech talent learning and growing as one",
  },
];

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  React.useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused]);

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length);
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
  };

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
      <header className="lg:hidden bg-[#171717] text-white px-5 py-3.5 flex items-center justify-between border-b border-[#262626]">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg overflow-hidden shrink-0 border border-[#333333] bg-[#F7F4ED]">
            <Image
              src="/icon.png"
              alt="GDG Logo"
              width={28}
              height={28}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <span className="text-xs font-semibold tracking-wider uppercase text-zinc-200">
            Bootcamp LMS
          </span>
        </div>
        <span className="text-2xs text-zinc-400 font-mono tracking-wide">
          GDGOC LASU
        </span>
      </header>

      {/* Desktop Left Brand Panel (>= lg screens) */}
      <aside className="hidden lg:flex lg:w-[46%] xl:w-[44%] bg-[#171717] text-white flex-col justify-between p-8 xl:p-10 border-r border-[#262626] relative overflow-hidden">
        {/* Top: Branding with logo badge */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-3 rounded-2xl bg-white px-3.5 py-2 border border-white/10 shadow-xs">
            <Image
              src="/GDGOC-LASU-logo.webp"
              alt="Google Developer Groups on Campus - Lagos State University"
              width={220}
              height={42}
              className="h-7.5 w-auto object-contain"
              priority
            />
          </div>
          <p className="text-xs font-medium tracking-wide text-zinc-400">
            Bootcamp Learning Management System
          </p>
        </div>

        {/* Center: Headline & Value Proposition + Larger Photo Carousel */}
        <div className="space-y-4 my-auto py-2">
          <div className="space-y-1.5">
            <h1 className="text-2xl xl:text-3xl font-bold tracking-tight text-white leading-snug">
              Learn. Practice. Improve.
            </h1>
            <p className="text-xs xl:text-sm text-zinc-400 font-normal leading-relaxed max-w-sm">
              One place for classes, attendance, assignments, feedback, and progress.
            </p>
          </div>

          {/* Photo Carousel: Much bigger and larger, pill badge removed */}
          <div
            className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-black/60 shadow-xl group h-80 xl:h-88 2xl:h-104"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            aria-label="Bootcamp highlights carousel"
          >
            {CAROUSEL_SLIDES.map((slide, index) => {
              const isActive = index === currentSlide;
              return (
                <div
                  key={slide.src}
                  className={`absolute inset-0 transition-all duration-700 ease-out ${isActive
                    ? "opacity-100 scale-100 z-10"
                    : "opacity-0 scale-105 z-0 pointer-events-none"
                    }`}
                  aria-hidden={!isActive}
                >
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="object-cover object-center"
                    priority={index === 0}
                  />
                  {/* Subtle dark gradient overlay for text readability */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/25 to-transparent" />

                  {/* Slide Text Content (pill badge removed as requested) */}
                  <div className="absolute inset-x-0 bottom-0 p-4 xl:p-5 flex flex-col justify-end text-white">
                    <p className="text-sm xl:text-base font-semibold text-white drop-shadow-sm">
                      {slide.title}
                    </p>
                    <p className="text-xs text-zinc-300 drop-shadow-sm mt-0.5 line-clamp-1">
                      {slide.caption}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Previous / Next Arrow Controls */}
            <div className="absolute inset-y-0 inset-x-3 z-20 flex items-center justify-between pointer-events-none">
              <button
                type="button"
                onClick={handlePrevSlide}
                aria-label="Previous slide"
                className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white/90 backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80 hover:text-white active:scale-90 cursor-pointer shadow-md"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleNextSlide}
                aria-label="Next slide"
                className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white/90 backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80 hover:text-white active:scale-90 cursor-pointer shadow-md"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>

            {/* Indicator Dots */}
            <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1.5">
              {CAROUSEL_SLIDES.map((_, dotIndex) => {
                const isCurrent = dotIndex === currentSlide;
                return (
                  <button
                    key={dotIndex}
                    type="button"
                    onClick={() => setCurrentSlide(dotIndex)}
                    aria-label={`Go to slide ${dotIndex + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${isCurrent
                      ? "w-5 bg-white shadow-xs"
                      : "w-1.5 bg-white/40 hover:bg-white/70"
                      }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom: Minimal Footnote */}
        <div className="pt-4 border-t border-[#262626] flex items-center justify-between text-xs text-zinc-500">
          <span>Google Developer Groups on Campus • LASU</span>
          <span className="font-mono text-2xs text-zinc-600">v1.0</span>
        </div>
      </aside>

      {/* Right Content Area: Centered Login Form on Warm Cream Background */}
      <main className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-16 xl:p-24 min-h-[calc(100vh-57px)] lg:min-h-screen">
        <div className="w-full max-w-105 space-y-6">
          {/* Logo above login card */}
          <div className="flex justify-center mb-1">
            <Image
              src="/GDGOC-LASU-logo.webp"
              alt="Google Developer Groups on Campus - Lagos State University"
              width={260}
              height={50}
              className="h-10 sm:h-11 w-auto object-contain"
              priority
            />
          </div>
          {/* Form Card */}
          <div className="bg-white border border-[#E7E3DA] rounded-2xl p-7 sm:p-9 shadow-xs animate-page">
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
                className="h-12 w-full rounded-xl bg-[#171717] text-sm font-semibold text-[#F7F4ED] hover:bg-[#262626] active:bg-[#000000] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#171717] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xs cursor-pointer"
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
