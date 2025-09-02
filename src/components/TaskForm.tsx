"use client";

import { useMemo, useState } from "react";
import { Task } from "@/types";
import { swal } from "@/lib/swal";

type Props = {
  onAdded: (task: Task) => void;
};

export default function TaskForm({ onAdded }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [completeTill, setCompleteTill] = useState<string>(""); // datetime-local
  const [submitting, setSubmitting] = useState(false);

  // local "now" for the min attribute (prevents past dates)
  const minLocalDT = useMemo(() => {
    const d = new Date();
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      await swal.fire({
        icon: "info",
        title: "Give it a title",
        text: "Task title is required.",
      });
      return;
    }

    // Convert datetime-local string -> ISO (if provided)
    let completeTillISO: string | undefined;
    if (completeTill) {
      const parsed = new Date(completeTill);
      if (Number.isNaN(parsed.getTime())) {
        await swal.fire({
          icon: "warning",
          title: "Invalid date",
          text: "Please choose a valid 'Complete till' date & time.",
        });
        return;
      }
      completeTillISO = parsed.toISOString();
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmed,
          description: description.trim() || undefined,
          completeTill: completeTillISO, // ✅ include deadline
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.data) {
        throw new Error(json?.error || "Failed to create task.");
      }

      onAdded(json.data as Task); // update UI immediately
      setTitle("");
      setDescription("");
      setCompleteTill("");

      await swal.fire({
        icon: "success",
        title: "Task added",
        timer: 1100,
        showConfirmButton: false,
      });
    } catch (err: any) {
      await swal.fire({
        icon: "error",
        title: "Couldn’t add task",
        text: err?.message || "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur shadow-sm p-5">
      <h2 className="text-lg font-semibold text-slate-800">Add Task</h2>
      <p className="text-sm text-slate-500 mb-4">
        Start strong — ship your best work today.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Draft onboarding email"
            disabled={submitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
            placeholder="Optional details…"
            disabled={submitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Complete till
          </label>
          <input
            type="datetime-local"
            value={completeTill}
            onChange={(e) => setCompleteTill(e.target.value)}
            min={minLocalDT}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            disabled={submitting}
          />
          <p className="text-xs text-slate-500 mt-1">
            Optional deadline. We’ll save it in your task as <code>completeTill</code>.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium px-4 py-2.5 shadow hover:opacity-95 disabled:opacity-60"
        >
          {submitting ? "Adding…" : "Add Task"}
        </button>
      </form>
    </div>
  );
}
