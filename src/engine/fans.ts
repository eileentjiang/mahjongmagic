import { decompose, Meld, meldTiles, Shape, waits } from './decompose';
import {
  counts, DRAGONS, isDragon, isHonor, isSuited, isTerminal, isTerminalOrHonor, isWind, rank, suitOf, Suit,
  SUITS, TileId, Wind, WIND_NAME,
} from './tiles';

export interface HandContext {
  seatWind: Wind;
  prevalentWind: Wind;
  selfDraw: boolean;
  /** No sets were melded from discards (concealed kongs allowed). */
  concealed: boolean;
  /** The tile that completed the hand. */
  winningTile?: TileId;
}

export interface FanHit {
  id: string;
  name: string;
  points: number;
  /** Plain-language reason shown under "Why it scores". */
  why: string;
  /** Per-kong fans that house rules may drop when kongs are paid on the spot. */
  perKong?: boolean;
  selfDrawn?: boolean;
  /** A custom house rule rather than a standard pattern. */
  house?: boolean;
  /** Custom rule paid only by the discarder (everyone on a self-draw). */
  discarderOnly?: boolean;
}

// Exclusions: a fan listed here is not scored when the key fan is (MCR App. 1 + non-repeat).
const EXCLUDES: Record<string, string[]> = {
  bigFourWinds: ['bigThreeWinds', 'allPungs', 'prevalentWind', 'seatWind', 'pungTH'],
  bigThreeDragons: ['twoDragonPungs', 'dragonPung'],
  nineGates: ['fullFlush', 'concealedHand', 'pungTH', 'noHonors'],
  fourKongs: ['singleWait', 'threeKongs', 'twoMeldedKongs', 'twoConcealedKongs', 'meldedKong', 'concealedKong', 'allPungs'],
  sevenShiftedPairs: ['fullFlush', 'concealedHand', 'singleWait', 'sevenPairs', 'noHonors'],
  thirteenOrphans: ['allTypes', 'concealedHand', 'singleWait'],
  allTerminals: ['allPungs', 'outsideHand', 'pungTH', 'noHonors', 'allTH'],
  littleFourWinds: ['bigThreeWinds', 'pungTH'],
  littleThreeDragons: ['dragonPung', 'twoDragonPungs'],
  allHonors: ['allPungs', 'outsideHand', 'pungTH', 'allTH'],
  fourConcealedPungs: ['allPungs', 'concealedHand', 'threeConcealedPungs', 'twoConcealedPungs'],
  pureTerminalChows: ['sevenPairs', 'fullFlush', 'allChows', 'pureDoubleChow', 'twoTerminalChows', 'noHonors'],
  quadrupleChow: ['pureTripleChow', 'tileHog', 'pureDoubleChow'],
  fourPureShiftedPungs: ['pureShiftedPungs', 'allPungs'],
  fourPureShiftedChows: ['pureShiftedChows', 'shortStraight', 'twoTerminalChows'],
  threeKongs: ['twoMeldedKongs', 'twoConcealedKongs', 'meldedKong', 'concealedKong'],
  allTH: ['allPungs', 'outsideHand', 'pungTH'],
  sevenPairs: ['concealedHand', 'singleWait'],
  greaterHonorsKnitted: ['allTypes', 'concealedHand', 'lesserHonorsKnitted'],
  allEvenPungs: ['allPungs', 'allSimples', 'noHonors'],
  fullFlush: ['noHonors', 'oneVoidedSuit'],
  pureTripleChow: ['pureDoubleChow'],
  upperTiles: ['noHonors', 'upperFour'],
  middleTiles: ['allSimples', 'noHonors'],
  lowerTiles: ['noHonors', 'lowerFour'],
  threeSuitedTerminalChows: ['mixedDoubleChow', 'twoTerminalChows', 'noHonors', 'allChows'],
  allFives: ['allSimples'],
  lesserHonorsKnitted: ['allTypes', 'concealedHand'],
  upperFour: ['noHonors'],
  lowerFour: ['noHonors'],
  bigThreeWinds: ['pungTH'],
  reversibleTiles: ['oneVoidedSuit'],
  twoConcealedKongs: ['concealedKong'],
  twoDragonPungs: ['dragonPung'],
  fullyConcealed: ['selfDrawn', 'concealedHand'],
  twoMeldedKongs: ['meldedKong'],
  allChows: ['noHonors'],
  allSimples: ['noHonors'],
  allGreen: [],
};

const DEF: Record<string, [string, number]> = {
  bigFourWinds: ['Big Four Winds', 88], bigThreeDragons: ['Big Three Dragons', 88], allGreen: ['All Green', 88],
  nineGates: ['Nine Gates', 88], fourKongs: ['Four Kongs', 88], sevenShiftedPairs: ['Seven Shifted Pairs', 88],
  thirteenOrphans: ['Thirteen Orphans', 88],
  allTerminals: ['All Terminals', 64], littleFourWinds: ['Little Four Winds', 64], littleThreeDragons: ['Little Three Dragons', 64],
  allHonors: ['All Honors', 64], fourConcealedPungs: ['Four Concealed Pungs', 64], pureTerminalChows: ['Pure Terminal Chows', 64],
  quadrupleChow: ['Quadruple Chow', 48], fourPureShiftedPungs: ['Four Pure Shifted Pungs', 48],
  fourPureShiftedChows: ['Four Pure Shifted Chows', 32], threeKongs: ['Three Kongs', 32], allTH: ['All Terminals and Honors', 32],
  sevenPairs: ['Seven Pairs', 24], greaterHonorsKnitted: ['Greater Honors and Knitted Tiles', 24], allEvenPungs: ['All Even Pungs', 24],
  fullFlush: ['Full Flush', 24], pureTripleChow: ['Pure Triple Chow', 24], pureShiftedPungs: ['Pure Shifted Pungs', 24],
  upperTiles: ['Upper Tiles', 24], middleTiles: ['Middle Tiles', 24], lowerTiles: ['Lower Tiles', 24],
  pureStraight: ['Pure Straight', 16], threeSuitedTerminalChows: ['Three-Suited Terminal Chows', 16],
  pureShiftedChows: ['Pure Shifted Chows', 16], allFives: ['All Fives', 16], triplePung: ['Triple Pung', 16],
  threeConcealedPungs: ['Three Concealed Pungs', 16],
  lesserHonorsKnitted: ['Lesser Honors and Knitted Tiles', 12], knittedStraight: ['Knitted Straight', 12],
  upperFour: ['Upper Four', 12], lowerFour: ['Lower Four', 12], bigThreeWinds: ['Big Three Winds', 12],
  mixedStraight: ['Mixed Straight', 8], reversibleTiles: ['Reversible Tiles', 8], mixedTripleChow: ['Mixed Triple Chow', 8],
  mixedShiftedPungs: ['Mixed Shifted Pungs', 8], twoConcealedKongs: ['Two Concealed Kongs', 8],
  allPungs: ['All Pungs', 6], halfFlush: ['Half Flush', 6], mixedShiftedChows: ['Mixed Shifted Chows', 6],
  allTypes: ['All Types', 6], twoDragonPungs: ['Two Dragon Pungs', 6], meldedAndConcealedKong: ['Melded and Concealed Kong', 6],
  outsideHand: ['Outside Hand', 4], fullyConcealed: ['Fully Concealed Hand', 4], twoMeldedKongs: ['Two Melded Kongs', 4],
  dragonPung: ['Dragon Pung', 2], prevalentWind: ['Prevalent Wind', 2], seatWind: ['Seat Wind', 2],
  concealedHand: ['Concealed Hand', 2], allChows: ['All Chows', 2], tileHog: ['Tile Hog', 2], doublePung: ['Double Pung', 2],
  twoConcealedPungs: ['Two Concealed Pungs', 2], concealedKong: ['Concealed Kong', 2], allSimples: ['All Simples', 2],
  pureDoubleChow: ['Pure Double Chow', 1], mixedDoubleChow: ['Mixed Double Chow', 1], shortStraight: ['Short Straight', 1],
  twoTerminalChows: ['Two Terminal Chows', 1], pungTH: ['Pung of Terminals or Honors', 1], meldedKong: ['Melded Kong', 1],
  oneVoidedSuit: ['One Voided Suit', 1], noHonors: ['No Honors', 1], edgeWait: ['Edge Wait', 1], closedWait: ['Closed Wait', 1],
  singleWait: ['Single Wait', 1], selfDrawn: ['Self-Drawn', 1],
};

const PER_KONG = new Set(['meldedKong', 'concealedKong', 'twoMeldedKongs', 'twoConcealedKongs', 'meldedAndConcealedKong']);

const SUIT_WORD: Record<Suit, string> = { m: 'Characters', p: 'Dots', s: 'Bamboo' };
const chowName = (m: Meld) => `${rank(m.tile)}-${rank(m.tile) + 1}-${rank(m.tile) + 2} ${SUIT_WORD[suitOf(m.tile)]}`;
const tileWord = (t: TileId) =>
  isSuited(t) ? `${rank(t)} ${SUIT_WORD[suitOf(t)]}` : isWind(t) ? `${WIND_NAME[t as Wind]}` : ({ dr: 'red dragons', dg: 'green dragons', dw: 'white dragons' } as Record<string, string>)[t];

interface Raw { id: string; why: string }

/** Fans that depend only on which tiles are in the hand. */
function tileFans(all: TileId[]): Raw[] {
  const out: Raw[] = [];
  const suits = new Set(all.filter(isSuited).map(suitOf));
  const honors = all.filter(isHonor);
  const suited = all.filter(isSuited);
  const hasWind = all.some(isWind), hasDragon = all.some(isDragon);
  if (honors.length === all.length) out.push({ id: 'allHonors', why: 'Every tile is a wind or a dragon.' });
  else if (all.every(isTerminal)) out.push({ id: 'allTerminals', why: 'Every tile is a 1 or a 9.' });
  else if (all.every(isTerminalOrHonor)) out.push({ id: 'allTH', why: 'Every tile is a 1, a 9, a wind or a dragon.' });
  if (all.every((t) => ['s2', 's3', 's4', 's6', 's8', 'dg'].includes(t))) out.push({ id: 'allGreen', why: 'Only green tiles: 2, 3, 4, 6, 8 Bamboo and green dragons.' });
  if (all.every((t) => ['p1', 'p2', 'p3', 'p4', 'p5', 'p8', 'p9', 's2', 's4', 's5', 's6', 's8', 's9', 'dw'].includes(t)))
    out.push({ id: 'reversibleTiles', why: 'Every tile looks the same upside down.' });
  if (suits.size === 1 && honors.length === 0) out.push({ id: 'fullFlush', why: `Every tile is ${SUIT_WORD[[...suits][0]]}.` });
  if (suits.size === 1 && honors.length > 0) out.push({ id: 'halfFlush', why: `Only ${SUIT_WORD[[...suits][0]]} plus winds or dragons.` });
  if (suits.size === 2) {
    const missing = SUITS.find((s) => !suits.has(s))!;
    out.push({ id: 'oneVoidedSuit', why: `The hand uses only two of the three suits: there are no ${SUIT_WORD[missing]} tiles.` });
  }
  if (honors.length === 0) out.push({ id: 'noHonors', why: 'No winds or dragons.' });
  if (honors.length === 0 && all.every((t) => rank(t) >= 2 && rank(t) <= 8)) out.push({ id: 'allSimples', why: 'No 1s, 9s, winds or dragons.' });
  if (suited.length === all.length) {
    const rs = all.map(rank);
    if (rs.every((r) => r >= 7)) out.push({ id: 'upperTiles', why: 'Only 7s, 8s and 9s.' });
    else if (rs.every((r) => r >= 4 && r <= 6)) out.push({ id: 'middleTiles', why: 'Only 4s, 5s and 6s.' });
    else if (rs.every((r) => r <= 3)) out.push({ id: 'lowerTiles', why: 'Only 1s, 2s and 3s.' });
    else if (rs.every((r) => r >= 6)) out.push({ id: 'upperFour', why: 'Only 6 to 9.' });
    else if (rs.every((r) => r <= 4)) out.push({ id: 'lowerFour', why: 'Only 1 to 4.' });
  }
  if (suits.size === 3 && hasWind && hasDragon) out.push({ id: 'allTypes', why: 'All five kinds: Characters, Dots, Bamboo, winds and dragons.' });
  return out;
}

/** Pick pairwise fans so they form a forest (account-once) and maximize points. */
function pairFans(items: Meld[], groupOf: number[], kinds: (a: Meld, b: Meld) => Raw | null): Raw[] {
  const edges: { i: number; j: number; raw: Raw; pts: number }[] = [];
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++) {
      if (groupOf[i] >= 0 && groupOf[i] === groupOf[j]) continue;
      const raw = kinds(items[i], items[j]);
      if (raw) edges.push({ i, j, raw, pts: DEF[raw.id][1] });
    }
  edges.sort((a, b) => b.pts - a.pts);
  const parent = items.map((_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const out: Raw[] = [];
  for (const e of edges) {
    const a = find(e.i), b = find(e.j);
    if (a === b) continue;
    parent[a] = b;
    out.push(e.raw);
  }
  return out;
}

function standardFans(sets: Meld[], pair: TileId, ctx: HandContext, all: TileId[]): Raw[] {
  const out: Raw[] = [];
  const chows = sets.filter((m) => m.kind === 'chow');
  const pungs = sets.filter((m) => m.kind !== 'chow');
  const kongs = sets.filter((m) => m.kind === 'kong');
  const windPungs = pungs.filter((m) => isWind(m.tile));
  const dragonPungs = pungs.filter((m) => isDragon(m.tile));

  // Honors.
  if (windPungs.length === 4) out.push({ id: 'bigFourWinds', why: 'Pungs of all four winds.' });
  else if (windPungs.length === 3 && isWind(pair)) out.push({ id: 'littleFourWinds', why: 'Pungs of three winds and a pair of the fourth.' });
  else if (windPungs.length === 3) out.push({ id: 'bigThreeWinds', why: 'Pungs of three winds.' });
  if (dragonPungs.length === 3) out.push({ id: 'bigThreeDragons', why: 'Pungs of all three dragons.' });
  else if (dragonPungs.length === 2 && isDragon(pair)) out.push({ id: 'littleThreeDragons', why: 'Pungs of two dragons and a pair of the third.' });
  else if (dragonPungs.length === 2) out.push({ id: 'twoDragonPungs', why: 'Two dragon pungs.' });
  else if (dragonPungs.length === 1) out.push({ id: 'dragonPung', why: `A pung of ${tileWord(dragonPungs[0].tile)}.` });
  for (const p of windPungs) {
    if (p.tile === ctx.prevalentWind) out.push({ id: 'prevalentWind', why: `A pung of ${WIND_NAME[ctx.prevalentWind]}, the table wind.` });
    if (p.tile === ctx.seatWind) out.push({ id: 'seatWind', why: `A pung of ${WIND_NAME[ctx.seatWind]}, your seat wind.` });
  }
  // Pungs of terminals/winds that aren't already counted as seat/table wind.
  for (const p of pungs) {
    if (isTerminal(p.tile) || (isWind(p.tile) && p.tile !== ctx.prevalentWind && p.tile !== ctx.seatWind))
      out.push({ id: 'pungTH', why: `A pung of ${tileWord(p.tile)}.` });
  }

  // Pung shapes.
  if (pungs.length === 4) {
    out.push({ id: 'allPungs', why: 'Four pungs or kongs and a pair.' });
    if (pungs.every((m) => isSuited(m.tile) && rank(m.tile) % 2 === 0) && isSuited(pair) && rank(pair) % 2 === 0)
      out.push({ id: 'allEvenPungs', why: 'Pungs of even numbers and an even pair.' });
  }
  const suitedPungs = pungs.filter((m) => isSuited(m.tile));
  const pungGroup = suitedPungs.map(() => -1);
  for (const s of SUITS) {
    const rs = suitedPungs.filter((m) => suitOf(m.tile) === s).map((m) => rank(m.tile)).sort((a, b) => a - b);
    for (let k = 0; k + 2 < rs.length; k++) {
      if (rs.length === 4 && rs[3] - rs[0] === 3 && new Set(rs).size === 4) { out.push({ id: 'fourPureShiftedPungs', why: `Four pungs of ${SUIT_WORD[s]} in a row.` }); break; }
      if (rs[k + 1] === rs[k] + 1 && rs[k + 2] === rs[k] + 2) {
        out.push({ id: 'pureShiftedPungs', why: `Pungs of ${rs[k]}, ${rs[k] + 1} and ${rs[k] + 2} ${SUIT_WORD[s]}.` });
        suitedPungs.forEach((m, i) => { if (suitOf(m.tile) === s && rank(m.tile) >= rs[k] && rank(m.tile) <= rs[k] + 2) pungGroup[i] = 1; });
        break;
      }
    }
  }
  for (let r = 1; r <= 9; r++) {
    const same = suitedPungs.filter((m) => rank(m.tile) === r);
    if (new Set(same.map((m) => suitOf(m.tile))).size === 3) {
      out.push({ id: 'triplePung', why: `Pungs of ${r} in all three suits.` });
      suitedPungs.forEach((m, i) => { if (rank(m.tile) === r) pungGroup[i] = 2; });
    }
  }
  for (let r = 1; r <= 7; r++) {
    for (const perm of [['m', 'p', 's'], ['m', 's', 'p'], ['p', 'm', 's'], ['p', 's', 'm'], ['s', 'm', 'p'], ['s', 'p', 'm']]) {
      const want = [perm[0] + r, perm[1] + (r + 1), perm[2] + (r + 2)];
      if (want.every((t) => suitedPungs.some((m) => m.tile === t)) && !out.some((o) => o.id === 'mixedShiftedPungs'))
        out.push({ id: 'mixedShiftedPungs', why: 'Pungs in three suits, each one higher.' });
    }
  }
  if (!out.some((o) => o.id === 'triplePung'))
    out.push(...pairFans(suitedPungs, pungGroup, (a, b) =>
      rank(a.tile) === rank(b.tile) && suitOf(a.tile) !== suitOf(b.tile) ? { id: 'doublePung', why: `Pungs of ${rank(a.tile)} in two suits.` } : null));

  // Concealed pungs: only known when the whole hand is concealed.
  if (ctx.concealed) {
    let cp = pungs.length;
    // A pung completed by a discard is melded, unless the tile could be read another way.
    if (!ctx.selfDraw && ctx.winningTile && pungs.some((m) => m.tile === ctx.winningTile) &&
        !chows.some((m) => meldTiles(m).includes(ctx.winningTile!)) && pair !== ctx.winningTile) cp -= 1;
    if (cp === 4) out.push({ id: 'fourConcealedPungs', why: 'Four pungs, all made without claiming a discard.' });
    else if (cp === 3) out.push({ id: 'threeConcealedPungs', why: 'Three pungs made without claiming a discard.' });
    else if (cp === 2) out.push({ id: 'twoConcealedPungs', why: 'Two pungs made without claiming a discard.' });
  }

  // Kongs.
  const kongsConcealed = ctx.concealed;
  if (kongs.length === 4) out.push({ id: 'fourKongs', why: 'Four kongs.' });
  else if (kongs.length === 3) out.push({ id: 'threeKongs', why: 'Three kongs.' });
  if (kongs.length === 2) out.push(kongsConcealed ? { id: 'twoConcealedKongs', why: 'Two concealed kongs.' } : { id: 'twoMeldedKongs', why: 'Two melded kongs.' });
  else if (kongs.length === 1) out.push(kongsConcealed ? { id: 'concealedKong', why: 'A concealed kong.' } : { id: 'meldedKong', why: 'A melded kong.' });

  // Chow shapes. Groups mark chows already used together in a bigger fan (non-separation).
  const group = chows.map(() => -1);
  let g = 0;
  const mark = (idxs: number[]) => { g++; idxs.forEach((i) => (group[i] = g)); };
  const bySuit = (s: Suit) => chows.map((m, i) => ({ m, i })).filter((x) => suitOf(x.m.tile) === s);
  for (const s of SUITS) {
    const cs = bySuit(s);
    const rs = cs.map((x) => rank(x.m.tile)).sort((a, b) => a - b);
    const key = rs.join('');
    if (cs.length === 4 && new Set(rs).size === 1) { out.push({ id: 'quadrupleChow', why: `Four identical ${chowName(cs[0].m)} chows.` }); mark(cs.map((x) => x.i)); continue; }
    if (cs.length === 4 && key === '1177' && pair === s + 5) { out.push({ id: 'pureTerminalChows', why: `1-2-3 and 7-8-9 twice each in ${SUIT_WORD[s]}, with a pair of 5s.` }); mark(cs.map((x) => x.i)); continue; }
    if (cs.length === 4 && ((rs[1] - rs[0] === 1 && rs[2] - rs[1] === 1 && rs[3] - rs[2] === 1) || (rs[1] - rs[0] === 2 && rs[2] - rs[1] === 2 && rs[3] - rs[2] === 2))) {
      out.push({ id: 'fourPureShiftedChows', why: `Four ${SUIT_WORD[s]} chows, each one step higher.` }); mark(cs.map((x) => x.i)); continue;
    }
    // Triple-chow shapes within one suit.
    const counted = new Map<number, number[]>();
    cs.forEach((x) => counted.set(rank(x.m.tile), [...(counted.get(rank(x.m.tile)) ?? []), x.i]));
    const triple = [...counted.entries()].find(([, v]) => v.length >= 3);
    if (triple) { out.push({ id: 'pureTripleChow', why: `Three identical ${triple[0]}-${triple[0] + 1}-${triple[0] + 2} ${SUIT_WORD[s]} chows.` }); mark(triple[1].slice(0, 3)); continue; }
    if (counted.has(1) && counted.has(4) && counted.has(7)) {
      out.push({ id: 'pureStraight', why: `1 through 9 in ${SUIT_WORD[s]}.` });
      mark([counted.get(1)![0], counted.get(4)![0], counted.get(7)![0]]); continue;
    }
    const starts = [...counted.keys()].sort((a, b) => a - b);
    let found = false;
    for (const st of [1, 2]) for (const a of starts) {
      if (!found && counted.has(a + st) && counted.has(a + 2 * st)) {
        out.push({ id: 'pureShiftedChows', why: `Three ${SUIT_WORD[s]} chows, each ${st === 1 ? 'one step' : 'two steps'} higher.` });
        mark([counted.get(a)![0], counted.get(a + st)![0], counted.get(a + 2 * st)![0]]); found = true;
      }
    }
  }
  // Across suits.
  const findChow = (t: TileId, used: Set<number>) => chows.findIndex((m, i) => m.tile === t && !used.has(i));
  const perms = [['m', 'p', 's'], ['m', 's', 'p'], ['p', 'm', 's'], ['p', 's', 'm'], ['s', 'm', 'p'], ['s', 'p', 'm']];
  const tryCross = (id: string, why: string, ranks: [number, number, number]) => {
    for (const perm of perms) {
      const used = new Set<number>();
      const idx = perm.map((s, k) => { const i = findChow(s + ranks[k], used); if (i >= 0) used.add(i); return i; });
      if (idx.every((i) => i >= 0) && idx.every((i) => group[i] < 0)) { out.push({ id, why }); mark(idx); return true; }
    }
    return false;
  };
  if (!tryCross('mixedStraight', '1-2-3, 4-5-6 and 7-8-9, one in each suit.', [1, 4, 7])) {
    let done = false;
    for (let r = 1; r <= 7 && !done; r++) done = tryCross('mixedTripleChow', `The same ${r}-${r + 1}-${r + 2} chow in all three suits.`, [r, r, r]);
    for (let r = 1; r <= 5 && !done; r++) done = tryCross('mixedShiftedChows', 'Chows in three suits, each one step higher.', [r, r + 1, r + 2]);
  }
  // Three-suited terminal chows: 123+789 in two suits, pair of 5s in the third.
  for (const s of SUITS) {
    if (pair !== s + 5) continue;
    const others = SUITS.filter((x) => x !== s);
    if (chows.length === 4 && others.every((o) => chows.some((m) => m.tile === o + 1) && chows.some((m) => m.tile === o + 7)))
      { out.push({ id: 'threeSuitedTerminalChows', why: '1-2-3 and 7-8-9 in two suits with a pair of 5s in the third.' }); mark(chows.map((_, i) => i)); }
  }
  out.push(...pairFans(chows, group, (a, b) => {
    const sa = suitOf(a.tile), sb = suitOf(b.tile), ra = rank(a.tile), rb = rank(b.tile);
    if (sa === sb && ra === rb) return { id: 'pureDoubleChow', why: `Two identical ${chowName(a)} chows.` };
    if (sa !== sb && ra === rb) return { id: 'mixedDoubleChow', why: `The same run in two suits: ${chowName(a)} and ${chowName(b)}.` };
    if (sa === sb && Math.abs(ra - rb) === 3) return { id: 'shortStraight', why: `${chowName(ra < rb ? a : b)} and ${chowName(ra < rb ? b : a)} make a six-tile run.` };
    if (sa === sb && Math.abs(ra - rb) === 6) return { id: 'twoTerminalChows', why: `1-2-3 and 7-8-9 in the same suit: here both in ${SUIT_WORD[sa]}.` };
    return null;
  }));

  if (chows.length === 4 && isSuited(pair)) out.push({ id: 'allChows', why: 'Every set is a chow (a run of three in one suit) and there are no winds or dragons.' });
  if ([...sets.map((m) => meldTiles(m)), [pair, pair]].every((ts) => ts.some(isTerminalOrHonor))) out.push({ id: 'outsideHand', why: 'Every set and the pair has a 1, 9, wind or dragon.' });
  if ([...sets.map((m) => meldTiles(m)), [pair, pair]].every((ts) => ts.some((t) => isSuited(t) && rank(t) === 5))) out.push({ id: 'allFives', why: 'Every set and the pair has a 5.' });

  // Tile hog: four of a tile used without a kong.
  const c = counts(all);
  for (const [t, n] of c) if (n === 4 && !kongs.some((k) => k.tile === t)) out.push({ id: 'tileHog', why: `All four ${tileWord(t)} are used without a kong.` });

  // Nine Gates: 1112345678999 + any one in the suit, concealed.
  if (ctx.concealed && kongs.length === 0) {
    const s = suitOf(all[0]);
    if (all.every((t) => isSuited(t) && suitOf(t) === s)) {
      const need = [3, 1, 1, 1, 1, 1, 1, 1, 3];
      if (need.every((n, i) => (c.get(s + (i + 1)) ?? 0) >= n)) out.push({ id: 'nineGates', why: `1-1-1-2-3-4-5-6-7-8-9-9-9 in ${SUIT_WORD[s]} plus one more.` });
    }
  }

  // Wait fans: only when the hand could only have won on this one tile.
  if (ctx.winningTile) {
    const before = [...all];
    before.splice(before.indexOf(ctx.winningTile), 1);
    if (waits(before).length === 1) {
      const w = ctx.winningTile;
      if (pair === w) out.push({ id: 'singleWait', why: 'You could only win on the tile that completed your pair.' });
      else {
        const ch = chows.find((m) => meldTiles(m).includes(w));
        if (ch && rank(w) === rank(ch.tile) + 1) out.push({ id: 'closedWait', why: 'You could only win on the middle tile of a run.' });
        else if (ch && ((rank(ch.tile) === 1 && rank(w) === 3) || (rank(ch.tile) === 7 && rank(w) === 7))) out.push({ id: 'edgeWait', why: 'You could only win on the 3 of 1-2-3 or the 7 of 7-8-9.' });
      }
    }
  }
  return out;
}

function contextFans(ctx: HandContext, special: boolean): Raw[] {
  const out: Raw[] = [];
  if (ctx.concealed && ctx.selfDraw) out.push({ id: 'fullyConcealed', why: 'No sets claimed from discards, and you drew the winning tile yourself.' });
  else if (ctx.concealed && !ctx.selfDraw && !special) out.push({ id: 'concealedHand', why: 'No sets claimed from discards before the winning tile.' });
  if (ctx.selfDraw) out.push({ id: 'selfDrawn', why: 'You drew the winning tile from the wall.' });
  return out;
}

function finalize(raws: Raw[]): FanHit[] {
  const excluded = new Set<string>();
  // Highest first: a fan that's already excluded doesn't exclude others.
  const sorted = [...new Set(raws.map((r) => r.id))].sort((a, b) => DEF[b][1] - DEF[a][1]);
  for (const id of sorted) if (!excluded.has(id)) for (const x of EXCLUDES[id] ?? []) excluded.add(x);
  return raws.filter((r) => !excluded.has(r.id)).map((r) => ({
    id: r.id, name: DEF[r.id][0], points: DEF[r.id][1], why: r.why,
    perKong: PER_KONG.has(r.id) || undefined, selfDrawn: r.id === 'selfDrawn' || undefined,
  }));
}

export interface FanResult { fans: FanHit[]; shape: Shape | null }

/** Every fan for the best reading of the hand (flowers not included). */
export function detectFans(tiles: TileId[], ctx: HandContext): FanResult {
  const shapes = decompose(tiles);
  if (!shapes.length) return { fans: [], shape: null };
  let best: FanResult = { fans: [], shape: null };
  let bestPts = -1;
  for (const shape of shapes) {
    const raws: Raw[] = [];
    if (shape.type === 'standard') raws.push(...standardFans(shape.sets, shape.pair, ctx, tiles));
    if (shape.type === 'sevenPairs') {
      const ps = shape.pairs.map((t) => ({ t, s: isSuited(t) ? suitOf(t) : '', r: isSuited(t) ? rank(t) : 0 })).sort((a, b) => a.r - b.r);
      const shifted = ps.every((p) => p.s && p.s === ps[0].s) && ps.every((p, i) => i === 0 || p.r === ps[i - 1].r + 1);
      raws.push(shifted ? { id: 'sevenShiftedPairs', why: 'Seven pairs in a row in one suit.' } : { id: 'sevenPairs', why: 'Seven pairs.' });
      const c = counts(tiles);
      for (const [t, n] of c) if (n === 4) raws.push({ id: 'tileHog', why: `All four ${tileWord(t)} are in the hand.` });
    }
    if (shape.type === 'thirteenOrphans') raws.push({ id: 'thirteenOrphans', why: 'One of every 1, 9, wind and dragon, plus a pair of one of them.' });
    if (shape.type === 'honorsKnitted') raws.push(shape.greater
      ? { id: 'greaterHonorsKnitted', why: 'All seven winds and dragons plus seven knitted suit tiles.' }
      : { id: 'lesserHonorsKnitted', why: 'Fourteen single tiles: winds, dragons and knitted suit tiles.' });
    if (shape.type === 'knittedStraight') {
      raws.push({ id: 'knittedStraight', why: '1-4-7, 2-5-8 and 3-6-9, each in a different suit.' });
      raws.push(...standardFans([shape.set], shape.pair, { ...ctx, winningTile: undefined }, tiles).filter((r) =>
        ['dragonPung', 'prevalentWind', 'seatWind', 'pungTH', 'tileHog'].includes(r.id)));
    }
    raws.push(...tileFans(tiles));
    raws.push(...contextFans(ctx, shape.type !== 'standard' && shape.type !== 'knittedStraight'));
    const fans = finalize(raws);
    const pts = fans.reduce((a, f) => a + f.points, 0);
    if (pts > bestPts) { bestPts = pts; best = { fans, shape }; }
  }
  return best;
}

export { DRAGONS };
