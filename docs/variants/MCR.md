# Variant reference: Chinese Official (MCR), the "HK style" default

**Source:** World Mahjong Organization, *Mahjong Competition Rules* (2014 English edition), chapter 3.7–3.9 and appendix 8.
This is the **default variant** for Mahjong Magic. The owner's group calls it "Hong Kong style". In the app it's labelled **"Hong Kong style (MCR rules)"** so it matches what players say at the table, with the official name shown as a subtitle.

> This doc gives the facts the scoring engine needs (fan names, point values, payout formula), with short summaries in our own words. The rulebook itself is the authority: check edge cases against it and its Appendix 1 worked examples. Don't commit the PDF to the repo (WMO copyright).

---

## 1. What counts as a winning hand
- **Standard structure:** 4 sets (chow, pung or kong) + 1 pair.
- **Special structures:** Seven Pairs · Thirteen Orphans · Honors and Knitted Tiles (Lesser / Greater).
- **Minimum to win: 8 points.** Flower points do **not** count toward the 8. This is inferred from *Chicken Hand*: "a hand that would otherwise earn 0 points (excluding the Flower Tiles)". Confirm with the group.
- **Win by self-draw** (includes the replacement tile after a kong or flower) or **by discard** (includes robbing a kong).
- Only one winner per hand. If several players claim the same discard, the next player after the discarder wins.

## 2. The 81 fan (scoring elements)

| Pts | # | Fan | In short |
|---|---|---|---|
| **88** | 1 | Big Four Winds | Pungs/kongs of all 4 winds |
| | 2 | Big Three Dragons | Pungs/kongs of all 3 dragons |
| | 3 | All Green | Only 2,3,4,6,8 bamboo + green dragon |
| | 4 | Nine Gates | 1112345678999 in one suit, waiting on any tile of that suit |
| | 5 | Four Kongs | Any 4 kongs |
| | 6 | Seven Shifted Pairs | 7 consecutive pairs in one suit |
| | 7 | Thirteen Orphans | One of each terminal & honor + a pair of one of them |
| **64** | 8 | All Terminals | Only 1s and 9s, no honors |
| | 9 | Little Four Winds | 3 wind pungs + pair of the 4th wind |
| | 10 | Little Three Dragons | 2 dragon pungs + pair of the 3rd dragon |
| | 11 | All Honors | Only winds and dragons |
| | 12 | Four Concealed Pungs | 4 pungs/kongs made without melding |
| | 13 | Pure Terminal Chows | 123,123,789,789 + pair of 5s, one suit |
| **48** | 14 | Quadruple Chow | 4 identical chows, one suit |
| | 15 | Four Pure Shifted Pungs | 4 pungs in one suit, each up by one |
| **32** | 16 | Four Pure Shifted Chows | 4 chows in one suit, each up by 1 (or each up by 2) |
| | 17 | Three Kongs | 3 kongs |
| | 18 | All Terminals and Honors | Only 1s, 9s and honors |
| **24** | 19 | Seven Pairs | 7 pairs |
| | 20 | Greater Honors and Knitted Tiles | All 7 honors + knitted singles |
| | 21 | All Even Pungs | Pungs of 2/4/6/8 + pair of the same |
| | 22 | Full Flush | One suit only, no honors |
| | 23 | Pure Triple Chow | 3 identical chows, one suit |
| | 24 | Pure Shifted Pungs | 3 pungs in one suit, each up by one |
| | 25 | Upper Tiles | Only 7, 8, 9 |
| | 26 | Middle Tiles | Only 4, 5, 6 |
| | 27 | Lower Tiles | Only 1, 2, 3 |
| **16** | 28 | Pure Straight | 1–9 in one suit (three chows) |
| | 29 | Three-Suited Terminal Chows | 123+789 in two suits + pair of 5s in the third |
| | 30 | Pure Shifted Chows | 3 chows in one suit, each up by 1 (or each up by 2) |
| | 31 | All Fives | Every set and the pair contains a 5 |
| | 32 | Triple Pung | Pungs of the same number in all 3 suits |
| | 33 | Three Concealed Pungs | 3 pungs/kongs made without melding |
| **12** | 34 | Lesser Honors and Knitted Tiles | Honor singles + knitted singles across 3 suits |
| | 35 | Knitted Straight | 147 / 258 / 369 across three different suits |
| | 36 | Upper Four | Only 6–9 |
| | 37 | Lower Four | Only 1–4 |
| | 38 | Big Three Winds | Pungs of 3 of the winds |
| **8** | 39 | Mixed Straight | 1–9 made from chows in 3 different suits |
| | 40 | Reversible Tiles | Only tiles that look the same upside-down |
| | 41 | Mixed Triple Chow | Same chow in all 3 suits |
| | 42 | Mixed Shifted Pungs | Pungs in 3 suits, each up by one |
| | 43 | Chicken Hand | A hand that would otherwise score 0 (flowers excluded) |
| | 44 | Last Tile Draw | Self-draw on the very last wall tile (no Self-Drawn on top) |
| | 45 | Last Tile Claim | Win on the game's final discard |
| | 46 | Out with Replacement Tile | Win on the kong replacement tile |
| | 47 | Robbing the Kong | Win on a tile someone adds to a melded pung |
| | 48 | Two Concealed Kongs | 2 concealed kongs |
| **6** | 49 | All Pungs | 4 pungs/kongs + pair |
| | 50 | Half Flush | One suit + honors |
| | 51 | Mixed Shifted Chows | Chows in 3 suits, each up by one |
| | 52 | All Types | All 5 types: characters, bamboo, dots, winds, dragons |
| | 53 | Melded Hand | Every set melded, winning on a single wait off a discard |
| | 54 | Two Dragon Pungs | 2 dragon pungs |
| **4** | 55 | Outside Hand | Every set and the pair has a terminal or honor |
| | 56 | Fully Concealed Hand | No melds, win by self-draw |
| | 57 | Two Melded Kongs | 2 melded kongs (melded + concealed = 6 pts) |
| | 58 | Last Tile | Win on the last remaining copy of that tile (visible on the table) |
| **2** | 59 | Dragon Pung | A dragon pung |
| | 60 | Prevalent Wind | Pung of the round's wind |
| | 61 | Seat Wind | Pung of your seat's wind |
| | 62 | Concealed Hand | No melds, win by discard |
| | 63 | All Chows | All chows, no honors |
| | 64 | Tile Hog | Using all 4 copies of a tile without declaring a kong |
| | 65 | Double Pung | Pungs of the same number in 2 suits |
| | 66 | Two Concealed Pungs | 2 concealed pungs |
| | 67 | Concealed Kong | A concealed kong |
| | 68 | All Simples | No terminals or honors |
| **1** | 69 | Pure Double Chow | 2 identical chows, one suit |
| | 70 | Mixed Double Chow | Same chow in 2 suits |
| | 71 | Short Straight | Two chows making a 6-tile run, one suit |
| | 72 | Two Terminal Chows | 123 + 789 in one suit |
| | 73 | Pung of Terminals or Honors | Pung of 1s, 9s or winds (dragons score Dragon Pung instead) |
| | 74 | Melded Kong | A melded kong |
| | 75 | One Voided Suit | Missing one of the 3 suits |
| | 76 | No Honors | No winds or dragons |
| | 77 | Edge Wait | Only waiting on 3 (for 12_) or 7 (for _89) |
| | 78 | Closed Wait | Only waiting on the middle tile of a chow |
| | 79 | Single Wait | Only waiting on the pair tile |
| | 80 | Self-Drawn | Win on a tile from the wall |
| | 81 | Flower Tiles | 1 point per flower (any flower, not tied to your seat) |

Count check: 7 + 6 + 2 + 3 + 9 + 6 + 5 + 10 + 6 + 4 + 10 + 13 = **81**.

The owner's examples, mapped to MCR names: "no honor tiles" = **No Honors (1)**, "pure chow" = **All Chows (2)** or **Pure Double Chow (1)**, "mix chow" = **Mixed Double Chow (1)**.

## 3. How fan combine (engine rules)
1. **Non-repeat:** if one fan necessarily implies another, the implied one isn't scored (e.g. Full Flush excludes No Honors and One Voided Suit). The full implication list must be built from Appendix 1's examples during the spec phase.
2. **Non-separation:** once sets form a fan, they can't be rearranged to make a different fan.
3. **Non-identical:** a set that has already been used for a fan can't be reused with other sets to make the same fan.
4. **High vs. low:** if a set could make a high or a low fan, score the high one.
5. **Account-once:** after combining sets for a fan, each remaining set can only be combined once with a set that was already used.

Implement these rules in the engine with tests. They're the hardest part of MCR scoring and the main reason players open the rulebook.

## 4. Payout (official formula)
Each winning hand pays **basic points (the hand's fan total) + 8 extra points**:

| Win type | Who pays what | Winner receives |
|---|---|---|
| **Self-draw** | Each of the 3 others pays **basic + 8** | (basic + 8) × 3 |
| **Discard** | Discarder pays **basic + 8**; the other two pay **8** each | basic + 8 × 3 |

**Mahjong Magic default payout scale: $0.10 per point** (the owner's usual rate: 6 fan = $0.60). It's editable per night and per table profile.

Worked examples at $0.10/point:
- **10-point hand, discard:** discarder pays 18 pts = **$1.80**, the other two pay 8 pts = **$0.80** each → winner **+$3.40**.
- **10-point hand, self-draw:** each pays 18 pts = **$1.80** → winner **+$5.40**.
- With the *"No +8 base"* house rule (see PRD §3 A): discard → discarder pays **$1.00**, others $0; self-draw → each pays **$1.00**.

> **[OPEN]** Does the group use the official +8 structure, or just fan × $0.10? The PRD treats "No +8 base" and "Discarder pays all" as preset house rules, so either way works with one tap.

## 5. Table flow per MCR
- **Dealer:** the dealer passes **after every hand**, to the right, even if they won (rule 3.4.8). *Dealer stays on a win* is a house rule.
- **Rounds:** 4 rounds (East, South, West, North). Each player deals once per round. A game is 4 rounds (16 hands with no repeats).
- **Seat rotation:** players change seats between rounds (Appendix 4).
- **Draw game:** no payment, and the deal passes.
- **Flowers:** each flower is worth 1 point, whoever holds it. *Own-seat flower* scoring is a house rule. That means the "new flower number when the dice moves" from the research is a house-rule behavior, not MCR.
- **No point cap** in MCR. A cap is a house rule.
- **Penalties:** for a false win (false hu), the rulebook sets competition penalties. For casual play this is a house rule (see the parking lot).
