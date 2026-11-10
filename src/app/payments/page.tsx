import type { Metadata } from "next";
import Section from "@/components/Section";
import PayNowForm from "@/components/PayNowForm";
import { business, paymentMethods } from "@/lib/content";
import { isPaypalConfigured } from "@/lib/paypal";

export const metadata: Metadata = {
  title: "Payments",
  description: "How to pay for your survey: cash, check, or PayPal.",
};

export default function PaymentsPage() {
  return (
    <Section>
      <h1 className="font-display text-3xl font-semibold text-foreground">
        Payments
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground-muted">
        We currently accept the following payment methods.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {paymentMethods.map((method) => (
          <div key={method.name} className="border border-border p-6">
            <h2 className="font-display text-lg font-semibold text-foreground">
              {method.name}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
              {method.description}
            </p>
          </div>
        ))}
      </div>

      {isPaypalConfigured() && process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && (
        <div className="mt-10 max-w-md">
          <PayNowForm clientId={process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID} />
        </div>
      )}

      <p className="mt-8 text-sm text-foreground-muted">
        Questions about an invoice or payment? Contact {business.team[0].name}{" "}
        at {business.team[0].phone} or {business.team[0].email}.
      </p>
    </Section>
  );
}
