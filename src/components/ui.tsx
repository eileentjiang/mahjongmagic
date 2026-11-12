import { ReactNode, useEffect } from 'react';
import { Route, useNav } from '../state/store';

export const PLAYER_COLORS = ['#C2DDD1', '#E8875A', '#F3E9B4', '#BCC0DE'];

const svg = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
export const Icon = {
  back: () => <svg {...svg}><path d="M15 6l-6 6 6 6" /></svg>,
  close: () => <svg {...svg}><path d="M6 6l12 12M18 6L6 18" /></svg>,
  more: () => <svg {...svg} strokeWidth={2.4}><path d="M12 5h.01M12 12h.01M12 19h.01" /></svg>,
  chevron: () => <svg {...svg} width={18} height={18} stroke="#4A4E4B"><path d="M9 6l6 6-6 6" /></svg>,
  plus: () => <svg {...svg} width={20} height={20}><path d="M12 5v14M5 12h14" /></svg>,
  grid: () => <svg {...svg}><rect x="3" y="3" width="8" height="8" /><rect x="13" y="3" width="8" height="8" /><rect x="3" y="13" width="8" height="8" /><rect x="13" y="13" width="8" height="8" /></svg>,
  list: () => <svg {...svg}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>,
  camera: () => <svg {...svg} width={26} height={26} stroke="#FBF8EF"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>,
  shuffle: () => <svg {...svg} width={20} height={20}><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></svg>,
  up: () => <svg {...svg} width={20} height={20}><path d="M6 15l6-6 6 6" /></svg>,
  arrow: () => <svg {...svg} width={20} height={20}><path d="M5 12h14M13 6l6 6-6 6" /></svg>,
  share: () => <svg {...svg} width={20} height={20}><path d="M12 3v12M7 8l5-5 5 5M5 14v6h14v-6" /></svg>,
};

export function Header({ title, kicker, back = true, right }: { title: ReactNode; kicker?: ReactNode; back?: boolean; right?: ReactNode }) {
  const nav = useNav();
  return (
    <header className="header">
      {back ? <button type="button" className="icon-btn" aria-label="Back" onClick={nav.back}><Icon.back /></button> : <span style={{ width: 12 }} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>
        {kicker && <span className="kicker">{kicker}</span>}
        <h1>{title}</h1>
      </div>
      {right}
    </header>
  );
}

export function Sheet({ title, children, onClose }: { title: ReactNode; children: ReactNode; onClose?: () => void }) {
  const nav = useNav();
  const close = onClose ?? nav.closeSheet;
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [close]);
  return (
    <div className="scrim" onClick={close}>
      <section role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined} className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h1>{title}</h1>
          <button type="button" className="icon-btn" aria-label="Close" onClick={close}><Icon.close /></button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className="switch" onClick={() => onChange(!on)}><span /></button>
  );
}

export function PlayerChips({ names, selected, onPick, exclude = [], cols = 4 }: { names: string[]; selected: number | null; onPick: (i: number) => void; exclude?: number[]; cols?: number }) {
  return (
    <div className="seg" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {names.map((n, i) => exclude.includes(i) ? null : (
        <button key={i} type="button" className="chip" aria-pressed={selected === i} style={{ background: PLAYER_COLORS[i] }} onClick={() => onPick(i)}>{n}</button>
      ))}
    </div>
  );
}

export function TabBar({ current }: { current: Route }) {
  const nav = useNav();
  const go = (r: Route) => { if (current !== r) (current === 'table' ? nav.go(r) : r === 'table' ? nav.back() : nav.go(r)); };
  return (
    <nav className="tabbar" aria-label="Session">
      <button type="button" className="tab" aria-current={current === 'table' ? 'page' : undefined} onClick={() => go('table')}><Icon.grid />Table</button>
      <button type="button" className="tab tab-score" onClick={() => nav.go('camera')}>
        <span className="box"><Icon.camera /></span>Score a win
      </button>
      <button type="button" className="tab" aria-current={current === 'standings' ? 'page' : undefined} onClick={() => go('standings')}><Icon.list />Standings</button>
    </nav>
  );
}
