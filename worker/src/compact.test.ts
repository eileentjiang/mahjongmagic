import { describe, expect, it } from 'vitest';
import { parseCompact } from './compact';

describe('compact photo answer', () => {
  it('reads sure and unsure tiles, alternatives and flowers', () => {
    const r = parseCompact({ quality: 'ok', problem: null, tiles: 'm4 m4 p3 p4 p5?p3/p6 s1 dw?', flowers: 'x1' });
    expect(r.tiles).toEqual([
      { tile: 'm4', sure: true, alternatives: [] }, { tile: 'm4', sure: true, alternatives: [] },
      { tile: 'p3', sure: true, alternatives: [] }, { tile: 'p4', sure: true, alternatives: [] },
      { tile: 'p5', sure: false, alternatives: ['p3', 'p6'] }, { tile: 's1', sure: true, alternatives: [] },
      { tile: 'dw', sure: false, alternatives: [] },
    ]);
    expect(r.flowers).toEqual([{ tile: 'x1', sure: true }]);
  });
  it('ignores made-up ids, commas and case', () => {
    expect(parseCompact({ quality: 'ok', problem: null, tiles: 'M1, zz9 p2', flowers: '' }).tiles.map((t) => t.tile)).toEqual(['m1', 'p2']);
  });
  it('an ok answer with no tiles is a failure', () => {
    expect(() => parseCompact({ quality: 'ok', problem: null, tiles: '', flowers: '' })).toThrow();
  });
});
