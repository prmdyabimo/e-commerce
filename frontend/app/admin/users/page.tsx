"use client";

import React, { useEffect, useState } from "react";
import { fetchUsers, updateUser } from "../../../lib/api";
import UserForm from "../../../components/UserForm";

type User = { id?: number; name?: string; email?: string };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [editing, setEditing] = useState<User | null>(null);

  async function load() {
    const d = await fetchUsers();
    setUsers(d || []);
  }

  useEffect(() => {
    (async () => await load())();
  }, []);

  async function onUpdate(
    id: string | number,
    payload: { name?: string; email?: string }
  ) {
    await updateUser(id, payload);
    await load();
    setEditing(null);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-lg font-medium mb-3">Users</h3>
          <div className="space-y-2">
            {users.map((u, idx) => (
              <div
                key={u.id ?? `user-${idx}`}
                className="flex items-center justify-between p-3 border rounded-md"
              >
                <div>
                  <div className="font-medium">
                    {u.name ?? (u.email ? u.email.split("@")[0] : "Unknown")}
                  </div>
                  <div className="text-sm text-slate-500">{u.email}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-slate-600">ID: {u.id}</div>
                  <button
                    className="text-sm text-slate-600"
                    onClick={() => setEditing(u)}
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
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-lg font-medium mb-2">
            {editing?.id ? "Edit user" : "Select a user"}
          </h3>
          {editing ? (
            <UserForm
              initial={editing}
              onUpdate={onUpdate}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <div className="text-sm text-slate-500">
              Select a user to edit their name or email.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
