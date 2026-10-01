"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import AdminSidebar from "../../components/AdminSidebar";
import { getTokenRole } from "../../lib/auth";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  return (localStorage.getItem("admin-theme") as Theme | null) || "light";
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  function toggleTheme() {
    setTheme((current) => {
      const nextTheme: Theme = current === "light" ? "dark" : "light";
      if (typeof window !== "undefined") {
        localStorage.setItem("admin-theme", nextTheme);
      }
      return nextTheme;
    });
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const token = localStorage.getItem("token");
      if (!token || getTokenRole(token) !== "admin") {
        setAuthorized(false);
        setChecking(false);
        router.replace(token ? "/shop" : "/login");
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
      "/admin/products": "Produk",
      "/admin/categories": "Kategori",
      "/admin/orders": "Pesanan",
      "/admin/analytics": "Analisis penjualan",
      "/admin/users": "Pengguna",
    };
    const currentTitle = titles[pathname] || "Admin";
    document.title = `native.co Admin - ${currentTitle}`;
  }, [pathname]);

  if (checking || !authorized) {
    return null;
  }

  const displayName = userEmail ? userEmail.split("@")[0] : "Admin";
  const initials = displayName ? displayName.slice(0, 1).toUpperCase() : "A";
  const pageTitle: Record<string, string> = {
    "/admin": "Dashboard",
    "/admin/products": "Produk",
    "/admin/categories": "Kategori",
    "/admin/orders": "Pesanan",
    "/admin/analytics": "Analisis penjualan",
    "/admin/users": "Pengguna",
  };
  const currentTitle = pageTitle[pathname] || "Dashboard";

  return (
    <div data-theme={theme} className={`min-h-screen ${theme === "dark" ? "bg-[#080f1e]" : "bg-[#f3f6fb]"}`}>
      <div className="px-3 py-3 sm:px-4 sm:py-4 lg:px-5">
        <div className="relative">
          <AdminSidebar
            open={open}
            onToggle={() => setOpen((v) => !v)}
            className="lg:z-30"
            theme={theme}
          />

          <div className="flex min-w-0 flex-1 flex-col gap-5 lg:ml-[304px] lg:gap-6">
            <header className={`sticky top-4 z-20 flex flex-wrap items-center justify-between gap-4 rounded-2xl border px-4 py-3 shadow-sm ${
              theme === "dark" 
                ? "border-slate-700 bg-slate-900 text-white" 
                : "border-slate-100 bg-white"
            }`}>
              <div className="flex min-w-0 items-center gap-3">
                <button
                  aria-label="Buka navigasi"
                  className={`rounded-xl border p-2 transition lg:hidden ${
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
                <div className="min-w-0">
                  <p className={`truncate text-[11px] font-medium ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>native.co · Panel Admin</p>
                  <h1 className={`truncate text-lg font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{currentTitle}</h1>
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
                  title="Ganti tema"
                  aria-label="Ganti tema"
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
                <Link href="/shop" className={`hidden rounded-xl border px-3 py-2 text-xs font-semibold transition sm:block ${
                  theme === "dark"
                    ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}>
                  Lihat toko
                </Link>
                <div className={`flex items-center gap-2 rounded-xl border px-2 py-1.5 ${
                  theme === "dark"
                    ? "border-slate-700 bg-slate-800"
                    : "border-slate-200 bg-white"
                }`}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                    {initials}
                  </div>
                  <div className="hidden sm:block">
                    <div className={`text-xs font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                      {displayName}
                    </div>
                    <div className={`text-[10px] ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                      Administrator
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
