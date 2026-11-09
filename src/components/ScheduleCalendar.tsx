"use client";

import { useMemo, useState } from "react";
import {
  scheduleCountyOptions,
  scheduleWorkerOptions,
  type ScheduleEntry,
  type ScheduleEntryInput,
} from "@/lib/scheduleSchema";
import type { StoredQuoteRequest } from "@/lib/quoteSchema";

const MANUAL_JOB = "__manual__";

function jobLabel(quote: StoredQuoteRequest): string {
  return `${quote.name} — ${quote.propertyAddress}`;
}

// A county string from a quote request (free text from whoever filled
// the form in) doesn't always exactly match one of the fixed schedule
// county options, so only carry it over automatically when it does.
function matchCounty(raw: string): (typeof scheduleCountyOptions)[number] | "" {
  const match = scheduleCountyOptions.find(
    (c) => c.toLowerCase() === raw.trim().toLowerCase(),
  );
  return match ?? "";
}

// Jobs are color-coded by county on the calendar, since that's what the
// crew actually plans their day around. Guilford (where the business is
// based) gets the brand green; the rest are a spread of distinct hues so
// adjacent counties on the list don't read as near-identical at a glance.
const COUNTY_COLOR: Record<string, string> = {
  Alamance: "#DC2626",
  Caswell: "#EA580C",
  Davidson: "#CA8A04",
  Forsyth: "#65A30D",
  Guilford: "#1A5E3C",
  Randolph: "#0D9488",
  Rockingham: "#2563EB",
  Stokes: "#7C3AED",
  Other: "#DB2777",
};
const NO_COUNTY_COLOR = "#9CA3AF";

function countyColor(county: string): string {
  return COUNTY_COLOR[county] ?? NO_COUNTY_COLOR;
}

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
  county: "",
  worker: "Unassigned",
  location: "",
  notes: "",
});

export default function ScheduleCalendar({
  initialEntries,
  acceptedQuotes,
}: {
  initialEntries: ScheduleEntry[];
  acceptedQuotes: StoredQuoteRequest[];
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
  // Which quote the "Job / customer" dropdown has selected, or
  // MANUAL_JOB when typing the job name in by hand instead (the only
  // option when there are no accepted quotes yet).
  const [jobSelection, setJobSelection] = useState<string>(MANUAL_JOB);

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
    // Default to the dropdown when there's something to pick from.
    setJobSelection(MANUAL_JOB);
    setFormOpen(true);
    setError("");
  }

  function openEditForm(entry: ScheduleEntry) {
    setEditingId(entry.entryId);
    setForm({
      date: entry.date,
      time: entry.time,
      job: entry.job,
      county: entry.county as FormState["county"],
      worker: entry.worker as FormState["worker"],
      location: entry.location,
      notes: entry.notes,
    });
    // An existing entry isn't linked back to a specific quote, so edit
    // always starts in manual mode with the current text filled in.
    setJobSelection(MANUAL_JOB);
    setFormOpen(true);
    setError("");
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setError("");
  }

  function handleJobSelect(value: string) {
    setJobSelection(value);
    if (value === MANUAL_JOB) return;
    const quote = acceptedQuotes.find((q) => q.quoteId === value);
    if (!quote) return;
    setForm((f) => ({
      ...f,
      job: jobLabel(quote),
      location: quote.propertyAddress,
      county: matchCounty(quote.county ?? "") || f.county,
    }));
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

      <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-foreground-muted">
        {scheduleCountyOptions.map((county) => (
          <span key={county} className="flex items-center gap-1">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: countyColor(county) }}
            />
            {county}
          </span>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-7 gap-px overflow-hidden border border-border bg-border text-xs">
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
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: countyColor(entry.county) }}
                    />
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
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: countyColor(entry.county) }}
                  />
                  {entry.job}
                  {entry.time && <span className="font-normal text-foreground-muted">&middot; {entry.time}</span>}
                </p>
                <p className="text-xs text-foreground-muted">
                  {entry.worker}
                  {entry.county && ` · ${entry.county} County`}
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
              {acceptedQuotes.length > 0 ? (
                <>
                  <select
                    value={jobSelection}
                    onChange={(e) => handleJobSelect(e.target.value)}
                    className="w-full border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:border-brand"
                  >
                    <option value={MANUAL_JOB}>Type a job in manually&hellip;</option>
                    {acceptedQuotes.map((quote) => (
                      <option key={quote.quoteId} value={quote.quoteId}>
                        {jobLabel(quote)}
                      </option>
                    ))}
                  </select>
                  {jobSelection === MANUAL_JOB && (
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="Job or customer name"
                      value={form.job}
                      onChange={(e) => setForm((f) => ({ ...f, job: e.target.value }))}
                      className="mt-2 w-full border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:border-brand"
                    />
                  )}
                </>
              ) : (
                <input
                  type="text"
                  required
                  value={form.job}
                  onChange={(e) => setForm((f) => ({ ...f, job: e.target.value }))}
                  className="w-full border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:border-brand"
                />
              )}
              {acceptedQuotes.length === 0 && (
                <p className="mt-1 text-[11px] text-foreground-muted">
                  No accepted quotes yet to pick from &mdash; jobs show up here once a customer
                  accepts a work order.
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">County</label>
                <select
                  value={form.county}
                  onChange={(e) => setForm((f) => ({ ...f, county: e.target.value as FormState["county"] }))}
                  className="w-full border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:border-brand"
                >
                  <option value="">Unspecified</option>
                  {scheduleCountyOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
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
