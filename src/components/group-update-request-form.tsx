'use client';

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  submitGroupUpdateRequest,
  type GroupUpdateRequestState,
} from "@/app/actions/submit-group-update-request";

type ActiveGroupMember = {
  studentNumber: string;
};

type GroupUpdateRequestFormProps = {
  currentGroupName: string;
  activeMembers: ActiveGroupMember[];
  hasPendingRequest: boolean;
};

export function GroupUpdateRequestForm({
  currentGroupName,
  activeMembers,
  hasPendingRequest,
}: GroupUpdateRequestFormProps) {
  const initialValues = useMemo<GroupUpdateRequestState["values"]>(
    () => ({
      requestedGroupName: currentGroupName,
      studentNumbersToAdd: "",
      studentNumbersToRemove: [],
      note: "",
    }),
    [currentGroupName],
  );

  const initialState: GroupUpdateRequestState = {
    status: "idle",
    message: "",
    values: initialValues,
  };

  const [state, formAction, pending] = useActionState(
    submitGroupUpdateRequest,
    initialState,
  );

  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    setValues(state.values);
  }, [state.values]);

  function toggleMemberRemoval(studentNumber: string, checked: boolean) {
    setValues((previousValues) => {
      const alreadySelected = previousValues.studentNumbersToRemove.includes(
        studentNumber,
      );

      if (checked && !alreadySelected) {
        return {
          ...previousValues,
          studentNumbersToRemove: [
            ...previousValues.studentNumbersToRemove,
            studentNumber,
          ],
        };
      }

      if (!checked && alreadySelected) {
        return {
          ...previousValues,
          studentNumbersToRemove:
            previousValues.studentNumbersToRemove.filter(
              (selectedStudentNumber) => selectedStudentNumber !== studentNumber,
            ),
        };
      }

      return previousValues;
    });
  }

  const formDisabled = hasPendingRequest || pending;

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="space-y-3">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
          Group update request
        </p>
        <h2 className="text-2xl font-black tracking-tight text-slate-950">
          Request changes to your group
        </h2>
        <p className="max-w-4xl text-sm leading-7 text-slate-600">
          Propose a new group name, ask to add student IDs or request the removal of current members. The changes are not applied immediately: the admin must review and approve them first.
        </p>
      </div>

      {hasPendingRequest ? (
        <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm font-bold leading-7 text-amber-900">
          Your group already has a pending update request. A new request can be submitted after the admin reviews the existing one.
        </div>
      ) : null}

      <form action={formAction} className="mt-6 space-y-7" noValidate>
        <div className="space-y-2">
          <label
            htmlFor="requestedGroupName"
            className="block text-sm font-bold text-slate-900"
          >
            Requested group name
          </label>
          <input
            id="requestedGroupName"
            name="requestedGroupName"
            type="text"
            value={values.requestedGroupName}
            disabled={formDisabled}
            onChange={(event) =>
              setValues((previousValues) => ({
                ...previousValues,
                requestedGroupName: event.target.value,
              }))
            }
            className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
          />
          <p className="text-xs font-semibold leading-5 text-slate-500">
            Leave the current name unchanged when you only need member changes.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="studentNumbersToAdd"
              className="block text-sm font-bold text-slate-900"
            >
              Student IDs to add
            </label>
            <textarea
              id="studentNumbersToAdd"
              name="studentNumbersToAdd"
              value={values.studentNumbersToAdd}
              disabled={formDisabled}
              onChange={(event) =>
                setValues((previousValues) => ({
                  ...previousValues,
                  studentNumbersToAdd: event.target.value,
                }))
              }
              placeholder={'Optional. Enter one or more student IDs.\nSeparate them with new lines, commas or semicolons.'}
              className="min-h-40 w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base leading-7 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>

          <fieldset className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <legend className="px-1 text-sm font-bold text-slate-900">
              Current student IDs to remove
            </legend>
            <p className="text-xs font-semibold leading-5 text-slate-500">
              Select only the active members that should be removed if the admin approves the request.
            </p>

            {activeMembers.length === 0 ? (
              <p className="rounded-2xl bg-white p-4 text-sm font-semibold text-slate-600">
                No active members are currently available for removal.
              </p>
            ) : (
              <div className="grid gap-3">
                {activeMembers.map((member) => {
                  const checked = values.studentNumbersToRemove.includes(
                    member.studentNumber,
                  );

                  return (
                    <label
                      key={member.studentNumber}
                      className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300 disabled:cursor-not-allowed"
                    >
                      <input
                        type="checkbox"
                        name="studentNumbersToRemove"
                        value={member.studentNumber}
                        checked={checked}
                        disabled={formDisabled}
                        onChange={(event) =>
                          toggleMemberRemoval(
                            member.studentNumber,
                            event.target.checked,
                          )
                        }
                        className="h-5 w-5 rounded border-slate-300 text-slate-950 focus:ring-slate-400"
                      />
                      <span className="text-sm font-bold text-slate-800">
                        {member.studentNumber}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </fieldset>
        </div>

        <div className="space-y-2">
          <label htmlFor="note" className="block text-sm font-bold text-slate-900">
            Optional note for the admin
          </label>
          <textarea
            id="note"
            name="note"
            value={values.note}
            disabled={formDisabled}
            onChange={(event) =>
              setValues((previousValues) => ({
                ...previousValues,
                note: event.target.value,
              }))
            }
            placeholder="Explain why the requested changes are needed, if useful."
            className="min-h-28 w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base leading-7 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
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
          {state.message || "Submit only changes that require admin review."}
        </div>

        <button
          type="submit"
          disabled={formDisabled}
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 sm:w-auto"
        >
          {pending ? "Submitting..." : "Submit group update request"}
        </button>
      </form>
    </section>
  );
}
