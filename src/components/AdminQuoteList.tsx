"use client";

import { useState } from "react";
import type { StoredQuoteRequest } from "@/lib/quoteSchema";

type RowStatus = "idle" | "sending" | "sent" | "error";

export default function AdminQuoteList({
  initialQuotes,
}: {
  initialQuotes: StoredQuoteRequest[];
}) {
  const [quotes, setQuotes] = useState(initialQuotes);
  const [prices, setPrices] = useState<Record<string, string>>(
    Object.fromEntries(initialQuotes.map((q) => [q.quoteId, q.price || ""])),
  );
  const [rowStatus, setRowStatus] = useState<Record<string, RowStatus>>({});
  const [rowError, setRowError] = useState<Record<string, string>>({});

  async function handleSend(quoteId: string) {
    const price = (prices[quoteId] || "").trim();
    if (!price) {
      setRowError((prev) => ({ ...prev, [quoteId]: "Enter a price first." }));
      return;
    }

    setRowStatus((prev) => ({ ...prev, [quoteId]: "sending" }));
    setRowError((prev) => ({ ...prev, [quoteId]: "" }));

    try {
      const res = await fetch("/api/admin/send-work-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId, price }),
      });
      const result = await res.json();

      if (!res.ok) {
        setRowStatus((prev) => ({ ...prev, [quoteId]: "error" }));
        setRowError((prev) => ({ ...prev, [quoteId]: result.error ?? "Something went wrong." }));
        return;
      }

      setRowStatus((prev) => ({ ...prev, [quoteId]: "sent" }));
      if (result.warning) {
        setRowError((prev) => ({ ...prev, [quoteId]: result.warning }));
      }
      setQuotes((prev) =>
        prev.map((q) => (q.quoteId === quoteId ? { ...q, price, status: "Quoted" } : q)),
      );
    } catch {
      setRowStatus((prev) => ({ ...prev, [quoteId]: "error" }));
      setRowError((prev) => ({ ...prev, [quoteId]: "Something went wrong. Check your connection." }));
    }
  }

  if (quotes.length === 0) {
    return <p className="text-sm text-foreground-muted">No open quote requests right now.</p>;
  }

  return (
    <ul className="space-y-6">
      {quotes.map((quote) => {
        const status = rowStatus[quote.quoteId] ?? "idle";
        const alreadySent = quote.status === "Quoted" || status === "sent";
        return (
          <li key={quote.quoteId} className="border border-border p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">{quote.name}</p>
                <p className="text-sm text-foreground-muted">{quote.propertyAddress}</p>
                <p className="mt-1 text-sm text-foreground-muted">
                  {quote.surveyType}
                  {quote.wantsLineStakes && " + wood stakes along lines"}
                </p>
                <p className="mt-1 text-xs text-foreground-muted">
                  {quote.phone} &middot; {quote.email}
                </p>
                {quote.county && <p className="text-xs text-foreground-muted">{quote.county} County</p>}
                {quote.acreage && <p className="text-xs text-foreground-muted">~{quote.acreage} acres</p>}
                {quote.timeline && <p className="text-xs text-foreground-muted">Timeline: {quote.timeline}</p>}
                {quote.notes && (
                  <p className="mt-2 max-w-xl text-sm text-foreground-muted">&ldquo;{quote.notes}&rdquo;</p>
                )}
                <p className="mt-2 text-xs font-medium text-brand">Status: {quote.status}</p>
              </div>

              <div className="flex items-end gap-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">Price</label>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-foreground-muted">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={prices[quote.quoteId] ?? ""}
                      onChange={(e) =>
                        setPrices((prev) => ({ ...prev, [quote.quoteId]: e.target.value }))
                      }
                      className="w-28 border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:border-brand"
                      placeholder="650"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSend(quote.quoteId)}
                  disabled={status === "sending"}
                  className="rounded-sm bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
                >
                  {status === "sending" ? "Sending..." : alreadySent ? "Resend" : "Send work order"}
                </button>
              </div>
            </div>
            {rowError[quote.quoteId] && (
              <p className="mt-2 text-sm text-red-600">{rowError[quote.quoteId]}</p>
            )}
            {status === "sent" && !rowError[quote.quoteId] && (
              <p className="mt-2 text-sm text-brand">Sent to {quote.email}.</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
