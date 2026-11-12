import { useState } from 'react';
import { readRule, RuleReading } from '../api';
import { CustomRule } from '../engine/customRule';
import { newId } from '../engine/session';
import { Sheet } from '../components/ui';

export function CustomRuleSheet({ onSave, onClose }: { onSave: (r: CustomRule) => void; onClose: () => void }) {
  const [text, setText] = useState('');
  const [payer, setPayer] = useState<'everyone' | 'discarder'>('everyone');
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState<RuleReading | null>(null);
  const [error, setError] = useState<string | null>(null);

  const check = async () => {
    setBusy(true); setError(null); setReading(null);
    try { setReading(await readRule(text)); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  const save = () => {
    if (!reading?.ok) return;
    onSave({ id: newId(), text: text.trim(), name: reading.name, when: reading.when, points: Math.max(1, reading.points), payer, on: true, all: reading.all });
  };

  return (
    <Sheet title="Add a custom rule" onClose={onClose}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 16, fontWeight: 700 }}>Describe the rule</span>
        <span className="muted" style={{ fontSize: 13, lineHeight: 1.4 }}>Say exactly when it counts: which tiles, sets or situation. The app scores it for you from then on.</span>
        <textarea className="field" rows={3} value={text} maxLength={600} placeholder="e.g. If the winning hand has a pung or kong of green dragons, add 2 points."
          onChange={(e) => { setText(e.target.value); setReading(null); }} />
      </label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 16, fontWeight: 700 }}>Who pays</span>
        <div className="seg" role="radiogroup" aria-label="Who pays" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <button type="button" role="radio" aria-checked={payer === 'everyone'} onClick={() => setPayer('everyone')}>Everyone</button>
          <button type="button" role="radio" aria-checked={payer === 'discarder'} onClick={() => setPayer('discarder')}>Discarder only</button>
        </div>
      </div>
      {error && <p role="alert" style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{error}</p>}
      {reading && !reading.ok && <p role="alert" style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{reading.problem}</p>}
      {reading?.ok && (
        <section className="panel" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 style={{ fontSize: 15 }}>How it will score · {reading.name}</h2>
          <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 12px', fontSize: 14, lineHeight: 1.4 }}>
            <dt style={{ fontWeight: 600 }}>When</dt><dd style={{ margin: 0 }}>{reading.when}</dd>
            <dt style={{ fontWeight: 600 }}>Adds</dt><dd style={{ margin: 0 }}>{reading.points} point{reading.points === 1 ? '' : 's'} to the hand</dd>
            <dt style={{ fontWeight: 600 }}>Pays</dt><dd style={{ margin: 0 }}>{payer === 'everyone' ? 'Like the rest of the hand' : 'Only the discarder; on a self-draw, everyone'}</dd>
          </dl>
          <span className="muted" style={{ fontSize: 13 }}>Not quite right? Reword it and check again.</span>
        </section>
      )}
      {reading?.ok
        ? <button type="button" className="btn btn-primary" onClick={save}>Save rule</button>
        : <button type="button" className="btn btn-primary" disabled={busy || text.trim().length < 8} onClick={check}>{busy ? 'Checking…' : 'Check how it scores'}</button>}
    </Sheet>
  );
}
