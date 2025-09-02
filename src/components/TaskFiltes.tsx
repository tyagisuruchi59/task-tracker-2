"use client";

type Filter = "all" | "active" | "completed";

type Props = {
  filter: Filter;
  counts: { total: number; completed: number; active: number };
  searchQuery: string;
  onChange: (f: Filter) => void;
  onSearchChange: (q: string) => void;
};

export default function TaskFilter({
  filter,
  counts,
  searchQuery,
  onChange,
  onSearchChange,
}: Props) {
  const tabs: Array<{ key: Filter; label: string; count: number }> = [
    { key: "all", label: "All", count: counts.total },
    { key: "active", label: "Active", count: counts.active },
    { key: "completed", label: "Completed", count: counts.completed },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur shadow-sm p-4 md:p-5">
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        {/* Tabs */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          {tabs.map((t) => {
            const active = filter === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => onChange(t.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition
                ${active ? "bg-white shadow border border-slate-200 text-slate-900" : "text-slate-600 hover:text-slate-800"}`}
              >
                {t.label}
                <span className={`ml-2 inline-flex items-center justify-center text-xs rounded-full px-2 py-0.5
                ${active ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-slate-200/80 text-slate-700"}`}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative max-w-md w-full">
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-xl border border-slate-300 pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search tasks…"
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
