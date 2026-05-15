'use client';

import { useActionState } from "react";
import {
  importGroupsFromExcel,
  type ImportGroupsFromExcelState,
} from "@/app/actions/import-groups-from-excel";

const initialState: ImportGroupsFromExcelState = {
  status: "idle",
  message: "",
};

export function AdminImportGroupsForm() {
  const [state, formAction, pending] = useActionState(
    importGroupsFromExcel,
    initialState,
  );

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="space-y-3">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
          Excel import
        </p>
        <h2 className="text-2xl font-black tracking-tight text-slate-950">
          Import groups and student IDs in bulk
        </h2>
        <p className="max-w-3xl text-sm leading-7 text-slate-600">
          Upload an Excel file with the columns “Group Name” and “Student IDs”.
          Blank group-name cells are treated as continuation rows for the group
          above.
        </p>
      </div>

      <div className="mt-5 rounded-3xl bg-slate-100 p-5 text-sm leading-7 text-slate-700">
        <p className="font-black text-slate-950">Expected example</p>
        <p className="mt-2">
          Group Name: Innovation Team · Student IDs: 123456
        </p>
        <p>Group Name: blank · Student IDs: 123457</p>
      </div>

      <form action={formAction} className="mt-6 space-y-5" noValidate>
        <div className="space-y-2">
          <label
            htmlFor="excelFile"
            className="block text-sm font-bold text-slate-900"
          >
            Excel file
          </label>
          <input
            id="excelFile"
            name="excelFile"
            type="file"
            accept=".xlsx,.xls"
            required
            className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200"
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
          {state.message ||
            "The import is all-or-nothing: if a conflict is found, nothing is created."}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          {pending ? "Importing..." : "Import from Excel"}
        </button>
      </form>
    </section>
  );
}