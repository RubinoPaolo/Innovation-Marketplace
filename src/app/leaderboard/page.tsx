import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { prisma } from "@/lib/prisma";
import { getActiveCourseEdition } from "@/lib/active-edition";
import { formatPriceFromCents } from "@/lib/price";

type LeaderboardProduct = {
  id: number;
  title: string;
  priceCents: {
    toString(): string;
  };
  groupId: number;
  publishedAt: Date | null;
  createdAt: Date;
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

type GroupCompletionVote = {
  groupId: number;
  productId: number;
  product: {
    groupId: number;
  };
};

type YesLeaderboardRow = LeaderboardProduct & {
  yesVotes: number;
  yesRank: number;
};

type OverallLeaderboardRow = LeaderboardProduct & {
  yesVotes: number;
  yesRank: number;
  overallRank: number;
  completionVotes: number;
  completionDenominator: number;
  completionRate: number;
  modifier: number;
  overallScore: number;
  positionChange: number;
};

function formatPercentage(value: number): string {
  return (
    new Intl.NumberFormat("en-GB", {
      maximumFractionDigits: 1,
    }).format(value * 100) + "%"
  );
}

function formatScore(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function rankYesProducts(products: LeaderboardProduct[]): YesLeaderboardRow[] {
  return [...products]
    .map((product) => ({
      ...product,
      yesVotes: product.interests.length,
    }))
    .sort((firstProduct, secondProduct) => {
      if (secondProduct.yesVotes !== firstProduct.yesVotes) {
        return secondProduct.yesVotes - firstProduct.yesVotes;
      }

      return firstProduct.title.localeCompare(secondProduct.title, "en");
    })
    .map((product, index) => ({
      ...product,
      yesRank: index + 1,
    }));
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

function buildCompletionVotesByGroupId(
  votes: GroupCompletionVote[],
): Map<number, number> {
  const completionVotesByGroupId = new Map<number, number>();

  for (const vote of votes) {
    if (vote.groupId === vote.product.groupId) {
      continue;
    }

    completionVotesByGroupId.set(
      vote.groupId,
      (completionVotesByGroupId.get(vote.groupId) ?? 0) + 1,
    );
  }

  return completionVotesByGroupId;
}

function buildOverallLeaderboardRows(
  yesRows: YesLeaderboardRow[],
  completionVotes: GroupCompletionVote[],
  eligibleProductsCount: number,
): OverallLeaderboardRow[] {
  const completionVotesByGroupId = buildCompletionVotesByGroupId(completionVotes);
  const completionDenominator = Math.max(eligibleProductsCount - 1, 0);

  return [...yesRows]
    .map((product) => {
      const rawCompletionVotes =
        completionVotesByGroupId.get(product.groupId) ?? 0;

      const cappedCompletionVotes =
        completionDenominator > 0
          ? Math.min(rawCompletionVotes, completionDenominator)
          : 0;

      const completionRate =
        completionDenominator > 0
          ? cappedCompletionVotes / completionDenominator
          : 1;

      const modifier = 10 * completionRate - 5;
      const overallScore = product.yesVotes + modifier;

      return {
        ...product,
        overallRank: 0,
        completionVotes: cappedCompletionVotes,
        completionDenominator,
        completionRate,
        modifier,
        overallScore,
        positionChange: 0,
      };
    })
    .sort((firstProduct, secondProduct) => {
      if (secondProduct.overallScore !== firstProduct.overallScore) {
        return secondProduct.overallScore - firstProduct.overallScore;
      }

      if (secondProduct.yesVotes !== firstProduct.yesVotes) {
        return secondProduct.yesVotes - firstProduct.yesVotes;
      }

      return firstProduct.title.localeCompare(secondProduct.title, "en");
    })
    .map((product, index) => {
      const overallRank = index + 1;

      return {
        ...product,
        overallRank,
        positionChange: product.yesRank - overallRank,
      };
    });
}

function PositionChangeBadge({ change }: { change: number }) {
  if (change > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-800">
        <span aria-hidden="true">▲</span>
        +{change}
      </span>
    );
  }

  if (change < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-black text-rose-800">
        <span aria-hidden="true">▼</span>
        {change}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-black text-slate-600">
      —
    </span>
  );
}

function ProductCover({
  product,
  className,
}: {
  product: LeaderboardProduct;
  className: string;
}) {
  const coverImage = product.images[0];

  return (
    <Link
      href={`/catalogo/${product.id}`}
      className={`${className} block overflow-hidden bg-slate-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80`}
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
  );
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
                The public leaderboard becomes available when an active edition
                is configured.
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

  const [products, totalGroups, totalYesVotes, votingSettings] =
    await Promise.all([
      prisma.product.findMany({
        where: {
          status: "PUBLISHED",
          group: {
            editionId: activeEdition.id,
            isActive: true,
          },
        },
        select: {
          id: true,
          title: true,
          priceCents: true,
          groupId: true,
          publishedAt: true,
          createdAt: true,
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
            status: "PUBLISHED",
            group: {
              editionId: activeEdition.id,
              isActive: true,
            },
          },
        },
      }),

      prisma.votingSettings.findUnique({
        where: {
          editionId: activeEdition.id,
        },
        select: {
          openedAt: true,
          updatedAt: true,
        },
      }),
    ]);

  const votingOpenedAt =
    votingSettings?.openedAt ?? votingSettings?.updatedAt ?? new Date();

  const eligibleProducts = products.filter((product) => {
    const publishedAt = product.publishedAt ?? product.createdAt;

    return publishedAt <= votingOpenedAt;
  });

  const eligibleProductIds = eligibleProducts.map((product) => product.id);

  const completionVotes =
    eligibleProductIds.length > 0
      ? await prisma.purchaseInterest.findMany({
          where: {
            productId: {
              in: eligibleProductIds,
            },
            group: {
              editionId: activeEdition.id,
              isActive: true,
            },
            product: {
              status: "PUBLISHED",
              group: {
                editionId: activeEdition.id,
                isActive: true,
              },
            },
          },
          select: {
            groupId: true,
            productId: true,
            product: {
              select: {
                groupId: true,
              },
            },
          },
        })
      : [];

  const yesLeaderboardRows = rankYesProducts(products);
  const podiumProducts = yesLeaderboardRows.slice(0, 3);
  const leadingProduct = yesLeaderboardRows[0];

  const overallLeaderboardRows = buildOverallLeaderboardRows(
    yesLeaderboardRows,
    completionVotes,
    eligibleProducts.length,
  );

  const overallLeader = overallLeaderboardRows[0];

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
                  Product ranking and voting participation score.
                </h1>

                <p className="max-w-4xl text-base font-medium leading-8 text-slate-600 sm:text-lg">
                  The original leaderboard ranks products by Yes votes. The new
                  overall score adds an activity modifier based on how completely
                  each group participated in the voting process.
                </p>
              </div>

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <article className="premium-stat-card rounded-[1.8rem] p-5">
                  <p className="relative z-10 text-sm font-bold text-slate-500">
                    Published products
                  </p>
                  <p className="relative z-10 mt-4 text-4xl font-black tracking-tight text-slate-950">
                    {yesLeaderboardRows.length}
                  </p>
                </article>

                <article className="premium-stat-card rounded-[1.8rem] p-5">
                  <p className="relative z-10 text-sm font-bold text-slate-500">
                    Eligible products
                  </p>
                  <p className="relative z-10 mt-4 text-4xl font-black tracking-tight text-slate-950">
                    {eligibleProducts.length}
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
                    Original leader
                  </p>
                  <p className="relative z-10 mt-4 line-clamp-2 text-lg font-black leading-6 tracking-tight text-slate-950">
                    {leadingProduct?.group.name ?? "No product yet"}
                  </p>
                </article>

                <article className="premium-stat-card rounded-[1.8rem] p-5">
                  <p className="relative z-10 text-sm font-bold text-slate-500">
                    Overall leader
                  </p>
                  <p className="relative z-10 mt-4 line-clamp-2 text-lg font-black leading-6 tracking-tight text-slate-950">
                    {overallLeader?.group.name ?? "No product yet"}
                  </p>
                </article>
              </section>
            </div>
          </div>

          {yesLeaderboardRows.length === 0 ? (
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
                  <p className="premium-kicker">Top 3 · original ranking</p>
                  <h2 className="text-3xl font-black tracking-[-0.045em] text-slate-950">
                    Podium by Yes votes.
                  </h2>
                </div>

                <div className="mt-6 grid gap-5 lg:grid-cols-3">
                  {podiumProducts.map((product) => {
                    const rank = product.yesRank;
                    const yesVotes = product.yesVotes;

                    return (
                      <article
                        key={product.id}
                        className="premium-surface premium-card-hover group overflow-hidden rounded-[2rem]"
                      >
                        <ProductCover
                          product={product}
                          className="relative aspect-[16/10]"
                        />

                        <div className="space-y-5 p-5 sm:p-6">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white shadow-lg shadow-slate-950/20">
                              {getRankLabel(rank)} place
                            </span>
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                              {yesVotes} yes vote{yesVotes === 1 ? "" : "s"}
                            </span>
                          </div>

                          <div>
                            <p className="text-sm font-bold text-slate-500">
                              Group {product.group.name}
                            </p>
                            <Link
                              href={`/catalogo/${product.id}`}
                              className="mt-2 block text-2xl font-black tracking-[-0.045em] text-slate-950 transition hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
                            >
                              {product.title}
                            </Link>
                          </div>

                          <div className="premium-muted grid grid-cols-2 gap-3 rounded-[1.6rem] p-3.5">
                            <div className="rounded-[1.25rem] border border-white/70 bg-white/70 p-3.5">
                              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                                Price
                              </p>
                              <p className="mt-2 text-base font-black tracking-tight text-slate-950">
                                {formatPriceFromCents(product.priceCents)}
                              </p>
                            </div>

                            <div className="rounded-[1.25rem] border border-white/70 bg-white/70 p-3.5">
                              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                                Yes share
                              </p>
                              <p className="mt-2 text-base font-black tracking-tight text-slate-950">
                                {formatPercentage(
                                  totalGroups > 0
                                    ? yesVotes / totalGroups
                                    : 0,
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="grid gap-6 xl:grid-cols-2 xl:items-start">
                <section className="premium-surface-strong rounded-[2.2rem] p-5 sm:p-7 lg:p-8">
                  <div className="space-y-3">
                    <p className="premium-kicker">Original leaderboard</p>
                    <h2 className="text-3xl font-black tracking-[-0.045em] text-slate-950">
                      Ranking by Yes votes.
                    </h2>
                    <p className="text-sm font-medium leading-7 text-slate-600">
                      This is the existing leaderboard. It ranks products only
                      by the number of groups that selected Yes.
                    </p>
                  </div>

                  <div className="mt-6 space-y-4">
                    {yesLeaderboardRows.map((product) => {
                      return (
                        <article
                          key={product.id}
                          className="premium-muted grid gap-4 rounded-[1.9rem] p-4 md:grid-cols-[64px_minmax(0,1fr)_minmax(160px,190px)] md:items-center"
                        >
                          <div className="flex items-center gap-3 md:block">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-base font-black text-white shadow-lg shadow-slate-950/15">
                              {product.yesRank}
                            </div>
                          </div>

                          <div className="min-w-0 space-y-2">
                            <p className="text-sm font-bold text-slate-500">
                              Group {product.group.name}
                            </p>
                            <Link
                              href={`/catalogo/${product.id}`}
                              className="block truncate text-xl font-black tracking-[-0.04em] text-slate-950 transition hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
                            >
                              {product.title}
                            </Link>
                            {product.category ? (
                              <span className="premium-chip inline-flex rounded-full px-3 py-1 text-xs font-black text-slate-700">
                                {product.category.name}
                              </span>
                            ) : null}
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
                            <div className="rounded-2xl border border-white/70 bg-white/76 p-4">
                              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                                Yes votes
                              </p>
                              <p className="mt-2 text-lg font-black tracking-tight text-slate-950">
                                {product.yesVotes}
                              </p>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>

                <section className="premium-surface-strong rounded-[2.2rem] p-5 sm:p-7 lg:p-8">
                  <div className="space-y-3">
                    <p className="premium-kicker">Overall score leaderboard</p>
                    <h2 className="text-3xl font-black tracking-[-0.045em] text-slate-950">
                      Ranking with participation modifier.
                    </h2>
                    <p className="text-sm font-medium leading-7 text-slate-600">
                      Overall score = Yes votes + modifier. Modifier = 10 ×
                      completion rate − 5. Completion rate counts both Yes and
                      No group votes on eligible products.
                    </p>
                  </div>

                  <div className="mt-6 space-y-4">
                    {overallLeaderboardRows.map((product) => {
                      return (
                        <article
                          key={product.id}
                          className="premium-muted rounded-[1.9rem] p-4"
                        >
                          <div className="grid gap-4 md:grid-cols-[64px_minmax(0,1fr)_minmax(200px,240px)] md:items-center">
                            <div className="flex items-center gap-3 md:block">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-base font-black text-white shadow-lg shadow-slate-950/15">
                                {product.overallRank}
                              </div>
                            </div>

                            <div className="min-w-0 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-bold text-slate-500">
                                  Group {product.group.name}
                                </p>
                                <PositionChangeBadge
                                  change={product.positionChange}
                                />
                              </div>

                              <Link
                                href={`/catalogo/${product.id}`}
                                className="block truncate text-xl font-black tracking-[-0.04em] text-slate-950 transition hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
                              >
                                {product.title}
                              </Link>
                            </div>

                            <div className="rounded-2xl border border-white/70 bg-white/76 p-4">
                              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                                Overall score
                              </p>
                              <p className="mt-2 text-lg font-black tracking-tight text-slate-950">
                                {formatScore(product.overallScore)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-4">
                            <div className="rounded-2xl border border-white/70 bg-white/76 p-4">
                              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                                Yes votes
                              </p>
                              <p className="mt-2 text-lg font-black tracking-tight text-slate-950">
                                {product.yesVotes}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-white/70 bg-white/76 p-4">
                              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                                Modifier
                              </p>
                              <p
                                className={`mt-2 text-lg font-black tracking-tight ${
                                  product.modifier >= 0
                                    ? "text-emerald-700"
                                    : "text-rose-700"
                                }`}
                              >
                                {product.modifier >= 0 ? "+" : ""}
                                {formatScore(product.modifier)}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-white/70 bg-white/76 p-4">
                              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                                Completion
                              </p>
                              <p className="mt-2 text-lg font-black tracking-tight text-slate-950">
                                {formatPercentage(product.completionRate)}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-white/70 bg-white/76 p-4">
                              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                                Votes cast
                              </p>
                              <p className="mt-2 text-lg font-black tracking-tight text-slate-950">
                                {product.completionVotes}/
                                {product.completionDenominator}
                              </p>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              </section>
            </>
          )}
        </section>
      </main>
    </div>
  );
}