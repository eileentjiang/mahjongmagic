import { useState } from 'react';
import { HOUSE_DEFAULT, isHouseDefault, isPureMcr, money, PURE_MCR, RULE_TOGGLES, RuleSet } from '../engine/rules';
import { Header, Icon, Switch } from '../components/ui';
import { CustomRuleSheet } from './CustomRuleSheet';
import { useNav, useStore } from '../state/store';

const PRESETS = [
  { key: 'house', name: 'Our house rules', desc: 'Win with any points. The player who discards the winning tile pays double; a self-draw doubles everyone’s payment.', base: HOUSE_DEFAULT, is: isHouseDefault, tag: 'Default' },
  { key: 'mcr', name: 'Official rules (MCR)', desc: 'Tournament scoring: at least 8 points to win, and every win carries an 8-point base.', base: PURE_MCR, is: isPureMcr, tag: '' },
];

/** Rules & payout. `session` = opened mid-session from the menu. */
export function Rules({ session = false }: { session?: boolean }) {
  const store = useStore();
  const nav = useNav();
  const startRules = session ? store.table!.rules : store.setup?.rules ?? HOUSE_DEFAULT;
  const [rules, setRules] = useState<RuleSet>(startRules);
  const scale = rules.scaleCents;
  const setScale = (c: number) => setRules({ ...rules, scaleCents: Math.min(1000, Math.max(1, c)) });
  const step = scale < 10 ? 1 : scale < 50 ? 5 : 25;
  const tuned = !PRESETS.some((p) => p.is(rules));

  const next = () => {
    if (session) { store.changeRules(rules); nav.back(); return; }
    store.update((d) => ({ ...d, setup: d.setup ? { ...d.setup, rules } : d.setup }));
    nav.go('players');
  };

  if (nav.sheet === 'rulesFine') return <FineTune rules={rules} setRules={setRules} />;

  return (
    <div className="app">
      <Header title="Rules & payout" kicker={session ? undefined : 'Step 1 of 2'} />
      <div className="body" style={{ gap: 22 }}>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.45 }}>Pick a starting point. You can modify the ruleset later.</p>

        <div role="radiogroup" aria-label="Rules" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PRESETS.map((p) => {
            const on = p.is(rules);
            return (
              <button key={p.key} type="button" role="radio" aria-checked={on}
                onClick={() => setRules({ ...p.base, scaleCents: scale, customRules: rules.customRules })}
                style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '14px 16px', textAlign: 'left', background: on ? 'var(--panel)' : 'transparent', border: on ? '2px solid var(--walnut)' : '1px solid var(--line)' }}>
                <span className="row" style={{ gap: 10, width: '100%' }}>
                  <span aria-hidden="true" style={{ flexShrink: 0, width: 20, height: 20, borderRadius: '50%', border: `2px solid ${on ? 'var(--walnut)' : 'var(--line)'}`, background: on ? 'radial-gradient(circle, #5A3826 0 40%, transparent 44%)' : 'transparent' }} />
                  <span style={{ flexGrow: 1, fontSize: 17, fontWeight: 700 }}>{p.name}</span>
                  {p.tag && <span className="tag" style={{ fontSize: 11 }}>{p.tag}</span>}
                </span>
                <span style={{ fontSize: 14, lineHeight: 1.45, paddingLeft: 30 }}>{p.desc}</span>
              </button>
            );
          })}
          {tuned && <p className="muted" style={{ margin: 0, fontSize: 13 }}>You’ve fine-tuned the rules. Pick one above to start over from it.</p>}
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

        <button type="button" className="row" onClick={() => nav.openSheet('rulesFine')} style={{ gap: 10, minHeight: 52, padding: '0 14px', border: '1px solid var(--line)', background: 'transparent', textAlign: 'left' }}>
          <span style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Fine-tune house rules</span>
            <span className="muted" style={{ fontSize: 13 }}>Optional · {RULE_TOGGLES.length} switches and your own custom rules{(rules.customRules?.length ?? 0) > 0 ? ` (${rules.customRules!.length} added)` : ''}</span>
          </span>
          <Icon.chevron />
        </button>
      </div>
      <footer className="footer">
        {session && <p className="muted" style={{ margin: 0, fontSize: 13, textAlign: 'center' }}>Changes apply from the next game on. Games already played keep their scores.</p>}
        <button type="button" className="btn btn-primary" onClick={next}>{session ? 'Save changes' : 'Next: players'}</button>
      </footer>
    </div>
  );
}

function FineTune({ rules, setRules }: { rules: RuleSet; setRules: (r: RuleSet) => void }) {
  const nav = useNav();
  const [adding, setAdding] = useState(false);
  const custom = rules.customRules ?? [];
  const setCustom = (c: NonNullable<RuleSet['customRules']>) => setRules({ ...rules, customRules: c });
  return (
    <div className="app">
      <Header title="Fine-tune house rules" />
      <div className="body" style={{ gap: 14 }}>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.45 }}>Switch rules on or off, or add your own. Rules that are on are applied to every win automatically.</p>
        <section aria-label="House rules" style={{ display: 'flex', flexDirection: 'column' }}>
          {RULE_TOGGLES.map((t) => (
            <div key={t.key} className="list-row" style={{ minHeight: 62, padding: '6px 0' }}>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{t.name}</span>
                <span className="muted" style={{ fontSize: 13 }}>{t.desc}</span>
              </span>
              <Switch on={t.get(rules)} label={t.name} onChange={(on) => setRules(t.set(rules, on))} />
            </div>
          ))}
          {custom.map((r) => (
            <div key={r.id} className="list-row" style={{ minHeight: 62, padding: '6px 0' }}>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{r.name} <span className="tag tag-house" style={{ fontSize: 11, height: 20 }}>Custom</span></span>
                <span className="muted" style={{ fontSize: 13 }}>{r.when} · +{r.points} pt{r.points === 1 ? '' : 's'} · {r.payer === 'everyone' ? 'everyone pays' : 'discarder pays'}</span>
                <button type="button" className="link-btn" style={{ minHeight: 32, fontSize: 13 }} onClick={() => setCustom(custom.filter((x) => x.id !== r.id))}>Delete</button>
              </span>
              <Switch on={r.on} label={r.name} onChange={(on) => setCustom(custom.map((x) => (x.id === r.id ? { ...x, on } : x)))} />
            </div>
          ))}
          <button type="button" className="link-btn" style={{ minHeight: 52 }} onClick={() => setAdding(true)}><Icon.plus />Add a custom rule</button>
        </section>
      </div>
      <footer className="footer">
        <button type="button" className="btn btn-primary" onClick={nav.closeSheet}>Done</button>
      </footer>
      {adding && <CustomRuleSheet onClose={() => setAdding(false)} onSave={(r) => { setCustom([...custom, r]); setAdding(false); }} />}
    </div>
  );
}
