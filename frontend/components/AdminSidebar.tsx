"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Swal from "sweetalert2";

type Theme = "light" | "dark";
type AdminNavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};
type AdminNavSection = {
  title: string;
  items: AdminNavItem[];
};

export default function AdminSidebar({
  open,
  onToggle,
  className,
  theme,
}: {
  open?: boolean;
  onToggle?: () => void;
  className?: string;
  theme: Theme;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const navSections: AdminNavSection[] = [
    {
      title: "Ringkasan",
      items: [
        {
          label: "Dashboard",
          href: "/admin",
          icon: (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 11l9-7 9 7" />
              <path d="M5 10v9h5v-5h4v5h5v-9" />
            </svg>
          ),
        },
      ],
    },
    {
      title: "Manajemen toko",
      items: [
        {
          label: "Produk",
          href: "/admin/products",
          icon: (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7l9-4 9 4-9 4-9-4Z" />
              <path d="M3 7v10l9 4 9-4V7" />
            </svg>
          ),
        },
        {
          label: "Kategori",
          href: "/admin/categories",
          icon: (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="7.5" cy="7.5" r="3.5" />
              <circle cx="16.5" cy="7.5" r="3.5" />
              <circle cx="12" cy="16.5" r="3.5" />
            </svg>
          ),
        },
        {
          label: "Pesanan",
          href: "/admin/orders",
          icon: (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 5h2l2 11h11l2-7H7" />
              <circle cx="10" cy="19" r="1.5" />
              <circle cx="17" cy="19" r="1.5" />
            </svg>
          ),
        },
        {
          label: "Analisis penjualan",
          href: "/admin/analytics",
          icon: (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19V5m0 14h16" />
              <path d="m7 15 4-4 3 2 5-6" />
              <path d="M16 7h3v3" />
            </svg>
          ),
        },
        {
          label: "Pengguna",
          href: "/admin/users",
          icon: (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="8" r="4" />
              <path d="M17 11a4 4 0 1 0-2.5-7.1" />
              <path d="M3 20a6 6 0 0 1 12 0" />
              <path d="M16 20a5 5 0 0 1 5 0" />
            </svg>
          ),
        },
      ],
    },
  ];

  async function onLogout() {
    const confirmResult = await Swal.fire({
      title: "Keluar dari panel admin?",
      text: "Anda akan mengakhiri sesi saat ini.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Keluar",
      cancelButtonText: "Batal",
    });
    if (!confirmResult.isConfirmed) return;
    localStorage.removeItem("token");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_role");
    await Swal.fire({
      icon: "success",
      title: "Berhasil keluar",
      timer: 1200,
      showConfirmButton: false,
    });
    router.push("/login");
  }

  return (
    <>
      {/* Mobile overlay for sidebar */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      <aside className={`fixed inset-y-0 left-0 z-30 w-[min(18rem,calc(100vw-2rem))] transform p-4 pr-0 transition-transform duration-200 ease-in-out lg:inset-y-4 lg:left-4 lg:w-72 lg:p-0 lg:transform-none ${
        open ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 ${className ?? ""}`}>
        <div className={`flex h-full min-h-0 flex-col gap-6 overflow-y-auto rounded-3xl ${theme === "dark" ? "bg-slate-900 border border-slate-800" : "bg-white"} p-5 shadow-sm`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3l9 6-9 6-9-6 9-6Z" />
                <path d="M3 9v6l9 6 9-6V9" />
              </svg>
            </div>
            <div>
              <div className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                native<span className="text-blue-600">.co</span>
              </div>
              <div className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                Panel admin
              </div>
            </div>
          </div>

          <nav className={`space-y-4 text-sm ${theme === "dark" ? "text-slate-200" : ""}`}>
            {navSections.map((section) => (
              <div key={section.title} className="space-y-2">
                <div className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  theme === "dark" ? "text-slate-500" : "text-slate-400"
                }`}>
                  {section.title}
                </div>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = item.href && pathname === item.href;
                    const baseClass = "flex items-center gap-3 rounded-xl px-3 py-2 transition";
                    const activeClass = isActive
                      ? theme === "dark"
                        ? "bg-blue-900/40 text-blue-300"
                        : "bg-blue-50 text-blue-700"
                      : theme === "dark"
                      ? "text-slate-400 hover:bg-slate-800 hover:text-slate-300"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900";
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => {
                          if (onToggle) onToggle();
                        }}
                        className={`${baseClass} ${activeClass} cursor-pointer`}
                      >
                        <span className={theme === "dark" ? "text-slate-500" : "text-slate-500"}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className={`mt-auto border-t pt-3 ${
            theme === "dark" ? "border-slate-800" : "border-slate-100"
          }`}>
            <button
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                theme === "dark"
                  ? "text-rose-400 hover:bg-slate-800"
                  : "text-rose-600 hover:bg-rose-50"
              }`}
              onClick={onLogout}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 6h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9" />
                <path d="M16 12H4m0 0l4-4m-4 4 4 4" />
              </svg>
              Keluar
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
