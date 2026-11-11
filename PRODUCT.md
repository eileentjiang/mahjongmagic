# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React + TypeScript, Tailwind CSS, Lucide icons. One tiny proxy (e.g. a Cloudflare Worker) for photo recognition, so the API key never reaches the browser or the repo. No database; all state is in `localStorage` behind a single storage module. Scoring, pattern detection, payout and seat-rotation logic are pure functions in `src/engine/`, unit-tested with Vitest.

Hosting: GitHub Pages (a shareable web link), not built or deployed yet.

## Users

**Primary: the Friendly Game Night player.** Four friends at one table for a 3–4 hour sitting, playing for small stakes. They know the basic rules but go back to the rulebook to count what a winning hand is worth. Money changes hands once, at the end of the session; until then they track it with tokens or notes.

The app runs on one phone in portrait, either passed around the table or kept by one scorekeeper, and is read at arm's length by people mid-game.

Secondary (not the MVP target, but the MVP must not make them harder to serve later): the Beginner, the Community Player, and the Eccentric. See `docs/PRD.md` appendix.

## Product Purpose

Score a winning hand from a photo and keep the session's money straight, so the table stays focused on playing rather than on doing maths.

After each win the app gives the points, a plain-language reason for each scoring pattern, the dollar payout for every player, and a running tally. At the end of the session it gives final standings and the fewest transfers that settle everyone.

Success means a hand goes from "Score a win" to "Confirm" in under 30 seconds, nobody opens the rulebook during a test session, and settlement takes under a minute with no disputes. The group chooses to use it again next session.

## Positioning

The whole loop for a session in one place: photograph the hand, see why it scores what it scores, and see who owes whom, with seat winds and flower numbers tracked automatically so self-draw and seat points are never misapplied.

The AI only reads tiles. A deterministic, tested rules engine does all scoring, and the user always checks the tiles before anything counts.

## Operating Context

- A real mahjong table: a physical set, a mat, four players, tokens or notes for scores today.
- Hand lifecycle: someone wins, reveals the hand (melds and flowers), the score is counted, and payment is settled on a self-draw (all three pay) or a discard (the discarder pays all or a larger share). The deal then stays or moves; when it moves, seats rotate and everyone gets a new flower number. After four rotations the table wind advances.
- A session is usually one full wind round (East, South, West, North), sometimes saved and continued later.
- House rules and disputes are normal; the app has to absorb corrections without losing history.

## Capabilities and Constraints

MVP features (detail in `docs/PRD.md` §3):

- **A. Variant, house rules & profiles.** v1 scores **"Hong Kong style (MCR rules)"**: the MCR 2014 fan list (`docs/variants/MCR.md`) with the owner's **House default** house profile as the default (`docs/variants/GAME_NIGHT_DEFAULT.md`): minimum above 0 points, discarder pays 2× and the others 1×, self-draw doubles everyone's payment, the dealer keeps the deal on a win, and only seat-matching flowers score. Other variants appear in the picker as "coming soon". The payout scale defaults to **$0.10 per point** and is editable. Popular **house-rule presets** are toggles, and a **saved table profile** (variant + house rules + payout + players) starts a session in at most 2 taps. Each variant is a rules config (data), never hard-coded.
- **B. Cumulative standings.** Per-hand +/−$, running balance and rank; roll-ups per wind round and per session; at most 3 settlement transfers; finish, or save and continue later.
- **C. Photo scoring.** A still photo becomes an editable tile strip, then points, per-pattern reasons and a payout preview. Manual tile entry is always available, and scoring never depends on the camera or network.
- **D. Seat and table.** Each player's seat wind, flower number, the dealer and the table wind, shown in Chinese and English with a tile picture. Rotation is automatic. A large "My seat" card for each player.
- **E. Manual adjustments.** Edit or undo any hand (everything after it recalculates), change the payout scale from now on or for the whole session, override seating, add one-off payments, and override scores with a visible tag.

Hard constraints:

- Exactly 4 seated players; English UI with Chinese characters alongside for winds, flowers and tiles.
- No accounts, sync, payment integrations, ads, analytics, tutorials, or stored photos.
- Money is stored as integer cents, and balances always sum to exactly $0.
- Every confirmed action persists immediately; with storage blocked, the app still works and says the session won't be saved.
- Domain vocabulary, used the same in code and UI: session → wind round → hand; seat wind; table (prevailing) wind; dealer; flower number; self-draw; discard; payout scale.

Photo scoring must identify every tile's suit and number/symbol, and reject blurry or dark photos with a retake prompt. When two players call the same discard, the first caller wins. Photo recognition targets 100% accuracy, asks for confirmation only when unsure, and its proxy is invisible to players, who only ever use one link. Hosting: GitHub Pages from the public repo. Player substitution is Phase 2.

## Brand Commitments

The name "Mahjong Magic" is the only commitment. Voice, logo and visual identity are not decided.

## Evidence on Hand

- `docs/PRD.md`: the PRD (v0.2 draft), including research personas and the customer journey from sticky-note boards.
- `docs/PARKING_LOT.md`: post-MVP ideas.
- No tile artwork, reference hand photos, test fixtures, user quotes or testimonials exist yet. Future work must not invent any.

## Product Principles

1. **The game comes first.** Every interaction should be quick enough not to pull the table out of play.
2. **Show the reason.** Every point and every dollar can be traced to a named pattern or rule that people can read.
3. **Never block scoring.** Camera, network or recognition failures fall back to manual entry; storage failures never stop the session.
4. **Corrections are cheap and visible.** Anything can be edited, everything downstream recalculates, and edits are tagged.
5. **The variant is data.** Rules and payouts live in configs, so new variants and house rules don't need a new engine.

## Accessibility & Inclusion

- Phone in portrait, readable at arm's length: high-contrast text, and dark mode follows the system setting.
- Tap targets of at least 44px; no horizontal scroll at 360px.
- Money uses a +/− sign as well as colour, never colour alone.
- Winds, flowers and tiles always show the Chinese character and the English name together, for players who don't read Chinese.
