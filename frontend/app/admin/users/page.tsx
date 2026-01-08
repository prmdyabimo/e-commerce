"use client";

import React, { useEffect, useState } from "react";
import { fetchUsers } from "../../../lib/api";

type User = { id: string; name?: string; email: string };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchUsers().then((d) => setUsers(d || []));
  }, []);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h3 className="text-lg font-medium mb-3">Users</h3>
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between p-3 border rounded-md">
            <div>
              <div className="font-medium">{u.name || u.email.split("@")[0]}</div>
              <div className="text-sm text-slate-500">{u.email}</div>
            </div>
            <div className="text-sm text-slate-600">ID: {u.id}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
