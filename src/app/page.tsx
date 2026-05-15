import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { StudentAccessForm } from "@/components/student-access-form";
import { prisma } from "@/lib/prisma";
import { getCurrentStudentSession } from "@/lib/student-session";
import { getActiveCourseEdition } from "@/lib/active-edition";

export default async function HomePage() {
  const activeEdition = await getActiveCourseEdition();

  const [
    groups,
    currentSession,
    groupsCount,
    membersCount,
    votingSettings,
  ] = await Promise.all([
    activeEdition
      ? prisma.group.findMany({
          where: {
            editionId: activeEdition.id,
          },
          select: {
            id: true,
            name: true,
          },
          orderBy: {
            name: "asc",
          },
        })
      : Promise.resolve([]),
    getCurrentStudentSession(),
    activeEdition
      ? prisma.group.count({
          where: {
            editionId: activeEdition.id,
          },
        })
      : Promise.resolve(0),
    activeEdition
      ? prisma.groupMember.count({
          where: {
            editionId: activeEdition.id,
            isActive: true,
          },
        })
      : Promise.resolve(0),
    activeEdition
      ? prisma.votingSettings.findUnique({
          where: {
            editionId: activeEdition.id,
          },
          select: {
            isOpen: true,
          },
        })
      : Promise.resolve(null),
  ]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <SiteHeader />

      <main className="px-5 py-8 sm:px-8 lg:px-12">
        <section className="mx-auto grid min-h-[calc(100vh-9rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-7">
            <div className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
              {activeEdition?.name ?? "No active course edition"}
            </div>

            <div className="space-y-5">
              <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Present, explore and measure real interest in each group’s innovation.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Each group will publish its own product. Students will browse
                the shared catalog and indicate which ideas they would be
                willing to buy.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">
                  Registered groups
                </p>
                <p className="mt-3 text-3xl font-bold text-slate-950">
                  {groupsCount}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">
                  Active students
                </p>
                <p className="mt-3 text-3xl font-bold text-slate-950">
                  {membersCount}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">
                  Voting status
                </p>
                <p
                  className={`mt-3 text-lg font-bold ${
                    votingSettings?.isOpen
                      ? "text-emerald-700"
                      : "text-amber-700"
                  }`}
                >
                  {votingSettings?.isOpen ? "Open" : "Closed"}
                </p>
              </div>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
            {currentSession ? (
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                    Active access
                  </p>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                    Welcome to the platform
                  </h2>
                  <p className="leading-7 text-slate-600">
                    You are correctly identified. You can now move across the
                    platform without entering your data again.
                  </p>
                </div>

                <div className="grid gap-4 rounded-3xl bg-slate-100 p-5">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Group
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-950">
                      {currentSession.member.group.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Student ID
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-950">
                      {currentSession.member.studentNumber}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/catalogo"
                    className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300"
                  >
                    Go to catalog
                  </Link>
                </div>

                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                  Access completed for the active course edition.
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    First access
                  </p>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                    Enter with group and student ID
                  </h2>
                  <p className="leading-7 text-slate-600">
                    Select your group and enter your student ID exactly as
                    stored in the active course edition.
                  </p>
                </div>

                {!activeEdition ? (
                  <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold leading-6 text-rose-800">
                    No active course edition is configured. Student access is
                    temporarily unavailable.
                  </div>
                ) : (
                  <StudentAccessForm groups={groups} />
                )}

                <div className="space-y-3 border-t border-slate-200 pt-5">
                  <div>
                    <p className="mb-3 text-sm font-semibold text-slate-500">
                      Is your group not registered yet?
                    </p>
                    <Link
                      href="/group-request"
                      className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300"
                    >
                      Submit a group request
                    </Link>
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-semibold text-slate-500">
                      Platform supervisor?
                    </p>
                    <Link
                      href="/admin"
                      className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
                    >
                      Go to admin login
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </section>
      </main>
    </div>
  );
}
