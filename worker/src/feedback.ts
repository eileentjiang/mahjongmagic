// Photo-reading accuracy: compare what the model read with what the players confirmed.
// Tile names only; no photos are involved.

export interface ReadTile { tile: string; sure: boolean }

export interface Feedback {
  model: string;
  read: ReadTile[];
  final: string[];
  flowersRead: string[];
  flowersFinal: string[];
}

export interface Comparison {
  tiles: number;
  /** Tiles the model got wrong (substituted or missing). */
  wrong: number;
  /** Wrong tiles the model claimed to be sure about: the costly kind. */
  silentWrong: number;
  /** Tiles the model flagged as unsure. */
  flagged: number;
  /** Of those, how many really were wrong. */
  flaggedWrong: number;
  /** Tiles the model missed entirely, or added that weren't there. */
  missed: number;
  extra: number;
  flowersWrong: number;
  /** "read>actual" pairs, e.g. "p8>p3". */
  confusions: string[];
}

function multisetMinus(a: string[], b: string[]): string[] {
  const left = [...b];
  const out: string[] = [];
  for (const x of a) {
    const i = left.indexOf(x);
    if (i >= 0) left.splice(i, 1); else out.push(x);
  }
  return out;
}

export function compare(f: Feedback): Comparison {
  const read = f.read.map((r) => r.tile);
  const c: Comparison = { tiles: f.final.length, wrong: 0, silentWrong: 0, flagged: f.read.filter((r) => !r.sure).length, flaggedWrong: 0, missed: 0, extra: 0, flowersWrong: 0, confusions: [] };

  if (read.length === f.final.length) {
    // Same length: corrections were made in place, so compare position by position.
    f.read.forEach((r, i) => {
      if (r.tile === f.final[i]) return;
      c.wrong++;
      if (r.sure) c.silentWrong++; else c.flaggedWrong++;
      c.confusions.push(`${r.tile}>${f.final[i]}`);
    });
  } else {
    // Tiles were added or removed: compare as bags of tiles.
    const misread = multisetMinus(read, f.final);   // read but not in the final hand
    const missing = multisetMinus(f.final, read);   // in the final hand but never read
    const pairs = Math.min(misread.length, missing.length);
    for (let i = 0; i < pairs; i++) c.confusions.push(`${misread[i]}>${missing[i]}`);
    c.extra = misread.length - pairs;
    c.missed = missing.length - pairs;
    c.wrong = pairs + c.missed;
    const sureLeft = f.read.filter((r) => r.sure).map((r) => r.tile);
    c.silentWrong = misread.filter((t) => { const i = sureLeft.indexOf(t); if (i >= 0) { sureLeft.splice(i, 1); return true; } return false; }).length;
    c.flaggedWrong = misread.length - c.silentWrong;
  }
  c.flowersWrong = multisetMinus(f.flowersRead, f.flowersFinal).length + multisetMinus(f.flowersFinal, f.flowersRead).length;
  return c;
}

export interface ModelStats {
  photos: number;
  tiles: number;
  wrong: number;
  silentWrong: number;
  flagged: number;
  flaggedWrong: number;
  missed: number;
  extra: number;
  flowersWrong: number;
  perfectPhotos: number;
  confusions: Record<string, number>;
}

export const emptyStats = (): ModelStats => ({ photos: 0, tiles: 0, wrong: 0, silentWrong: 0, flagged: 0, flaggedWrong: 0, missed: 0, extra: 0, flowersWrong: 0, perfectPhotos: 0, confusions: {} });

export function addTo(s: ModelStats, c: Comparison): ModelStats {
  const confusions = { ...s.confusions };
  for (const k of c.confusions) confusions[k] = (confusions[k] ?? 0) + 1;
  return {
    photos: s.photos + 1, tiles: s.tiles + c.tiles, wrong: s.wrong + c.wrong, silentWrong: s.silentWrong + c.silentWrong,
    flagged: s.flagged + c.flagged, flaggedWrong: s.flaggedWrong + c.flaggedWrong, missed: s.missed + c.missed, extra: s.extra + c.extra,
    flowersWrong: s.flowersWrong + c.flowersWrong,
    perfectPhotos: s.perfectPhotos + (c.wrong === 0 && c.extra === 0 && c.flowersWrong === 0 ? 1 : 0),
    confusions,
  };
}
