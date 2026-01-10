"use client";

import React from "react";
import Link from "next/link";

export default function AdminSidebar({ open, onToggle }: { open?: boolean; onToggle?: () => void }) {
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
        </div>
      </aside>
    </>
  );
}
