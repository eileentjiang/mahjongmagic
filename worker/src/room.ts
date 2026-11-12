// Pure logic for one shared session ("room"). No Cloudflare APIs here, so it can be unit-tested.
// The session itself is opaque JSON owned by the app; the room only appends events and guards against races.

export interface RoomEvent { type: string; [k: string]: unknown }

export interface RoomSession {
  id: string;
  name: string;
  players: string[];
  rules: unknown;
  events: RoomEvent[];
  finished: boolean;
  createdAt: number;
}

export interface RoomState {
  code: string;
  version: number;
  session: RoomSession;
  /** Which device holds each seat (null = free). */
  seats: (string | null)[];
  /** Device that created the room; only it can change rules and players. */
  host: string;
  /** One scorer at a time. Released on confirm, cancel, disconnect or timeout. */
  lock: { device: string; seat: number | null; at: number } | null;
}

export type Op =
  | { op: 'claim'; seat: number | null }
  | { op: 'append'; event: RoomEvent; expectedGames: number }
  | { op: 'meta'; name?: string; players?: string[] }
  | { op: 'lock' }
  | { op: 'unlock' }
  | { op: 'finish'; finished: boolean };

export const LOCK_MS = 5 * 60 * 1000;
export const gamesPlayed = (s: RoomSession) => s.events.filter((e) => e.type === 'game' || e.type === 'draw').length;

export type Result = { ok: true; state: RoomState } | { ok: false; error: string };

export function newRoom(code: string, session: RoomSession, host: string, hostSeat: number | null): RoomState {
  const seats: (string | null)[] = [null, null, null, null];
  if (hostSeat !== null && hostSeat >= 0 && hostSeat < 4) seats[hostSeat] = host;
  return { code, version: 1, session, seats, host, lock: null };
}

/** Drop a lock held too long, or by a device that's no longer connected. */
export function expireLock(s: RoomState, now: number, connected: Set<string>): RoomState {
  if (s.lock && (now - s.lock.at > LOCK_MS || !connected.has(s.lock.device))) return { ...s, lock: null, version: s.version + 1 };
  return s;
}

export function apply(s: RoomState, device: string, o: Op, now: number): Result {
  const bump = (next: Partial<RoomState>): Result => ({ ok: true, state: { ...s, ...next, version: s.version + 1 } });
  const mySeat = s.seats.indexOf(device);
  switch (o.op) {
    case 'claim': {
      if (o.seat === null) return bump({ seats: s.seats.map((d) => (d === device ? null : d)) });
      if (!Number.isInteger(o.seat) || o.seat < 0 || o.seat > 3) return { ok: false, error: 'No such seat.' };
      const holder = s.seats[o.seat];
      if (holder && holder !== device) return { ok: false, error: `That seat is already on ${s.session.players[o.seat]}’s phone.` };
      return bump({ seats: s.seats.map((d, i) => (i === o.seat ? device : d === device ? null : d)) });
    }
    case 'lock': {
      if (s.session.finished) return { ok: false, error: 'This session has ended.' };
      if (s.lock && s.lock.device !== device && now - s.lock.at <= LOCK_MS) {
        const who = s.lock.seat !== null ? s.session.players[s.lock.seat] : 'Someone';
        return { ok: false, error: `${who} is scoring game ${gamesPlayed(s.session) + 1}.` };
      }
      return bump({ lock: { device, seat: mySeat >= 0 ? mySeat : null, at: now } });
    }
    case 'unlock':
      return s.lock?.device === device ? bump({ lock: null }) : { ok: true, state: s };
    case 'append': {
      if (s.session.finished) return { ok: false, error: 'This session has ended.' };
      const t = o.event?.type;
      if (!['game', 'draw', 'kong', 'rules', 'override'].includes(String(t))) return { ok: false, error: 'Unknown event.' };
      if ((t === 'rules' || t === 'override') && device !== s.host) return { ok: false, error: 'Only the phone that started the session can change this.' };
      if ((t === 'game' || t === 'draw') && o.expectedGames !== gamesPlayed(s.session))
        return { ok: false, error: 'Someone else just recorded this game. Check the table.' };
      if (t === 'game' && s.lock && s.lock.device !== device) return { ok: false, error: 'Someone else is scoring this game.' };
      const releases = t === 'game' && s.lock?.device === device;
      return bump({ session: { ...s.session, events: [...s.session.events, o.event] }, lock: releases ? null : s.lock });
    }
    case 'meta': {
      if (device !== s.host) return { ok: false, error: 'Only the phone that started the session can change this.' };
      const players = o.players && o.players.length === 4 ? o.players.map((p, i) => String(p).slice(0, 40) || s.session.players[i]) : s.session.players;
      return bump({ session: { ...s.session, name: o.name ? String(o.name).slice(0, 60) : s.session.name, players } });
    }
    case 'finish':
      return bump({ session: { ...s.session, finished: o.finished }, lock: null });
  }
  return { ok: false, error: 'Unknown request.' };
}
