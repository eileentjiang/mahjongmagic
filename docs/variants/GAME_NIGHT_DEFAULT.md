# Default house profile: "Game Night" (the owner's rules)

**Status:** the app's **default** for v1. The owner will refine it after test nights, so every value here is a **setting**, not a hard-coded rule. Users can change any of it (PRD Feature A3/A4).

**How it's built:** the base rulebook is [MCR](./MCR.md) (the 81 fan and their combining rules) plus the house rules below. Anything not listed here follows MCR.

---

## 1. House rules

| Rule | Game Night default | MCR, for comparison |
|---|---|---|
| **Minimum to win** | **More than 0 points** (any scoring hand wins) | 8 points, not counting flowers |
| **Payout scale** | **$0.10 per point.** Hand value H = points × $0.10 | n/a |
| **Win by discard** | The discarder (the "big loser") pays **2 × H**. The other two pay **1 × H** each | Discarder pays points + 8; others pay 8 |
| **Win by self-draw** | Everyone's payment doubles: **each of the 3 pays 2 × H** | Each pays points + 8 |
| **+8 base** | **Not used** | Used |
| **Dealer ("the dice")** | **The dealer keeps the deal if they win.** Otherwise it passes to the next player (the dealer's right, counter-clockwise) | Passes every hand |
| **Flowers** | A flower only scores if it **matches your seat number** | 1 pt per flower, any seat |
| **Full flower set** | A **complete set** (all 4 flowers, or all 4 seasons) scores a **fixed bonus** | No bonus |
| **Point cap** | None | None |

### Seat numbers and flowers
| Seat | # | Matching flower tiles |
|---|---|---|
| East (dealer) | 1 | Spring · Plum |
| South | 2 | Summer · Orchid |
| West | 3 | Autumn · Chrysanthemum |
| North | 4 | Winter · Bamboo |

When the deal passes, everyone's seat wind and **flower # change**. The app announces "New flower numbers!" (PRD Feature D).

## 2. Payout examples (at $0.10 per point)
| Hand | Win type | Discarder | Each other player | Winner |
|---|---|---|---|---|
| 6 points (H = $0.60) | Discard | −$1.20 | −$0.60 | **+$2.40** |
| 6 points | Self-draw | n/a | −$1.20 (all three) | **+$3.60** |
| 10 points (H = $1.00) | Discard | −$2.00 | −$1.00 | **+$4.00** |
| 10 points | Self-draw | n/a | −$2.00 (all three) | **+$6.00** |

In short: **discard → winner gets 4 × H, self-draw → winner gets 6 × H.** Every hand nets to $0.

## 3. Open questions (settle during test nights)
1. **Value of a seat-matching flower:** 1 point each? *(Proposed default: 1.)*
2. **Full flower set bonus:** what's the "standard" amount, and does it replace or add to the per-flower points? *(Proposed placeholder: +2 points on top of the set's own points. HK groups commonly use 1–2 faan.)* Is holding both full sets (all 8) worth something more?
3. **Do flowers alone count as a win?** With a "> 0" minimum, can a hand whose only points are flowers win?
4. **Chicken Hand:** MCR gives 8 points to a hand that would otherwise score 0. With a "> 0" minimum, keep it, drop it, or count it as 1 point?
5. **Self-Drawn fan (1 pt):** is it still added to the points when self-draw already doubles the payout? (MCR counts it.)
6. **Draw game:** does the dealer keep the deal or pass it?
7. **Does the dealer earn or pay extra** (common in HK play)? *(Assumed no.)*
8. **Seat changes between rounds:** do players physically swap seats (MCR App. 4), or stay put while the dice move? *(Assumed: stay put.)*
9. **Kongs:** paid immediately during the hand, or only counted through the fan? *(Assumed: only through the fan.)*
10. **False win penalty:** used casually? *(Assumed: off. Available as a preset.)*
