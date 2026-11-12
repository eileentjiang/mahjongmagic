import { SERVER } from '../api';
import type { Session } from '../engine/session';

/** What the server sends about a shared session. */
export interface RoomState {
  code: string;
  version: number;
  session: Omit<Session, 'shared'>;
  seats: (string | null)[];
  host: string;
  lock: { device: string; seat: number | null; at: number } | null;
}

export type Op =
  | { op: 'claim'; seat: number | null }
  | { op: 'append'; event: unknown; expectedGames: number }
  | { op: 'meta'; name?: string; players?: string[] }
  | { op: 'lock' }
  | { op: 'unlock' }
  | { op: 'finish'; finished: boolean };

export type Status = 'connecting' | 'open' | 'offline' | 'missing';

/** A stable id for this phone (no account, no personal data). */
export function deviceId(): string {
  try {
    let id = localStorage.getItem('mahjong-magic-device');
    if (!id) { id = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10); localStorage.setItem('mahjong-magic-device', id); }
    return id;
  } catch {
    return (window as unknown as { __mmDevice?: string }).__mmDevice ??= Math.random().toString(36).slice(2, 14);
  }
}

export async function createRoom(session: Session, seat: number | null): Promise<string> {
  const { shared: _shared, ...plain } = session;
  void _shared;
  const res = await fetch(SERVER + '/session', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session: plain, device: deviceId(), seat }),
  }).catch(() => { throw new Error('Couldn’t reach the server. Check your connection.'); });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Couldn’t start sharing. Try again.');
  return (data as { code: string }).code;
}

/** A live connection to one room that reconnects by itself and catches up on reconnect. */
export class RoomConnection {
  private ws: WebSocket | null = null;
  private stopped = false;
  private everOpened = false;
  private failures = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private pending = new Map<string, { resolve: () => void; reject: (e: Error) => void }>();

  constructor(
    readonly code: string,
    private onState: (s: RoomState) => void,
    private onStatus: (s: Status) => void,
  ) { this.open(); }

  private open() {
    if (this.stopped) return;
    this.onStatus(this.everOpened ? 'offline' : 'connecting');
    const url = SERVER.replace(/^http/, 'ws') + `/session/${this.code}/ws?device=${deviceId()}`;
    const ws = new WebSocket(url);
    this.ws = ws;
    ws.onopen = () => { this.everOpened = true; this.failures = 0; this.onStatus('open'); };
    ws.onmessage = (m) => {
      let msg: { type: string; id?: string; error?: string; state?: RoomState };
      try { msg = JSON.parse(m.data as string); } catch { return; }
      if (msg.state) this.onState(msg.state);
      const p = msg.id ? this.pending.get(msg.id) : undefined;
      if (p && msg.id) {
        this.pending.delete(msg.id);
        if (msg.type === 'error') p.reject(new Error(msg.error ?? 'That didn’t go through.'));
        else p.resolve();
      }
    };
    ws.onclose = () => {
      this.ws = null;
      for (const p of this.pending.values()) p.reject(new Error('Connection lost. Try again in a moment.'));
      this.pending.clear();
      if (this.stopped) return;
      this.failures++;
      // A code that never connects most likely doesn't exist.
      if (!this.everOpened && this.failures >= 2) { this.onStatus('missing'); return; }
      this.onStatus('offline');
      this.timer = setTimeout(() => this.open(), Math.min(10_000, 500 * 2 ** this.failures));
    };
  }

  send(op: Op): Promise<void> {
    const ws = this.ws;
    if (!ws || ws.readyState !== WebSocket.OPEN) return Promise.reject(new Error('You’re offline. Reconnecting…'));
    const id = Math.random().toString(36).slice(2, 10);
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ ...op, id }));
    });
  }

  close() {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.ws?.close();
  }
}
