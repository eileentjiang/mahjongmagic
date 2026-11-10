# Mahjong Magic: Product Requirements Document (v0.1 draft)

> Status: **Draft, for discussion.** Nothing is built yet. Items marked **[OPEN]** need a decision before the build starts.
> Companion docs: [`PARKING_LOT.md`](./PARKING_LOT.md) (future ideas), plus the research synthesis in the appendix below.

---

## 1. Overview

**One-sentence pitch:** A mobile-first mahjong scorer for beginner and intermediate players. Tap in a winning hand and it gives you the points, the dollar payout, and a running tally for the night, so nobody has to dig through the rulebook between rounds.

**Target players:** people who have never played, and people who know the rules but still check the rulebook to add up a winning hand.

**Core value**
- **Functional:** speed, convenience, accuracy, and consistency of scoring.
- **Emotional:** less friction. The night stays focused on *playing* and not on doing math at the end of each hand or the end of the night.

---

## 2. Target user & problem statement

### Primary persona: the Friendly Game Night player
- Plays with the same friends for **3–4 hours in one sitting**, usually 4 players at 1 table.
- Knows the basic rules but **goes back to the rulebook to count** what a winning hand is worth.
- Plays for small stakes, and **money changes hands only once, at the end of the night**. Until then, players keep track with tokens or notes.

### The problem
At the end of every hand, someone has to:
1. Work out what the winning hand is worth (look up patterns, count fan/points, add flowers and winds).
2. Turn that score into a **$ amount**, and work out **who pays whom**: did one person discard the winning tile, or was it a self-draw that everyone pays for?
3. Keep that amount in a **running tally** across many hands.

At the end of the night, someone has to total everything up and settle. All of this is slow, takes mental effort, is easy to get wrong, and invites disputes ("house rules" disagreements). It pulls the table out of the game.

### Pain points from research (Friendly Game Night column)
- Tracking payout amounts and totals
- Rule discrepancies and house rules
- Continued rankings even after the payout (continuity across nights)

Secondary personas (Beginner, Community Player, Eccentric) are covered in the appendix and the parking lot. They are **not** the MVP target, but the MVP should not make their needs harder to add later.

---

## 3. MVP scope (what to build)

Five features. Each one is written as *user action → system reaction*.

### Feature A: Start a game night
**User** enters 4 player names, assigns seats (East/South/West/North), and confirms the house rules (variant preset, $ per point, minimum points to win, point cap). **System** creates a saved session, shows the table with each player's seat wind and flower number, and marks who the dealer is.
- House rules **default to the last night's settings**, so a regular group can start in one tap. (This comes from the floor sticky note: "default to the rules of the last play for easy select.")

### Feature B: Score a winning hand
**User** taps the winner and picks how they won: **self-draw** or **won off a discard** (and from whom). Then they tick the scoring elements in the hand from a plain-language checklist (patterns, flowers, seat/round wind, bonuses). **System** shows the hand's total points, the **$ each player pays or receives**, and a confirm button. Nothing is saved until the user confirms.
- The scorer works from a **checklist of scoring elements**, not tile-by-tile entry. This is the fastest MVP path, and tile input is in the parking lot.
- Scoring elements show plain-language names, with Chinese terms/numerals as secondary labels where they help.

### Feature C: Running ledger and round tracker
**User** confirms a hand (or records a **draw / no winner**). **System**:
- updates every player's running balance (it always nets to $0 across the table),
- appends the hand to a history list,
- moves the deal on (**the dealer stays** if the dealer won, per house rules; otherwise the deal passes),
- updates the **prevailing (round) wind**, each seat's wind, and each player's **flower number** when the deal moves.

This replaces tokens, and it answers "whose deal is it / what's my flower?" at a glance.

### Feature D: Undo / edit a hand
**User** taps a past hand to edit it, or taps undo on the last one. **System** recalculates every balance after that hand, along with the dealer and wind state.

### Feature E: End the night and settle up
**User** taps "End night" (typically after a full wind round, i.e. 4 rounds). **System** shows:
- final rankings (biggest winner to biggest loser),
- each player's net $,
- a **simplified "who pays whom" list** that keeps the number of transfers to a minimum,
- an option to **end the night** or **save it to continue later** ("set future continuation").

**Cross-cutting:** all state persists on the device (local storage). A refresh, a closed tab, or a locked phone never loses the night.

---

## 4. Non-goals (do not build for v1)

- **No teaching the game.** No tutorials, rule explainers, or strategy hints. (Short plain-language labels on scoring items are fine.)
- **No accounts, logins, or cloud sync.** It runs on one device, with local storage only.
- **No third-party payment integrations** (Venmo, PayPal, etc.). The app shows who owes whom, and money moves outside the app.
- **No camera or photo recognition** of tiles.
- **No tile-by-tile hand builder or automatic pattern detection.** The user ticks the scoring elements.
- **No multiple rule variants.** Ship **one** variant preset plus a few house-rule knobs (see §7).
- **No multi-table, tournament, or lobby features** (finding tables, queuing, skill matching).
- **No multi-language UI** beyond secondary Chinese labels on scoring items.
- **No 3-player or 5+ player games.** Exactly 4 players.
- **No backend, no analytics, no ads.**

---

## 5. User flows & behavior

### 5.1 First launch / new night
1. User opens the app and sees **"Start a new game night"** (and **"Continue last night"** if a saved session exists).
2. User enters 4 names. Seats default to entry order (1st = East = first dealer) and can be reordered.
3. The house rules screen is pre-filled with the last-used settings, or the variant defaults on first use. User confirms.
4. The table view appears: 4 players with name, seat wind, flower #, balance ($0.00), a dealer badge, and the current prevailing wind.

### 5.2 Scoring a hand (the core loop, ideally under 30 seconds)
1. When someone wins, any player taps **"Record win"**.
2. They pick the **winner**, then **Self-draw** or **Discard → from whom**.
3. A checklist of scoring elements appears, grouped (e.g. *Hand patterns*, *Flowers & seasons*, *Winds & dragons*, *Bonuses*). Points total live as items are ticked.
4. A **payout preview** shows +$ for the winner and −$ for each payer.
5. **Confirm** saves the hand. Balances animate to new values, the hand appears in history, and dealer/wind/flower # update.
6. **Cancel** at any point discards the entry with no side effects.

### 5.3 Draw / no winner
1. User taps **"No winner (draw)"**.
2. No money moves. The deal advances or stays according to house rules.

### 5.4 Fixing a mistake
1. **Undo last hand** is available from the table view, with a confirmation prompt.
2. User taps any past hand in history → edit or delete → all later balances and table state recalculate.

### 5.5 End of night
1. User taps **"End night"**.
2. The summary shows rankings, net $ per player, and the minimal "who pays whom" list.
3. User chooses **"Finish"** (archives the night as read-only) or **"Save & continue later"** (keeps the session resumable).

### 5.6 Resume
Reopening the app, whether after a refresh, a closed browser, or days later, returns the user to exactly where they were.

---

## 6. Edge cases

**Input and scoring**
- **Below minimum points to win:** show a warning and block confirm unless the user overrides it (house rules vary).
- **Above the point cap:** clamp to the cap and show "capped at N".
- **Nothing ticked:** confirm is disabled, and a hint says to select at least one scoring element or record a draw.
- **Winner = discarder:** not allowed in the picker.
- **Mutually exclusive items** (e.g. two pattern types that can't both be true): ticking one disables or clears the other.
- **Multiple winners off the same discard:** **[OPEN]** support it or not? (Default for MVP: one winner per hand; the user records the second win as a separate hand.)
- **Kong / in-hand payouts mid-round** (from the board: "intermediate wins (kong)", "ability to track in-between payouts"): **[OPEN]** is this in the MVP? Proposed: an optional **"Bonus payment"** entry outside a winning hand.
- **False win / penalty:** parking lot (log it manually as a bonus payment if needed).

**Money and math**
- Balances must **always sum to $0** across the 4 players. This is an invariant that tests should check.
- Rounding: store integer cents (or integer points) internally, display to 2 decimals, and never let a rounding drift break the $0 sum.
- Large sessions (50+ hands) stay fast and readable. History scrolls, newest first.

**Session and people**
- **Player leaves or a sub joins mid-night:** **[OPEN]** proposed MVP: rename a seat. The balance stays with the seat, and an "end night" for that player can come later.
- **Duplicate or empty names:** empty is blocked. Duplicates trigger a warning but are allowed.
- **Accidental "End night":** confirm dialog, and a finished night can be re-opened for 24h.
- **Starting a new night while one is in progress:** prompt to continue, finish, or discard the existing one.

**Device and storage**
- **Refresh or tab close mid-entry:** the in-progress hand entry may be lost, but confirmed hands are never lost.
- **Local storage unavailable** (private browsing, blocked storage): the app still works for the session and shows a banner saying "This night won't be saved if you close the page".
- **Storage cleared by the browser:** nothing to recover. Note this in the copy and in the parking lot (export/backup).
- **Screen sizes:** designed for a **phone in portrait** passed around the table. Tap targets are at least 44px, with no horizontal scroll at 360px wide. On tablets and desktops, the same layout is centered with a max width. It is usable one-handed.
- **Lighting and glare:** high-contrast text, and a dark mode that follows the system setting.
- **Offline:** the app needs no network after first load. **[OPEN]** Installable PWA in MVP or later?

---

## 7. Constraints & conventions

### Rules variant **[OPEN, decide before building]**
The research (flowers tied to seat, the dealer staying or moving with the dice, self-draw where everyone pays, "big loser" = the discarder, Chinese numerals on tiles) points to a **Cantonese / Hong Kong-style** game with flowers. Decide:
1. The **variant** to ship as the single preset (proposed: Hong Kong style, faan-based).
2. The **points → $ table** (e.g. base $ per point, doubling schedule, cap).
3. **Who pays on a discard win**: does the discarder pay everything, or does the discarder pay double and the others pay single?
4. **Self-draw payout**: all three pay equally, or a multiplier?
5. **Dealer rules**: does the dealer stay on a dealer win or on a draw? Any dealer bonus?
6. The **minimum points** to win and the **cap**.
7. **Flower scoring**: own-seat flower, full set bonuses, no-flower bonus?

Write the answers as a **rules config (data)** that the scoring logic reads, so the same engine can support more variants later. Variants should never be hard-coded.

### Tech stack (proposed, confirm in the spec phase)
- A client-only web app: **Vite + React + TypeScript**, **Tailwind CSS**, **Lucide** icons.
- **No backend.** Persistence goes through a single storage module that wraps `localStorage`.
- **Scoring and payout logic lives in pure functions** (`src/scoring/`), separate from the UI, and is unit tested (Vitest).
- Hosting on any static host (GitHub Pages / Vercel / Netlify).

### Design direction **[TBD]**
- Mobile-first, calm, high-contrast, and readable at arm's length on a table.
- One primary action per screen. Money uses color plus a +/− sign, never color alone.

### Conventions
- Intuitive, descriptive file names (`ScoreHandScreen.tsx`, `calculatePayout.ts`, `rules/hongKong.ts`).
- Domain vocabulary is used consistently in code and UI: *night/session → round (wind) → hand*, *seat wind*, *prevailing wind*, *dealer*, *flower number*, *self-draw*, *discard*.
- Every scoring rule is data plus a test case drawn from a real example hand.

---

## 8. Definition of done (MVP)

**General**
- [ ] The root page loads with zero console errors on mobile Safari and Chrome.
- [ ] There is no horizontal scroll at 360px width, and all tap targets are ≥ 44px.

**A. Start a game night**
- [ ] User can enter 4 names and start a night. An empty name blocks start.
- [ ] The table view shows 4 seats with wind, flower #, $0.00 balance, and a dealer badge on East.
- [ ] Starting a second night pre-fills the house rules used last time.

**B. Score a winning hand**
- [ ] Choosing winner + discard/self-draw + scoring items shows the correct total and the per-player $ preview for at least 10 reference hands (test fixtures agreed in the spec phase).
- [ ] Confirm is disabled until a winner and at least one scoring item are chosen.
- [ ] Cancel leaves balances and history unchanged.

**C. Ledger and round tracker**
- [ ] After any sequence of hands, the 4 balances sum to exactly $0.00.
- [ ] Dealer, prevailing wind, seat winds, and flower #s update correctly after a dealer win, a non-dealer win, and a draw (per config).
- [ ] History lists every hand, newest first, with winner, method, points, and $.

**D. Undo / edit**
- [ ] Undoing the last hand restores balances and table state exactly to before it.
- [ ] Editing a past hand recalculates all later balances and table state.

**E. End night**
- [ ] The summary shows players ranked by net $.
- [ ] The "who pays whom" list settles all balances to $0 using at most 3 transfers.
- [ ] "Save & continue later" resumes the same night after closing and reopening the browser.

**Persistence**
- [ ] Refreshing the page at any point keeps all confirmed hands.
- [ ] With storage blocked, the app still works and shows the "won't be saved" banner.

---

## 9. Success metrics (for iteration)
- Time from "Record win" to "Confirm" is **under 30 seconds** for a typical hand.
- **Zero rulebook lookups** for scoring during a test night.
- Final settlement takes **under 1 minute** with no disputes.
- The group chooses to use it again the following game night.

---

## Appendix: research synthesis (from the sticky-note boards)

### Personas and pain points

| Persona | Who | Pain points |
|---|---|---|
| **The Beginner** | First-timers, or people reviewing the rules | Unfamiliar with rules & terms · language barriers · can't remember rules & patterns · can't ask questions out loud |
| **Community Player** | Shuffling / tournaments | Tracking cumulative rankings · finding open spots / queuing fairly · finding a table that matches their skill set |
| **Friendly Game Night** ⭐ MVP | Consistent rounds & continuation | Tracking payout amounts & totals · rule discrepancies & house rules · continued ranking even after payout |
| **The Eccentric** | Other game rules & styles | Regional styles + house-rule combinations · other payout structures |

### Customer journey

| Stage | Actions | Needs | Opportunity (proposed) |
|---|---|---|---|
| **1. Find 4 people & set up** | Get 4 people, 1 set/mat, 1 table, 4 chairs · introductions & seating · familiarize with the set · determine the style of game | Seat players of similar ability | *Later:* seating/skill matching (parking lot) |
| **2. Explain / align on rules & scoring** | Explain rules of play · explain scoring of hands · decide whether to gamble | Differentiate rules by beginner/intermediate/advanced play · see the numbers on tiles in Chinese + desired language · know seat & table winds and flower | **MVP:** house-rules setup that remembers the last night · seat wind/flower shown on the table view |
| **3. Begin play & play** | Set tiles face down & shuffle · set up walls & determine start · intermediate wins (kong) | Ability to track in-between payouts · clarity on flower # and wind placement | **MVP:** round tracker (dealer, winds, flower #) · [OPEN] bonus/kong payments |
| **4. A winner: reveal hand & score** | Big loser and winner determined · self-draw → all pay · count the winner's score → payout amounts · exchange tokens · dice stays or moves on · everyone gets a new flower # if the dice moves | Keep track of cumulative scores | **MVP core:** score a hand → $ split → running ledger replaces tokens · auto-advance dealer/flower |
| **5. Mix & set up next round** | Begin, play, conclude (repeat) | (n/a) | **MVP:** one-tap "Record win" keeps the loop fast |
| **6. Conclusion of all rounds** | Typically at the end of a wind round (4 rounds) · calculate final cumulative payout · pay & clean up | End a round or set future continuation · final $ payout & rankings | **MVP:** end-night summary, minimal transfers, save & continue |

*Note:* the edge of the last photo shows a partly cut-off orange note ("-list… F… mu… North…"). Add it here once it can be read in full.
