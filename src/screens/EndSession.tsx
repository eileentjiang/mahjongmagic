import { money } from '../engine/rules';
import { settleUp } from '../engine/payout';
import { Header, Icon, PLAYER_COLORS } from '../components/ui';
import { useNav, useStore } from '../state/store';

export function EndSession() {
  const store = useStore();
  const nav = useNav();
  const s = store.current!, st = store.table!;
  const ranked = [0, 1, 2, 3].sort((a, b) => st.balances[b] - st.balances[a]);
  const transfers = settleUp(st.balances);
  const top = ranked[0];
  const hasProfile = store.profiles.some((p) => p.name.toLowerCase() === s.name.toLowerCase());
  const mins = Math.round((Date.now() - s.createdAt) / 60000);
  const dur = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
  const summary = [`${s.name} · final standings`, ...ranked.map((i, r) => `${r + 1}. ${s.players[i]} ${money(st.balances[i], true)}`), '', 'Settle up:', ...transfers.map((t) => `${s.players[t.from]} → ${s.players[t.to]} ${money(t.cents)}`)].join('\n');
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ text: summary });
      else { await navigator.clipboard.writeText(summary); alert('Summary copied.'); }
    } catch { /* canceled */ }
  };
  const sw = (i: number) => <span className="swatch" style={{ width: 14, height: 14, background: PLAYER_COLORS[i] }} />;

  return (
    <div className="app">
      <Header title="Final standings" kicker={`${s.name} · ${st.gamesPlayed} game${st.gamesPlayed === 1 ? '' : 's'} · ${dur}`} />
      <div className="body" style={{ gap: 18 }}>
        {st.balances[top] > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: 18, background: PLAYER_COLORS[top], border: '1px solid var(--line)' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Big winner</span>
            <span style={{ fontSize: 30, fontWeight: 700 }}>{s.players[top]}</span>
            <span className="num" style={{ fontSize: 24, fontWeight: 700 }}>{money(st.balances[top], true)}</span>
          </div>
        )}
        <ol aria-label="Final standings" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {ranked.map((i, r) => (
            <li key={i} className="list-row" style={{ minHeight: 46 }}>
              <span style={{ width: 20, fontWeight: 700 }}>{r + 1}</span>{sw(i)}
              <span style={{ flexGrow: 1, fontWeight: 600 }}>{s.players[i]}</span>
              <span className="num" style={{ fontWeight: 700 }}>{money(st.balances[i], true)}</span>
            </li>
          ))}
        </ol>
        <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2>{transfers.length ? `Settle up · ${transfers.length} payment${transfers.length === 1 ? '' : 's'}` : 'Everyone is even'}</h2>
          {transfers.map((t, k) => (
            <div key={k} className="row" style={{ gap: 10, minHeight: 52, padding: '0 16px', border: '1px solid var(--line)' }}>
              {sw(t.from)}<span style={{ fontWeight: 600 }}>{s.players[t.from]}</span><Icon.arrow />
              {sw(t.to)}<span style={{ flexGrow: 1, fontWeight: 600 }}>{s.players[t.to]}</span>
              <span className="num" style={{ fontWeight: 700 }}>{money(t.cents)}</span>
            </div>
          ))}
        </section>
        {!hasProfile && (
          <section className="panel" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <h2 style={{ fontSize: 17 }}>Play with this group again?</h2>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.4 }}>Save the players, seats and rules. Next time it’s one tap from Home.</p>
            </div>
            <button type="button" className="btn" style={{ background: 'var(--ground)' }} onClick={() => store.saveProfile(s)}>Save as “{s.name}”</button>
          </section>
        )}
        {hasProfile && <p className="muted" style={{ margin: 0, fontSize: 14 }}>Saved as a table profile: “{s.name}”.</p>}
        <button type="button" className="link-btn" style={{ justifyContent: 'center' }} onClick={share}><Icon.share />Share summary</button>
      </div>
      <footer className="footer">
        <button type="button" className="btn btn-primary" onClick={() => { store.finishSession(false); nav.reset('home'); }}>Finish session</button>
        <button type="button" className="btn" onClick={() => { store.finishSession(true); nav.reset('home'); }}>Save &amp; continue another day</button>
      </footer>
    </div>
  );
}
