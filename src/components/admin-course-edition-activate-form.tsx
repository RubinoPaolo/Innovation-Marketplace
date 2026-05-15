'use client';

import { useActionState } from "react";
import {
  activateCourseEdition,
  type AdminCourseEditionActionState,
} from "@/app/actions/admin-course-editions";

type AdminCourseEditionActivateFormProps = {
  editionId: number;
  editionName: string;
  isActive: boolean;
};

const initialState: AdminCourseEditionActionState = {
  status: "idle",
  message: "",
};

export function AdminCourseEditionActivateForm({
  editionId,
  editionName,
  isActive,
}: AdminCourseEditionActivateFormProps) {
  const [state, formAction, pending] = useActionState(
    activateCourseEdition,
    initialState,
  );

  return (
    <div className="space-y-2">
      <form
        action={formAction}
        onSubmit={(event) => {
          if (isActive) {
            return;
          }

          const confirmed = window.confirm(
            `Activate ${editionName}? The current active edition will be deactivated and voting for the newly active edition will be closed.`,
          );

          if (!confirmed) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="editionId" value={editionId} />

        <button
          type="submit"
          disabled={pending || isActive}
          className={`inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 ${
            isActive
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50 focus-visible:ring-slate-200"
          }`}
        >
          {pending ? "Activating..." : isActive ? "Currently active" : "Activate edition"}
        </button>
      </form>

      {state.message ? (
        <p
          aria-live="polite"
          className={`max-w-xs text-xs font-semibold leading-5 ${
            state.status === "success"
              ? "text-emerald-700"
              : "text-rose-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
