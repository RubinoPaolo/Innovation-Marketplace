import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminCreateGroupForm } from "@/components/admin-create-group-form";
import { AdminImportGroupsForm } from "@/components/admin-import-groups-form";
import { prisma } from "@/lib/prisma";
import { getCurrentAdminSession } from "@/lib/admin-session";
import { getActiveCourseEdition } from "@/lib/active-edition";

export default async function AdminGroupsPage() {
  const [adminSession, activeEdition] = await Promise.all([
    getCurrentAdminSession(),
    getActiveCourseEdition(),
  ]);

  if (!adminSession) {
    redirect("/admin");
  }

  if (!activeEdition) {
    return (
      <main className="min-h-screen bg-slate-100 px-5 py-10 text-slate-950 sm:px-8 lg:px-12">
        <section className="mx-auto max-w-5xl space-y-6">
          <Link
            href="/admin"
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
          >
            Back to admin dashboard
          </Link>

          <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-rose-700">
              Configuration required
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
              No active course edition is configured
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-700">
              Group administration is available only when an active course
              edition exists.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const groups = await prisma.group.findMany({
    where: {
      editionId: activeEdition.id,
    },
    select: {
      id: true,
      name: true,
      isActive: true,
      members: {
        select: {
          id: true,
          isActive: true,
        },
      },
      product: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
      createdAt: true,
    },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  const activeGroups = groups.filter((group) => group.isActive);
  const suspendedGroups = groups.filter((group) => !group.isActive);

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-10 text-slate-950 sm:px-8 lg:px-12">
      <section className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-4">
          <Link
            href="/admin"
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
          >
            Back to admin dashboard
          </Link>

          <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">
            Admin · Group administration · {activeEdition.name}
          </p>
          <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Manage groups and student IDs
          </h1>
          <p className="max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            Create groups manually, import them from Excel, inspect the roster,
            suspend or delete groups and manage the students assigned to the
            active course edition.
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Total groups
            </p>
            <p className="mt-3 text-3xl font-black text-slate-950">
              {groups.length}
            </p>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Active groups
            </p>
            <p className="mt-3 text-3xl font-black text-emerald-700">
              {activeGroups.length}
            </p>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Suspended groups
            </p>
            <p className="mt-3 text-3xl font-black text-amber-700">
              {suspendedGroups.length}
            </p>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Student IDs
            </p>
            <p className="mt-3 text-3xl font-black text-slate-950">
              {groups.reduce((sum, group) => sum + group.members.length, 0)}
            </p>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-2 xl:items-start">
          <AdminCreateGroupForm />
          <AdminImportGroupsForm />
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-3">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
              Existing groups
            </p>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Groups in the active edition
            </h2>
          </div>

          {groups.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm font-semibold leading-7 text-slate-600">
              No groups have been created for this edition yet.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {groups.map((group) => {
                const activeMembersCount = group.members.filter(
                  (member) => member.isActive,
                ).length;

                return (
                  <article
                    key={group.id}
                    className="grid gap-4 rounded-[2rem] border border-slate-200 bg-slate-50 p-5 lg:grid-cols-[1fr_auto] lg:items-center"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-2xl font-black tracking-tight text-slate-950">
                          {group.name}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            group.isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {group.isActive ? "ACTIVE" : "SUSPENDED"}
                        </span>

                        {group.product ? (
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${
                              group.product.status === "PUBLISHED"
                                ? "bg-indigo-100 text-indigo-800"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {group.product.status}
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-700">
                            NO PRODUCT
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
                        <span>{activeMembersCount} active student IDs</span>
                        <span>·</span>
                        <span>{group.members.length} total student IDs</span>
                        {group.product ? (
                          <>
                            <span>·</span>
                            <span>Product: {group.product.title}</span>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <Link
                      href={`/admin/groups/${group.id}`}
                      className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300"
                    >
                      Manage group
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}