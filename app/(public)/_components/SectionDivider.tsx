/** Recurring "contour line" motif used as a section divider — ties every
 * page back to the topographic placeholder art (see lib/placeholder-art.ts)
 * instead of a plain <hr>. */
export function SectionDivider({ seed = 0 }: { seed?: number }) {
  const amplitude = 6 + (seed % 3) * 2;
  const d = `M0 12 Q 60 ${12 - amplitude}, 120 12 T 240 12 T 360 12 T 480 12 T 600 12 T 720 12 T 840 12 T 960 12 T 1080 12 T 1200 12`;
  return (
    <svg viewBox="0 0 1200 24" preserveAspectRatio="none" className="h-4 w-full" aria-hidden>
      <path d={d} fill="none" stroke="var(--color-primary)" strokeOpacity={0.3} strokeWidth={1.5} />
    </svg>
  );
}
