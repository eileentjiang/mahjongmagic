import { KongKind } from './payout';
import { RuleSet } from './rules';
import { FanHit } from './fans';
import { TileId, Wind, WINDS } from './tiles';

export type SessionEvent =
  | {
      type: 'game';
      at: number;
      winner: number;
      discarder: number | null;
      tiles: TileId[];
      flowers: TileId[];
      concealed: boolean;
      points: number;
      fans: FanHit[];
      cents: number[];
      edited: boolean;
    }
  | { type: 'draw'; at: number }
  | { type: 'kong'; at: number; owner: number; kind: KongKind; cents: number[] }
  | { type: 'rules'; at: number; rules: RuleSet }
  | { type: 'override'; at: number; dealer: number; tableWind: number };

export interface Session {
  id: string;
  name: string;
  createdAt: number;
  /** Seat order, counter-clockwise; index 0 deals first. */
  players: string[];
  rules: RuleSet;
  events: SessionEvent[];
  finished: boolean;
  /** Set when this session is shared live; the server holds the authoritative copy. */
  shared?: { code: string };
}

export interface TableState {
  dealer: number;
  /** 0 East … 3 North. */
  tableWind: number;
  gameNumber: number;
  balances: number[];
  rules: RuleSet;
  /** Balances at the start of the current table-wind round (for per-round standings). */
  roundStart: number[];
  dealsPassed: number;
  lastGame: Extract<SessionEvent, { type: 'game' }> | null;
  gamesPlayed: number;
}

export const seatWindOf = (seat: number, dealer: number): Wind => WINDS[(seat - dealer + 4) % 4];
export const flowerNumberOf = (seat: number, dealer: number) => ((seat - dealer + 4) % 4) + 1;

/** Replay the event list into the current table state. */
export function replay(s: Session): TableState {
  const st: TableState = {
    dealer: 0, tableWind: 0, gameNumber: 1, balances: [0, 0, 0, 0], rules: s.rules,
    roundStart: [0, 0, 0, 0], dealsPassed: 0, lastGame: null, gamesPlayed: 0,
  };
  const passDeal = () => {
    st.dealer = (st.dealer + 1) % 4;
    st.dealsPassed++;
    if (st.dealsPassed % 4 === 0) {
      st.tableWind = (st.tableWind + 1) % 4;
      st.roundStart = [...st.balances];
    }
  };
  for (const e of s.events) {
    if (e.type === 'rules') st.rules = e.rules;
    else if (e.type === 'override') { st.dealer = e.dealer; st.tableWind = e.tableWind; }
    else if (e.type === 'kong') e.cents.forEach((c, i) => (st.balances[i] += c));
    else if (e.type === 'draw') {
      st.gameNumber++; st.gamesPlayed++;
      if (!st.rules.dealerKeepsDealOnDraw) passDeal();
    } else if (e.type === 'game') {
      e.cents.forEach((c, i) => (st.balances[i] += c));
      st.gameNumber++; st.gamesPlayed++; st.lastGame = e;
      if (!(st.rules.dealerKeepsDealOnWin && e.winner === st.dealer)) passDeal();
    }
  }
  return st;
}

export const newId = () => Math.random().toString(36).slice(2, 10);
