import React from "react";
import Link from "next/link";

export default function AdminIndex() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-medium mb-2">Overview</h2>
      <p className="text-sm text-slate-600 mb-4">Use the sidebar to manage products or view users.</p>
      <div className="flex gap-3">
        <Link className="rounded-md bg-blue-600 px-4 py-2 text-white" href="/admin/products">Manage Products</Link>
        <Link className="rounded-md border px-4 py-2" href="/admin/users">View Users</Link>
      </div>
    </div>
  );
}
