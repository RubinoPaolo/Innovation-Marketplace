import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { prisma } from "@/lib/prisma";
import { getCurrentStudentSession } from "@/lib/student-session";
import { getActiveCourseEdition } from "@/lib/active-edition";

function formatPrice(priceCents: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
  }).format(priceCents / 100);
}

export default async function CatalogPage() {
  const [currentSession, activeEdition] = await Promise.all([
    getCurrentStudentSession(),
    getActiveCourseEdition(),
  ]);

  if (!currentSession || !activeEdition) {
    redirect("/");
  }

  const products = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      group: {
        editionId: activeEdition.id,
      },
    },
    include: {
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
      badges: {
        include: {
          badge: {
            select: {
              name: true,
            },
          },
        },
      },
      images: {
        where: {
          isCover: true,
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
    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <div className="premium-page min-h-screen text-slate-950">
      <SiteHeader />

      <main className="premium-shell py-8 sm:py-10 lg:py-12">
        <section className="space-y-8">
          <div className="premium-hero rounded-[2.4rem] px-5 py-6 sm:px-7 sm:py-8 lg:px-8 lg:py-9">
            <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="premium-kicker">Shared catalog</span>
                  <span className="premium-chip inline-flex items-center rounded-full px-4 py-2 text-sm font-bold text-slate-700">
                    {activeEdition.name}
                  </span>
                </div>

                <h1 className="text-4xl font-black leading-[0.98] tracking-[-0.06em] text-slate-950 sm:text-5xl lg:text-6xl">
                  Explore every published innovation proposal.
                </h1>

                <p className="max-w-3xl text-base font-medium leading-8 text-slate-600 sm:text-lg">
                  Browse the products created by the groups, compare their positioning and discover which ideas are receiving the strongest positive demand signal.
                </p>
              </div>

              <article className="premium-stat-card min-w-[13rem] rounded-[1.8rem] p-5 sm:p-6">
                <p className="relative z-10 text-sm font-bold text-slate-500">
                  Published products
                </p>
                <p className="relative z-10 mt-4 text-4xl font-black tracking-tight text-slate-950">
                  {products.length}
                </p>
              </article>
            </div>
          </div>

          {products.length === 0 ? (
            <section className="premium-surface-strong rounded-[2.2rem] p-6 text-center sm:p-10 lg:p-12">
              <div className="mx-auto max-w-2xl space-y-5">
                <p className="premium-kicker justify-center">Catalog in progress</p>
                <h2 className="text-3xl font-black tracking-[-0.045em] text-slate-950 sm:text-4xl">
                  No products have been published yet.
                </h2>
                <p className="text-base font-medium leading-8 text-slate-600">
                  Each team will first complete its product draft, upload images and publish the final proposal from the group area.
                </p>
                <Link
                  href="/"
                  className="premium-button-primary inline-flex h-12 items-center justify-center rounded-2xl px-6 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
                >
                  Back to homepage
                </Link>
              </div>
            </section>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => {
                const coverImage = product.images[0];
                const yesVotes = product.interests.length;

                return (
                  <article
                    key={product.id}
                    className="premium-surface premium-card-hover group flex h-full flex-col overflow-hidden rounded-[2.15rem]"
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

                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/55 to-transparent" />

                        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                          {product.category ? (
                            <span className="rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-black text-slate-800 shadow-sm backdrop-blur">
                              {product.category.name}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </Link>

                    <div className="flex h-full flex-col justify-between gap-6 p-5 sm:p-6">
                      <div className="space-y-5">
                        <div className="flex flex-wrap gap-2">
                          {product.badges.slice(0, 2).map((productBadge) => (
                            <span
                              key={`${product.id}-${productBadge.badgeId}`}
                              className="premium-chip rounded-full px-3 py-1 text-xs font-black text-slate-600"
                            >
                              {productBadge.badge.name}
                            </span>
                          ))}
                        </div>

                        <div className="space-y-2.5">
                          <p className="text-sm font-bold text-slate-500">
                            Group {product.group.name}
                          </p>

                          <Link
                            href={`/catalogo/${product.id}`}
                            className="block text-2xl font-black tracking-[-0.045em] text-slate-950 transition hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
                          >
                            {product.title}
                          </Link>

                          {product.shortDescription ? (
                            <p className="line-clamp-3 text-sm font-medium leading-7 text-slate-600">
                              {product.shortDescription}
                            </p>
                          ) : (
                            <p className="text-sm font-medium leading-7 text-slate-500">
                              No short description provided.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="premium-muted grid grid-cols-2 gap-3 rounded-[1.6rem] p-3.5">
                          <div className="rounded-[1.25rem] border border-white/70 bg-white/70 p-3.5">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                              Price
                            </p>
                            <p className="mt-2 text-lg font-black tracking-tight text-slate-950">
                              {formatPrice(product.priceCents)}
                            </p>
                          </div>

                          <div className="rounded-[1.25rem] border border-white/70 bg-white/70 p-3.5">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                              Yes votes
                            </p>
                            <p className="mt-2 text-lg font-black tracking-tight text-slate-950">
                              {yesVotes}
                            </p>
                          </div>
                        </div>

                        <Link
                          href={`/catalogo/${product.id}`}
                          className="premium-button-primary inline-flex h-12 w-full items-center justify-center rounded-2xl px-5 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
                        >
                          View details
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
