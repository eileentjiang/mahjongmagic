import { useState } from 'react';
import { TileId, tileName } from '../engine/tiles';
import { Header } from '../components/ui';
import { Tile } from '../components/Tile';
import { useNav, useStore } from '../state/store';

/** Shown only when the photo reader wasn't sure about some tiles. */
export function Unsure() {
  const store = useStore();
  const nav = useNav();
  const draft = store.draft!;
  const pending = draft.unsure ?? [];
  const [at, setAt] = useState(0);
  const current = pending[Math.min(at, pending.length - 1)];

  const choose = (t: TileId) => {
    const tiles = draft.tiles.map((x, i) => (i === current.index ? t : x));
    const left = pending.filter((p) => p.index !== current.index);
    store.update((d) => ({ ...d, draft: { ...d.draft!, tiles, unsure: left } }));
    setAt(0);
  };

  return (
    <div className="app">
      <Header title={pending.length ? `Check ${pending.length} tile${pending.length === 1 ? '' : 's'}` : 'All checked'} />
      <div className="body">
        <p style={{ margin: 0, fontSize: 15 }}>{pending.length ? 'Here’s what I see. I’m not sure about the outlined tile.' : 'Thanks. Everything else read clearly.'}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', rowGap: 10, columnGap: 4, justifyItems: 'center' }}>
          {draft.tiles.map((t, i) => <Tile key={i} t={t} size={0.64} win={current?.index === i} label={tileName(t)} />)}
        </div>
        {current && (
          <section className="panel" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ fontSize: 17 }}>Which tile is this?</h2>
            <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
              {[draft.tiles[current.index], ...current.alternatives.filter((a) => a !== draft.tiles[current.index])].slice(0, 4).map((t) => (
                <button key={t} type="button" onClick={() => choose(t)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, border: 'none', background: 'none', padding: 4 }}>
                  <Tile t={t} size={0.85} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{tileName(t)}</span>
                </button>
              ))}
            </div>
            <button type="button" className="link-btn" onClick={() => nav.go('entry')}>Something else… fix it by hand</button>
          </section>
        )}
        <button type="button" className="link-btn" style={{ fontSize: 14 }} onClick={() => nav.go('entry')}>Spotted another mistake? Edit the tiles</button>
      </div>
      <footer className="footer">
        <button type="button" className="btn btn-primary" onClick={() => nav.go('score')}>{pending.length ? 'Looks right · score it' : 'Score it'}</button>
      </footer>
    </div>
  );
}
