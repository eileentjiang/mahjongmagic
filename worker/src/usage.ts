// Anonymous usage counts for the Metrics screen. No names, no photos, no device ids.

export const ANSWERS = ['smooth', 'confusing', 'frustrating'] as const;
export type Answer = (typeof ANSWERS)[number];

export type UsageEvent =
  | { type: 'session_started' }
  | { type: 'session_settled' }
  | { type: 'game_by_hand'; tiles: number }
  | { type: 'checkin'; scoring: Answer | null; overall: Answer | null }
  | { type: 'checkin_skipped' };

type Tally = Record<Answer, number>;
export interface Usage {
  sessionsStarted: number;
  sessionsSettled: number;
  handGames: number;
  handTiles: number;
  checkin: { scoring: Tally; overall: Tally; skipped: number };
}

const tally = (): Tally => ({ smooth: 0, confusing: 0, frustrating: 0 });
export const emptyUsage = (): Usage => ({ sessionsStarted: 0, sessionsSettled: 0, handGames: 0, handTiles: 0, checkin: { scoring: tally(), overall: tally(), skipped: 0 } });

const isAnswer = (v: unknown): v is Answer | null => v === null || ANSWERS.includes(v as Answer);

/** Check an event from the app; returns null for anything malformed. */
export function parseEvent(e: unknown): UsageEvent | null {
  if (!e || typeof e !== 'object') return null;
  const o = e as Record<string, unknown>;
  switch (o.type) {
    case 'session_started': case 'session_settled': case 'checkin_skipped': return { type: o.type };
    case 'game_by_hand':
      return Number.isInteger(o.tiles) && (o.tiles as number) >= 0 && (o.tiles as number) <= 30 ? { type: 'game_by_hand', tiles: o.tiles as number } : null;
    case 'checkin':
      if (!isAnswer(o.scoring) || !isAnswer(o.overall) || (o.scoring === null && o.overall === null)) return null;
      return { type: 'checkin', scoring: o.scoring, overall: o.overall };
  }
  return null;
}

export function count(u: Usage, e: UsageEvent): Usage {
  const n = structuredClone(u);
  if (e.type === 'session_started') n.sessionsStarted++;
  else if (e.type === 'session_settled') n.sessionsSettled++;
  else if (e.type === 'game_by_hand') { n.handGames++; n.handTiles += e.tiles; }
  else if (e.type === 'checkin_skipped') n.checkin.skipped++;
  else {
    if (e.scoring) n.checkin.scoring[e.scoring]++;
    if (e.overall) n.checkin.overall[e.overall]++;
  }
  return n;
}
