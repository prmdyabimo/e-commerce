"use client";

import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { createUser, deleteUser, fetchUsers, updateUser } from "../../../lib/api";
import UserForm from "../../../components/UserForm";

type User = { id?: number; name?: string; email?: string; role?: "user" | "admin" };

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
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  async function load() {
    try {
      setLoading(true);
      setLoadError(null);
      const d = await fetchUsers();
      const normalized = (Array.isArray(d) ? d : []).map((u) => {
        const rec = u as unknown as Record<string, unknown>;
        const rawId = rec.id ?? rec.ID;
        const parsedId =
          typeof rawId === "number" ? rawId : Number.parseFloat(String(rawId));
        const id = Number.isFinite(parsedId) ? parsedId : undefined;
        const name = String(rec.name ?? rec.Name ?? "").trim();
        const email = String(rec.email ?? rec.Email ?? "").trim();
        const role: User["role"] =
          String(rec.role ?? rec.Role ?? "user").trim() === "admin" ? "admin" : "user";
        return { id, name, email, role };
      });
      setUsers(normalized);
    } catch (err) {
      console.error("load users error", err);
      setLoadError(err instanceof Error ? err.message : "Pengguna gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const email = localStorage.getItem("user_email");
    setCurrentUserEmail(email || "");
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
        title: "Form belum lengkap",
        text: "Nama, email, dan kata sandi wajib diisi.",
      });
      return;
    }
    if (password.length < 8) {
      await Swal.fire({
        icon: "warning",
        title: "Kata sandi terlalu pendek",
        text: "Gunakan minimal 8 karakter.",
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
        title: "Berhasil",
        text: "Pengguna berhasil dibuat.",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await Swal.fire({
        icon: "error",
        title: "Pengguna gagal dibuat",
        text: message,
      });
    } finally {
      setSaving(false);
    }
  }

  async function onUpdate(
    id: string | number,
    payload: { name?: string; email?: string; role?: "user" | "admin" }
  ) {
    try {
      const nid = typeof id === "number" ? id : Number(id);
      if (!Number.isFinite(nid) || nid <= 0) {
        await Swal.fire({
          icon: "error",
          title: "Pembaruan gagal",
          text: "ID pengguna tidak valid.",
        });
        return;
      }

      await updateUser(nid, payload);
      await load();
      setEditing(null);
      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Data pengguna berhasil diperbarui.",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await Swal.fire({
        icon: "error",
        title: "Data pengguna gagal diperbarui",
        text: message,
      });
    }
  }

  async function onDelete(user: User) {
    if (!Number.isFinite(user.id)) return;
    if (user.email?.toLowerCase() === currentUserEmail.toLowerCase()) {
      await Swal.fire({
        icon: "info",
        title: "Akun yang sedang digunakan",
        text: "Anda tidak dapat menghapus akun yang sedang digunakan.",
      });
      return;
    }

    const result = await Swal.fire({
      icon: "warning",
      title: "Hapus pengguna?",
      text: `Akun ${user.email || user.name || user.id} akan dihapus permanen.`,
      showCancelButton: true,
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;

    try {
      setDeletingId(user.id!);
      await deleteUser(user.id!);
      await load();
      await Swal.fire({
        icon: "success",
        title: "Pengguna berhasil dihapus",
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await Swal.fire({
        icon: "error",
        title: "Pengguna gagal dihapus",
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
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Selamat datang, {userName}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Pengguna</h1>
        </div>
        <div className="text-xs text-slate-400 dark:text-slate-500">Dashboard / Pengguna</div>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Daftar pengguna
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kelola akun pelanggan dan administrator.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              {users.length} pengguna
            </div>
            <button
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              onClick={() => setCreating(true)}
            >
              + Tambah pengguna
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
              placeholder="Cari pengguna..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            onClick={() => setSearch("")}
          >
            Atur ulang
          </button>
        </div>
      </div>

      {loadError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
          <span>Data pengguna belum dapat dimuat: {loadError}</span>
          <button type="button" onClick={() => void load()} className="rounded-lg bg-rose-700 px-3 py-2 text-xs font-bold text-white hover:bg-rose-800">Coba lagi</button>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="p-6 text-sm text-slate-500 dark:text-slate-400">Memuat pengguna...</div>
        ) : loadError ? null : filteredUsers.length === 0 ? (
          <div className="p-6 text-sm text-slate-500 dark:text-slate-400">
            Pengguna tidak ditemukan.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-tl-2xl rounded-tr-2xl">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Pengguna</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Peran</th>
                  <th className="px-4 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u, idx) => {
                  const displayName =
                    u.name?.trim() || (u.email ? u.email.split("@")[0] : "Pengguna");
                  const initials = displayName.slice(0, 1).toUpperCase() || "U";
                  return (
                    <tr
                      key={u.id ?? `user-${idx}`}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {displayName}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              Akun terdaftar
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
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${u.role === "admin" ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"}`}>
                          {u.role === "admin" ? "Admin" : "Pelanggan"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-700 disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200 dark:disabled:border-slate-800 dark:disabled:bg-slate-900 dark:disabled:text-slate-600"
                            onClick={() => setEditing(u)}
                            disabled={!Number.isFinite(u.id)}
                            title="Ubah pengguna"
                          >
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400"
                            onClick={() => void onDelete(u)}
                            disabled={!Number.isFinite(u.id) || deletingId === u.id || u.email?.toLowerCase() === currentUserEmail.toLowerCase()}
                            title={u.email?.toLowerCase() === currentUserEmail.toLowerCase() ? "Tidak dapat menghapus akun sendiri" : "Hapus pengguna"}
                          >
                            {deletingId === u.id ? "…" : (
                              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v6m4-6v6" />
                              </svg>
                            )}
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
              Menampilkan 1–{filteredUsers.length} dari {users.length} pengguna
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
                    Ubah pengguna
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Perbarui informasi akun pengguna berikut.
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
                    Tambah pengguna
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Buat akun pelanggan atau administrator.
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
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Nama</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="Nama lengkap"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Email</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    type="email"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Kata sandi</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    type="password"
                    minLength={8}
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Peran</label>
                  <select
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    value={createRole}
                    onChange={(e) => setCreateRole(e.target.value as "user" | "admin")}
                  >
                    <option value="user">Pelanggan</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
                    onClick={onCreateUser}
                    disabled={saving}
                  >
                    {saving ? "Menyimpan..." : "Buat akun"}
                  </button>
                  <button
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    onClick={() => setCreating(false)}
                  >
                    Batal
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
