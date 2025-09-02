"use client";

import { useState } from "react";
import { Task } from "@/types";

type Props = {
  tasks: Task[];
  loading: boolean;
  onMarkComplete: (id: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
};

export default function TaskList({ tasks, loading, onMarkComplete, onDelete }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);

  // Helpers
  const fmtDateTime = (d: Date) =>
    d.toLocaleString([], { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });

  const rel = (ms: number) => {
    const abs = Math.abs(ms);
    const d = Math.floor(abs / (24 * 60 * 60 * 1000));
    const h = Math.floor((abs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    if (d > 0) return `${d}d ${h}h`;
    const m = Math.floor((abs % (60 * 60 * 1000)) / (60 * 1000));
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const withBusy =
    (id: string, fn: () => void | Promise<void>) =>
    async () => {
      setBusyId(id);
      try {
        await Promise.resolve(fn());
      } finally {
        setBusyId((b) => (b === id ? null : b));
      }
    };

  if (loading) {
    return (
      <div className="grid gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl bg-white/80 border border-slate-200/60 p-4"
          >
            <div className="h-4 bg-slate-200 rounded w-2/3 mb-2" />
            <div className="h-3 bg-slate-100 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 backdrop-blur p-10 text-center text-slate-500">
        No tasks found. Try adding a new task or adjusting your filters.
      </div>
    );
  }

  const now = Date.now();

  return (
    <div className="grid gap-3">
      {tasks.map((t) => {
        const created = t.createdAt ? new Date(t.createdAt) : null;
        const dueAt = t.completeTill ? new Date(t.completeTill) : null;

        const overdue = !!dueAt && !t.done && dueAt.getTime() < now;
        const dueSoon =
          !!dueAt && !t.done && dueAt.getTime() - now <= 24 * 60 * 60 * 1000 && !overdue;

        const leftBar =
          t.done ? "before:bg-emerald-500"
          : overdue ? "before:bg-rose-500"
          : dueSoon ? "before:bg-amber-400"
          : "before:bg-slate-300";

        const isBusy = busyId === t.id;

        return (
          <div
            key={t.id}
            className={`relative rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur shadow-sm p-4 flex items-start justify-between gap-3
                        before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1.5 before:rounded-l-2xl ${leftBar}`}
          >
            {/* Left: content */}
            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className={`font-semibold truncate ${t.done ? "line-through text-slate-400" : "text-slate-800"}`}
                  title={t.title}
                >
                  {t.title}
                </h3>

                {/* Status / due chips */}
                {t.done ? (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2 py-0.5">
                    ✓ Completed
                  </span>
                ) : dueAt ? (
                  <>
                    {overdue ? (
                      <span className="inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs px-2 py-0.5">
                        Overdue by {rel(now - dueAt.getTime())}
                      </span>
                    ) : dueSoon ? (
                      <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs px-2 py-0.5">
                        Due soon ({rel(dueAt.getTime() - now)})
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-50 text-slate-700 border border-slate-200 text-xs px-2 py-0.5">
                        Due in {rel(dueAt.getTime() - now)}
                      </span>
                    )}
                  </>
                ) : null}
              </div>

              {t.description ? (
                <p
                  className={`text-sm mt-0.5 break-words ${
                    t.done ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  {t.description}
                </p>
              ) : null}

              <p className="text-xs text-slate-400 mt-1">
                {created
                  ? `Created ${fmtDateTime(created)}`
                  : "Created just now"}
                {dueAt ? ` • Complete till ${fmtDateTime(dueAt)}` : ""}
              </p>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2 shrink-0">
              {!t.done && (
                <button
                  onClick={withBusy(t.id, () => onMarkComplete(t.id))}
                  disabled={isBusy}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                >
                  {isBusy ? (
                    <span className="h-4 w-4 inline-block rounded-full border-2 border-current border-t-transparent animate-spin" />
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  Complete
                </button>
              )}
              <button
                onClick={withBusy(t.id, () => onDelete(t.id))}
                disabled={isBusy}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-rose-700 hover:bg-rose-100 disabled:opacity-60"
              >
                {isBusy ? (
                  <span className="h-4 w-4 inline-block rounded-full border-2 border-current border-t-transparent animate-spin" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 7h12M9 7v10m6-10v10M4 7h16l-1 12a2 2 0 01-2 2H7a2 2 0 01-2-2L4 7zM10 7V5a2 2 0 012-2h0a2 2 0 012 2v2"
                    />
                  </svg>
                )}
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
