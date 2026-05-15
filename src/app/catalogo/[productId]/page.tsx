import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PurchaseInterestPanel } from "@/components/purchase-interest-panel";
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

type ProductDetailPageProps = {
  params: Promise<{
    productId: string;
  }>;
};

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const [currentSession, activeEdition] = await Promise.all([
    getCurrentStudentSession(),
    getActiveCourseEdition(),
  ]);

  if (!currentSession || !activeEdition) {
    redirect("/");
  }

  const { productId } = await params;
  const parsedProductId = Number(productId);

  if (!Number.isInteger(parsedProductId) || parsedProductId <= 0) {
    notFound();
  }

  const [product, totalStudents, votingSettings, existingInterest] =
    await Promise.all([
      prisma.product.findFirst({
        where: {
          id: parsedProductId,
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
            select: {
              id: true,
              imageUrl: true,
              altText: true,
              isCover: true,
            },
            orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
          },
          features: {
            select: {
              id: true,
              text: true,
            },
            orderBy: {
              sortOrder: "asc",
            },
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
      prisma.votingSettings.findUnique({
        where: {
          editionId: activeEdition.id,
        },
        select: {
          isOpen: true,
        },
      }),
      prisma.purchaseInterest.findUnique({
        where: {
          productId_memberId: {
            productId: parsedProductId,
            memberId: currentSession.member.id,
          },
        },
        select: {
          id: true,
        },
      }),
    ]);

  if (!product) {
    notFound();
  }

  const coverImage =
    product.images.find((image) => image.isCover) ?? product.images[0];

  const interestedCount = product._count.interests;
  const votingOpen = votingSettings?.isOpen ?? false;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:px-12">
        <div className="mb-6">
          <Link
            href="/catalogo"
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
          >
            Back to catalog
          </Link>
        </div>

        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
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
            </div>

            {product.images.length > 1 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {product.images.map((image) => (
                  <article
                    key={image.id}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="aspect-[16/10] bg-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.imageUrl}
                        alt={
                          image.altText ?? `${product.title} product image`
                        }
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {image.isCover ? (
                      <div className="p-4">
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                          Cover image
                        </span>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap gap-2">
                {product.category ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                    {product.category.name}
                  </span>
                ) : null}

                {product.badges.map((productBadge) => (
                  <span
                    key={`${product.id}-${productBadge.badgeId}`}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-700"
                  >
                    {productBadge.badge.name}
                  </span>
                ))}
              </div>

              <div className="mt-5 space-y-4">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-slate-500">
                  {activeEdition.name} · Group {product.group.name}
                </p>

                <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  {product.title}
                </h1>

                <p className="text-3xl font-black text-slate-950">
                  {formatPrice(product.priceCents)}
                </p>
              </div>

              {product.shortDescription ? (
                <p className="mt-6 text-base leading-8 text-slate-600">
                  {product.shortDescription}
                </p>
              ) : null}
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">
                  Interested students
                </p>
                <p className="mt-3 text-4xl font-black text-slate-950">
                  {interestedCount}
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">
                  Share of active students
                </p>
                <p className="mt-3 text-4xl font-black text-slate-950">
                  {formatPercentage(interestedCount, totalStudents)}
                </p>
              </div>
            </section>
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="space-y-6">
            {product.description ? (
              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
                  Product description
                </p>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                  Full product overview
                </h2>
                <p className="mt-5 whitespace-pre-line text-base leading-8 text-slate-600">
                  {product.description}
                </p>
              </section>
            ) : null}

            {product.features.length > 0 ? (
              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
                  Main features
                </p>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                  What stands out
                </h2>
                <ul className="mt-5 grid gap-3">
                  {product.features.map((feature) => (
                    <li
                      key={feature.id}
                      className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold leading-7 text-slate-800"
                    >
                      {feature.text}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <PurchaseInterestPanel
            productId={product.id}
            totalStudents={totalStudents}
            initialState={{
              status: "idle",
              message: "",
              isInterested: Boolean(existingInterest),
              interestedCount,
              votingOpen,
            }}
          />
        </section>
      </main>
    </div>
  );
}