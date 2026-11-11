import { useState } from 'react';
import { HOUSE_DEFAULT, isHouseDefault, isPureMcr, money, PURE_MCR, RULE_TOGGLES, RuleSet } from '../engine/rules';
import { Header, Switch } from '../components/ui';
import { useNav, useStore } from '../state/store';

/** Rules & payout. `session` = opened mid-session from the menu. */
export function Rules({ session = false }: { session?: boolean }) {
  const store = useStore();
  const nav = useNav();
  const startRules = session ? store.table!.rules : store.setup?.rules ?? HOUSE_DEFAULT;
  const [rules, setRules] = useState<RuleSet>(startRules);
  const scale = rules.scaleCents;
  const setScale = (c: number) => setRules({ ...rules, scaleCents: Math.min(1000, Math.max(1, c)) });
  const step = scale < 10 ? 1 : scale < 50 ? 5 : 25;

  const next = () => {
    if (session) { store.changeRules(rules); nav.back(); return; }
    store.update((d) => ({ ...d, setup: d.setup ? { ...d.setup, rules } : d.setup }));
    nav.go('players');
  };

  return (
    <div className="app">
      <Header title="Rules & payout" kicker={session ? undefined : 'Step 1 of 2'} />
      <div className="body" style={{ gap: 18 }}>
        <div className="panel" style={{ padding: '10px 16px', minHeight: 62, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2 }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>Hong Kong style</span>
          <span style={{ fontSize: 13, fontWeight: 500 }}>MCR rules · 81 scoring patterns</span>
        </div>

        <div className="seg" role="group" aria-label="House rules preset" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <button type="button" aria-pressed={isHouseDefault(rules)} onClick={() => setRules({ ...HOUSE_DEFAULT, scaleCents: scale })}>House default</button>
          <button type="button" aria-pressed={isPureMcr(rules)} onClick={() => setRules({ ...PURE_MCR, scaleCents: scale })}>Pure MCR</button>
        </div>

        <div className="panel row" style={{ padding: '12px 14px', gap: 10 }}>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>Payout scale</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>6 points = {money(6 * scale)}</span>
          </span>
          <button type="button" className="btn" style={{ width: 44, minHeight: 44, padding: 0, fontSize: 20, background: 'var(--ground)' }} aria-label="Lower the payout scale" onClick={() => setScale(scale - step)}>−</button>
          <span className="num" style={{ minWidth: 76, textAlign: 'center', fontWeight: 700 }}>{money(scale)}/pt</span>
          <button type="button" className="btn" style={{ width: 44, minHeight: 44, padding: 0, fontSize: 20, background: 'var(--ground)' }} aria-label="Raise the payout scale" onClick={() => setScale(scale + step)}>+</button>
        </div>

        <section style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ marginBottom: 2 }}>House rules</h2>
          {RULE_TOGGLES.map((t) => (
            <div key={t.key} className="list-row" style={{ minHeight: 62, padding: '6px 0' }}>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{t.name}</span>
                <span className="muted" style={{ fontSize: 13 }}>{t.desc}</span>
              </span>
              <Switch on={t.get(rules)} label={t.name} onChange={(on) => setRules(t.set(rules, on))} />
            </div>
          ))}
          <p className="muted" style={{ fontSize: 13, margin: '10px 0 0' }}>Custom rules in your own words arrive with photo scoring.</p>
        </section>
      </div>
      <footer className="footer">
        {session && <p className="muted" style={{ margin: 0, fontSize: 13, textAlign: 'center' }}>Changes apply from the next game on. Games already played keep their scores.</p>}
        <button type="button" className="btn btn-primary" onClick={next}>{session ? 'Save changes' : 'Next: players'}</button>
      </footer>
    </div>
  );
}
