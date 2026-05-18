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
      <main className="premium-page min-h-screen text-slate-950">
        <section className="premium-shell grid min-h-screen items-center gap-8 py-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(25rem,0.92fr)] lg:py-12">
          <div className="space-y-6">
            <Link
              href="/"
              className="premium-button-secondary inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
            >
              Back to homepage
            </Link>

            <div className="premium-hero rounded-[2.4rem] px-5 py-6 sm:px-7 sm:py-8 lg:px-8 lg:py-9">
              <div className="relative z-10 space-y-5">
                <p className="premium-kicker">Admin area</p>
                <h1 className="text-4xl font-black leading-[0.98] tracking-[-0.06em] text-slate-950 sm:text-5xl lg:text-6xl">
                  Manage the voting session and the course environment.
                </h1>
                <p className="max-w-3xl text-base font-medium leading-8 text-slate-600 sm:text-lg">
                  This area is reserved for platform supervision. Sign in with the configured admin password to manage voting, groups and course data.
                </p>
              </div>
            </div>
          </div>

          <aside className="premium-surface-strong rounded-[2.2rem] p-5 sm:p-7 lg:p-8">
            <div className="space-y-3">
              <p className="premium-kicker">Admin sign-in</p>
              <h2 className="text-3xl font-black tracking-[-0.045em] text-slate-950 sm:text-4xl">
                Enter the protected area.
              </h2>
            </div>

            <div className="mt-6 rounded-[1.8rem] border border-slate-200/80 bg-white/74 p-4 shadow-sm shadow-slate-900/5 sm:p-5">
              <AdminLoginForm />
            </div>
          </aside>
        </section>
      </main>
    );
  }

  if (!activeEdition) {
    return (
      <main className="premium-page min-h-screen text-slate-950">
        <section className="premium-shell space-y-6 py-8 sm:py-10 lg:py-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/"
              className="premium-button-secondary inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
            >
              Back to homepage
            </Link>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/admin/editions"
                className="premium-button-secondary inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
              >
                Course editions
              </Link>

              <form action={logoutAdmin}>
                <button
                  type="submit"
                  className="premium-button-secondary inline-flex h-11 w-full items-center justify-center rounded-2xl px-5 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80 sm:w-auto"
                >
                  Log out admin
                </button>
              </form>
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-rose-200 bg-rose-50/92 p-6 shadow-sm shadow-rose-900/5 sm:p-8">
            <p className="premium-kicker text-rose-700">Configuration required</p>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.055em] text-slate-950 sm:text-5xl">
              No active course edition is configured.
            </h1>
            <p className="mt-4 max-w-3xl text-base font-medium leading-8 text-slate-700">
              The platform cannot manage voting, groups, requests or edition-specific statistics until a course edition is marked as active.
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
    <main className="premium-page min-h-screen text-slate-950">
      <section className="premium-shell space-y-8 py-8 sm:py-10 lg:py-12">
        <div className="premium-hero rounded-[2.4rem] px-5 py-6 sm:px-7 sm:py-8 lg:px-8 lg:py-9">
          <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/"
                  className="premium-button-secondary inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
                >
                  Back to homepage
                </Link>
                <span className="premium-chip inline-flex items-center rounded-full px-4 py-2 text-sm font-bold text-slate-700">
                  {activeEdition.name}
                </span>
              </div>

              <p className="premium-kicker">Admin dashboard</p>
              <h1 className="text-4xl font-black leading-[0.98] tracking-[-0.06em] text-slate-950 sm:text-5xl lg:text-6xl">
                Voting and course administration.
              </h1>
              <p className="max-w-3xl text-base font-medium leading-8 text-slate-600 sm:text-lg">
                Open or close student voting, monitor the active edition, manage groups and review incoming requests.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <Link
                href="/admin/editions"
                className="premium-button-secondary inline-flex h-12 items-center justify-center rounded-2xl px-6 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
              >
                Course editions
              </Link>

              <form action={logoutAdmin}>
                <button
                  type="submit"
                  className="premium-button-secondary inline-flex h-12 w-full items-center justify-center rounded-2xl px-6 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
                >
                  Log out admin
                </button>
              </form>
            </div>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <article className="premium-stat-card rounded-[1.8rem] p-5">
            <p className="relative z-10 text-sm font-bold text-slate-500">
              Voting status
            </p>
            <p
              className={`relative z-10 mt-4 text-3xl font-black tracking-tight ${
                isOpen ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {isOpen ? "Open" : "Closed"}
            </p>
          </article>

          <article className="premium-stat-card rounded-[1.8rem] p-5">
            <p className="relative z-10 text-sm font-bold text-slate-500">
              Published products
            </p>
            <p className="relative z-10 mt-4 text-3xl font-black tracking-tight text-slate-950">
              {publishedProducts}
            </p>
          </article>

          <article className="premium-stat-card rounded-[1.8rem] p-5">
            <p className="relative z-10 text-sm font-bold text-slate-500">
              Active students
            </p>
            <p className="relative z-10 mt-4 text-3xl font-black tracking-tight text-slate-950">
              {activeStudents}
            </p>
          </article>

          <article className="premium-stat-card rounded-[1.8rem] p-5">
            <p className="relative z-10 text-sm font-bold text-slate-500">
              Purchase-interest votes
            </p>
            <p className="relative z-10 mt-4 text-3xl font-black tracking-tight text-slate-950">
              {totalInterests}
            </p>
          </article>

          <article className="premium-stat-card rounded-[1.8rem] p-5">
            <p className="relative z-10 text-sm font-bold text-slate-500">
              Active groups
            </p>
            <p className="relative z-10 mt-4 text-3xl font-black tracking-tight text-slate-950">
              {activeGroups}
            </p>
          </article>

          <article className="premium-stat-card rounded-[1.8rem] p-5">
            <p className="relative z-10 text-sm font-bold text-slate-500">
              Pending requests
            </p>
            <p className="relative z-10 mt-4 text-3xl font-black tracking-tight text-amber-700">
              {pendingGroupRequests}
            </p>
          </article>
        </section>

        <VotingControlPanel initialIsOpen={isOpen} />

        <section className="premium-surface-strong rounded-[2.2rem] p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <p className="premium-kicker">Data export</p>
              <h2 className="text-3xl font-black tracking-[-0.045em] text-slate-950">
                Download voting results.
              </h2>
              <p className="max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
                Export the ranked published products of the active edition. Choose CSV for a lightweight dataset or XLSX for a polished, formatted workbook.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/admin/exports/voting-results"
                className="premium-button-secondary inline-flex h-12 items-center justify-center rounded-2xl px-6 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
              >
                Download CSV
              </Link>

              <Link
                href="/admin/exports/voting-results-xlsx"
                className="premium-button-primary inline-flex h-12 items-center justify-center rounded-2xl px-6 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
              >
                Download formatted XLSX
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="premium-surface-strong rounded-[2.2rem] p-5 sm:p-7 lg:p-8">
            <div className="space-y-3">
              <p className="premium-kicker">Group administration</p>
              <h2 className="text-3xl font-black tracking-[-0.045em] text-slate-950">
                Manage groups and student IDs.
              </h2>
              <p className="text-sm font-medium leading-7 text-slate-600 sm:text-base">
                Rename groups, suspend or delete them, add or remove student IDs and keep the active edition roster up to date without touching the database manually.
              </p>
            </div>

            <div className="premium-muted mt-6 rounded-[1.7rem] p-5">
              <p className="text-sm font-bold text-slate-500">
                Active groups currently configured
              </p>
              <p className="mt-2 text-4xl font-black tracking-tight text-slate-950">
                {activeGroups}
              </p>
            </div>

            <Link
              href="/admin/groups"
              className="premium-button-primary mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl px-6 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
            >
              Open group administration
            </Link>
          </article>

          <article className="premium-surface-strong rounded-[2.2rem] p-5 sm:p-7 lg:p-8">
            <div className="space-y-3">
              <p className="premium-kicker">Group requests</p>
              <h2 className="text-3xl font-black tracking-[-0.045em] text-slate-950">
                Review creation and update requests.
              </h2>
              <p className="text-sm font-medium leading-7 text-slate-600 sm:text-base">
                Inspect requests for new groups and update requests sent from the Group area, adjust them before approval and complete the admin decision.
              </p>
            </div>

            <div className="premium-muted mt-6 rounded-[1.7rem] p-5">
              <p className="text-sm font-bold text-slate-500">
                Pending group requests
              </p>
              <p className="mt-2 text-4xl font-black tracking-tight text-amber-700">
                {pendingGroupRequests}
              </p>
            </div>

            <Link
              href="/admin/group-requests"
              className="premium-button-secondary mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl px-6 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
            >
              Open group requests
            </Link>
          </article>
        </section>
      </section>
    </main>
  );
}
