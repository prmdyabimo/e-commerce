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
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Name</label>
        <input
          className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Email</label>
        <input
          className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="flex gap-2 pt-2">
        <button
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
          type="submit"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          onClick={() => onCancel && onCancel()}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
