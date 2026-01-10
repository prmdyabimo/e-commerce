"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../../components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setAuthorized(false);
      setChecking(false);
      router.replace("/login");
      return;
    }
    setAuthorized(true);
    setChecking(false);
  }, [router]);

  if (checking || !authorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6 py-8">
          <AdminSidebar open={open} onToggle={() => setOpen((v) => !v)} />

          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
              <div className="hidden sm:block text-sm text-slate-600">Signed in as demo@local</div>
            </div>
            <div>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
