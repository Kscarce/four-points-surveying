// Stand-in for the real example survey photo until the actual image
// file is supplied. A simple schematic plat sketch, not a fake photo,
// so it reads honestly as a placeholder rather than pretending to be
// a real survey.
export default function SurveyPlaceholder() {
  return (
    <div className="flex aspect-[4/3] w-full items-center justify-center border border-border bg-surface">
      <svg viewBox="0 0 400 300" className="h-4/5 w-4/5" aria-hidden="true">
        <rect x="60" y="40" width="280" height="190" fill="none" stroke="var(--brand-500)" strokeWidth="2" />
        <circle cx="60" cy="40" r="4" fill="var(--brand-600)" />
        <circle cx="340" cy="40" r="4" fill="var(--brand-600)" />
        <circle cx="340" cy="230" r="4" fill="var(--brand-600)" />
        <circle cx="60" cy="230" r="4" fill="var(--brand-600)" />
        <rect x="150" y="100" width="100" height="80" fill="none" stroke="var(--brand-400)" strokeWidth="1.5" strokeDasharray="4 3" />
        <text x="200" y="145" textAnchor="middle" fontSize="11" fill="var(--brand-700)">House</text>
        <text x="200" y="30" textAnchor="middle" fontSize="10" fill="var(--foreground-muted)">N 89&deg; E</text>
        <text x="352" y="138" fontSize="10" fill="var(--foreground-muted)">S 0&deg; E</text>
      </svg>
    </div>
  );
}
