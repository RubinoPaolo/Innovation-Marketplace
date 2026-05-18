import Link from "next/link";
import { PublicGroupRequestForm } from "@/components/public-group-request-form";
import { SiteHeader } from "@/components/site-header";
import { getActiveCourseEdition } from "@/lib/active-edition";

export default async function PublicGroupRequestPage() {
  const activeEdition = await getActiveCourseEdition();

  return (
    <div className="premium-page min-h-screen text-slate-950">
      <SiteHeader />

      <main className="premium-shell py-8 sm:py-10 lg:py-12">
        <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(25rem,0.92fr)] xl:items-start">
          <div className="space-y-6">
            <Link
              href="/"
              className="premium-button-secondary inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
            >
              Back to homepage
            </Link>

            <div className="premium-hero rounded-[2.4rem] px-5 py-6 sm:px-7 sm:py-8 lg:px-8 lg:py-9">
              <div className="relative z-10 space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="premium-kicker">Group request</span>
                  <span className="premium-chip inline-flex items-center rounded-full px-4 py-2 text-sm font-bold text-slate-700">
                    {activeEdition?.name ?? "No active edition"}
                  </span>
                </div>

                <div className="space-y-4">
                  <h1 className="text-4xl font-black leading-[0.98] tracking-[-0.06em] text-slate-950 sm:text-5xl lg:text-6xl">
                    Request the creation of a new group.
                  </h1>

                  <p className="max-w-3xl text-base font-medium leading-8 text-slate-600 sm:text-lg">
                    Use this form when your group is not yet registered in the active course edition. The admin will review the request before it becomes available for login.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <article className="premium-surface rounded-[1.9rem] p-5 sm:p-6">
                <p className="premium-kicker">When to use it</p>
                <h2 className="mt-4 text-xl font-black tracking-[-0.04em] text-slate-950">
                  New groups only.
                </h2>
                <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
                  Existing groups should request name or member changes later from their Group area.
                </p>
              </article>

              <article className="premium-surface rounded-[1.9rem] p-5 sm:p-6">
                <p className="premium-kicker">What happens next</p>
                <h2 className="mt-4 text-xl font-black tracking-[-0.04em] text-slate-950">
                  Admin review.
                </h2>
                <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
                  After submission, the request stays pending until it is approved or rejected.
                </p>
              </article>
            </div>
          </div>

          <aside className="premium-surface-strong rounded-[2.2rem] p-5 sm:p-7 lg:p-8">
            <div className="space-y-3">
              <p className="premium-kicker">New group request</p>
              <h2 className="text-3xl font-black tracking-[-0.045em] text-slate-950 sm:text-4xl">
                Submit the proposed group data.
              </h2>
            </div>

            <div className="mt-6 rounded-[1.8rem] border border-slate-200/80 bg-white/74 p-4 shadow-sm shadow-slate-900/5 sm:p-5">
              {activeEdition ? (
                <PublicGroupRequestForm />
              ) : (
                <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50/90 p-5 text-sm font-bold leading-6 text-rose-800">
                  No active course edition is configured. Group requests are temporarily unavailable.
                </div>
              )}
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
