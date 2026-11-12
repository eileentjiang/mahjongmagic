import { useRef, useState } from 'react';
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
  const shoot = () => { if (input.current) { input.current.value = ''; input.current.click(); } };
  const byHand = () => nav.go('entry');

  return (
    <div className="app" style={{ background: '#161A1A', color: '#FBF8EF' }}>
      <header className="header">
        <button type="button" className="icon-btn" aria-label="Back to the table" onClick={nav.back} style={{ color: '#FBF8EF' }}><Icon.back /></button>
        <h1 style={{ flexGrow: 1, textAlign: 'center', fontSize: 18, fontWeight: 600, paddingRight: 44 }}>Photo the winning hand</h1>
      </header>
      <input ref={input} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0])} />

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

      <footer style={{ padding: '16px 20px calc(30px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <button type="button" aria-label="Take photo" disabled={phase.kind === 'reading'} onClick={shoot}
          style={{ width: 78, height: 78, borderRadius: 39, border: '3px solid #FBF8EF', background: 'transparent', padding: 5, opacity: phase.kind === 'reading' ? 0.4 : 1 }}>
          <span style={{ display: 'block', width: '100%', height: '100%', borderRadius: '50%', background: '#FBF8EF' }} />
        </button>
        <button type="button" className="link-btn" style={{ color: '#FBF8EF', fontWeight: 500 }} onClick={byHand}>Enter tiles by hand instead</button>
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
