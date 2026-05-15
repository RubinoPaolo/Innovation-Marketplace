'use client';

import { useActionState } from "react";
import {
  deleteGroup,
  toggleGroupActive,
  type AdminGroupActionState,
} from "@/app/actions/admin-groups";

type AdminGroupLifecyclePanelProps = {
  groupId: number;
  groupName: string;
  isActive: boolean;
};

const initialStatusState: AdminGroupActionState = {
  status: "idle",
  message: "",
};

export function AdminGroupLifecyclePanel({
  groupId,
  groupName,
  isActive,
}: AdminGroupLifecyclePanelProps) {
  const [statusState, statusAction, statusPending] = useActionState(
    toggleGroupActive,
    initialStatusState,
  );

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="space-y-3">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
          Group lifecycle
        </p>
        <h2 className="text-2xl font-black tracking-tight text-slate-950">
          Suspend or permanently delete this group
        </h2>
        <p className="max-w-3xl text-sm leading-7 text-slate-600">
          Suspension temporarily blocks access and hides the group from student-facing activity. Permanent deletion removes the group, its student IDs, linked product data and all purchase-interest votes recorded by its members.
        </p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-500">Current group status</p>
          <p
            className={`mt-2 text-2xl font-black ${
              isActive ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {isActive ? "Active" : "Suspended"}
          </p>

          <form action={statusAction} className="mt-5 space-y-4">
            <input type="hidden" name="groupId" value={groupId} />

            <div
              aria-live="polite"
              className={`min-h-6 text-sm font-bold ${
                statusState.status === "success"
                  ? "text-emerald-700"
                  : statusState.status === "error"
                    ? "text-rose-700"
                    : "text-slate-500"
              }`}
            >
              {statusState.message || "No group status change submitted yet."}
            </div>

            <button
              type="submit"
              disabled={statusPending}
              className={`inline-flex h-12 w-full items-center justify-center rounded-2xl px-6 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 ${
                isActive
                  ? "border border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300 hover:bg-amber-100 focus-visible:ring-amber-200"
                  : "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100 focus-visible:ring-emerald-200"
              }`}
            >
              {statusPending
                ? "Updating..."
                : isActive
                  ? "Suspend group"
                  : "Reactivate group"}
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5">
          <p className="text-sm font-semibold text-rose-700">Permanent deletion</p>
          <p className="mt-2 text-sm leading-7 text-rose-900">
            This action cannot be undone. It removes the group and all data that depends on its members, including their votes.
          </p>

          <form
            action={deleteGroup}
            className="mt-5"
            onSubmit={(event) => {
              const confirmed = window.confirm(
                `Permanently delete group ${groupName}? This action cannot be undone and will also remove its student IDs, linked product data and votes recorded by its members.`,
              );

              if (!confirmed) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="groupId" value={groupId} />
            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-rose-300 bg-rose-600 px-6 text-sm font-bold text-white transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200"
            >
              Delete group permanently
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
