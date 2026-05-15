'use client';

import { useActionState } from "react";
import {
  approveCreateGroupRequest,
  rejectCreateGroupRequest,
  type AdminGroupRequestActionState,
} from "@/app/actions/admin-group-requests";

type AdminGroupRequestDecisionPanelProps = {
  requestId: number;
  status: string;
  existingAdminNote: string | null;
};

const initialApproveState: AdminGroupRequestActionState = {
  status: "idle",
  message: "",
};

const initialRejectState: AdminGroupRequestActionState = {
  status: "idle",
  message: "",
};

export function AdminGroupRequestDecisionPanel({
  requestId,
  status,
  existingAdminNote,
}: AdminGroupRequestDecisionPanelProps) {
  const [approveState, approveAction, approvePending] = useActionState(
    approveCreateGroupRequest,
    initialApproveState,
  );

  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectCreateGroupRequest,
    initialRejectState,
  );

  const requestAlreadyReviewed = status !== "PENDING";

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="space-y-3">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
          Final decision
        </p>
        <h2 className="text-2xl font-black tracking-tight text-slate-950">
          Approve or reject the request
        </h2>
        <p className="max-w-3xl text-sm leading-7 text-slate-600">
          Approval creates the group and its requested student IDs. Rejection keeps the request in the audit trail without creating any group.
        </p>
      </div>

      {requestAlreadyReviewed ? (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm font-bold leading-7 text-slate-700">
          This request has already been reviewed and can no longer be approved or rejected again.
        </div>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-semibold text-emerald-700">Approve request</p>
            <p className="mt-2 text-sm leading-7 text-emerald-900">
              Approving creates the group using the currently saved review data.
            </p>

            <form action={approveAction} className="mt-5 space-y-4">
              <input type="hidden" name="requestId" value={requestId} />

              <div
                aria-live="polite"
                className={`min-h-6 text-sm font-bold ${
                  approveState.status === "success"
                    ? "text-emerald-700"
                    : approveState.status === "error"
                      ? "text-rose-700"
                      : "text-emerald-800"
                }`}
              >
                {approveState.message || "No approval submitted yet."}
              </div>

              <button
                type="submit"
                disabled={approvePending || rejectPending}
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-emerald-700 px-6 text-sm font-bold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
              >
                {approvePending ? "Approving..." : "Approve and create group"}
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5">
            <p className="text-sm font-semibold text-rose-700">Reject request</p>
            <p className="mt-2 text-sm leading-7 text-rose-900">
              Optionally update the admin note while rejecting the request.
            </p>

            <form
              action={rejectAction}
              className="mt-5 space-y-4"
              onSubmit={(event) => {
                const confirmed = window.confirm(
                  "Reject this group request? The request will remain stored as rejected.",
                );

                if (!confirmed) {
                  event.preventDefault();
                }
              }}
            >
              <input type="hidden" name="requestId" value={requestId} />

              <div className="space-y-2">
                <label htmlFor="rejectionAdminNote" className="block text-sm font-bold text-rose-900">
                  Admin note
                </label>
                <textarea
                  id="rejectionAdminNote"
                  name="adminNote"
                  defaultValue={existingAdminNote ?? ""}
                  placeholder="Optional reason for rejection."
                  className="min-h-28 w-full resize-y rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm leading-7 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
                />
              </div>

              <div
                aria-live="polite"
                className={`min-h-6 text-sm font-bold ${
                  rejectState.status === "success"
                    ? "text-emerald-700"
                    : rejectState.status === "error"
                      ? "text-rose-700"
                      : "text-rose-800"
                }`}
              >
                {rejectState.message || "No rejection submitted yet."}
              </div>

              <button
                type="submit"
                disabled={approvePending || rejectPending}
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-rose-700 px-6 text-sm font-bold text-white transition hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
              >
                {rejectPending ? "Rejecting..." : "Reject request"}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
