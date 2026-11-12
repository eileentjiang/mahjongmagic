import { GrainDefs } from './components/Tile';
import { NavProvider, StoreProvider, useNav, useStore } from './state/store';
import { Home } from './screens/Home';
import { Rules } from './screens/Rules';
import { Players } from './screens/Players';
import { Table } from './screens/Table';
import { Sheets } from './screens/Sheets';
import { HandEntry, newDraft } from './screens/HandEntry';
import { Score } from './screens/Score';
import { Standings } from './screens/Standings';
import { EndSession } from './screens/EndSession';
import { About } from './screens/About';
import { Camera } from './screens/Camera';
import { Unsure } from './screens/Unsure';
import { Claim, Join } from './screens/Sharing';
import { useEffect, useState } from 'react';
import { deviceId } from './state/sync';

function Screen() {
  const nav = useNav();
  const store = useStore();
  const inSession = !!store.current && !store.current.finished;
  // Session screens need a session; setup screens need a setup.
  const needsSession = ['table', 'camera', 'unsure', 'entry', 'score', 'standings', 'end', 'rulesEdit', 'playersEdit'].includes(nav.route);
  const needsSetup = ['rules', 'players'].includes(nav.route);
  const broken = (needsSession && !inSession) || (needsSetup && !store.setup) || ((nav.route === 'score' || nav.route === 'unsure') && !store.draft)
    || (nav.route === 'claim' && !store.room);
  useEffect(() => { if (broken) nav.reset(inSession ? 'table' : 'home'); }, [broken]); // eslint-disable-line
  useEffect(() => {
    if (nav.route === 'entry' && !store.draft) store.update((d) => ({ ...d, draft: newDraft(store.mySeat ?? -1) }));
  }, [nav.route]); // eslint-disable-line
  // Shared sessions: hold the one-scorer lock while on a scoring screen, release it anywhere else.
  const scoring = ['camera', 'unsure', 'entry', 'score'].includes(nav.route);
  const iHoldLock = !!store.room?.lock && store.room.lock.device === deviceId();
  useEffect(() => {
    if (!store.current?.shared || store.status !== 'open') return;
    if (scoring && !iHoldLock) {
      store.lockScoring().then((ok) => { if (!ok) nav.reset('table'); });
    } else if (!scoring && iHoldLock) store.unlockScoring();
  }, [scoring, iHoldLock, store.status]); // eslint-disable-line
  if (broken) return null;
  switch (nav.route) {
    case 'home': return <Home />;
    case 'rules': return <Rules />;
    case 'players': return <Players />;
    case 'rulesEdit': return <Rules session />;
    case 'playersEdit': return <Players session />;
    case 'table': return <Table />;
    case 'camera': return <Camera />;
    case 'unsure': return <Unsure />;
    case 'entry': return <HandEntry />;
    case 'score': return <Score />;
    case 'standings': return <Standings />;
    case 'end': return <EndSession />;
    case 'about': return <About />;
    case 'join': return <Join />;
    case 'claim': return <Claim />;
  }
}

function Notice() {
  const store = useStore();
  useEffect(() => { if (!store.notice) return; const t = setTimeout(() => store.setNotice(null), 5000); return () => clearTimeout(t); }, [store.notice]); // eslint-disable-line
  if (!store.notice) return null;
  return (
    <div role="alert" onClick={() => store.setNotice(null)} style={{ position: 'fixed', left: 12, right: 12, top: 'calc(10px + env(safe-area-inset-top))', zIndex: 40, maxWidth: 456, margin: '0 auto', padding: '12px 16px', background: 'var(--ink)', color: 'var(--ground)', fontSize: 15, fontWeight: 600, boxShadow: '0 6px 20px rgba(22,26,26,0.25)' }}>
      {store.notice}
    </div>
  );
}

function Shell() {
  const store = useStore();
  // A QR code or shared link opens the app as …?join=ABCD
  const joinParam = new URLSearchParams(location.search).get('join');
  const [initialJoin] = useState(() => (joinParam && /^[A-Za-z]{4}$/.test(joinParam) ? joinParam.toUpperCase() : null));
  useEffect(() => {
    if (!initialJoin) return;
    history.replaceState(null, '', location.pathname);
    store.join(initialJoin);
  }, []); // eslint-disable-line
  const start = initialJoin ? 'join' : store.current && !store.current.finished ? 'table' : 'home';
  return (
    <NavProvider initial={start}>
      <GrainDefs />
      <Screen />
      <Sheets />
      <Notice />
    </NavProvider>
  );
}

export default function App() {
  return <StoreProvider><Shell /></StoreProvider>;
}
