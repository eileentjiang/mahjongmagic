// Tile ids: m1-m9 characters, p1-p9 dots, s1-s9 bamboo,
// we ws ww wn winds, dr dg dw dragons, f1-f4 flowers, x1-x4 seasons.

export type Suit = 'm' | 'p' | 's';
export type TileId = string;

export const SUITS: Suit[] = ['m', 'p', 's'];
export const WINDS = ['we', 'ws', 'ww', 'wn'] as const;
export const DRAGONS = ['dr', 'dg', 'dw'] as const;
export type Wind = (typeof WINDS)[number];

export const SUIT_NAME: Record<Suit, string> = { m: 'Characters', p: 'Dots', s: 'Bamboo' };
export const WIND_NAME: Record<Wind, string> = { we: 'East', ws: 'South', ww: 'West', wn: 'North' };
export const WIND_ZH: Record<Wind, string> = { we: '東', ws: '南', ww: '西', wn: '北' };
export const DRAGON_NAME: Record<string, string> = { dr: 'Red dragon', dg: 'Green dragon', dw: 'White dragon' };
export const FLOWER_NAME: Record<string, string> = {
  f1: 'Plum', f2: 'Orchid', f3: 'Chrysanthemum', f4: 'Bamboo',
  x1: 'Spring', x2: 'Summer', x3: 'Autumn', x4: 'Winter',
};
export const FLOWER_ZH: Record<string, string> = {
  f1: '梅', f2: '蘭', f3: '菊', f4: '竹', x1: '春', x2: '夏', x3: '秋', x4: '冬',
};

export const isSuited = (t: TileId) => t[0] === 'm' || t[0] === 'p' || t[0] === 's';
export const isWind = (t: TileId) => t[0] === 'w';
export const isDragon = (t: TileId) => t[0] === 'd';
export const isHonor = (t: TileId) => isWind(t) || isDragon(t);
export const isFlower = (t: TileId) => t[0] === 'f' || t[0] === 'x';
export const suitOf = (t: TileId) => t[0] as Suit;
export const rank = (t: TileId) => Number(t[1]);
export const isTerminal = (t: TileId) => isSuited(t) && (rank(t) === 1 || rank(t) === 9);
export const isTerminalOrHonor = (t: TileId) => isTerminal(t) || isHonor(t);
export const flowerNumber = (t: TileId) => Number(t[1]);

/** All 34 distinct playable tiles in display order. */
export const ALL_TILES: TileId[] = [
  ...SUITS.flatMap((s) => [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => s + n)),
  ...WINDS, ...DRAGONS,
];
export const ALL_FLOWERS: TileId[] = ['f1', 'f2', 'f3', 'f4', 'x1', 'x2', 'x3', 'x4'];

export function tileName(t: TileId): string {
  if (isSuited(t)) return `${rank(t)} ${SUIT_NAME[suitOf(t)]}`;
  if (isWind(t)) return `${WIND_NAME[t as Wind]} wind`;
  if (isDragon(t)) return DRAGON_NAME[t];
  if (isFlower(t)) return `${FLOWER_NAME[t]} (${t[0] === 'f' ? 'flower' : 'season'} ${t[1]})`;
  return t;
}

/** Sort key for a stable, readable order. */
export function tileOrder(t: TileId): number {
  const i = ALL_TILES.indexOf(t);
  if (i >= 0) return i;
  return 100 + ALL_FLOWERS.indexOf(t);
}
export const sortTiles = (ts: TileId[]) => [...ts].sort((a, b) => tileOrder(a) - tileOrder(b));

export function counts(ts: TileId[]): Map<TileId, number> {
  const m = new Map<TileId, number>();
  for (const t of ts) m.set(t, (m.get(t) ?? 0) + 1);
  return m;
}

/** Seat index 0..3 → wind, relative to the dealer seat. */
export function seatWind(seatIndex: number, dealerIndex: number): Wind {
  return WINDS[(seatIndex - dealerIndex + 4) % 4];
}
