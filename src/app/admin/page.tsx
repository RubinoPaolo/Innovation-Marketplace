import Link from "next/link";
import { AdminLoginForm } from "@/components/admin-login-form";
import { VotingControlPanel } from "@/components/voting-control-panel";
import { logoutAdmin } from "@/app/actions/admin-auth";
import { prisma } from "@/lib/prisma";
import { getCurrentAdminSession } from "@/lib/admin-session";
import { getActiveCourseEdition } from "@/lib/active-edition";

export default async function AdminPage() {
  const [adminSession, activeEdition] = await Promise.all([
    getCurrentAdminSession(),
    getActiveCourseEdition(),
  ]);

  if (!adminSession) {
    return (
      <main className="min-h-screen bg-slate-100 px-5 py-10 text-slate-950 sm:px-8 lg:px-12">
        <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-5xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
            >
              Back to homepage
            </Link>

            <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">
              Admin area
            </p>
            <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Manage the voting session
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              This area is reserved for platform supervision. Sign in with the
              configured admin password to manage voting, groups and course
              data.
            </p>
          </div>

          <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
            <div className="space-y-3">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
                Admin sign-in
              </p>
              <h2 className="text-3xl font-black tracking-tight text-slate-950">
                Enter the protected area
              </h2>
            </div>

            <div className="mt-6">
              <AdminLoginForm />
            </div>
          </aside>
        </section>
      </main>
    );
  }

  if (!activeEdition) {
    return (
      <main className="min-h-screen bg-slate-100 px-5 py-10 text-slate-950 sm:px-8 lg:px-12">
        <section className="mx-auto max-w-5xl space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
            >
              Back to homepage
            </Link>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/admin/editions"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
              >
                Course editions
              </Link>

              <form action={logoutAdmin}>
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
                >
                  Log out admin
                </button>
              </form>
            </div>
          </div>

          <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-rose-700">
              Configuration required
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
              No active course edition is configured
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-700">
              The platform cannot manage voting, groups, requests or
              edition-specific statistics until a course edition is marked as
              active.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const [
    votingSettings,
    publishedProducts,
    activeStudents,
    totalInterests,
    activeGroups,
    pendingGroupRequests,
  ] = await Promise.all([
    prisma.votingSettings.findUnique({
      where: {
        editionId: activeEdition.id,
      },
      select: {
        isOpen: true,
      },
    }),
    prisma.product.count({
      where: {
        status: "PUBLISHED",
        group: {
          editionId: activeEdition.id,
          isActive: true,
        },
      },
    }),
    prisma.groupMember.count({
      where: {
        editionId: activeEdition.id,
        isActive: true,
        group: {
          isActive: true,
        },
      },
    }),
    prisma.purchaseInterest.count({
      where: {
        product: {
          group: {
            editionId: activeEdition.id,
            isActive: true,
          },
        },
      },
    }),
    prisma.group.count({
      where: {
        editionId: activeEdition.id,
        isActive: true,
      },
    }),
    prisma.groupRequest.count({
      where: {
        editionId: activeEdition.id,
        status: "PENDING",
      },
    }),
  ]);

  const isOpen = votingSettings?.isOpen ?? false;

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-10 text-slate-950 sm:px-8 lg:px-12">
      <section className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
            >
              Back to homepage
            </Link>

            <div className="space-y-3">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">
                Admin dashboard · {activeEdition.name}
              </p>
              <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Voting and course administration
              </h1>
              <p className="max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                Open or close student voting, monitor the active edition,
                manage groups and review incoming requests.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/admin/editions"
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
            >
              Course editions
            </Link>

            <form action={logoutAdmin}>
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
              >
                Log out admin
              </button>
            </form>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Voting status
            </p>
            <p
              className={`mt-3 text-3xl font-black ${
                isOpen ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {isOpen ? "Open" : "Closed"}
            </p>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Published products
            </p>
            <p className="mt-3 text-3xl font-black text-slate-950">
              {publishedProducts}
            </p>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Active students
            </p>
            <p className="mt-3 text-3xl font-black text-slate-950">
              {activeStudents}
            </p>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Purchase-interest votes
            </p>
            <p className="mt-3 text-3xl font-black text-slate-950">
              {totalInterests}
            </p>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Active groups
            </p>
            <p className="mt-3 text-3xl font-black text-slate-950">
              {activeGroups}
            </p>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Pending requests
            </p>
            <p className="mt-3 text-3xl font-black text-amber-700">
              {pendingGroupRequests}
            </p>
          </article>
        </section>

        <VotingControlPanel initialIsOpen={isOpen} />

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
                Data export
              </p>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                Download voting results
              </h2>
              <p className="max-w-3xl text-sm leading-7 text-slate-600">
                Export the ranked published products of the active edition.
                Choose CSV for a lightweight dataset or XLSX for a polished,
                formatted workbook.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/admin/exports/voting-results"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
              >
                Download CSV
              </Link>

              <Link
                href="/admin/exports/voting-results-xlsx"
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300"
              >
                Download formatted XLSX
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="space-y-3">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
                Group administration
              </p>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                Manage groups and student IDs
              </h2>
              <p className="text-sm leading-7 text-slate-600">
                Rename groups, suspend or delete them, add or remove student
                IDs and keep the active edition roster up to date without
                touching the database manually.
              </p>
            </div>

            <div className="mt-6 rounded-3xl bg-slate-100 p-5">
              <p className="text-sm font-semibold text-slate-500">
                Active groups currently configured
              </p>
              <p className="mt-2 text-4xl font-black text-slate-950">
                {activeGroups}
              </p>
            </div>

            <Link
              href="/admin/groups"
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300"
            >
              Open group administration
            </Link>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="space-y-3">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
                Group requests
              </p>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                Review creation and update requests
              </h2>
              <p className="text-sm leading-7 text-slate-600">
                Inspect requests for new groups and update requests sent from
                the Group area, adjust them before approval and complete the
                admin decision.
              </p>
            </div>

            <div className="mt-6 rounded-3xl bg-slate-100 p-5">
              <p className="text-sm font-semibold text-slate-500">
                Pending group requests
              </p>
              <p className="mt-2 text-4xl font-black text-amber-700">
                {pendingGroupRequests}
              </p>
            </div>

            <Link
              href="/admin/group-requests"
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
            >
              Open group requests
            </Link>
          </article>
        </section>
      </section>
    </main>
  );
}