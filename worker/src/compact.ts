// The compact photo answer: "m4 m4 p3 p4 p5?p3/p6 s1". A ? marks an unsure tile; readings after it (split by /) are alternatives.
const SUITED = ['m', 'p', 's'].flatMap((s) => [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => s + n));
const TILES = new Set([...SUITED, 'we', 'ws', 'ww', 'wn', 'dr', 'dg', 'dw']);
const FLOWERS = new Set(['f1', 'f2', 'f3', 'f4', 'x1', 'x2', 'x3', 'x4']);

export interface CompactAnswer {
  quality: 'ok' | 'blurry' | 'dark' | 'partial' | 'no_tiles';
  problem: string | null;
  tiles: string;
  flowers: string;
}

export interface Parsed {
  quality: CompactAnswer['quality'];
  problem: string | null;
  tiles: { tile: string; sure: boolean; alternatives: string[] }[];
  flowers: { tile: string; sure: boolean }[];
}

const tokens = (line: string) => line.trim().toLowerCase().split(/[\s,]+/).filter(Boolean);

/** Turn the compact line into tiles, keeping only valid ids. */
export function parseCompact(raw: CompactAnswer): Parsed {
  const tiles = tokens(raw.tiles).flatMap((tok) => {
    const [main, rest] = tok.split('?');
    if (!TILES.has(main)) return [];
    const alternatives = rest === undefined ? [] : rest.split('/').filter((a) => TILES.has(a) && a !== main);
    return [{ tile: main, sure: rest === undefined, alternatives }];
  });
  const flowers = tokens(raw.flowers).flatMap((tok) => {
    const [main, rest] = tok.split('?');
    return FLOWERS.has(main) ? [{ tile: main, sure: rest === undefined }] : [];
  });
  if (raw.quality === 'ok' && tiles.length === 0) throw new Error('reply had no tiles');
  return { quality: raw.quality, problem: raw.problem, tiles, flowers };
}
