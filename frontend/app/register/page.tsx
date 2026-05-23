"use client";

import React from "react";
import AuthForm from "../components/AuthForm";

export default function RegisterPage() {
  return (
    <div className="auth-center">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Create your account
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Start your free account - it only takes a minute
          </p>
        </div>
        <AuthForm mode="register" />
        <div className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{" "}
          <a className="font-medium text-blue-600 dark:text-blue-400" href="/login">
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
}
