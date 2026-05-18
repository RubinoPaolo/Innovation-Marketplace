import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { StudentAccessForm } from "@/components/student-access-form";
import { prisma } from "@/lib/prisma";
import { getCurrentStudentSession } from "@/lib/student-session";
import { getActiveCourseEdition } from "@/lib/active-edition";

function getNoticeTone(level: string): string {
  switch (level) {
    case "IMPORTANT":
      return "border-blue-200 bg-blue-50/90 text-blue-950";
    case "WARNING":
      return "border-amber-200 bg-amber-50/90 text-amber-950";
    default:
      return "border-slate-200 bg-white/78 text-slate-950";
  }
}

function maskStudentId(studentNumber: string): string {
  return "•".repeat(Math.max(studentNumber.length, 1));
}

export default async function HomePage() {
  const activeEdition = await getActiveCourseEdition();

  const [
    groups,
    currentSession,
    groupsCount,
    membersCount,
    votingSettings,
    homeNotices,
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
    activeEdition
      ? prisma.homeNotice.findMany({
          where: {
            editionId: activeEdition.id,
            isPublished: true,
          },
          select: {
            id: true,
            title: true,
            message: true,
            level: true,
          },
          orderBy: {
            updatedAt: "desc",
          },
          take: 3,
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="premium-page min-h-screen text-slate-950">
      <SiteHeader />

      <main className="premium-shell py-7 sm:py-10 lg:py-12">
        <section className="premium-hero rounded-[2.4rem] px-5 py-5 sm:px-7 sm:py-7 lg:px-8 lg:py-8">
          <div className="relative z-10 grid gap-8 xl:grid-cols-[minmax(0,1.08fr)_minmax(26rem,0.92fr)] xl:items-stretch">
            <div className="flex min-h-full flex-col justify-between gap-8 rounded-[2rem] border border-white/60 bg-white/36 p-4 backdrop-blur-sm sm:p-6 lg:p-7">
              <div className="space-y-7">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="premium-kicker">Innovation voting</span>
                  <span className="premium-chip inline-flex items-center rounded-full px-4 py-2 text-sm font-bold text-slate-700">
                    {activeEdition?.name ?? "No active course edition"}
                  </span>
                </div>

                <div className="space-y-5">
                  <h1 className="max-w-5xl text-4xl font-black leading-[0.98] tracking-[-0.065em] text-slate-950 sm:text-5xl lg:text-6xl xl:text-[4.35rem]">
                    Discover, compare and rate the strongest innovation
                    proposals.
                  </h1>

                  <p className="max-w-3xl text-base font-medium leading-8 text-slate-600 sm:text-lg">
                    Browse the products published by each group and express
                    which ideas you would genuinely consider buying.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/catalogo"
                    className="premium-button-primary inline-flex h-13 items-center justify-center rounded-2xl px-6 text-sm font-black tracking-tight transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
                  >
                    Explore catalog
                  </Link>

                  <Link
                    href="/leaderboard"
                    className="premium-button-secondary inline-flex h-13 items-center justify-center rounded-2xl px-6 text-sm font-black tracking-tight transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
                  >
                    View leaderboard
                  </Link>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <article className="premium-stat-card rounded-[1.75rem] p-5">
                  <p className="relative z-10 text-sm font-bold text-slate-500">
                    Registered groups
                  </p>
                  <p className="relative z-10 mt-4 text-4xl font-black tracking-tight text-slate-950">
                    {groupsCount}
                  </p>
                </article>

                <article className="premium-stat-card rounded-[1.75rem] p-5">
                  <p className="relative z-10 text-sm font-bold text-slate-500">
                    Active students
                  </p>
                  <p className="relative z-10 mt-4 text-4xl font-black tracking-tight text-slate-950">
                    {membersCount}
                  </p>
                </article>

                <article className="premium-stat-card rounded-[1.75rem] p-5">
                  <p className="relative z-10 text-sm font-bold text-slate-500">
                    Voting status
                  </p>
                  <div className="relative z-10 mt-4 flex items-center gap-2">
                    <span
                      className={`h-3 w-3 rounded-full ${
                        votingSettings?.isOpen
                          ? "bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.12)]"
                          : "bg-amber-500 shadow-[0_0_0_6px_rgba(245,158,11,0.12)]"
                      }`}
                    />
                    <p
                      className={`text-xl font-black tracking-tight ${
                        votingSettings?.isOpen
                          ? "text-emerald-700"
                          : "text-amber-700"
                      }`}
                    >
                      {votingSettings?.isOpen ? "Open" : "Closed"}
                    </p>
                  </div>
                </article>
              </div>
            </div>

            <aside className="premium-surface-strong flex min-h-full flex-col justify-between rounded-[2.2rem] p-5 sm:p-7 lg:p-8">
              {currentSession ? (
                <div className="flex min-h-full flex-col justify-between gap-7">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <p className="premium-kicker">Access active</p>
                      <h2 className="text-3xl font-black tracking-[-0.045em] text-slate-950 sm:text-4xl">
                        Welcome back to the platform.
                      </h2>
                      <p className="text-sm font-medium leading-7 text-slate-600 sm:text-base">
                        Your session is already active. Continue exploring the
                        marketplace without entering your data again.
                      </p>
                    </div>

                    <div className="premium-muted grid gap-4 rounded-[1.75rem] p-5 sm:grid-cols-2">
                      <div className="rounded-[1.4rem] border border-white/70 bg-white/72 p-4">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                          Group
                        </p>
                        <p className="mt-2 text-lg font-black tracking-tight text-slate-950">
                          {currentSession.member.group.name}
                        </p>
                      </div>

                      <div className="rounded-[1.4rem] border border-white/70 bg-white/72 p-4">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                          Student ID
                        </p>
                        <p className="mt-2 text-lg font-black tracking-tight text-slate-950">
                          {maskStudentId(currentSession.member.studentNumber)}
                        </p>
                      </div>
                    </div>

                    {homeNotices.length > 0 ? (
                      <section className="rounded-[1.8rem] border border-slate-200/80 bg-white/74 p-4 shadow-sm shadow-slate-900/5">
                        <div className="space-y-2">
                          <p className="premium-kicker">Notices</p>
                          <h3 className="text-xl font-black tracking-tight text-slate-950">
                            Latest announcements
                          </h3>
                        </div>

                        <div className="mt-4 space-y-3">
                          {homeNotices.map((notice) => (
                            <article
                              key={notice.id}
                              className={`rounded-[1.45rem] border p-4 ${getNoticeTone(
                                notice.level,
                              )}`}
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-white/80 px-3 py-1 text-[0.7rem] font-black uppercase tracking-[0.16em]">
                                  {notice.level}
                                </span>
                              </div>

                              <h4 className="mt-3 text-base font-black tracking-tight">
                                {notice.title}
                              </h4>

                              <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-7">
                                {notice.message}
                              </p>
                            </article>
                          ))}
                        </div>
                      </section>
                    ) : null}
                  </div>

                  <div className="space-y-4">
                    <Link
                      href="/catalogo"
                      className="premium-button-primary inline-flex h-13 w-full items-center justify-center rounded-2xl px-6 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
                    >
                      Continue to catalog
                    </Link>

                    <div className="rounded-[1.5rem] border border-emerald-200/80 bg-emerald-50/86 p-4 text-sm font-semibold leading-6 text-emerald-900">
                      Access completed for the active course edition.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-full flex-col justify-between gap-7">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <p className="premium-kicker">Student access</p>
                      <h2 className="text-3xl font-black tracking-[-0.045em] text-slate-950 sm:text-4xl">
                        Enter with group and student ID.
                      </h2>
                      <p className="text-sm font-medium leading-7 text-slate-600 sm:text-base">
                        Select your group and type your student ID exactly as
                        stored in the active course edition.
                      </p>
                    </div>

                    {homeNotices.length > 0 ? (
                      <section className="rounded-[1.8rem] border border-slate-200/80 bg-white/74 p-4 shadow-sm shadow-slate-900/5">
                        <div className="space-y-2">
                          <p className="premium-kicker">Notices</p>
                          <h3 className="text-xl font-black tracking-tight text-slate-950">
                            Latest announcements
                          </h3>
                        </div>

                        <div className="mt-4 space-y-3">
                          {homeNotices.map((notice) => (
                            <article
                              key={notice.id}
                              className={`rounded-[1.45rem] border p-4 ${getNoticeTone(
                                notice.level,
                              )}`}
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-white/80 px-3 py-1 text-[0.7rem] font-black uppercase tracking-[0.16em]">
                                  {notice.level}
                                </span>
                              </div>

                              <h4 className="mt-3 text-base font-black tracking-tight">
                                {notice.title}
                              </h4>

                              <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-7">
                                {notice.message}
                              </p>
                            </article>
                          ))}
                        </div>
                      </section>
                    ) : null}

                    {!activeEdition ? (
                      <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50/90 p-4 text-sm font-bold leading-6 text-rose-800">
                        No active course edition is configured. Student access
                        is temporarily unavailable.
                      </div>
                    ) : (
                      <div className="rounded-[1.75rem] border border-slate-200/80 bg-white/74 p-4 shadow-sm shadow-slate-900/5 sm:p-5">
                        <StudentAccessForm groups={groups} />
                      </div>
                    )}
                  </div>

                  <div className="premium-muted space-y-4 rounded-[1.75rem] p-4 sm:p-5">
                    <div className="space-y-3">
                      <p className="text-sm font-bold text-slate-600">
                        Is your group not registered yet?
                      </p>
                      <Link
                        href="/group-request"
                        className="premium-button-primary inline-flex h-12 w-full items-center justify-center rounded-2xl px-5 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
                      >
                        Submit a group request
                      </Link>
                    </div>

                    <div className="premium-divider" />

                    <div className="space-y-3">
                      <p className="text-sm font-bold text-slate-600">
                        Platform supervisor?
                      </p>
                      <Link
                        href="/admin"
                        className="premium-button-secondary inline-flex h-12 w-full items-center justify-center rounded-2xl px-5 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
                      >
                        Go to admin login
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}