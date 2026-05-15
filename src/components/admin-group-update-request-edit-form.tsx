'use client';

import { useActionState } from "react";
import {
  updatePendingGroupUpdateRequest,
  type AdminGroupRequestActionState,
} from "@/app/actions/admin-group-requests";

type AdminGroupUpdateRequestEditFormProps = {
  requestId: number;
  currentGroupName: string;
  requestedGroupName: string | null;
  studentNumbersToAdd: string[];
  studentNumbersToRemove: string[];
  adminNote: string | null;
  disabled?: boolean;
};

const initialState: AdminGroupRequestActionState = {
  status: "idle",
  message: "",
};

export function AdminGroupUpdateRequestEditForm({
  requestId,
  currentGroupName,
  requestedGroupName,
  studentNumbersToAdd,
  studentNumbersToRemove,
  adminNote,
  disabled = false,
}: AdminGroupUpdateRequestEditFormProps) {
  const [state, formAction, pending] = useActionState(
    updatePendingGroupUpdateRequest,
    initialState,
  );

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="space-y-3">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
          Admin review adjustments
        </p>
        <h2 className="text-2xl font-black tracking-tight text-slate-950">
          Edit the requested group changes
        </h2>
        <p className="max-w-3xl text-sm leading-7 text-slate-600">
          You can refine the proposed name, student IDs to add, student IDs to remove and the internal admin note before making the final decision.
        </p>
      </div>

      <form action={formAction} className="mt-6 space-y-5" noValidate>
        <input type="hidden" name="requestId" value={requestId} />

        <div className="space-y-2">
          <label
            htmlFor="requestedGroupName"
            className="block text-sm font-bold text-slate-900"
          >
            Requested group name
          </label>
          <input
            id="requestedGroupName"
            name="requestedGroupName"
            type="text"
            defaultValue={requestedGroupName ?? currentGroupName}
            disabled={disabled}
            className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
          />
          <p className="text-xs font-semibold leading-5 text-slate-500">
            Keeping the current group name means no rename will be applied.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="studentNumbersToAdd"
              className="block text-sm font-bold text-slate-900"
            >
              Student IDs to add
            </label>
            <textarea
              id="studentNumbersToAdd"
              name="studentNumbersToAdd"
              defaultValue={studentNumbersToAdd.join("\n")}
              disabled={disabled}
              placeholder={'Optional. Enter one or more student IDs.\nSeparate them with new lines, commas or semicolons.'}
              className="min-h-40 w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base leading-7 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="studentNumbersToRemove"
              className="block text-sm font-bold text-slate-900"
            >
              Student IDs to remove
            </label>
            <textarea
              id="studentNumbersToRemove"
              name="studentNumbersToRemove"
              defaultValue={studentNumbersToRemove.join("\n")}
              disabled={disabled}
              placeholder={'Optional. Enter the existing active student IDs that should be removed.'}
              className="min-h-40 w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base leading-7 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>
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
