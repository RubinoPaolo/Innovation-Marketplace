'use client';

import { useActionState, useEffect, useState } from "react";
import {
  togglePurchaseInterest,
  type PurchaseDecision,
  type PurchaseInterestState,
} from "@/app/actions/toggle-purchase-interest";

type PurchaseInterestPanelProps = {
  productId: number;
  initialState: PurchaseInterestState;
  totalStudents: number;
};

function formatPercentage(yesCount: number, totalStudents: number): string {
  if (totalStudents <= 0) {
    return "0%";
  }

  const percentage = (yesCount / totalStudents) * 100;

  return (
    new Intl.NumberFormat("en-GB", {
      maximumFractionDigits: 1,
    }).format(percentage) + "%"
  );
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

  const [selectedDecision, setSelectedDecision] = useState<
    PurchaseDecision | ""
  >(initialState.decision ?? "");

  const [reason, setReason] = useState(initialState.reason);

  useEffect(() => {
    setSelectedDecision(state.decision ?? "");
    setReason(state.reason);
  }, [state.decision, state.reason]);

  return (
    <section className="premium-surface-strong rounded-[2.2rem] p-5 sm:p-7 lg:p-8">
      <div className="space-y-3">
        <p className="premium-kicker">Product feedback</p>
        <h2 className="text-3xl font-black tracking-[-0.045em] text-slate-950">
          Would you buy this product?
        </h2>
        <p className="max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
          Select Yes or No. You may optionally explain the reason behind your choice.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
        <div className="rounded-[1.7rem] border border-emerald-200 bg-emerald-50/90 p-5">
          <p className="text-sm font-black text-emerald-700">Yes votes</p>
          <p className="mt-2 text-4xl font-black tracking-tight text-emerald-950">
            {state.yesCount}
          </p>
        </div>

        <div className="rounded-[1.7rem] border border-rose-200 bg-rose-50/90 p-5">
          <p className="text-sm font-black text-rose-700">No votes</p>
          <p className="mt-2 text-4xl font-black tracking-tight text-rose-950">
            {state.noCount}
          </p>
        </div>

        <div className="premium-muted rounded-[1.7rem] p-5">
          <p className="text-sm font-black text-slate-500">
            Positive share
          </p>
          <p className="mt-2 text-4xl font-black tracking-tight text-slate-950">
            {formatPercentage(state.yesCount, totalStudents)}
          </p>
        </div>
      </div>

      <div
        aria-live="polite"
        className={`mt-6 min-h-6 text-sm font-black ${
          state.status === "success"
            ? "text-emerald-700"
            : state.status === "error"
              ? "text-rose-700"
              : "text-slate-500"
        }`}
      >
        {state.message ||
          (state.votingOpen
            ? "Voting is open."
            : "Voting is currently closed.")}
      </div>

      <form action={formAction} className="mt-5 space-y-5">
        <input type="hidden" name="productId" value={productId} />

        <fieldset className="space-y-3">
          <legend className="premium-kicker">Your choice</legend>

          <div className="grid gap-3 sm:grid-cols-2">
            <label
              className={`cursor-pointer rounded-[1.7rem] border p-4 transition ${
                selectedDecision === "YES"
                  ? "border-emerald-400 bg-emerald-50 shadow-sm shadow-emerald-900/10"
                  : "border-slate-200 bg-white/80 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <input
                type="radio"
                name="decision"
                value="YES"
                checked={selectedDecision === "YES"}
                onChange={() => setSelectedDecision("YES")}
                className="sr-only"
              />
              <span className="block text-lg font-black text-slate-950">
                Yes
              </span>
              <span className="mt-1 block text-sm font-medium leading-6 text-slate-600">
                I would consider buying this product.
              </span>
            </label>

            <label
              className={`cursor-pointer rounded-[1.7rem] border p-4 transition ${
                selectedDecision === "NO"
                  ? "border-rose-400 bg-rose-50 shadow-sm shadow-rose-900/10"
                  : "border-slate-200 bg-white/80 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <input
                type="radio"
                name="decision"
                value="NO"
                checked={selectedDecision === "NO"}
                onChange={() => setSelectedDecision("NO")}
                className="sr-only"
              />
              <span className="block text-lg font-black text-slate-950">
                No
              </span>
              <span className="mt-1 block text-sm font-medium leading-6 text-slate-600">
                I would not buy this product.
              </span>
            </label>
          </div>
        </fieldset>

        {selectedDecision ? (
          <div className="space-y-2.5">
            <label
              htmlFor="purchase-feedback-reason"
              className="premium-kicker"
            >
              Optional explanation
            </label>
            <textarea
              id="purchase-feedback-reason"
              name="reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={800}
              rows={4}
              placeholder="Explain why you chose Yes or No..."
              className="w-full rounded-[1.7rem] border border-slate-200 bg-white px-4 py-3 text-sm font-medium leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
            <p className="text-xs font-semibold text-slate-500">
              {reason.length}/800 characters
            </p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!state.votingOpen || pending || !selectedDecision}
          className="premium-button-primary inline-flex h-12 w-full items-center justify-center rounded-2xl px-6 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {pending
            ? "Saving..."
            : !state.votingOpen
              ? "Voting closed"
              : "Save my feedback"}
        </button>
      </form>
    </section>
  );
}
