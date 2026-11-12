import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { Menu, X, Search } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Lockup } from '../brand/Mark';
import { LiveDot } from '../brand/Chrome';
import { Kbd } from '../register/controls';
import { useNodeStatus } from '../../hooks/useNodeStatus';
import { useShortcuts } from '../../hooks/useShortcuts';
import { cn } from '../../lib/utils';
import { MobileNavDrawer } from './MobileNavDrawer';
import { modifierKeyLabel } from '../../lib/platform';

const NAV_LINKS = [
  { to: '/', label: 'Overview', end: true },
  { to: '/repos', label: 'Repos' },
  { to: '/network', label: 'Network' },
  { to: '/peers', label: 'Peers' },
  { to: '/events', label: 'Events' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/agents', label: 'Agents' },
  { to: '/docs', label: 'Docs' },
];

export default function TopBar() {
  const { node, stats } = useNodeStatus();
  const location = useLocation();
  const { setOpenModal } = useShortcuts();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const reduce = useReducedMotion();
  const paletteHint = `${modifierKeyLabel()} K`;

  // Close on route change during render — an effect here trips
  // react-hooks/set-state-in-effect and lands a frame late.
  const [prevPath, setPrevPath] = useState(location.pathname);
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    if (menuOpen) setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const isActive = (to: string, end?: boolean) =>
    end ? location.pathname === to : location.pathname.startsWith(to + '/') || location.pathname === to;

  const activeHref = NAV_LINKS.find(l => isActive(l.to, l.end))?.to;
  // The rail follows the pointer while hovering and returns to the current
  // route on leave, so it always reports where a click would take you.
  const railOn = hovered ?? activeHref;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-2 sm:gap-6 px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="Twigpine Explorer, overview" className="flex shrink-0 items-center">
          <Lockup />
        </Link>

        {/* One indicator shared across every item: Motion animates it between
            positions via layoutId rather than cross-fading eight separate
            underlines. */}
        <nav
          className="hidden md:flex items-center"
          onMouseLeave={() => setHovered(null)}
        >
          {NAV_LINKS.map(({ to, label, end }) => {
            const active = isActive(to, end);
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? 'page' : undefined}
                onMouseEnter={() => setHovered(to)}
                className={cn(
                  'relative px-2.5 py-2 text-[14px] transition-colors whitespace-nowrap',
                  active ? 'font-medium text-foreground' : 'text-subtle hover:text-foreground',
                )}
              >
                {railOn === to && (
                  <motion.span
                    layoutId="nav-rail"
                    aria-hidden="true"
                    className="absolute inset-x-2.5 -bottom-[9px] h-px bg-foreground"
                    transition={
                      reduce
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 480, damping: 38, mass: 0.6 }
                    }
                  />
                )}
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* The node this page is reading, and whether it answered. The dot
              is the needle only while the node is answering. */}
          <span
            className="hidden lg:inline-flex items-center gap-2 font-mono text-[12px] text-subtle whitespace-nowrap"
            title={node ? 'The node answered its last status check' : 'Waiting for the node'}
          >
            <LiveDot on={!!node} />
            {node ? (
              <>
                node {node.version ? `v${node.version}` : 'online'}
                {node.network && <span>· {node.network}</span>}
              </>
            ) : (
              'node …'
            )}
          </span>

          {/* Icon only. The shortcut lives in the tooltip and the accessible
              name rather than as a floating glyph beside the icon — and it
              names the modifier this keyboard actually has. */}
          <button
            type="button"
            onClick={() => setOpenModal('palette')}
            title={`Search — ${paletteHint}`}
            aria-label={`Open command palette (${paletteHint})`}
            aria-keyshortcuts="Meta+K Control+K"
            className="inline-flex h-10 sm:h-8 items-center justify-center gap-2 px-2 sm:px-2.5
              rounded-[var(--radius-control)] sm:border sm:border-border
              text-[13px] text-subtle transition-colors hover:text-foreground hover:border-foreground"
          >
            <Search size={15} />
            <span className="hidden sm:inline">Search</span>
            <Kbd className="hidden sm:inline-flex border-0 px-0">{paletteHint}</Kbd>
          </button>

          <ThemeToggle />

          <button
            type="button"
            aria-label="Navigation menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(o => !o)}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center text-muted hover:text-foreground"
          >
            {menuOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>

      <MobileNavDrawer
        open={menuOpen}
        onOpenChange={setMenuOpen}
        links={NAV_LINKS}
        isActive={isActive}
        node={node}
        stats={stats}
      />
    </header>
  );
}
