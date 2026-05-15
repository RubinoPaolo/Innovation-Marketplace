import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminClearGroupRequestHistoryPanel } from "@/components/admin-clear-group-request-history-panel";
import { prisma } from "@/lib/prisma";
import { getCurrentAdminSession } from "@/lib/admin-session";
import { getActiveCourseEdition } from "@/lib/active-edition";

function formatDate(date: Date): string {
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

function getRequestTitle(request: {
  requestType: string;
  requestedGroupName: string | null;
  group: {
    name: string;
  } | null;
}): string {
  if (request.requestType === "UPDATE_GROUP") {
    return `Update request · ${request.group?.name ?? "Group no longer available"}`;
  }

  return request.requestedGroupName ?? "Unnamed request";
}

function getRequestSummary(request: {
  requestType: string;
  requestedGroupName: string | null;
  group: {
    name: string;
  } | null;
  members: Array<{
    action: string;
  }>;
}): string {
  if (request.requestType === "UPDATE_GROUP") {
    const additions = request.members.filter((member) => member.action === "ADD").length;
    const removals = request.members.filter((member) => member.action === "REMOVE").length;
    const renameSummary = request.requestedGroupName
      ? `Rename requested: ${request.requestedGroupName}.`
      : "No rename requested.";

    return `${renameSummary} Additions: ${additions}. Removals: ${removals}.`;
  }

  return `${request.members.length} requested student IDs.`;
}

export default async function AdminGroupRequestsPage() {
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
            href="/admin"
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
          >
            Back to admin dashboard
          </Link>

          <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-rose-700">
              Configuration required
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
              No active course edition is configured
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-700">
              Group request review is only available when an active course edition exists.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const requests = await prisma.groupRequest.findMany({
    where: {
      editionId: activeEdition.id,
    },
    select: {
      id: true,
      requestType: true,
      requestedGroupName: true,
      status: true,
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
        },
      },
      members: {
        select: {
          id: true,
          studentNumber: true,
          action: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const pendingRequests = requests.filter((request) => request.status === "PENDING");
  const approvedRequests = requests.filter((request) => request.status === "APPROVED");
  const rejectedRequests = requests.filter((request) => request.status === "REJECTED");
  const reviewedRequests = [...approvedRequests, ...rejectedRequests].sort((firstRequest, secondRequest) => {
    const firstReviewedAt = firstRequest.reviewedAt?.getTime() ?? 0;
    const secondReviewedAt = secondRequest.reviewedAt?.getTime() ?? 0;

    return secondReviewedAt - firstReviewedAt;
  });

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-10 text-slate-950 sm:px-8 lg:px-12">
      <section className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-4">
          <Link
            href="/admin"
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
          >
            Back to admin dashboard
          </Link>

          <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">
            Admin · Group requests · {activeEdition.name}
          </p>
          <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Review group requests
          </h1>
          <p className="max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            Review requests for new groups and update requests submitted by groups that already exist in the active course edition.
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Total requests</p>
            <p className="mt-3 text-3xl font-black text-slate-950">{requests.length}</p>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Pending</p>
            <p className="mt-3 text-3xl font-black text-amber-700">{pendingRequests.length}</p>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Approved</p>
            <p className="mt-3 text-3xl font-black text-emerald-700">{approvedRequests.length}</p>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Rejected</p>
            <p className="mt-3 text-3xl font-black text-rose-700">{rejectedRequests.length}</p>
          </article>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-3">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
              Pending requests
            </p>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Requests awaiting admin review
            </h2>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm font-semibold leading-7 text-slate-600">
              No pending group requests at the moment.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {pendingRequests.map((request) => (
                <article
                  key={request.id}
                  className="grid gap-4 rounded-[2rem] border border-slate-200 bg-slate-50 p-5 lg:grid-cols-[1fr_auto] lg:items-center"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-2xl font-black tracking-tight text-slate-950">
                        {getRequestTitle(request)}
                      </h3>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${getRequestTypeClasses(request.requestType)}`}>
                        {getRequestTypeLabel(request.requestType)}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClasses(request.status)}`}>
                        {request.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
                      <span>{getRequestSummary(request)}</span>
                      <span>·</span>
                      <span>Submitted {formatDate(request.createdAt)}</span>
                      {request.requestedByMember ? (
                        <>
                          <span>·</span>
                          <span>Submitted by Student ID {request.requestedByMember.studentNumber}</span>
                        </>
                      ) : null}
                    </div>

                    {request.note ? (
                      <p className="max-w-3xl text-sm leading-7 text-slate-700">
                        Student note: {request.note}
                      </p>
                    ) : null}
                  </div>

                  <Link
                    href={`/admin/group-requests/${request.id}`}
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300"
                  >
                    Review request
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
                Reviewed requests
              </p>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                Approval and rejection history
              </h2>
              <p className="max-w-3xl text-sm leading-7 text-slate-600">
                This area stores reviewed create-group and update-group requests. The clear action removes only these reviewed request records.
              </p>
            </div>

            <AdminClearGroupRequestHistoryPanel
              reviewedRequestsCount={reviewedRequests.length}
            />
          </div>

          {reviewedRequests.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm font-semibold leading-7 text-slate-600">
              No reviewed group requests yet.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {reviewedRequests.map((request) => (
                <article
                  key={request.id}
                  className="grid gap-4 rounded-[2rem] border border-slate-200 bg-slate-50 p-5 lg:grid-cols-[1fr_auto] lg:items-center"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-black tracking-tight text-slate-950">
                        {getRequestTitle(request)}
                      </h3>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${getRequestTypeClasses(request.requestType)}`}>
                        {getRequestTypeLabel(request.requestType)}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClasses(request.status)}`}>
                        {request.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
                      <span>{getRequestSummary(request)}</span>
                      {request.reviewedAt ? (
                        <>
                          <span>·</span>
                          <span>Reviewed {formatDate(request.reviewedAt)}</span>
                        </>
                      ) : null}
                      {request.group ? (
                        <>
                          <span>·</span>
                          <span>Group: {request.group.name}</span>
                        </>
                      ) : null}
                    </div>

                    {request.adminNote ? (
                      <p className="max-w-3xl text-sm leading-7 text-slate-700">
                        Admin note: {request.adminNote}
                      </p>
                    ) : null}
                  </div>

                  <Link
                    href={`/admin/group-requests/${request.id}`}
                    className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
                  >
                    View details
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
