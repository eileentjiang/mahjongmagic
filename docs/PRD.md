# Mahjong Magic: Product Requirements Document (v0.2 draft)

> Status: **Draft, for discussion.** Nothing is built yet. Items marked **[OPEN]** need a decision before the build starts.
> Companion docs: [`PARKING_LOT.md`](./PARKING_LOT.md) (future ideas), plus the research synthesis in the appendix below.
>
> **Changelog**
> - v0.2: MVP features rewritten around the owner's feature list (variant choice, cumulative rankings, photo scoring, seat/table info, manual adjustments). User flows, edge cases and DoD updated to match. Photo scoring and variant choice moved out of non-goals.
> - v0.1: first draft.

---

## 1. Overview

**One-sentence pitch:** A mobile-first mahjong scorer for beginner and intermediate players. Snap a photo of the winning hand and it gives you the points, the reasons behind them, the dollar payout, and a running tally for the night, so nobody has to dig through the rulebook between rounds.

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

Secondary personas (Beginner, Community Player, Eccentric) are covered in the appendix and the parking lot. They are **not** the MVP target, but the MVP should not make their needs harder to add later. Feature D (seat/table info shown in plain language) and Feature A (variant choice) also help the Beginner and the Eccentric.

---

## 3. MVP scope (what to build)

Five features. Each one is written as *[user action] → [system reaction]*.

### Feature A: Choose the variant (scoring system / playing style)
**[User chooses a variant]** → **[System uses that rulebook and scoring system for the whole night, including how a hand pays out on a self-draw vs. a discard.]**
- The variant sets the scoring patterns, point values, minimum to win, cap, dealer rules, flower rules, and the **payout split**:
  - **Self-draw:** all three other players pay the winner.
  - **Discard:** the discarder pays, either all of it or a larger share, depending on the variant.
- The variant comes with a **payout scale** ($ per point / doubling table). The user can adjust it before starting (see Feature E).
- The last-used variant and payout scale are pre-selected so a regular group starts in one tap (floor sticky: "default to the rules of the last play for easy select").
- **[OPEN]** Which variants ship in v1? Proposed: **Hong Kong / Cantonese** first (it fits the research: flower numbers, the dealer staying or moving, everyone paying on a self-draw). The variant picker shows the others as "coming soon". Each variant is stored as a **rules config (data)**, so adding one later doesn't need a new engine.

### Feature B: Track cumulative rankings and payouts
**[User records the result of each hand]** → **[System shows the updated standings after every hand, rolled up to the current wind round and the night's total payouts.]**
- After each hand: every player's **hand result (+/−$)**, **running balance**, and **rank**.
- Roll-ups: **per wind round** (East, South, West, North) and **night total**.
- Balances always net to $0 across the table. This replaces tokens.
- Draws (no winner) are recorded and move no money.
- At the end of the night: final rankings, net $ per player, a **short "who pays whom" list** (at most 3 transfers), and the choice to **finish** or **save and continue later**.

### Feature C: Take a picture of the winning hand
**[User takes a picture of the winning hand]** → **[System shows the point value and the reasons behind it (e.g. "no honor tiles", "pure chow / all sequences", "mixed one suit"), plus the payout preview.]**
1. The user photographs the revealed hand, including melded sets and flowers.
2. The system identifies each tile and shows them as a **tile strip the user can check and correct** (tap a tile to change it, add a missing one, or remove one).
3. The user confirms: **who won**, **self-draw or discard (from whom)**, and any context a photo can't show (e.g. won on the last tile, robbed a kong). Seat and round wind are filled in from Feature D.
4. The system shows the **total points**, a **line-by-line breakdown of each scoring pattern** with a plain-language reason, and **what each player pays or receives**.
5. **Confirm** sends the hand to the ledger (Feature B). **Cancel** changes nothing.
- **Fallback:** if the photo fails or the user has no camera, they can **build the hand by tapping tiles** in the same tile strip. Scoring never depends on the camera working.
- **[OPEN]** Recognition approach (see §7). It almost certainly needs a vision model behind a small server function, which changes the "no backend" assumption.

### Feature D: Seat and table assignments
**[User checks their seat]** → **[System shows each player's flower number, seat wind and the table (prevailing) wind, with the character, its English name, and a picture of the matching tile, so people who don't read Chinese can follow along and points are assigned clearly.]**
- The table view shows all 4 players with their seat wind (東南西北 + East/South/West/North), flower # (1–4 with the matching flower and season tiles), the dealer badge, and the current table wind.
- **Auto-advance:** when the deal moves ("the dice moves"), seat winds and flower numbers rotate and **everyone gets their new flower #**. When the dealer keeps the deal, nothing rotates. After four rotations, the table wind advances.
- Feature C uses these values automatically, so seat-wind, round-wind, and own-flower points are always applied correctly.
- **"My seat" view:** a player can tap their name to see a large, readable card with their wind, flower #, and the tiles that score for them.

### Feature E: Manual adjustments
**[User changes players, house rules, seating, or a past score]** → **[System accepts the change, and one-off adjustments, and recalculates everything that depends on it.]**
- **Edit or undo a hand:** change the winner, method, tiles, or points of any past hand. All later balances, rankings, and seat rotations recalculate.
- **Change the payout scale or house rules mid-night:** choose whether the change applies **from now on** (default) or **to the whole night**. Every hand stores the scale it was scored with, so history is never rewritten by accident.
- **Swap or add players:** a new player can take a seat mid-game (see §6 for how balances are handled). Players can also swap seats.
- **Change seating / dealer:** override the dealer, the table wind, or the seat order if the app's tracking drifts from the real table.
- **One-off adjustment:** add a manual payment (e.g. a kong bonus, a penalty, a side bet) with a note. It counts in the ledger and must still net to $0.
- **Override a score:** accept a hand below the minimum, or adjust the points for a house rule the variant doesn't cover, with a visible "manually adjusted" tag.

**Cross-cutting:** all state persists on the device (local storage). A refresh, a closed tab, or a locked phone never loses the night.

---

## 4. Non-goals (do not build for v1)

- **No teaching the game.** No tutorials or strategy hints. The plain-language pattern explanations in Feature C and the seat info in Feature D are the limit.
- **No accounts, logins, or cloud sync.** One device runs the night (passed around, or kept by one scorekeeper), with local storage only. Other players' phones don't sync.
- **No third-party payment integrations** (Venmo, PayPal, etc.). The app shows who owes whom, and money moves outside the app.
- **No live video or continuous scanning.** A single still photo per winning hand only.
- **No full support for every variant in v1.** The picker and data model support many, but only the [OPEN] chosen preset(s) are fully implemented.
- **No multi-table, tournament, or lobby features** (finding tables, queuing, skill matching).
- **No full multi-language UI.** English UI, with Chinese characters shown next to English for winds, flowers, and tiles.
- **No 3-player or 5+ player games.** Exactly 4 players are seated at once.
- **No storing photos** after the hand is scored (privacy, and storage limits).
- **No ads and no analytics.**

---

## 5. User flows & behavior

### 5.1 Onboarding: open link → choose type of play → players & positions
1. User opens the link and sees **"Start a new game night"** (and **"Continue last night"** if a saved session exists).
2. **Choose the type of play:** the variant picker (Feature A), with the last-used variant and payout scale pre-selected. The payout scale can be reviewed and adjusted here.
3. **Who's at the table and where:** enter 4 names and place them in seats (East/South/West/North). East is the first dealer. Seats can be dragged to match the real table, or randomized ("roll for seats").
4. The table view appears: each player's seat wind, flower #, $0.00 balance, the dealer badge, and the table wind.

### 5.2 During play: each player knows what's relevant to their seat
- The table view is always one tap away and shows each player's **seat wind, flower #, and the table wind** (Feature D), in Chinese and English with tile pictures.
- Tapping a name opens that player's **"My seat"** card (big text, readable across the table).
- Players can see the **current standings** at any time without leaving the table view.
- Optional quick entries during a hand: **"Bonus payment"** for kongs or side payments (Feature E).

### 5.3 Scoring: calculate, track, and show to everyone
1. When someone wins, any player taps **"Score a win"**.
2. They **take a photo** of the winning hand (or tap **"Enter tiles manually"**).
3. They **check the recognized tiles** and fix any mistakes.
4. They choose **who won** and **self-draw / discard (from whom)**, and tick any extra conditions.
5. The system shows **total points + the reason for each pattern + each player's +/−$**.
6. **Confirm** updates the ledger: balances animate to their new values and the **standings banner** shows the new ranking. The deal advances or stays, and seat winds and flower #s update (and the app announces "New flower numbers!" when they change).
7. If there's no winner, **"Draw"** moves the deal according to the variant and moves no money.

### 5.4 Concluding: final payouts and standings, or continue later
1. Typically after a full wind round (4 rounds), or whenever the group decides, a user taps **"End night"**.
2. The summary shows **final standings**, net $ per player, per-round breakdowns, and the minimal **"who pays whom"** list.
3. User chooses **"Finish"** (archives the night as read-only) or **"Save & continue later"** (resumes with the same seats, balances, and table wind next time).

---

## 6. Edge cases

### The user accidentally exits or closes the browser
- Every confirmed hand, seat change, and adjustment is **saved the moment it's confirmed**. Reopening the link goes straight back to the table view, with the same seats, balances, and winds.
- An in-progress score (photo taken, not yet confirmed) is saved as a **draft**. On reopen: "You were scoring a hand for Anna. Resume or discard?" (The photo itself isn't kept, but the recognized tiles are.)
- If local storage is **unavailable** (private browsing, blocked storage), the app still works and shows a banner: "This night won't be saved if you close the page."
- If the browser **cleared storage**, nothing can be recovered. Export/backup is in the parking lot.

### The user wants to go back and change scoring
- Any past hand can be **edited or deleted** from history (Feature E). All later balances, rankings, seat rotations, and dealer turns recalculate.
- **Undo last hand** is one tap from the table view, with a confirmation.
- Edited hands show an **"edited"** tag, and the summary keeps an audit note (what changed), so disputes can be settled.
- Editing a hand that changed who dealt (e.g. it turns out the dealer didn't win) re-plays the seat/wind sequence after it. The user is warned before confirming.

### The user wants to change the payout scale
- Payout scale can be changed **before starting** (onboarding) or **mid-night** (Feature E).
- Mid-night, the user picks **"From the next hand on"** (default) or **"Recalculate the whole night"**. A preview shows the old vs. new balances before they confirm.
- Each hand stores the scale it was scored with, so the history stays accurate.
- Invalid values (0, negative, non-numeric) are blocked with an inline message. Very large values ask for confirmation.

### New players come in halfway through a game
- **Substitution:** a new player takes over an existing seat. **[OPEN]** whose balance does the seat carry? Proposed default: the leaving player's balance is **frozen** and settled at the end of the night, and the newcomer starts at $0 in that seat. They appear as separate rows in the final standings.
- **Rotation (more than 4 people in the group):** players can **sit out and rejoin**. Only 4 are seated at a time, but everyone who played appears in the standings and the settlement.
- The seat wind and flower # stay with the **seat**, not the person. The newcomer gets that seat's info right away.
- Duplicate names trigger a warning (allowed, but suffixed: "Sam (2)"). Empty names are blocked.

### Photo recognition
- **Blurry, dark, or partial photo** → "We couldn't read all the tiles". The user retakes it, or fixes the tiles by hand. Low-confidence tiles are highlighted.
- **Wrong number of tiles** (not 14 + kong extras + flowers) → the score is blocked until the tile strip is valid, and the message says what's missing or extra.
- **Not a winning hand** under the chosen variant → the app explains why (e.g. "no pair found") and offers a manual override (Feature E).
- **Recognition service errors or times out (e.g. 500, no network)** → the app falls back to manual tile entry immediately. It never blocks scoring. A retry button is offered.
- **Camera permission denied / no camera** → the manual tile entry opens automatically.

### Scoring and money
- **Below minimum points to win:** show a warning and block confirm unless the user overrides it.
- **Above the point cap:** clamp to the cap and show "capped at N".
- **Winner = discarder:** not allowed in the picker.
- **Multiple winners off the same discard:** **[OPEN]** proposed MVP: one winner per hand; record the second win as a separate hand.
- Balances **always sum to $0**. Store money as integer cents, display 2 decimals, and never let rounding drift break the $0 sum.
- Long nights (50+ hands) stay fast and readable. History scrolls, newest first.

### Screens and devices
- Designed for a **phone in portrait** passed around the table. Tap targets are ≥ 44px, with no horizontal scroll at 360px wide.
- On tablets and desktops, the same layout is centered with a max width. A tablet propped up as a "table display" is a nice bonus.
- High-contrast text, and a dark mode that follows the system setting. Readable at arm's length.
- **Accidental "End night":** a confirm dialog, and a finished night can be re-opened for 24h.

---

## 7. Constraints & conventions

### Rules variant **[OPEN, decide before building]**
For each v1 variant, decide:
1. The **scoring patterns** and their point values (e.g. "no honor tiles", "all chows", "mixed one suit", "pure one suit"…).
2. The **points → $ table** (base $ per point, doubling schedule, cap).
3. **Who pays on a discard win**: does the discarder pay everything, or pay double while the others pay single?
4. **Self-draw payout**: all three pay equally, or a multiplier?
5. **Dealer rules**: does the dealer stay on a dealer win or on a draw? Any dealer bonus?
6. **Minimum points** to win and the **cap**.
7. **Flower scoring**: own-seat flower, full set bonuses, no-flower bonus?

Write each variant as a **rules config (data)** plus test hands. Variants should never be hard-coded.

### Photo recognition **[OPEN]**
- **Option 1 (proposed):** send the photo to a **vision-capable AI model** through a small serverless function, so the API key never sits in the browser. It returns a tile list. **The app's own rules engine does the scoring**, not the AI, so points are deterministic and testable.
- **Option 2:** an on-device tile-recognition model. No server and no per-photo cost, but much more work up front and less accurate.
- Either way, the user always reviews the tiles before scoring, and manual entry is always available.
- Cost, privacy (no photos stored), and offline behavior (falls back to manual entry) have to be stated in the spec.

### Tech stack (proposed, confirm in the spec phase)
- A web app: **Vite + React + TypeScript**, **Tailwind CSS**, **Lucide** icons.
- **One small serverless function** for photo recognition (Vercel / Netlify functions). No database.
- Persistence goes through a single storage module that wraps `localStorage`.
- **Scoring, pattern detection, payout, and seat-rotation logic live in pure functions** (`src/engine/`), separate from the UI, with unit tests (Vitest) for every pattern and payout rule.
- Hosting: Vercel or Netlify, so the static site and the function live together.

### Design direction **[TBD]**
- Mobile-first, calm, high-contrast, and readable at arm's length on a table.
- One primary action per screen. Money uses color plus a +/− sign, never color alone.
- Tiles are shown as recognizable tile images, with the Chinese character and its English name side by side.

### Conventions
- Intuitive, descriptive file names (`ScoreHandScreen.tsx`, `calculatePayout.ts`, `detectPatterns.ts`, `variants/hongKong.ts`).
- Domain vocabulary is used consistently in code and UI: *night/session → wind round → hand*, *seat wind*, *table (prevailing) wind*, *dealer*, *flower number*, *self-draw*, *discard*, *payout scale*.
- Every scoring pattern is data plus at least one test hand that's known to be valid and one that's known to be invalid.

---

## 8. Definition of done (MVP)

**General**
- [ ] The page loads with zero console errors on mobile Safari and Chrome.
- [ ] There is no horizontal scroll at 360px width, and all tap targets are ≥ 44px.

**Persistence**
- [ ] Refreshing the page keeps all players, seats, confirmed hands, and balances (from localStorage).
- [ ] Closing and reopening the browser returns to the same table view.
- [ ] An unconfirmed hand is offered as a draft to resume or discard after a reload.
- [ ] With storage blocked, the app still works and shows the "won't be saved" banner.

**A. Variant**
- [ ] User can choose a variant before starting, and the night's scoring uses that variant's rules.
- [ ] The same hand pays differently on a self-draw vs. a discard, per the variant config.
- [ ] Starting a second night pre-selects the last-used variant and payout scale.

**B. Cumulative rankings**
- [ ] After each confirmed hand, the standings show each player's hand result, running balance, and rank.
- [ ] Standings can be viewed per wind round and for the whole night.
- [ ] After any sequence of hands, the balances sum to exactly $0.00.
- [ ] End night shows the final rankings and a "who pays whom" list of at most 3 transfers that settles every balance to $0.
- [ ] "Save & continue later" resumes the same night after closing and reopening the browser.

**C. Photo scoring**
- [ ] Taking or uploading a photo shows a tile strip the user can edit.
- [ ] For at least 10 reference hands entered as tiles (test fixtures agreed in the spec phase), the system shows the correct total points and the correct named patterns with reasons.
- [ ] For the reference photo set, recognized tiles match the real hand for at least **[OPEN]** % of photos. (This check is the accuracy target for the recognition approach.)
- [ ] If recognition fails or times out, the manual tile entry opens and scoring can still be completed.
- [ ] Cancel leaves balances and history unchanged.

**D. Seat and table**
- [ ] The table view shows every player's seat wind, flower #, and the table wind, each in Chinese and English with a tile picture.
- [ ] After a non-dealer win, the seats rotate and flower #s update. After a dealer win (per variant), nothing rotates.
- [ ] After 4 deal rotations, the table wind advances.
- [ ] Seat wind, round wind, and own-flower points in Feature C come from the current seat state, with no manual input.

**E. Manual adjustments**
- [ ] Editing or deleting a past hand recalculates all later balances, rankings, and seat rotations.
- [ ] Undo last hand restores balances and table state exactly to before it.
- [ ] Changing the payout scale "from the next hand" leaves past hands unchanged. "Recalculate the whole night" updates all of them, and a preview is shown first.
- [ ] A new player can take a seat mid-night, and both the leaving and joining players appear in the final standings.
- [ ] A one-off adjustment with a note shows in the ledger and keeps the $0 sum.
- [ ] Manually overriding the dealer, table wind, or seat order updates the table view immediately.

---

## 9. Success metrics (for iteration)
- Time from "Score a win" to "Confirm" is **under 30 seconds** for a typical hand (photo path).
- **At least 80% of photos** need zero or one tile correction.
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

| Stage | Actions | Needs | Opportunity → MVP feature |
|---|---|---|---|
| **1. Find 4 people & set up** | Get 4 people, 1 set/mat, 1 table, 4 chairs · introductions & seating · familiarize with the set · determine the style of game | Seat players of similar ability | **A** choose variant · **D** seat assignment at onboarding · *later:* skill matching (parking lot) |
| **2. Explain / align on rules & scoring** | Explain rules of play · explain scoring of hands · decide whether to gamble | Differentiate rules by beginner/intermediate/advanced play · see the numbers on tiles in Chinese + desired language · know seat & table winds and flower | **A** variant + payout scale · **D** winds/flowers in Chinese + English |
| **3. Begin play & play** | Set tiles face down & shuffle · set up walls & determine start · intermediate wins (kong) | Ability to track in-between payouts · clarity on flower # and wind placement | **D** "My seat" card · **E** bonus/kong payments |
| **4. A winner: reveal hand & score** | Big loser and winner determined · self-draw → all pay · count the winner's score → payout amounts · exchange tokens · dice stays or moves on · everyone gets a new flower # if the dice moves | Keep track of cumulative scores | **C** photo → points + reasons · **A** self-draw/discard split · **B** ledger replaces tokens · **D** auto-rotate flowers |
| **5. Mix & set up next round** | Begin, play, conclude (repeat) | (n/a) | **B** standings after each hand |
| **6. Conclusion of all rounds** | Typically at the end of a wind round (4 rounds) · calculate final cumulative payout · pay & clean up | End a round or set future continuation · final $ payout & rankings | **B** end-night summary, minimal transfers, save & continue |

*Note:* the edge of the last photo shows a partly cut-off orange note ("-list… F… mu… North…"). Add it here once it can be read in full.
