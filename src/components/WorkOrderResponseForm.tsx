"use client";

import { FormEvent, useState } from "react";

type View = "choose" | "accepting" | "declining" | "accepted" | "declined" | "error";

export default function WorkOrderResponseForm({ token }: { token: string }) {
  const [view, setView] = useState<View>("choose");
  const [name, setName] = useState("");
  const [agree, setAgree] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/work-order/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, signedByName: name, agree }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error ?? "Something went wrong.");
        setSubmitting(false);
        return;
      }
      setView("accepted");
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  async function handleDecline(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/work-order/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, reason }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error ?? "Something went wrong.");
        setSubmitting(false);
        return;
      }
      setView("declined");
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  if (view === "accepted") {
    return (
      <div className="border border-border bg-surface p-6">
        <p className="font-medium text-foreground">You&apos;re all set.</p>
        <p className="mt-2 text-sm text-foreground-muted">
          We&apos;ve recorded your acceptance and emailed you a copy of the signed work order. We&apos;ll
          be in touch to schedule the work.
        </p>
      </div>
    );
  }

  if (view === "declined") {
    return (
      <div className="border border-border bg-surface p-6">
        <p className="font-medium text-foreground">Got it, thanks for letting us know.</p>
        <p className="mt-2 text-sm text-foreground-muted">
          We&apos;ve let the office know you&apos;re not moving forward with this quote.
        </p>
      </div>
    );
  }

  if (view === "accepting") {
    return (
      <form onSubmit={handleAccept} className="border border-border bg-surface p-6">
        <p className="text-sm leading-relaxed text-foreground-muted">
          &ldquo;I have reviewed the details and price above and agree to them.&rdquo; Type your full
          name below to sign electronically.
        </p>
        <div className="mt-4">
          <label htmlFor="signedByName" className="mb-1.5 block text-sm font-medium text-foreground">
            Full name
          </label>
          <input
            id="signedByName"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-brand"
          />
        </div>
        <label className="mt-4 flex items-start gap-2.5 text-sm text-foreground">
          <input
            type="checkbox"
            required
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 h-4 w-4 border-border accent-brand"
          />
          <span>I agree to the details and price above, and I&apos;m electronically signing this work order.</span>
        </label>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-sm bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Accept and sign"}
          </button>
          <button
            type="button"
            onClick={() => setView("choose")}
            className="rounded-sm border-2 border-foreground px-5 py-2.5 text-sm font-medium text-foreground hover:border-brand hover:text-brand"
          >
            Back
          </button>
        </div>
      </form>
    );
  }

  if (view === "declining") {
    return (
      <form onSubmit={handleDecline} className="border border-border bg-surface p-6">
        <label htmlFor="reason" className="mb-1.5 block text-sm font-medium text-foreground">
          Mind telling us why? (optional)
        </label>
        <textarea
          id="reason"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-brand"
        />
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-sm border-2 border-foreground px-5 py-2.5 text-sm font-medium text-foreground hover:border-brand hover:text-brand disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Decline quote"}
          </button>
          <button
            type="button"
            onClick={() => setView("choose")}
            className="rounded-sm border-2 border-foreground px-5 py-2.5 text-sm font-medium text-foreground hover:border-brand hover:text-brand"
          >
            Back
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={() => setView("accepting")}
        className="rounded-sm bg-brand px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
      >
        Accept
      </button>
      <button
        type="button"
        onClick={() => setView("declining")}
        className="rounded-sm border-2 border-foreground px-6 py-3 text-sm font-medium text-foreground hover:border-brand hover:text-brand"
      >
        Decline
      </button>
    </div>
  );
}
