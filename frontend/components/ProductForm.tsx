"use client";

import React, { useState } from "react";

type Props = {
  initial?: { id: string; name: string; price: number; description?: string };
  onCreate: (payload: { name: string; price: number; description?: string }) => Promise<void>;
  onUpdate: (id: string, payload: { name: string; price: number; description?: string }) => Promise<void>;
  onCancel?: () => void;
};

export default function ProductForm({ initial, onCreate, onUpdate, onCancel }: Props) {
  const [name, setName] = useState(initial?.name || "");
  const [price, setPrice] = useState(initial?.price ?? 0);
  const [description, setDescription] = useState(initial?.description || "");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (initial?.id) {
        await onUpdate(initial.id, { name, price: Number(price), description });
      } else {
        await onCreate({ name, price: Number(price), description });
        setName("");
        setPrice(0);
        setDescription("");
      }
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
        <label className="block text-sm font-medium text-slate-700">Price</label>
        <input className="mt-1 block w-full rounded-lg border px-3 py-2" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} required />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Description</label>
        <textarea className="mt-1 block w-full rounded-lg border px-3 py-2" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </div>
      <div className="flex gap-2">
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-white" type="submit" disabled={loading}>{loading ? "Saving..." : initial?.id ? "Update" : "Create"}</button>
        {initial?.id && <button type="button" className="rounded-lg border px-4 py-2" onClick={() => onCancel && onCancel()}>Cancel</button>}
      </div>
    </form>
  );
}
