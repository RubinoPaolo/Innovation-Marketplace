'use client';

import { useActionState, useState } from "react";
import {
  deleteCourseEdition,
  type AdminCourseEditionActionState,
} from "@/app/actions/admin-course-editions";

type AdminCourseEditionDeleteFormProps = {
  editionId: number;
  editionName: string;
  isActive: boolean;
};

const initialState: AdminCourseEditionActionState = {
  status: "idle",
  message: "",
};

export function AdminCourseEditionDeleteForm({
  editionId,
  editionName,
  isActive,
}: AdminCourseEditionDeleteFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    deleteCourseEdition,
    initialState,
  );

  return (
    <div className="space-y-3 lg:text-right">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex h-11 items-center justify-center rounded-2xl border border-rose-200 bg-white px-5 text-sm font-bold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100"
        >
          Delete edition
        </button>
      ) : (
        <form
          action={formAction}
          className="w-full rounded-3xl border border-rose-200 bg-rose-50 p-4 text-left lg:w-[22rem]"
          onSubmit={(event) => {
            const activeWarning = isActive
              ? " This is the active edition: after deletion, the platform will have no active edition until another one is activated."
              : "";

            const confirmed = window.confirm(
              `Permanently delete ${editionName}? This removes groups, student IDs, products, requests, votes and uploaded product images linked to the edition.${activeWarning}`,
            );

            if (!confirmed) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="editionId" value={editionId} />

          <div className="space-y-2">
            <label
              htmlFor={`adminPassword-${editionId}`}
              className="block text-sm font-bold text-rose-900"
            >
              Admin password required
            </label>
            <input
              id={`adminPassword-${editionId}`}
              name="adminPassword"
              type="password"
              autoComplete="current-password"
              placeholder="Enter admin password"
              className="h-11 w-full rounded-2xl border border-rose-200 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
            />
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-2xl bg-rose-700 px-4 text-sm font-bold text-white transition hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            >
              {pending ? "Deleting..." : "Confirm deletion"}
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={pending}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              Cancel
            </button>
          </div>

          {state.message ? (
            <p
              aria-live="polite"
              className={`mt-3 text-xs font-semibold leading-5 ${
                state.status === "success"
                  ? "text-emerald-700"
                  : "text-rose-700"
              }`}
            >
              {state.message}
            </p>
          ) : null}
        </form>
      )}

      {!isOpen && state.message ? (
        <p
          aria-live="polite"
          className={`max-w-xs text-xs font-semibold leading-5 ${
            state.status === "success" ? "text-emerald-700" : "text-rose-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
