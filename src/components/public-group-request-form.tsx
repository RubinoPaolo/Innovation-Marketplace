'use client';

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  submitPublicGroupRequest,
  type PublicGroupRequestState,
} from "@/app/actions/submit-public-group-request";

const emptyValues: PublicGroupRequestState["values"] = {
  groupName: "",
  studentNumbers: "",
  note: "",
};

const initialState: PublicGroupRequestState = {
  status: "idle",
  message: "",
  values: emptyValues,
};

export function PublicGroupRequestForm() {
  const [state, formAction, pending] = useActionState(
    submitPublicGroupRequest,
    initialState,
  );

  const initialValues = useMemo(() => state.values, [state.values]);
  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    setValues(state.values);
  }, [state.values]);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <div className="space-y-2">
        <label htmlFor="groupName" className="block text-sm font-bold text-slate-900">
          Proposed group name *
        </label>
        <input
          id="groupName"
          name="groupName"
          type="text"
          required
          value={values.groupName}
          onChange={(event) =>
            setValues((previousValues) => ({
              ...previousValues,
              groupName: event.target.value,
            }))
          }
          placeholder="Example: FutureLab"
          className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="studentNumbers"
          className="block text-sm font-bold text-slate-900"
        >
          Student IDs *
        </label>
        <textarea
          id="studentNumbers"
          name="studentNumbers"
          required
          value={values.studentNumbers}
          onChange={(event) =>
            setValues((previousValues) => ({
              ...previousValues,
              studentNumbers: event.target.value,
            }))
          }
          placeholder={'Enter one or more student IDs.\nYou can separate them with new lines, commas or semicolons.'}
          className="min-h-40 w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base leading-7 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="note" className="block text-sm font-bold text-slate-900">
          Optional note
        </label>
        <textarea
          id="note"
          name="note"
          value={values.note}
          onChange={(event) =>
            setValues((previousValues) => ({
              ...previousValues,
              note: event.target.value,
            }))
          }
          placeholder="Optional context for the admin review."
          className="min-h-28 w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base leading-7 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
        />
      </div>

      <div
        aria-live="polite"
        className={`min-h-6 text-sm font-bold ${
          state.status === "success"
            ? "text-emerald-700"
            : state.status === "error"
              ? "text-rose-700"
              : "text-slate-500"
        }`}
      >
        {state.message || "Submit the request. The admin will review it before any group is created."}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {pending ? "Submitting..." : "Submit group request"}
      </button>
    </form>
  );
}
