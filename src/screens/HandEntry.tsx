import { useState } from 'react';
import { ALL_FLOWERS, counts, isFlower, TileId, tileName } from '../engine/tiles';
import { isWinningHand } from '../engine/decompose';
import { Header } from '../components/ui';
import { Tile } from '../components/Tile';
import { Draft, useNav, useStore } from '../state/store';

const TABS: [string, TileId[]][] = [
  ['Dots', [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => 'p' + n)],
  ['Bamboo', [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => 's' + n)],
  ['Chars', [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => 'm' + n)],
  ['Honors', ['we', 'ws', 'ww', 'wn', 'dr', 'dg', 'dw']],
  ['Flowers', ALL_FLOWERS],
];

export function newDraft(defaultWinner: number): Draft {
  return { tiles: [], flowers: [], winner: defaultWinner, discarder: null, selfDraw: false, concealed: false, removed: [] };
}

export function HandEntry() {
  const store = useStore();
  const nav = useNav();
  const draft = store.draft ?? newDraft(-1);
  const [tab, setTab] = useState(0);
  const setDraft = (d: Draft) => store.update((x) => ({ ...x, draft: d }));

  const tiles = draft.tiles;
  const c = counts(tiles);
  // Four of a tile isn't always a kong: 1-2-3 plus a pung of 2s uses all four 2s in a 14-tile hand.
  // So the hand is 14 tiles, plus one only for each set of four the player says is a kong (by adding the extra tile).
  const fourOf = [...c.entries()].filter(([, n]) => n === 4).map(([t]) => t);
  const extra = tiles.length - 14;
  const left = 14 - tiles.length;
  const ready = extra >= 0 && extra <= fourOf.length;
  const kongs = Math.max(0, extra);
  const kongHint = tiles.length === 14 && fourOf.length > 0
    ? `${isWinningHand(tiles) ? 'Looks complete. ' : ''}If the four ${fourOf.map(tileName).join(' or ')} are a kong, add one more tile; if they’re used in different sets, you’re done.`
    : null;

  const add = (t: TileId) => {
    if (isFlower(t)) { if (!draft.flowers.includes(t)) setDraft({ ...draft, flowers: [...draft.flowers, t] }); return; }
    if ((c.get(t) ?? 0) >= 4) return;
    setDraft({ ...draft, tiles: [...tiles, t], removed: [], winIndex: undefined, unsure: [] });
  };
  const removeAt = (i: number) => setDraft({ ...draft, tiles: tiles.filter((_, j) => j !== i), removed: [], winIndex: undefined, unsure: [] });
  const removeFlower = (f: TileId) => setDraft({ ...draft, flowers: draft.flowers.filter((x) => x !== f) });

  const over = extra - fourOf.length;
  const label = ready ? 'Score this hand' : left > 0 ? `Add ${left} more tile${left === 1 ? '' : 's'}` : `Remove ${over} tile${over === 1 ? '' : 's'}, or finish a kong`;
  return (
    <div className="app">
      <Header title="Enter the hand" />
      <div className="body">
        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2>Winning hand</h2>
            <span aria-live="polite" className="num" style={{ fontSize: 14, fontWeight: 600 }}>{tiles.length <= 14 ? `${tiles.length} of 14 tiles` : `${tiles.length} tiles · ${kongs} kong${kongs === 1 ? '' : 's'}`}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', rowGap: 10, columnGap: 4, justifyItems: 'center' }}>
            {tiles.map((t, i) => <Tile key={i} t={t} size={0.64} win={i === tiles.length - 1 && ready} onClick={() => removeAt(i)} label={`${tileName(t)}, tap to remove`} />)}
            {Array.from({ length: Math.max(0, left) }, (_, i) => <span key={'e' + i} aria-hidden="true" style={{ width: 38, height: 51, border: '1px dashed var(--line)', borderRadius: 6 }} />)}
          </div>
          {draft.flowers.length > 0 && (
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
              <span className="label">Flowers</span>
              {draft.flowers.map((f) => <Tile key={f} t={f} size={0.64} onClick={() => removeFlower(f)} label={`${tileName(f)}, tap to remove`} />)}
            </div>
          )}
          {kongHint && <p style={{ margin: 0, fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{kongHint}</p>}
          <p className="muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.4 }}>Add the winning tile last. Tap a tile above to remove it. A hand is 14 tiles; each kong adds one more (add all four tiles), plus any flowers.</p>
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2>Add tiles</h2>
          <div className="seg" role="tablist" aria-label="Tile suit" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 6 }}>
            {TABS.map(([name], i) => <button key={name} type="button" role="tab" aria-selected={tab === i} style={{ minHeight: 40, fontSize: 13, padding: 0 }} onClick={() => setTab(i)}>{name}</button>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', rowGap: 12, justifyItems: 'center', paddingBottom: 4 }}>
            {TABS[tab][1].map((t) => <Tile key={t} t={t} size={0.85} onClick={() => add(t)} label={`Add ${tileName(t)}`} />)}
          </div>
        </section>
      </div>
      <footer className="footer">
        <button type="button" className="btn btn-primary" disabled={!ready} onClick={() => nav.go('score')}>{label}</button>
      </footer>
    </div>
  );
}
