# Mahjong Magic: technical spec (stage 1)

Companion to [PRD.md](./PRD.md) and [DESIGN.md](./DESIGN.md). This covers how stage 1 is built: one phone keeps score, hands are entered by tapping tiles, and the app is a static site on GitHub Pages.

## Stages
| Stage | Ships | Needs from the owner |
|---|---|---|
| **1. Scorekeeper** | Setup, table, kongs, draws, hand entry, scoring engine, standings, end of session. Saved on the phone. | Turn on GitHub Pages (Settings → Pages → Source: GitHub Actions) and merge the PR |
| **2. Photos + custom rules** | Photo recognition and plain-language custom rules, through a small Cloudflare Worker that holds the API key | A Cloudflare account and an Anthropic API key |
| **3. Shared session** | Join by code/QR, live sync between phones (Cloudflare Durable Object) | Same Cloudflare account |

## Stack
- Vite + React + TypeScript, plain CSS with design tokens (`src/styles.css`), no UI framework.
- Vitest for the engine.
- `base: './'` so the build works from any Pages path. A web manifest lets it be added to the home screen.
- Deploy: `.github/workflows/deploy.yml` builds on every push to `main` and publishes `dist/` to Pages.

## Layout
```
src/
  engine/        pure functions, no React
    tiles.ts       tile ids, names, suits, helpers
    decompose.ts   every way a hand splits into sets + pair (and special shapes)
    fans.ts        MCR pattern detection + exclusions, picks the best-scoring split
    rules.ts       rule set: House default and Pure MCR presets
    score.ts       applies house rules (flowers, Chicken Hand, kongs, minimum) → points
    payout.ts      points → cents per player, discard/self-draw split, kongs
    session.ts     ledger replay: balances, dealer, seat winds, flower numbers, table wind
  state/store.ts  session state, actions, localStorage persistence
  screens/        one file per screen, matching the canvas board numbers
  components/     Tile, Sheet, TabBar, etc.
```

## Data model
- **Tile id**: `m1`–`m9` characters, `p1`–`p9` dots, `s1`–`s9` bamboo, `we ws ww wn` winds, `dr dg dw` dragons, `f1`–`f4` flowers (plum, orchid, chrysanthemum, bamboo), `x1`–`x4` seasons.
- **Session**: name, rule set (copied in, so later edits never change it), players in seat order (index 0 = first dealer), and an **ordered event list**: `game` (winner, discarder or self-draw, tiles, flowers, concealed, result) · `draw` · `kong` (owner, kind) · `rulesChange` (new rule set, applies from that point on).
- **Everything else is derived** by replaying the events: balances, dealer, seat winds, flower numbers, table wind, game number. Money is integer cents and every event nets to 0.
- Saved to `localStorage` on every change. If storage is blocked, the app still runs and shows the "won't be saved" banner.

## Scoring engine
1. **Decompose** the 14+ tiles (kongs are 4 of a kind) into 4 sets + pair, Seven Pairs, Thirteen Orphans, or Honors & Knitted / Knitted Straight shapes.
2. **Detect fans** for each decomposition with the hand context (seat wind, table wind, self-draw, concealed, winning tile). Apply the exclusion table from `variants/MCR.md` §5 and the non-repeat principle; only one wait fan.
3. **Pick the highest total.** Flowers are added after.
4. **House rules** adjust: own-seat flowers (1 each), full set +2, Chicken Hand only with no flowers, no Self-Drawn fan, per-kong fans dropped when kongs are paid on the spot, minimum.
5. **Payout**: House default → discarder 2H, others H; self-draw everyone 2H. Pure MCR → points + 8 rules.

Stage 1 limits (honest): concealment is one switch for the whole hand ("any sets melded?"), and the winning tile is the last tile entered. Win-context fans (last tile, robbing the kong, replacement tile) aren't scored (parking lot). Combining principles beyond the exclusion table (account-once) are approximated.
