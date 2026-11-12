import { useEffect, useState } from 'react';

/**
 * Home-screen web apps can keep showing an old copy after a release. Check for a newer build when the app
 * opens and whenever it comes back to the foreground; if there is one, offer to reload into it.
 */
export function UpdateBanner() {
  const [latest, setLatest] = useState<string | null>(null);

  useEffect(() => {
    // Drop the cache-busting ?v= left by an update reload.
    const url = new URL(location.href);
    if (url.searchParams.has('v')) { url.searchParams.delete('v'); history.replaceState(history.state, '', url.pathname + url.search + url.hash); }

    let last = 0;
    const check = async () => {
      if (Date.now() - last < 30_000) return; // at most every 30 s
      last = Date.now();
      try {
        const res = await fetch(`./version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const { build } = (await res.json()) as { build?: string };
        if (build && build !== __BUILD_ID__ && build > __BUILD_ID__) setLatest(build);
      } catch { /* offline: try again next time */ }
    };
    check();
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => { document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('focus', onVisible); };
  }, []);

  if (!latest) return null;
  // A fresh URL makes the phone fetch the new page instead of its cached copy.
  const update = () => location.replace(`${location.pathname}?v=${latest}`);
  return (
    <button type="button" onClick={update} role="status"
      style={{ position: 'fixed', left: 12, right: 12, top: 'calc(8px + env(safe-area-inset-top))', zIndex: 35, maxWidth: 456, margin: '0 auto',
        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: 'none', background: 'var(--walnut)', color: 'var(--ground)',
        fontSize: 15, fontWeight: 600, textAlign: 'left', boxShadow: '0 6px 20px rgba(22,26,26,0.25)' }}>
      <span style={{ flexGrow: 1 }}>A new version is ready. Tap to update.</span>
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5" /></svg>
    </button>
  );
}
