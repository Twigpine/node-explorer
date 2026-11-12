import type { ReactNode, MouseEventHandler } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface PillProps {
  children: ReactNode;
  onClick?: MouseEventHandler;
  to?: string;
  active?: boolean;
  disabled?: boolean;
  className?: string;
  title?: string;
  'aria-label'?: string;
  'aria-pressed'?: boolean;
  'data-row-link'?: string;
}

/** A small label holding one value. */
const base =
  'inline-flex items-center border px-1.5 py-px text-[12px] transition-colors';

export function Pill({
  children,
  onClick,
  to,
  active,
  disabled,
  className,
  ...rest
}: PillProps) {
  const tone = active
    ? 'border-foreground text-foreground'
    : 'border-border text-muted hover:text-foreground';

  const cls = cn(
    base,
    tone,
    disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
    className,
  );

  if (to) {
    return (
      <Link to={to} className={cls} onClick={onClick} {...rest}>
        {children}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={cn(cls, 'cursor-pointer')}
        {...rest}
      >
        {children}
      </button>
    );
  }

  return (
    <span className={cls} {...rest}>
      {children}
    </span>
  );
}
