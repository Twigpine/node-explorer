import { useState, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

/**
 * A short hash or DID that copies its full value when clicked.
 *
 * The page shows seven characters of a SHA and eight of a key because the
 * full value does not fit a column; this is how a reader gets the rest
 * without leaving the row. It looks like the text it replaces, with a dotted
 * underline on hover as the only affordance, so a table of them still reads
 * as a table.
 */
export function CopyValue({
  value,
  children,
  name,
  className,
}: {
  /** The full value written to the clipboard. */
  value: string;
  /** What is shown; usually the shortened form. */
  children: ReactNode;
  /** What this is, for the accessible name: "commit", "pusher DID". */
  name: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable: the value is still in the title */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? 'Copied' : `${value}\nClick to copy`}
      aria-label={`Copy ${name} ${value}`}
      className={cn(
        'relative z-10 max-w-full cursor-pointer truncate border-0 bg-transparent p-0 text-left font-mono text-inherit',
        'underline decoration-transparent decoration-dotted underline-offset-[3px]',
        'transition-colors hover:decoration-current focus-visible:decoration-current',
        className,
      )}
    >
      {/* The confirmation replaces the value in place. A floating label would
          be cut off wherever the value sits in a truncating cell. */}
      {copied ? <span className="font-sans">Copied</span> : children}
      <span aria-live="polite" className="sr-only">
        {copied ? 'Copied' : ''}
      </span>
    </button>
  );
}
