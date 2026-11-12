import { useEffect, useRef, useState } from 'react';
import { photoToJpeg, recognize } from '../api';
import { Icon } from '../components/ui';
import { useNav, useStore } from '../state/store';
import { newDraft } from './HandEntry';

type Phase = { kind: 'ready' } | { kind: 'reading' } | { kind: 'rejected'; title: string; detail: string } | { kind: 'error'; message: string; detail?: string };

const TITLES: Record<string, string> = { blurry: 'Too blurry to read', dark: 'Too dark to read', partial: 'Some tiles are cut off', no_tiles: 'No tiles found' };

export function Camera() {
  const nav = useNav();
  const store = useStore();
  const input = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>({ kind: 'ready' });
  const lastPhoto = useRef<string | null>(null);

  const read = async (image: string) => {
    setPhase({ kind: 'reading' });
    try {
      const r = await recognize(image);
      if (r.quality !== 'ok' || r.tiles.length === 0) {
        setPhase({ kind: 'rejected', title: TITLES[r.quality] ?? 'Couldn’t read the tiles', detail: r.problem ?? 'Nothing was scored. Try again.' });
        return;
      }
      const draft = newDraft(store.draft?.winner ?? store.mySeat ?? -1);
      draft.tiles = r.tiles.map((t) => t.tile);
      draft.flowers = [...new Set(r.flowers.map((f) => f.tile))];
      draft.photo = { model: r.model ?? 'unknown', read: r.tiles.map((t) => ({ tile: t.tile, sure: t.sure })), flowers: [...new Set(r.flowers.map((f) => f.tile))] };
      draft.unsure = r.tiles.map((t, i) => ({ index: i, alternatives: t.alternatives, sure: t.sure })).filter((t) => !t.sure).map(({ index, alternatives }) => ({ index, alternatives }));
      store.update((d) => ({ ...d, draft }));
      setPhase({ kind: 'ready' });
      nav.go(draft.unsure.length ? 'unsure' : 'score');
    } catch (e) {
      setPhase({ kind: 'error', message: (e as Error).message, detail: (e as Error & { detail?: string }).detail });
    }
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const jpeg = await photoToJpeg(f);
      lastPhoto.current = jpeg;
      await read(jpeg);
    } catch {
      setPhase({ kind: 'error', message: 'That photo couldn’t be opened. Try again.' });
    }
  };
  const live = useLiveCamera();
  const pickFile = () => { if (input.current) { input.current.value = ''; input.current.click(); } };
  const shoot = async () => {
    if (live.status !== 'on') return pickFile();
    const jpeg = live.capture();
    if (!jpeg) return pickFile();
    lastPhoto.current = jpeg;
    await read(jpeg);
  };
  const byHand = () => nav.go('entry');

  return (
    <div className="app" style={{ background: '#161A1A', color: '#FBF8EF' }}>
      <header className="header">
        <button type="button" className="icon-btn" aria-label="Back to the table" onClick={nav.back} style={{ color: '#FBF8EF' }}><Icon.back /></button>
        <h1 style={{ flexGrow: 1, textAlign: 'center', fontSize: 18, fontWeight: 600, paddingRight: 44 }}>Photo the winning hand</h1>
      </header>
      <input ref={input} type="file" accept="image/*" {...(live.status === 'on' ? {} : { capture: 'environment' as const })} hidden onChange={(e) => onFile(e.target.files?.[0])} />

      {live.status === 'on' && phase.kind !== 'reading' ? (
        <div ref={live.boxRef} style={{ position: 'relative', flexGrow: 1, overflow: 'hidden', minHeight: 320 }}>
          <video ref={live.videoRef} autoPlay playsInline muted style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          {/* Faint tile outlines: lay the hand in rows of 3. Only this area (plus a little margin) is sent. */}
          <div aria-hidden="true" style={{ position: 'absolute', left: live.guide.x, top: live.guide.y, width: live.guide.w, height: live.guide.h, display: 'grid', gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`, gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`, gap: 3, boxShadow: '0 0 0 9999px rgba(22,26,26,0.45)' }}>
            {Array.from({ length: GRID_COLS * GRID_ROWS }, (_, k) => <span key={k} style={{ border: '1.5px solid rgba(251,248,239,0.55)', borderRadius: 4 }} />)}
          </div>
          <p style={{ position: 'absolute', left: 0, right: 0, bottom: 8, margin: 0, textAlign: 'center', fontSize: 13, fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>Line the tiles up in the outlines, rows of 3, flowers included</p>
        </div>
      ) : (
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '0 24px', textAlign: 'center' }}>
        {phase.kind === 'reading' ? (
          <>
            <span aria-hidden="true" className="spinner" />
            <p role="status" style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Reading your tiles…</p>
            <p style={{ margin: 0, fontSize: 14, color: '#D8D2C2' }}>This usually takes 10–30 seconds.</p>
          </>
        ) : (
          <>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 500, lineHeight: 1.45 }}>Lay the winning hand flat and fit every tile in the photo, including flowers and all four tiles of any kong.</p>
            <p style={{ margin: 0, fontSize: 14, color: '#D8D2C2' }}>Good light · hold steady · shoot from above</p>
          </>
        )}
      </div>

      )}
      <footer style={{ padding: '16px 20px calc(30px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <button type="button" aria-label="Take photo" disabled={phase.kind === 'reading'} onClick={shoot}
          style={{ width: 78, height: 78, borderRadius: 39, border: '3px solid #FBF8EF', background: 'transparent', padding: 5, opacity: phase.kind === 'reading' ? 0.4 : 1 }}>
          <span style={{ display: 'block', width: '100%', height: '100%', borderRadius: '50%', background: '#FBF8EF' }} />
        </button>
        <div style={{ display: 'flex', gap: 20 }}>
          <button type="button" className="link-btn" style={{ color: '#FBF8EF', fontWeight: 500 }} onClick={byHand}>Enter tiles by hand</button>
          {live.status === 'on' && <button type="button" className="link-btn" style={{ color: '#FBF8EF', fontWeight: 500 }} onClick={pickFile}>Use a saved photo</button>}
        </div>
      </footer>

      {(phase.kind === 'rejected' || phase.kind === 'error') && (
        <div className="scrim">
          <section role="alertdialog" aria-labelledby="rt" className="sheet" style={{ color: 'var(--ink)' }}>
            <div>
              <h1 id="rt" style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{phase.kind === 'rejected' ? phase.title : 'Couldn’t read the photo'}</h1>
              <p style={{ margin: '4px 0 0', fontSize: 15 }}>{phase.kind === 'rejected' ? phase.detail : phase.message}</p>
              {phase.kind === 'error' && phase.detail && <p className="muted" style={{ margin: '8px 0 0', fontSize: 12, lineHeight: 1.4, wordBreak: 'break-word' }}>Details: {phase.detail}</p>}
            </div>
            {phase.kind === 'rejected' && (
              <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 15 }}>
                <li>Hold the phone still for a second</li>
                <li>Move closer so the tiles fill the frame</li>
                <li>Too dark? Turn on a lamp or the flash</li>
              </ul>
            )}
            <button type="button" className="btn btn-primary" onClick={() => { setPhase({ kind: 'ready' }); shoot(); }}>Retake photo</button>
            {phase.kind === 'error' && lastPhoto.current && <button type="button" className="btn" onClick={() => read(lastPhoto.current!)}>Try this photo again</button>}
            <button type="button" className="btn" onClick={() => { setPhase({ kind: 'ready' }); byHand(); }}>Enter tiles by hand</button>
          </section>
        </div>
      )}
    </div>
  );
}

export const GRID_COLS = 3;
export const GRID_ROWS = 6;
const TILE_ASPECT = 3 / 4; // width / height of one tile
const GRID_ASPECT = (GRID_COLS * TILE_ASPECT) / GRID_ROWS;
const MARGIN = 0.08; // crop a little outside the outlines, in case tiles sit slightly off

/** Live camera with a tile-outline guide; capture() returns just the guide area as base64 JPEG. */
function useLiveCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'starting' | 'on' | 'off'>('starting');
  const [box, setBox] = useState({ w: 0, h: 0 });

  const streamRef = useRef<MediaStream | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!navigator.mediaDevices?.getUserMedia) { setStatus('off'); return; }
    navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 2560 }, height: { ideal: 1920 } } })
      .then((s) => { if (cancelled) { s.getTracks().forEach((t) => t.stop()); return; } streamRef.current = s; setStatus('on'); })
      .catch(() => setStatus('off'));
    return () => { cancelled = true; streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null; };
  }, []);

  // Attach the stream whenever the video element is (re)shown.
  useEffect(() => {
    if (videoRef.current && streamRef.current && videoRef.current.srcObject !== streamRef.current) videoRef.current.srcObject = streamRef.current;
  });

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [status]);

  const gh = Math.min(box.h * 0.86, (box.w * 0.82) / GRID_ASPECT);
  const gw = gh * GRID_ASPECT;
  const guide = { x: (box.w - gw) / 2, y: (box.h - gh) / 2 - 10, w: gw, h: gh };

  const capture = (): string | null => {
    const v = videoRef.current;
    if (!v || !v.videoWidth || !box.w) return null;
    // The video fills the box with object-fit: cover; map the guide back to video pixels.
    const scale = Math.max(box.w / v.videoWidth, box.h / v.videoHeight);
    const ox = (box.w - v.videoWidth * scale) / 2, oy = (box.h - v.videoHeight * scale) / 2;
    const m = MARGIN * guide.w;
    let sx = (guide.x - m - ox) / scale, sy = (guide.y - m - oy) / scale;
    let sw = (guide.w + 2 * m) / scale, sh = (guide.h + 2 * m) / scale;
    sx = Math.max(0, sx); sy = Math.max(0, sy);
    sw = Math.min(v.videoWidth - sx, sw); sh = Math.min(v.videoHeight - sy, sh);
    const out = Math.min(1, 1280 / Math.max(sw, sh));
    const c = document.createElement('canvas');
    c.width = Math.round(sw * out); c.height = Math.round(sh * out);
    c.getContext('2d')!.drawImage(v, sx, sy, sw, sh, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.88).split(',')[1];
  };

  return { status, videoRef, boxRef, guide, capture };
}
