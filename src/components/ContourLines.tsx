// A quiet topographic contour motif for the hero. Subject-grounded
// rather than decorative: contour/elevation lines are literally part
// of what a land surveyor produces (topo maps). Kept low-contrast so
// it reads as texture, not an illustration competing with the headline.
export default function ContourLines({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 800 420"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <path d="M-20 340 C 120 300, 180 380, 320 330 S 560 260, 700 310 S 860 260, 900 300"
        stroke="var(--brand-300)" strokeWidth="1.5" opacity="0.5" />
      <path d="M-20 300 C 100 260, 190 330, 300 290 S 540 220, 680 270 S 840 220, 900 260"
        stroke="var(--brand-300)" strokeWidth="1.5" opacity="0.45" />
      <path d="M-20 260 C 90 220, 200 280, 290 250 S 520 180, 660 230 S 820 190, 900 220"
        stroke="var(--brand-400)" strokeWidth="1.5" opacity="0.4" />
      <path d="M-20 220 C 80 185, 210 230, 280 210 S 500 145, 640 190 S 800 150, 900 180"
        stroke="var(--brand-400)" strokeWidth="1.5" opacity="0.35" />
      <path d="M-20 180 C 70 150, 220 185, 270 170 S 480 110, 620 150 S 780 110, 900 140"
        stroke="var(--brand-500)" strokeWidth="1.5" opacity="0.3" />
    </svg>
  );
}
