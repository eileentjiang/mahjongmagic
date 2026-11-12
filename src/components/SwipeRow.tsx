import { ReactNode, useRef, useState } from 'react';

const REVEAL = 92;

/** A list row that slides left to reveal a Delete button (tap Delete to confirm). */
export function SwipeRow({ children, onOpen, onDelete, label }: { children: ReactNode; onOpen: () => void; onDelete: () => void; label: string }) {
  const [x, setX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number; base: number; locked: 'h' | 'v' | null } | null>(null);
  const moved = useRef(false);
  const open = x < 0;

  const down = (e: React.PointerEvent) => {
    start.current = { x: e.clientX, y: e.clientY, base: x, locked: null };
    moved.current = false;
  };
  const move = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (!s.locked && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) s.locked = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
    if (s.locked !== 'h') return;
    moved.current = true;
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setX(Math.max(-REVEAL - 24, Math.min(0, s.base + dx)));
  };
  const up = () => {
    if (start.current?.locked === 'h') setX((v) => (v < -REVEAL / 2 ? -REVEAL : 0));
    start.current = null;
    setDragging(false);
  };

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--divider)' }}>
      <button type="button" onClick={onDelete} tabIndex={open ? 0 : -1} aria-hidden={!open} aria-label={`Delete ${label}`}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: REVEAL, border: 'none', background: 'var(--walnut)', color: 'var(--ground)', fontSize: 15, fontWeight: 600 }}>
        Delete
      </button>
      <button type="button" className="row"
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        onClick={() => { if (moved.current) { moved.current = false; return; } if (open) setX(0); else onOpen(); }}
        onKeyDown={(e) => { if (e.key === 'Delete' || e.key === 'Backspace') onDelete(); }}
        style={{ position: 'relative', width: '100%', gap: 14, minHeight: 68, padding: '6px 0', border: 'none', background: 'var(--ground)', textAlign: 'left',
          touchAction: 'pan-y', transform: `translateX(${x}px)`, transition: dragging ? 'none' : 'transform 160ms ease-out' }}>
        {children}
      </button>
    </div>
  );
}
