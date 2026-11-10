"use client";

import { useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

type Stage = "form" | "checkout" | "success";

export default function PayNowForm({ clientId }: { clientId: string }) {
  const [amount, setAmount] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [stage, setStage] = useState<Stage>("form");
  const [error, setError] = useState<string | null>(null);

  function handleContinue(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setStage("checkout");
  }

  if (stage === "success") {
    return (
      <div className="border border-border bg-surface p-6">
        <p className="font-medium text-foreground">Payment received, thank you.</p>
        <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
          We&apos;ve recorded your payment for invoice {invoiceNumber}. A receipt was sent to the
          email on your PayPal or card account.
        </p>
      </div>
    );
  }

  if (stage === "checkout") {
    return (
      <div className="border border-border bg-surface p-6">
        <p className="text-sm text-foreground-muted">
          Paying <span className="font-medium text-foreground">${amount}</span> for invoice{" "}
          <span className="font-medium text-foreground">{invoiceNumber}</span>.
        </p>
        <div className="mt-4">
          <PayPalScriptProvider
            options={{
              clientId,
              currency: "USD",
              intent: "capture",
              components: "buttons",
              enableFunding: "venmo,card",
            }}
          >
            <PayPalButtons
              style={{ layout: "vertical" }}
              createOrder={async () => {
                setError(null);
                const res = await fetch("/api/paypal/create-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ amount, invoiceNumber }),
                });
                const result = await res.json();
                if (!res.ok) {
                  setError(result.error ?? "Something went wrong starting the payment.");
                  throw new Error(result.error ?? "create-order failed");
                }
                return result.orderId;
              }}
              onApprove={async (data) => {
                const res = await fetch("/api/paypal/capture-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ orderId: data.orderID }),
                });
                const result = await res.json();
                if (!res.ok) {
                  setError(result.error ?? "Something went wrong completing the payment.");
                  return;
                }
                setStage("success");
              }}
              onError={() => {
                setError("Something went wrong with PayPal. Please try again or contact us.");
              }}
              onCancel={() => {
                setError(null);
              }}
            />
          </PayPalScriptProvider>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={() => setStage("form")}
          className="mt-4 text-sm font-medium text-foreground-muted underline hover:text-brand"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleContinue} className="border border-border bg-surface p-6">
      <h2 className="font-display text-lg font-semibold text-foreground">Pay now</h2>
      <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
        Enter the amount and invoice number from your emailed invoice, then pay by card, PayPal,
        or Venmo.
      </p>
      <div className="mt-4">
        <label htmlFor="amount" className="mb-1.5 block text-sm font-medium text-foreground">
          Amount (USD)
        </label>
        <input
          id="amount"
          type="text"
          inputMode="decimal"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g. 450.00"
          className="w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-brand"
        />
      </div>
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
          placeholder="From your emailed invoice"
          className="w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-brand"
        />
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        className="mt-4 rounded-sm bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
      >
        Continue to pay
      </button>
    </form>
  );
}
