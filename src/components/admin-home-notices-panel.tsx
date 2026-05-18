'use client';

import { useActionState, useEffect, useRef } from "react";
import {
  createHomeNotice,
  deleteHomeNotice,
  updateHomeNotice,
  type AdminHomeNoticeActionState,
} from "@/app/actions/admin-home-notices";

type AdminHomeNotice = {
  id: number;
  title: string;
  message: string;
  level: string;
  isPublished: boolean;
  updatedAtLabel: string;
};

type AdminHomeNoticesPanelProps = {
  notices: AdminHomeNotice[];
};

const initialState: AdminHomeNoticeActionState = {
  status: "idle",
  message: "",
};

function NoticeFeedback({
  state,
  idleMessage,
}: {
  state: AdminHomeNoticeActionState;
  idleMessage: string;
}) {
  return (
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
      {state.message || idleMessage}
    </div>
  );
}

function CreateNoticeForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    createHomeNotice,
    initialState,
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-[1.9rem] border border-slate-200/80 bg-white/76 p-5 shadow-sm shadow-slate-900/5"
      noValidate
    >
      <div className="space-y-3">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
          Create notice
        </p>
        <h3 className="text-2xl font-black tracking-tight text-slate-950">
          Add a homepage announcement
        </h3>
      </div>

      <div className="mt-5 grid gap-4">
        <div className="space-y-2">
          <label
            htmlFor="new-notice-title"
            className="block text-sm font-bold text-slate-900"
          >
            Title
          </label>
          <input
            id="new-notice-title"
            name="title"
            type="text"
            maxLength={120}
            placeholder="Voting window"
            className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="new-notice-message"
            className="block text-sm font-bold text-slate-900"
          >
            Message
          </label>
          <textarea
            id="new-notice-message"
            name="message"
            maxLength={800}
            rows={4}
            placeholder="Voting will be open from 26 at 00:00 until 3 at 23:59 included."
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold leading-7 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="new-notice-level"
              className="block text-sm font-bold text-slate-900"
            >
              Type
            </label>
            <select
              id="new-notice-level"
              name="level"
              defaultValue="INFO"
              className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
            >
              <option value="INFO">Info</option>
              <option value="IMPORTANT">Important</option>
              <option value="WARNING">Warning</option>
            </select>
          </div>

          <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800">
            <input
              type="checkbox"
              name="isPublished"
              defaultChecked
              className="h-4 w-4 rounded border-slate-300"
            />
            Show on homepage
          </label>
        </div>

        <NoticeFeedback
          state={state}
          idleMessage="The notice will appear in the homepage panel when published."
        />

        <button
          type="submit"
          disabled={pending}
          className="premium-button-primary inline-flex h-12 items-center justify-center rounded-2xl px-6 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Creating..." : "Create notice"}
        </button>
      </div>
    </form>
  );
}

function EditNoticeForm({ notice }: { notice: AdminHomeNotice }) {
  const [state, formAction, pending] = useActionState(
    updateHomeNotice,
    initialState,
  );

  return (
    <details className="rounded-[1.7rem] border border-slate-200 bg-white/78 p-4">
      <summary className="cursor-pointer list-none text-sm font-black text-slate-950">
        Edit notice
      </summary>

      <form action={formAction} className="mt-4 space-y-4" noValidate>
        <input type="hidden" name="noticeId" value={notice.id} />

        <div className="space-y-2">
          <label
            htmlFor={`notice-title-${notice.id}`}
            className="block text-sm font-bold text-slate-900"
          >
            Title
          </label>
          <input
            id={`notice-title-${notice.id}`}
            name="title"
            type="text"
            defaultValue={notice.title}
            maxLength={120}
            className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor={`notice-message-${notice.id}`}
            className="block text-sm font-bold text-slate-900"
          >
            Message
          </label>
          <textarea
            id={`notice-message-${notice.id}`}
            name="message"
            defaultValue={notice.message}
            maxLength={800}
            rows={4}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold leading-7 text-slate-950 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor={`notice-level-${notice.id}`}
              className="block text-sm font-bold text-slate-900"
            >
              Type
            </label>
            <select
              id={`notice-level-${notice.id}`}
              name="level"
              defaultValue={notice.level}
              className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
            >
              <option value="INFO">Info</option>
              <option value="IMPORTANT">Important</option>
              <option value="WARNING">Warning</option>
            </select>
          </div>

          <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800">
            <input
              type="checkbox"
              name="isPublished"
              defaultChecked={notice.isPublished}
              className="h-4 w-4 rounded border-slate-300"
            />
            Show on homepage
          </label>
        </div>

        <NoticeFeedback
          state={state}
          idleMessage="Update the notice text, visibility or type."
        />

        <button
          type="submit"
          disabled={pending}
          className="premium-button-secondary inline-flex h-12 items-center justify-center rounded-2xl px-6 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save notice changes"}
        </button>
      </form>
    </details>
  );
}

function DeleteNoticeForm({ notice }: { notice: AdminHomeNotice }) {
  const [state, formAction, pending] = useActionState(
    deleteHomeNotice,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="noticeId" value={notice.id} />

      <NoticeFeedback
        state={state}
        idleMessage="Deleting a notice cannot be undone."
      />

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-5 text-sm font-black text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Deleting..." : "Delete notice"}
      </button>
    </form>
  );
}

function getNoticeTone(level: string): string {
  switch (level) {
    case "IMPORTANT":
      return "border-blue-200 bg-blue-50/90 text-blue-950";
    case "WARNING":
      return "border-amber-200 bg-amber-50/90 text-amber-950";
    default:
      return "border-slate-200 bg-slate-50/92 text-slate-950";
  }
}

export function AdminHomeNoticesPanel({
  notices,
}: AdminHomeNoticesPanelProps) {
  return (
    <section className="premium-surface-strong rounded-[2.2rem] p-5 sm:p-7 lg:p-8">
      <div className="space-y-3">
        <p className="premium-kicker">Homepage notices</p>
        <h2 className="text-3xl font-black tracking-[-0.045em] text-slate-950">
          Create and manage announcements.
        </h2>
        <p className="max-w-4xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
          Notices are linked to the active course edition and appear on the
          homepage when published.
        </p>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr] xl:items-start">
        <CreateNoticeForm />

        <div className="space-y-4">
          {notices.length === 0 ? (
            <div className="rounded-[1.9rem] border border-dashed border-slate-300 bg-white/70 p-6 text-sm font-semibold leading-7 text-slate-600">
              No homepage notices have been created for the active edition yet.
            </div>
          ) : (
            notices.map((notice) => (
              <article
                key={notice.id}
                className="rounded-[1.9rem] border border-slate-200 bg-white/72 p-5 shadow-sm shadow-slate-900/5"
              >
                <div
                  className={`rounded-[1.5rem] border p-4 ${getNoticeTone(
                    notice.level,
                  )}`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-white/75 px-3 py-1 text-xs font-black uppercase tracking-[0.16em]">
                      {notice.level}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        notice.isPublished
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {notice.isPublished ? "Published" : "Hidden"}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-black tracking-tight">
                    {notice.title}
                  </h3>

                  <p className="mt-3 whitespace-pre-line text-sm font-semibold leading-7">
                    {notice.message}
                  </p>
                </div>

                <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Last updated {notice.updatedAtLabel}
                </p>

                <div className="mt-4 grid gap-4">
                  <EditNoticeForm notice={notice} />
                  <DeleteNoticeForm notice={notice} />
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}