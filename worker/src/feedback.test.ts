import { describe, expect, it } from 'vitest';
import { addTo, compare, emptyStats } from './feedback';

const R = (s: string, unsure: number[] = []) => s.split(' ').map((tile, i) => ({ tile, sure: !unsure.includes(i) }));

describe('photo accuracy', () => {
  it('a perfect read', () => {
    const c = compare({ model: 'm', read: R('m1 m2 m3'), final: ['m1', 'm2', 'm3'], flowersRead: [], flowersFinal: [] });
    expect(c).toMatchObject({ wrong: 0, silentWrong: 0, confusions: [] });
  });
  it('an in-place fix of a flagged tile is not a silent misread', () => {
    const c = compare({ model: 'm', read: R('m1 p8 m3', [1]), final: ['m1', 'p3', 'm3'], flowersRead: [], flowersFinal: [] });
    expect(c).toMatchObject({ wrong: 1, silentWrong: 0, flaggedWrong: 1, confusions: ['p8>p3'] });
  });
  it('a confident wrong read counts as silent', () => {
    const c = compare({ model: 'm', read: R('m1 p8 m3'), final: ['m1', 'p3', 'm3'], flowersRead: [], flowersFinal: [] });
    expect(c.silentWrong).toBe(1);
  });
  it('missed and extra tiles when the hand was edited by hand', () => {
    const c = compare({ model: 'm', read: R('m1 m2 m3 dr'), final: ['m1', 'm2', 'm3', 'dg', 'dg'], flowersRead: ['f1'], flowersFinal: [] });
    expect(c).toMatchObject({ confusions: ['dr>dg'], missed: 1, extra: 0, wrong: 2, silentWrong: 1, flowersWrong: 1 });
  });
  it('rolls up into per-model stats', () => {
    let s = emptyStats();
    s = addTo(s, compare({ model: 'm', read: R('m1 p8'), final: ['m1', 'p3'], flowersRead: [], flowersFinal: [] }));
    s = addTo(s, compare({ model: 'm', read: R('m1 p8'), final: ['m1', 'p8'], flowersRead: [], flowersFinal: [] }));
    expect(s).toMatchObject({ photos: 2, tiles: 4, wrong: 1, perfectPhotos: 1, confusions: { 'p8>p3': 1 } });
  });
});
