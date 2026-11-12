import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { HOUSE_DEFAULT, RuleSet } from '../engine/rules';
import { newId, replay, Session, SessionEvent, TableState } from '../engine/session';
import { TileId } from '../engine/tiles';
import { kongPayout, KongKind, winPayout } from '../engine/payout';
import { FanHit } from '../engine/fans';

export interface Profile { id: string; name: string; players: string[]; rules: RuleSet }

/** A score in progress. Saved so a reload can resume it. */
export interface Draft {
  tiles: TileId[];
  flowers: TileId[];
  winner: number;
  discarder: number | null;
  selfDraw: boolean;
  concealed: boolean;
  removed: string[];
  /** Index of the winning tile in `tiles` (default: the last one). */
  winIndex?: number;
  /** Tiles the photo reader wasn't sure about, by index, with its other guesses. */
  unsure?: { index: number; alternatives: TileId[] }[];
}

interface Persisted {
  sessions: Session[];
  currentId: string | null;
  profiles: Profile[];
  lastRules: RuleSet;
  draft: Draft | null;
  /** Setup in progress (before Start session). */
  setup: { name: string; players: string[]; rules: RuleSet; saveProfile: boolean } | null;
}

const KEY = 'mahjong-magic-v1';
const empty: Persisted = { sessions: [], currentId: null, profiles: [], lastRules: HOUSE_DEFAULT, draft: null, setup: null };

function load(): { data: Persisted; storageOk: boolean } {
  try {
    const raw = localStorage.getItem(KEY);
    localStorage.setItem(KEY + '-probe', '1');
    localStorage.removeItem(KEY + '-probe');
    return { data: raw ? { ...empty, ...JSON.parse(raw) } : empty, storageOk: true };
  } catch {
    return { data: empty, storageOk: false };
  }
}

export interface Store extends Persisted {
  storageOk: boolean;
  current: Session | null;
  table: TableState | null;
  update: (fn: (d: Persisted) => Persisted) => void;
  startSetup: (from?: Profile) => void;
  startSession: () => void;
  addEvent: (e: SessionEvent) => void;
  recordKong: (owner: number, kind: KongKind) => void;
  recordDraw: () => void;
  confirmGame: (r: { points: number; fans: FanHit[]; edited: boolean; discarderOnlyPoints: number }) => void;
  changeRules: (rules: RuleSet) => void;
  finishSession: (keep: boolean) => void;
  saveProfile: (s: Session) => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [{ data: initial, storageOk }] = useState(load);
  const [data, setData] = useState<Persisted>(initial);

  useEffect(() => {
    if (!storageOk) return;
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage full or blocked */ }
  }, [data, storageOk]);

  const update = useCallback((fn: (d: Persisted) => Persisted) => setData(fn), []);
  const current = data.sessions.find((s) => s.id === data.currentId) ?? null;
  const table = useMemo(() => (current ? replay(current) : null), [current]);

  const withCurrent = useCallback((fn: (s: Session) => Session) =>
    setData((d) => ({ ...d, sessions: d.sessions.map((s) => (s.id === d.currentId ? fn(s) : s)) })), []);

  const store: Store = {
    ...data, storageOk, current, table, update,
    startSetup: (from) => setData((d) => ({
      ...d,
      setup: {
        name: from?.name ?? '',
        players: from?.players ?? ['', '', '', ''],
        rules: from?.rules ?? d.lastRules,
        saveProfile: false,
      },
    })),
    startSession: () => setData((d) => {
      if (!d.setup) return d;
      const date = new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      const s: Session = {
        id: newId(), name: d.setup.name.trim() || date, createdAt: Date.now(),
        players: d.setup.players.map((p, i) => p.trim() || `Player ${i + 1}`),
        rules: d.setup.rules, events: [], finished: false,
      };
      const profiles = d.setup.saveProfile ? upsertProfile(d.profiles, s) : d.profiles;
      return { ...d, sessions: [s, ...d.sessions], currentId: s.id, lastRules: d.setup.rules, setup: null, draft: null, profiles };
    }),
    addEvent: (e) => withCurrent((s) => ({ ...s, events: [...s.events, e] })),
    recordKong: (owner, kind) => {
      if (!table) return;
      withCurrent((s) => ({ ...s, events: [...s.events, { type: 'kong', at: Date.now(), owner, kind, cents: kongPayout(kind, table.rules, owner) }] }));
    },
    recordDraw: () => withCurrent((s) => ({ ...s, events: [...s.events, { type: 'draw', at: Date.now() }] })),
    confirmGame: ({ points, fans, edited, discarderOnlyPoints }) => {
      const dr = data.draft;
      if (!dr || !table) return;
      const discarder = dr.selfDraw ? null : dr.discarder;
      setData((d) => ({
        ...d,
        draft: null,
        sessions: d.sessions.map((s) => s.id !== d.currentId ? s : {
          ...s,
          events: [...s.events, {
            type: 'game', at: Date.now(), winner: dr.winner, discarder, tiles: dr.tiles, flowers: dr.flowers,
            concealed: dr.concealed, points, fans, edited, cents: winPayout(points, table.rules, dr.winner, discarder, discarderOnlyPoints),
          }],
        }),
      }));
    },
    changeRules: (rules) => withCurrent((s) => ({ ...s, events: [...s.events, { type: 'rules', at: Date.now(), rules }] })),
    finishSession: (keep) => setData((d) => ({
      ...d,
      currentId: keep ? d.currentId : null,
      draft: null,
      sessions: d.sessions.map((s) => (s.id === d.currentId ? { ...s, finished: !keep } : s)),
    })),
    saveProfile: (s) => setData((d) => ({ ...d, profiles: upsertProfile(d.profiles, s) })),
  };
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

function upsertProfile(profiles: Profile[], s: Session): Profile[] {
  const p: Profile = { id: newId(), name: s.name, players: s.players, rules: s.rules };
  const i = profiles.findIndex((x) => x.name.toLowerCase() === s.name.toLowerCase());
  return i >= 0 ? profiles.map((x, j) => (j === i ? { ...p, id: x.id } : x)) : [p, ...profiles];
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider missing');
  return s;
}

// ---------- Navigation: a stack mirrored into browser history, so ← and the phone's back gesture agree.
export type Route =
  | 'home' | 'rules' | 'players' | 'table' | 'camera' | 'unsure' | 'entry' | 'score' | 'standings' | 'end' | 'about'
  | 'rulesEdit' | 'playersEdit';
export type SheetName = 'menu' | 'kong' | 'draw' | 'seat' | 'endConfirm' | null;

interface NavState { stack: Route[]; sheet: SheetName; sheetArg: number }
interface Nav extends NavState {
  route: Route;
  go: (r: Route) => void;
  back: () => void;
  reset: (r: Route) => void;
  openSheet: (s: SheetName, arg?: number) => void;
  closeSheet: () => void;
}
const NavCtx = createContext<Nav | null>(null);

export function NavProvider({ initial, children }: { initial: Route; children: ReactNode }) {
  const [st, setSt] = useState<NavState>({ stack: [initial], sheet: null, sheetArg: 0 });
  useEffect(() => {
    history.replaceState({ depth: 0 }, '');
    const onPop = () => setSt((s) => (s.sheet ? { ...s, sheet: null } : s.stack.length > 1 ? { ...s, stack: s.stack.slice(0, -1) } : s));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [st.stack.length, st.stack[st.stack.length - 1]]);
  const nav: Nav = {
    ...st,
    route: st.stack[st.stack.length - 1],
    go: (r) => { if (st.sheet) history.replaceState({}, ''); else history.pushState({}, ''); setSt((s) => ({ ...s, sheet: null, stack: [...s.stack, r] })); },
    back: () => history.back(),
    reset: (r) => { setSt({ stack: [r], sheet: null, sheetArg: 0 }); },
    openSheet: (sheet, arg = 0) => { history.pushState({}, ''); setSt((s) => ({ ...s, sheet, sheetArg: arg })); },
    closeSheet: () => history.back(),
  };
  return <NavCtx.Provider value={nav}>{children}</NavCtx.Provider>;
}

export function useNav(): Nav {
  const n = useContext(NavCtx);
  if (!n) throw new Error('NavProvider missing');
  return n;
}
