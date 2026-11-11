import { useState } from 'react';
import { money, rulesSummary } from '../engine/rules';
import { KongKind } from '../engine/payout';
import { Icon, PlayerChips, PLAYER_COLORS, Sheet } from '../components/ui';
import { useNav, useStore } from '../state/store';
import { SeatCard } from './Table';

export function Sheets() {
  const nav = useNav();
  const store = useStore();
  if (!nav.sheet || !store.current) return null;
  if (nav.sheet === 'menu') return <MenuSheet />;
  if (nav.sheet === 'kong') return <KongSheet />;
  if (nav.sheet === 'draw') return <DrawSheet />;
  if (nav.sheet === 'endConfirm') return <EndConfirm />;
  if (nav.sheet === 'seat') return <Sheet title={`${store.current.players[nav.sheetArg]}’s seat`}><SeatCard seat={nav.sheetArg} /></Sheet>;
  return null;
}

function MenuSheet() {
  const nav = useNav();
  const store = useStore();
  const items: [string, string, () => void][] = [
    ['Home', 'Your session is saved; pick it up anytime', () => nav.reset('home')],
    ['Standings & game history', 'Rankings and every game so far', () => nav.go('standings')],
    ['Rules & payout', rulesSummary(store.table!.rules).replace('Hong Kong style · ', ''), () => nav.go('rulesEdit')],
    ['Players & seats', 'Fix a name, the dealer or the table wind', () => nav.go('playersEdit')],
    ['About Mahjong Magic', 'Who made this and how to give feedback', () => nav.go('about')],
  ];
  return (
    <Sheet title={store.current!.name}>
      <nav style={{ display: 'flex', flexDirection: 'column', marginTop: -10 }}>
        {items.map(([label, sub, fn]) => (
          <button key={label} type="button" className="list-row" onClick={fn} style={{ border: 'none', borderBottom: '1px solid var(--divider)', background: 'none', textAlign: 'left' }}>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>
              <span style={{ fontSize: 16, fontWeight: 600 }}>{label}</span>
              <span className="muted" style={{ fontSize: 13 }}>{sub}</span>
            </span>
            <Icon.chevron />
          </button>
        ))}
      </nav>
      <button type="button" className="btn" onClick={() => nav.openSheet('endConfirm')}>End session &amp; settle up</button>
    </Sheet>
  );
}

function KongSheet() {
  const nav = useNav();
  const store = useStore();
  const s = store.current!, rules = store.table!.rules;
  const [owner, setOwner] = useState<number | null>(null);
  const [kind, setKind] = useState<KongKind>('concealed');
  const pts = kind === 'melded' ? rules.meldedKongPoints : rules.concealedKongPoints;
  const each = pts * rules.scaleCents;
  const types: [KongKind, string, string, number][] = [
    ['melded', 'Melded kong', 'Claimed from a discard', rules.meldedKongPoints],
    ['concealed', 'Concealed kong', 'All 4 tiles drawn yourself', rules.concealedKongPoints],
    ['selfDrawn', 'Self-drawn kong', 'Drew the 4th tile for your pung', rules.concealedKongPoints],
  ];
  return (
    <Sheet title="Record kong">
      <p className="muted" style={{ margin: '-10px 0 0', fontSize: 14 }}>Paid now, even if they don’t win the game.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span className="label">Who declared it?</span>
        <PlayerChips names={s.players} selected={owner} onPick={setOwner} />
      </div>
      <div role="radiogroup" aria-label="What kind?" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span className="label">What kind?</span>
        {types.map(([k, name, desc, p]) => (
          <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className="row"
            style={{ minHeight: 62, padding: '10px 16px', textAlign: 'left', border: kind === k ? '2px solid var(--walnut)' : '1px solid var(--line)', background: kind === k ? 'var(--panel)' : 'transparent' }}>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{name}</span>
              <span className="muted" style={{ fontSize: 13 }}>{desc}</span>
            </span>
            <strong>{p} pts</strong>
          </button>
        ))}
      </div>
      {owner !== null && (
        <div className="panel" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 15 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}><span className="row" style={{ gap: 8 }}><span className="swatch" style={{ background: PLAYER_COLORS[owner] }} /><strong>{s.players[owner]}</strong></span><strong className="num">{money(each * 3, true)}</strong></div>
          <div className="row" style={{ justifyContent: 'space-between' }}><span>{s.players.filter((_, i) => i !== owner).join(', ')}</span><span className="num">{money(-each)} each</span></div>
        </div>
      )}
      <button type="button" className="btn btn-primary" disabled={owner === null} onClick={() => { store.recordKong(owner!, kind); nav.closeSheet(); }}>
        {owner === null ? 'Pick who declared it' : `Record kong · ${money(each * 3, true)}`}
      </button>
    </Sheet>
  );
}

function DrawSheet() {
  const nav = useNav();
  const store = useStore();
  const s = store.current!, st = store.table!;
  const next = st.rules.dealerKeepsDealOnDraw ? s.players[st.dealer] : s.players[(st.dealer + 1) % 4];
  return (
    <Sheet title={`Record a draw for game ${st.gameNumber}?`}>
      <p style={{ margin: '-6px 0 4px', fontSize: 15 }}>No money moves · {st.rules.dealerKeepsDealOnDraw ? `${next} keeps the deal.` : `deal passes to ${next}.`}</p>
      <button type="button" className="btn btn-primary" onClick={() => { store.recordDraw(); nav.closeSheet(); }}>Record draw</button>
      <button type="button" className="btn" onClick={nav.closeSheet}>Cancel</button>
    </Sheet>
  );
}

function EndConfirm() {
  const nav = useNav();
  return (
    <Sheet title="End the session?">
      <p style={{ margin: '-6px 0 4px', fontSize: 15, lineHeight: 1.45 }}>You’ll see final standings and who pays whom. You can keep playing until you tap Finish.</p>
      <button type="button" className="btn btn-primary" onClick={() => nav.go('end')}>End &amp; settle up</button>
      <button type="button" className="btn" onClick={nav.closeSheet}>Keep playing</button>
    </Sheet>
  );
}
