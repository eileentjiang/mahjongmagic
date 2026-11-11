# Default house profile: "Game Night" (the owner's rules)

**Status:** the app's **default** for v1. The owner will refine it after test nights, so every value here is a **setting**, not a hard-coded rule. Users can change any of it (PRD Feature A3/A4).

**How it's built:** the base rulebook is [MCR](./MCR.md) (the 81 fan and their combining rules) plus the house rules below. Anything not listed here follows MCR.

---

## 1. House rules

| Rule | Game Night default | MCR, for comparison |
|---|---|---|
| **Minimum to win** | **More than 0 points**, flowers included: a hand whose only points are flowers can win | 8 points, not counting flowers |
| **Payout scale** | **$0.10 per point.** Hand value H = points × $0.10 | n/a |
| **Win by discard** | The discarder (the "big loser") pays **2 × H**. The other two pay **1 × H** each | Discarder pays points + 8; others pay 8 |
| **Win by self-draw** | Everyone's payment doubles: **each of the 3 pays 2 × H** | Each pays points + 8 |
| **Self-Drawn fan (1 pt)** | **Not counted.** The doubling already rewards the self-draw | Counted |
| **+8 base** | **Not used** | Used |
| **Dealer ("the dice")** | **The dealer keeps the deal only if they win.** After any other win **or a draw**, it passes to the next player (the dealer's right, counter-clockwise) | Passes every hand |
| **Flowers** | **1 point** per flower that **matches your seat number**. Others score 0 | 1 pt per flower, any seat |
| **Full flower set** | A **complete set** (all 4 flowers, or all 4 seasons) scores **+2 points**, on top of the set's own points | No bonus |
| **Kongs** | **Paid on the spot** when declared, whether or not that player wins the hand (see §1a) | Scored only as fan if the player wins |
| **Point cap** | None | None |

### 1a. Kong payments (paid on the spot)
| Kong type | Points | When it's paid |
|---|---|---|
| **Melded kong** (claimed from someone's discard) | **2** | Immediately when declared |
| **Concealed kong** (all 4 drawn yourself) | **4** | Immediately when declared |
| **Self-drawn kong** (drawing the 4th tile to add to your melded pung) | **4** | Immediately when declared |

- The money is the player's **even if they don't win the hand**, and even if the hand ends in a draw.
- **No double counting:** if the kong owner goes on to win, their kongs are **not counted again** in the hand's points. The engine leaves out the MCR kong fans (Melded Kong, Concealed Kong, Two Melded Kongs, Two Concealed Kongs).
- **Robbing the kong:** if another player wins by robbing an added kong, the kong was never completed, so no kong payment is made.
- At $0.10/point (assuming all three others pay; see open question 1): melded kong → each pays $0.20, owner **+$0.60**. Concealed or self-drawn kong → each pays $0.40, owner **+$1.20**.

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

## 3. Decided (owner, Nov 2026)
- A seat-matching flower is worth **1 point**. A full set earns **+2 points**.
- A hand with only flower points **can win** (minimum is more than 0).
- **Draw game:** the dealer passes. The dice move on.
- The **Self-Drawn** fan is **not counted** (the self-draw doubling already covers it).
- **Kongs are paid on the spot:** melded kong 2 points, concealed or self-drawn kong 4 points. They aren't counted again if the owner wins.

## 4. Open questions (settle during test nights)
1. **Who pays a kong?** All three other players equally (assumed), or only the discarder for a melded kong claimed from a discard?
2. **Big kong patterns:** if the owner wins with **Three Kongs (32)** or **Four Kongs (88)**, do those still score as hand patterns? *(Assumed: yes. Only the per-kong fans are dropped, since they're a hand shape, not a per-kong payment.)*
3. **Holding both full flower sets (all 8 flowers):** worth more than +2 +2? *(Assumed: no extra.)*
4. **Chicken Hand:** MCR gives 8 points to a hand that would otherwise score 0 (not counting flowers). With a "> 0" minimum, keep it, drop it, or count it as 1 point? *(Assumed: dropped. A hand needs at least 1 point from fan or flowers.)*
5. **Does the dealer earn or pay extra** (common in HK play)? *(Assumed: no.)*
6. **Seat changes between rounds:** do players physically swap seats (MCR App. 4), or stay put while the dice move? *(Assumed: stay put.)*
7. **False win penalty:** used casually? *(Assumed: off. Available as a preset.)*
8. **Is a kong payment doubled or changed by anything** (e.g. the dealer's kong)? *(Assumed: no, it's a flat 2 or 4 points.)*
