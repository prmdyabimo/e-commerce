"use client";

import React from "react";
import AuthForm from "../components/AuthForm";

export default function LoginPage() {
  return (
    <div className="auth-center">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold">Welcome back</h2>
          <p className="text-sm text-slate-500">Sign in to continue to your account</p>
        </div>
        <AuthForm mode="login" />
        <div className="mt-4 text-center text-sm text-slate-600">
          Don’t have an account? <a className="text-blue-600 font-medium" href="/register">Create one</a>
        </div>
      </div>
    </div>
  );
}
