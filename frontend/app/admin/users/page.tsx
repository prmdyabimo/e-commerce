"use client";

import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { fetchUsers, updateUser } from "../../../lib/api";
import UserForm from "../../../components/UserForm";

type User = { id?: number; name?: string; email?: string };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [editing, setEditing] = useState<User | null>(null);

  async function load() {
    const d = await fetchUsers();
    const normalized = (Array.isArray(d) ? d : []).map((u, idx) => {
      const rec = u as unknown as Record<string, unknown>;
      const rawId = rec.id ?? rec.ID;
      const parsedId =
        typeof rawId === "number" ? rawId : Number.parseFloat(String(rawId));
      const id = Number.isFinite(parsedId) ? parsedId : undefined;
      const name = String(rec.name ?? rec.Name ?? "").trim();
      const email = String(rec.email ?? rec.Email ?? "").trim();
      return {
        id,
        name,
        email,
        key: id ?? `user-${idx}`,
      } as User & { key: string | number };
    });
    setUsers(normalized);
  }

  useEffect(() => {
    (async () => await load())();
  }, []);

  async function onUpdate(
    id: string | number,
    payload: { name?: string; email?: string }
  ) {
    try {
      const nid = typeof id === "number" ? id : Number(id);
      if (!Number.isFinite(nid) || nid <= 0) {
        await Swal.fire({
          icon: "error",
          title: "Update failed",
          text: "Invalid user ID.",
        });
        return;
      }
      await updateUser(nid, payload);
      await load();
      setEditing(null);
      await Swal.fire({
        icon: "success",
        title: "Success",
        text: "User updated successfully.",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await Swal.fire({
        icon: "error",
        title: "Failed to update user",
        text: message,
      });
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="rounded-xl bg-white p-4 shadow-sm dark:border dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-3 text-lg font-medium text-slate-900 dark:text-slate-100">Users</h3>
          <div className="space-y-2">
            {users.map((u, idx) => (
              <div
                key={u.id ?? `user-${idx}`}
                className="flex items-center justify-between rounded-md border p-3 dark:border-slate-800"
              >
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {u.name?.trim() || (u.email ? u.email.split("@")[0] : "Unknown")}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{u.email || "-"}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-slate-600 dark:text-slate-300">ID: {Number.isFinite(u.id) ? u.id : "-"}</div>
                  <button
                    className="cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:text-white dark:disabled:border-slate-800 dark:disabled:bg-slate-900 dark:disabled:text-slate-600"
                    onClick={() => setEditing(u)}
                    disabled={!Number.isFinite(u.id)}
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="rounded-xl bg-white p-4 shadow-sm dark:border dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-2 text-lg font-medium text-slate-900 dark:text-slate-100">
            {editing?.id ? "Edit user" : "Select a user"}
          </h3>
          {editing ? (
            <UserForm
              initial={editing}
              onUpdate={onUpdate}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Select a user to edit their name or email.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
