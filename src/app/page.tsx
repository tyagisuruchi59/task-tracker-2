"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Task } from "@/types";
import TaskForm from "@/components/TaskForm";
import TaskFilter from "@/components/TaskFilters";
import TaskList from "@/components/TaskList";
import { swal } from "@/lib/swal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, CheckCircle2, Circle, Plus } from "lucide-react";

type Filter = "all" | "active" | "completed";

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filter, setFilter] = useState<Filter>(
    (searchParams.get("filter") as Filter) || "active"
  );
  const [searchQuery, setSearchQuery] = useState<string>(
    searchParams.get("search") || ""
  );
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);

  // Keep URL in sync
  useEffect(() => {
    const params = new URLSearchParams();
    if (filter && filter !== "all") params.set("filter", filter);
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }, [filter, searchQuery, router]);

  // Fetch tasks (server may filter; we still guard client-side)
  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      try {
        const qs = new URLSearchParams();
        qs.set("filter", filter);
        if (searchQuery.trim()) qs.set("search", searchQuery.trim());
        const res = await fetch(`/api/tasks?${qs.toString()}`, { method: "GET" });
        const json = await res.json();

        if (ignore) return;

        if (!res.ok) {
          await swal.fire({
            icon: "error",
            title: "Error",
            text: json?.error || "Failed to load tasks.",
          });
          setTasks([]);
        } else {
          setTasks((json.data as Task[]) || []);
        }
      } catch {
        if (!ignore) {
          await swal.fire({
            icon: "error",
            title: "Network Error",
            text: "Please try again.",
          });
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [filter, searchQuery]);

  // Quick stats
  const counts = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.done).length;
    const active = total - completed;
    return { total, completed, active };
  }, [tasks]);

  // Client-side filter + search safety net (works even if API returns all)
  const visibleTasks = useMemo(() => {
    let list = [...tasks];

    // Filter
    if (filter === "active") list = list.filter((t) => !t.done);
    if (filter === "completed") list = list.filter((t) => t.done);

    // Search
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description?.toLowerCase() ?? "").includes(q)
      );
    }

    // Sort newest first when "all"; (nice UX to keep this order everywhere)
    const ts = (d?: string | null) => (d ? new Date(d).getTime() : 0);
    if (filter === "all") {
      list.sort((a, b) => ts(b.createdAt) - ts(a.createdAt));
    }

    return list;
  }, [tasks, filter, searchQuery]);

  // Progress
  const completionPercentage =
    counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;
  const circumference = 2 * Math.PI * 45;
  const progressLen = (completionPercentage / 100) * circumference;

  // Stats modal
  async function openStatsDialog() {
    const html = `
      <div style="display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));margin-top:8px;">
        <div style="border-radius:16px;padding:24px;background:linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%);border:1px solid #e2e8f0;text-align:center;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
          <div style="font-size:14px;color:#64748b;font-weight:500;margin-bottom:8px;">Total Tasks</div>
          <div style="font-size:36px;font-weight:800;color:#0f172a;margin-bottom:4px;">${counts.total}</div>
          <div style="font-size:12px;color:#94a3b8;">All time</div>
        </div>
        <div style="border-radius:16px;padding:24px;background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%);border:1px solid #bfdbfe;text-align:center;box-shadow:0 4px 6px -1px rgba(59,130,246,0.1);">
          <div style="font-size:14px;color:#3b82f6;font-weight:500;margin-bottom:8px;">Active Tasks</div>
          <div style="font-size:36px;font-weight:800;color:#1e40af;margin-bottom:4px;">${counts.active}</div>
          <div style="font-size:12px;color:#60a5fa;">In progress</div>
        </div>
        <div style="border-radius:16px;padding:24px;background:linear-gradient(135deg,#ecfdf5 0%,#d1fae5 100%);border:1px solid #a7f3d0;text-align:center;box-shadow:0 4px 6px -1px rgba(16,185,129,0.1);">
          <div style="font-size:14px;color:#10b981;font-weight:500;margin-bottom:8px;">Completed</div>
          <div style="font-size:36px;font-weight:800;color:#047857;margin-bottom:4px;">${counts.completed}</div>
          <div style="font-size:12px;color:#34d399;">Finished</div>
        </div>
      </div>
      <div style="margin-top:24px;padding:20px;border-radius:12px;background:linear-gradient(135deg,#fefce8 0%,#fef3c7 100%);border:1px solid #fde68a;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <div style="width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#d97706);display:flex;align-items:center;justify-content:center;">
            <svg style="width:12px;height:12px;color:white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <span style="font-weight:600;color:#92400e;">Productivity Insight</span>
        </div>
        <p style="color:#a16207;font-size:14px;line-height:1.5;">
          ${counts.completed > 0 
            ? `Great work! You've completed ${completionPercentage}% of your tasks. ${counts.active > 0 ? `Keep the momentum going with ${counts.active} remaining tasks.` : 'All tasks completed! 🎉'}`
            : 'Ready to start your productive day? Add your first task above!'}
        </p>
      </div>
    `;
    await swal.fire({
      title: "<strong>📊 Task Analytics</strong>",
      html,
      confirmButtonText: "Got it",
      confirmButtonColor: "#3b82f6",
      width: "600px",
      padding: "2rem",
      background: "#ffffff",
      customClass: {
        popup: 'rounded-2xl shadow-2xl',
        title: 'text-xl font-bold text-slate-800',
        confirmButton: 'rounded-xl px-6 py-3 font-semibold'
      }
    });
  }

  // Add (from TaskForm)
  function handleAdded(task: Task) {
    setTasks((prev) => [task, ...prev]);
    if (filter === "completed") setFilter("all");
    setShowForm(false);
    swal.fire({
      icon: "success",
      title: "✨ Task created successfully!",
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
      customClass: {
        popup: 'rounded-xl'
      }
    });
  }

  // Mark complete with SweetAlert (confirm + loader)
  async function handleMarkComplete(id: string) {
    const target = tasks.find((t) => t.id === id);
    if (!target || target.done) return;

    const result = await swal.fire({
      title: "🎉 Mark as completed?",
      text: "You can still find it under the Completed tab.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, complete it!",
      cancelButtonText: "Not yet",
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !swal.isLoading(),
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-xl px-6 py-3 font-semibold',
        cancelButton: 'rounded-xl px-6 py-3 font-semibold'
      },
      preConfirm: async () => {
        const res = await fetch(`/api/tasks/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ done: true }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || "Failed to mark as completed.");
        return true;
      },
    });

    if (result.isConfirmed) {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: true } : t)));
      await swal.fire({
        icon: "success",
        title: "🎉 Task completed!",
        text: "Nice work! Keep it up!",
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
        customClass: {
          popup: 'rounded-xl'
        }
      });
    }
  }

  // Delete with SweetAlert (confirm + loader)
  async function handleDelete(id: string) {
    const result = await swal.fire({
      title: "🗑️ Delete this task?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Keep it",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !swal.isLoading(),
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-xl px-6 py-3 font-semibold',
        cancelButton: 'rounded-xl px-6 py-3 font-semibold'
      },
      preConfirm: async () => {
        const res = await fetch(`/api/tasks/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ delete: true }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || "Failed to delete task.");
        return true;
      },
    });

    if (result.isConfirmed) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      await swal.fire({
        icon: "success",
        title: "Task deleted",
        timer: 1200,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
        customClass: {
          popup: 'rounded-xl'
        }
      });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100   relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5NGE3YjgiIGZpbGwtb3BhY2l0eT0iMC4wNCIgPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjIiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
      
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  TaskFlow Pro
                </h1>
                <p className="text-xs text-slate-500 -mt-1">Smart productivity</p>
              </div>
            </div>

            {/* Navigation Stats & Actions */}
            <div className="flex items-center gap-3">
              {/* Progress Ring */}
              <div className="hidden sm:flex items-center gap-3">
                <div className="relative">
                  <svg className="w-12 h-12 -rotate-90 transform" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="6"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="url(#progressGradient)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${progressLen} ${circumference}`}
                      className="transition-all duration-700 ease-out"
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="50%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-slate-700">
                      {completionPercentage}%
                    </span>
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700 border-slate-200">
                    <Circle className="w-3 h-3 mr-1 text-blue-500" />
                    {counts.active}
                  </Badge>
                  <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" />
                    {counts.completed}
                  </Badge>
                </div>
              </div>

              {/* Stats Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={openStatsDialog}
                className="hidden md:flex items-center gap-2 bg-white/50 border-white/50 hover:bg-white/80 transition-all duration-200"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </Button>

              {/* Mobile Add Button */}
              <Button
                onClick={() => setShowForm(!showForm)}
                size="sm"
                className="md:hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Hero Section */}
          <section className="text-center space-y-4">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                  Ship your best work
                </span>
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Create, organize, and complete tasks with a beautiful interface designed for productivity
              </p>
            </div>
            
            {/* Key Metrics */}
            <div className="flex items-center justify-center gap-6 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-800">{counts.total}</div>
                <div className="text-sm text-slate-500">Total Tasks</div>
              </div>
              <div className="w-px h-12 bg-slate-200" />
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{counts.active}</div>
                <div className="text-sm text-slate-500">Active</div>
              </div>
              <div className="w-px h-12 bg-slate-200" />
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{counts.completed}</div>
                <div className="text-sm text-slate-500">Completed</div>
              </div>
            </div>
          </section>

          {/* Task Management Interface */}
          <div className="grid gap-6 lg:gap-8">
            {/* Form Section */}
            <div className={`transition-all duration-300 ${showForm ? 'block' : 'hidden md:block'}`}>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl shadow-slate-200/50 p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800">Create New Task</h3>
                    <p className="text-sm text-slate-500 mt-1">Add a new task to your workflow</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowForm(false)}
                    className="md:hidden text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </Button>
                </div>
                <TaskForm onAdded={handleAdded} />
              </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-lg p-6">
              <TaskFilter
                filter={filter}
                counts={counts}
                searchQuery={searchQuery}
                onChange={setFilter}
                onSearchChange={setSearchQuery}
              />
            </div>

            {/* Task List Section */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-slate-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl text-bold font-semibold text-black-800 ">
                      {filter === "all" && "All Tasks"}
                      {filter === "active" && "Active Tasks"}
                      {filter === "completed" && "Completed Tasks"}
                    </h3>
                    <p className="text-sm text-black-500 mt-1">
                      {visibleTasks.length} {visibleTasks.length === 1 ? 'task' : 'tasks'}
                      {searchQuery && ` matching "${searchQuery}"`}
                    </p>
                  </div>
                </div>
              </div>
              
              <TaskList
                tasks={visibleTasks}
                loading={loading}
                onMarkComplete={handleMarkComplete}
                onDelete={handleDelete}
              />
            </div>
          </div>

          {/* Footer Stats for Mobile */}
          <div className="md:hidden bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-6">
            <button
              onClick={openStatsDialog}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 hover:shadow-md transition-all duration-200"
            >
              <span className="font-medium text-slate-700">View Analytics</span>
              <BarChart3 className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}