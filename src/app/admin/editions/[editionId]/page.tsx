import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminCourseEditionEditForm } from "@/components/admin-course-edition-edit-form";
import { prisma } from "@/lib/prisma";
import { getCurrentAdminSession } from "@/lib/admin-session";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

type AdminEditionEditPageProps = {
  params: Promise<{
    editionId: string;
  }>;
};

export default async function AdminEditionEditPage({
  params,
}: AdminEditionEditPageProps) {
  const adminSession = await getCurrentAdminSession();

  if (!adminSession) {
    redirect("/admin");
  }

  const { editionId } = await params;
  const parsedEditionId = Number(editionId);

  if (!Number.isInteger(parsedEditionId) || parsedEditionId <= 0) {
    notFound();
  }

  const edition = await prisma.courseEdition.findUnique({
    where: {
      id: parsedEditionId,
    },
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
  });

  if (!edition) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-10 text-slate-950 sm:px-8 lg:px-12">
      <section className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-4">
          <Link
            href="/admin/editions"
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
          >
            Back to editions list
          </Link>

          <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">
            Admin · Edit course edition
          </p>

          <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Personalize {edition.name}
          </h1>

          <p className="max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            Adjust the main identity fields of this edition. These edits do not
            delete linked data and do not change which edition is active.
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Status</p>
            <p
              className={`mt-3 text-3xl font-black ${
                edition.isActive ? "text-emerald-700" : "text-slate-950"
              }`}
            >
              {edition.isActive ? "Active" : "Inactive"}
            </p>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Voting status
            </p>
            <p
              className={`mt-3 text-3xl font-black ${
                edition.votingSettings?.isOpen
                  ? "text-emerald-700"
                  : "text-amber-700"
              }`}
            >
              {edition.votingSettings?.isOpen ? "Open" : "Closed"}
            </p>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Groups</p>
            <p className="mt-3 text-3xl font-black text-slate-950">
              {edition._count.groups}
            </p>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Student IDs
            </p>
            <p className="mt-3 text-3xl font-black text-slate-950">
              {edition._count.members}
            </p>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
          <AdminCourseEditionEditForm
            editionId={edition.id}
            initialName={edition.name}
            initialAcademicYear={edition.academicYear}
          />

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="space-y-3">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
                Edition details
              </p>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                Current metadata
              </h2>
            </div>

            <dl className="mt-6 space-y-4 text-sm">
              <div className="rounded-3xl bg-slate-100 p-4">
                <dt className="font-bold uppercase tracking-[0.16em] text-slate-500">
                  Current name
                </dt>
                <dd className="mt-2 text-base font-black text-slate-950">
                  {edition.name}
                </dd>
              </div>

              <div className="rounded-3xl bg-slate-100 p-4">
                <dt className="font-bold uppercase tracking-[0.16em] text-slate-500">
                  Academic year
                </dt>
                <dd className="mt-2 text-base font-black text-slate-950">
                  {edition.academicYear}
                </dd>
              </div>

              <div className="rounded-3xl bg-slate-100 p-4">
                <dt className="font-bold uppercase tracking-[0.16em] text-slate-500">
                  Group requests
                </dt>
                <dd className="mt-2 text-base font-black text-slate-950">
                  {edition._count.groupRequests}
                </dd>
              </div>

              <div className="rounded-3xl bg-slate-100 p-4">
                <dt className="font-bold uppercase tracking-[0.16em] text-slate-500">
                  Created
                </dt>
                <dd className="mt-2 text-base font-black text-slate-950">
                  {formatDate(edition.createdAt)}
                </dd>
              </div>

              <div className="rounded-3xl bg-slate-100 p-4">
                <dt className="font-bold uppercase tracking-[0.16em] text-slate-500">
                  Last updated
                </dt>
                <dd className="mt-2 text-base font-black text-slate-950">
                  {formatDate(edition.updatedAt)}
                </dd>
              </div>
            </dl>
          </article>
        </section>
      </section>
    </main>
  );
}