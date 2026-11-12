import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

/**
 * Theme switch. An instant swap: the two themes are the same ledger in two
 * inks, and a transition between them would be decoration.
 */
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      className="inline-flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center
        rounded-[var(--radius-control)] text-subtle transition-colors hover:text-foreground"
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
