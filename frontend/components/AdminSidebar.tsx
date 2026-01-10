"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function AdminSidebar({ open, onToggle }: { open?: boolean; onToggle?: () => void }) {
  const router = useRouter();

  async function onLogout() {
    const confirmResult = await Swal.fire({
      title: "Keluar dari admin?",
      text: "Anda akan keluar dari sesi saat ini.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Logout",
      cancelButtonText: "Batal",
    });
    if (!confirmResult.isConfirmed) return;
    localStorage.removeItem("token");
    localStorage.removeItem("user_email");
    await Swal.fire({
      icon: "success",
      title: "Berhasil logout",
      timer: 1200,
      showConfirmButton: false,
    });
    router.push("/login");
  }

  return (
    <>
      {/* mobile toggle button */}
      <div className="lg:hidden mb-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Admin</div>
          {onToggle && (
            <button
              onClick={onToggle}
              className="px-3 py-2 rounded bg-slate-100"
            >
              Menu
            </button>
          )}
        </div>
      </div>

      <aside className={`${open ? "block" : "hidden"} lg:block w-64`}>
        <div className="bg-white rounded-xl p-4 shadow-sm sticky top-6">
          <nav className="space-y-2">
            <Link
              href="/admin"
              className="block px-3 py-2 rounded hover:bg-slate-50"
            >
              Overview
            </Link>
            <Link
              href="/admin/products"
              className="block px-3 py-2 rounded hover:bg-slate-50"
            >
              Products
            </Link>
            <Link
              href="/admin/users"
              className="block px-3 py-2 rounded hover:bg-slate-50"
            >
              Users
            </Link>
          </nav>
          <div className="mt-4 border-t border-slate-100 pt-3">
            <button
              className="block w-full rounded px-3 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
              onClick={onLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
