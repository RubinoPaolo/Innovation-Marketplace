import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { prisma } from "@/lib/prisma";
import { getCurrentStudentSession } from "@/lib/student-session";
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
  _count: {
    interests: number;
  };
};

function formatPrice(priceCents: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
  }).format(priceCents / 100);
}

function formatPercentage(
  interestedCount: number,
  totalStudents: number,
): string {
  if (totalStudents <= 0) {
    return "0%";
  }

  const percentage = (interestedCount / totalStudents) * 100;

  return (
    new Intl.NumberFormat("en-GB", {
      maximumFractionDigits: 1,
    }).format(percentage) + "%"
  );
}

function rankProducts(products: RankedProduct[]): RankedProduct[] {
  return [...products].sort((firstProduct, secondProduct) => {
    const interestDifference =
      secondProduct._count.interests - firstProduct._count.interests;

    if (interestDifference !== 0) {
      return interestDifference;
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
  const [currentSession, activeEdition] = await Promise.all([
    getCurrentStudentSession(),
    getActiveCourseEdition(),
  ]);

  if (!currentSession || !activeEdition) {
    redirect("/");
  }

  const [products, totalStudents, totalInterests] = await Promise.all([
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
        _count: {
          select: {
            interests: true,
          },
        },
      },
    }),
    prisma.groupMember.count({
      where: {
        editionId: activeEdition.id,
        isActive: true,
      },
    }),
    prisma.purchaseInterest.count({
      where: {
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
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:px-12">
        <section className="space-y-8">
          <div className="space-y-4">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">
              Leaderboard · {activeEdition.name}
            </p>
            <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Most desired products
            </h1>
            <p className="max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
              The leaderboard ranks published products of the active course
              edition according to the number of students who indicated that
              they would buy them.
            </p>
          </div>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Published products
              </p>
              <p className="mt-3 text-3xl font-black text-slate-950">
                {rankedProducts.length}
              </p>
            </article>

            <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Purchase-interest votes
              </p>
              <p className="mt-3 text-3xl font-black text-slate-950">
                {totalInterests}
              </p>
            </article>

            <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Active students
              </p>
              <p className="mt-3 text-3xl font-black text-slate-950">
                {totalStudents}
              </p>
            </article>

            <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Current leader
              </p>
              <p className="mt-3 line-clamp-2 text-lg font-black text-slate-950">
                {leadingProduct?.title ?? "No product yet"}
              </p>
            </article>
          </section>

          {rankedProducts.length === 0 ? (
            <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm sm:p-12">
              <div className="mx-auto max-w-2xl space-y-4">
                <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
                  Ranking not available yet
                </p>
                <h2 className="text-3xl font-black tracking-tight text-slate-950">
                  No published products to rank
                </h2>
                <p className="text-base leading-8 text-slate-600">
                  Once groups publish their products, they will appear here and
                  the leaderboard will update automatically as students vote.
                </p>
                <Link
                  href="/catalogo"
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300"
                >
                  Go to catalog
                </Link>
              </div>
            </section>
          ) : (
            <>
              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="space-y-3">
                  <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
                    Top 3
                  </p>
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">
                    Products with the strongest purchase interest
                  </h2>
                </div>

                <div className="mt-6 grid gap-5 lg:grid-cols-3">
                  {podiumProducts.map((product, index) => {
                    const coverImage = product.images[0];
                    const rank = index + 1;

                    return (
                      <article
                        key={product.id}
                        className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50"
                      >
                        <Link
                          href={`/catalogo/${product.id}`}
                          className="block focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300"
                        >
                          <div className="aspect-[16/10] bg-slate-200">
                            {coverImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={coverImage.imageUrl}
                                alt={coverImage.altText ?? product.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center px-6 text-center text-sm font-semibold text-slate-500">
                                Product image not available yet
                              </div>
                            )}
                          </div>
                        </Link>

                        <div className="space-y-4 p-5">
                          <div className="flex items-center justify-between gap-3">
                            <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
                              {getRankLabel(rank)} place
                            </span>
                            <span className="text-sm font-black text-slate-700">
                              {product._count.interests} interested
                            </span>
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-slate-500">
                              Group {product.group.name}
                            </p>
                            <Link
                              href={`/catalogo/${product.id}`}
                              className="block text-2xl font-black tracking-tight text-slate-950 transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
                            >
                              {product.title}
                            </Link>
                          </div>

                          <div className="grid grid-cols-2 gap-3 rounded-3xl bg-white p-4">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                                Price
                              </p>
                              <p className="mt-2 text-base font-black text-slate-950">
                                {formatPrice(product.priceCents)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                                Interest share
                              </p>
                              <p className="mt-2 text-base font-black text-slate-950">
                                {formatPercentage(
                                  product._count.interests,
                                  totalStudents,
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

              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="space-y-3">
                  <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
                    Full ranking
                  </p>
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">
                    Complete leaderboard
                  </h2>
                </div>

                <div className="mt-6 space-y-4">
                  {rankedProducts.map((product, index) => {
                    const coverImage = product.images[0];
                    const rank = index + 1;

                    return (
                      <article
                        key={product.id}
                        className="grid gap-4 rounded-[2rem] border border-slate-200 bg-slate-50 p-4 md:grid-cols-[96px_1fr_auto] md:items-center"
                      >
                        <div className="flex items-center gap-3 md:block">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white">
                            {rank}
                          </div>
                          <p className="text-sm font-bold text-slate-600 md:mt-2 md:text-center">
                            Rank
                          </p>
                        </div>

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                          <Link
                            href={`/catalogo/${product.id}`}
                            className="block h-24 w-full overflow-hidden rounded-2xl bg-slate-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300 sm:w-36"
                          >
                            {coverImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={coverImage.imageUrl}
                                alt={coverImage.altText ?? product.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center px-3 text-center text-xs font-semibold text-slate-500">
                                No image
                              </div>
                            )}
                          </Link>

                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {product.category ? (
                                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">
                                  {product.category.name}
                                </span>
                              ) : null}
                            </div>

                            <p className="text-sm font-semibold text-slate-500">
                              Group {product.group.name}
                            </p>
                            <Link
                              href={`/catalogo/${product.id}`}
                              className="block text-xl font-black tracking-tight text-slate-950 transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
                            >
                              {product.title}
                            </Link>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 md:min-w-[300px]">
                          <div className="rounded-2xl bg-white p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                              Interested
                            </p>
                            <p className="mt-2 text-lg font-black text-slate-950">
                              {product._count.interests}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                              Interest share
                            </p>
                            <p className="mt-2 text-lg font-black text-slate-950">
                              {formatPercentage(
                                product._count.interests,
                                totalStudents,
                              )}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                              Price
                            </p>
                            <p className="mt-2 text-lg font-black text-slate-950">
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