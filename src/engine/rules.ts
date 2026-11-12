import type { CustomRule } from './customRule';

/** A rule set is plain data: every house rule is a setting the engine reads. */
export interface RuleSet {
  base: 'house' | 'mcr';
  /** Cents per point. */
  scaleCents: number;
  /** Minimum points to win. */
  minPoints: number;
  flowersCountToMinimum: boolean;
  /** MCR +8 base payments. */
  plus8: boolean;
  /** On a discard, everyone pays H and the discarder pays 2H. Off: only the discarder pays H. */
  discarderPaysDouble: boolean;
  /** On a self-draw each player pays H × this. */
  selfDrawMultiplier: number;
  dealerKeepsDealOnWin: boolean;
  dealerKeepsDealOnDraw: boolean;
  ownSeatFlowersOnly: boolean;
  /** Bonus points for all 4 flowers or all 4 seasons (0 = off). */
  fullFlowerSetBonus: number;
  /** Kongs paid when declared (and their per-kong fans dropped from a win). */
  kongsPaidOnSpot: boolean;
  meldedKongPoints: number;
  concealedKongPoints: number;
  /** Don't add the 1-pt Self-Drawn fan. */
  noSelfDrawnFan: boolean;
  /** Chicken Hand only when the hand holds no flowers at all. */
  chickenNeedsNoFlowers: boolean;
  /** 0 = no cap. */
  pointCap: number;
  /** The group's own rules, written in plain language and checked against every hand. */
  customRules?: CustomRule[];
}

export const HOUSE_DEFAULT: RuleSet = {
  base: 'house',
  scaleCents: 10,
  minPoints: 1,
  flowersCountToMinimum: true,
  plus8: false,
  discarderPaysDouble: true,
  selfDrawMultiplier: 2,
  dealerKeepsDealOnWin: true,
  dealerKeepsDealOnDraw: false,
  ownSeatFlowersOnly: true,
  fullFlowerSetBonus: 2,
  kongsPaidOnSpot: true,
  meldedKongPoints: 2,
  concealedKongPoints: 4,
  noSelfDrawnFan: true,
  chickenNeedsNoFlowers: true,
  pointCap: 0,
};

export const PURE_MCR: RuleSet = {
  base: 'mcr',
  scaleCents: 10,
  minPoints: 8,
  flowersCountToMinimum: false,
  plus8: true,
  discarderPaysDouble: false,
  selfDrawMultiplier: 1,
  dealerKeepsDealOnWin: false,
  dealerKeepsDealOnDraw: false,
  ownSeatFlowersOnly: false,
  fullFlowerSetBonus: 0,
  kongsPaidOnSpot: false,
  meldedKongPoints: 2,
  concealedKongPoints: 4,
  noSelfDrawnFan: false,
  chickenNeedsNoFlowers: false,
  pointCap: 0,
};

/** The toggles shown on the Rules screen, each mapped to settings. */
export interface RuleToggle {
  key: string;
  name: string;
  desc: string;
  get: (r: RuleSet) => boolean;
  set: (r: RuleSet, on: boolean) => RuleSet;
}

export const RULE_TOGGLES: RuleToggle[] = [
  { key: 'min', name: 'Win with any points', desc: 'Minimum is more than 0, flowers count',
    get: (r) => r.minPoints <= 1 && r.flowersCountToMinimum,
    set: (r, on) => ({ ...r, minPoints: on ? 1 : 8, flowersCountToMinimum: on }) },
  { key: 'disc', name: 'Discarder pays double', desc: 'Discarder pays 2×, others pay 1×',
    get: (r) => r.discarderPaysDouble && !r.plus8,
    set: (r, on) => ({ ...r, discarderPaysDouble: on, plus8: on ? false : r.plus8 }) },
  { key: 'self', name: 'Self-draw pays double', desc: 'All three pay 2× the hand',
    get: (r) => r.selfDrawMultiplier === 2 && !r.plus8,
    set: (r, on) => ({ ...r, selfDrawMultiplier: on ? 2 : 1, noSelfDrawnFan: on, plus8: on ? false : r.plus8 }) },
  { key: 'dealer', name: 'Dealer keeps deal on a win', desc: 'Otherwise the dice move on',
    get: (r) => r.dealerKeepsDealOnWin, set: (r, on) => ({ ...r, dealerKeepsDealOnWin: on }) },
  { key: 'flowers', name: 'Own-seat flowers only', desc: '1 pt per flower matching your seat',
    get: (r) => r.ownSeatFlowersOnly, set: (r, on) => ({ ...r, ownSeatFlowersOnly: on }) },
  { key: 'set', name: 'Full flower set +2', desc: 'All 4 flowers or all 4 seasons',
    get: (r) => r.fullFlowerSetBonus > 0, set: (r, on) => ({ ...r, fullFlowerSetBonus: on ? 2 : 0 }) },
  { key: 'kong', name: 'Kongs paid on the spot', desc: 'Melded 2 pts · concealed 4 pts',
    get: (r) => r.kongsPaidOnSpot, set: (r, on) => ({ ...r, kongsPaidOnSpot: on }) },
  { key: 'cap', name: 'Point cap', desc: 'Limit a hand to 88 points',
    get: (r) => r.pointCap > 0, set: (r, on) => ({ ...r, pointCap: on ? 88 : 0 }) },
];

export const isHouseDefault = (r: RuleSet) =>
  (Object.keys(HOUSE_DEFAULT) as (keyof RuleSet)[]).every((k) => k === 'scaleCents' || r[k] === HOUSE_DEFAULT[k]);
export const isPureMcr = (r: RuleSet) =>
  (Object.keys(PURE_MCR) as (keyof RuleSet)[]).every((k) => k === 'scaleCents' || r[k] === PURE_MCR[k]);

export const money = (cents: number, sign = false) => {
  const s = '$' + (Math.abs(cents) / 100).toFixed(2);
  if (!sign) return cents < 0 ? '−' + s : s;
  return cents > 0 ? '+' + s : cents < 0 ? '−' + s : s;
};

export function rulesSummary(r: RuleSet): string {
  const preset = isHouseDefault(r) ? 'House default' : isPureMcr(r) ? 'Pure MCR' : 'Custom rules';
  return `Hong Kong style · ${preset} · ${money(r.scaleCents)}/pt`;
}
