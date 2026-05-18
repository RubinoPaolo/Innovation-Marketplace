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
    <section className="premium-surface-strong rounded-[2.2rem] p-5 sm:p-7 lg:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <p className="premium-kicker">Voting control</p>
          <h2 className="text-3xl font-black tracking-[-0.045em] text-slate-950">
            {state.isOpen ? "Voting is currently open." : "Voting is currently closed."}
          </h2>
          <p className="max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
            When voting is open, students can indicate whether they would buy published products. Closing voting freezes new responses.
          </p>
        </div>

        <div className="premium-muted min-w-[12rem] rounded-[1.7rem] px-5 py-4">
          <p className="text-sm font-bold text-slate-500">Current status</p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`h-3 w-3 rounded-full ${
                state.isOpen
                  ? "bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.12)]"
                  : "bg-amber-500 shadow-[0_0_0_6px_rgba(245,158,11,0.12)]"
              }`}
            />
            <p
              className={`text-lg font-black ${
                state.isOpen ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {state.isOpen ? "Open" : "Closed"}
            </p>
          </div>
        </div>
      </div>

      <form action={formAction} className="mt-6 space-y-5">
        <div
          aria-live="polite"
          className={`min-h-6 text-sm font-black ${
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
          className="premium-button-primary inline-flex h-12 items-center justify-center rounded-2xl px-6 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80 disabled:cursor-not-allowed disabled:opacity-60"
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
