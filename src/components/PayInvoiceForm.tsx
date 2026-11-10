"use client";

import { FormEvent, useState } from "react";

export default function PayInvoiceForm() {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/pay-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceNumber }),
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.error ?? "Something went wrong.");
        setSubmitting(false);
        return;
      }

      // Send them to PayPal's own hosted invoice page. Not resetting
      // submitting here on purpose, the button should stay disabled
      // while the browser navigates away.
      window.location.href = result.payUrl;
    } catch {
      setError("We couldn't reach the server. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border bg-surface p-6">
      <h2 className="font-display text-lg font-semibold text-foreground">Pay an invoice</h2>
      <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
        Enter the invoice number from your work order to pay online by credit card, PayPal, or
        Venmo.
      </p>
      <div className="mt-4">
        <label htmlFor="invoiceNumber" className="mb-1.5 block text-sm font-medium text-foreground">
          Invoice number
        </label>
        <input
          id="invoiceNumber"
          type="text"
          required
          value={invoiceNumber}
          onChange={(e) => setInvoiceNumber(e.target.value)}
          placeholder="e.g. 0001"
          className="w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-brand"
        />
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="mt-4 rounded-sm bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
      >
        {submitting ? "Looking up invoice..." : "Continue to pay"}
      </button>
    </form>
  );
}
