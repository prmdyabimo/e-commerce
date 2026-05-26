"use client";

import React, { useEffect, useState } from "react";
import AuthForm from "../components/AuthForm";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return (localStorage.getItem("auth-theme") as Theme | null) || "light";
}

export default function LoginPage() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    localStorage.setItem("auth-theme", theme);
  }, [theme]);

  const isDark = theme === "dark";
  const pageClass = isDark
    ? "auth-center min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.92),_rgba(2,6,23,1)_52%)] px-4 py-8"
    : "auth-center min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.10),_transparent_34%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-8";

  return (
    <div className={pageClass} data-theme={theme}>
      <div className={`relative w-full max-w-md rounded-2xl border p-8 shadow-lg ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-100 bg-white"}`}>
        <button
          type="button"
          className={`absolute right-4 top-4 rounded-xl border p-2 transition ${isDark ? "border-slate-700 bg-slate-800 text-amber-400 hover:bg-slate-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
          onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m6.08 0l4.24-4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m6.08 0l4.24 4.24" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        <div className="mb-6 text-center">
          <h2 className={`text-2xl font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
            Welcome back
          </h2>
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Sign in to continue to your account
          </p>
        </div>
        <AuthForm mode="login" />
        <div className={`mt-4 text-center text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          Don&apos;t have an account?{" "}
          <a className={`font-medium ${isDark ? "text-blue-400" : "text-blue-600"}`} href="/register">
            Create one
          </a>
        </div>
      </div>
    </div>
  );
}
