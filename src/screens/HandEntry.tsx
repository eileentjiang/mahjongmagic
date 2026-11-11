import { useState } from 'react';
import { ALL_FLOWERS, counts, isFlower, TileId, tileName } from '../engine/tiles';
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
  const kongs = [...c.values()].filter((n) => n === 4).length;
  const target = 14 + kongs;
  const left = target - tiles.length;
  const ready = left === 0;

  const add = (t: TileId) => {
    if (isFlower(t)) { if (!draft.flowers.includes(t)) setDraft({ ...draft, flowers: [...draft.flowers, t] }); return; }
    if ((c.get(t) ?? 0) >= 4) return;
    setDraft({ ...draft, tiles: [...tiles, t], removed: [] });
  };
  const removeAt = (i: number) => setDraft({ ...draft, tiles: tiles.filter((_, j) => j !== i), removed: [] });
  const removeFlower = (f: TileId) => setDraft({ ...draft, flowers: draft.flowers.filter((x) => x !== f) });

  const label = ready ? 'Score this hand' : left > 0 ? `Add ${left} more tile${left === 1 ? '' : 's'}` : `Remove ${-left} tile${left === -1 ? '' : 's'}, or finish a kong`;
  return (
    <div className="app">
      <Header title="Enter the hand" />
      <div className="body">
        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2>Winning hand</h2>
            <span aria-live="polite" className="num" style={{ fontSize: 14, fontWeight: 600 }}>{tiles.length} of {target} tiles{kongs ? ` · ${kongs} kong${kongs === 1 ? '' : 's'}` : ''}</span>
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
