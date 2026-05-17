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
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="space-y-3">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
          Product feedback
        </p>
        <h2 className="text-2xl font-black tracking-tight text-slate-950">
          Would you buy this product?
        </h2>
        <p className="max-w-3xl text-sm leading-7 text-slate-600">
          Select Yes or No. You may optionally explain the reason behind your
          choice.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl bg-emerald-50 p-5">
          <p className="text-sm font-semibold text-emerald-700">Yes votes</p>
          <p className="mt-2 text-4xl font-black text-emerald-950">
            {state.yesCount}
          </p>
        </div>

        <div className="rounded-3xl bg-rose-50 p-5">
          <p className="text-sm font-semibold text-rose-700">No votes</p>
          <p className="mt-2 text-4xl font-black text-rose-950">
            {state.noCount}
          </p>
        </div>

        <div className="rounded-3xl bg-slate-100 p-5">
          <p className="text-sm font-semibold text-slate-500">
            Positive share
          </p>
          <p className="mt-2 text-4xl font-black text-slate-950">
            {formatPercentage(state.yesCount, totalStudents)}
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
        {state.message ||
          (state.votingOpen
            ? "Voting is open."
            : "Voting is currently closed.")}
      </div>

      <form action={formAction} className="mt-5 space-y-5">
        <input type="hidden" name="productId" value={productId} />

        <fieldset className="space-y-3">
          <legend className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
            Your choice
          </legend>

          <div className="grid gap-3 sm:grid-cols-2">
            <label
              className={`cursor-pointer rounded-3xl border p-4 transition ${
                selectedDecision === "YES"
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
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
              <span className="mt-1 block text-sm leading-6 text-slate-600">
                I would consider buying this product.
              </span>
            </label>

            <label
              className={`cursor-pointer rounded-3xl border p-4 transition ${
                selectedDecision === "NO"
                  ? "border-rose-500 bg-rose-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
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
              <span className="mt-1 block text-sm leading-6 text-slate-600">
                I would not buy this product.
              </span>
            </label>
          </div>
        </fieldset>

        {selectedDecision ? (
          <div className="space-y-2">
            <label
              htmlFor="purchase-feedback-reason"
              className="block text-sm font-black uppercase tracking-[0.18em] text-slate-500"
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
              className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
            />
            <p className="text-xs font-semibold text-slate-500">
              {reason.length}/800 characters
            </p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!state.votingOpen || pending || !selectedDecision}
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
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