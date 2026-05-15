'use client';

import { useActionState } from "react";
import {
  togglePurchaseInterest,
  type PurchaseInterestState,
} from "@/app/actions/toggle-purchase-interest";

type PurchaseInterestPanelProps = {
  productId: number;
  initialState: PurchaseInterestState;
  totalStudents: number;
};

function formatPercentage(interestedCount: number, totalStudents: number): string {
  if (totalStudents <= 0) {
    return "0%";
  }

  const percentage = (interestedCount / totalStudents) * 100;

  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 1,
  }).format(percentage) + "%";
}

export function PurchaseInterestPanel({
  productId,
  initialState,
  totalStudents,
}: PurchaseInterestPanelProps) {
  const [state, formAction, pending] = useActionState(
    togglePurchaseInterest,
    initialState,
  );

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="space-y-3">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
          Purchase interest
        </p>
        <h2 className="text-2xl font-black tracking-tight text-slate-950">
          Would you buy this product?
        </h2>
        <p className="max-w-3xl text-sm leading-7 text-slate-600">
          Your answer contributes to the demand signal collected for this innovation.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-slate-100 p-5">
          <p className="text-sm font-semibold text-slate-500">
            Interested students
          </p>
          <p className="mt-2 text-4xl font-black text-slate-950">
            {state.interestedCount}
          </p>
        </div>

        <div className="rounded-3xl bg-slate-100 p-5">
          <p className="text-sm font-semibold text-slate-500">
            Share of registered students
          </p>
          <p className="mt-2 text-4xl font-black text-slate-950">
            {formatPercentage(state.interestedCount, totalStudents)}
          </p>
        </div>
      </div>

      <div
        aria-live="polite"
        className={`mt-6 min-h-6 text-sm font-bold ${
          state.status === "success"
            ? "text-emerald-700"
            : state.status === "error"
              ? "text-rose-700"
              : "text-slate-500"
        }`}
      >
        {state.message || (state.votingOpen ? "Voting is open." : "Voting is currently closed.")}
      </div>

      <form action={formAction} className="mt-5">
        <input type="hidden" name="productId" value={productId} />
        <button
          type="submit"
          disabled={!state.votingOpen || pending}
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
        >
          {pending
            ? "Updating..."
            : !state.votingOpen
              ? "Voting closed"
              : state.isInterested
                ? "Remove my interest"
                : "I would buy it"}
        </button>
      </form>
    </section>
  );
}
