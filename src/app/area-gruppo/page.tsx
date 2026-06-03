import Link from "next/link";
import { redirect } from "next/navigation";
import { GroupProductForm } from "@/components/group-product-form";
import { GroupUpdateRequestForm } from "@/components/group-update-request-form";
import { SiteHeader } from "@/components/site-header";
import { prisma } from "@/lib/prisma";
import { getCurrentStudentSession } from "@/lib/student-session";
import { getActiveCourseEdition } from "@/lib/active-edition";

function formatDate(date: Date | null | undefined): string {
  if (!date) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getProductStatusLabel(status: string | undefined): string {
  if (status === "PUBLISHED") {
    return "Published";
  }

  return "Draft";
}

function getProductStatusClasses(status: string | undefined): string {
  if (status === "PUBLISHED") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  return "border border-amber-200 bg-amber-50 text-amber-800";
}

function getReviewedRequestStatusClasses(status: string): string {
  if (status === "APPROVED") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  return "border border-rose-200 bg-rose-50 text-rose-800";
}

export default async function GroupAreaPage() {
  const [currentSession, activeEdition] = await Promise.all([
    getCurrentStudentSession(),
    getActiveCourseEdition(),
  ]);

  if (!currentSession || !activeEdition) {
    redirect("/");
  }

  const groupId = currentSession.member.group.id;

  const [
    categories,
    badges,
    product,
    activeMembers,
    pendingGroupUpdateRequest,
    latestReviewedGroupUpdateRequest,
  ] = await Promise.all([
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),

    prisma.badge.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),

    prisma.product.findUnique({
      where: {
        groupId,
      },
      select: {
        id: true,
        title: true,
        shortDescription: true,
        description: true,
        priceCents: true,
        categoryId: true,
        status: true,
        updatedAt: true,
        features: {
          select: {
            text: true,
          },
          orderBy: {
            sortOrder: "asc",
          },
        },
        badges: {
          select: {
            badgeId: true,
          },
        },
        images: {
          select: {
            id: true,
          },
        },
      },
    }),

    prisma.groupMember.findMany({
      where: {
        groupId,
        editionId: activeEdition.id,
        isActive: true,
      },
      select: {
        studentNumber: true,
      },
      orderBy: {
        studentNumber: "asc",
      },
    }),

    prisma.groupRequest.findFirst({
      where: {
        editionId: activeEdition.id,
        groupId,
        requestType: "UPDATE_GROUP",
        status: "PENDING",
      },
      select: {
        id: true,
        requestedGroupName: true,
        createdAt: true,
        members: {
          select: {
            studentNumber: true,
            action: true,
          },
          orderBy: {
            studentNumber: "asc",
          },
        },
      },
    }),

    prisma.groupRequest.findFirst({
      where: {
        editionId: activeEdition.id,
        groupId,
        requestType: "UPDATE_GROUP",
        status: {
          in: ["APPROVED", "REJECTED"],
        },
      },
      select: {
        id: true,
        status: true,
        requestedGroupName: true,
        createdAt: true,
        reviewedAt: true,
        adminNote: true,
        members: {
          select: {
            studentNumber: true,
            action: true,
          },
          orderBy: {
            studentNumber: "asc",
          },
        },
      },
      orderBy: {
        reviewedAt: "desc",
      },
    }),
  ]);

  const formProduct = product
    ? {
        title: product.title,
        shortDescription: product.shortDescription,
        description: product.description,
        priceCents: product.priceCents.toString(),
        categoryId: product.categoryId,
        features: product.features,
        badgeIds: product.badges.map((productBadge) => productBadge.badgeId),
      }
    : null;

  const pendingMembersToAdd =
    pendingGroupUpdateRequest?.members.filter(
      (member) => member.action === "ADD",
    ) ?? [];

  const pendingMembersToRemove =
    pendingGroupUpdateRequest?.members.filter(
      (member) => member.action === "REMOVE",
    ) ?? [];

  const reviewedMembersToAdd =
    latestReviewedGroupUpdateRequest?.members.filter(
      (member) => member.action === "ADD",
    ) ?? [];

  const reviewedMembersToRemove =
    latestReviewedGroupUpdateRequest?.members.filter(
      (member) => member.action === "REMOVE",
    ) ?? [];

  return (
    <div className="premium-page min-h-screen text-slate-950">
      <SiteHeader />

      <main className="premium-shell py-8 sm:py-10 lg:py-12">
        <section className="space-y-8">
          <div className="premium-hero rounded-[2.4rem] px-5 py-6 sm:px-7 sm:py-8 lg:px-8 lg:py-9">
            <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="premium-kicker">Group area</span>
                  <span className="premium-chip inline-flex items-center rounded-full px-4 py-2 text-sm font-bold text-slate-700">
                    {activeEdition.name}
                  </span>
                </div>

                <h1 className="text-4xl font-black leading-[0.98] tracking-[-0.06em] text-slate-950 sm:text-5xl lg:text-6xl">
                  {currentSession.member.group.name}
                </h1>

                <p className="max-w-3xl text-base font-medium leading-8 text-slate-600 sm:text-lg">
                  Manage your innovation proposal, prepare it for publication
                  and submit formal requests when your group data needs to
                  change.
                </p>
              </div>

              <Link
                href="/catalogo"
                className="premium-button-secondary inline-flex h-12 items-center justify-center rounded-2xl px-6 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
              >
                Go to catalog
              </Link>
            </div>
          </div>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.82fr)] xl:items-start">
            <article className="premium-surface-strong rounded-[2.2rem] p-5 sm:p-7 lg:p-8">
              <div className="space-y-3">
                <p className="premium-kicker">Product workspace</p>
                <h2 className="text-3xl font-black tracking-[-0.045em] text-slate-950">
                  Build the product profile.
                </h2>
                <p className="max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
                  Save the core product information here. Images and final
                  publishing are managed from the media page after the draft
                  exists.
                </p>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="premium-stat-card rounded-[1.7rem] p-5">
                  <p className="relative z-10 text-sm font-bold text-slate-500">
                    Product status
                  </p>
                  <span
                    className={`relative z-10 mt-4 inline-flex rounded-full px-3 py-1 text-xs font-black ${getProductStatusClasses(
                      product?.status,
                    )}`}
                  >
                    {getProductStatusLabel(product?.status)}
                  </span>
                </div>

                <div className="premium-stat-card rounded-[1.7rem] p-5">
                  <p className="relative z-10 text-sm font-bold text-slate-500">
                    Saved images
                  </p>
                  <p className="relative z-10 mt-4 text-4xl font-black tracking-tight text-slate-950">
                    {product?.images.length ?? 0}
                  </p>
                </div>

                <div className="premium-stat-card rounded-[1.7rem] p-5">
                  <p className="relative z-10 text-sm font-bold text-slate-500">
                    Active members
                  </p>
                  <p className="relative z-10 mt-4 text-4xl font-black tracking-tight text-slate-950">
                    {activeMembers.length}
                  </p>
                </div>

                <div className="premium-stat-card rounded-[1.7rem] p-5">
                  <p className="relative z-10 text-sm font-bold text-slate-500">
                    Last saved
                  </p>
                  <p className="relative z-10 mt-4 text-sm font-black leading-6 tracking-tight text-slate-950">
                    {product?.updatedAt
                      ? formatDate(product.updatedAt)
                      : "Not saved yet"}
                  </p>
                </div>
              </div>
            </article>

            <aside className="premium-surface rounded-[2.2rem] p-5 sm:p-7 lg:p-8">
              <div className="space-y-3">
                <p className="premium-kicker">Group roster</p>
                <h2 className="text-3xl font-black tracking-[-0.045em] text-slate-950">
                  Active student IDs.
                </h2>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {activeMembers.map((member) => (
                  <span
                    key={member.studentNumber}
                    className="premium-chip rounded-full px-3 py-1.5 text-sm font-black text-slate-700"
                  >
                    {member.studentNumber}
                  </span>
                ))}
              </div>

              {pendingGroupUpdateRequest ? (
                <div className="mt-6 rounded-[1.7rem] border border-amber-200 bg-amber-50/90 p-5 text-sm font-medium leading-7 text-amber-950">
                  <p className="font-black">Pending group update request</p>
                  <p className="mt-2 font-semibold">
                    Submitted {formatDate(pendingGroupUpdateRequest.createdAt)}.
                  </p>

                  {pendingGroupUpdateRequest.requestedGroupName ? (
                    <p className="mt-2">
                      Requested name:{" "}
                      <strong>
                        {pendingGroupUpdateRequest.requestedGroupName}
                      </strong>
                    </p>
                  ) : null}

                  {pendingMembersToAdd.length > 0 ? (
                    <p className="mt-2">
                      Add:{" "}
                      {pendingMembersToAdd
                        .map((member) => member.studentNumber)
                        .join(", ")}
                    </p>
                  ) : null}

                  {pendingMembersToRemove.length > 0 ? (
                    <p className="mt-2">
                      Remove:{" "}
                      {pendingMembersToRemove
                        .map((member) => member.studentNumber)
                        .join(", ")}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="mt-6 rounded-[1.7rem] border border-emerald-200 bg-emerald-50/90 p-5 text-sm font-semibold leading-7 text-emerald-950">
                  No pending group update request is currently waiting for admin
                  review.
                </div>
              )}

              {latestReviewedGroupUpdateRequest ? (
                <div className="mt-6 rounded-[1.7rem] border border-slate-200 bg-white/76 p-5 text-sm font-medium leading-7 text-slate-800 shadow-sm shadow-slate-900/5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black">
                      Latest reviewed group update request
                    </p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${getReviewedRequestStatusClasses(
                        latestReviewedGroupUpdateRequest.status,
                      )}`}
                    >
                      {latestReviewedGroupUpdateRequest.status}
                    </span>
                  </div>

                  <p className="mt-3 font-semibold text-slate-600">
                    Reviewed{" "}
                    {formatDate(latestReviewedGroupUpdateRequest.reviewedAt)}.
                  </p>

                  {latestReviewedGroupUpdateRequest.requestedGroupName ? (
                    <p className="mt-2">
                      Requested name:{" "}
                      <strong>
                        {latestReviewedGroupUpdateRequest.requestedGroupName}
                      </strong>
                    </p>
                  ) : null}

                  {reviewedMembersToAdd.length > 0 ? (
                    <p className="mt-2">
                      Requested additions:{" "}
                      {reviewedMembersToAdd
                        .map((member) => member.studentNumber)
                        .join(", ")}
                    </p>
                  ) : null}

                  {reviewedMembersToRemove.length > 0 ? (
                    <p className="mt-2">
                      Requested removals:{" "}
                      {reviewedMembersToRemove
                        .map((member) => member.studentNumber)
                        .join(", ")}
                    </p>
                  ) : null}

                  {latestReviewedGroupUpdateRequest.adminNote ? (
                    <div className="mt-4 rounded-[1.4rem] border border-slate-200/80 bg-white/90 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                        Admin note
                      </p>
                      <p className="mt-2 whitespace-pre-line font-semibold text-slate-800">
                        {latestReviewedGroupUpdateRequest.adminNote}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </aside>
          </section>

          <GroupProductForm
            categories={categories}
            badges={badges}
            product={formProduct}
            publishedProductTitle={
              product?.status === "PUBLISHED" ? product.title : null
            }
          />

          <GroupUpdateRequestForm
            currentGroupName={currentSession.member.group.name}
            activeMembers={activeMembers}
            hasPendingRequest={Boolean(pendingGroupUpdateRequest)}
          />
        </section>
      </main>
    </div>
  );
}