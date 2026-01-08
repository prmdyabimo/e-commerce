"use client";

import React from "react";
import AuthForm from "../components/AuthForm";

export default function RegisterPage() {
  return (
    <div className="auth-center">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold">Create your account</h2>
          <p className="text-sm text-slate-500">Start your free account — it only takes a minute</p>
        </div>
        <AuthForm mode="register" />
        <div className="mt-4 text-center text-sm text-slate-600">
          Already have an account? <a className="text-blue-600 font-medium" href="/login">Sign in</a>
        </div>
      </div>
    </div>
  );
}
