import { describe, expect, it } from 'vitest';
import { scoreHand } from './score';
import { HOUSE_DEFAULT, PURE_MCR, RULE_TOGGLES } from './rules';
import { kongPayout, settleUp, winPayout } from './payout';
import { replay, Session } from './session';
import { decompose } from './decompose';
import { HandContext } from './fans';

const t = (s: string) => s.trim().split(/\s+/);
const ctx = (o: Partial<HandContext> = {}): HandContext => ({ seatWind: 'ws', prevalentWind: 'we', selfDraw: false, concealed: false, ...o });
const names = (r: ReturnType<typeof scoreHand>) => r.fans.map((f) => f.name).sort();

describe('payouts (PRD done checks)', () => {
  it('House default 6-point discard and self-draw', () => {
    expect(winPayout(6, HOUSE_DEFAULT, 1, 2)).toEqual([-60, 240, -120, -60]);
    expect(winPayout(6, HOUSE_DEFAULT, 1, null)).toEqual([-120, 360, -120, -120]);
  });
  it('Pure MCR 10-point discard', () => {
    expect(winPayout(10, PURE_MCR, 0, 1)).toEqual([340, -180, -80, -80]);
  });
  it('kongs paid on the spot', () => {
    expect(kongPayout('melded', HOUSE_DEFAULT, 0)).toEqual([60, -20, -20, -20]);
    expect(kongPayout('concealed', HOUSE_DEFAULT, 2)).toEqual([-40, -40, 120, -40]);
  });
  it('settle-up uses at most 3 transfers and settles to 0', () => {
    const b = [640, 110, -330, -420];
    const tr = settleUp(b);
    expect(tr.length).toBeLessThanOrEqual(3);
    const after = [...b];
    for (const x of tr) { after[x.from] += x.cents; after[x.to] -= x.cents; }
    expect(after).toEqual([0, 0, 0, 0]);
  });
});

describe('scoring', () => {
  it('the canvas example hand scores 6 for South off a discard', () => {
    const r = scoreHand({ tiles: t('m1 m2 m3 m2 m3 m4 m7 m8 m9 p2 p3 p4 p5 p5'), flowers: ['x2'], ...ctx() }, HOUSE_DEFAULT);
    expect(r.valid).toBe(true);
    expect(names(r)).toEqual(['All Chows', 'Flower · Summer', 'Mixed Double Chow', 'One Voided Suit', 'Two Terminal Chows']);
    expect(r.points).toBe(6);
  });
  const chicken = t('m2 m3 m4 p6 p7 p8 s2 s2 s2 s5 s6 s7 dr dr');
  it('Chicken Hand only with no flowers at all', () => {
    expect(scoreHand({ tiles: chicken, flowers: [], ...ctx() }, HOUSE_DEFAULT).points).toBe(8);
    const offSeat = scoreHand({ tiles: chicken, flowers: ['f1'], ...ctx() }, HOUSE_DEFAULT);
    expect(offSeat.points).toBe(0);
    expect(offSeat.belowMinimum).toBe(true);
  });
  it('a hand whose only points are a seat flower can win', () => {
    const r = scoreHand({ tiles: chicken, flowers: ['f2'], ...ctx() }, HOUSE_DEFAULT);
    expect(r.points).toBe(1);
    expect(r.belowMinimum).toBe(false);
  });
  it('full flower set adds +2 on top of the seat flower', () => {
    const r = scoreHand({ tiles: chicken, flowers: ['x1', 'x2', 'x3', 'x4'], ...ctx() }, HOUSE_DEFAULT);
    expect(r.points).toBe(3);
  });
  it('no Self-Drawn fan under House default, but there is under MCR', () => {
    const h = { tiles: chicken, flowers: [], ...ctx({ selfDraw: true }) };
    expect(names(scoreHand(h, HOUSE_DEFAULT))).not.toContain('Self-Drawn');
    expect(names(scoreHand(h, PURE_MCR))).toContain('Self-Drawn');
  });
  it('Pure MCR flags a hand under 8 points', () => {
    const r = scoreHand({ tiles: t('m1 m2 m3 m2 m3 m4 m7 m8 m9 p2 p3 p4 p5 p5'), flowers: ['x2'], ...ctx() }, PURE_MCR);
    expect(r.belowMinimum).toBe(true);
  });
  it('kongs: per-kong fans dropped when paid on the spot, Three Kongs still scores', () => {
    const hand = t('m1 m1 m1 m1 p9 p9 p9 p9 s5 s5 s5 s5 m5 m6 m7 dr dr');
    const house = scoreHand({ tiles: hand, flowers: [], ...ctx() }, HOUSE_DEFAULT);
    expect(names(house)).toContain('Three Kongs');
    expect(names(house)).not.toContain('Melded Kong');
    const one = scoreHand({ tiles: t('m1 m1 m1 m1 p2 p3 p4 s5 s6 s7 m5 m6 m7 dr dr'), flowers: [], ...ctx() }, PURE_MCR);
    expect(names(one)).toContain('Melded Kong');
  });
  it('wrong tile count and non-winning hands are blocked', () => {
    expect(scoreHand({ tiles: t('m1 m2 m3'), flowers: [], ...ctx() }, HOUSE_DEFAULT).valid).toBe(false);
    expect(scoreHand({ tiles: t('m1 m2 m4 m5 m7 m8 p1 p3 p5 p7 p9 s1 s3 s5'), flowers: [], ...ctx() }, HOUSE_DEFAULT).valid).toBe(false);
  });
  it('special shapes', () => {
    expect(decompose(t('m1 m9 p1 p9 s1 s9 we ws ww wn dr dg dw dw')).some((s) => s.type === 'thirteenOrphans')).toBe(true);
    const sp = scoreHand({ tiles: t('m1 m1 m3 m3 p5 p5 p7 p7 s2 s2 s8 s8 we we'), flowers: [], ...ctx({ concealed: true }) }, PURE_MCR);
    expect(names(sp)).toContain('Seven Pairs');
    expect(names(sp)).not.toContain('Concealed Hand');
  });
  it('big hands', () => {
    const flush = scoreHand({ tiles: t('p1 p2 p3 p4 p5 p6 p7 p8 p9 p2 p2 p2 p5 p5'), flowers: [], ...ctx() }, PURE_MCR);
    expect(names(flush)).toEqual(expect.arrayContaining(['Full Flush', 'Pure Straight']));
    expect(names(flush)).not.toContain('No Honors');
    const winds = scoreHand({ tiles: t('we we we ws ws ws ww ww ww wn wn wn m5 m5'), flowers: [], ...ctx() }, PURE_MCR);
    expect(names(winds)).toContain('Big Four Winds');
    expect(names(winds)).not.toContain('All Pungs');
  });
  it('closed wait counts only when it was the one possible tile', () => {
    const r = scoreHand({ tiles: t('m1 m2 m3 p4 p5 p6 s7 s8 s9 m4 m6 m5 dr dr'), flowers: [], ...ctx({ winningTile: 'm5' }) }, PURE_MCR);
    expect(names(r)).toContain('Closed Wait');
  });
  it('every rules toggle round-trips', () => {
    for (const tg of RULE_TOGGLES) {
      const on = tg.set(HOUSE_DEFAULT, true), off = tg.set(HOUSE_DEFAULT, false);
      expect(tg.get(on)).toBe(true);
      expect(tg.get(off)).toBe(false);
    }
  });
});

describe('session replay', () => {
  const base = (): Session => ({ id: 'x', name: 'T', createdAt: 0, players: ['A', 'B', 'C', 'D'], rules: HOUSE_DEFAULT, events: [], finished: false });
  const game = (winner: number, discarder: number | null, points: number) => ({
    type: 'game' as const, at: 0, winner, discarder, tiles: [], flowers: [], concealed: false, points, fans: [], edited: false,
    cents: winPayout(points, HOUSE_DEFAULT, winner, discarder),
  });
  it('dealer keeps the deal on a win, passes otherwise; draws pass; 4 passes advance the table wind', () => {
    const s = base();
    s.events.push(game(0, 1, 3));
    expect(replay(s).dealer).toBe(0);
    s.events.push(game(2, 1, 3));
    expect(replay(s).dealer).toBe(1);
    s.events.push({ type: 'draw', at: 0 }, { type: 'draw', at: 0 }, { type: 'draw', at: 0 });
    const st = replay(s);
    expect(st.dealer).toBe(0);
    expect(st.tableWind).toBe(1);
    expect(st.gameNumber).toBe(6);
    expect(st.balances.reduce((a, b) => a + b, 0)).toBe(0);
  });
});

describe('custom house rules', () => {
  const clause = (o: Partial<import('./customRule').RuleClause>): import('./customRule').RuleClause => ({
    kind: 'set', set: null, tile: null, suit: null, rank: null, min: null, max: null, method: null, flag: null, pattern: null, ...o,
  });
  const greenDragon = { id: 'g', text: 'If the winning hand has a pung or kong of green dragons, add 2 points.', name: 'Green dragon pung', when: '', points: 2, payer: 'everyone' as const, on: true,
    all: [clause({ kind: 'set', set: 'pungOrKong', tile: 'dg' })] };
  const fives = { ...greenDragon, id: 'f', name: 'Pair of fives', all: [clause({ kind: 'pair', rank: 5 })] };
  const hand = t('m1 m2 m3 m2 m3 m4 m7 m8 m9 p2 p3 p4 p5 p5');
  it('a matching rule that is on is added automatically', () => {
    const r = scoreHand({ tiles: hand, flowers: ['x2'], ...ctx() }, { ...HOUSE_DEFAULT, customRules: [fives, greenDragon] });
    expect(names(r)).toContain('Pair of fives');
    expect(names(r)).not.toContain('Green dragon pung');
    expect(r.points).toBe(8);
  });
  it('a rule that is off never applies', () => {
    const r = scoreHand({ tiles: hand, flowers: ['x2'], ...ctx() }, { ...HOUSE_DEFAULT, customRules: [{ ...fives, on: false }] });
    expect(r.points).toBe(6);
  });
  it('discarder-only rule points are paid by the discarder alone', () => {
    const c = winPayout(8, HOUSE_DEFAULT, 1, 2, 2);
    expect(c).toEqual([-60, 260, -140, -60]);
    expect(c.reduce((a, b) => a + b, 0)).toBe(0);
  });
});

describe('four of a tile is not always a kong', () => {
  it('1-2-3 plus a pung of 2s is a complete 14-tile hand', () => {
    const hand = t('p1 p2 p3 p2 p2 p2 m4 m5 m6 s7 s8 s9 dr dr');
    const r = scoreHand({ tiles: hand, flowers: [], ...ctx() }, PURE_MCR);
    expect(r.valid).toBe(true);
    expect(names(r)).toContain('Tile Hog');
    expect(names(r)).not.toContain('Melded Kong');
  });
  it('the same four 2s as a real kong needs the 15th tile', () => {
    const r = scoreHand({ tiles: t('p2 p2 p2 p2 p5 p6 p7 m4 m5 m6 s7 s8 s9 dr dr'), flowers: [], ...ctx() }, PURE_MCR);
    expect(r.valid).toBe(true);
    expect(names(r)).toContain('Melded Kong');
  });
});
