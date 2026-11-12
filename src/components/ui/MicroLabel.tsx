import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

/**
 * A small label for a field or a column.
 *
 * Set as ordinary sentence-case text at a readable size. The previous
 * 10px/0.2em/uppercase treatment belonged to the terminal design and made
 * every label on the site shout in a register nothing else used.
 */
export function MicroLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-block text-[12.5px] text-subtle first-letter:uppercase', className)}>{children}</span>
  );
}
