"use client";

import React, { useState } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { getTokenRole, signIn, signUp } from "../../lib/auth";

type Mode = "login" | "register";

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        // signIn now returns { status, body }
        if (res?.status === 200 && res.body?.token) {
          localStorage.setItem("token", res.body.token);
          localStorage.setItem("user_email", email.trim());
          const role = getTokenRole(res.body.token) || "user";
          localStorage.setItem("user_role", role);
          router.push(role === "admin" ? "/admin" : "/shop");
        } else {
          setError(res?.body?.error || res?.body?.message || "Login failed");
        }
      } else {
        const res = await signUp({ name, email, password });
        // register on backend returns message, not token
        if (res?.status === 200 || res?.status === 201) {
          await Swal.fire({
            icon: "success",
            title: "Success",
            text: "Registration successful. Please login.",
            timer: 1600,
            showConfirmButton: false,
          });
          // registration successful -> redirect to login
          router.push("/login");
        } else {
          const message =
            res?.body?.error || res?.body?.message || "Registration failed";
          setError(message);
          await Swal.fire({
            icon: "error",
            title: "Registration failed",
            text: message,
          });
        }
      }
    } catch (err: unknown) {
      // err may be an Error or string; try to read message if present
      const maybeMsg = typeof err === "object" && err !== null && "message" in err ? (err as { message?: unknown }).message : undefined;
      setError((maybeMsg as string) || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "register" && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
          <input
            className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            required
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
        <input
          className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
        <div className="relative mt-1">
          <input
            className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-slate-900 shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 4 characters"
            required
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  d="M2.1 3.5l18.4 17-1.2 1.3-3.2-3A10.7 10.7 0 0 1 12 20C6.5 20 2 15 2 12c0-1.5 1-3.4 2.7-5.1L1 5.1 2.1 3.5zm5.3 5A4 4 0 0 0 12 16c.7 0 1.3-.1 1.9-.4l-1.6-1.5a2 2 0 0 1-2.8-2.8L7.4 8.5zm4.6-2.6c4.7 0 9.2 4.4 9.2 6.1 0 1-1.1 2.7-2.9 4.2l-2-1.9c.5-.6.8-1.4.8-2.3a4 4 0 0 0-4-4c-.8 0-1.6.2-2.2.7l-2-1.9c.9-.6 2-1 3.1-1z"
                  fill="currentColor"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  d="M12 5c5.5 0 10 4.9 10 7s-4.5 7-10 7S2 14.1 2 12s4.5-7 10-7zm0 2C7.4 7 3.7 10.7 3.7 12S7.4 17 12 17s8.3-3.7 8.3-5S16.6 7 12 7zm0 2.2A2.8 2.8 0 1 1 9.2 12 2.8 2.8 0 0 1 12 9.2z"
                  fill="currentColor"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}

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
