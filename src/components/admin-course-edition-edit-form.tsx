'use client';

import { useActionState } from "react";
import {
  updateCourseEdition,
  type AdminCourseEditionActionState,
} from "@/app/actions/admin-course-editions";

type AdminCourseEditionEditFormProps = {
  editionId: number;
  initialName: string;
  initialAcademicYear: string;
};

const initialState: AdminCourseEditionActionState = {
  status: "idle",
  message: "",
};

export function AdminCourseEditionEditForm({
  editionId,
  initialName,
  initialAcademicYear,
}: AdminCourseEditionEditFormProps) {
  const [state, formAction, pending] = useActionState(
    updateCourseEdition,
    initialState,
  );

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="space-y-3">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
          Edit edition
        </p>
        <h2 className="text-2xl font-black tracking-tight text-slate-950">
          Update edition details
        </h2>
        <p className="max-w-3xl text-sm leading-7 text-slate-600">
          Change the edition name and academic year without affecting the linked
          groups, students, products or collected voting data.
        </p>
      </div>

      <form action={formAction} className="mt-6 space-y-5" noValidate>
        <input type="hidden" name="editionId" value={editionId} />

        <div className="space-y-2">
          <label
            htmlFor="edit-edition-name"
            className="block text-sm font-bold text-slate-900"
          >
            Edition name
          </label>
          <input
            id="edit-edition-name"
            name="name"
            type="text"
            required
            defaultValue={initialName}
            className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="edit-academic-year"
            className="block text-sm font-bold text-slate-900"
          >
            Academic year
          </label>
          <input
            id="edit-academic-year"
            name="academicYear"
            type="text"
            required
            defaultValue={initialAcademicYear}
            className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
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
          {state.message || "No changes saved yet."}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          {pending ? "Saving..." : "Save edition changes"}
        </button>
      </form>
    </section>
  );
}