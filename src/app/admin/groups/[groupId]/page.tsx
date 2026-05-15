import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminAddMembersForm } from "@/components/admin-add-members-form";
import { AdminGroupLifecyclePanel } from "@/components/admin-group-lifecycle-panel";
import { AdminMemberStatusForm } from "@/components/admin-member-status-form";
import { AdminRenameGroupForm } from "@/components/admin-rename-group-form";
import { prisma } from "@/lib/prisma";
import { getCurrentAdminSession } from "@/lib/admin-session";
import { getActiveCourseEdition } from "@/lib/active-edition";

type AdminGroupDetailPageProps = {
  params: Promise<{
    groupId: string;
  }>;
};

export default async function AdminGroupDetailPage({
  params,
}: AdminGroupDetailPageProps) {
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
            href="/admin/groups"
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
          >
            Back to group administration
          </Link>

          <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-rose-700">
              Configuration required
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
              No active course edition is configured
            </h1>
          </div>
        </section>
      </main>
    );
  }

  const { groupId } = await params;
  const parsedGroupId = Number(groupId);

  if (!Number.isInteger(parsedGroupId) || parsedGroupId <= 0) {
    notFound();
  }

  const group = await prisma.group.findFirst({
    where: {
      id: parsedGroupId,
      editionId: activeEdition.id,
    },
    select: {
      id: true,
      name: true,
      isActive: true,
      product: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
      members: {
        select: {
          id: true,
          studentNumber: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: [{ isActive: "desc" }, { studentNumber: "asc" }],
      },
    },
  });

  if (!group) {
    notFound();
  }

  const activeMembers = group.members.filter((member) => member.isActive);
  const inactiveMembers = group.members.filter((member) => !member.isActive);

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-10 text-slate-950 sm:px-8 lg:px-12">
      <section className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-4">
          <Link
            href="/admin/groups"
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
          >
            Back to group administration
          </Link>

          <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">
            Admin · Group detail · {activeEdition.name}
          </p>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  {group.name}
                </h1>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${
                    group.isActive
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {group.isActive ? "Active" : "Suspended"}
                </span>
              </div>

              <p className="max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                Manage the group identity, status and student roster inside the active course edition.
              </p>
            </div>

            {group.product && group.isActive ? (
              <Link
                href={`/catalogo/${group.product.id}`}
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
              >
                View linked product
              </Link>
            ) : null}
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Group status
            </p>
            <p
              className={`mt-3 text-lg font-black ${
                group.isActive ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {group.isActive ? "Active" : "Suspended"}
            </p>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Active members
            </p>
            <p className="mt-3 text-3xl font-black text-slate-950">
              {activeMembers.length}
            </p>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Inactive members
            </p>
            <p className="mt-3 text-3xl font-black text-slate-950">
              {inactiveMembers.length}
            </p>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Linked product
            </p>
            <p className="mt-3 line-clamp-2 text-lg font-black text-slate-950">
              {group.product?.title ?? "No product yet"}
            </p>
          </article>
        </section>

        <AdminGroupLifecyclePanel
          groupId={group.id}
          groupName={group.name}
          isActive={group.isActive}
        />

        <section className="grid gap-6 xl:grid-cols-2">
          <AdminRenameGroupForm groupId={group.id} currentName={group.name} />
          <AdminAddMembersForm groupId={group.id} />
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-3">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
              Current roster
            </p>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Student IDs in this group
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-slate-600">
              Deactivated members can no longer sign in. Reactivating them restores access without creating duplicate records.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {group.members.map((member) => (
              <article
                key={member.id}
                className="grid gap-4 rounded-[2rem] border border-slate-200 bg-slate-50 p-5 md:grid-cols-[1fr_auto] md:items-center"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xl font-black tracking-tight text-slate-950">
                      {member.studentNumber}
                    </p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        member.isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {member.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-500">
                    Record created on{" "}
                    {new Intl.DateTimeFormat("en-GB", {
                      dateStyle: "medium",
                    }).format(member.createdAt)}
                  </p>
                </div>

                <AdminMemberStatusForm
                  groupId={group.id}
                  memberId={member.id}
                  studentNumber={member.studentNumber}
                  isActive={member.isActive}
                />
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}