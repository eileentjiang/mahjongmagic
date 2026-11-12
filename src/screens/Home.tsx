import { money, rulesSummary } from '../engine/rules';
import { replay } from '../engine/session';
import { WIND_ZH, WINDS } from '../engine/tiles';
import { Icon, PLAYER_COLORS } from '../components/ui';
import { useNav, useStore } from '../state/store';

export function Home() {
  const store = useStore();
  const nav = useNav();
  const cur = store.current && !store.current.finished ? store.current : null;
  const firstTime = !cur && store.profiles.length === 0 && store.sessions.length === 0;
  const start = () => { store.startSetup(); nav.go('rules'); };

  return (
    <div className="app" style={{ padding: 'calc(28px + env(safe-area-inset-top)) 20px calc(20px + env(safe-area-inset-bottom))', gap: 20 }}>
      <h1 style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: 10, fontSize: 30, lineHeight: 1.1 }}>
        <span className="zh" lang="zh-Hant">麻將</span><span style={{ fontWeight: 700 }}>Mahjong Magic</span>
      </h1>

      {firstTime ? (
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
          <img src="./tile-art.png" alt="A mahjong tile with a persimmon framed in a ruyi cloud" width={210} style={{ width: 210, height: 'auto' }} />
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h2 style={{ fontSize: 22 }}>You play, we count</h2>
            <p style={{ margin: 0, maxWidth: 300, fontSize: 15, lineHeight: 1.45 }} className="muted">Snap the winning hand, see who pays what, and settle up at the end.</p>
          </div>
        </div>
      ) : (
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {cur && <CurrentSession />}
          {store.profiles.length > 0 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h2>Play again</h2>
              {store.profiles.map((p) => (
                <button key={p.id} type="button" className="list-row" style={{ border: 'none', borderBottom: '1px solid var(--divider)', background: 'none', textAlign: 'left', padding: '6px 0' }}
                  onClick={() => { store.startSetup(p); nav.go('players'); }}>
                  <span style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 16, fontWeight: 600 }}>{p.name}</span>
                    <span className="muted" style={{ fontSize: 13 }}>{p.players.join(', ')} · {rulesSummary(p.rules).replace('Hong Kong style · ', '')}</span>
                  </span>
                  <Icon.chevron />
                </button>
              ))}
            </section>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button type="button" className={cur ? 'btn' : 'btn btn-primary'} onClick={start}>Start a new session</button>
        <button type="button" className="btn" onClick={() => nav.go('join')}>Join a session</button>
        <footer style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button type="button" className="link-btn muted" style={{ fontSize: 13, fontWeight: 500, textDecoration: 'underline' }} onClick={() => nav.go('about')}>About Mahjong Magic</button>
          <span className="muted" style={{ fontSize: 12 }}>© Eileen Jiang</span>
        </footer>
      </div>
    </div>
  );
}

function CurrentSession() {
  const store = useStore();
  const nav = useNav();
  const s = store.current!;
  const st = replay(s);
  return (
    <section className="panel" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 4px 0 var(--tile-edge)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 18, fontWeight: 700 }}>{s.name}</span>
        <span className="muted" style={{ fontSize: 14 }}>{['East', 'South', 'West', 'North'][st.tableWind]} round · game {st.gameNumber}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {s.players.map((p, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5, padding: '7px 10px', fontSize: 13, fontWeight: 600, border: '1px solid var(--line)', background: PLAYER_COLORS[i] }}>
            <span className="zh" lang="zh-Hant">{WIND_ZH[WINDS[(i - st.dealer + 4) % 4]]}</span>{p} <span className="num">{money(st.balances[i], true)}</span>
          </span>
        ))}
      </div>
      <button type="button" className="btn btn-primary" onClick={() => nav.go('table')}>Continue session</button>
    </section>
  );
}
