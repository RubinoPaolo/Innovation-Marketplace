import Link from "next/link";
import { PublicGroupRequestForm } from "@/components/public-group-request-form";
import { SiteHeader } from "@/components/site-header";
import { getActiveCourseEdition } from "@/lib/active-edition";

export default async function PublicGroupRequestPage() {
  const activeEdition = await getActiveCourseEdition();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:px-12">
        <section className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-start">
          <div className="space-y-6">
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
            >
              Back to homepage
            </Link>

            <div className="space-y-4">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">
                Group request · {activeEdition?.name ?? "No active edition"}
              </p>
              <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Request the creation of a new group
              </h1>
              <p className="max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                Use this form when your group is not yet registered in the active course edition. The request will be reviewed by the admin before the group becomes available for login.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">
                  When to use this page
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  Use it only to request a completely new group. Existing groups will later request member or name changes from their Group area.
                </p>
              </article>

              <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">
                  What happens next
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  After submission, the request stays pending until the admin approves or rejects it.
                </p>
              </article>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
            <div className="space-y-3">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
                New group request
              </p>
              <h2 className="text-3xl font-black tracking-tight text-slate-950">
                Submit the proposed group data
              </h2>
            </div>

            <div className="mt-6">
              {activeEdition ? (
                <PublicGroupRequestForm />
              ) : (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm font-bold leading-6 text-rose-800">
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
