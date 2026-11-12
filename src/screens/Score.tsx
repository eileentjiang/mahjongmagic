import { useState } from 'react';
import { money } from '../engine/rules';
import { scoreHand } from '../engine/score';
import { winPayout } from '../engine/payout';
import { seatWindOf } from '../engine/session';
import { tileName, WINDS } from '../engine/tiles';
import { Header, PlayerChips, PLAYER_COLORS, Switch } from '../components/ui';
import { Tile } from '../components/Tile';
import { Draft, useNav, useStore } from '../state/store';

export function Score() {
  const store = useStore();
  const nav = useNav();
  const s = store.current!, st = store.table!;
  const draft = store.draft!;
  const [open, setOpen] = useState<number>(-1);
  const [override, setOverride] = useState(false);
  const set = (d: Partial<Draft>) => store.update((x) => ({ ...x, draft: { ...x.draft!, ...d } }));

  const winner = draft.winner;
  const winIndex = draft.winIndex ?? draft.tiles.length - 1;
  const result = winner >= 0 ? scoreHand({
    tiles: draft.tiles, flowers: draft.flowers, seatWind: seatWindOf(winner, st.dealer), prevalentWind: WINDS[st.tableWind],
    selfDraw: draft.selfDraw, concealed: draft.concealed, winningTile: draft.tiles[winIndex], winnerIsDealer: winner === st.dealer,
  }, st.rules) : null;
  const fans = result ? result.fans.filter((f) => !draft.removed.includes(f.name + '|' + f.why)) : [];
  const points = Math.min(fans.reduce((a, f) => a + f.points, 0), st.rules.pointCap || Infinity);
  const edited = draft.removed.length > 0 || override;
  const discarder = draft.selfDraw ? null : draft.discarder;
  const methodOk = draft.selfDraw || (discarder !== null && discarder !== winner);
  const below = result?.valid && (draft.removed.length ? points < st.rules.minPoints : result.belowMinimum);
  const discarderOnlyPoints = fans.filter((f) => f.discarderOnly).reduce((a, f) => a + f.points, 0);
  const cents = winner >= 0 && methodOk ? winPayout(points, st.rules, winner, discarder, Math.min(discarderOnlyPoints, points)) : null;
  const canConfirm = !!result?.valid && methodOk && (!below || override) && points > 0;
  const nextDealer = st.rules.dealerKeepsDealOnWin && winner === st.dealer ? st.dealer : (st.dealer + 1) % 4;

  const [saving, setSaving] = useState(false);
  const confirm = async () => {
    setSaving(true);
    const ok = await store.confirmGame({ points, fans, edited, discarderOnlyPoints: Math.min(discarderOnlyPoints, points) });
    setSaving(false);
    if (ok) nav.reset('table');
  };

  return (
    <div className="app">
      <Header title={`Score game ${st.gameNumber}`} />
      <div className="body" style={{ gap: 18 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="label">Who won?{store.mySeat !== null ? ' (you, by default)' : ''}</span>
          <PlayerChips names={s.players} selected={winner >= 0 ? winner : null} onPick={(i) => set({ winner: i, discarder: draft.discarder === i ? null : draft.discarder, removed: [] })} />
        </div>
        <div className="seg" role="group" aria-label="How they won" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <button type="button" aria-pressed={!draft.selfDraw} onClick={() => set({ selfDraw: false, removed: [] })}>Off a discard</button>
          <button type="button" aria-pressed={draft.selfDraw} onClick={() => set({ selfDraw: true, removed: [] })}>Self-draw</button>
        </div>
        {!draft.selfDraw && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="label">Who discarded it?</span>
            <PlayerChips names={s.players} selected={discarder} exclude={winner >= 0 ? [winner] : []} cols={winner >= 0 ? 3 : 4} onPick={(i) => set({ discarder: i })} />
          </div>
        )}
        <div className="list-row" style={{ borderTop: '1px solid var(--divider)' }}>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Concealed hand</span>
            <span className="muted" style={{ fontSize: 13 }}>No sets claimed from other players’ discards</span>
          </span>
          <Switch on={draft.concealed} label="Concealed hand" onChange={(v) => set({ concealed: v, removed: [] })} />
        </div>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2>Tiles</h2>
            <button type="button" className="link-btn" style={{ fontSize: 13, minHeight: 32, textDecoration: 'underline' }} onClick={() => nav.go('entry')}>Change tiles</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', rowGap: 10, columnGap: 4, justifyItems: 'center' }}>
            {draft.tiles.map((t, i) => <Tile key={i} t={t} size={0.6} win={i === winIndex} onClick={() => set({ winIndex: i, removed: [] })} label={`${tileName(t)}${i === winIndex ? ', the winning tile' : ', tap to make this the winning tile'}`} />)}
            {draft.flowers.map((t) => <Tile key={t} t={t} size={0.6} />)}
          </div>
          <span className="muted" style={{ fontSize: 12 }}>Outlined: the winning tile. Tap a different tile if another one completed the hand.</span>
        </section>

        {winner < 0 ? (
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Pick who won to see the score.</p>
        ) : !result?.valid ? (
          <p role="alert" style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{result?.problem}</p>
        ) : (
          <>
            <section style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ marginBottom: 2 }}>Why it scores</h2>
              {fans.map((f, i) => (
                <div key={f.name + i} style={{ borderBottom: '1px solid var(--divider)' }}>
                  <div className="row" style={{ gap: 0 }}>
                    <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)} className="row" style={{ flexGrow: 1, gap: 8, minHeight: 48, padding: 0, border: 'none', background: 'none', textAlign: 'left' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#161A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, transition: 'transform 120ms', transform: `rotate(${open === i ? 90 : 0}deg)` }}><path d="M9 6l6 6-6 6" /></svg>
                      <span style={{ flexGrow: 1, fontSize: 15, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>{f.name}{f.house && <span className="tag tag-house" style={{ fontSize: 11, height: 20 }}>House rule</span>}</span>
                      <span className="num" style={{ fontSize: 15, fontWeight: 700 }}>{f.points}</span>
                    </button>
                    <button type="button" className="icon-btn" aria-label={`Remove ${f.name}`} style={{ marginLeft: 4, color: 'var(--muted)' }} onClick={() => { set({ removed: [...draft.removed, f.name + '|' + f.why] }); setOpen(-1); }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                  </div>
                  {open === i && <p className="panel" style={{ margin: '0 0 12px 24px', padding: '10px 12px', fontSize: 14, lineHeight: 1.45 }}>{f.why}</p>}
                </div>
              ))}
              {draft.removed.length > 0 && (
                <button type="button" className="link-btn" style={{ fontSize: 14 }} onClick={() => set({ removed: [] })}>Restore removed patterns</button>
              )}
              <div className="row" style={{ gap: 8, minHeight: 46, borderTop: '1px solid var(--line)', fontSize: 16, fontWeight: 700 }}>
                <span style={{ flexGrow: 1 }}>Total</span>
                {edited && <span className="tag" style={{ fontSize: 11 }}>Edited</span>}
                <span className="num">{points} pts × {money(st.rules.scaleCents)} = {money(points * st.rules.scaleCents)}</span>
              </div>
              {below && (
                <div className="list-row" style={{ borderBottom: 'none' }}>
                  <span style={{ flexGrow: 1, fontSize: 14, fontWeight: 600 }}>Below the minimum of {st.rules.minPoints}. Count it anyway?</span>
                  <Switch on={override} label="Count it anyway" onChange={setOverride} />
                </div>
              )}
            </section>

            {!methodOk ? (
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Pick who discarded the winning tile.</p>
            ) : cents && (
              <section aria-label="Payout" className="panel" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span className="row" style={{ gap: 10, fontSize: 24, fontWeight: 700 }}><span className="swatch" style={{ width: 16, height: 16, background: PLAYER_COLORS[winner] }} />{s.players[winner]} wins</span>
                  <span className="num" style={{ fontSize: 24, fontWeight: 700 }}>{money(cents[winner], true)}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
                  {cents.map((c, i) => i === winner ? null : (
                    <div key={i} className="row" style={{ gap: 8, fontSize: 15 }}>
                      <span className="row" style={{ gap: 8, flexGrow: 1 }}><span className="swatch" style={{ background: PLAYER_COLORS[i] }} /><span><strong style={{ fontWeight: 600 }}>{s.players[i]}</strong> {i === discarder ? `discarded${st.rules.discarderPaysDouble && !st.rules.plus8 ? ' · pays 2×' : ''}` : ''}</span></span>
                      <strong className="num">{money(c)}</strong>
                    </div>
                  ))}
                </div>
              </section>
            )}
            <p className="muted" style={{ margin: 0, fontSize: 13, textAlign: 'center' }}>{nextDealer === st.dealer ? `${s.players[st.dealer]} keeps the deal.` : `Deal passes to ${s.players[nextDealer]}.`}</p>
          </>
        )}
      </div>
      <footer className="footer">
        <button type="button" className="btn btn-primary" disabled={!canConfirm || saving} onClick={confirm}>{saving ? 'Saving…' : 'Confirm game'}</button>
      </footer>
    </div>
  );
}
