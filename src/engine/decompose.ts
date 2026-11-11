import { ALL_TILES, counts, isHonor, isSuited, rank, suitOf, SUITS, TileId, WINDS, DRAGONS, isTerminalOrHonor } from './tiles';

export type SetKind = 'chow' | 'pung' | 'kong';
export interface Meld {
  kind: SetKind;
  /** Lowest tile of a chow, or the repeated tile of a pung/kong. */
  tile: TileId;
}

export type Shape =
  | { type: 'standard'; sets: Meld[]; pair: TileId }
  | { type: 'sevenPairs'; pairs: TileId[] }
  | { type: 'thirteenOrphans'; pair: TileId }
  | { type: 'honorsKnitted'; greater: boolean }
  | { type: 'knittedStraight'; knit: TileId[]; set: Meld; pair: TileId };

export const meldTiles = (m: Meld): TileId[] => {
  if (m.kind === 'chow') {
    const s = suitOf(m.tile), r = rank(m.tile);
    return [s + r, s + (r + 1), s + (r + 2)];
  }
  return Array(m.kind === 'kong' ? 4 : 3).fill(m.tile);
};

/** Split tiles (counts) into n sets + 1 pair. Returns every distinct split. */
function standardSplits(c: Map<TileId, number>, setsNeeded: number): { sets: Meld[]; pair: TileId }[] {
  const out: { sets: Meld[]; pair: TileId }[] = [];
  const seen = new Set<string>();
  const tiles = ALL_TILES;
  const rec = (sets: Meld[], pair: TileId | null) => {
    const first = tiles.find((t) => (c.get(t) ?? 0) > 0);
    if (!first) {
      if (pair && sets.length === setsNeeded) {
        const key = sets.map((m) => m.kind + m.tile).sort().join(',') + '|' + pair;
        if (!seen.has(key)) { seen.add(key); out.push({ sets: [...sets], pair }); }
      }
      return;
    }
    const n = c.get(first)!;
    if (!pair && n >= 2) {
      c.set(first, n - 2); rec(sets, first); c.set(first, n);
    }
    if (n >= 3 && sets.length < setsNeeded) {
      c.set(first, n - 3); sets.push({ kind: 'pung', tile: first }); rec(sets, pair); sets.pop(); c.set(first, n);
    }
    if (isSuited(first) && rank(first) <= 7 && sets.length < setsNeeded) {
      const s = suitOf(first), r = rank(first);
      const b = s + (r + 1), d = s + (r + 2);
      if ((c.get(b) ?? 0) > 0 && (c.get(d) ?? 0) > 0) {
        c.set(first, n - 1); c.set(b, c.get(b)! - 1); c.set(d, c.get(d)! - 1);
        sets.push({ kind: 'chow', tile: first }); rec(sets, pair); sets.pop();
        c.set(first, n); c.set(b, c.get(b)! + 1); c.set(d, c.get(d)! + 1);
      }
    }
  };
  rec([], null);
  return out;
}

function combos<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [h, ...rest] = arr;
  return [...combos(rest, k - 1).map((c) => [h, ...c]), ...combos(rest, k)];
}

const KNIT_PERMS: [string, string, string][] = [
  ['m', 'p', 's'], ['m', 's', 'p'], ['p', 'm', 's'], ['p', 's', 'm'], ['s', 'm', 'p'], ['s', 'p', 'm'],
];
const knittedSet = (perm: [string, string, string]) => [
  perm[0] + 1, perm[0] + 4, perm[0] + 7, perm[1] + 2, perm[1] + 5, perm[1] + 8, perm[2] + 3, perm[2] + 6, perm[2] + 9,
];

/**
 * Every way to read the hand. `tiles` excludes flowers. A hand of 14 + k tiles
 * holds k kongs (4 identical tiles each).
 */
export function decompose(tiles: TileId[]): Shape[] {
  const kongCount = tiles.length - 14;
  if (kongCount < 0 || kongCount > 4) return [];
  const c = counts(tiles);
  for (const [, n] of c) if (n > 4) return [];
  const shapes: Shape[] = [];

  const fours = [...c.entries()].filter(([, n]) => n === 4).map(([t]) => t);
  for (const ks of combos(fours, kongCount)) {
    const cc = new Map(c);
    for (const k of ks) cc.set(k, 0);
    for (const split of standardSplits(cc, 4 - kongCount)) {
      shapes.push({ type: 'standard', sets: [...ks.map((t) => ({ kind: 'kong' as const, tile: t })), ...split.sets], pair: split.pair });
    }
  }
  if (kongCount > 0) return shapes;

  // Seven pairs (a four-of-a-kind counts as two pairs).
  if ([...c.values()].every((n) => n === 2 || n === 4)) {
    shapes.push({ type: 'sevenPairs', pairs: [...c.entries()].flatMap(([t, n]) => Array(n / 2).fill(t)) });
  }
  // Thirteen orphans.
  const orphans = ALL_TILES.filter(isTerminalOrHonor);
  if (orphans.every((t) => (c.get(t) ?? 0) >= 1) && [...c.keys()].every(isTerminalOrHonor)) {
    const pair = orphans.find((t) => c.get(t) === 2);
    if (pair) shapes.push({ type: 'thirteenOrphans', pair });
  }
  for (const perm of KNIT_PERMS) {
    const knit = knittedSet(perm);
    // Honors and knitted tiles: 14 different singles.
    if ([...c.values()].every((n) => n === 1) && [...c.keys()].every((t) => isHonor(t) || knit.includes(t))) {
      const honors = [...c.keys()].filter(isHonor).length;
      shapes.push({ type: 'honorsKnitted', greater: honors === 7 });
    }
    // Knitted straight + one set + pair.
    if (knit.every((t) => (c.get(t) ?? 0) >= 1)) {
      const cc = new Map(c);
      for (const t of knit) cc.set(t, cc.get(t)! - 1);
      for (const split of standardSplits(cc, 1)) {
        shapes.push({ type: 'knittedStraight', knit, set: split.sets[0], pair: split.pair });
      }
    }
  }
  return shapes;
}

export const isWinningHand = (tiles: TileId[]) => decompose(tiles).length > 0;

/** Tiles that would complete a 13-tile (+kongs) hand. */
export function waits(tiles: TileId[]): TileId[] {
  const c = counts(tiles);
  return ALL_TILES.filter((t) => (c.get(t) ?? 0) < 4 && isWinningHand([...tiles, t]));
}

export { WINDS, DRAGONS, SUITS };
