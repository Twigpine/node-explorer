import { useState, useRef, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShortcutsContext, isTypingTarget, type ModalId, type ShortcutHandler } from '../../lib/shortcuts';
import { CommandPalette } from './CommandPalette';
import { KeyboardCheatsheet } from './KeyboardCheatsheet';

/**
 * Two-key jumps between sections: `g` then a letter. Listed in the cheatsheet.
 * `g` arms the jump for a second. A jump letter in that second is consumed by
 * it, so `g t` goes to Tasks instead of opening the file finder; any other key
 * disarms it and is handled as usual, so `g` then `j` still moves down a list.
 */
const JUMPS: Record<string, string> = {
  o: '/',
  r: '/repos',
  n: '/network',
  p: '/peers',
  e: '/events',
  t: '/tasks',
  a: '/agents',
  d: '/docs',
};
const JUMP_WINDOW_MS = 1000;

export function ShortcutsProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const armedAt = useRef(0);
  const [openModal, setOpenModal] = useState<ModalId>(null);
  const registryRef = useRef(new Map<string, ShortcutHandler>());

  const register = useCallback((key: string, handler: ShortcutHandler) => {
    registryRef.current.set(key, handler);
    return () => {
      if (registryRef.current.get(key) === handler) registryRef.current.delete(key);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Palette toggle works everywhere, even while typing
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpenModal(m => (m === 'palette' ? null : 'palette'));
        return;
      }
      // Open modals own their keys (Modal handles Escape)
      if (openModal !== null) return;
      if (isTypingTarget(e) || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === '?') {
        e.preventDefault();
        setOpenModal('cheatsheet');
        return;
      }

      // An open dropdown or menu owns its own letters (type-ahead).
      const inPopup = (e.target as HTMLElement | null)?.closest?.(
        '[role="listbox"], [role="menu"], [role="combobox"]',
      );
      if (!inPopup) {
        const armed = armedAt.current > 0 && e.timeStamp - armedAt.current < JUMP_WINDOW_MS;
        if (e.key !== 'Shift') armedAt.current = 0;
        const to = armed ? JUMPS[e.key.toLowerCase()] : undefined;
        if (to) {
          e.preventDefault();
          navigate(to);
          return;
        }
        if (e.key === 'g' && !e.shiftKey) {
          armedAt.current = e.timeStamp;
          return;
        }
      }
      registryRef.current.get(e.key)?.(e);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openModal, navigate]);

  const ctx = useMemo(
    () => ({ openModal, setOpenModal, register }),
    [openModal, register],
  );

  return (
    <ShortcutsContext.Provider value={ctx}>
      {children}
      <CommandPalette open={openModal === 'palette'} onClose={() => setOpenModal(null)} />
      <KeyboardCheatsheet open={openModal === 'cheatsheet'} onClose={() => setOpenModal(null)} />
    </ShortcutsContext.Provider>
  );
}
