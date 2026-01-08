"use client";

import React from "react";
import Link from "next/link";

export default function AdminSidebar({ open, onToggle }: { open?: boolean; onToggle?: () => void }) {
  return (
    <aside className="w-64 hidden lg:block">
      <div className="bg-white rounded-xl p-4 shadow-sm sticky top-6">
        <nav className="space-y-2">
          <Link href="/admin" className="block px-3 py-2 rounded hover:bg-slate-50">Overview</Link>
          <Link href="/admin/products" className="block px-3 py-2 rounded hover:bg-slate-50">Products</Link>
          <Link href="/admin/users" className="block px-3 py-2 rounded hover:bg-slate-50">Users</Link>
        </nav>
      </div>
    </aside>
  );
}
