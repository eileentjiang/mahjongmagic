import { money } from '../engine/rules';
import { flowerNumberOf, seatWindOf } from '../engine/session';
import { WIND_NAME, WIND_ZH } from '../engine/tiles';
import { Icon, PLAYER_COLORS, TabBar } from '../components/ui';
import { useNav, useStore } from '../state/store';
import { Tile } from '../components/Tile';

const ROUND = ['East', 'South', 'West', 'North'];
const ROUND_ZH = ['東', '南', '西', '北'];

export function lastGameLine(players: string[], g: NonNullable<ReturnType<typeof useStore>['table']>['lastGame']): string {
  if (!g) return '';
  const w = players[g.winner];
  const how = g.discarder === null ? 'self-drew' : `won off ${players[g.discarder]}`;
  return `${w} ${how} · ${g.points} pt${g.points === 1 ? '' : 's'} · ${money(g.cents[g.winner], true)}`;
}

export function Table() {
  const store = useStore();
  const nav = useNav();
  const s = store.current!, st = store.table!;
  const order = [0, 1, 3, 2]; // grid reads East South / North West like the real table
  return (
    <div className="app">
      <header className="header" style={{ paddingLeft: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexGrow: 1 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }} className="muted">{s.name} · game {st.gameNumber}</span>
          <h1 style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 28 }}>
            <span className="zh" lang="zh-Hant">{ROUND_ZH[st.tableWind]}</span><span>{ROUND[st.tableWind]} round</span>
          </h1>
        </div>
        <button type="button" className="icon-btn" aria-label="Menu" onClick={() => nav.openSheet('menu')}><Icon.more /></button>
      </header>
      {!store.storageOk && <div className="banner" role="status">This session won’t be saved if you close the page.</div>}
      {store.draft && (
        <button type="button" className="banner" style={{ textAlign: 'left' }} onClick={() => nav.go('score')}>
          <span style={{ flexGrow: 1 }}>You were scoring game {st.gameNumber}. Resume?</span><Icon.chevron />
        </button>
      )}

      <div className="body" style={{ gap: 14, paddingTop: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
          {order.map((i) => {
            const w = seatWindOf(i, st.dealer);
            const fl = flowerNumberOf(i, st.dealer);
            return (
              <button key={i} type="button" onClick={() => nav.openSheet('seat', i)}
                style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 14, minHeight: 166, textAlign: 'left', background: PLAYER_COLORS[i], border: '1px solid var(--line)' }}>
                <span className="row" style={{ gap: 6, width: '100%' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, flexGrow: 1 }}>
                    <span className="zh" lang="zh-Hant" style={{ fontSize: 24, lineHeight: 1 }}>{WIND_ZH[w]}</span>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{WIND_NAME[w]}</span>
                  </span>
                  {i === st.dealer && <span className="tag">Dealer</span>}
                </span>
                <span style={{ marginTop: 'auto', fontSize: 19, fontWeight: 600 }}>{s.players[i]}</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>Flower {fl}</span>
                <span className="num" style={{ fontSize: 22, fontWeight: 700 }}>{money(st.balances[i], true)}</span>
              </button>
            );
          })}
        </div>
        {st.lastGame && (
          <button type="button" className="row" onClick={() => nav.go('standings')} style={{ minHeight: 60, padding: '0 14px', border: '1px solid var(--line)', background: 'transparent', textAlign: 'left' }}>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Last game</span>
              <span style={{ fontSize: 14 }}>{lastGameLine(s.players, st.lastGame)}</span>
            </span>
            <Icon.chevron />
          </button>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: st.rules.kongsPaidOnSpot ? '1fr 1fr' : '1fr', gap: 10 }}>
          {st.rules.kongsPaidOnSpot && <button type="button" className="btn" style={{ minHeight: 46, fontSize: 15, fontWeight: 500 }} onClick={() => nav.openSheet('kong')}>Record kong</button>}
          <button type="button" className="btn" style={{ minHeight: 46, fontSize: 15, fontWeight: 500 }} onClick={() => nav.openSheet('draw')}>No winner (draw)</button>
        </div>
      </div>
      <TabBar current="table" />
    </div>
  );
}

export function SeatCard({ seat }: { seat: number }) {
  const store = useStore();
  const st = store.table!;
  const w = seatWindOf(seat, st.dealer);
  const n = flowerNumberOf(seat, st.dealer);
  const tw = (['we', 'ws', 'ww', 'wn'] as const)[st.tableWind];
  const flowers = [`f${n}`, `x${n}`];
  const fname = ['Plum', 'Orchid', 'Chrysanthemum', 'Bamboo'][n - 1], sname = ['Spring', 'Summer', 'Autumn', 'Winter'][n - 1];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="panel" style={{ padding: 14, background: PLAYER_COLORS[seat], display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="label" style={{ color: 'var(--ink)' }}>Seat wind</span>
          <span className="zh" lang="zh-Hant" style={{ fontSize: 44, lineHeight: 1.1 }}>{WIND_ZH[w]}</span>
          <span style={{ fontSize: 17, fontWeight: 700 }}>{WIND_NAME[w]}</span>
        </div>
        <div className="panel" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="label" style={{ color: 'var(--ink)' }}>Flower number</span>
          <span style={{ fontSize: 44, fontWeight: 700, lineHeight: 1.1 }}>{n}</span>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{sname} · {fname}</span>
        </div>
      </div>
      <div className="row" style={{ gap: 14 }}>
        {flowers.map((f) => <Tile key={f} t={f} size={0.8} />)}
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45 }}>
          {st.rules.ownSeatFlowersOnly ? <>Your flowers are <strong>{sname}</strong> and <strong>{fname}</strong>. Each is worth 1 pt to you; other flowers score 0.</> : <>Every flower is worth 1 pt.</>}
        </p>
      </div>
      <section>
        <h2 style={{ fontSize: 16, marginBottom: 4 }}>Scores extra for you</h2>
        {(tw === w
          ? [[`Pung of ${WIND_NAME[w]}: your seat wind and the table wind`, '2 + 2']]
          : [[`Pung of ${WIND_NAME[w]}, your seat wind`, '2'], [`Pung of ${WIND_NAME[tw]}, the table wind`, '2']]
        ).map(([a, b]) => (
          <div key={a} className="list-row" style={{ minHeight: 44 }}><span style={{ flexGrow: 1, fontSize: 15 }}>{a}</span><strong>{b}</strong></div>
        ))}
      </section>
    </div>
  );
}
