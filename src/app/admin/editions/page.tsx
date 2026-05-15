import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminCourseEditionActivateForm } from "@/components/admin-course-edition-activate-form";
import { AdminCourseEditionCreateForm } from "@/components/admin-course-edition-create-form";
import { AdminCourseEditionDeleteForm } from "@/components/admin-course-edition-delete-form";
import { prisma } from "@/lib/prisma";
import { getCurrentAdminSession } from "@/lib/admin-session";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminEditionsPage() {
  const adminSession = await getCurrentAdminSession();

  if (!adminSession) {
    redirect("/admin");
  }

  const editions = await prisma.courseEdition.findMany({
    select: {
      id: true,
      name: true,
      academicYear: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      votingSettings: {
        select: {
          isOpen: true,
        },
      },
      _count: {
        select: {
          groups: true,
          members: true,
          groupRequests: true,
        },
      },
    },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  const activeEdition = editions.find((edition) => edition.isActive) ?? null;
  const totalGroups = editions.reduce(
    (sum, edition) => sum + edition._count.groups,
    0,
  );
  const totalMembers = editions.reduce(
    (sum, edition) => sum + edition._count.members,
    0,
  );

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
            Admin · Course editions
          </p>
          <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Manage reusable academic editions
          </h1>
          <p className="max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            Create new course cycles and choose which edition is currently active
            for student access, group requests, catalog visibility and voting
            operations.
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Stored editions
            </p>
            <p className="mt-3 text-3xl font-black text-slate-950">
              {editions.length}
            </p>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Active edition
            </p>
            <p className="mt-3 line-clamp-2 text-lg font-black text-slate-950">
              {activeEdition?.name ?? "None"}
            </p>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Groups across editions
            </p>
            <p className="mt-3 text-3xl font-black text-slate-950">
              {totalGroups}
            </p>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Student IDs across editions
            </p>
            <p className="mt-3 text-3xl font-black text-slate-950">
              {totalMembers}
            </p>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr] xl:items-start">
          <AdminCourseEditionCreateForm />

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="space-y-3">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
                Activation logic
              </p>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                One active edition at a time
              </h2>
              <p className="text-sm leading-7 text-slate-600">
                Activating a different edition automatically deactivates the
                current one. The newly active edition starts with voting closed,
                which avoids accidental voting during setup.
              </p>
            </div>

            <div className="mt-6 rounded-3xl bg-slate-100 p-5">
              <p className="text-sm font-semibold text-slate-500">
                Currently active
              </p>
              <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                {activeEdition?.name ?? "No active edition"}
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                {activeEdition
                  ? `Academic year ${activeEdition.academicYear}`
                  : "Create or activate an edition to make the platform operational."}
              </p>
            </div>
          </article>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-3">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
              Edition list
            </p>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              All course editions stored in the platform
            </h2>
          </div>

          {editions.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm font-semibold leading-7 text-slate-600">
              No course editions are stored yet.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {editions.map((edition) => (
                <article
                  key={edition.id}
                  className="grid gap-5 rounded-[2rem] border border-slate-200 bg-slate-50 p-5 lg:grid-cols-[1fr_auto] lg:items-center"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-2xl font-black tracking-tight text-slate-950">
                        {edition.name}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          edition.isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {edition.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          edition.votingSettings?.isOpen
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        Voting{" "}
                        {edition.votingSettings?.isOpen ? "OPEN" : "CLOSED"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
                      <span>Academic year {edition.academicYear}</span>
                      <span>·</span>
                      <span>{edition._count.groups} groups</span>
                      <span>·</span>
                      <span>{edition._count.members} student IDs</span>
                      <span>·</span>
                      <span>{edition._count.groupRequests} group requests</span>
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
                      <span>Created {formatDate(edition.createdAt)}</span>
                      <span>·</span>
                      <span>Last updated {formatDate(edition.updatedAt)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-3 lg:items-end">
                    <AdminCourseEditionActivateForm
                      editionId={edition.id}
                      editionName={edition.name}
                      isActive={edition.isActive}
                    />

                    <AdminCourseEditionDeleteForm
                      editionId={edition.id}
                      editionName={edition.name}
                      isActive={edition.isActive}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}