'use client';

import { useActionState } from "react";
import {
  createAdminGroup,
  type AdminGroupActionState,
} from "@/app/actions/admin-groups";

const initialState: AdminGroupActionState = {
  status: "idle",
  message: "",
};

export function AdminCreateGroupForm() {
  const [state, formAction, pending] = useActionState(
    createAdminGroup,
    initialState,
  );

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="space-y-3">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
          Create group
        </p>
        <h2 className="text-2xl font-black tracking-tight text-slate-950">
          Add a group directly from the admin area
        </h2>
        <p className="max-w-3xl text-sm leading-7 text-slate-600">
          Use this form when the group is already confirmed and does not need
          to pass through the public request workflow.
        </p>
      </div>

      <form action={formAction} className="mt-6 space-y-5" noValidate>
        <div className="space-y-2">
          <label
            htmlFor="groupName"
            className="block text-sm font-bold text-slate-900"
          >
            Group name
          </label>
          <input
            id="groupName"
            name="groupName"
            type="text"
            required
            placeholder="Example: Future Makers"
            className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="studentNumbers"
            className="block text-sm font-bold text-slate-900"
          >
            Student IDs
          </label>
          <textarea
            id="studentNumbers"
            name="studentNumbers"
            required
            placeholder={
              "Enter one or more student IDs.\nSeparate them with new lines, commas or semicolons."
            }
            className="min-h-40 w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base leading-7 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
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
          {state.message || "No group created yet."}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          {pending ? "Creating..." : "Create group"}
        </button>
      </form>
    </section>
  );
}