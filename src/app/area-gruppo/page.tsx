import Link from "next/link";
import { redirect } from "next/navigation";
import { GroupProductForm } from "@/components/group-product-form";
import { GroupProductWithdrawButton } from "@/components/group-product-withdraw-button";
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
    return "bg-emerald-100 text-emerald-800";
  }

  return "bg-amber-100 text-amber-800";
}

function getReviewedRequestStatusClasses(status: string): string {
  if (status === "APPROVED") {
    return "bg-emerald-100 text-emerald-800";
  }

  return "bg-rose-100 text-rose-800";
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
        priceCents: product.priceCents,
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
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:px-12">
        <section className="space-y-8">
          <div className="space-y-4">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">
              Group area · {activeEdition.name}
            </p>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  {currentSession.member.group.name}
                </h1>

                <p className="max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                  Manage your innovation draft, prepare media for publishing
                  and submit formal requests when your group data needs to
                  change.
                </p>
              </div>

              <Link
                href="/catalogo"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
              >
                Go to catalog
              </Link>
            </div>
          </div>

          <section className="grid gap-6 lg:grid-cols-[1fr_0.86fr] lg:items-start">
            <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="space-y-3">
                <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
                  Product workspace
                </p>
                <h2 className="text-2xl font-black tracking-tight text-slate-950">
                  Build the product profile
                </h2>
                <p className="text-sm leading-7 text-slate-600">
                  Save the core product information here. Images and final
                  publishing are managed from the dedicated media and
                  publishing page.
                </p>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-3xl bg-slate-100 p-5">
                  <p className="text-sm font-semibold text-slate-500">
                    Product status
                  </p>
                  <span
                    className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black ${getProductStatusClasses(
                      product?.status,
                    )}`}
                  >
                    {getProductStatusLabel(product?.status)}
                  </span>
                </div>

                <div className="rounded-3xl bg-slate-100 p-5">
                  <p className="text-sm font-semibold text-slate-500">
                    Saved images
                  </p>
                  <p className="mt-3 text-3xl font-black text-slate-950">
                    {product?.images.length ?? 0}
                  </p>
                </div>

                <div className="rounded-3xl bg-slate-100 p-5">
                  <p className="text-sm font-semibold text-slate-500">
                    Active members
                  </p>
                  <p className="mt-3 text-3xl font-black text-slate-950">
                    {activeMembers.length}
                  </p>
                </div>

                <div className="rounded-3xl bg-slate-100 p-5">
                  <p className="text-sm font-semibold text-slate-500">
                    Last saved
                  </p>
                  <p className="mt-3 text-sm font-black leading-6 text-slate-950">
                    {product?.updatedAt
                      ? formatDate(product.updatedAt)
                      : "Not saved yet"}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-start">
                <Link
                  href="/area-gruppo/media"
                  className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300 sm:w-auto"
                >
                  Manage images and publishing
                </Link>

                {product?.status === "PUBLISHED" ? (
                  <GroupProductWithdrawButton productTitle={product.title} />
                ) : null}
              </div>
            </article>

            <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="space-y-3">
                <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
                  Group roster
                </p>
                <h2 className="text-2xl font-black tracking-tight text-slate-950">
                  Active student IDs
                </h2>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {activeMembers.map((member) => (
                  <span
                    key={member.studentNumber}
                    className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-700"
                  >
                    {member.studentNumber}
                  </span>
                ))}
              </div>

              {pendingGroupUpdateRequest ? (
                <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-900">
                  <p className="font-black">Pending group update request</p>
                  <p className="mt-2 font-semibold">
                    Submitted {formatDate(pendingGroupUpdateRequest.createdAt)}
                    .
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
                <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold leading-7 text-emerald-900">
                  No pending group update request is currently waiting for
                  admin review.
                </div>
              )}

              {latestReviewedGroupUpdateRequest ? (
                <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-800">
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
                    <div className="mt-4 rounded-2xl bg-white p-4">
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