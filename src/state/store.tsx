import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createRoom, deviceId, Op, RoomConnection, RoomState, Status } from './sync';
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
    const data: Persisted = raw ? { ...empty, ...JSON.parse(raw) } : empty;
    // Only one session may be open: close any older ones left open by earlier versions.
    data.sessions = data.sessions.map((s) => (s.id !== data.currentId && !s.finished ? { ...s, finished: true } : s));
    return { data, storageOk: true };
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
  recordKong: (owner: number, kind: KongKind) => Promise<void>;
  recordDraw: () => Promise<void>;
  confirmGame: (r: { points: number; fans: FanHit[]; edited: boolean; discarderOnlyPoints: number }) => Promise<boolean>;
  changeRules: (rules: RuleSet) => Promise<boolean>;
  saveSeating: (p: { name: string; players: string[]; dealer: number; tableWind: number }) => Promise<boolean>;
  finishSession: (keep: boolean) => void;
  saveProfile: (s: Session) => void;
  // ---- Shared sessions
  room: RoomState | null;
  status: Status | null;
  /** This phone's seat in a shared session (null: not shared, or watching). */
  mySeat: number | null;
  /** True when this phone may change rules and seating (always true when not shared). */
  canEdit: boolean;
  notice: string | null;
  setNotice: (n: string | null) => void;
  startSharing: (seat: number | null) => Promise<boolean>;
  joinCode: string | null;
  join: (code: string | null) => void;
  claimSeat: (seat: number | null) => Promise<boolean>;
  lockScoring: () => Promise<boolean>;
  unlockScoring: () => void;
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

  // ---------- Live sharing
  const [room, setRoom] = useState<RoomState | null>(null);
  const roomRef = useRef<RoomState | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const conn = useRef<RoomConnection | null>(null);
  const code = current?.shared && !current.finished ? current.shared.code : joinCode;
  useEffect(() => {
    if (!code) { setRoom(null); roomRef.current = null; setStatus(null); return; }
    const c = new RoomConnection(code, (st) => {
      roomRef.current = st;
      setRoom(st);
      // The server's copy wins: keep the local session in step with it.
      setData((d) => ({ ...d, sessions: d.sessions.map((x) => (x.shared?.code === st.code ? { ...x, ...st.session, shared: x.shared } : x)) }));
    }, setStatus);
    conn.current = c;
    return () => { c.close(); conn.current = null; };
  }, [code]);
  const me = deviceId();
  const shared = !!current?.shared;
  const mySeatRaw = room && shared ? room.seats.indexOf(me) : -1;
  const send = async (op: Op): Promise<boolean> => {
    if (!conn.current) { setNotice('Not connected to the shared session.'); return false; }
    try { await conn.current.send(op); return true; } catch (e) { setNotice((e as Error).message); return false; }
  };
  /** Record an event: through the server when shared, on this phone otherwise. */
  const commit = async (e: SessionEvent): Promise<boolean> => {
    if (!shared) { withCurrent((s) => ({ ...s, events: [...s.events, e] })); return true; }
    return send({ op: 'append', event: e, expectedGames: table?.gamesPlayed ?? 0 });
  };

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
    addEvent: (e) => { void commit(e); },
    recordKong: async (owner, kind) => {
      if (!table) return;
      await commit({ type: 'kong', at: Date.now(), owner, kind, cents: kongPayout(kind, table.rules, owner) });
    },
    recordDraw: async () => { await commit({ type: 'draw', at: Date.now() }); },
    confirmGame: async ({ points, fans, edited, discarderOnlyPoints }) => {
      const dr = data.draft;
      if (!dr || !table) return false;
      const discarder = dr.selfDraw ? null : dr.discarder;
      const ok = await commit({
        type: 'game', at: Date.now(), winner: dr.winner, discarder, tiles: dr.tiles, flowers: dr.flowers,
        concealed: dr.concealed, points, fans, edited, cents: winPayout(points, table.rules, dr.winner, discarder, discarderOnlyPoints),
      });
      if (ok) setData((d) => ({ ...d, draft: null }));
      return ok;
    },
    changeRules: (rules) => commit({ type: 'rules', at: Date.now(), rules }),
    saveSeating: async ({ name, players, dealer, tableWind }) => {
      if (!current || !table) return false;
      const moved = dealer !== table.dealer || tableWind !== table.tableWind;
      if (shared) {
        if (!(await send({ op: 'meta', name, players }))) return false;
        return moved ? commit({ type: 'override', at: Date.now(), dealer, tableWind }) : true;
      }
      withCurrent((s) => ({ ...s, name: name.trim() || s.name, players: players.map((p, i) => p.trim() || s.players[i]) }));
      return moved ? commit({ type: 'override', at: Date.now(), dealer, tableWind }) : true;
    },
    finishSession: (keep) => {
      if (shared && !keep) void send({ op: 'finish', finished: true });
      setData((d) => ({
        ...d,
        currentId: keep ? d.currentId : null,
        draft: null,
        sessions: d.sessions.map((s) => (s.id === d.currentId ? { ...s, finished: !keep } : s)),
      }));
    },
    saveProfile: (s) => setData((d) => ({ ...d, profiles: upsertProfile(d.profiles, s) })),
    room: shared || joinCode ? room : null,
    status: shared || joinCode ? status : null,
    mySeat: mySeatRaw >= 0 ? mySeatRaw : null,
    canEdit: !shared || room?.host === me,
    notice, setNotice,
    startSharing: async (seat) => {
      if (!current) return false;
      try {
        const c = await createRoom(current, seat);
        withCurrent((s) => ({ ...s, shared: { code: c } }));
        return true;
      } catch (e) { setNotice((e as Error).message); return false; }
    },
    joinCode,
    join: (c) => setJoinCode(c ? c.toUpperCase() : null),
    claimSeat: async (seat) => {
      if (!(await send({ op: 'claim', seat }))) return false;
      const st = roomRef.current;
      if (joinCode && st) {
        setData((d) => {
          const existing = d.sessions.find((x) => x.shared?.code === st.code);
          const local: Session = { ...(st.session as Session), shared: { code: st.code } };
          return {
            ...d, currentId: existing?.id ?? local.id, draft: null,
            sessions: existing ? d.sessions.map((x) => (x === existing ? { ...x, ...local } : x)) : [local, ...d.sessions],
          };
        });
        setJoinCode(null);
      }
      return true;
    },
    lockScoring: async () => (shared ? send({ op: 'lock' }) : true),
    unlockScoring: () => { if (shared && room?.lock?.device === me) void send({ op: 'unlock' }); },
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
  | 'home' | 'rules' | 'players' | 'table' | 'camera' | 'unsure' | 'entry' | 'score' | 'standings' | 'end' | 'about' | 'join' | 'claim'
  | 'rulesEdit' | 'playersEdit';
export type SheetName = 'menu' | 'kong' | 'draw' | 'seat' | 'endConfirm' | 'rulesFine' | 'invite' | null;

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
