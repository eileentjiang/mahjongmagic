import { describe, expect, it } from 'vitest';
import { count, emptyUsage, parseEvent } from './usage';

describe('usage events', () => {
  it('accepts well-formed events and rejects the rest', () => {
    expect(parseEvent({ type: 'session_started' })).toEqual({ type: 'session_started' });
    expect(parseEvent({ type: 'game_by_hand', tiles: 14 })).toEqual({ type: 'game_by_hand', tiles: 14 });
    expect(parseEvent({ type: 'game_by_hand', tiles: 99 })).toBeNull();
    expect(parseEvent({ type: 'checkin', scoring: 'smooth', overall: null })).toEqual({ type: 'checkin', scoring: 'smooth', overall: null });
    expect(parseEvent({ type: 'checkin', scoring: null, overall: null })).toBeNull();
    expect(parseEvent({ type: 'checkin', scoring: 'great', overall: 'smooth' })).toBeNull();
    expect(parseEvent({ type: 'other' })).toBeNull();
    expect(parseEvent(null)).toBeNull();
  });

  it('counts each kind', () => {
    let u = emptyUsage();
    for (const e of [
      { type: 'session_started' }, { type: 'session_started' }, { type: 'session_settled' },
      { type: 'game_by_hand', tiles: 14 }, { type: 'game_by_hand', tiles: 15 },
      { type: 'checkin', scoring: 'smooth', overall: 'confusing' }, { type: 'checkin', scoring: 'smooth', overall: null }, { type: 'checkin_skipped' },
    ]) u = count(u, parseEvent(e)!);
    expect(u.sessionsStarted).toBe(2);
    expect(u.sessionsSettled).toBe(1);
    expect(u.handGames).toBe(2);
    expect(u.handTiles).toBe(29);
    expect(u.checkin.scoring).toEqual({ smooth: 2, confusing: 0, frustrating: 0 });
    expect(u.checkin.overall).toEqual({ smooth: 0, confusing: 1, frustrating: 0 });
    expect(u.checkin.skipped).toBe(1);
  });
});
