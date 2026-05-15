'use client';

import { useActionState } from "react";
import {
  createCourseEdition,
  type AdminCourseEditionActionState,
} from "@/app/actions/admin-course-editions";

const initialState: AdminCourseEditionActionState = {
  status: "idle",
  message: "",
};

export function AdminCourseEditionCreateForm() {
  const [state, formAction, pending] = useActionState(
    createCourseEdition,
    initialState,
  );

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="space-y-3">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
          Create edition
        </p>
        <h2 className="text-2xl font-black tracking-tight text-slate-950">
          Add a new academic cycle
        </h2>
        <p className="max-w-3xl text-sm leading-7 text-slate-600">
          Create the next course edition without touching the database manually. New editions start inactive and with voting closed.
        </p>
      </div>

      <form action={formAction} className="mt-6 space-y-5" noValidate>
        <div className="space-y-2">
          <label htmlFor="editionName" className="block text-sm font-bold text-slate-900">
            Edition name
          </label>
          <input
            id="editionName"
            name="name"
            type="text"
            required
            placeholder="Example: Innovation Management 20**/20**"
            className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="academicYear" className="block text-sm font-bold text-slate-900">
            Academic year
          </label>
          <input
            id="academicYear"
            name="academicYear"
            type="text"
            required
            placeholder="Example: 2026/2027"
            className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
          />
        </div>

        <div
          aria-live="polite"
          className={`min-h-6 text-sm font-bold ${
            state.status === "success"
              ? "text-emerald-700"
              : state.status === "error"
                ? "text-rose-700"
                : "text-slate-500"
          }`}
        >
          {state.message || "No new course edition created yet."}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          {pending ? "Creating..." : "Create course edition"}
        </button>
      </form>
    </section>
  );
}
