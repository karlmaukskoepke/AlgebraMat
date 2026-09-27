import { describe, it, expect } from 'vitest';
import {
  newProgress, isLevelDone, isLevelUnlocked, isPackComplete, completeLevel, nextLevel,
} from '../src/engine/progress.js';
import { PACKS } from '../src/packs/index.js';

describe('progress', () => {
  const fresh = newProgress(PACKS);

  it('starts with every Flip It level unfinished and no entry for coming-soon packs', () => {
    expect(fresh).toEqual({ v: 1, packs: { flipit: { levels: [false, false, false, false] } } });
  });

  it('opens Level 1 only, at first', () => {
    expect([1, 2, 3, 4].map((l) => isLevelUnlocked(fresh, 'flipit', l))).toEqual([true, false, false, false]);
    expect(isLevelUnlocked(fresh, 'flipit', 5)).toBe(false);
    expect(isLevelUnlocked(fresh, 'lasso', 1)).toBe(false);
    expect(nextLevel(fresh, 'flipit')).toBe(1);
  });

  it('finishing a level unlocks the next one', () => {
    const p = completeLevel(fresh, 'flipit', 1);
    expect(isLevelDone(p, 'flipit', 1)).toBe(true);
    expect([1, 2, 3, 4].map((l) => isLevelUnlocked(p, 'flipit', l))).toEqual([true, true, false, false]);
    expect(nextLevel(p, 'flipit')).toBe(2);
    expect(isLevelDone(fresh, 'flipit', 1)).toBe(false); // not mutated
  });

  it('finishing Level 4 marks the pack complete', () => {
    let p = fresh;
    for (const l of [1, 2, 3]) p = completeLevel(p, 'flipit', l);
    expect(isPackComplete(p, 'flipit')).toBe(false);
    p = completeLevel(p, 'flipit', 4);
    expect(isPackComplete(p, 'flipit')).toBe(true);
    expect(nextLevel(p, 'flipit')).toBe(null);
    expect(isPackComplete(p, 'lasso')).toBe(false);
  });

  it('replaying a finished level keeps it finished', () => {
    const p = completeLevel(completeLevel(fresh, 'flipit', 1), 'flipit', 1);
    expect(p.packs.flipit.levels).toEqual([true, false, false, false]);
  });

  it('rejects levels that do not exist', () => {
    expect(() => completeLevel(fresh, 'flipit', 5)).toThrow();
    expect(() => completeLevel(fresh, 'lasso', 1)).toThrow();
  });
});
