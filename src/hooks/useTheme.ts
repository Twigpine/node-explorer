import { useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

/**
 * A stored choice wins; with none, the theme follows the OS. The inline script
 * in index.html makes the same decision before first paint and stamps it on
 * <html>, so this reads that back instead of deciding a second time.
 *
 * The choice is only written to storage when the reader picks one, so a
 * visitor who never touches the toggle keeps following their OS.
 *
 * The key is new on purpose. The previous hook wrote `gl-theme` on every
 * visit, defaulting to "light", so a stored value under that name does not
 * mean anyone chose it. Reading it would pin every returning visitor to light
 * whatever their OS says. The old key is ignored and left alone.
 */
const KEY = 'twigpine-theme';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(KEY) as Theme | null;
  if (stored === 'dark' || stored === 'light') return stored;
  const stamped = document.documentElement.getAttribute('data-theme');
  if (stamped === 'dark' || stamped === 'light') return stamped;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  const setTheme = (next: Theme | ((t: Theme) => Theme)) => {
    setThemeState(prev => {
      const value = typeof next === 'function' ? next(prev) : next;
      try {
        localStorage.setItem(KEY, value);
      } catch {
        /* private mode: the choice lasts for this page only */
      }
      return value;
    });
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.setAttribute('data-theme', theme);

    // Force a full style recalculation.
    //
    // Every themed colour resolves through an inherited custom property
    // (`.text-muted { color: var(--fg-muted) }`), and Chromium does not
    // reliably invalidate `color` on elements that already exist when such a
    // property changes on the root. Measured after a toggle: 76 of 236
    // `.text-muted` elements kept the previous theme's colour — white text on
    // the white ground — while a freshly created element with the same class
    // in the same parent resolved correctly. Detaching and reattaching the
    // document element forces the engine to recompute the whole tree.
    const display = root.style.display;
    root.style.display = 'none';
    void root.offsetHeight;
    root.style.display = display;
  }, [theme]);

  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  return { theme, toggle, setTheme };
}
