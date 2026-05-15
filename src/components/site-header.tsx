import Link from "next/link";
import { logoutStudent } from "@/app/actions/logout-student";
import { getCurrentStudentSession } from "@/lib/student-session";

export async function SiteHeader() {
  const currentSession = await getCurrentStudentSession();

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-lg font-black tracking-tight text-slate-950">
            Innovation Marketplace
          </Link>
        </div>

        {currentSession ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <nav
              aria-label="Main navigation"
              className="flex flex-wrap items-center gap-2"
            >
              <Link
                href="/"
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
              >
                Home
              </Link>

              <Link
                href="/catalogo"
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
              >
                Catalog
              </Link>

              <Link
                href="/leaderboard"
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
              >
                Leaderboard
              </Link>

              <Link
                href="/area-gruppo"
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
              >
                Group area
              </Link>
            </nav>

            <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-950">
                  {currentSession.member.group.name}
                </p>
                <p className="text-xs font-medium text-slate-500">
                  Student ID {currentSession.member.studentNumber}
                </p>
              </div>

              <form action={logoutStudent}>
                <button
                  type="submit"
                  className="h-10 rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
                >
                  Log out
                </button>
              </form>
            </div>
          </div>
        ) : (
          <p className="text-sm font-medium text-slate-600">
            Identify yourself from the homepage to access the platform features.
          </p>
        )}
      </div>
    </header>
  );
}