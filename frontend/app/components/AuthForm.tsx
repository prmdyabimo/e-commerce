"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "../../lib/auth";

type Mode = "login" | "register";

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        const res = await signIn({ email, password });
        if (res?.token) {
          localStorage.setItem("token", res.token);
          router.push("/");
        } else {
          setError(res?.message || "Login failed");
        }
      } else {
        const res = await signUp({ name, email, password });
        if (res?.token) {
          localStorage.setItem("token", res.token);
          router.push("/");
        } else {
          setError(res?.message || "Registration failed");
        }
      }
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "register" && (
        <div>
          <label className="block text-sm font-medium text-slate-700">Name</label>
          <input
            className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            required
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700">Email</label>
        <input
          className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Password</label>
        <input
          className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 4 characters"
          required
        />
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div>
        <button
          className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-white shadow hover:opacity-95 disabled:opacity-60"
          type="submit"
          disabled={loading}
        >
          {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </div>
    </form>
  );
}
