'use client';

import { useActionState } from "react";
import {
  clearReviewedCreateGroupRequestHistory,
  type AdminGroupRequestActionState,
} from "@/app/actions/admin-group-requests";

type AdminClearGroupRequestHistoryPanelProps = {
  reviewedRequestsCount: number;
};

const initialState: AdminGroupRequestActionState = {
  status: "idle",
  message: "",
};

export function AdminClearGroupRequestHistoryPanel({
  reviewedRequestsCount,
}: AdminClearGroupRequestHistoryPanelProps) {
  const [state, formAction, pending] = useActionState(
    clearReviewedCreateGroupRequestHistory,
    initialState,
  );

  return (
    <div className="flex flex-col items-start gap-2 lg:items-end">
      <form
        action={formAction}
        onSubmit={(event) => {
          const confirmed = window.confirm(
            "Clear the full approval and rejection history? Pending requests and already created groups will remain unchanged.",
          );

          if (!confirmed) {
            event.preventDefault();
          }
        }}
      >
        <button
          type="submit"
          disabled={pending || reviewedRequestsCount === 0}
          className="inline-flex h-11 items-center justify-center rounded-2xl border border-rose-200 bg-white px-5 text-sm font-bold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
        >
          {pending ? "Clearing..." : "Clear history"}
        </button>
      </form>

      {state.message ? (
        <p
          aria-live="polite"
          className={`max-w-sm text-xs font-semibold leading-5 ${
            state.status === "success"
              ? "text-emerald-700"
              : "text-rose-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}