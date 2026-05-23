"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useTheme } from "../providers";
import AdminSidebar from "../../components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const token = localStorage.getItem("token");
      if (!token) {
        setAuthorized(false);
        setChecking(false);
        router.replace("/login");
        return;
      }
      const email = localStorage.getItem("user_email") || "";
      setUserEmail(email);
      setAuthorized(true);
      setChecking(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    const titles: Record<string, string> = {
      "/admin": "Dashboard",
      "/admin/products": "Products",
      "/admin/categories": "Categories",
      "/admin/users": "Users",
    };
    const currentTitle = titles[pathname] || "Admin";
    document.title = `E-Commerce - ${currentTitle}`;
  }, [pathname]);

  if (checking || !authorized) {
    return null;
  }

  const displayName = userEmail ? userEmail.split("@")[0] : "Admin";
  const initials = displayName ? displayName.slice(0, 1).toUpperCase() : "A";

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-slate-950" : "bg-[#f5f7fb]"}`}>
      <div className="px-3 py-3 sm:px-4 sm:py-4">
        <div className="relative">
          <AdminSidebar
            open={open}
            onToggle={() => setOpen((v) => !v)}
            className="lg:z-30"
          />

          <div className="flex min-w-0 flex-1 flex-col gap-5 lg:ml-[304px] lg:gap-6">
            <header className={`sticky top-4 z-20 flex flex-wrap items-center justify-between gap-4 rounded-2xl border px-4 py-3 shadow-sm ${
              theme === "dark" 
                ? "border-slate-700 bg-slate-900 text-white" 
                : "border-slate-100 bg-white"
            }`}>
              <div className="flex items-center gap-3">
                <button
                  className={`lg:hidden rounded-xl border p-2 transition ${
                    theme === "dark"
                      ? "border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                  onClick={() => setOpen((v) => !v)}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 6h16M4 12h16M4 18h10" />
                  </svg>
                </button>
                <div className={`hidden sm:block text-sm ${
                  theme === "dark" ? "text-slate-400" : "text-slate-500"
                }`}>
                  Good work, {displayName}
                </div>
              </div>

              <div className="order-3 w-full sm:order-none sm:min-w-[220px] sm:flex-1 sm:max-w-xl">
                <div className="relative">
                  <span className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${
                    theme === "dark" ? "text-slate-600" : "text-slate-400"
                  }`}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="7" />
                      <path d="M20 20l-4-4" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search products, categories, or more..."
                    className={`w-full rounded-xl border py-2 pl-9 pr-14 text-sm outline-none focus:border-indigo-200 transition ${
                      theme === "dark"
                        ? "border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:bg-slate-700"
                        : "border-slate-200 bg-slate-50 text-slate-700 placeholder-slate-500 focus:bg-white"
                    }`}
                  />
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-md border px-2 py-0.5 text-[10px] ${
                    theme === "dark"
                      ? "border-slate-700 text-slate-500"
                      : "border-slate-200 text-slate-400"
                  }`}>
                    Ctrl K
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button 
                  onClick={toggleTheme}
                  className={`rounded-xl border p-2 transition ${
                    theme === "dark"
                      ? "border-slate-700 bg-slate-800 text-amber-400 hover:bg-slate-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                  title="Toggle dark/light mode"
                >
                  {theme === "dark" ? (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                      <circle cx="12" cy="12" r="5" />
                      <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m6.08 0l4.24-4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m6.08 0l4.24 4.24" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  )}
                </button>
                <button className={`rounded-xl border p-2 transition ${
                  theme === "dark"
                    ? "border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-300"
                    : "border-slate-200 bg-white text-slate-500 hover:text-slate-700"
                }`}>
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 4v4" />
                    <path d="M12 16v4" />
                    <path d="M4 12h4" />
                    <path d="M16 12h4" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
                <button className={`relative rounded-xl border p-2 transition ${
                  theme === "dark"
                    ? "border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-300"
                    : "border-slate-200 bg-white text-slate-500 hover:text-slate-700"
                }`}>
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                  </svg>
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-indigo-500" />
                </button>
                <div className={`flex items-center gap-2 rounded-xl border px-2 py-1.5 ${
                  theme === "dark"
                    ? "border-slate-700 bg-slate-800"
                    : "border-slate-200 bg-white"
                }`}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                    {initials}
                  </div>
                  <div className="hidden sm:block">
                    <div className={`text-xs font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                      {displayName}
                    </div>
                    <div className={`text-[10px] ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                      Admin
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <main className="flex-1">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
