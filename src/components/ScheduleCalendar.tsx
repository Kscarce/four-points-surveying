"use client";

import { useMemo, useState } from "react";
import {
  scheduleWorkerOptions,
  type ScheduleEntry,
  type ScheduleEntryInput,
} from "@/lib/scheduleSchema";

const WORKER_DOT: Record<string, string> = {
  Matt: "bg-brand",
  Jon: "bg-amber-600",
  Jerrett: "bg-sky-600",
  Unassigned: "bg-foreground-muted",
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayKey(): string {
  return toDateKey(new Date());
}

// Builds a 42-cell (6 week) grid for the given month, padded with the
// trailing days of the previous month and leading days of the next so
// every week row is full, which is the usual month-calendar layout.
function buildMonthGrid(viewYear: number, viewMonth: number): Date[] {
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startOffset = firstOfMonth.getDay(); // 0 = Sunday
  const gridStart = new Date(viewYear, viewMonth, 1 - startOffset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

type FormState = ScheduleEntryInput;

const emptyForm = (date: string): FormState => ({
  date,
  time: "",
  job: "",
  worker: "Unassigned",
  location: "",
  notes: "",
});

export default function ScheduleCalendar({
  initialEntries,
}: {
  initialEntries: ScheduleEntry[];
}) {
  const [entries, setEntries] = useState(initialEntries);
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [workerFilter, setWorkerFilter] = useState<string>("All");

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(todayKey()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const visibleEntries = useMemo(
    () => (workerFilter === "All" ? entries : entries.filter((e) => e.worker === workerFilter)),
    [entries, workerFilter],
  );

  const entriesByDate = useMemo(() => {
    const map: Record<string, ScheduleEntry[]> = {};
    for (const entry of visibleEntries) {
      (map[entry.date] ??= []).push(entry);
    }
    for (const list of Object.values(map)) {
      list.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    }
    return map;
  }, [visibleEntries]);

  function goToMonth(delta: number) {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  function goToToday() {
    const d = new Date();
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setSelectedDate(todayKey());
  }

  function openAddForm(date: string) {
    setEditingId(null);
    setForm(emptyForm(date));
    setFormOpen(true);
    setError("");
  }

  function openEditForm(entry: ScheduleEntry) {
    setEditingId(entry.entryId);
    setForm({
      date: entry.date,
      time: entry.time,
      job: entry.job,
      worker: entry.worker,
      location: entry.location,
      notes: entry.notes,
    });
    setFormOpen(true);
    setError("");
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.job.trim()) {
      setError("Enter a job or customer name.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      if (editingId) {
        const res = await fetch(`/api/admin/schedule/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => null))?.error);
        setEntries((prev) =>
          prev.map((en) => (en.entryId === editingId ? { ...en, ...form } : en)),
        );
      } else {
        const res = await fetch("/api/admin/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result?.error);
        setEntries((prev) => [...prev, result.entry]);
      }
      setSelectedDate(form.date);
      closeForm();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entryId: string) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/schedule/${entryId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error);
      setEntries((prev) => prev.filter((en) => en.entryId !== entryId));
      closeForm();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Couldn't delete that job.");
    } finally {
      setSaving(false);
    }
  }

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const selectedEntries = entriesByDate[selectedDate] ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToMonth(-1)}
            className="border border-border px-2.5 py-1.5 text-sm text-foreground hover:border-brand"
            aria-label="Previous month"
          >
            &larr;
          </button>
          <p className="min-w-[10ch] text-center font-display text-lg font-semibold text-foreground">
            {monthLabel}
          </p>
          <button
            type="button"
            onClick={() => goToMonth(1)}
            className="border border-border px-2.5 py-1.5 text-sm text-foreground hover:border-brand"
            aria-label="Next month"
          >
            &rarr;
          </button>
          <button
            type="button"
            onClick={goToToday}
            className="ml-1 border border-border px-2.5 py-1.5 text-xs text-foreground-muted hover:border-brand"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="worker-filter" className="text-foreground-muted">
            Show
          </label>
          <select
            id="worker-filter"
            value={workerFilter}
            onChange={(e) => setWorkerFilter(e.target.value)}
            className="border border-border bg-background px-2 py-1.5 text-foreground focus:border-brand"
          >
            <option value="All">Everyone</option>
            {scheduleWorkerOptions.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-px overflow-hidden border border-border bg-border text-xs">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="bg-surface px-1.5 py-1.5 text-center font-medium text-foreground-muted">
            {label}
          </div>
        ))}
        {grid.map((date) => {
          const key = toDateKey(date);
          const inMonth = date.getMonth() === viewMonth;
          const dayEntries = entriesByDate[key] ?? [];
          const isSelected = key === selectedDate;
          const isToday = key === todayKey();
          return (
            <button
              type="button"
              key={key}
              onClick={() => setSelectedDate(key)}
              className={`min-h-[72px] bg-background p-1.5 text-left align-top transition-colors sm:min-h-[92px] ${
                inMonth ? "" : "opacity-40"
              } ${isSelected ? "ring-2 ring-inset ring-brand" : ""}`}
            >
              <span
                className={`inline-flex h-5 w-5 items-center justify-center text-[11px] ${
                  isToday ? "bg-brand font-semibold text-white" : "text-foreground"
                }`}
              >
                {date.getDate()}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayEntries.slice(0, 3).map((entry) => (
                  <div key={entry.entryId} className="flex items-center gap-1 truncate text-[11px] text-foreground-muted">
                    <span className={`h-1.5 w-1.5 shrink-0 ${WORKER_DOT[entry.worker] ?? "bg-foreground-muted"}`} />
                    <span className="truncate">{entry.job}</span>
                  </div>
                ))}
                {dayEntries.length > 3 && (
                  <p className="text-[11px] text-foreground-muted">+{dayEntries.length - 3} more</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 border border-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-base font-semibold text-foreground">
            {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h2>
          <button
            type="button"
            onClick={() => openAddForm(selectedDate)}
            className="rounded-sm bg-brand px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
          >
            + Add job
          </button>
        </div>

        {selectedEntries.length === 0 && !formOpen && (
          <p className="mt-3 text-sm text-foreground-muted">Nothing scheduled.</p>
        )}

        <ul className="mt-3 space-y-2">
          {selectedEntries.map((entry) => (
            <li key={entry.entryId} className="flex items-start justify-between gap-3 border border-border px-3 py-2">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <span className={`h-2 w-2 shrink-0 ${WORKER_DOT[entry.worker] ?? "bg-foreground-muted"}`} />
                  {entry.job}
                  {entry.time && <span className="font-normal text-foreground-muted">&middot; {entry.time}</span>}
                </p>
                <p className="text-xs text-foreground-muted">
                  {entry.worker}
                  {entry.location && ` · ${entry.location}`}
                </p>
                {entry.notes && <p className="mt-1 text-xs text-foreground-muted">{entry.notes}</p>}
              </div>
              <button
                type="button"
                onClick={() => openEditForm(entry)}
                className="shrink-0 text-xs text-brand underline underline-offset-2 hover:text-brand-dark"
              >
                Edit
              </button>
            </li>
          ))}
        </ul>

        {formOpen && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3 border-t border-border pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">Date</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:border-brand"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">Time (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 9:00 AM"
                  value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  className="w-full border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:border-brand"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Job / customer</label>
              <input
                type="text"
                required
                value={form.job}
                onChange={(e) => setForm((f) => ({ ...f, job: e.target.value }))}
                className="w-full border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:border-brand"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">Assigned to</label>
                <select
                  value={form.worker}
                  onChange={(e) => setForm((f) => ({ ...f, worker: e.target.value as FormState["worker"] }))}
                  className="w-full border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:border-brand"
                >
                  {scheduleWorkerOptions.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">Location (optional)</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  className="w-full border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:border-brand"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Notes (optional)</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:border-brand"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-sm bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 text-sm text-foreground-muted hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={() => handleDelete(editingId)}
                  disabled={saving}
                  className="text-sm text-red-600 underline underline-offset-2 hover:text-red-700 disabled:opacity-60"
                >
                  Delete job
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
