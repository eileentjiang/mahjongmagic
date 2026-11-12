import { useState } from 'react';
import { rulesSummary } from '../engine/rules';
import { Header, Icon, PLAYER_COLORS } from '../components/ui';
import { useNav, useStore } from '../state/store';

const WINDS = [['東', 'EAST'], ['南', 'SOUTH'], ['西', 'WEST'], ['北', 'NORTH']];

export function Players({ session = false }: { session?: boolean }) {
  const store = useStore();
  const nav = useNav();
  const src = session ? { name: store.current!.name, players: store.current!.players } : store.setup!;
  const [name, setName] = useState(src.name);
  const [players, setPlayers] = useState<string[]>(src.players);
  const [saveProfile, setSaveProfile] = useState(false);
  const table = store.table;
  const [dealer, setDealer] = useState(table?.dealer ?? 0);
  const [wind, setWind] = useState(table?.tableWind ?? 0);
  const rules = session ? table!.rules : store.setup!.rules;
  // Mid-session, winds follow the current dealer.
  const windOf = (i: number) => (session ? (i - (table?.dealer ?? 0) + 4) % 4 : i);

  const names = players.map((p) => p.trim().toLowerCase()).filter(Boolean);
  const dupes = names.length !== new Set(names).size;

  const move = (i: number) => {
    if (i === 0) return;
    const p = [...players];
    [p[i - 1], p[i]] = [p[i], p[i - 1]];
    setPlayers(p);
  };
  const shuffle = () => {
    const p = [...players];
    for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    setPlayers(p);
  };
  const finish = async () => {
    if (session) {
      if (await store.saveSeating({ name, players, dealer, tableWind: wind })) nav.back();
      return;
    }
    store.update((d) => ({ ...d, setup: { ...d.setup!, name, players, saveProfile } }));
    store.startSession();
    nav.reset('table');
  };

  return (
    <div className="app">
      <Header title="Players & seats" kicker={session ? undefined : 'Step 2 of 2'} />
      <div className="body" style={{ gap: 14 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="label">Table name</span>
          <input className="field" style={{ fontWeight: 600 }} value={name} placeholder="e.g. Thursday crew" onChange={(e) => setName(e.target.value)} />
        </label>
        {!session && (
          <div className="row" style={{ minHeight: 48, padding: '0 6px 0 14px', border: '1px solid var(--line)', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 500, flexGrow: 1 }}>{rulesSummary(rules)}</span>
            <button type="button" className="link-btn" style={{ padding: '0 8px', fontSize: 14 }} onClick={nav.back}>Edit</button>
          </div>
        )}
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>{session ? 'Fix a name. Seats stay where they are, so balances stay with the right person.' : 'List players in seat order, going counter-clockwise. East deals first.'}</p>

        {players.map((p, i) => {
          const w = WINDS[windOf(i)];
          return (
            <div key={i} className="row">
              <div style={{ flexShrink: 0, width: 64, height: 64, background: PLAYER_COLORS[i], border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                <span className="zh" lang="zh-Hant" style={{ fontSize: 26, lineHeight: 1 }}>{w[0]}</span>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4 }}>{w[1]}</span>
              </div>
              <input className="field" aria-label={`Player in the ${w[1].toLowerCase()} seat`} value={p} placeholder={`Player ${i + 1}`} onChange={(e) => setPlayers(players.map((x, j) => (j === i ? e.target.value : x)))} />
              {!session && <button type="button" className="icon-btn" aria-label={`Move ${p || `player ${i + 1}`} up a seat`} disabled={i === 0} style={{ opacity: i === 0 ? 0.3 : 1 }} onClick={() => move(i)}><Icon.up /></button>}
            </div>
          );
        })}
        {dupes && <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Two players have the same name. That’s allowed, but it may get confusing.</p>}

        {!session && <button type="button" className="btn" onClick={shuffle}><Icon.shuffle />Shuffle seats</button>}

        {session && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
            <div>
              <h2>Dealer &amp; table wind</h2>
              <span className="muted" style={{ fontSize: 13 }}>Only change these if the app doesn’t match your table.</span>
            </div>
            <div className="seg" role="group" aria-label="Dealer" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
              {players.map((p, i) => <button key={i} type="button" className="chip" aria-pressed={dealer === i} style={{ background: PLAYER_COLORS[i] }} onClick={() => setDealer(i)}>{p}</button>)}
            </div>
            <div className="seg" role="group" aria-label="Table wind" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
              {['East', 'South', 'West', 'North'].map((w, i) => (
                <button key={w} type="button" aria-pressed={wind === i} onClick={() => setWind(i)}><span className="zh" lang="zh-Hant">{WINDS[i][0]}</span> {w}</button>
              ))}
            </div>
          </section>
        )}
      </div>
      <footer className="footer">
        {session && !store.canEdit
          ? <p style={{ margin: 0, fontSize: 14, fontWeight: 600, textAlign: 'center' }}>Only the phone that started the session can change seats and names.</p>
          : <button type="button" className="btn btn-primary" onClick={finish}>{session ? 'Save changes' : 'Start session'}</button>}
        {!session && (
          <label className="row" style={{ justifyContent: 'center', gap: 8, minHeight: 44, fontSize: 14, fontWeight: 500 }}>
            <input type="checkbox" checked={saveProfile} onChange={(e) => setSaveProfile(e.target.checked)} style={{ width: 20, height: 20, margin: 0, accentColor: 'var(--walnut)' }} />
            Save as a table profile
          </label>
        )}
      </footer>
    </div>
  );
}
