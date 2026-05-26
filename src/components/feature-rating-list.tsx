'use client';

import { useActionState } from "react";
import {
  rateProductFeature,
  type FeatureRatingState,
} from "@/app/actions/rate-product-feature";

export type FeatureRatingItem = {
  id: number;
  text: string;
  averageRating: number | null;
  ratingCount: number;
  currentRating: number | null;
};

type FeatureRatingListProps = {
  features: FeatureRatingItem[];
  votingOpen: boolean;
  isOwnProduct: boolean;
};

type FeatureRatingCardProps = {
  feature: FeatureRatingItem;
  votingOpen: boolean;
  isOwnProduct: boolean;
};

function formatAverageRating(averageRating: number | null): string {
  if (averageRating === null) {
    return "No ratings yet";
  }

  return `${averageRating.toFixed(1)} / 5`;
}

function FeatureRatingCard({
  feature,
  votingOpen,
  isOwnProduct,
}: FeatureRatingCardProps) {
  const initialState: FeatureRatingState = {
    status: "idle",
    message: "",
    featureId: feature.id,
    currentRating: feature.currentRating,
    averageRating: feature.averageRating,
    ratingCount: feature.ratingCount,
    votingOpen,
    isOwnProduct,
  };

  const [state, formAction, pending] = useActionState(
    rateProductFeature,
    initialState,
  );

  const canSaveRating = state.votingOpen && !state.isOwnProduct && !pending;
  const canWithdrawRating =
    state.currentRating !== null && (state.votingOpen || state.isOwnProduct);

  return (
    <article className="premium-muted rounded-[1.8rem] p-4 sm:p-5">
      <div className="space-y-4">
        <div className="space-y-3">
          <p className="text-base font-black leading-7 text-slate-950">
            {feature.text}
          </p>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full border border-white/80 bg-white/82 px-3 py-1 font-black text-slate-700">
              Average: {formatAverageRating(state.averageRating)}
            </span>
            <span className="rounded-full border border-white/80 bg-white/82 px-3 py-1 font-bold text-slate-600">
              {state.ratingCount} rating{state.ratingCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <form action={formAction} className="space-y-3">
          <input type="hidden" name="featureId" value={feature.id} />

          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((rating) => {
              const selected =
                state.currentRating !== null && rating <= state.currentRating;

              return (
                <button
                  key={`${feature.id}-${rating}`}
                  type="submit"
                  name="rating"
                  value={rating}
                  disabled={!canSaveRating}
                  aria-label={`Rate this feature ${rating} out of 5 stars`}
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl border text-2xl transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-100 ${
                    selected
                      ? "border-amber-400 bg-amber-100 text-amber-500 shadow-sm shadow-amber-900/10"
                      : "border-slate-200 bg-white/90 text-slate-300 hover:border-amber-300 hover:text-amber-400"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  ★
                </button>
              );
            })}
          </div>

          {state.currentRating !== null ? (
            <button
              type="submit"
              name="intent"
              value="WITHDRAW"
              disabled={!canWithdrawRating || pending}
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-black text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Processing..." : "Withdraw feature rating"}
            </button>
          ) : null}

          <div
            aria-live="polite"
            className={`min-h-5 text-sm font-black ${
              state.status === "success"
                ? "text-emerald-700"
                : state.status === "error"
                  ? "text-rose-700"
                  : "text-slate-500"
            }`}
          >
            {state.message ||
              (state.isOwnProduct
                ? "Your group cannot rate its own product. Existing self-ratings can be withdrawn."
                : state.votingOpen
                  ? "Select from 1 to 5 stars."
                  : "Voting is currently closed.")}
          </div>
        </form>
      </div>
    </article>
  );
}

export function FeatureRatingList({
  features,
  votingOpen,
  isOwnProduct,
}: FeatureRatingListProps) {
  if (features.length === 0) {
    return null;
  }

  return (
    <section className="premium-surface-strong rounded-[2.2rem] p-5 sm:p-7 lg:p-8">
      <p className="premium-kicker">Feature ratings</p>
      <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] text-slate-950">
        Rate the strengths of this product.
      </h2>
      <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
        Each feature can be evaluated independently from 1 to 5 stars. Groups
        cannot rate features of their own product.
      </p>

      <div className="mt-6 grid gap-4">
        {features.map((feature) => (
          <FeatureRatingCard
            key={feature.id}
            feature={feature}
            votingOpen={votingOpen}
            isOwnProduct={isOwnProduct}
          />
        ))}
      </div>
    </section>
  );
}