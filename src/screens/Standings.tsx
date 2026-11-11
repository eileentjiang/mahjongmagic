import { useState } from 'react';
import { money } from '../engine/rules';
import { SessionEvent } from '../engine/session';
import { WIND_ZH, WINDS } from '../engine/tiles';
import { Header, PLAYER_COLORS, TabBar } from '../components/ui';
import { useNav, useStore } from '../state/store';

export function eventLine(players: string[], e: SessionEvent, n: number): { title: string; detail: string; amt: string } | null {
  if (e.type === 'game') {
    const how = e.discarder === null ? 'self-drew' : `won off ${players[e.discarder]}`;
    return { title: `Game ${n} · ${players[e.winner]} ${how}`, detail: `${e.points} pt${e.points === 1 ? '' : 's'} · ${e.fans.slice(0, 3).map((f) => f.name).join(', ')}${e.edited ? ' · edited' : ''}`, amt: money(e.cents[e.winner], true) };
  }
  if (e.type === 'draw') return { title: `Game ${n} · Draw`, detail: 'No winner · no money moved', amt: '$0.00' };
  if (e.type === 'kong') return { title: `Kong · ${players[e.owner]}`, detail: `${{ melded: 'Melded', concealed: 'Concealed', selfDrawn: 'Self-drawn' }[e.kind]} kong`, amt: money(e.cents[e.owner], true) };
  if (e.type === 'rules') return { title: 'Rules changed', detail: 'Applies from the next game on', amt: '' };
  return null;
}

export function Standings() {
  const store = useStore();
  const nav = useNav();
  const s = store.current!, st = store.table!;
  const [round, setRound] = useState(false);
  const bal = round ? st.balances.map((b, i) => b - st.roundStart[i]) : st.balances;
  const ranked = [0, 1, 2, 3].sort((a, b) => bal[b] - bal[a]);
  let n = 0;
  const rows = s.events.map((e) => { if (e.type === 'game' || e.type === 'draw') n++; return eventLine(s.players, e, n); }).filter(Boolean).reverse();
  return (
    <div className="app">
      <Header title="Standings" />
      <div className="body">
        <div className="seg" role="group" aria-label="Show totals for" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <button type="button" aria-pressed={!round} onClick={() => setRound(false)}>Whole session</button>
          <button type="button" aria-pressed={round} onClick={() => setRound(true)}>{['East', 'South', 'West', 'North'][st.tableWind]} round</button>
        </div>
        <ol aria-label="Standings" style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ranked.map((i, r) => (
            <li key={i} className="row" style={{ gap: 10, minHeight: 54, padding: '0 16px', background: PLAYER_COLORS[i], border: '1px solid var(--line)' }}>
              <span style={{ width: 22, fontSize: 18, fontWeight: 700 }}>{r + 1}</span>
              <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, flexGrow: 1 }}>
                <span className="zh" lang="zh-Hant" style={{ fontSize: 18 }}>{WIND_ZH[WINDS[(i - st.dealer + 4) % 4]]}</span>
                <span style={{ fontSize: 16, fontWeight: 600 }}>{s.players[i]}</span>
              </span>
              <span className="num" style={{ fontSize: 18, fontWeight: 700 }}>{money(bal[i], true)}</span>
            </li>
          ))}
        </ol>
        <section style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ minHeight: 44, display: 'flex', alignItems: 'center' }}>Games</h2>
          {rows.length === 0 && <p className="muted" style={{ margin: 0, fontSize: 14 }}>No games yet. Tap “Score a win” when someone wins.</p>}
          {rows.map((h, i) => (
            <div key={i} className="row" style={{ gap: 10, minHeight: 58, padding: '6px 0', borderBottom: '1px solid var(--divider)' }}>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{h!.title}</span>
                <span className="muted" style={{ fontSize: 13 }}>{h!.detail}</span>
              </span>
              <span className="num" style={{ fontSize: 15, fontWeight: 700 }}>{h!.amt}</span>
            </div>
          ))}
        </section>
        <button type="button" className="btn" onClick={() => nav.openSheet('endConfirm')}>End session &amp; settle up</button>
      </div>
      <TabBar current="standings" />
    </div>
  );
}
