export default function AdminVotingMonitorLoading() {
  return (
    <main className="premium-page min-h-screen text-slate-950">
      <section className="premium-shell space-y-8 py-8 sm:py-10 lg:py-12">
        <div className="premium-hero rounded-[2.4rem] px-5 py-6 sm:px-7 sm:py-8 lg:px-8 lg:py-9">
          <div className="relative z-10 space-y-5">
            <p className="premium-kicker">Voting monitor</p>
            <h1 className="text-4xl font-black tracking-[-0.06em] text-slate-950 sm:text-5xl">
              Loading voting progress...
            </h1>
            <p className="max-w-3xl text-base font-medium leading-8 text-slate-600">
              Preparing the operational voting dashboard for the active edition.
            </p>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <article
              key={item}
              className="premium-stat-card rounded-[1.8rem] p-5"
            >
              <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
              <div className="mt-4 h-9 w-16 animate-pulse rounded-xl bg-slate-200" />
            </article>
          ))}
        </section>

        <section className="premium-surface-strong rounded-[2.2rem] p-5 sm:p-7 lg:p-8">
          <div className="h-5 w-32 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 h-8 w-72 max-w-full animate-pulse rounded-xl bg-slate-200" />
          <div className="mt-6 grid gap-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-[1.6rem] bg-slate-200/80"
              />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}