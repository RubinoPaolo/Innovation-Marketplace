'use client';

import { useActionState } from "react";
import {
  toggleVotingStatus,
  type VotingStatusState,
} from "@/app/actions/toggle-voting-status";

type VotingControlPanelProps = {
  initialIsOpen: boolean;
};

export function VotingControlPanel({
  initialIsOpen,
}: VotingControlPanelProps) {
  const initialState: VotingStatusState = {
    status: "idle",
    message: "",
    isOpen: initialIsOpen,
  };

  const [state, formAction, pending] = useActionState(
    toggleVotingStatus,
    initialState,
  );

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
            Voting control
          </p>
          <h2 className="text-2xl font-black tracking-tight text-slate-950">
            {state.isOpen ? "Voting is currently open" : "Voting is currently closed"}
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-slate-600">
            When voting is open, students can indicate whether they would buy published products. Closing voting freezes new responses.
          </p>
        </div>

        <div className="rounded-3xl bg-slate-100 px-5 py-4">
          <p className="text-sm font-semibold text-slate-500">Current status</p>
          <p
            className={`mt-1 text-lg font-black ${
              state.isOpen ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {state.isOpen ? "Open" : "Closed"}
          </p>
        </div>
      </div>

      <form action={formAction} className="mt-6 space-y-5">
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
          {state.message || "No voting status change made yet."}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {pending
            ? "Updating..."
            : state.isOpen
              ? "Close voting"
              : "Open voting"}
        </button>
      </form>
    </section>
  );
}
