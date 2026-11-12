import { detectFans, FanHit, HandContext } from './fans';
import { RuleSet } from './rules';
import { ruleApplies } from './customRule';
import { flowerNumber, isFlower, TileId, Wind, WINDS } from './tiles';

export interface ScoreInput extends HandContext {
  tiles: TileId[];
  flowers: TileId[];
  winnerIsDealer?: boolean;
}

export interface ScoreResult {
  valid: boolean;
  /** Why the hand can't be scored yet (wrong count, not a winning hand). */
  problem?: string;
  fans: FanHit[];
  points: number;
  /** Below the rule set's minimum. */
  belowMinimum: boolean;
  capped: boolean;
}

const seatNumber = (w: Wind) => WINDS.indexOf(w) + 1;

export function flowerFans(flowers: TileId[], seat: Wind, rules: RuleSet): FanHit[] {
  const out: FanHit[] = [];
  const mine = rules.ownSeatFlowersOnly ? flowers.filter((f) => flowerNumber(f) === seatNumber(seat)) : flowers;
  for (const f of mine) {
    out.push({
      id: 'flower', name: `Flower · ${({ f1: 'Plum', f2: 'Orchid', f3: 'Chrysanthemum', f4: 'Bamboo', x1: 'Spring', x2: 'Summer', x3: 'Autumn', x4: 'Winter' } as Record<string, string>)[f]}`,
      points: 1,
      why: rules.ownSeatFlowersOnly
        ? `A flower that matches your seat number (${seatNumber(seat)}).`
        : 'Every flower is worth 1 point.',
    });
  }
  if (rules.fullFlowerSetBonus > 0) {
    for (const [prefix, label] of [['f', 'flowers'], ['x', 'seasons']] as const) {
      if ([1, 2, 3, 4].every((n) => flowers.includes(prefix + n)))
        out.push({ id: 'fullSet', name: `Full set of ${label}`, points: rules.fullFlowerSetBonus, why: `All four ${label}.` });
    }
  }
  return out;
}

export function scoreHand(input: ScoreInput, rules: RuleSet): ScoreResult {
  const tiles = input.tiles.filter((t) => !isFlower(t));
  const flowers = [...input.flowers, ...input.tiles.filter(isFlower)];
  const empty = { fans: [], points: 0, belowMinimum: false, capped: false };
  const kongs = Math.max(0, tiles.length - 14);
  if (tiles.length < 14) return { ...empty, valid: false, problem: `Add ${14 - tiles.length} more tile${14 - tiles.length === 1 ? '' : 's'}.` };
  const { fans: raw, shape } = detectFans(tiles, input);
  if (!shape) return { ...empty, valid: false, problem: kongs > 0 ? 'This isn’t a winning hand. Check that each kong has all four tiles.' : 'This isn’t a winning hand: the tiles don’t make four sets and a pair.' };

  let fans = raw;
  if (rules.noSelfDrawnFan) fans = fans.filter((f) => !f.selfDrawn);
  if (rules.kongsPaidOnSpot) fans = fans.filter((f) => !f.perKong);
  const flowerHits = flowerFans(flowers, input.seatWind, rules);
  const handPoints = fans.reduce((a, f) => a + f.points, 0);

  // Chicken Hand: nothing else scores (and, under house rules, no flowers held at all).
  if (handPoints === 0 && (!rules.chickenNeedsNoFlowers || flowers.length === 0)) {
    fans = [{ id: 'chicken', name: 'Chicken Hand', points: 8, why: rules.chickenNeedsNoFlowers ? 'Nothing else scores and you hold no flowers.' : 'Nothing else scores.' }];
  }
  const standard = [...fans, ...flowerHits];
  const houseHits: FanHit[] = (rules.customRules ?? []).filter((r) => r.on && ruleApplies(r, {
    tiles, flowers, shape, selfDraw: input.selfDraw, concealed: input.concealed,
    winnerIsDealer: !!input.winnerIsDealer, patterns: standard.map((f) => f.name),
  })).map((r) => ({
    id: 'custom:' + r.id, name: r.name, points: r.points, house: true, discarderOnly: r.payer === 'discarder' || undefined,
    why: `Your rule: “${r.text}”`,
  }));
  const all = [...standard, ...houseHits];
  let points = all.reduce((a, f) => a + f.points, 0);
  const toward = rules.flowersCountToMinimum ? points : points - flowerHits.reduce((a, f) => a + f.points, 0);
  let capped = false;
  if (rules.pointCap > 0 && points > rules.pointCap) { points = rules.pointCap; capped = true; }
  return { valid: true, fans: all, points, belowMinimum: toward < rules.minPoints, capped };
}
