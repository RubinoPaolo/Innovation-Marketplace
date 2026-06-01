import Link from "next/link";
import { notFound } from "next/navigation";
import { FeatureRatingList } from "@/components/feature-rating-list";
import { ProductImageGallery } from "@/components/product-image-gallery";
import { ProductQuestionRatingList } from "@/components/product-question-rating-list";
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

function formatFeedbackDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
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

  if (!activeEdition) {
    notFound();
  }

  const isStudent = Boolean(currentSession);
  const currentMemberId = currentSession?.member.id ?? null;
  const currentGroupId = currentSession?.member.groupId ?? null;

  const { productId } = await params;
  const parsedProductId = Number(productId);

  if (!Number.isInteger(parsedProductId) || parsedProductId <= 0) {
    notFound();
  }

  const [
    product,
    totalGroups,
    votingSettings,
    existingInterest,
    evaluationQuestions,
  ] = await Promise.all([
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
            ratings: {
              select: {
                rating: true,
                memberId: true,
              },
            },
          },
          orderBy: {
            sortOrder: "asc",
          },
        },
        interests: {
          select: {
            id: true,
            decision: true,
            reason: true,
            createdAt: true,
          },
          orderBy: {
            updatedAt: "desc",
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

    prisma.votingSettings.findUnique({
      where: {
        editionId: activeEdition.id,
      },
      select: {
        isOpen: true,
      },
    }),

    currentSession
      ? prisma.purchaseInterest.findUnique({
          where: {
            productId_groupId: {
              productId: parsedProductId,
              groupId: currentSession.member.groupId,
            },
          },
          select: {
            decision: true,
            reason: true,
          },
        })
      : Promise.resolve(null),

    prisma.evaluationQuestion.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        prompt: true,
        ratings: {
          where: {
            productId: parsedProductId,
          },
          select: {
            rating: true,
            memberId: true,
          },
        },
      },
      orderBy: {
        sortOrder: "asc",
      },
    }),
  ]);

  if (!product) {
    notFound();
  }

  const isOwnProduct =
    currentGroupId !== null && product.groupId === currentGroupId;

  const yesCount = product.interests.filter(
    (interest) => interest.decision === "YES",
  ).length;

  const noCount = product.interests.filter(
    (interest) => interest.decision === "NO",
  ).length;

  const votingOpen = votingSettings?.isOpen ?? false;

  const existingDecision =
    existingInterest?.decision === "YES" ||
    existingInterest?.decision === "NO"
      ? existingInterest.decision
      : null;

  const featureRatings = product.features.map((feature) => {
    const ratingCount = feature.ratings.length;
    const averageRating =
      ratingCount > 0
        ? Number(
            (
              feature.ratings.reduce(
                (sum, rating) => sum + rating.rating,
                0,
              ) / ratingCount
            ).toFixed(1),
          )
        : null;

    const currentRating =
      currentMemberId !== null
        ? feature.ratings.find(
            (rating) => rating.memberId === currentMemberId,
          )?.rating ?? null
        : null;

    return {
      id: feature.id,
      text: feature.text,
      averageRating,
      ratingCount,
      currentRating,
    };
  });

  const productQuestionRatings = evaluationQuestions.map((question) => {
    const ratingCount = question.ratings.length;
    const averageRating =
      ratingCount > 0
        ? Number(
            (
              question.ratings.reduce(
                (sum, rating) => sum + rating.rating,
                0,
              ) / ratingCount
            ).toFixed(1),
          )
        : null;

    const currentRating =
      currentMemberId !== null
        ? question.ratings.find(
            (rating) => rating.memberId === currentMemberId,
          )?.rating ?? null
        : null;

    return {
      id: question.id,
      prompt: question.prompt,
      averageRating,
      ratingCount,
      currentRating,
    };
  });

  return (
    <div className="premium-page min-h-screen text-slate-950">
      <SiteHeader />

      <main className="premium-shell py-8 sm:py-10 lg:py-12">
        <div className="mb-6">
          <Link
            href="/catalogo"
            className="premium-button-secondary inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
          >
            Back to catalog
          </Link>
        </div>

        <section className="grid gap-8 xl:grid-cols-[minmax(0,1.02fr)_minmax(24rem,0.98fr)] xl:items-start">
          <ProductImageGallery
            images={product.images}
            productTitle={product.title}
          />

          <div className="space-y-6">
            <section className="premium-hero rounded-[2.4rem] px-5 py-6 sm:px-7 sm:py-8 lg:px-8 lg:py-9">
              <div className="relative z-10 space-y-5">
                <div className="flex flex-wrap gap-2">
                  {product.category ? (
                    <span className="premium-chip rounded-full px-3 py-1 text-xs font-black text-slate-700">
                      {product.category.name}
                    </span>
                  ) : null}

                  {product.badges.map((productBadge) => (
                    <span
                      key={`${product.id}-${productBadge.badgeId}`}
                      className="premium-chip rounded-full px-3 py-1 text-xs font-black text-slate-700"
                    >
                      {productBadge.badge.name}
                    </span>
                  ))}

                  {!isStudent ? (
                    <span className="premium-chip rounded-full px-3 py-1 text-xs font-black text-slate-700">
                      Public read-only view
                    </span>
                  ) : null}

                  {isOwnProduct ? (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-800">
                      Own product
                    </span>
                  ) : null}
                </div>

                <div className="space-y-4">
                  <p className="premium-kicker">
                    {activeEdition.name} · Group {product.group.name}
                  </p>

                  <h1 className="text-4xl font-black leading-[0.98] tracking-[-0.06em] text-slate-950 sm:text-5xl lg:text-6xl">
                    {product.title}
                  </h1>

                  <p className="text-3xl font-black tracking-tight text-slate-950">
                    {formatPrice(product.priceCents)}
                  </p>
                </div>

                {product.shortDescription ? (
                  <p className="text-base font-medium leading-8 text-slate-600">
                    {product.shortDescription}
                  </p>
                ) : null}
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
              <div className="premium-stat-card rounded-[1.8rem] p-5">
                <p className="relative z-10 text-sm font-bold text-slate-500">
                  Yes votes
                </p>
                <p className="relative z-10 mt-4 text-4xl font-black tracking-tight text-slate-950">
                  {yesCount}
                </p>
              </div>

              <div className="premium-stat-card rounded-[1.8rem] p-5">
                <p className="relative z-10 text-sm font-bold text-slate-500">
                  No votes
                </p>
                <p className="relative z-10 mt-4 text-4xl font-black tracking-tight text-slate-950">
                  {noCount}
                </p>
              </div>

              <div className="premium-stat-card rounded-[1.8rem] p-5">
                <p className="relative z-10 text-sm font-bold text-slate-500">
                  Positive group share
                </p>
                <p className="relative z-10 mt-4 text-4xl font-black tracking-tight text-slate-950">
                  {formatPercentage(yesCount, totalGroups)}
                </p>
              </div>
            </section>
          </div>
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.08fr)_minmax(23rem,0.92fr)] xl:items-start">
          <div className="space-y-6">
            {product.description ? (
              <section className="premium-surface-strong rounded-[2.2rem] p-5 sm:p-7 lg:p-8">
                <p className="premium-kicker">Product description</p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] text-slate-950">
                  Full product overview.
                </h2>
                <p className="mt-5 whitespace-pre-line text-base font-medium leading-8 text-slate-600">
                  {product.description}
                </p>
              </section>
            ) : null}

            {!isStudent ? (
              <section className="premium-surface-strong rounded-[2.2rem] p-5 sm:p-7 lg:p-8">
                <p className="premium-kicker">Public visitor mode</p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] text-slate-950">
                  You are viewing this product in read-only mode.
                </h2>
                <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
                  External visitors can inspect the catalog, product details,
                  images, feedback summaries and leaderboard. Voting, star
                  ratings and Group area tools are reserved for registered
                  students and groups.
                </p>
              </section>
            ) : null}

            {isOwnProduct ? (
              <section className="rounded-[2.2rem] border border-amber-200 bg-amber-50/90 p-5 text-amber-950 sm:p-7 lg:p-8">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-700">
                  Self-voting blocked
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.045em]">
                  Your group cannot evaluate its own product.
                </h2>
              </section>
            ) : null}

            <FeatureRatingList
              features={featureRatings}
              votingOpen={votingOpen && isStudent}
              isOwnProduct={isOwnProduct}
            />

            <ProductQuestionRatingList
              productId={product.id}
              questions={productQuestionRatings}
              votingOpen={votingOpen && isStudent}
              isOwnProduct={isOwnProduct}
            />
          </div>

          {isStudent ? (
            <PurchaseInterestPanel
              productId={product.id}
              totalGroups={totalGroups}
              isOwnProduct={isOwnProduct}
              initialState={{
                status: "idle",
                message: "",
                decision: existingDecision,
                reason: existingInterest?.reason ?? "",
                yesCount,
                noCount,
                votingOpen,
              }}
            />
          ) : (
            <section className="premium-surface-strong rounded-[2.2rem] p-5 sm:p-7 lg:p-8">
              <div className="space-y-3">
                <p className="premium-kicker">Public read-only access</p>
                <h2 className="text-3xl font-black tracking-[-0.045em] text-slate-950">
                  Voting is reserved for registered groups.
                </h2>
                <p className="max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
                  External visitors can browse the catalog, inspect product
                  pages and view the current voting status, but they cannot
                  submit Yes/No votes, star ratings or access the Group area.
                </p>
              </div>

              <div className="mt-6 rounded-[1.7rem] border border-slate-200 bg-white/78 p-5">
                <p className="text-sm font-black text-slate-500">
                  Current voting status
                </p>
                <p
                  className={`mt-2 text-3xl font-black tracking-tight ${
                    votingOpen ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {votingOpen ? "Open" : "Closed"}
                </p>
              </div>

              <Link
                href="/"
                className="premium-button-secondary mt-5 inline-flex h-12 items-center justify-center rounded-2xl px-6 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
              >
                Student sign-in
              </Link>
            </section>
          )}
        </section>

        <section className="premium-surface-strong mt-8 rounded-[2.2rem] p-5 sm:p-7 lg:p-8">
          <p className="premium-kicker">Group feedback</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] text-slate-950">
            What groups say about this product.
          </h2>
          <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
            Every response includes one shared Yes or No group decision. The
            explanation is optional, like a short review.
          </p>

          {product.interests.length === 0 ? (
            <div className="premium-muted mt-6 rounded-[1.7rem] p-6 text-sm font-semibold leading-7 text-slate-600">
              No group feedback has been submitted yet.
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {product.interests.map((interest, index) => (
                <article
                  key={interest.id}
                  className="premium-muted rounded-[1.7rem] p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black ${
                          interest.decision === "YES"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-rose-200 bg-rose-50 text-rose-800"
                        }`}
                      >
                        {interest.decision === "YES" ? "Yes" : "No"}
                      </span>
                      <span className="text-sm font-black text-slate-700">
                        Group feedback #{product.interests.length - index}
                      </span>
                    </div>

                    <time className="text-sm font-semibold text-slate-500">
                      {formatFeedbackDate(interest.createdAt)}
                    </time>
                  </div>

                  <p className="mt-4 text-sm font-medium leading-7 text-slate-700">
                    {interest.reason?.trim()
                      ? interest.reason
                      : "No written explanation was provided."}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}