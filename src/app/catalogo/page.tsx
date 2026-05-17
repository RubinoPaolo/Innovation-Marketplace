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
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:px-12">
        <section className="space-y-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-slate-500">
                Shared catalog · {activeEdition.name}
              </p>
              <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Explore the products created by the groups
              </h1>
              <p className="max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                Browse the published innovations of the active course edition
                and discover which ideas receive the strongest positive demand
                signal.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Published products
              </p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {products.length}
              </p>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm sm:p-12">
              <div className="mx-auto max-w-2xl space-y-4">
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-slate-500">
                  Catalog in progress
                </p>
                <h2 className="text-3xl font-black tracking-tight text-slate-950">
                  No products have been published yet
                </h2>
                <p className="text-base leading-8 text-slate-600">
                  This is expected at this stage. Each team will first complete
                  its product draft, upload images and publish the product from
                  the group area.
                </p>
                <Link
                  href="/"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300"
                >
                  Back to homepage
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => {
                const coverImage = product.images[0];
                const yesVotes = product.interests.length;

                return (
                  <article
                    key={product.id}
                    className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
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

                    <div className="space-y-5 p-6">
                      <div className="flex flex-wrap gap-2">
                        {product.category ? (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                            {product.category.name}
                          </span>
                        ) : null}

                        {product.badges.slice(0, 2).map((productBadge) => (
                          <span
                            key={`${product.id}-${productBadge.badgeId}`}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600"
                          >
                            {productBadge.badge.name}
                          </span>
                        ))}
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

                        {product.shortDescription ? (
                          <p className="line-clamp-3 text-sm leading-7 text-slate-600">
                            {product.shortDescription}
                          </p>
                        ) : (
                          <p className="text-sm leading-7 text-slate-500">
                            No short description provided.
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 rounded-3xl bg-slate-100 p-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                            Price
                          </p>
                          <p className="mt-2 text-lg font-black text-slate-950">
                            {formatPrice(product.priceCents)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                            Yes votes
                          </p>
                          <p className="mt-2 text-lg font-black text-slate-950">
                            {yesVotes}
                          </p>
                        </div>
                      </div>

                      <Link
                        href={`/catalogo/${product.id}`}
                        className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300"
                      >
                        View details
                      </Link>
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