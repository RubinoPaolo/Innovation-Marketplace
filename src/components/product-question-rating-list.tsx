'use client';

import { useActionState } from "react";
import {
  rateProductQuestion,
  type ProductQuestionRatingState,
} from "@/app/actions/rate-product-question";

export type ProductQuestionRatingItem = {
  id: number;
  prompt: string;
  averageRating: number | null;
  ratingCount: number;
  currentRating: number | null;
};

type ProductQuestionRatingListProps = {
  productId: number;
  questions: ProductQuestionRatingItem[];
  votingOpen: boolean;
};

type ProductQuestionRatingCardProps = {
  productId: number;
  question: ProductQuestionRatingItem;
  votingOpen: boolean;
};

function formatAverageRating(averageRating: number | null): string {
  if (averageRating === null) {
    return "No ratings yet";
  }

  return `${averageRating.toFixed(1)} / 5`;
}

function ProductQuestionRatingCard({
  productId,
  question,
  votingOpen,
}: ProductQuestionRatingCardProps) {
  const initialState: ProductQuestionRatingState = {
    status: "idle",
    message: "",
    productId,
    questionId: question.id,
    currentRating: question.currentRating,
    averageRating: question.averageRating,
    ratingCount: question.ratingCount,
    votingOpen,
  };

  const [state, formAction, pending] = useActionState(
    rateProductQuestion,
    initialState,
  );

  return (
    <article className="premium-muted rounded-[1.8rem] p-4 sm:p-5">
      <div className="space-y-4">
        <div className="space-y-3">
          <p className="text-base font-black leading-7 text-slate-950">
            {question.prompt}
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
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="questionId" value={question.id} />

          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((rating) => {
              const selected =
                state.currentRating !== null && rating <= state.currentRating;

              return (
                <button
                  key={`${question.id}-${rating}`}
                  type="submit"
                  name="rating"
                  value={rating}
                  disabled={!state.votingOpen || pending}
                  aria-label={`Rate this criterion ${rating} out of 5 stars`}
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
              (state.votingOpen
                ? "Select from 1 to 5 stars."
                : "Voting is currently closed.")}
          </div>
        </form>
      </div>
    </article>
  );
}

export function ProductQuestionRatingList({
  productId,
  questions,
  votingOpen,
}: ProductQuestionRatingListProps) {
  if (questions.length === 0) {
    return null;
  }

  return (
    <section className="premium-surface-strong rounded-[2.2rem] p-5 sm:p-7 lg:p-8">
      <p className="premium-kicker">Product evaluation</p>
      <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] text-slate-950">
        Rate this product on the evaluation criteria.
      </h2>
      <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
        These questions are optional. Each criterion can be evaluated from 1 to 5 stars based on how much you agree with the statement.
      </p>

      <div className="mt-6 grid gap-4">
        {questions.map((question) => (
          <ProductQuestionRatingCard
            key={question.id}
            productId={productId}
            question={question}
            votingOpen={votingOpen}
          />
        ))}
      </div>
    </section>
  );
}
