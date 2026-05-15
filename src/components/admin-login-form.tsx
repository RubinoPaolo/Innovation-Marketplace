'use client';

import { useActionState } from "react";
import {
  loginAdmin,
  type AdminLoginState,
} from "@/app/actions/admin-auth";

const initialAdminLoginState: AdminLoginState = {
  status: "idle",
  message: "",
};

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAdmin,
    initialAdminLoginState,
  );

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-bold text-slate-900"
        >
          Admin password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter the admin password"
          required
          className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
        />
      </div>

      <div
        aria-live="polite"
        className={`min-h-6 text-sm font-bold ${
          state.status === "error" ? "text-rose-700" : "text-slate-500"
        }`}
      >
        {state.message || "Use the password configured in the project environment."}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {pending ? "Checking..." : "Enter admin area"}
      </button>
    </form>
  );
}
