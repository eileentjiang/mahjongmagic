import { Fragment, useEffect, useState } from 'react';
import { Answer, getStats, Stats } from '../api';
import { emptyModelStats } from './accuracyUtil';
import { tileName } from '../engine/tiles';
import { Header } from '../components/ui';

const pct = (n: number, d: number) => (d ? `${Math.round((100 * n) / d)}%` : '–');
const short = (m: string) => m.split('/').pop() ?? m;
const cents = (usd: number) => `${(usd * 100).toFixed(1)}¢`;

const dash = (n: number | undefined) => (n === undefined ? '–' : n.toLocaleString());
const ANSWERS: [Answer, string][] = [['smooth', 'Smooth'], ['confusing', 'Confusing'], ['frustrating', 'Frustrating']];

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px 12px', fontSize: 15 }}>
      {rows.map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd className="num" style={{ margin: 0, fontWeight: 700, textAlign: 'right' }}>{v}</dd></Fragment>)}
    </dl>
  );
}

function Bar({ n, total }: { n: number | undefined; total: number }) {
  return (
    <span style={{ display: 'grid', gridTemplateColumns: '1fr 22px', alignItems: 'center', gap: 6 }}>
      <span style={{ display: 'block', height: 12, background: 'var(--divider)' }}>
        <span style={{ display: 'block', height: '100%', width: `${total && n ? (100 * n) / total : 0}%`, background: 'var(--ink)' }} />
      </span>
      <span className="num" style={{ fontWeight: 700, textAlign: 'right' }}>{dash(n)}</span>
    </span>
  );
}

/** What players do with the app, and how well photo reading is going. Counts only: no names or photos. */
export function Metrics() {
  const [data, setData] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { getStats().then(setData).catch((e) => setError((e as Error).message)); }, []);
  const names = data ? [...new Set([...Object.keys(data.costs), ...Object.keys(data.byModel)])] : [];
  const models = names.map((m) => [m, data!.byModel[m] ?? emptyModelStats(), data!.costs[m]] as const)
    .sort((a, b) => Number(b[0] === data!.inUse) - Number(a[0] === data!.inUse) || (b[2]?.photos ?? b[1].photos) - (a[2]?.photos ?? a[1].photos));
  const all = Object.values(data?.byModel ?? {});
  const photos = all.reduce((n, s) => n + s.photos, 0), right = all.reduce((n, s) => n + s.perfectPhotos, 0), photoTiles = all.reduce((n, s) => n + s.tiles, 0);
  const u = data?.usage ?? null;
  const ci = u?.checkin;
  const scoringTotal = ci ? Object.values(ci.scoring).reduce((a, b) => a + b, 0) : 0;
  const overallTotal = ci ? Object.values(ci.overall).reduce((a, b) => a + b, 0) : 0;
  return (
    <div className="app">
      <Header title="Metrics" />
      <div className="body" style={{ gap: 14 }}>
        {error && <p role="alert" style={{ margin: 0, fontWeight: 600 }}>{error}</p>}
        {!data && !error && <p className="muted" style={{ margin: 0 }}>Loading…</p>}
        {data && (
          <>
            <section style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '18px 16px', background: 'var(--walnut)', color: 'var(--ground)' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>North star</span>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span className="num" style={{ fontSize: 34, fontWeight: 700 }}>{right} / {photos}</span>
                <span className="num" style={{ fontSize: 15, fontWeight: 600, opacity: 0.8 }}>{pct(right, photos)}</span>
              </span>
              <span style={{ fontSize: 15 }}>photo scores needed no tile fixes</span>
            </section>
            <section className="panel" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h2 style={{ fontSize: 17 }}>Sessions</h2>
              <Rows rows={[['Started', dash(u?.sessionsStarted)], ['Settled', dash(u?.sessionsSettled)], ['Settled rate', u ? pct(u.sessionsSettled, u.sessionsStarted) : '–']]} />
            </section>
            <section className="panel" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h2 style={{ fontSize: 17 }}>How games were scored</h2>
              <Rows rows={[['Games by photo', dash(photos)], ['Games by hand', dash(u?.handGames)], ['Tiles by photo', dash(photoTiles)], ['Tiles by hand', dash(u?.handTiles)]]} />
            </section>
            <section className="panel" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h2 style={{ fontSize: 17 }}>Check-in after finish</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '78px minmax(0, 1fr) minmax(0, 1fr)', alignItems: 'center', gap: '10px 14px', fontSize: 14 }}>
                <span />
                <span className="muted" style={{ fontSize: 13, fontWeight: 600 }}>Scoring</span>
                <span className="muted" style={{ fontSize: 13, fontWeight: 600 }}>Session overall</span>
                {ANSWERS.map(([a, label]) => (
                  <Fragment key={a}>
                    <span>{label}</span>
                    <Bar n={ci?.scoring[a]} total={scoringTotal} />
                    <Bar n={ci?.overall[a]} total={overallTotal} />
                  </Fragment>
                ))}
              </div>
            </section>
            <h2 style={{ fontSize: 20, marginTop: 10 }}>Photo accuracy by model</h2>
            {models.length === 0 && <p className="muted" style={{ margin: 0 }}>No photo-scored games yet.</p>}
          </>
        )}
        {models.map(([m, s, cost]) => {
          const top = Object.entries(s.confusions).sort((a, b) => b[1] - a[1]).slice(0, 6);
          return (
            <section key={m} className="panel" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <span className="row" style={{ gap: 8 }}><h2 style={{ fontSize: 17 }}>{short(m)}</h2>{m === data!.inUse && <span className="tag tag-you">In use</span>}</span>
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
                <dt>Wrong but marked sure</dt><dd className="num" style={{ margin: 0, fontWeight: 700 }}>{s.silentWrong}</dd>
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
