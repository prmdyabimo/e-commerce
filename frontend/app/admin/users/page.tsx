"use client";

import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { createUser, fetchUsers, updateUser } from "../../../lib/api";
import UserForm from "../../../components/UserForm";

type User = { id?: number; name?: string; email?: string; role?: string };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [editing, setEditing] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userName, setUserName] = useState("Admin");
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState<"user" | "admin">("user");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const d = await fetchUsers();
      const normalized = (Array.isArray(d) ? d : []).map((u) => {
        const rec = u as unknown as Record<string, unknown>;
        const rawId = rec.id ?? rec.ID;
        const parsedId =
          typeof rawId === "number" ? rawId : Number.parseFloat(String(rawId));
        const id = Number.isFinite(parsedId) ? parsedId : undefined;
        const name = String(rec.name ?? rec.Name ?? "").trim();
        const email = String(rec.email ?? rec.Email ?? "").trim();
        const role = String(rec.role ?? rec.Role ?? "user").trim() || "user";
        return { id, name, email, role };
      });
      setUsers(normalized);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const email = localStorage.getItem("user_email");
    if (email) {
      setUserName(email.split("@")[0] || "Admin");
    }
    (async () => await load())();
  }, []);

  const filteredUsers = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    if (!searchTerm) return users;
    return users.filter((user) => {
      const displayName = user.name?.trim() || user.email?.split("@")[0] || "";
      return (
        displayName.toLowerCase().includes(searchTerm) ||
        (user.email || "").toLowerCase().includes(searchTerm) ||
        String(user.id ?? "").includes(searchTerm)
      );
    });
  }, [users, search]);

  async function onCreateUser() {
    const name = createName.trim();
    const email = createEmail.trim();
    const password = createPassword.trim();

    if (!name || !email || !password) {
      await Swal.fire({
        icon: "warning",
        title: "Incomplete form",
        text: "Name, email, and password are required.",
      });
      return;
    }

    try {
      setSaving(true);
      await createUser({
        name,
        email,
        password,
        role: createRole,
      });
      await load();
      setCreating(false);
      setCreateName("");
      setCreateEmail("");
      setCreatePassword("");
      setCreateRole("user");
      await Swal.fire({
        icon: "success",
        title: "Success",
        text: "User created successfully.",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await Swal.fire({
        icon: "error",
        title: "Failed to create user",
        text: message,
      });
    } finally {
      setSaving(false);
    }
  }

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
    <div className="space-y-6 font-[var(--font-geist-sans)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Welcome back, {userName}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Users</h1>
        </div>
        <div className="text-xs text-slate-400 dark:text-slate-500">Dashboard / Users</div>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              User List
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage registered user profiles.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
              {users.length} users
            </div>
            <button
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm"
              onClick={() => setCreating(true)}
            >
              + Add User
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-4-4" />
              </svg>
            </span>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            onClick={() => setSearch("")}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="p-6 text-sm text-slate-500 dark:text-slate-400">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-6 text-sm text-slate-500 dark:text-slate-400">
            No users found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-tl-2xl rounded-tr-2xl">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u, idx) => {
                  const displayName =
                    u.name?.trim() || (u.email ? u.email.split("@")[0] : "Unknown");
                  const initials = displayName.slice(0, 1).toUpperCase() || "U";
                  return (
                    <tr
                      key={u.id ?? `user-${idx}`}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {displayName}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              Registered account
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                        {u.email || "-"}
                      </td>
                      <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                        {Number.isFinite(u.id) ? u.id : "-"}
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                          {u.role || "user"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end">
                          <button
                            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-700 disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200 dark:disabled:border-slate-800 dark:disabled:bg-slate-900 dark:disabled:text-slate-600"
                            onClick={() => setEditing(u)}
                            disabled={!Number.isFinite(u.id)}
                            title="Edit user"
                          >
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredUsers.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <div>
              Showing 1 - {filteredUsers.length} of {users.length} users
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-md border border-slate-200 px-2 py-1 text-slate-500 dark:border-slate-700 dark:text-slate-300">
                1
              </button>
              <button className="rounded-md border border-slate-200 px-2 py-1 text-slate-400 dark:border-slate-700 dark:text-slate-500">
                2
              </button>
              <button className="rounded-md border border-slate-200 px-2 py-1 text-slate-400 dark:border-slate-700 dark:text-slate-500">
                3
              </button>
            </div>
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
                    Edit User
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Update the user profile information below.
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
              <UserForm
                initial={editing}
                onUpdate={onUpdate}
                onCancel={() => setEditing(null)}
              />
            </div>
          </div>
        </div>
      )}

      {creating && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 p-4"
          onClick={() => setCreating(false)}
        >
          <div
            className="mx-auto my-4 flex min-h-[calc(100vh-2rem)] w-full max-w-lg items-center sm:my-6 sm:min-h-[calc(100vh-3rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-h-[calc(100vh-2rem)] w-full overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:border dark:border-slate-800 dark:bg-slate-900 sm:max-h-[calc(100vh-3rem)] sm:p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Add User
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Create a new user or admin account.
                  </p>
                </div>
                <button
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  onClick={() => setCreating(false)}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M18 6l-12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Name</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="User full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Email</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    type="email"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    type="password"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="Initial password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Role</label>
                  <select
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    value={createRole}
                    onChange={(e) => setCreateRole(e.target.value as "user" | "admin")}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60"
                    onClick={onCreateUser}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Create"}
                  </button>
                  <button
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    onClick={() => setCreating(false)}
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
