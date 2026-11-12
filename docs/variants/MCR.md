# Variant reference: Chinese Official (MCR)

**Source:** World Mahjong Organization, *Mahjong Competition Rules* (2014 English edition), the whole book: ch. 3 (rules of play, scoring, fouls) and appendices 1–10.
In the app, this is the **base rulebook** for the variant labeled **"Hong Kong style (MCR rules)"**. The owner's group plays it with house rules on top: see [`GAME_NIGHT_DEFAULT.md`](./GAME_NIGHT_DEFAULT.md), which is the app's **default house profile**.

> This file records every rule from the book that matters to the app, summarized in our own words so the PDF doesn't need to be committed (WMO copyright). Section refs (§) point back to the book for checking. Where the book's English looks like a mistranslation, it's flagged ⚠ and kept as written.

---

## 1. Tiles (§3.5.5)
144 tiles:
- **Suits** (4 of each, 108 total): Characters/Wan 萬 1–9, Dots/Tong 筒 1–9, Bamboo/Tiao 條 1–9.
- **Winds** (4 each, 16): East 東, South 南, West 西, North 北.
- **Dragons** (4 each, 12): Red 中, Green 發, White 白 (the blank/framed tile).
- **Flowers** (1 each, 8): Spring, Summer, Autumn, Winter · Plum, Orchid, Chrysanthemum, Bamboo. The usual numbering is Spring/Plum = 1, Summer/Orchid = 2, Autumn/Chrysanthemum = 3, Winter/Bamboo = 4.
- **Terminals** = 1s and 9s. **Honors** = winds and dragons.

## 2. Glossary (§3.4)
| Term | Meaning |
|---|---|
| Hand (pan) | One deal, ending in a win or a draw |
| Round (quan) | Everyone has dealt once (4 hands, more with repeats) |
| Game (ju) | 4 rounds: East, South, West, North |
| Prevalent (round) wind | The wind of the current round |
| Seat wind | Dealer = East; then counter-clockwise: South (dealer's right), West (opposite), North (dealer's left) |
| Dealer | The player in the East seat. **Under MCR the dice pass to the right after every hand, whether or not the dealer won** (§3.4.8) |
| Chow / Pung / Kong / Pair | 3 in sequence (same suit) / 3 identical / 4 identical / 2 identical |
| Concealed vs. melded | Sets made from your own draws vs. sets completed with a discard and laid face up |
| Concealed kong | 4 self-drawn tiles declared as a kong, laid face down and revealed at the end. Still counts as concealed |
| Flower replacement (bu hua) | Expose a flower and draw a replacement from the back of the wall |
| Self-drawn / Win by discard | Winning tile from the wall (incl. kong/flower replacements) / from another player's discard (incl. robbing a kong) |
| Draw game | The wall runs out with no winner |
| False hu | Declaring a win that isn't valid |

## 3. Play procedure (§3.5.7–3.6)
- **Seating:** by drawing lots. **Build walls:** 18 stacks × 2 per player.
- **Dice:** the dealer rolls to choose who rolls second. The second roll is added to pick where the wall breaks. The dealer takes 14 tiles and everyone else takes 13.
- **Flowers:** after the deal, players replace flowers in seat order (dealer first) until no one has a flower.
- **Turn order:** counter-clockwise starting with the dealer: draw → discard. Discard within 10 s; discards go in rows of 6.
- **Calls:** you must say "Chi", "Peng", "Gang", "Hua" or "Hu" out loud. Pung/kong beats chow. Calls must come within 3 s of the discard. You can only chow from the player on your left.
- **Kong:** draw a replacement from the back of the wall. You can't kong in the same turn you chowed or punged. A melded kong (from a discard or added to a melded pung) breaks concealment; a concealed kong doesn't.
- **Multiple "hu" on one discard:** the first player after the discarder (in turn order) wins. **Only one winner per hand.**
- **Declaring:** say "Hu", lay the winning tile apart from the hand, reveal everything and announce the fan. The others check it before revealing their own hands.

## 4. Valid winning hands (§3.7.2, §3.9.1)
1. **Standard:** 4 sets + 1 pair, where a set is a chow, pung or kong.
2. **Special:** Seven Pairs · Thirteen Orphans · Honors and Knitted Tiles (Lesser / Greater, 14 singles) · Knitted Straight (a 9-tile knitted run + 1 set + pair).
3. **Minimum: 8 points, not counting flowers.** Falling short is a false hu (§3.11.6).
4. The way the winning tile was taken must be legal.

## 5. The 81 fan, with non-combinations
"Excludes" = fan you **can't also score** with this one (Appendix 1, plus the non-repeat principle). Use this column to build the engine's exclusion table.

| Pts | # | Fan | Definition (summary) | Excludes / notes |
|---|---|---|---|---|
| **88** | 1 | Big Four Winds | Pungs/kongs of all 4 winds | Big Three Winds, All Pungs, Prevalent Wind, Seat Wind, Pung of Terminals or Honors |
| | 2 | Big Three Dragons | Pungs/kongs of all 3 dragons | Two Dragon Pungs, Dragon Pung |
| | 3 | All Green | Only 2,3,4,6,8 bamboo and/or green dragon | *Can* combine with Full Flush / Half Flush |
| | 4 | Nine Gates | 1112345678999 in one suit, 9-sided wait | Full Flush, Concealed Hand, Pung of Terminals or Honors. +Fully Concealed if self-drawn |
| | 5 | Four Kongs | Any 4 kongs | Single Wait. Concealed-pung fan may be added |
| | 6 | Seven Shifted Pairs | 7 consecutive pairs, one suit | Full Flush, Concealed Hand, Single Wait (and Seven Pairs, implied). +Fully Concealed if self-drawn |
| | 7 | Thirteen Orphans | One of each terminal/honor + a pair of one of them | All Types, Concealed Hand, Single Wait. +Fully Concealed if self-drawn |
| **64** | 8 | All Terminals | Only 1s and 9s | All Pungs, Outside Hand, Pung of Terminals or Honors, No Honors |
| | 9 | Little Four Winds | 3 wind pungs + pair of the 4th | Big Three Winds, Pung of Terminals or Honors. *Can* add Prevalent/Seat Wind |
| | 10 | Little Three Dragons | 2 dragon pungs + pair of the 3rd | Dragon Pung, Two Dragon Pungs |
| | 11 | All Honors | Only winds and dragons | All Pungs, Outside Hand, Pung of Terminals or Honors |
| | 12 | Four Concealed Pungs | 4 pungs/kongs made without melding | All Pungs, Concealed Hand. +Fully Concealed if self-drawn |
| | 13 | Pure Terminal Chows | 123,123,789,789 + pair of 5s, one suit | Seven Pairs, Full Flush, All Chows, Pure Double Chow, Two Terminal Chows |
| **48** | 14 | Quadruple Chow | 4 identical chows, one suit | Pure Triple Chow ⚠(book says "Pure Shifted Pungs"), Tile Hog, Pure Double Chow |
| | 15 | Four Pure Shifted Pungs | 4 pungs in one suit, each up by one | Pure Shifted Pungs ⚠(book says "Pure Triple Chow"), All Pungs |
| **32** | 16 | Four Pure Shifted Chows | 4 chows in one suit, each up by 1 (or each up by 2) | Short Straight, Two Terminal Chows |
| | 17 | Three Kongs | 3 kongs | *Can* add Concealed Kong / Two Concealed Kongs / Three Concealed Pungs if the kongs are concealed |
| | 18 | All Terminals and Honors | Only 1s, 9s and honors | All Pungs, Outside Hand, Pung of Terminals or Honors |
| **24** | 19 | Seven Pairs | 7 pairs | Concealed Hand, Single Wait. +Fully Concealed if self-drawn |
| | 20 | Greater Honors and Knitted Tiles | All 7 honors + 7 knitted singles | All Types, Concealed Hand |
| | 21 | All Even Pungs | Pungs of 2/4/6/8 + pair of the same | All Pungs, All Simples |
| | 22 | Full Flush | One suit only | No Honors |
| | 23 | Pure Triple Chow | 3 identical chows, one suit | Pure Double Chow ⚠(book also lists "Pure Shifted Pungs") |
| | 24 | Pure Shifted Pungs | 3 pungs in one suit, each up by one | Pure Triple Chow ⚠(likely mistranslation) |
| | 25 | Upper Tiles | Only 7, 8, 9 | No Honors |
| | 26 | Middle Tiles | Only 4, 5, 6 | All Simples (No Honors is implied too) |
| | 27 | Lower Tiles | Only 1, 2, 3 | No Honors |
| **16** | 28 | Pure Straight | 123+456+789 in one suit | n/a |
| | 29 | Three-Suited Terminal Chows | 123+789 in two suits + pair of 5s in the third | Mixed Double Chow, Two Terminal Chows, No Honors, All Chows |
| | 30 | Pure Shifted Chows | 3 chows in one suit, each up by 1 (or each up by 2) | n/a |
| | 31 | All Fives | Every set and the pair contains a 5 | All Simples |
| | 32 | Triple Pung | Same-number pungs in all 3 suits | n/a |
| | 33 | Three Concealed Pungs | 3 pungs/kongs made without melding | n/a |
| **12** | 34 | Lesser Honors and Knitted Tiles | 14 singles: honors + knitted suit tiles | All Types, Concealed Hand. +Fully Concealed if self-drawn |
| | 35 | Knitted Straight | 147/258/369 across three different suits | n/a |
| | 36 | Upper Four | Only 6–9 | No Honors |
| | 37 | Lower Four | Only 1–4 | No Honors |
| | 38 | Big Three Winds | Pungs of 3 winds | (Pung of Terminals or Honors for those winds, per non-repeat) |
| **8** | 39 | Mixed Straight | 123/456/789, one chow in each suit | n/a |
| | 40 | Reversible Tiles | Only 1234589 dots, 245689 bamboo, white dragon | One Voided Suit |
| | 41 | Mixed Triple Chow | Same chow in all 3 suits | n/a |
| | 42 | Mixed Shifted Pungs | Pungs in 3 suits, each up by one | n/a |
| | 43 | Chicken Hand | A hand that would otherwise score 0 (flowers excluded) | Any other fan, by definition |
| | 44 | Last Tile Draw | Self-draw on the very last wall tile | Self-Drawn |
| | 45 | Last Tile Claim | Win on the game's final discard | n/a |
| | 46 | Out with Replacement Tile | Win on the kong replacement tile | Self-Drawn. Doesn't apply to a *flower* replacement (that scores Self-Drawn instead) |
| | 47 | Robbing the Kong | Win on a tile added to someone's melded pung | Last Tile |
| | 48 | Two Concealed Kongs | 2 concealed kongs | (Concealed Kong, implied) |
| **6** | 49 | All Pungs | 4 pungs/kongs + pair | n/a |
| | 50 | Half Flush | One suit + honors | n/a |
| | 51 | Mixed Shifted Chows | Chows in 3 suits, each up by one | n/a |
| | 52 | All Types | All 5 types: characters, bamboo, dots, wind, dragon | n/a |
| | 53 | Melded Hand | Every set and the pair completed with discards | Single Wait |
| | 54 | Two Dragon Pungs | 2 dragon pungs | (Dragon Pung, implied) |
| **4** | 55 | Outside Hand | Every set and the pair has a terminal or honor | n/a |
| | 56 | Fully Concealed Hand | No melds + self-drawn | Self-Drawn, Concealed Hand (implied) |
| | 57 | Two Melded Kongs | 2 melded kongs | Melded Kong. *1 melded + 1 concealed kong = 6 points* |
| | 58 | Last Tile | Win on the 4th copy of a tile (others visibly used) | n/a |
| **2** | 59 | Dragon Pung | Pung/kong of a dragon | n/a |
| | 60 | Prevalent Wind | Pung/kong of the round's wind | (Pung of Terminals or Honors for that wind) |
| | 61 | Seat Wind | Pung/kong of your seat wind | (Pung of Terminals or Honors for that wind) |
| | 62 | Concealed Hand | No melds, win by discard | n/a |
| | 63 | All Chows | All chows, a suit pair, no honors | No Honors |
| | 64 | Tile Hog | All 4 copies of a tile used without declaring a kong | n/a |
| | 65 | Double Pung | Same-number pungs in 2 suits | n/a |
| | 66 | Two Concealed Pungs | 2 concealed pungs | n/a |
| | 67 | Concealed Kong | A concealed kong | n/a |
| | 68 | All Simples | No terminals or honors | n/a |
| **1** | 69 | Pure Double Chow | 2 identical chows, one suit | n/a |
| | 70 | Mixed Double Chow | Same chow in 2 suits | n/a |
| | 71 | Short Straight | 2 chows forming a 6-tile run, one suit | n/a |
| | 72 | Two Terminal Chows | 123 + 789 in one suit | n/a |
| | 73 | Pung of Terminals or Honors | Pung/kong of 1s, 9s or winds | Dragon pungs score Dragon Pung instead |
| | 74 | Melded Kong | Kong claimed from a discard or added to a melded pung | n/a |
| | 75 | One Voided Suit | Missing one of the 3 suits | n/a |
| | 76 | No Honors | No winds or dragons | n/a |
| | 77 | Edge Wait | Only waiting on 3 of 12_ or 7 of _89 | Invalid if there's more than one possible winning tile or another wait shape |
| | 78 | Closed Wait | Only waiting on the middle tile of a chow | Same rule as Edge Wait |
| | 79 | Single Wait | Only waiting on the pair tile | Same rule (e.g. 1234 waiting on 1 or 4 doesn't count) |
| | 80 | Self-Drawn | Win on a tile from the wall | n/a |
| | 81 | Flower Tiles | 1 point per flower, any seat | Flower-replacement win scores Self-Drawn, not Out with Replacement Tile. Flowers don't count toward the 8-point minimum |

Count check: 7 + 6 + 2 + 3 + 9 + 6 + 5 + 10 + 6 + 4 + 10 + 13 = **81**. Only **one wait fan** (77/78/79) can be scored per hand.

The owner's examples, mapped to MCR names: "no honor tiles" = **No Honors (1)**, "pure chow" = **All Chows (2)** or **Pure Double Chow (1)**, "mix chow" = **Mixed Double Chow (1)**.

**Test fixtures:** Appendix 1 has 1–3 example hands per fan, each listing the other fan it combines with. Transcribe these into engine test cases during the spec phase. They're the closest thing to an official answer key.

## 6. Combining principles (§3.9.1.6)
Find the **highest fan first**, then add the smaller ones following these rules:
1. **Non-repeat:** if one fan necessarily implies another, the implied one isn't scored.
2. **Non-separation:** sets that already form a fan can't be split and regrouped to make a different fan.
3. **Non-identical:** a set that has already been used for a fan can't be reused with other sets to make the *same* fan again.
4. **High vs. low:** if a set could make a high or a low fan, score the high one.
5. **Account-once:** after combining sets for a fan, each remaining set can be combined **once** with a set that was already used.

## 7. Payout (official) (§3.9.1.2–3)
| Win type | Who pays | Winner receives |
|---|---|---|
| Self-draw | Each of the 3 others pays **points + 8** | (points + 8) × 3 |
| Discard | Discarder pays **points + 8**; the other two pay **8** each | points + 24 |

Penalty points are subtracted after the hand or session. *The owner's group doesn't use this formula: see the default house profile.*

## 8. Game structure & seating (§3.4, §3.9.2, App. 4)
- 4 rounds × (at least) 4 hands = 16 hands per game. Tournament sessions are capped at 150 min.
- The **dealer passes every hand** (MCR). The prevalent wind advances after each player has dealt once.
- **Seat rotation between rounds (App. 4):** players change seats at the start of each round, so everyone sits in every position and everyone deals. Round 1: A East, B South, C West, D North. In round 2, A↔B and C↔D swap; then further exchanges before rounds 3 and 4, following the book's diagram.
- **Draw game:** no payment.

## 9. Fouls & penalties (§3.11), used to inform the app's penalty presets
| Foul | MCR penalty |
|---|---|
| False hu: hand under 8 points, or mistaking a tile for your winning tile | Pay **10 points** to each of the 3 others; can't win this hand |
| False hu: calling hu while not even waiting | Pay **20 points** to each; can't win this hand |
| Exposing your hand after someone else's hu (when it was valid) | Warning. If the declarer was wrong, the exposer can't win and must discard the exposed tiles |
| Pushing over your own hand or the wall so play can't continue | 30 points to each |
| Knocking over another player's tiles | 5–60 points to that player |
| Wrong tile count (≠ 13 between turns) | Can't win this hand; play continues |
| False chow/pung/kong/flower | Can't win this hand |
| Empty call (call, then change of mind) | Warning, then 5 / 10 / 20… points (escalating) |
| Touching the wall out of turn / late pung call | Warning, then 5 / 10 / 20… points |
| Passing information to another player | The informer can't win this hand |
| Being late (tournaments) | 10–20 contest points, forfeit if more than 15 min late |
| Rules violations (general) | 5–60 contest points (deducted, not paid to others) |

## 10. Rankings (§3.9.2, §3.10, App. 9)
- **Table points:** the total of points won and lost in a session.
- **Competition points:** 4 / 2 / 1 / 0 for 1st–4th place in each session. Ranking goes by table points, with ties broken by contest points.
- **Pin ranking system:** WMO skill levels Pin 9 → Pin 1 (plus Web Pin), awarded from accumulated points and placings in sanctioned competitions. *Not relevant to the MVP; parking-lot idea for the Community Player persona.*

## 11. Appendices not needed by the app
App. 2 (player's oath), App. 3 (tournament table-rotation chart), App. 5–7 (paper score sheets and foul records; the app replaces these), App. 10 (Pin application form). App. 5's score sheet layout is a useful reference for the history screen: per-hand score and running total for each seat, plus a signature/verify step.
