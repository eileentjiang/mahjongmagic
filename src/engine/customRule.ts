import { Meld, meldTiles, Shape } from './decompose';
import { isDragon, isHonor, isSuited, isWind, rank, suitOf, TileId } from './tiles';

/** One condition of a custom rule. Unused fields are null. (Same shape the photo server returns.) */
export interface RuleClause {
  kind: 'set' | 'pair' | 'tileCount' | 'suitsUsed' | 'winMethod' | 'winnerIsDealer' | 'concealed' | 'flowerCount' | 'pattern';
  set: 'pung' | 'kong' | 'pungOrKong' | 'chow' | 'any' | null;
  tile: TileId | null;
  suit: 'm' | 'p' | 's' | 'wind' | 'dragon' | 'honor' | null;
  rank: number | null;
  min: number | null;
  max: number | null;
  method: 'selfDraw' | 'discard' | null;
  flag: boolean | null;
  pattern: string | null;
}

export interface CustomRule {
  id: string;
  /** The group's own words. */
  text: string;
  name: string;
  /** Plain-language condition, as read back to the user. */
  when: string;
  points: number;
  payer: 'everyone' | 'discarder';
  on: boolean;
  all: RuleClause[];
}

export interface RuleFacts {
  tiles: TileId[];
  flowers: TileId[];
  shape: Shape | null;
  selfDraw: boolean;
  concealed: boolean;
  winnerIsDealer: boolean;
  /** Names of the standard patterns the hand scored. */
  patterns: string[];
}

const tileMatches = (t: TileId, c: RuleClause) => {
  if (c.tile && t !== c.tile) return false;
  if (c.suit) {
    if (c.suit === 'wind' && !isWind(t)) return false;
    if (c.suit === 'dragon' && !isDragon(t)) return false;
    if (c.suit === 'honor' && !isHonor(t)) return false;
    if ((c.suit === 'm' || c.suit === 'p' || c.suit === 's') && !(isSuited(t) && suitOf(t) === c.suit)) return false;
  }
  if (c.rank !== null && !(isSuited(t) && rank(t) === c.rank)) return false;
  return true;
};

const inRange = (n: number, c: RuleClause, defMin = 1) => n >= (c.min ?? defMin) && (c.max === null || n <= c.max);

function setMatches(m: Meld, c: RuleClause): boolean {
  const kindOk = c.set === null || c.set === 'any'
    || (c.set === 'pungOrKong' && m.kind !== 'chow')
    || c.set === m.kind;
  if (!kindOk) return false;
  if (m.kind === 'chow') return meldTiles(m).some((t) => tileMatches(t, c)) && (c.tile === null || meldTiles(m).includes(c.tile));
  return tileMatches(m.tile, c);
}

function shapeSets(shape: Shape | null): { sets: Meld[]; pair: TileId | null } {
  if (!shape) return { sets: [], pair: null };
  if (shape.type === 'standard') return { sets: shape.sets, pair: shape.pair };
  if (shape.type === 'knittedStraight') return { sets: [shape.set], pair: shape.pair };
  if (shape.type === 'thirteenOrphans') return { sets: [], pair: shape.pair };
  return { sets: [], pair: null };
}

export function clauseHolds(c: RuleClause, f: RuleFacts): boolean {
  const { sets, pair } = shapeSets(f.shape);
  switch (c.kind) {
    case 'set': return inRange(sets.filter((m) => setMatches(m, c)).length, c);
    case 'pair':
      if (f.shape?.type === 'sevenPairs') return f.shape.pairs.some((p) => tileMatches(p, c));
      return pair !== null && tileMatches(pair, c);
    case 'tileCount': return inRange(f.tiles.filter((t) => tileMatches(t, c)).length, c);
    case 'suitsUsed': return inRange(new Set(f.tiles.filter(isSuited).map(suitOf)).size, c, 0);
    case 'winMethod': return c.method === null || (c.method === 'selfDraw') === f.selfDraw;
    case 'winnerIsDealer': return c.flag === null || c.flag === f.winnerIsDealer;
    case 'concealed': return c.flag === null || c.flag === f.concealed;
    case 'flowerCount': return inRange(f.flowers.length, c);
    case 'pattern': return !!c.pattern && f.patterns.some((p) => p.toLowerCase() === c.pattern!.toLowerCase());
  }
}

/** A custom rule applies when every one of its conditions holds. */
export const ruleApplies = (r: CustomRule, f: RuleFacts) => r.all.length > 0 && r.all.every((c) => clauseHolds(c, f));
