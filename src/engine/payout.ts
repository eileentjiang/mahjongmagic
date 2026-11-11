import { RuleSet } from './rules';

/** Cents each seat receives (+) or pays (−). Always sums to 0. */
export function winPayout(points: number, rules: RuleSet, winner: number, discarder: number | null): number[] {
  const out = [0, 0, 0, 0];
  const H = points * rules.scaleCents;
  const base8 = 8 * rules.scaleCents;
  for (let i = 0; i < 4; i++) {
    if (i === winner) continue;
    let pay: number;
    if (rules.plus8) {
      pay = discarder === null || i === discarder ? H + base8 : base8;
    } else if (discarder === null) {
      pay = H * rules.selfDrawMultiplier;
    } else if (rules.discarderPaysDouble) {
      pay = i === discarder ? 2 * H : H;
    } else {
      pay = i === discarder ? H : 0;
    }
    out[i] -= pay;
    out[winner] += pay;
  }
  return out;
}

export type KongKind = 'melded' | 'concealed' | 'selfDrawn';

export function kongPayout(kind: KongKind, rules: RuleSet, owner: number): number[] {
  const pts = kind === 'melded' ? rules.meldedKongPoints : rules.concealedKongPoints;
  const each = pts * rules.scaleCents;
  return [0, 1, 2, 3].map((i) => (i === owner ? each * 3 : -each));
}

/** Fewest transfers that settle everyone to 0 (greedy largest-first; at most 3 for 4 players). */
export function settleUp(balances: number[]): { from: number; to: number; cents: number }[] {
  const debt = balances.map((b, i) => ({ i, b })).filter((x) => x.b < 0).map((x) => ({ ...x, b: -x.b }));
  const cred = balances.map((b, i) => ({ i, b })).filter((x) => x.b > 0);
  const out: { from: number; to: number; cents: number }[] = [];
  debt.sort((a, b) => b.b - a.b); cred.sort((a, b) => b.b - a.b);
  let d = 0, c = 0;
  while (d < debt.length && c < cred.length) {
    const amt = Math.min(debt[d].b, cred[c].b);
    if (amt > 0) out.push({ from: debt[d].i, to: cred[c].i, cents: amt });
    debt[d].b -= amt; cred[c].b -= amt;
    if (debt[d].b === 0) d++;
    if (cred[c].b === 0) c++;
  }
  return out;
}
