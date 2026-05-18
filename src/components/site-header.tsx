import Link from "next/link";
import { logoutStudent } from "@/app/actions/logout-student";
import { getCurrentStudentSession } from "@/lib/student-session";

function maskStudentId(studentNumber: string): string {
  return "•".repeat(Math.max(studentNumber.length, 1));
}

export async function SiteHeader() {
  const currentSession = await getCurrentStudentSession();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/78 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/72">
      <div className="premium-shell flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="group inline-flex min-w-0 items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm shadow-slate-900/5 transition group-hover:-translate-y-0.5 group-hover:border-blue-200 group-hover:shadow-md group-hover:shadow-blue-900/10">
              <span className="h-5 w-5 rounded-[0.42rem] bg-gradient-to-br from-slate-950 via-blue-700 to-violet-700 shadow-sm shadow-blue-950/20" />
            </span>

            <span className="min-w-0">
              <span className="block truncate text-base font-black tracking-[-0.04em] text-slate-950 sm:text-lg">
                Innovation Marketplace
              </span>
              <span className="hidden text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 sm:block">
                Course innovation platform
              </span>
            </span>
          </Link>
        </div>

        {currentSession ? (
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-end">
            <nav
              aria-label="Main navigation"
              className="flex max-w-full items-center gap-2 overflow-x-auto rounded-full border border-slate-200/80 bg-white/72 p-1.5 shadow-sm shadow-slate-900/5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <Link
                href="/"
                className="shrink-0 rounded-full px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-950 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
              >
                Home
              </Link>

              <Link
                href="/catalogo"
                className="shrink-0 rounded-full px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-950 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
              >
                Catalog
              </Link>

              <Link
                href="/leaderboard"
                className="shrink-0 rounded-full px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-950 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
              >
                Leaderboard
              </Link>

              <Link
                href="/area-gruppo"
                className="shrink-0 rounded-full px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-950 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
              >
                Group area
              </Link>
            </nav>

            <div className="premium-surface flex flex-col gap-3 rounded-[1.75rem] px-4 py-3 sm:flex-row sm:items-center sm:justify-between xl:min-w-[20rem]">
              <div className="min-w-0">
                <p className="truncate text-sm font-black tracking-tight text-slate-950">
                  {currentSession.member.group.name}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">
                  Student ID{" "}
                  {maskStudentId(currentSession.member.studentNumber)}
                </p>
              </div>

              <form action={logoutStudent} className="shrink-0">
                <button
                  type="submit"
                  className="inline-flex h-10 w-full items-center justify-center rounded-full border border-slate-300/90 bg-white/90 px-4 text-sm font-bold text-slate-700 shadow-sm shadow-slate-900/5 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-950 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80 sm:w-auto"
                >
                  Log out
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="premium-surface flex items-center rounded-full px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm shadow-slate-900/5">
            Identify yourself from the homepage to access the platform features.
          </div>
        )}
      </div>
    </header>
  );
}