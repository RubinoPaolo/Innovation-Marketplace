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
};

type FeatureRatingCardProps = {
  feature: FeatureRatingItem;
  votingOpen: boolean;
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
}: FeatureRatingCardProps) {
  const initialState: FeatureRatingState = {
    status: "idle",
    message: "",
    featureId: feature.id,
    currentRating: feature.currentRating,
    averageRating: feature.averageRating,
    ratingCount: feature.ratingCount,
    votingOpen,
  };

  const [state, formAction, pending] = useActionState(
    rateProductFeature,
    initialState,
  );

  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="space-y-3">
        <p className="text-base font-bold leading-7 text-slate-950">
          {feature.text}
        </p>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-white px-3 py-1 font-black text-slate-700">
            Average: {formatAverageRating(state.averageRating)}
          </span>
          <span className="rounded-full bg-white px-3 py-1 font-bold text-slate-600">
            {state.ratingCount} rating{state.ratingCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <form action={formAction} className="mt-4 space-y-3">
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
                disabled={!state.votingOpen || pending}
                aria-label={`Rate this feature ${rating} out of 5 stars`}
                className={`flex h-11 w-11 items-center justify-center rounded-2xl border text-2xl transition ${
                  selected
                    ? "border-amber-400 bg-amber-100 text-amber-500"
                    : "border-slate-200 bg-white text-slate-300 hover:border-amber-300 hover:text-amber-400"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                ★
              </button>
            );
          })}
        </div>

        <div
          aria-live="polite"
          className={`min-h-5 text-sm font-bold ${
            state.status === "success"
              ? "text-emerald-700"
              : state.status === "error"
                ? "text-rose-700"
                : "text-slate-500"
          }`}
        >
          {state.message ||
            (state.votingOpen
              ? "Select from 1 to 5 stars."
              : "Voting is currently closed.")}
        </div>
      </form>
    </article>
  );
}

export function FeatureRatingList({
  features,
  votingOpen,
}: FeatureRatingListProps) {
  if (features.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
        Feature ratings
      </p>
      <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
        Rate the strengths of this product
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
        Each feature can be evaluated independently from 1 to 5 stars.
      </p>

      <div className="mt-6 grid gap-4">
        {features.map((feature) => (
          <FeatureRatingCard
            key={feature.id}
            feature={feature}
            votingOpen={votingOpen}
          />
        ))}
      </div>
    </section>
  );
}