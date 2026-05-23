"use client";

import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from "../../../lib/api";

type Category = {
  id?: number;
  name: string;
  products?: unknown[];
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const data = await fetchCategories();
      setCategories(data || []);
    } catch (err) {
      console.error("load categories error", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, []);

  useEffect(() => {
    setNameInput(editing?.name ?? "");
  }, [editing]);

  const normalized = useMemo(() => {
    return categories.map((c, idx) => {
      const rec = c as unknown as Record<string, unknown>;
      const rawId = rec.id ?? rec.ID;
      const parsedId =
        typeof rawId === "number" ? rawId : Number.parseFloat(String(rawId));
      const id = Number.isFinite(parsedId) ? parsedId : undefined;
      const name = String(rec.name ?? rec.Name ?? "").trim();
      const products = (rec.products ?? rec.Products) as unknown[] | undefined;
      const count = Array.isArray(products) ? products.length : 0;
      return {
        key: id ?? `category-${idx}`,
        id,
        name,
        count,
      };
    });
  }, [categories]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return normalized;
    return normalized.filter((item) => item.name.toLowerCase().includes(term));
  }, [normalized, search]);

  async function onSave() {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      await Swal.fire({
        icon: "warning",
        title: "Category name is required",
        text: "Please enter a category name.",
      });
      return;
    }

    try {
      setSaving(true);
      if (editing?.id) {
        await updateCategory(editing.id, { name: trimmed });
        await Swal.fire({
          icon: "success",
          title: "Success",
          text: "Category updated successfully.",
          timer: 1600,
          showConfirmButton: false,
        });
      } else {
        await createCategory({ name: trimmed });
        await Swal.fire({
          icon: "success",
          title: "Success",
          text: "Category created successfully.",
          timer: 1600,
          showConfirmButton: false,
        });
      }
      setEditing(null);
      setNameInput("");
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await Swal.fire({
        icon: "error",
        title: "Failed to save category",
        text: message,
      });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: number) {
    const confirmResult = await Swal.fire({
      title: "Delete category?",
      text: "This category will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });
    if (!confirmResult.isConfirmed) return;
    try {
      setDeletingId(id);
      await deleteCategory(id);
      await load();
      await Swal.fire({
        icon: "success",
        title: "Success",
        text: "Category deleted successfully.",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await Swal.fire({
        icon: "error",
        title: "Failed to delete category",
        text: message,
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6 font-[var(--font-geist-sans)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage product categories.</p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Categories</h1>
        </div>
        <div className="text-xs text-slate-400 dark:text-slate-500">Dashboard / Categories</div>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-xs">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-4-4" />
              </svg>
            </span>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm"
            onClick={() => setEditing({ name: "" })}
          >
            + Add Category
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="p-6 text-sm text-slate-500 dark:text-slate-400">Loading categories...</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-sm text-slate-500 dark:text-slate-400">
            No categories yet. Add your first category.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-tl-2xl rounded-tr-2xl">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Category Name</th>
                  <th className="px-4 py-3 font-medium">Product Count</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((item) => (
                  <tr key={item.key} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60">
                    <td className="px-4 py-4 font-semibold text-slate-900 dark:text-slate-100">
                      {item.name || "-"}
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      {item.count} products
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-slate-100"
                          onClick={() => setEditing({ id: item.id, name: item.name })}
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400"
                          onClick={() => {
                            if (item.id) onDelete(item.id);
                          }}
                          disabled={deletingId === item.id}
                        >
                          {deletingId === item.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 p-4"
          onClick={() => setEditing(null)}
        >
          <div
            className="mx-auto my-4 flex min-h-[calc(100vh-2rem)] w-full max-w-lg items-center sm:my-6 sm:min-h-[calc(100vh-3rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-h-[calc(100vh-2rem)] w-full overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:border dark:border-slate-800 dark:bg-slate-900 sm:max-h-[calc(100vh-3rem)] sm:p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {editing.id ? "Edit Category" : "Add Category"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Enter the category name according to your products.
                  </p>
                </div>
                <button
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  onClick={() => setEditing(null)}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M18 6l-12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Category Name
                  </label>
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Example: Electronics"
                  />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    onClick={onSave}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    onClick={() => setEditing(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
