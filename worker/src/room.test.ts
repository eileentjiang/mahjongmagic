import { describe, expect, it } from 'vitest';
import { apply, expireLock, LOCK_MS, newRoom, RoomState } from './room';

const session = () => ({ id: 's', name: 'Thursday crew', players: ['Amy', 'Ben', 'Chloe', 'Dev'], rules: {}, events: [], finished: false, createdAt: 0 });
const ok = (r: ReturnType<typeof apply>): RoomState => { if (!r.ok) throw new Error(r.error); return r.state; };

describe('shared session room', () => {
  it('host holds their seat; others claim free seats only', () => {
    let s = newRoom('ABCD', session(), 'host1', 1);
    expect(s.seats).toEqual([null, 'host1', null, null]);
    expect(apply(s, 'phone2', { op: 'claim', seat: 1 }, 0)).toMatchObject({ ok: false });
    s = ok(apply(s, 'phone2', { op: 'claim', seat: 2 }, 0));
    s = ok(apply(s, 'phone2', { op: 'claim', seat: 3 }, 0)); // switching moves, never duplicates
    expect(s.seats).toEqual([null, 'host1', null, 'phone2']);
  });

  it('one scorer at a time; the lock releases on confirm', () => {
    let s = newRoom('ABCD', session(), 'host1', 1);
    s = ok(apply(s, 'phone2', { op: 'claim', seat: 2 }, 0));
    s = ok(apply(s, 'phone2', { op: 'lock' }, 0));
    const blocked = apply(s, 'host1', { op: 'lock' }, 1000);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.error).toBe('Chloe is scoring game 1.');
    expect(apply(s, 'host1', { op: 'append', event: { type: 'game' }, expectedGames: 0 }, 1000).ok).toBe(false);
    s = ok(apply(s, 'phone2', { op: 'append', event: { type: 'game' }, expectedGames: 0 }, 1000));
    expect(s.lock).toBeNull();
    expect(s.session.events).toHaveLength(1);
  });

  it('a stale second "draw" for the same game is rejected', () => {
    let s = newRoom('ABCD', session(), 'host1', 0);
    s = ok(apply(s, 'host1', { op: 'append', event: { type: 'draw' }, expectedGames: 0 }, 0));
    expect(apply(s, 'phone2', { op: 'append', event: { type: 'draw' }, expectedGames: 0 }, 0).ok).toBe(false);
  });

  it('only the host changes rules and names', () => {
    const s = newRoom('ABCD', session(), 'host1', 0);
    expect(apply(s, 'phone2', { op: 'append', event: { type: 'rules' }, expectedGames: 0 }, 0).ok).toBe(false);
    expect(apply(s, 'phone2', { op: 'meta', name: 'x' }, 0).ok).toBe(false);
    expect(ok(apply(s, 'host1', { op: 'meta', name: 'Friday' }, 0)).session.name).toBe('Friday');
  });

  it('locks expire after a timeout or when the scorer disconnects', () => {
    let s = newRoom('ABCD', session(), 'host1', 0);
    s = ok(apply(s, 'host1', { op: 'lock' }, 0));
    expect(expireLock(s, 1000, new Set(['host1'])).lock).not.toBeNull();
    expect(expireLock(s, LOCK_MS + 1, new Set(['host1'])).lock).toBeNull();
    expect(expireLock(s, 1000, new Set(['phone2'])).lock).toBeNull();
  });
});
