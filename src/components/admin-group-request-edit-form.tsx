'use client';

import { useActionState } from "react";
import {
  updatePendingGroupRequest,
  type AdminGroupRequestActionState,
} from "@/app/actions/admin-group-requests";

type AdminGroupRequestEditFormProps = {
  requestId: number;
  requestedGroupName: string | null;
  studentNumbers: string[];
  adminNote: string | null;
  disabled?: boolean;
};

const initialState: AdminGroupRequestActionState = {
  status: "idle",
  message: "",
};

export function AdminGroupRequestEditForm({
  requestId,
  requestedGroupName,
  studentNumbers,
  adminNote,
  disabled = false,
}: AdminGroupRequestEditFormProps) {
  const [state, formAction, pending] = useActionState(
    updatePendingGroupRequest,
    initialState,
  );

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="space-y-3">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
          Admin review adjustments
        </p>
        <h2 className="text-2xl font-black tracking-tight text-slate-950">
          Edit the proposal before approval
        </h2>
        <p className="max-w-3xl text-sm leading-7 text-slate-600">
          You can correct the proposed group name, update the requested student IDs and store an internal admin note before deciding whether to approve the request.
        </p>
      </div>

      <form action={formAction} className="mt-6 space-y-5" noValidate>
        <input type="hidden" name="requestId" value={requestId} />

        <div className="space-y-2">
          <label
            htmlFor="requestedGroupName"
            className="block text-sm font-bold text-slate-900"
          >
            Proposed group name
          </label>
          <input
            id="requestedGroupName"
            name="requestedGroupName"
            type="text"
            defaultValue={requestedGroupName ?? ""}
            disabled={disabled}
            required
            className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="studentNumbers"
            className="block text-sm font-bold text-slate-900"
          >
            Requested student IDs
          </label>
          <textarea
            id="studentNumbers"
            name="studentNumbers"
            defaultValue={studentNumbers.join("\n")}
            disabled={disabled}
            required
            className="min-h-40 w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base leading-7 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="adminNote" className="block text-sm font-bold text-slate-900">
            Admin note
          </label>
          <textarea
            id="adminNote"
            name="adminNote"
            defaultValue={adminNote ?? ""}
            disabled={disabled}
            placeholder="Optional internal note for this request."
            className="min-h-28 w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base leading-7 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
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
          {state.message || "No admin adjustment saved yet."}
        </div>

        <button
          type="submit"
          disabled={disabled || pending}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          {pending ? "Saving..." : "Save review adjustments"}
        </button>
      </form>
    </section>
  );
}
