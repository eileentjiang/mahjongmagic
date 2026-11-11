---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: []
---

# App shell (mobile web), Operate mode

Scope: every in-app screen of Mahjong Magic (phone portrait, mid-game, passed around a table under warm indoor light). Layout and flow are set by the approved grayscale wireframes; this brief governs type, palette, density and the signature move only.

Status: style v3 applied to all 13 screens on the canvas page "App · Palette C". Not built in code yet; no DESIGN.md yet.

## Direction contract

THESIS: A modern Chinese game-night tool: rice paper, ink and the four directions' colours, with tiles you could pick up. Refuses both the red-and-gold "Oriental" costume and the generic grey card app.

OWN-WORLD: Clean and flat: warm paper ground #FBF8EF, ink #161A1A, no grain/ornament on UI (grain only on tiles). Seat fills mint #C2DDD1 East, apricot #E8875A South, butter #F3E9B4 West, light lavender #BCC0DE North; every outline 1px khaki #B09B76; dividers #E3DCC8. Primary action dark walnut #5A3826 with cream text; selected states use the same brown. Buttons 8px radius; all containers sharp rectangles. Onest for all English (weights 400–700, tabular numbers); Noto Serif TC only for tiles, winds, honours and the Home title 麻將. Tiles: ivory face, khaki outline, light-lavender back edge, real dot layouts, 伍 for five.

STORY: Players see whose seat is whose by colour and character at a glance, read why a hand scored in English and Chinese, and confirm the money without doubt.

FIRST VIEWPORT: Table screen: title "東 East round", four seat cards (2x2) each led by wind character + English direction side by side, then name, flower number and balance; Dealer tag in khaki outline; walnut "Score a win" pinned at the bottom thumb zone with two khaki-outlined secondary buttons.

FORM: Owner-pinned world; layout from the approved wireframes. Signature move: seat cards as colour swatch cards with vertical characters, plus ivory-on-jade tactile tile components. seed: none (pinned): "i looove the style of the first one", "for color schemes i love on the top right section a couple combos", "i love the modern feel of the third picture and want to use that as primary base", "for the mahjong tile just a broad inspo", "i want it to feel genuinely chinese without being too tacky or caricaturey".

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
