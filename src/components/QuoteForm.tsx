"use client";

import { FormEvent, useState } from "react";
import { surveyTypeOptions } from "@/lib/quoteSchema";
import { counties } from "@/lib/content";

type Status = "idle" | "submitting" | "success" | "error";

const fieldClass =
  "w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/60 focus:border-brand";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground";

export default function QuoteForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(result.error ?? "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong. Please check your connection and try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="border border-border bg-brand-tint p-6">
        <p className="font-display text-lg font-semibold text-brand-dark">
          Request sent
        </p>
        <p className="mt-2 text-sm text-brand-dark">
          Thanks, we&apos;ve got your request and will follow up soon. If
          it&apos;s urgent, feel free to call or text us directly.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 text-sm font-medium text-brand underline underline-offset-2"
        >
          Send another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Honeypot field, hidden from real users via CSS, not display:none
          (some bots skip hidden fields). */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>Name</label>
          <input id="name" name="name" type="text" required className={fieldClass} />
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>Phone</label>
          <input id="phone" name="phone" type="tel" required className={fieldClass} />
        </div>
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>Email</label>
        <input id="email" name="email" type="email" required className={fieldClass} />
      </div>

      <div>
        <label htmlFor="propertyAddress" className={labelClass}>Property address</label>
        <input id="propertyAddress" name="propertyAddress" type="text" required className={fieldClass} placeholder="Street address, city" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="county" className={labelClass}>County (if known)</label>
          <select id="county" name="county" defaultValue="" className={fieldClass}>
            <option value="">Not sure</option>
            {counties.map((county) => (
              <option key={county} value={county}>{county}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="surveyType" className={labelClass}>Type of survey</label>
          <select id="surveyType" name="surveyType" required defaultValue="" className={fieldClass}>
            <option value="" disabled>Select one</option>
            {surveyTypeOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="acreage" className={labelClass}>Approx. acreage (if known)</label>
          <input id="acreage" name="acreage" type="text" className={fieldClass} placeholder="e.g. 0.5 acres" />
        </div>
        <div>
          <label htmlFor="timeline" className={labelClass}>Timeline</label>
          <input id="timeline" name="timeline" type="text" className={fieldClass} placeholder="e.g. closing in 3 weeks" />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>Anything else we should know?</label>
        <textarea id="notes" name="notes" rows={4} className={fieldClass} />
      </div>

      {status === "error" && errorMessage && (
        <p role="alert" className="text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-sm bg-brand px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
      >
        {status === "submitting" ? "Sending..." : "Send quote request"}
      </button>
    </form>
  );
}
