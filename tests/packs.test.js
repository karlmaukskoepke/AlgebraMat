import { describe, it, expect } from 'vitest';
import { PACKS, packById } from '../src/packs/index.js';
import { newProgress, completeLevel, encodeProgress, decodeProgress, isLevelUnlocked } from '../src/engine/progress.js';

describe('pack list', () => {
  it('names the math on every card', () => {
    for (const p of PACKS) expect(p.subtitle, p.id).toMatch(/\w/);
  });

  it('opens Combine it, Flip It, Group It, Boxes & Circles, Groups of Terms and Distribute, then combine and Value it, in order', () => {
    expect(PACKS.filter((p) => !p.comingSoon).map((p) => p.id)).toEqual(['combineit', 'flipit', 'lasso', 'boxes', 'groups-of-terms', 'distribute-combine', 'value']);
    expect(PACKS.filter((p) => p.comingSoon)).toEqual([]);
    expect(packById('distribute-combine')).toMatchObject({ levels: 5 });
  });

  it('gives each playable pack a name and a generator for every level', () => {
    for (const p of PACKS.filter((q) => !q.comingSoon)) {
      expect(p.levelNames).toHaveLength(p.levels);
      for (let l = 1; l <= p.levels; l++) expect(p.generate(l, 7)).toHaveLength(5);
    }
  });

  it('keeps coming-soon packs out of progress and save codes', () => {
    const soon = { id: 'later', title: 'Later', subtitle: '', levels: 3, comingSoon: true };   // nothing is coming soon right now
    const fresh = newProgress([...PACKS, soon]);
    expect(Object.keys(fresh.packs)).toEqual(['combineit', 'flipit', 'lasso', 'boxes', 'groups-of-terms', 'distribute-combine', 'value']);
    expect(isLevelUnlocked(fresh, 'lasso', 1)).toBe(true);
    let p = fresh;
    for (let l = 1; l <= 4; l++) p = completeLevel(p, 'flipit', l);
    p = completeLevel(p, 'lasso', 1);
    p = completeLevel(p, 'lasso', 2);
    expect(decodeProgress(encodeProgress(p), [...PACKS, soon])).toEqual(p);
  });

  it('finds packs by id', () => {
    expect(packById('lasso').title).toBe('Group It');
    expect(packById('nope')).toBeUndefined();
  });
});
