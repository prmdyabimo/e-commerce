"use client";

import React, { useState } from "react";

type Props = {
  initial?: { id?: number; name?: string; email?: string };
  onUpdate: (
    id: string | number,
    payload: { name?: string; email?: string }
  ) => Promise<void>;
  onCancel?: () => void;
};

export default function UserForm({ initial, onUpdate, onCancel }: Props) {
  const [name, setName] = useState(initial?.name || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    setName(initial?.name || "");
    setEmail(initial?.email || "");
  }, [initial]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const rawId = initial?.id;
    const id = typeof rawId === "number" ? rawId : Number(rawId);
    if (!Number.isFinite(id) || id <= 0) return;
    setLoading(true);
    try {
      await onUpdate(id, { name: name.trim(), email: email.trim() });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-700">Name</label>
        <input className="mt-1 block w-full rounded-lg border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Email</label>
        <input className="mt-1 block w-full rounded-lg border px-3 py-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="flex gap-2">
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-white" type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</button>
        <button type="button" className="rounded-lg border px-4 py-2" onClick={() => onCancel && onCancel()}>Cancel</button>
      </div>
    </form>
  );
}
