# Mahjong Magic: Product Requirements Document (v0.11 draft)

> Status: **Draft, for discussion.** Nothing is built yet. Items marked **[OPEN]** need a decision before the build starts.
> Companion docs: [`PARKING_LOT.md`](./PARKING_LOT.md) (future ideas), [`variants/MCR.md`](./variants/MCR.md) (full MCR rulebook reference), [`variants/GAME_NIGHT_DEFAULT.md`](./variants/GAME_NIGHT_DEFAULT.md) (the owner's default house profile), plus the research synthesis in the appendix below.
>
> **Changelog**
> - v0.11: Scope trimmed after the flow review. **Editing, deleting or undoing past games, one-off payments, switching seats mid-session, and the win-context ticks (last tile, robbed a kong) move to the parking lot.** Added to the MVP: a quick confirm for a draw, a hand-entry tile picker, mid-session Rules and Players (with "next game on" or "whole session"), an "End session?" confirm, and the "save as a table profile" offer at the end of a session.
> - v0.10: **Shared session is MVP (Feature F).** Everyone can join the same live session from their own phone with a 4-letter code or QR; each phone claims a seat, scoring defaults to "you" as the winner, and every confirmed game updates every phone. A single scorekeeper on one phone stays fully supported, and can invite others at any time without restarting anything. Navigation during a session is a 3-tab bar (Table · Score a win · Standings), where Score opens the camera directly. Needs a small live-sync service, so the "no sync / localStorage only" rule is replaced.
> - v0.9: Terminology: a **game** is one deal (was "hand"), a **round** is a full lap of the dealer back to the first dealer (the table wind then advances), and a **session** is the whole sitting (was "night"; play doesn't have to be at night). The default house profile is renamed **House default** (was "Game Night"). "Hand" now only means the tiles a player holds.
> - v0.8: The repo stays **public** (free GitHub Pages). **Player substitution and sit-out rotation move to Phase 2**, out of the MVP.
> - v0.7.2: Confirmation is shown **only when recognition is unsure**; confident reads go straight to the score. The photo proxy is invisible to players: one link, one app.
> - v0.7.1: Hosting on **GitHub Pages**, with the photo-recognition call going through a tiny separate proxy (Pages can't keep an API key secret). Accuracy target raised to **100%**, with the recognized tiles always shown for a quick confirm or fix.
> - v0.7: Photo recognition must identify every tile's suit and number/symbol, and **blurry or low-light photos are rejected with a retake prompt** before scoring. When two players call the same discard, **the first to call wins**. Hosting: **a shareable web link**. Substitute balances remain TBD.
> - v0.6: All House default rules settled. All three players pay each kong equally; Three/Four Kongs still score; Chicken Hand needs no flowers at all; no dealer bonus; seats stay put; no false-win penalty.
> - v0.5: House default details settled: seat flower = 1 pt, full set = +2, flower-only hands can win, the dealer passes on a draw, and the Self-Drawn fan isn't counted. **Kongs are paid on the spot** (melded 2 pts, concealed/self-drawn 4 pts) and aren't counted again if the owner wins. Recording a kong is now a quick action during play.
> - v0.4: The default scoring is now the owner's **"House default" house profile** on top of MCR: a minimum above 0 points, discarder pays 2× and the others 1×, self-draw doubles everyone's payment, the dealer keeps the deal on a win, only seat-matching flowers score, and a full flower set earns a bonus. The MCR reference now covers the whole rulebook (exclusions, fouls, rankings).
> - v0.3: The default variant is now **"Hong Kong style (MCR rules)"**, based on the WMO *Mahjong Competition Rules* (2014). The default payout scale is **$0.10 per point**, editable. Added **house-rule presets** and **saved table profiles** to Feature A, so a group's usual rules take one tap.
> - v0.2: MVP features rewritten around the owner's feature list (variant choice, cumulative rankings, photo scoring, seat/table info, manual adjustments). User flows, edge cases and DoD updated to match. Photo scoring and variant choice moved out of non-goals.
> - v0.1: first draft.

---

## Terminology

| Term | Meaning |
|---|---|
| **Game** | One deal, from the deal to a win or a draw. (Previously "hand".) |
| **Round** | A full lap of the dealer: once the deal has passed all the way back to the first dealer, the round ends and the **table wind** advances (East → South → West → North). |
| **Session** | The whole sitting with one group, from "Start a new session" to settling up. It can span several rounds, and can be saved and continued another day. (Previously "night".) |
| **Hand** | Only the tiles a player holds, e.g. "a winning hand". |
| **House default** | The owner's default house-rule profile (previously "Game Night"). |

## 1. Overview

**One-sentence pitch:** A mobile-first mahjong scorer for beginner and intermediate players. Snap a photo of the winning hand and it gives you the points, the reasons behind them, the dollar payout, and a running tally for the session, so nobody has to dig through the rulebook between rounds.

**Target players:** people who have never played, and people who know the rules but still check the rulebook to add up a winning hand.

**Core value**
- **Functional:** speed, convenience, accuracy, and consistency of scoring.
- **Emotional:** less friction. The session stays focused on *playing* and not on doing math at the end of each game or the end of the session.

---

## 2. Target user & problem statement

### Primary persona: the Friendly Game Night player
- Plays with the same friends for **3–4 hours in one sitting**, usually 4 players at 1 table.
- Knows the basic rules but **goes back to the rulebook to count** what a winning hand is worth.
- Plays for small stakes, and **money changes hands only once, at the end of the session**. Until then, players keep track with tokens or notes.

### The problem
At the end of every game, someone has to:
1. Work out what the winning hand is worth (look up patterns, count fan/points, add flowers and winds).
2. Turn that score into a **$ amount**, and work out **who pays whom**: did one person discard the winning tile, or was it a self-draw that everyone pays for?
3. Keep that amount in a **running tally** across many games.

At the end of the session, someone has to total everything up and settle. All of this is slow, takes mental effort, is easy to get wrong, and invites disputes ("house rules" disagreements). It pulls the table out of the game.

### Pain points from research (Friendly Game Night column)
- Tracking payout amounts and totals
- Rule discrepancies and house rules
- Continued rankings even after the payout (continuity across sessions)

Secondary personas (Beginner, Community Player, Eccentric) are covered in the appendix and the parking lot. They are **not** the MVP target, but the MVP should not make their needs harder to add later. Feature D (seat/table info shown in plain language) and Feature A (variant choice) also help the Beginner and the Eccentric.

---

## 3. MVP scope (what to build)

Six features. Each one is written as *[user action] → [system reaction]*. (F was added at v0.10 because shared play is core to how groups actually play.)

### Feature A: Choose the variant, house rules and payout scale
**[User chooses a variant, plus any house rules]** → **[System uses that rulebook and scoring system for the whole session, including how a hand pays out on a self-draw vs. a discard. The group's usual setup is remembered, so next time it takes one tap.]**

**A1. Variant (the base rulebook)**
- **v1 variant: "Hong Kong style (MCR rules)".** The fan list and combining rules come from the WMO *Mahjong Competition Rules* (2014): 81 fan, 1–88 points each. Full reference: [`variants/MCR.md`](./variants/MCR.md).
- **v1 default house profile: "House default"**, the owner's rules, applied on top of MCR. See [`variants/GAME_NIGHT_DEFAULT.md`](./variants/GAME_NIGHT_DEFAULT.md) and A4. The owner will refine it after test sessions, so every rule in it is a setting, not hard-coded.
- The variant sets the scoring patterns, point values, minimum to win, dealer rules, flower rules, and the **payout split**:
  - **Default (House default):** with hand value **H = points × payout scale**: on a **discard**, the discarder ("big loser") pays **2H** and the other two pay **H** each. On a **self-draw**, **all three pay 2H**.
  - **Pure MCR (selectable):** self-draw → each pays points + 8. Discard → the discarder pays points + 8 and the others pay 8.
- Other variants show in the picker as "coming soon". Each variant is a **rules config (data)**, so adding one doesn't need a new engine.

**A2. Payout scale**
- **Default: $0.10 per point** (6 points = $0.60). Examples under House default rules: a 6-point hand off a discard → the discarder pays $1.20, the others $0.60 each, and the winner gets +$2.40. A 6-point self-draw → everyone pays $1.20, and the winner gets +$3.60.
- Editable before the session starts and mid-session (Feature E). Saved with the table profile (A4).

**A3. House-rule presets (popular tweaks, toggled on or off)**
Groups rarely play pure rulebook rules. Rather than typing custom rules each time, the user **toggles from a list of common house rules**, each with a one-line explanation and its effect on scoring:

Presets marked ★ are **on in the House default default profile**.

| Preset house rule | What it changes (vs. MCR) |
|---|---|
| ★ **Dealer stays on a win** ("dice stays") | The dealer keeps the deal after winning. MCR passes the deal every game. |
| **Dealer stays on a draw** | The deal doesn't pass after a draw. |
| ★ **Own-seat flowers only** | Only flowers matching your seat number score; others are worth 0. Players get a new flower # when the deal moves. MCR: 1 pt per flower, any seat. |
| ★ **Full flower set bonus** | All 4 flowers or all 4 seasons scores a fixed bonus (amount set by the group). |
| ★ **Lower minimum to win** (e.g. 8 → 6, 3, or **more than 0** ★) | Friendlier for beginners and faster games. |
| **Flowers count toward the minimum** | MCR excludes flowers from the 8-point minimum. |
| ★ **No +8 base** | Pay only the hand's points × scale. The discarder pays all of it on a discard, and everyone pays it on a self-draw. |
| ★ **Discarder pays double** | On a discard, everyone pays the hand value and the discarder pays 2×. |
| **Discarder pays for everyone** | On a discard, the discarder covers the other two players' share too. |
| ★ **Self-draw bonus** | Self-draw pays × N (default **double**). |
| **Point cap** | Clamp a hand at N points (MCR has no cap). |
| ★ **Kong paid on the spot** | Declaring a kong triggers an immediate payment from the others: **melded kong 2 pts, concealed or self-drawn kong 4 pts** (amounts editable). The money is the owner's even if they don't win, and kongs aren't counted again in a winning hand. |
| ★ **No Self-Drawn fan** | The 1-pt Self-Drawn fan isn't added when the self-draw bonus already applies. |
| **False-win penalty** | A false mahjong pays a set amount to each player. |

- **Custom house rule** (fallback): a named one-off rule with a point or $ amount, for anything not in the list.
- The ★ set is the owner's group's rules. It ships as the default, and the remaining open details are tracked in [`GAME_NIGHT_DEFAULT.md`](./variants/GAME_NIGHT_DEFAULT.md#3-open-questions-settle-during-test-sessions). The list is validated with 2–3 other groups.

**A4. Saved table profiles (least-friction repeat setup)**
- A **table profile** is a named bundle: *variant + house rules + payout scale + usual players and seats* (e.g. "Thursday crew").
- After the first session, the app offers: **"Save this setup as a table profile?"**
- Next time, the start screen shows **"Play again with Thursday crew"**. One tap starts a session with everything pre-filled, and anything can still be changed before starting.
- **Built-in profile: "House default (default)"**, the ★ rules above at $0.10/point. Brand-new users start from it, and it can be copied and edited but not deleted. A **"Pure MCR"** built-in profile is also offered for groups that play by the book.
- With no profile of their own, the last-used setup is pre-selected (floor sticky: "default to the rules of the last play for easy select").
- Profiles can be renamed, edited, duplicated and deleted. Changing a profile never changes sessions that have already been played.

### Feature B: Track cumulative rankings and payouts
**[User records the result of each game]** → **[System shows the updated standings after every game, rolled up to the current wind round and the session's total payouts.]**
- After each game: every player's **game result (+/−$)**, **running balance**, and **rank**.
- Roll-ups: **per wind round** (East, South, West, North) and **session total**.
- Balances always net to $0 across the table. This replaces tokens.
- Draws (no winner) are recorded and move no money.
- At the end of the session: final rankings, net $ per player, a **short "who pays whom" list** (at most 3 transfers), and the choice to **finish** or **save and continue later**.

### Feature C: Take a picture of the winning hand
**[User takes a picture of the winning hand]** → **[System shows the point value and the reasons behind it, using the variant's fan names (e.g. "No Honors, 1 pt", "All Chows, 2 pts", "Mixed Double Chow, 1 pt", "Half Flush, 6 pts"), plus the payout preview.]**
1. The user photographs the revealed hand, including melded sets and flowers.
2. The system identifies each tile and shows them as a **tile strip** next to the score (tap a tile to change it, add a missing one, or remove one). It **only stops to ask for confirmation when it's unsure** about a tile; confident reads go straight to the score.
3. The user confirms: **who won** and **self-draw or discard (from whom)**. Seat and round wind are filled in from Feature D. *(Ticks for context a photo can't show, e.g. won on the last tile or robbed a kong, are in the parking lot; until then those patterns can be added by hand with "Add a scoring pattern".)*
4. The system shows the **total points**, a **line-by-line breakdown of each scoring pattern** with a plain-language reason, and **what each player pays or receives**.
5. **Confirm** sends the game to the ledger (Feature B). **Cancel** changes nothing.
- **Fallback:** if the photo fails or the user has no camera, they **build the hand by tapping tiles** on a hand-entry screen: the hand so far on top (tap a tile to remove it, with a "9 of 14 tiles" count), and tiles to add below, grouped as Dots, Bamboo, Characters, Honors and Flowers. The target is **14 tiles by default, plus one for each kong** (four of the same tile, so 15 with one kong, up to 18); flowers don't count. Scoring unlocks when the count matches, and adding a tile is never blocked, so a kong hand is never stuck at 14. Scoring never depends on the camera working.
- **[OPEN]** Recognition approach (see §7). It almost certainly needs a vision model behind a small server function, which changes the "no backend" assumption.

### Feature D: Seat and table assignments
**[User checks their seat]** → **[System shows each player's flower number, seat wind and the table (prevailing) wind, with the character, its English name, and a picture of the matching tile, so people who don't read Chinese can follow along and points are assigned clearly.]**
- The table view shows all 4 players with their seat wind (東南西北 + East/South/West/North), flower # (1–4 with the matching flower and season tiles), the dealer badge, and the current table wind.
- **Auto-advance:** when the deal moves ("the dice moves"), seat winds and flower numbers rotate and **everyone gets their new flower #**. When the dealer keeps the deal (only with the *dealer stays* house rule; MCR always passes it), nothing rotates. After four rotations, the table wind advances.
- Flower # drives scoring under the default (House default) profile, where only seat-matching flowers count: East 1 = Spring/Plum, South 2 = Summer/Orchid, West 3 = Autumn/Chrysanthemum, North 4 = Winter/Bamboo. Under pure MCR every flower is 1 point, and the flower # is shown for reference only.
- Feature C uses these values automatically, so seat-wind, round-wind, and own-flower points are always applied correctly.
- **"My seat" view:** a player can tap their name to see a large, readable card with their wind, flower #, and the tiles that score for them.

### Feature E: Manual adjustments
**[User changes players, house rules, seating, or the score being entered]** → **[System accepts the change and recalculates everything that depends on it.]**
- *Editing, deleting or undoing a game that's already confirmed is **not in the MVP** (parking lot). Before Confirm, everything on the score screen can still be changed.*
- **Change the payout scale or house rules mid-session:** choose whether the change applies **from now on** (default) or **to the whole session**. Every game stores the scale it was scored with, so history is never rewritten by accident.
- **Fix names or seat order:** from ⋯ → Players & seats, mid-session. *(Substituting a new player into a seat is **Phase 2**; see the parking lot.)*
- **Mid-session Rules and Players** are the same screens as setup, without the setup steps; **Save changes** returns to the Table. Phones that joined a shared session see them read-only.
- **Change seating / dealer:** override the dealer, the table wind, or the seat order if the app's tracking drifts from the real table (⋯ → Players & seats, under "Dealer & table wind").
- **Override a score:** accept a hand below the minimum, or adjust the points for a house rule the variant doesn't cover, with a visible "manually adjusted" tag.

### Feature F: Shared session (everyone's phone) or a single scorekeeper
**[Players join one live session from their own phones, or one person keeps score for everyone]** → **[Every phone sees the same table, standings and history in real time; nobody re-enters setup or scores twice.]**

**Two ways to play, same app:**
- **Single scorekeeper (default):** one phone runs all four seats, exactly as the rest of this PRD describes. Nothing to join.
- **Shared session:** whoever starts the session can tap **Invite** at any time. That shows a **4-letter code** (e.g. KHTW), a **QR code** and a share link. Inviting never restarts anything: seats, scores, game number and history carry over, and the scorekeeper's phone simply becomes one of the players.

**Joining:**
1. On their phone a player opens the link and taps **Join a session**, then types the code or scans the QR.
2. They see the four seats (names and winds were set by the host) and tap **their own seat**. Seats already claimed show "On Amy's phone". A phone can also **watch only**.
3. They land on the Table screen with **their seat marked "You"**. They never see the Rules or Players setup screens; those belong to the session.

**Playing together:**
- **Each phone knows who's holding it.** "Score a win" assumes **you** are the winner; you only choose self-draw or discard (and who discarded). The winner can still be changed.
- **One shared ledger.** Confirming a game (or a kong or a draw) updates **every phone**, live. Nobody updates scores separately.
- **One scorer at a time.** While someone is scoring, other phones show "Chloe is scoring game 6…" and their Score button is paused, so a game can't be entered twice.
- **Anyone can view** standings, history and their own "My seat" card at any time.
- No accounts: a phone is remembered for that session only.

**Navigation during a session:** a bottom tab bar with three items: **Table**, **Score a win** (the large centre button, which opens the camera directly, so a fluent player is one tap from snapping the hand), and **Standings**. Everything else (Home, Rules, Players, About, End session) lives in the **⋯ menu** on the Table screen.

**Cross-cutting:** every confirmed action is saved immediately: on the device, and to the shared session when one exists. A refresh, a closed tab, a locked phone or a dropped connection never loses the session; a phone that rejoins catches up automatically.

---

## 4. Non-goals (do not build for v1)

- **No teaching the game.** No tutorials or strategy hints. The plain-language pattern explanations in Feature C and the seat info in Feature D are the limit.
- **No accounts or logins.** Phones join a session with a code; nothing is stored about a person beyond their name in that session. Sync exists only to share one session between the phones at that table.
- **No third-party payment integrations** (Venmo, PayPal, etc.). The app shows who owes whom, and money moves outside the app.
- **No live video or continuous scanning.** A single still photo per winning hand only.
- **No full support for every variant in v1.** The picker and data model support many, but only the [OPEN] chosen preset(s) are fully implemented.
- **No multi-table, tournament, or lobby features** (finding tables, queuing, skill matching).
- **No full multi-language UI.** English UI, with Chinese characters shown next to English for winds, flowers, and tiles.
- **No 3-player or 5+ player games.** Exactly 4 players are seated at once.
- **No player substitution or sit-out rotation mid-session** (Phase 2). The same 4 players play the whole session.
- **No storing photos** after the game is scored (privacy, and storage limits).
- **No ads and no analytics.**

---

## 5. User flows & behavior

### 5.1 Onboarding: open link → choose type of play → players & positions
- **First visit (no saved sessions or profiles):** Home shows a single illustrated tile (a persimmon on a tilted tile) with one line of copy, plus "Start a new session" and "Join a session". Returning players see their session in progress and saved profiles instead.
- **Owner's mark:** Eileen's personal seal appears small beside the © line on Home and About, and as a sign-off on the About page.
1. User opens the link and sees **"Start a new session"**, plus **"Play again with ‹profile›"** for each saved table profile, and **"Continue last session"** if a saved session exists.
   - **Fast path:** tapping a table profile skips straight to a one-screen confirmation (rules summary + players), and one more tap starts the session.
2. **Choose the type of play:** the variant picker (Feature A), with the last-used variant pre-selected. Default: *Hong Kong style (MCR rules)* with the *House default* house profile.
3. **House rules & payout:** toggle the house-rule presets (each with a one-line explanation), add a custom rule if needed, and confirm the payout scale (default $0.10/point). A summary line shows what's in play, e.g. "House default · MCR fan · min > 0 · discarder ×2 · self-draw ×2 · dealer stays · $0.10/pt".
4. **Who's at the table and where:** enter 4 names and place them in seats (East/South/West/North). East is the first dealer. Seats can be dragged to match the real table, or randomized ("roll for seats").
5. The table view appears: each player's seat wind, flower #, $0.00 balance, the dealer badge, and the table wind.
6. At the end of a first session (or whenever the user chooses), the app offers to **save the setup as a table profile**.

### 5.2 During play: each player knows what's relevant to their seat
- The table view is always one tap away and shows each player's **seat wind, flower #, and the table wind** (Feature D), in Chinese and English with tile pictures.
- Tapping a name opens that player's **"My seat"** card (big text, readable across the table).
- Players can see the **current standings** at any time without leaving the table view.
- **"Record kong"** quick action during a game: choose who declared it and the type (melded / concealed / self-drawn). The app pays it immediately from the other players (House default: 2 or 4 points × scale), and the standings update.
- **"No winner (draw)"** opens a quick confirm: "Record a draw for game 6? No money moves · deal passes to Ben."

### 5.3 Scoring: calculate, track, and show to everyone
1. When someone wins, any player taps **"Score a win"** (the centre tab). In a shared session the winner taps it on their own phone, and the app pre-selects them as the winner.
2. They **take a photo** of the winning hand (or tap **"Enter tiles manually"**).
3. If the app is unsure about any tile, it **flashes what it picked up** and asks the user to confirm or fix the highlighted tiles. If it's confident, this step is skipped.
4. They choose **who won** and **self-draw / discard (from whom)**.
5. The system shows **total points + the reason for each pattern + each player's +/−$**.
6. **Confirm** updates the ledger: balances animate to their new values and the **standings banner** shows the new ranking. The deal advances or stays, and seat winds and flower #s update (and the app announces "New flower numbers!" when they change).
7. If there's no winner, **"Draw"** moves the deal according to the variant and moves no money.

### 5.4 Concluding: final payouts and standings, or continue later
1. Typically after a full wind round (4 rounds), or whenever the group decides, a user taps **"End session"** and confirms ("End the session? … You can still reopen it for 24 hours").
2. The summary shows **final standings**, net $ per player, per-round breakdowns, and the minimal **"who pays whom"** list.
3. User chooses **"Finish"** (archives the session as read-only) or **"Save & continue later"** (resumes with the same seats, balances, and table wind next time).

---

## 6. Edge cases

### The user accidentally exits or closes the browser
- Every confirmed game, seat change, and adjustment is **saved the moment it's confirmed**. Reopening the link goes straight back to the table view, with the same seats, balances, and winds.
- An in-progress score (photo taken, not yet confirmed) is saved as a **draft**. On reopen: "You were scoring a game for Anna. Resume or discard?" (The photo itself isn't kept, but the recognized tiles are.)
- If local storage is **unavailable** (private browsing, blocked storage), the app still works and shows a banner: "This session won't be saved if you close the page."
- If the browser **cleared storage**, nothing can be recovered. Export/backup is in the parking lot.

### The user wants to go back and change scoring
- **MVP:** a confirmed game can't be edited or undone. Everything (winner, method, tiles, patterns) can be changed on the score screen before **Confirm**, and Cancel changes nothing.
- Editing, deleting and undoing confirmed games (with recalculation and an "edited" tag) are in the parking lot.

### The user wants to change the payout scale
- Payout scale can be changed **before starting** (onboarding) or **mid-session** (Feature E).
- Mid-session, the user picks **"From the next game on"** (default) or **"Recalculate the whole session"**. A preview shows the old vs. new balances before they confirm.
- Each game stores the scale it was scored with, so the history stays accurate.
- Invalid values (0, negative, non-numeric) are blocked with an inline message. Very large values ask for confirmation.

### House rules and table profiles
- **Conflicting presets** (e.g. *No +8 base* and *Discarder pays for everyone*, or a cap below the minimum): the app explains the conflict and blocks the combination, or asks the user to choose one.
- **Changing house rules mid-session:** same behavior as the payout scale. Default is "from the next game on", with an option to recalculate the whole session (with a preview).
- **Editing a table profile** never changes past sessions. It only applies to the next session started from it.
- **Profile players who aren't here this session:** the profile pre-fills its usual players, and the user can swap anyone before starting.
- **Deleting a profile** asks for confirmation. Past sessions played with it stay intact (each session stores its own copy of the rules).

### Players and names
- **New players halfway through a session: Phase 2, not MVP.** In the MVP, a group that changes players ends the session ("Save & continue later" or "Finish") and starts a new one. See the parking lot.
- Duplicate names trigger a warning (allowed, but suffixed: "Sam (2)"). Empty names are blocked.

### Photo recognition
- **Blurry or low-light photo** → the app **rejects it before scoring** and asks for a **retake** ("Too blurry / too dark — try again with more light and a steady hand"), with tips such as moving closer, turning on the flash, or laying the tiles flat. It never scores from a photo that failed the quality check.
- **Partial photo** (tiles cut off or covered) → retake prompt, naming what looks missing.
- **Photo passes the quality check but some tiles are uncertain** → those tiles are highlighted for the user to confirm or fix before scoring.
- **Manual entry is always one tap away:** every rejected-photo prompt offers both "Retake photo" and "Enter tiles by hand", from the first failure.
- **Wrong number of tiles** (not 14 + kong extras + flowers) → the score is blocked until the tile strip is valid, and the message says what's missing or extra.
- **Not a winning hand** under the chosen variant → the app explains why (e.g. "no pair found") and offers a manual override (Feature E).
- **Recognition service errors or times out (e.g. 500, no network)** → the app falls back to manual tile entry immediately. It never blocks scoring. A retry button is offered.
- **Camera permission denied / no camera** → the manual tile entry opens automatically.

### Scoring and money
- **Below minimum points to win:** show a warning and block confirm unless the user overrides it.
- **Above the point cap:** clamp to the cap and show "capped at N".
- **Winner = discarder:** not allowed in the picker.
- **Kongs** (House default):
  - A kong recorded during a game stays paid even if that game ends in a draw or someone else wins.
  - If the kong owner wins, the photo/tile scorer leaves out the per-kong fans so the kong isn't paid twice.
- **Multiple players call the same discard:** **the first player to call it wins** (house rule; MCR gives it to the next player after the discarder). Only one winner per game. The app just records whoever the table agrees called first.
- Balances **always sum to $0**. Store money as integer cents, display 2 decimals, and never let rounding drift break the $0 sum.
- Long sessions (50+ games) stay fast and readable. History scrolls, newest first.

### Screens and devices
- Designed for a **phone in portrait** passed around the table. Tap targets are ≥ 44px, with no horizontal scroll at 360px wide.
- On tablets and desktops, the same layout is centered with a max width. A tablet propped up as a "table display" is a nice bonus.
- High-contrast text, and a dark mode that follows the system setting. Readable at arm's length.
- **Accidental "End session":** a confirm dialog, and a finished session can be re-opened for 24h.

---

### Shared sessions (Feature F)
- **Two phones tap Score at once:** the first one to start holds the game; the other sees "Chloe is scoring game 6…" and can only watch. If the scorer abandons it (closes the app or cancels), the hold releases after a short timeout.
- **A phone drops offline mid-session:** it keeps showing the last known state with an "Offline, reconnecting…" banner and can't confirm new games; on reconnect it catches up. The host's phone can still score offline and syncs later.
- **Someone claims the wrong seat:** there's no seat switching in the MVP; they rejoin, or the group starts a new session.
- **The host leaves or their phone dies:** the session isn't owned by one phone; anyone joined can keep scoring.
- **Late joiner:** joining mid-session shows the current game number, balances and history; nothing restarts.
- **More than four phones:** extra phones join as watch-only.

## 7. Constraints & conventions

### Rules (decided: MCR fan + House default house profile)
The v1 variant is **WMO Mahjong Competition Rules (2014)**, labelled "Hong Kong style (MCR rules)" ([`variants/MCR.md`](./variants/MCR.md)). The default house profile is **House default** ([`variants/GAME_NIGHT_DEFAULT.md`](./variants/GAME_NIGHT_DEFAULT.md)).

| Question | House default default | Pure MCR | Preset that changes it |
|---|---|---|---|
| Scoring patterns & values | MCR's 81 fan | 81 fan, 1–88 points | Custom house rule |
| Points → $ | **$0.10 per point** | n/a | Payout scale |
| Discard win | Discarder pays **2H**; others pay **H** | Discarder pays points + 8; others pay 8 | *Discarder pays double*, *Discarder pays for everyone*, *No +8 base* |
| Self-draw | Each of the 3 pays **2H** | Each pays points + 8 | *Self-draw bonus*, *No +8 base* |
| Self-Drawn fan | Not counted | 1 pt | *No Self-Drawn fan* |
| Dealer | Keeps the deal only on a win; passes after other wins and draws | Passes every game | *Dealer stays on a win / on a draw* |
| Minimum / cap | **More than 0** (flower-only hands can win) / none | 8 (flowers excluded) / none | *Lower minimum*, *Point cap* |
| Flowers | **1 pt** per seat-matching flower; full set **+2** | 1 pt each, any seat | *Own-seat flowers only*, *Full flower set bonus* |
| Kongs | Paid on the spot: melded **2**, concealed/self-drawn **4**; not re-counted on a win | Counted as fan only if the owner wins | *Kong paid on the spot* |

| Chicken Hand | 8 pts, only with **no flowers at all** and nothing else scoring | 8 pts if nothing else scores (flowers excluded) | n/a |
| Seats / dealer bonus / false win | Seats stay put; no dealer bonus; no penalty | Seats swap each round; penalties apply | *False-win penalty* |

All House default rules are decided ([`GAME_NIGHT_DEFAULT.md`](./variants/GAME_NIGHT_DEFAULT.md)). Changes after test sessions are settings, not code.

Variants and house rules are a **rules config (data)** plus test hands, never hard-coded. House-rule presets are config modifiers applied on top of a variant.

### Photo recognition (decided: what it must do)
- **Job:** from one photo of the revealed winning hand, identify **every tile's suit and number, or its symbol** (wind, dragon, flower/season), plus which tiles are melded vs. concealed where the layout shows it. That tile list feeds the scoring engine.
- **Quality gate first:** before identifying tiles, check for blur, low light and cut-off tiles. If the photo fails, **ask for a retake** rather than guessing.
- **Accuracy target: 100%** of tiles identified correctly on photos that pass the quality gate.
- **Least friction:** when recognition is confident about every tile, the app **goes straight to the score**. The recognized tiles are still shown alongside the score breakdown, so anyone can tap a tile to fix it before confirming the game.
- **Only when unsure:** if any tile is uncertain, the app **flashes what it picked up**, highlights the uncertain tiles, and asks the user to confirm or change them before scoring.
- **How (implementation, decided in the spec phase):**
- **Option 1 (proposed):** send the photo to a **vision-capable AI model** through a **tiny proxy** (e.g. a free Cloudflare Worker), so the API key never sits in the browser or the public GitHub repo. It returns a tile list. **The app's own rules engine does the scoring**, not the AI, so points are deterministic and testable.
- **Option 2:** an on-device tile-recognition model. No server and no per-photo cost, but much more work up front and less accurate.
- Either way, the user always reviews the tiles before scoring, and manual entry is always available.
- Cost, privacy (no photos stored), and offline behavior (falls back to manual entry) have to be stated in the spec.

### Tech stack (proposed, confirm in the spec phase)
- A web app: **Vite + React + TypeScript**, **Tailwind CSS**, **Lucide** icons.
- **One tiny proxy** for photo recognition (e.g. a Cloudflare Worker, free tier) that holds the AI API key and forwards the photo.
- **A small live-sync service for shared sessions** (Feature F). **[OPEN]** Options: Supabase Realtime or Firebase (hosted, free tier, fastest to build), or a Cloudflare Durable Object next to the photo proxy (one provider for everything). It stores only the session: seats, names, games, rules, balances. Sessions expire after a set time (e.g. 30 days).
- Persistence goes through a single storage module: it writes to `localStorage` first (offline-safe) and syncs to the shared session when one exists.
- **Scoring, pattern detection, payout, and seat-rotation logic live in pure functions** (`src/engine/`), separate from the UI, with unit tests (Vitest) for every pattern and payout rule.
- **Hosting (decided): GitHub Pages**, a shareable web link (e.g. `<username>.github.io/mahjongmagic`). Players open it on their phones; no app-store install. It deploys automatically from the repo.
  - GitHub Pages only serves static files and can't hide a secret, so the photo-recognition API key lives in the separate proxy above. **The proxy is invisible to players:** they only ever use the one link, with no extra sites, accounts or sign-ins. The app calls the proxy behind the scenes. Setting it up is a one-time job for the owner/developer.
  - **Decided:** the repo stays **public**, so GitHub Pages is free. No secrets are ever committed; the API key lives only in the proxy.
  - *Nothing is built or deployed yet.*

### Design direction **[TBD]**
- Mobile-first, calm, high-contrast, and readable at arm's length on a table.
- One primary action per screen. Money uses color plus a +/− sign, never color alone.
- Tiles are shown as recognizable tile images, with the Chinese character and its English name side by side.

### Conventions
- Intuitive, descriptive file names (`ScoreHandScreen.tsx`, `calculatePayout.ts`, `detectPatterns.ts`, `variants/hongKong.ts`).
- Domain vocabulary is used consistently in code and UI: *session/session → wind round → hand*, *seat wind*, *table (prevailing) wind*, *dealer*, *flower number*, *self-draw*, *discard*, *payout scale*.
- Every scoring pattern is data plus at least one test hand that's known to be valid and one that's known to be invalid.

---

## 8. Definition of done (MVP)

**General**
- [ ] The page loads with zero console errors on mobile Safari and Chrome.
- [ ] There is no horizontal scroll at 360px width, and all tap targets are ≥ 44px.

**Shared session (Feature F)**
- [ ] A host can show a 4-letter code and QR at any point in a session; inviting does not reset seats, balances, history or game number.
- [ ] A second phone can join with the code, claim an unclaimed seat, and land on the Table screen with that seat marked "You", without seeing Rules or Players setup.
- [ ] A claimed seat can't be claimed by another phone; a phone can join as watch-only.
- [ ] Confirming a game on one phone updates standings and history on every joined phone within 2 seconds.
- [ ] While one phone is scoring, the others show who is scoring and can't start a second score for the same game.
- [ ] "Score a win" pre-selects the phone's own player as the winner.
- [ ] A phone that loses connection and comes back catches up to the current state without duplicating or losing games.
- [ ] The tab bar shows Table, Score a win and Standings; Score a win opens the camera in one tap.

**Persistence**
- [ ] Refreshing the page keeps all players, seats, confirmed games, and balances (from localStorage).
- [ ] Closing and reopening the browser returns to the same table view.
- [ ] An unconfirmed game is offered as a draft to resume or discard after a reload.
- [ ] With storage blocked, the app still works and shows the "won't be saved" banner.

**A. Variant, house rules, payout scale & profiles**
- [ ] User can choose a variant before starting, and the session's scoring uses that variant's rules. The default is "Hong Kong style (MCR rules)" with the House default profile.
- [ ] With the defaults (House default, $0.10/pt), a 6-point discard win pays −$1.20 (discarder) / −$0.60 / −$0.60 and the winner +$2.40. A 6-point self-draw pays −$1.20 × 3 and the winner +$3.60.
- [ ] With the defaults, a dealer win keeps the same dealer, and a non-dealer win moves the deal to the next player and updates every flower #.
- [ ] With the defaults, each seat-matching flower scores 1 point, other flowers score 0, a full set adds +2, and a hand with only flower points is a valid win.
- [ ] With the defaults, a self-draw doesn't add the Self-Drawn fan, and a draw passes the deal.
- [ ] With the defaults, recording a melded kong immediately moves −$0.20 from each other player (+$0.60 to the owner), and a concealed or self-drawn kong −$0.40 each (+$1.20). The payment stays after a draw. If the owner then wins, the per-kong fans aren't counted, but Three Kongs / Four Kongs still are.
- [ ] With the defaults, a hand holding no flowers and scoring nothing else is a Chicken Hand (8 points). The same hand holding any flower is not a Chicken Hand.
- [ ] Switching to the "Pure MCR" profile, a 10-point discard win pays −$1.80 / −$0.80 / −$0.80 (winner +$3.40), and a hand under 8 points (excluding flowers) is flagged as not a valid win.
- [ ] Toggling each house-rule preset changes the result of its reference test hand as described in §3 A3.
- [ ] Conflicting presets can't both be active.
- [ ] Saving a table profile and choosing "Play again with ‹profile›" starts a session with the same variant, house rules, payout scale and players in **at most 2 taps**.
- [ ] Editing a profile doesn't change the scores of sessions already played with it.
- [ ] With no profile, starting a second session pre-selects the last-used variant, house rules and payout scale.

**B. Cumulative rankings**
- [ ] After each confirmed hand, the standings show each player's game result, running balance, and rank.
- [ ] Standings can be viewed per wind round and for the whole session.
- [ ] After any sequence of games, the balances sum to exactly $0.00.
- [ ] End session shows the final rankings and a "who pays whom" list of at most 3 transfers that settles every balance to $0.
- [ ] "Save & continue later" resumes the same session after closing and reopening the browser.

**C. Photo scoring**
- [ ] Taking or uploading a photo shows a tile strip the user can edit.
- [ ] For at least 10 reference hands entered as tiles (drawn from the MCR rulebook's Appendix 1 examples, whose combinations and exclusions are recorded in `variants/MCR.md` §5, plus hands from the owner's group), the system shows the correct total points and the correct named fan with reasons, applying the non-repeat and other combining rules.
- [ ] For the reference photo set, 100% of tiles are identified correctly (suit + number/symbol).
- [ ] A photo recognized with full confidence goes straight to the score with no confirmation step. A photo with any uncertain tile shows the recognized tiles with the uncertain ones highlighted, and asks for confirmation first.
- [ ] In both cases, tapping a tile lets the user change it before the game is confirmed.
- [ ] Players never leave the GitHub Pages link or sign in anywhere to use photo scoring.
- [ ] A deliberately blurry photo and a deliberately dark photo are both rejected with a retake prompt, and no score is shown.
- [ ] If recognition fails or times out, the manual tile entry opens and scoring can still be completed.
- [ ] Cancel leaves balances and history unchanged.

**D. Seat and table**
- [ ] The table view shows every player's seat wind, flower #, and the table wind, each in Chinese and English with a tile picture.
- [ ] After a non-dealer win, the seats rotate and flower #s update. After a dealer win (per variant), nothing rotates.
- [ ] After 4 deal rotations, the table wind advances.
- [ ] Seat wind, round wind, and own-flower points in Feature C come from the current seat state, with no manual input.

**E. Manual adjustments**
- [ ] Changing the payout scale "from the next game" leaves past games unchanged. "Recalculate the whole session" updates all of them, and a preview is shown first.
- [ ] Manually overriding the dealer, table wind, or seat order updates the table view immediately.

---

## 9. Success metrics (for iteration)
- Time from "Score a win" to "Confirm" is **under 30 seconds** for a typical hand (photo path).
- **Every photo** reads all tiles correctly (100% target); any correction needed during test sessions gets logged and fixed. Fewer than 1 in 5 photos needs a retake.
- **Zero rulebook lookups** for scoring during a test session.
- Final settlement takes **under 1 minute** with no disputes.
- The group chooses to use it again the following session.

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
| **5. Mix & set up next round** | Begin, play, conclude (repeat) | (n/a) | **B** standings after each game |
| **6. Conclusion of all rounds** | Typically at the end of a wind round (4 rounds) · calculate final cumulative payout · pay & clean up | End a round or set future continuation · final $ payout & rankings | **B** end-session summary, minimal transfers, save & continue |

*Note:* the edge of the last photo shows a partly cut-off orange note ("-list… F… mu… North…"). Add it here once it can be read in full.
