import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Header, Icon, PlayerChips, PLAYER_COLORS, Sheet } from '../components/ui';
import { WIND_NAME, WIND_ZH } from '../engine/tiles';
import { seatWindOf } from '../engine/session';
import { useNav, useStore } from '../state/store';
import { deviceId } from '../state/sync';
import { OneAtATime } from './Home';

/** The link a QR code or share sheet hands out. Opening it lands on Join with the code filled in. */
export const joinLink = (code: string) => `${location.origin}${location.pathname}?join=${code}`;

export function InviteSheet() {
  const store = useStore();
  const s = store.current!;
  const [seat, setSeat] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [qr, setQr] = useState('');
  const code = s.shared?.code;
  useEffect(() => {
    if (code) QRCode.toString(joinLink(code), { type: 'svg', margin: 0, color: { dark: '#161A1A', light: '#FFFDF7' } }).then(setQr).catch(() => setQr(''));
  }, [code]);

  if (!code) {
    return (
      <Sheet title="Invite the table">
        <p style={{ margin: '-6px 0 0', fontSize: 15, lineHeight: 1.45 }}>Everyone can follow the scores on their own phone, and score their own wins. Nothing restarts: seats, scores and history carry over.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="label">Which seat is yours?</span>
          <PlayerChips names={s.players} selected={seat} onPick={setSeat} />
          <button type="button" className="link-btn" style={{ fontSize: 14 }} onClick={() => setSeat(null)} aria-pressed={seat === null}>
            {seat === null ? '✓ ' : ''}I’m only keeping score
          </button>
        </div>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={async () => { setBusy(true); await store.startSharing(seat); setBusy(false); }}>
          {busy ? 'Starting…' : 'Get a code'}
        </button>
      </Sheet>
    );
  }
  const share = async () => {
    const text = `Join “${s.name}” on Mahjong Magic with code ${code}`;
    try {
      if (navigator.share) await navigator.share({ text, url: joinLink(code) });
      else { await navigator.clipboard.writeText(joinLink(code)); store.setNotice('Link copied.'); }
    } catch { /* cancelled */ }
  };
  const seats = store.room?.seats ?? [null, null, null, null];
  const me = deviceId();
  return (
    <Sheet title="Invite the table">
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div aria-label="QR code to join" role="img" style={{ width: 132, height: 132, flexShrink: 0, padding: 8, background: '#FFFDF7', border: '1px solid var(--line)' }} dangerouslySetInnerHTML={{ __html: qr }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="label">Session code</span>
          <span className="num" style={{ fontSize: 40, fontWeight: 700, letterSpacing: 6 }}>{code}</span>
          <span style={{ fontSize: 14, lineHeight: 1.4 }}>On their phone: scan the QR code, or open the app and tap “Join a session”.</span>
        </div>
      </div>
      <section style={{ display: 'flex', flexDirection: 'column' }}>
        <span className="label" style={{ marginBottom: 4 }}>Phones joined · {seats.filter(Boolean).length} of 4</span>
        {s.players.map((p, i) => (
          <div key={i} className="list-row" style={{ minHeight: 44, gap: 10 }}>
            <span className="swatch" style={{ background: PLAYER_COLORS[i] }} />
            <span style={{ flexGrow: 1, fontWeight: 600 }}>{p}</span>
            <span className="muted" style={{ fontSize: 14 }}>{seats[i] === me ? 'This phone' : seats[i] ? 'Joined' : 'Not joined yet'}</span>
          </div>
        ))}
      </section>
      <button type="button" className="btn btn-primary" onClick={share}><Icon.share />Share invite link</button>
    </Sheet>
  );
}

export function Join() {
  const store = useStore();
  const nav = useNav();
  const busy = store.current && !store.current.finished && store.current.shared?.code !== store.joinCode ? store.current : null;
  useEffect(() => { if (busy && store.joinCode) store.join(null); }, [busy, store.joinCode]); // eslint-disable-line
  const [text, setText] = useState(store.joinCode ?? '');
  const room = store.room;
  const status = store.status;
  const valid = /^[A-Z]{4}$/.test(text);
  useEffect(() => { if (room && store.joinCode && room.code === store.joinCode) nav.go('claim'); }, [room?.code, store.joinCode]); // eslint-disable-line
  return (
    <div className="app">
      <Header title="Join a session" />
      <div className="body" style={{ gap: 18 }}>
        {busy && <OneAtATime />}
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.45 }}>Ask whoever started the session for the 4-letter code, or scan the QR code on their phone with your camera.</p>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="label">Session code</span>
          <input className="field num" value={text} maxLength={4} autoCapitalize="characters" autoComplete="off" autoCorrect="off" spellCheck={false} inputMode="text"
            style={{ height: 64, fontSize: 32, fontWeight: 700, letterSpacing: 12, textAlign: 'center', textTransform: 'uppercase' }}
            onChange={(e) => { setText(e.target.value.toUpperCase().replace(/[^A-Z]/g, '')); store.join(null); }} placeholder="ABCD" />
        </label>
        {status === 'missing' && store.joinCode && <p role="alert" style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>No session with that code. Check the letters and try again.</p>}
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>No account needed. Your phone joins the same live session.</p>
      </div>
      <footer className="footer">
        <button type="button" className="btn btn-primary" disabled={!!busy || !valid || (store.joinCode === text && status === 'connecting')} onClick={() => store.join(text)}>
          {store.joinCode === text && status === 'connecting' ? 'Finding it…' : 'Join'}
        </button>
      </footer>
    </div>
  );
}

export function Claim() {
  const store = useStore();
  const nav = useNav();
  const room = store.room;
  const [busy, setBusy] = useState<number | 'watch' | null>(null);
  if (!room) return null;
  const st = room.session;
  // Winds come from the session's current dealer; replaying here keeps it simple.
  const dealer = (() => { let d = 0, passes = 0; let keepWin = true, keepDraw = false;
    for (const e of st.events as { type: string; winner?: number; dealer?: number; rules?: { dealerKeepsDealOnWin: boolean; dealerKeepsDealOnDraw: boolean } }[]) {
      if (e.type === 'rules' && e.rules) { keepWin = e.rules.dealerKeepsDealOnWin; keepDraw = e.rules.dealerKeepsDealOnDraw; }
      if (e.type === 'override' && e.dealer !== undefined) d = e.dealer;
      if (e.type === 'draw' && !keepDraw) { d = (d + 1) % 4; passes++; }
      if (e.type === 'game' && !(keepWin && e.winner === d)) { d = (d + 1) % 4; passes++; }
    }
    void passes; return d; })();
  const take = async (seat: number | null) => {
    setBusy(seat === null ? 'watch' : seat);
    const ok = await store.claimSeat(seat);
    setBusy(null);
    if (ok) nav.reset('table');
  };
  const games = st.events.filter((e) => e.type === 'game' || e.type === 'draw').length;
  return (
    <div className="app">
      <Header title="Which seat is yours?" kicker={`${st.name} · game ${games + 1}${games ? ' · in progress' : ''}`} />
      <div className="body" style={{ gap: 10 }}>
        {st.players.map((p, i) => {
          const w = seatWindOf(i, dealer);
          const taken = !!room.seats[i] && room.seats[i] !== deviceId();
          return (
            <button key={i} type="button" disabled={taken || busy !== null} onClick={() => take(i)} className="row"
              style={{ gap: 10, minHeight: 72, padding: '0 16px', textAlign: 'left', background: PLAYER_COLORS[i], border: '1px solid var(--line)', opacity: taken ? 0.55 : 1 }}>
              <span className="zh" lang="zh-Hant" style={{ fontSize: 24 }}>{WIND_ZH[w]}</span>
              <span style={{ fontSize: 14, fontWeight: 600, width: 46 }}>{WIND_NAME[w]}</span>
              <span style={{ flexGrow: 1, fontSize: 18, fontWeight: 700 }}>{p}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{busy === i ? 'Joining…' : taken ? `On ${p}’s phone` : 'Tap to claim'}</span>
            </button>
          );
        })}
        <p className="muted" style={{ margin: '6px 0 0', fontSize: 14 }}>Joining picks up the session where it is.</p>
      </div>
      <footer className="footer">
        <button type="button" className="btn" disabled={busy !== null} onClick={() => take(null)}>{busy === 'watch' ? 'Joining…' : 'Not playing? Watch only'}</button>
      </footer>
    </div>
  );
}
