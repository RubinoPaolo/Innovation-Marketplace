import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminGroupRequestDecisionPanel } from "@/components/admin-group-request-decision-panel";
import { AdminGroupRequestEditForm } from "@/components/admin-group-request-edit-form";
import { AdminGroupUpdateRequestDecisionPanel } from "@/components/admin-group-update-request-decision-panel";
import { AdminGroupUpdateRequestEditForm } from "@/components/admin-group-update-request-edit-form";
import { prisma } from "@/lib/prisma";
import { getCurrentAdminSession } from "@/lib/admin-session";
import { getActiveCourseEdition } from "@/lib/active-edition";

function formatDate(date: Date | null): string {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusClasses(status: string): string {
  if (status === "APPROVED") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (status === "REJECTED") {
    return "bg-rose-100 text-rose-800";
  }

  return "bg-amber-100 text-amber-800";
}

function getRequestTypeClasses(requestType: string): string {
  if (requestType === "UPDATE_GROUP") {
    return "bg-indigo-100 text-indigo-800";
  }

  return "bg-slate-200 text-slate-800";
}

function getRequestTypeLabel(requestType: string): string {
  return requestType === "UPDATE_GROUP" ? "UPDATE GROUP" : "CREATE GROUP";
}

type AdminGroupRequestDetailPageProps = {
  params: Promise<{
    requestId: string;
  }>;
};

export default async function AdminGroupRequestDetailPage({
  params,
}: AdminGroupRequestDetailPageProps) {
  const [adminSession, activeEdition] = await Promise.all([
    getCurrentAdminSession(),
    getActiveCourseEdition(),
  ]);

  if (!adminSession) {
    redirect("/admin");
  }

  if (!activeEdition) {
    return (
      <main className="min-h-screen bg-slate-100 px-5 py-10 text-slate-950 sm:px-8 lg:px-12">
        <section className="mx-auto max-w-5xl space-y-6">
          <Link
            href="/admin/group-requests"
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
          >
            Back to group requests
          </Link>

          <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-rose-700">
              Configuration required
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
              No active course edition is configured
            </h1>
          </div>
        </section>
      </main>
    );
  }

  const { requestId } = await params;
  const parsedRequestId = Number(requestId);

  if (!Number.isInteger(parsedRequestId) || parsedRequestId <= 0) {
    notFound();
  }

  const request = await prisma.groupRequest.findFirst({
    where: {
      id: parsedRequestId,
      editionId: activeEdition.id,
    },
    select: {
      id: true,
      requestType: true,
      status: true,
      requestedGroupName: true,
      note: true,
      adminNote: true,
      createdAt: true,
      reviewedAt: true,
      requestedByMember: {
        select: {
          studentNumber: true,
        },
      },
      group: {
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      },
      members: {
        select: {
          id: true,
          studentNumber: true,
          action: true,
        },
        orderBy: {
          studentNumber: "asc",
        },
      },
    },
  });

  if (!request) {
    notFound();
  }

  const requestIsPending = request.status === "PENDING";
  const isUpdateRequest = request.requestType === "UPDATE_GROUP";
  const additions = request.members.filter((member) => member.action === "ADD");
  const removals = request.members.filter((member) => member.action === "REMOVE");
  const createRequestMembers = request.members.filter(
    (member) => member.action === "ADD",
  );

  const pageTitle = isUpdateRequest
    ? `Update request · ${request.group?.name ?? "Group no longer available"}`
    : request.requestedGroupName ?? "Unnamed request";

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-10 text-slate-950 sm:px-8 lg:px-12">
      <section className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-4">
          <Link
            href="/admin/group-requests"
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
          >
            Back to group requests
          </Link>

          <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">
            Admin · Group request detail · {activeEdition.name}
          </p>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  {pageTitle}
                </h1>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${getRequestTypeClasses(request.requestType)}`}>
                  {getRequestTypeLabel(request.requestType)}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClasses(request.status)}`}>
                  {request.status}
                </span>
              </div>

              <p className="max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                {isUpdateRequest
                  ? "Review the requested changes for an existing group, adjust them if needed and decide whether to apply them."
                  : "Review the requested new group data, apply corrections when needed and complete the admin decision."}
              </p>
            </div>

            {request.group ? (
              <Link
                href={`/admin/groups/${request.group.id}`}
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
              >
                {isUpdateRequest ? "Open affected group" : "Open created group"}
              </Link>
            ) : null}
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Status</p>
            <p
              className={`mt-3 text-lg font-black ${
                request.status === "APPROVED"
                  ? "text-emerald-700"
                  : request.status === "REJECTED"
                    ? "text-rose-700"
                    : "text-amber-700"
              }`}
            >
              {request.status}
            </p>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Request type
            </p>
            <p className="mt-3 text-lg font-black text-slate-950">
              {getRequestTypeLabel(request.requestType)}
            </p>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Submitted</p>
            <p className="mt-3 text-sm font-black leading-7 text-slate-950">
              {formatDate(request.createdAt)}
            </p>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Reviewed</p>
            <p className="mt-3 text-sm font-black leading-7 text-slate-950">
              {formatDate(request.reviewedAt)}
            </p>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="space-y-3">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
                Original request context
              </p>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                Submitted information
              </h2>
            </div>

            <div className="mt-6 space-y-5">
              <div className="rounded-3xl bg-slate-100 p-5">
                <p className="text-sm font-semibold text-slate-500">Student note</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-800">
                  {request.note || "No student note provided."}
                </p>
              </div>

              {request.requestedByMember ? (
                <div className="rounded-3xl bg-slate-100 p-5">
                  <p className="text-sm font-semibold text-slate-500">
                    Submitted by
                  </p>
                  <p className="mt-2 text-sm font-black text-slate-950">
                    Student ID {request.requestedByMember.studentNumber}
                  </p>
                </div>
              ) : null}

              {isUpdateRequest ? (
                <>
                  <div className="rounded-3xl bg-slate-100 p-5">
                    <p className="text-sm font-semibold text-slate-500">
                      Affected group
                    </p>
                    <p className="mt-2 text-sm font-black text-slate-950">
                      {request.group?.name ?? "Group no longer available"}
                    </p>
                    {request.group ? (
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        Current status: {request.group.isActive ? "Active" : "Suspended"}
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-3xl bg-slate-100 p-5">
                    <p className="text-sm font-semibold text-slate-500">
                      Requested rename
                    </p>
                    <p className="mt-2 text-sm font-black text-slate-950">
                      {request.requestedGroupName || "No rename requested."}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl bg-slate-100 p-5">
                      <p className="text-sm font-semibold text-slate-500">
                        Student IDs to add
                      </p>
                      {additions.length === 0 ? (
                        <p className="mt-2 text-sm font-semibold text-slate-700">
                          None.
                        </p>
                      ) : (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {additions.map((member) => (
                            <span
                              key={member.id}
                              className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700"
                            >
                              {member.studentNumber}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-3xl bg-slate-100 p-5">
                      <p className="text-sm font-semibold text-slate-500">
                        Student IDs to remove
                      </p>
                      {removals.length === 0 ? (
                        <p className="mt-2 text-sm font-semibold text-slate-700">
                          None.
                        </p>
                      ) : (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {removals.map((member) => (
                            <span
                              key={member.id}
                              className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700"
                            >
                              {member.studentNumber}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-3xl bg-slate-100 p-5">
                  <p className="text-sm font-semibold text-slate-500">
                    Requested student IDs
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {createRequestMembers.map((member) => (
                      <span
                        key={member.id}
                        className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700"
                      >
                        {member.studentNumber}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-3xl bg-slate-100 p-5">
                <p className="text-sm font-semibold text-slate-500">
                  Current admin note
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-800">
                  {request.adminNote || "No admin note stored."}
                </p>
              </div>
            </div>
          </article>

          {isUpdateRequest ? (
            <AdminGroupUpdateRequestEditForm
              requestId={request.id}
              currentGroupName={request.group?.name ?? ""}
              requestedGroupName={request.requestedGroupName}
              studentNumbersToAdd={additions.map((member) => member.studentNumber)}
              studentNumbersToRemove={removals.map((member) => member.studentNumber)}
              adminNote={request.adminNote}
              disabled={!requestIsPending || !request.group}
            />
          ) : (
            <AdminGroupRequestEditForm
              requestId={request.id}
              requestedGroupName={request.requestedGroupName}
              studentNumbers={createRequestMembers.map((member) => member.studentNumber)}
              adminNote={request.adminNote}
              disabled={!requestIsPending}
            />
          )}
        </section>

        {isUpdateRequest ? (
          <AdminGroupUpdateRequestDecisionPanel
            requestId={request.id}
            status={request.status}
            existingAdminNote={request.adminNote}
          />
        ) : (
          <AdminGroupRequestDecisionPanel
            requestId={request.id}
            status={request.status}
            existingAdminNote={request.adminNote}
          />
        )}
      </section>
    </main>
  );
}
