'use client';

import { useActionState } from "react";
import {
  withdrawProduct,
  type WithdrawProductState,
} from "@/app/actions/withdraw-product";

type GroupProductWithdrawButtonProps = {
  productTitle: string;
};

const initialState: WithdrawProductState = {
  status: "idle",
  message: "",
};

export function GroupProductWithdrawButton({
  productTitle,
}: GroupProductWithdrawButtonProps) {
  const [state, formAction, pending] = useActionState(
    withdrawProduct,
    initialState,
  );

  return (
    <div className="flex flex-col gap-2">
      <form
        action={formAction}
        onSubmit={(event) => {
          const confirmed = window.confirm(
            `Withdraw "${productTitle}" from the public catalog? It will return to draft status. Existing voting data will remain stored.`,
          );

          if (!confirmed) {
            event.preventDefault();
          }
        }}
      >
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-rose-200 bg-white px-5 text-sm font-bold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 sm:w-auto"
        >
          {pending ? "Withdrawing..." : "Withdraw product"}
        </button>
      </form>

      {state.message ? (
        <p
          aria-live="polite"
          className={`max-w-md text-xs font-semibold leading-5 ${
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