import Link from "next/link";
import Container from "./Container";
import { business, counties } from "@/lib/content";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <Container className="grid gap-10 py-12 sm:grid-cols-3">
        <div>
          <p className="font-display text-base font-semibold text-brand-dark">
            {business.shortName}
          </p>
          <p className="mt-2 max-w-xs text-sm text-foreground-muted">
            {business.licensedSurveyor}
            <br />
            {business.mailingAddress}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground">Contact</p>
          <ul className="mt-2 space-y-1 text-sm text-foreground-muted">
            {business.team.map((member) => (
              <li key={member.name}>
                {member.name}: {member.phone}
                {member.email && ` · ${member.email}`}
              </li>
            ))}
            <li className="pt-1">{business.hours}</li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground">Service area</p>
          <p className="mt-2 text-sm text-foreground-muted">
            {counties.join(", ")} Counties
          </p>
          <Link
            href="/property-records"
            className="mt-2 inline-block text-sm text-brand underline underline-offset-2 hover:text-brand-dark"
          >
            Look up your county property records
          </Link>
        </div>
      </Container>

      <div className="border-t border-border py-4">
        <Container className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-foreground-muted">
            {year} {business.name}. All rights reserved.
          </p>
          <Link
            href="/admin"
            className="text-xs text-foreground-muted underline underline-offset-2 hover:text-brand"
          >
            Staff login
          </Link>
        </Container>
      </div>
    </footer>
  );
}
