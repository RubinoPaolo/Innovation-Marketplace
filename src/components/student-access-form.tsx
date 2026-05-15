'use client';

import { useActionState } from "react";
import { identifyStudent } from "@/app/actions/identify-student";

type GroupOption = {
  id: number;
  name: string;
};

type StudentAccessFormProps = {
  groups: GroupOption[];
};

const initialStudentAccessState = {
  message: "",
};

export function StudentAccessForm({ groups }: StudentAccessFormProps) {
  const [state, formAction, pending] = useActionState(
    identifyStudent,
    initialStudentAccessState,
  );

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div className="space-y-2">
        <label
          htmlFor="groupId"
          className="block text-sm font-semibold text-slate-900"
        >
          Group name
        </label>
        <select
          id="groupId"
          name="groupId"
          defaultValue=""
          required
          className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
        >
          <option value="">Select your group</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="studentNumber"
          className="block text-sm font-semibold text-slate-900"
        >
          Student ID
        </label>
        <input
          id="studentNumber"
          name="studentNumber"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="Enter your student ID"
          required
          className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
        />
      </div>

      <div
        aria-live="polite"
        className="min-h-6 text-sm font-medium text-rose-700"
      >
        {state.message}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center rounded-2xl bg-slate-950 px-5 text-base font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {pending ? "Checking..." : "Enter the platform"}
      </button>
    </form>
  );
}