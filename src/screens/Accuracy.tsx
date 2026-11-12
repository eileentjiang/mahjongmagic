import { useEffect, useState } from 'react';
import { getStats, ModelStats, PhotoCost } from '../api';
import { emptyModelStats } from './accuracyUtil';
import { tileName } from '../engine/tiles';
import { Header } from '../components/ui';

const pct = (n: number, d: number) => (d ? `${Math.round((100 * n) / d)}%` : '–');
const short = (m: string) => m.split('/').pop() ?? m;
const cents = (usd: number) => `${(usd * 100).toFixed(1)}¢`;

/** How well photo reading is doing, from every confirmed photo-scored game. */
export function Accuracy() {
  const [data, setData] = useState<{ byModel: Record<string, ModelStats>; costs: Record<string, PhotoCost> } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { getStats().then(setData).catch((e) => setError((e as Error).message)); }, []);
  const names = data ? [...new Set([...Object.keys(data.costs), ...Object.keys(data.byModel)])] : [];
  const models = names.map((m) => [m, data!.byModel[m] ?? emptyModelStats(), data!.costs[m]] as const).sort((a, b) => (b[2]?.photos ?? b[1].photos) - (a[2]?.photos ?? a[1].photos));
  return (
    <div className="app">
      <Header title="Photo accuracy" />
      <div className="body" style={{ gap: 18 }}>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.45 }}>Every time a game scored from a photo is confirmed, the app compares what the photo reader said with the tiles you confirmed. Only tile names are kept, never photos.</p>
        {error && <p role="alert" style={{ margin: 0, fontWeight: 600 }}>{error}</p>}
        {!data && !error && <p className="muted" style={{ margin: 0 }}>Loading…</p>}
        {data && models.length === 0 && <p className="muted" style={{ margin: 0 }}>No photo-scored games yet.</p>}
        {models.map(([m, s, cost]) => {
          const top = Object.entries(s.confusions).sort((a, b) => b[1] - a[1]).slice(0, 6);
          return (
            <section key={m} className="panel" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 17 }}>{short(m)}</h2>
                <span className="muted" style={{ fontSize: 13 }}>{s.photos} confirmed photo{s.photos === 1 ? '' : 's'} · {s.tiles} tiles</span>
              </div>
              {cost && cost.photos > 0 && (
                <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px 12px', fontSize: 15, paddingBottom: 12, borderBottom: '1px solid var(--divider)' }}>
                  <dt>Cost per photo <span className="muted" style={{ fontSize: 13 }}>(average of {cost.photos})</span></dt><dd className="num" style={{ margin: 0, fontWeight: 700 }}>{cents(cost.usd / cost.photos)}</dd>
                  {cost.last && <><dt>Last photo</dt><dd className="num" style={{ margin: 0, fontWeight: 700 }}>{cents(cost.last.usd)}</dd></>}
                  {cost.last && <><dt className="muted" style={{ fontSize: 13 }}>Last photo’s tokens</dt><dd className="num muted" style={{ margin: 0, fontSize: 13 }}>{cost.last.input.toLocaleString()} in · {cost.last.output.toLocaleString()} out</dd></>}
                </dl>
              )}
              <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px 12px', fontSize: 15 }}>
                <dt>Tiles read correctly</dt><dd className="num" style={{ margin: 0, fontWeight: 700 }}>{pct(s.tiles - s.wrong, s.tiles)}</dd>
                <dt>Photos with no fixes needed</dt><dd className="num" style={{ margin: 0, fontWeight: 700 }}>{pct(s.perfectPhotos, s.photos)}</dd>
                <dt>Wrong but marked sure <span className="muted" style={{ fontSize: 13 }}>(the costly kind)</span></dt><dd className="num" style={{ margin: 0, fontWeight: 700 }}>{s.silentWrong}</dd>
                <dt>Marked ? and really wrong</dt><dd className="num" style={{ margin: 0, fontWeight: 700 }}>{s.flaggedWrong} of {s.flagged}</dd>
                <dt>Tiles missed / extra</dt><dd className="num" style={{ margin: 0, fontWeight: 700 }}>{s.missed} / {s.extra}</dd>
                <dt>Flowers wrong</dt><dd className="num" style={{ margin: 0, fontWeight: 700 }}>{s.flowersWrong}</dd>
              </dl>
              {top.length > 0 && (
                <div>
                  <span className="label">Most common mix-ups</span>
                  {top.map(([k, n]) => {
                    const [a, b] = k.split('>');
                    return <div key={k} className="list-row" style={{ minHeight: 40, fontSize: 14 }}><span style={{ flexGrow: 1 }}>Read {tileName(a)}, was {tileName(b)}</span><strong className="num">×{n}</strong></div>;
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
