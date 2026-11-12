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
import { useEffect } from 'react';

function Screen() {
  const nav = useNav();
  const store = useStore();
  const inSession = !!store.current && !store.current.finished;
  // Session screens need a session; setup screens need a setup.
  const needsSession = ['table', 'camera', 'unsure', 'entry', 'score', 'standings', 'end', 'rulesEdit', 'playersEdit'].includes(nav.route);
  const needsSetup = ['rules', 'players'].includes(nav.route);
  const broken = (needsSession && !inSession) || (needsSetup && !store.setup) || ((nav.route === 'score' || nav.route === 'unsure') && !store.draft);
  useEffect(() => { if (broken) nav.reset(inSession ? 'table' : 'home'); }, [broken]); // eslint-disable-line
  useEffect(() => {
    if (nav.route === 'entry' && !store.draft) store.update((d) => ({ ...d, draft: newDraft(-1) }));
  }, [nav.route]); // eslint-disable-line
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
  }
}

function Shell() {
  const store = useStore();
  const start = store.current && !store.current.finished ? 'table' : 'home';
  return (
    <NavProvider initial={start}>
      <GrainDefs />
      <Screen />
      <Sheets />
    </NavProvider>
  );
}

export default function App() {
  return <StoreProvider><Shell /></StoreProvider>;
}
