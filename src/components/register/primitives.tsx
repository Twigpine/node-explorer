import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

/**
 * Shared layout primitives, in Canopy.
 *
 * A ledger is ruled, not boxed: regions are separated by hairlines and
 * whitespace, corners are square, and nothing floats. Headings are Geist in
 * sentence case; anything a machine emitted is Geist Mono.
 */

/**
 * A bordered container. Use sparingly — it is not the default.
 *
 * A list of rows does not need one: hairline separators between rows already
 * group them, and adding an outer border on top turns the region into a panel
 * dropped on the page. Reserve this for content that genuinely needs to be
 * lifted off the ground (a README body, an editor surface), and reach for
 * `Section` everywhere else.
 *
 * Defaults to a div: the previous `section` default nested a `<section>`
 * directly inside `Section`'s own `<section>`, which is invalid grouping.
 */
export function Plate({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'section' | 'div' | 'article';
}) {
  return (
    <Tag className={cn('border border-border bg-surface', className)}>
      {children}
    </Tag>
  );
}

/**
 * An unboxed region: a small heading, an optional action, and a hairline.
 * This is the default container — the GitHub sidebar pattern.
 */
export function Section({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('border-t border-border pt-4', className)}>
      {title && (
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="m-0 text-[15px] font-[540] tracking-[-0.01em] text-foreground">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** The subtle header strip at the top of a box. */
export function BoxHeader({
  title,
  action,
  className,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-4 py-2.5',
        'bg-surface-secondary border-b border-border',
        className,
      )}
    >
      <h3 className="m-0 text-[13px] font-[540] text-foreground">{title}</h3>
      {action}
    </div>
  );
}

/** A labelled value. */
export function Field({
  label,
  children,
  className,
  wide = false,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="text-[12px] text-subtle mb-0.5">{label}</div>
      <div
        className={cn(
          'font-mono text-foreground tabular truncate',
          wide ? 'text-[13px]' : 'text-[12px]',
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** A page section heading with an optional action on the right. */
export function SectionRule({
  title,
  action,
  className,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 border-b border-border pb-2 mb-4',
        className,
      )}
    >
      <h2 className="m-0 text-[17px] font-[540] tracking-[-0.015em] text-foreground">{title}</h2>
      {action}
    </div>
  );
}

/** A footer region inside a box, separated by a rule. */
export function Counterfoil({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('border-t border-border pt-4 mt-4', className)}>{children}</div>;
}

/**
 * A status mark: a small glyph and a word, in ink.
 *
 * Status is said in words, not colour. The needle is reserved for "live", so
 * `success` here is a filled ink dot, `neutral` a hollow one; only `danger`
 * and `attention` take a colour, because a failure has to be findable in a
 * long column.
 */
export function Seal({
  label,
  title,
  tone = 'success',
  className,
}: {
  label: string;
  title?: string;
  tone?: 'success' | 'neutral' | 'attention' | 'danger' | 'live';
  className?: string;
}) {
  const text = {
    success: 'text-foreground',
    neutral: 'text-subtle',
    attention: 'text-attention',
    danger: 'text-danger',
    live: 'text-foreground',
  } as const;

  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap text-[12.5px]',
        text[tone],
        className,
      )}
    >
      <svg width="7" height="7" viewBox="0 0 8 8" aria-hidden="true" className="shrink-0">
        {tone === 'neutral' ? (
          <circle cx="4" cy="4" r="3.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
        ) : (
          <circle cx="4" cy="4" r="4" fill={tone === 'live' ? 'var(--needle)' : 'currentColor'} />
        )}
      </svg>
      {label}
    </span>
  );
}

/**
 * Headline counts, set as one ruled row of figures.
 *
 * Numbers are stated, not animated: a figure that counts up shows a wrong
 * value for a second, on a page whose claim is that every figure is real.
 */
export function Tally({
  entries,
  className,
}: {
  entries: { label: string; value?: ReactNode; count?: number; to?: string }[];
  className?: string;
}) {
  return (
    <dl className={cn('m-0 flex flex-wrap gap-x-10 gap-y-4', className)}>
      {entries.map(e => (
        <div key={e.label} className="min-w-0">
          <dd className="m-0 text-[22px] font-[540] tabular leading-none tracking-[-0.02em] text-foreground">
            {typeof e.count === 'number' ? e.count.toLocaleString() : (e.value ?? '—')}
          </dd>
          <dt className="mt-1.5 text-[12.5px] text-subtle">{e.label}</dt>
        </div>
      ))}
    </dl>
  );
}
