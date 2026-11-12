import { CSSProperties } from 'react';
import { FLOWER_ZH, isDragon, isFlower, isSuited, isWind, rank, suitOf, TileId, tileName, WIND_ZH, Wind } from '../engine/tiles';

const G = '#3F6E5A', R = '#B4472E', K = '#2A2E3A';
const DOT: Record<number, [number, number, string][]> = {
  1: [[50, 50, R]], 2: [[50, 27, G], [50, 73, K]], 3: [[24, 18, G], [50, 50, R], [76, 82, K]],
  4: [[28, 27, K], [72, 27, G], [28, 73, G], [72, 73, K]], 5: [[26, 20, G], [74, 20, K], [50, 50, R], [26, 80, K], [74, 80, G]],
  6: [[30, 17, G], [70, 17, G], [30, 50, R], [70, 50, R], [30, 83, R], [70, 83, R]],
  7: [[20, 11, G], [50, 23, G], [80, 35, G], [30, 61, R], [70, 61, R], [30, 87, R], [70, 87, R]],
  8: [[30, 12, K], [70, 12, K], [30, 37, K], [70, 37, K], [30, 63, K], [70, 63, K], [30, 88, K], [70, 88, K]],
  9: [[20, 17, G], [50, 17, G], [80, 17, G], [20, 50, R], [50, 50, R], [80, 50, R], [20, 83, K], [50, 83, K], [80, 83, K]],
};
const BAM: Record<number, [number, number, number, string][]> = {
  2: [[50, 27, 0, G], [50, 73, 0, G]], 3: [[50, 27, 0, G], [30, 73, 0, G], [70, 73, 0, G]],
  4: [[32, 27, 0, G], [68, 27, 0, G], [32, 73, 0, G], [68, 73, 0, G]],
  5: [[24, 27, 0, G], [76, 27, 0, G], [50, 50, 0, R], [24, 73, 0, G], [76, 73, 0, G]],
  6: [[22, 27, 0, G], [50, 27, 0, G], [78, 27, 0, G], [22, 73, 0, G], [50, 73, 0, G], [78, 73, 0, G]],
  7: [[50, 15, 0, R], [22, 50, 0, G], [50, 50, 0, G], [78, 50, 0, G], [22, 85, 0, G], [50, 85, 0, G], [78, 85, 0, G]],
  8: [[16, 27, 0, G], [38, 27, 28, G], [62, 27, -28, G], [84, 27, 0, G], [16, 73, 0, G], [38, 73, -28, G], [62, 73, 28, G], [84, 73, 0, G]],
  9: [[22, 16, 0, G], [50, 16, 0, R], [78, 16, 0, G], [22, 50, 0, G], [50, 50, 0, R], [78, 50, 0, G], [22, 84, 0, G], [50, 84, 0, R], [78, 84, 0, G]],
};
const CN = ['', '一', '二', '三', '四', '伍', '六', '七', '八', '九'];
const BLOOM: Record<string, string> = { f1: '#C85A6A', f2: '#8E6AA8', f3: '#D89A2E', f4: G, x1: '#E58FA0', x2: '#E06F33', x3: '#C08A2A', x4: '#7F93B8' };
const abs = (x: number, y: number, extra: CSSProperties): CSSProperties => ({ position: 'absolute', left: x + '%', top: y + '%', transform: 'translate(-50%, -50%)', ...extra });

function Face({ t }: { t: TileId }) {
  if (isSuited(t)) {
    const n = rank(t), s = suitOf(t);
    if (s === 'm') return (
      <span style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <span className="zh" style={{ fontSize: 20, lineHeight: 1 }}>{CN[n]}</span>
        <span className="zh" style={{ fontSize: 18, lineHeight: 1, color: R }}>萬</span>
      </span>
    );
    if (s === 'p') {
      const size = n === 1 ? 28 : n >= 8 ? 9 : 11;
      return (
        <span style={{ position: 'absolute', left: 6, right: 6, top: 8, bottom: 8 }}>
          {DOT[n].map(([x, y, c], i) => (
            <span key={i} style={abs(x, y, { width: size, height: size, borderRadius: '50%', border: `${n === 1 ? 3 : 2}px solid ${c}`, background: `radial-gradient(circle, ${c} 0 28%, transparent 32%)` })} />
          ))}
        </span>
      );
    }
    if (n === 1) return (
      <span style={{ position: 'absolute', left: 6, right: 6, top: 8, bottom: 8 }}>
        <span style={abs(50, 52, { width: 9, height: 46, borderRadius: 4, background: `linear-gradient(to bottom, ${G} 0 30%, #FFFDF7 30% 34%, ${G} 34% 64%, #FFFDF7 64% 68%, ${G} 68%)` })} />
        <span style={abs(50, 12, { width: 13, height: 13, borderRadius: '50%', background: R })} />
        <span style={abs(30, 40, { width: 14, height: 7, transform: 'translate(-50%, -50%) rotate(-30deg)', borderRadius: '0 10px 0 10px', background: '#4F8268' })} />
        <span style={abs(70, 62, { width: 14, height: 7, transform: 'translate(-50%, -50%) rotate(30deg)', borderRadius: '10px 0 10px 0', background: '#4F8268' })} />
      </span>
    );
    const h = n >= 7 ? 17 : 24;
    return (
      <span style={{ position: 'absolute', left: 6, right: 6, top: 8, bottom: 8 }}>
        {BAM[n].map(([x, y, rot, c], i) => (
          <span key={i} style={abs(x, y, { width: 6, height: h, transform: `translate(-50%, -50%) rotate(${rot}deg)`, borderRadius: 3, background: `linear-gradient(to bottom, ${c} 0 44%, #FFFDF7 44% 52%, ${c} 52%)` })} />
        ))}
      </span>
    );
  }
  if (isWind(t)) return <span className="zh" style={{ position: 'relative', fontSize: 32, lineHeight: 1 }}>{WIND_ZH[t as Wind]}</span>;
  if (isDragon(t)) {
    if (t === 'dw') return (
      <span style={{ position: 'relative', width: 32, height: 46, border: '3px solid #2A2E3A', padding: 3 }}>
        <span style={{ display: 'block', width: '100%', height: '100%', border: '1.5px solid #2A2E3A' }} />
      </span>
    );
    return <span className="zh" style={{ position: 'relative', fontSize: 32, lineHeight: 1, color: t === 'dr' ? R : G }}>{t === 'dr' ? '中' : '發'}</span>;
  }
  if (isFlower(t)) {
    const col = t[0] === 'f' ? R : G;
    return (
      <>
        <span style={{ position: 'absolute', left: 6, top: 5, fontSize: 13, fontWeight: 700, lineHeight: 1, color: col }}>{t[1]}</span>
        <span className="zh" style={{ position: 'absolute', right: 6, top: 5, fontSize: 12, lineHeight: 1, color: col }}>{FLOWER_ZH[t]}</span>
        <span style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 12 }}>
          <span style={{ width: 18, height: 18, borderRadius: '50%', background: `radial-gradient(circle, #FFFDF7 0 22%, ${BLOOM[t]} 26%)` }} />
          <span style={{ width: 2, height: 14, background: G }} />
          <span style={{ display: 'flex', gap: 6, marginTop: -10 }}>
            <span style={{ width: 8, height: 5, borderRadius: '0 6px 0 6px', background: '#4F8268' }} />
            <span style={{ width: 8, height: 5, borderRadius: '6px 0 6px 0', background: '#4F8268' }} />
          </span>
        </span>
      </>
    );
  }
  return null;
}

/** A tile drawn at 60×80, scaled by `size` (1 = 60px wide). */
/** `flag`: mark a tile the photo reader wasn't sure about. 'current' adds a thick ring; both show a ? badge. */
export function Tile({ t, size = 1, onClick, label, win, flag }: { t: TileId; size?: number; onClick?: () => void; label?: string; win?: boolean; flag?: 'current' | 'pending' }) {
  const style: CSSProperties = { zoom: size };
  const inner = (
    <>
      <svg className="grain" aria-hidden="true"><rect width="100%" height="100%" filter="url(#grain)" /></svg>
      <Face t={t} />
    </>
  );
  const cls = 'tile' + (win ? ' tile-win' : '');
  const el = onClick
    ? <button type="button" className={cls} style={style} onClick={onClick} aria-label={label ?? tileName(t)}>{inner}</button>
    : <span className={cls} style={style} role="img" aria-label={label ?? tileName(t)}>{inner}</span>;
  if (!flag) return el;
  // The ring and badge sit outside the zoomed tile so they stay bold at small sizes.
  return (
    <span className={'tile-flag' + (flag === 'current' ? ' tile-flag-current' : '')}>
      {el}
      <span className="tile-flag-badge" aria-hidden="true">?</span>
    </span>
  );
}

/** Shared paper-grain filter, rendered once. */
export function GrainDefs() {
  return (
    <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute' }}>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves={3} stitchTiles="stitch" />
        <feColorMatrix values="0 0 0 0 0.1  0 0 0 0 0.1  0 0 0 0 0.08  0 0 0 0.3 0" />
      </filter>
    </svg>
  );
}
