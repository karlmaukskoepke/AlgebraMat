import { describe, it, expect } from 'vitest';
import {
  newProgress, isLevelDone, isLevelUnlocked, isPackComplete, completeLevel, nextLevel,
} from '../src/engine/progress.js';
import { PACKS } from '../src/packs/index.js';

describe('progress', () => {
  const fresh = newProgress(PACKS);

  it('starts with every level of every pack unfinished', () => {
    expect(fresh).toEqual({
      v: 1,
      packs: { combineit: { levels: Array(4).fill(false) }, flipit: { levels: Array(5).fill(false) }, lasso: { levels: Array(7).fill(false) }, boxes: { levels: Array(5).fill(false) }, 'groups-of-terms': { levels: Array(8).fill(false) }, 'distribute-combine': { levels: Array(5).fill(false) } },
    });
  });

  it('opens Level 1 only, at first', () => {
    expect([1, 2, 3, 4].map((l) => isLevelUnlocked(fresh, 'flipit', l))).toEqual([true, false, false, false]);
    expect(isLevelUnlocked(fresh, 'flipit', 5)).toBe(false);
    // Lasso is open from the start (SPEC-LASSO.md §4), independent of Flip It.
    expect(isLevelUnlocked(fresh, 'lasso', 1)).toBe(true);
    expect(isLevelUnlocked(fresh, 'lasso', 2)).toBe(false);
    expect(nextLevel(fresh, 'flipit')).toBe(1);
  });

  it('finishing a level unlocks the next one', () => {
    const p = completeLevel(fresh, 'flipit', 1);
    expect(isLevelDone(p, 'flipit', 1)).toBe(true);
    expect([1, 2, 3, 4, 5].map((l) => isLevelUnlocked(p, 'flipit', l))).toEqual([true, true, false, false, false]);
    expect(nextLevel(p, 'flipit')).toBe(2);
    expect(isLevelDone(fresh, 'flipit', 1)).toBe(false); // not mutated
  });

  it('finishing the last level (Flip It\'s mixed Level 5) marks the pack complete', () => {
    let p = fresh;
    for (const l of [1, 2, 3, 4]) p = completeLevel(p, 'flipit', l);
    expect(isPackComplete(p, 'flipit')).toBe(false);
    p = completeLevel(p, 'flipit', 5);
    expect(isPackComplete(p, 'flipit')).toBe(true);
    expect(nextLevel(p, 'flipit')).toBe(null);
    expect(isPackComplete(p, 'lasso')).toBe(false);
  });

  it('replaying a finished level keeps it finished', () => {
    const p = completeLevel(completeLevel(fresh, 'flipit', 1), 'flipit', 1);
    expect(p.packs.flipit.levels).toEqual([true, false, false, false, false]);
  });

  it('rejects levels that do not exist', () => {
    expect(() => completeLevel(fresh, 'flipit', 6)).toThrow();
    expect(() => completeLevel(fresh, 'lasso', 8)).toThrow();
    expect(() => completeLevel(fresh, 'nope', 1)).toThrow();
  });
});
