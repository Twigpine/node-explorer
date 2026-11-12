import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

/**
 * Instrument chrome: corner brackets around a region, and a tick ruler.
 *
 * It frames the places where the page is reading an instrument, the live
 * ledger and a certificate, and nothing else. It is drawn in the rule colour
 * and carries no information of its own.
 */
export function Brackets({ children, className }: { children: ReactNode; className?: string }) {
  const corner = 'pointer-events-none absolute h-2.5 w-2.5 border-foreground';
  return (
    <div className={cn('relative', className)}>
      <span aria-hidden="true" className={cn(corner, '-left-px -top-px border-l border-t')} />
      <span aria-hidden="true" className={cn(corner, '-right-px -top-px border-r border-t')} />
      <span aria-hidden="true" className={cn(corner, '-bottom-px -left-px border-b border-l')} />
      <span aria-hidden="true" className={cn(corner, '-bottom-px -right-px border-b border-r')} />
      {children}
    </div>
  );
}

/** A horizontal ruler: a tick every 8px, a taller one every 40px. */
export function Ruler({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('h-2 w-full', className)}
      style={{
        backgroundImage:
          'repeating-linear-gradient(to right, var(--rule-2) 0 1px, transparent 1px 8px),' +
          'repeating-linear-gradient(to right, var(--ink-4) 0 1px, transparent 1px 40px)',
        backgroundSize: '100% 4px, 100% 8px',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'left bottom, left bottom',
      }}
    />
  );
}

/**
 * The Live dot. The needle's one meaning: this is current. `on` false draws
 * the same dot hollow, in ink, so "not live" is never said in colour alone.
 */
export function LiveDot({ on = true, className }: { on?: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block h-[7px] w-[7px] shrink-0 rounded-full',
        on ? 'bg-needle' : 'border border-subtle',
        className,
      )}
    />
  );
}
