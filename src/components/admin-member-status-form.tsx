'use client';

import { useActionState } from "react";
import {
  deleteGroupMember,
  toggleGroupMemberActive,
  type AdminGroupActionState,
} from "@/app/actions/admin-groups";

type AdminMemberStatusFormProps = {
  groupId: number;
  memberId: number;
  studentNumber: string;
  isActive: boolean;
};

const initialStatusState: AdminGroupActionState = {
  status: "idle",
  message: "",
};

const initialDeleteState: AdminGroupActionState = {
  status: "idle",
  message: "",
};

export function AdminMemberStatusForm({
  groupId,
  memberId,
  studentNumber,
  isActive,
}: AdminMemberStatusFormProps) {
  const [statusState, statusAction, statusPending] = useActionState(
    toggleGroupMemberActive,
    initialStatusState,
  );

  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteGroupMember,
    initialDeleteState,
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <form action={statusAction}>
          <input type="hidden" name="groupId" value={groupId} />
          <input type="hidden" name="memberId" value={memberId} />

          <button
            type="submit"
            disabled={statusPending || deletePending}
            className={`inline-flex h-10 w-full items-center justify-center rounded-full px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 sm:w-auto ${
              isActive
                ? "border border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300 hover:bg-amber-100 focus-visible:ring-amber-200"
                : "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100 focus-visible:ring-emerald-200"
            }`}
          >
            {statusPending
              ? "Updating..."
              : isActive
                ? "Deactivate"
                : "Reactivate"}
          </button>
        </form>

        <form
          action={deleteAction}
          onSubmit={(event) => {
            const confirmed = window.confirm(
              `Permanently delete Student ID ${studentNumber}? This action cannot be undone and will also remove all votes recorded by this student.`,
            );

            if (!confirmed) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="groupId" value={groupId} />
          <input type="hidden" name="memberId" value={memberId} />

          <button
            type="submit"
            disabled={deletePending || statusPending}
            className="inline-flex h-10 w-full items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 text-sm font-bold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 sm:w-auto"
          >
            {deletePending ? "Deleting..." : "Delete permanently"}
          </button>
        </form>
      </div>

      <p
        aria-live="polite"
        className={`max-w-[24rem] text-xs font-semibold leading-5 ${
          statusState.status === "success"
            ? "text-emerald-700"
            : statusState.status === "error"
              ? "text-rose-700"
              : "text-slate-500"
        }`}
      >
        {statusState.message || `Manage Student ID ${studentNumber}.`}
      </p>

      {deleteState.message ? (
        <p
          aria-live="polite"
          className={`max-w-[28rem] text-xs font-semibold leading-5 ${
            deleteState.status === "success"
              ? "text-emerald-700"
              : "text-rose-700"
          }`}
        >
          {deleteState.message}
        </p>
      ) : null}
    </div>
  );
}