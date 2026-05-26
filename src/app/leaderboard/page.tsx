import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { prisma } from "@/lib/prisma";
import { getActiveCourseEdition } from "@/lib/active-edition";

type RankedProduct = {
  id: number;
  title: string;
  priceCents: number;
  group: {
    name: string;
  };
  category: {
    name: string;
  } | null;
  images: Array<{
    imageUrl: string;
    altText: string | null;
  }>;
  interests: Array<{
    id: number;
  }>;
};

function formatPrice(priceCents: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
  }).format(priceCents / 100);
}

function formatPercentage(yesCount: number, totalGroups: number): string {
  if (totalGroups <= 0) {
    return "0%";
  }

  const percentage = (yesCount / totalGroups) * 100;

  return (
    new Intl.NumberFormat("en-GB", {
      maximumFractionDigits: 1,
    }).format(percentage) + "%"
  );
}

function rankProducts(products: RankedProduct[]): RankedProduct[] {
  return [...products].sort((firstProduct, secondProduct) => {
    const yesVoteDifference =
      secondProduct.interests.length - firstProduct.interests.length;

    if (yesVoteDifference !== 0) {
      return yesVoteDifference;
    }

    return firstProduct.title.localeCompare(secondProduct.title, "en");
  });
}

function getRankLabel(rank: number): string {
  if (rank === 1) {
    return "1st";
  }

  if (rank === 2) {
    return "2nd";
  }

  if (rank === 3) {
    return "3rd";
  }

  return `${rank}th`;
}

export default async function LeaderboardPage() {
  const activeEdition = await getActiveCourseEdition();

  if (!activeEdition) {
    return (
      <div className="premium-page min-h-screen text-slate-950">
        <SiteHeader />

        <main className="premium-shell py-8 sm:py-10 lg:py-12">
          <section className="premium-surface-strong rounded-[2.2rem] p-6 text-center sm:p-10 lg:p-12">
            <div className="mx-auto max-w-2xl space-y-5">
              <p className="premium-kicker justify-center">
                Leaderboard unavailable
              </p>
              <h1 className="text-3xl font-black tracking-[-0.045em] text-slate-950 sm:text-4xl">
                No active course edition is configured.
              </h1>
              <p className="text-base font-medium leading-8 text-slate-600">
                The public leaderboard becomes available when an active edition is configured.
              </p>
              <Link
                href="/"
                className="premium-button-primary inline-flex h-12 items-center justify-center rounded-2xl px-6 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
              >
                Back to homepage
              </Link>
            </div>
          </section>
        </main>
      </div>
    );
  }
  const [products, totalGroups, totalYesVotes] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        group: {
          editionId: activeEdition.id,
        },
      },
      select: {
        id: true,
        title: true,
        priceCents: true,
        group: {
          select: {
            name: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
        images: {
          where: {
            isCover: true,
          },
          select: {
            imageUrl: true,
            altText: true,
          },
          orderBy: {
            sortOrder: "asc",
          },
          take: 1,
        },
        interests: {
          where: {
            decision: "YES",
          },
          select: {
            id: true,
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
    prisma.purchaseInterest.count({
      where: {
        decision: "YES",
        product: {
          group: {
            editionId: activeEdition.id,
          },
        },
      },
    }),
  ]);

  const rankedProducts = rankProducts(products);
  const podiumProducts = rankedProducts.slice(0, 3);
  const leadingProduct = rankedProducts[0];

  return (
    <div className="premium-page min-h-screen text-slate-950">
      <SiteHeader />

      <main className="premium-shell py-8 sm:py-10 lg:py-12">
        <section className="space-y-8">
          <div className="premium-hero rounded-[2.4rem] px-5 py-6 sm:px-7 sm:py-8 lg:px-8 lg:py-9">
            <div className="relative z-10 space-y-7">
              <div className="max-w-4xl space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="premium-kicker">Leaderboard</span>
                  <span className="premium-chip inline-flex items-center rounded-full px-4 py-2 text-sm font-bold text-slate-700">
                    {activeEdition.name}
                  </span>
                </div>

                <h1 className="text-4xl font-black leading-[0.98] tracking-[-0.06em] text-slate-950 sm:text-5xl lg:text-6xl">
                  The products receiving the strongest positive group feedback.
                </h1>

                <p className="max-w-3xl text-base font-medium leading-8 text-slate-600 sm:text-lg">
                  Rankings are based on the number of groups that selected Yes
                  for each published product.
                </p>
              </div>

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <article className="premium-stat-card rounded-[1.8rem] p-5">
                  <p className="relative z-10 text-sm font-bold text-slate-500">
                    Published products
                  </p>
                  <p className="relative z-10 mt-4 text-4xl font-black tracking-tight text-slate-950">
                    {rankedProducts.length}
                  </p>
                </article>

                <article className="premium-stat-card rounded-[1.8rem] p-5">
                  <p className="relative z-10 text-sm font-bold text-slate-500">
                    Yes votes
                  </p>
                  <p className="relative z-10 mt-4 text-4xl font-black tracking-tight text-slate-950">
                    {totalYesVotes}
                  </p>
                </article>

                <article className="premium-stat-card rounded-[1.8rem] p-5">
                  <p className="relative z-10 text-sm font-bold text-slate-500">
                    Active groups
                  </p>
                  <p className="relative z-10 mt-4 text-4xl font-black tracking-tight text-slate-950">
                    {totalGroups}
                  </p>
                </article>

                <article className="premium-stat-card rounded-[1.8rem] p-5">
                  <p className="relative z-10 text-sm font-bold text-slate-500">
                    Current leader
                  </p>
                  <p className="relative z-10 mt-4 line-clamp-2 text-lg font-black leading-6 tracking-tight text-slate-950">
                    {leadingProduct?.title ?? "No product yet"}
                  </p>
                </article>
              </section>
            </div>
          </div>

          {rankedProducts.length === 0 ? (
            <section className="premium-surface-strong rounded-[2.2rem] p-6 text-center sm:p-10 lg:p-12">
              <div className="mx-auto max-w-2xl space-y-5">
                <p className="premium-kicker justify-center">
                  Ranking not available yet
                </p>
                <h2 className="text-3xl font-black tracking-[-0.045em] text-slate-950 sm:text-4xl">
                  No published products to rank.
                </h2>
                <p className="text-base font-medium leading-8 text-slate-600">
                  Once groups publish their products, they will appear here and
                  the ranking will update automatically as groups vote.
                </p>
                <Link
                  href="/catalogo"
                  className="premium-button-primary inline-flex h-12 items-center justify-center rounded-2xl px-6 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
                >
                  Go to catalog
                </Link>
              </div>
            </section>
          ) : (
            <>
              <section className="premium-surface-strong rounded-[2.2rem] p-5 sm:p-7 lg:p-8">
                <div className="space-y-3">
                  <p className="premium-kicker">Top 3</p>
                  <h2 className="text-3xl font-black tracking-[-0.045em] text-slate-950">
                    Podium of the most convincing proposals.
                  </h2>
                </div>

                <div className="mt-6 grid gap-5 lg:grid-cols-3">
                  {podiumProducts.map((product, index) => {
                    const coverImage = product.images[0];
                    const rank = index + 1;
                    const yesVotes = product.interests.length;

                    return (
                      <article
                        key={product.id}
                        className="premium-surface premium-card-hover group overflow-hidden rounded-[2rem]"
                      >
                        <Link
                          href={`/catalogo/${product.id}`}
                          className="block focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
                        >
                          <div className="relative aspect-[16/10] overflow-hidden bg-slate-200/80">
                            {coverImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={coverImage.imageUrl}
                                alt={coverImage.altText ?? product.title}
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center px-6 text-center text-sm font-bold text-slate-500">
                                Product image not available yet
                              </div>
                            )}

                            <div className="absolute left-4 top-4 rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white shadow-lg shadow-slate-950/20">
                              {getRankLabel(rank)} place
                            </div>
                          </div>
                        </Link>

                        <div className="space-y-5 p-5 sm:p-6">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-bold text-slate-500">
                              Group {product.group.name}
                            </p>
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                              {yesVotes} yes vote{yesVotes === 1 ? "" : "s"}
                            </span>
                          </div>

                          <Link
                            href={`/catalogo/${product.id}`}
                            className="block text-2xl font-black tracking-[-0.045em] text-slate-950 transition hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
                          >
                            {product.title}
                          </Link>

                          <div className="premium-muted grid grid-cols-2 gap-3 rounded-[1.6rem] p-3.5">
                            <div className="rounded-[1.25rem] border border-white/70 bg-white/70 p-3.5">
                              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                                Price
                              </p>
                              <p className="mt-2 text-base font-black tracking-tight text-slate-950">
                                {formatPrice(product.priceCents)}
                              </p>
                            </div>

                            <div className="rounded-[1.25rem] border border-white/70 bg-white/70 p-3.5">
                              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                                Yes share
                              </p>
                              <p className="mt-2 text-base font-black tracking-tight text-slate-950">
                                {formatPercentage(yesVotes, totalGroups)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="premium-surface-strong rounded-[2.2rem] p-5 sm:p-7 lg:p-8">
                <div className="space-y-3">
                  <p className="premium-kicker">Full ranking</p>
                  <h2 className="text-3xl font-black tracking-[-0.045em] text-slate-950">
                    Complete leaderboard.
                  </h2>
                </div>

                <div className="mt-6 space-y-4">
                  {rankedProducts.map((product, index) => {
                    const coverImage = product.images[0];
                    const rank = index + 1;
                    const yesVotes = product.interests.length;

                    return (
                      <article
                        key={product.id}
                        className="premium-muted grid gap-4 rounded-[1.9rem] p-4 md:grid-cols-[92px_minmax(0,1fr)_minmax(280px,340px)] md:items-center"
                      >
                        <div className="flex items-center gap-3 md:block">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white shadow-lg shadow-slate-950/15">
                            {rank}
                          </div>
                          <p className="text-sm font-black text-slate-600 md:mt-2 md:text-center">
                            Rank
                          </p>
                        </div>

                        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                          <Link
                            href={`/catalogo/${product.id}`}
                            className="block h-24 w-full shrink-0 overflow-hidden rounded-2xl bg-slate-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80 sm:w-36"
                          >
                            {coverImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={coverImage.imageUrl}
                                alt={coverImage.altText ?? product.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center px-3 text-center text-xs font-bold text-slate-500">
                                No image
                              </div>
                            )}
                          </Link>

                          <div className="min-w-0 space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {product.category ? (
                                <span className="premium-chip rounded-full px-3 py-1 text-xs font-black text-slate-700">
                                  {product.category.name}
                                </span>
                              ) : null}
                            </div>

                            <p className="text-sm font-bold text-slate-500">
                              Group {product.group.name}
                            </p>
                            <Link
                              href={`/catalogo/${product.id}`}
                              className="block truncate text-xl font-black tracking-[-0.04em] text-slate-950 transition hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
                            >
                              {product.title}
                            </Link>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl border border-white/70 bg-white/76 p-4">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                              Yes votes
                            </p>
                            <p className="mt-2 text-lg font-black tracking-tight text-slate-950">
                              {yesVotes}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/70 bg-white/76 p-4">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                              Yes share
                            </p>
                            <p className="mt-2 text-lg font-black tracking-tight text-slate-950">
                              {formatPercentage(yesVotes, totalGroups)}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/70 bg-white/76 p-4">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                              Price
                            </p>
                            <p className="mt-2 text-lg font-black tracking-tight text-slate-950">
                              {formatPrice(product.priceCents)}
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </section>
      </main>
    </div>
  );
}