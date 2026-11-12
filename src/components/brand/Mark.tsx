import { cn } from '../../lib/utils';

/**
 * The Twigpine mark, "Pine": a stem, three tiers of branches that widen as
 * they come down, and a bud at the top. The tiers are branches off main; the
 * bud is the newest commit, so it is the one place the mark carries the
 * needle. Geometry is the same as twigpine.com's (web/src/components/brand).
 */
const VIEWBOX = 32;
const STEM = 'M16 29.5V9';
const TIERS = 'M10 15.5l6-5.5 6 5.5M8 21.5l8-6.5 8 6.5M6.5 27.5l9.5-7 9.5 7';
const BUD = { cx: 16, cy: 5.2, r: 3 };

export function Mark({
  size = 22,
  className,
  title,
}: {
  size?: number;
  className?: string;
  /** Decorative by default; pass a title to make it meaningful. */
  title?: string;
}) {
  const small = size < 24;
  return (
    <svg
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      width={size}
      height={size}
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={small ? 3 : 2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={STEM} />
        <path d={TIERS} />
      </g>
      <circle
        cx={BUD.cx}
        cy={BUD.cy}
        r={BUD.r}
        fill="var(--needle)"
        stroke="currentColor"
        strokeWidth={small ? 1.8 : 1.6}
      />
    </svg>
  );
}

/**
 * Mark + wordmark: lowercase "twigpine" in plain ink, then the product, dimmer.
 * The bud is the only colour in the lockup.
 */
export function Lockup({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-[9px] text-foreground', className)}>
      <Mark size={size} className="shrink-0" />
      <span className="text-[16px] font-[540] lowercase tracking-[-0.03em]">twigpine</span>
      <span className="text-[15px] text-subtle">/ explorer</span>
    </span>
  );
}
