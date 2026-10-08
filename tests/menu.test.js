import { describe, it, expect } from 'vitest';
import { menuEntries } from '../src/engine/menu.js';
import { PACKS, SECTIONS } from '../src/packs/index.js';
import { newProgress, completeLevel, openLevels } from '../src/engine/progress.js';

describe('the top menu\'s dropdowns', () => {
  it('list every section\'s cards, in order, with a button for each level', () => {
    const entries = menuEntries(SECTIONS, PACKS, newProgress(PACKS));
    expect(entries.map((e) => e.title)).toEqual(['Count it', 'Build it', 'Solve it']);
    expect(entries[0].cards.map((c) => c.id)).toEqual(['combineit', 'flipit', 'lasso']);
    expect(entries[1].cards.map((c) => [c.id, c.levels.length])).toEqual([['boxes', 6], ['groups-of-terms', 8], ['distribute-combine', 5], ['value', 4]]);
    expect(entries[2].cards.map((c) => [c.id, c.soon, c.levels.length])).toEqual([['one-step', false, 5], ['two-step', true, 0], ['multi-step', true, 0]]);
  });

  it('show which levels are finished and which are open (the first, the one after a finished one, and any the diagnostic opened)', () => {
    let progress = completeLevel(newProgress(PACKS), 'flipit', 1);
    progress = openLevels(progress, 'lasso', 4);
    const [count] = menuEntries(SECTIONS, PACKS, progress);
    const flip = count.cards.find((c) => c.id === 'flipit').levels;
    expect(flip.map((l) => [l.done, l.open])).toEqual([[true, true], [false, true], [false, false], [false, false], [false, false]]);
    const group = count.cards.find((c) => c.id === 'lasso').levels;
    expect(group.map((l) => l.open)).toEqual([true, true, true, true, false, false, false]);
    expect(flip[0].name).toBe('positive − negative');
  });
});
