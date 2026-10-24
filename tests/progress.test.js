import { describe, it, expect } from 'vitest';
import {
  withLegacyCredit, mergeProgress, doneCount, newProgress, isLevelDone, isLevelUnlocked, isPackComplete, completeLevel, nextLevel, normalizeProgress,
} from '../src/engine/progress.js';
import { PACKS } from '../src/packs/index.js';

describe('progress', () => {
  const fresh = newProgress(PACKS);

  it('starts with every level of every pack unfinished', () => {
    expect(fresh).toEqual({
      v: 1,
      packs: { combineit: { levels: Array(5).fill(false) }, flipit: { levels: Array(5).fill(false) }, lasso: { levels: Array(7).fill(false) }, boxes: { levels: Array(6).fill(false) }, 'groups-of-terms': { levels: Array(8).fill(false) }, 'distribute-combine': { levels: Array(5).fill(false) }, value: { levels: Array(4).fill(false) }, 'add-both': { levels: Array(6).fill(false), first: 2 }, 'divide-it': { levels: Array(6).fill(false), first: 2 }, 'flip-everything': { levels: Array(6).fill(false), first: 2 }, 'one-step': { levels: Array(5).fill(false), first: 3 }, 'two-step': { levels: Array(7).fill(false) }, switch: { levels: Array(6).fill(false) }, 'two-step-equations': { levels: Array(7).fill(false) }, 'distribute-solve': { levels: Array(5).fill(false) }, 'variables-both-sides': { levels: Array(5).fill(false) } },
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

  it('moves progress saved before the mixed party-or-battle round (4 Combine it levels) into the five-level pack', () => {
    const old = { v: 1, packs: { combineit: { levels: [true, true, true, false] } } };
    expect(normalizeProgress(old, PACKS).packs.combineit.levels).toEqual([true, true, true, true, false]);
    const early = { v: 1, packs: { combineit: { levels: [true, true, false, false] } } };
    expect(normalizeProgress(early, PACKS).packs.combineit.levels).toEqual([true, true, false, false, false]);
    // A five-level save is left alone.
    const now = { v: 1, packs: { combineit: { levels: [true, false, true, false, true] } } };
    expect(normalizeProgress(now, PACKS).packs.combineit.levels).toEqual([true, false, true, false, true]);
  });
});

describe('Add to both sides takes over from One-step equations and Switch sides (nobody re-earns)', () => {
  const withOld = (oneStep = [], sw = []) => {
    const p = newProgress(PACKS);
    oneStep.forEach((l) => { p.packs['one-step'].levels[l - 1] = true; });
    sw.forEach((l) => { p.packs.switch.levels[l - 1] = true; });
    return normalizeProgress(p, PACKS);
  };
  const done = (p) => p.packs['add-both'].levels.map((d, i) => d && i + 1).filter(Boolean);

  it('maps each old level the way the spec says, and never gives the numeric Level 1', () => {
    expect(done(withOld())).toEqual([]);
    expect(done(withOld([1]))).toEqual([2]);
    expect(done(withOld([2]))).toEqual([3]);
    expect(done(withOld([], [1]))).toEqual([]);                          // L4 needs Switch sides L1 and L2
    expect(done(withOld([], [1, 2]))).toEqual([4]);
    expect(done(withOld([], [4]))).toEqual([5]);
    expect(done(withOld([], [3]))).toEqual([]);                          // L6 needs Switch sides L3 and L4
    expect(done(withOld([], [3, 4]))).toEqual([5, 6]);
    expect(done(withOld([1, 2], [1, 2, 3, 4, 5, 6]))).toEqual([2, 3, 4, 5, 6]);
  });
  it('opens the levels below what was credited, so the numeric level is not a gate', () => {
    const p = withOld([1, 2], [1, 2, 4]);
    expect(p.packs['add-both'].open).toBe(5);
    expect([2, 3, 4, 5, 6].map((l) => isLevelUnlocked(p, 'add-both', l))).toEqual(Array(5).fill(true));
    expect([2, 3].map((l) => isLevelUnlocked(withOld(), 'add-both', l))).toEqual([true, false]);   // nothing earned: the card opens at Level 2
    expect(isLevelUnlocked(withOld(), 'add-both', 1)).toBe(false);       // the numeric level is "See why it works", not a level on offer
    expect(withOld().packs['add-both'].open).toBeUndefined();
  });
  it('leaves the old cards\' own levels alone (they are still saved, in codes and on the class sheet)', () => {
    const p = withOld([1, 2, 3], [1, 2, 5]);
    expect(p.packs['one-step'].levels).toEqual([true, true, true, false, false]);
    expect(p.packs.switch.levels).toEqual([true, true, false, false, true, false]);
  });
  it('is idempotent, and survives a merge with another device', () => {
    const p = withOld([1], [1, 2]);
    expect(withLegacyCredit(structuredClone(p))).toEqual(p);
    expect(normalizeProgress(p, PACKS)).toEqual(p);
    const q = withOld([2]);
    expect(done(mergeProgress(p, q))).toEqual([2, 3, 4]);
  });
});

describe('a card that opens at a later level (One-step equations, until the new cards replace it)', () => {
  it('shows from its third level: the first two are not on offer, and it is complete when the rest are done', () => {
    const fresh = newProgress(PACKS);
    expect([1, 2, 3, 4, 5].map((l) => isLevelUnlocked(fresh, 'one-step', l))).toEqual([false, false, true, false, false]);
    expect(nextLevel(fresh, 'one-step')).toBe(3);
    let p = fresh;
    for (const l of [3, 4]) p = completeLevel(p, 'one-step', l);
    expect(isPackComplete(p, 'one-step')).toBe(false);
    p = completeLevel(p, 'one-step', 5);
    expect(isPackComplete(p, 'one-step')).toBe(true);
    expect(nextLevel(p, 'one-step')).toBe(null);
  });
  it('counts its levels from 1 on screen', async () => {
    const { levelNumber, packById } = await import('../src/packs/index.js');
    expect([3, 4, 5].map((l) => levelNumber(packById('one-step'), l))).toEqual([1, 2, 3]);
    expect(levelNumber(packById('flipit'), 3)).toBe(3);
  });
});

describe('doneCount', () => {
  it('counts finished levels across every pack', () => {
    let p = newProgress(PACKS);
    expect(doneCount(p)).toBe(0);
    p = completeLevel(completeLevel(p, 'flipit', 1), 'lasso', 1);
    expect(doneCount(p)).toBe(2);
    expect(doneCount(null)).toBe(0);
  });
});

describe('old One-step progress counts for Divide it', () => {
  const old = (levels) => { let p = newProgress(PACKS); for (const l of levels) p = completeLevel(p, 'one-step', l); return normalizeProgress(p, PACKS); };
  it('maps One-step ax = b (3) to Divide it L2 and mixed (5) to L3, never L1, and opens up to what was earned', () => {
    expect(old([3]).packs['divide-it'].levels).toEqual([false, true, false, false, false, false]);
    expect(old([3, 5]).packs['divide-it'].levels).toEqual([false, true, true, false, false, false]);
    expect(old([3, 5]).packs['divide-it'].open).toBe(3);
    expect(old([4]).packs['divide-it'].levels.some(Boolean)).toBe(false);
  });
});

describe('"See why it works" (Add to both sides and Divide it open at their first equation level, Karl 2026-10-18)', () => {
  it('opens at Level 2, shown as Level 1; the numeric walkthrough is not a gate, and its saved level keeps its meaning', async () => {
    const { levelNumber, packById, isWhyLevel } = await import('../src/packs/index.js');
    for (const id of ['add-both', 'divide-it']) {
      const fresh = newProgress(PACKS);
      expect([1, 2, 3].map((l) => isLevelUnlocked(fresh, id, l))).toEqual([false, true, false]);
      expect(nextLevel(fresh, id)).toBe(2);
      expect(levelNumber(packById(id), 2)).toBe(1);
      expect(isWhyLevel(packById(id), 1)).toBe(true);
      expect(isWhyLevel(packById(id), 2)).toBe(false);
      let p = fresh;
      for (const l of [2, 3, 4, 5, 6]) p = completeLevel(p, id, l);
      expect(isPackComplete(p, id)).toBe(true);                       // finished without the walkthrough
      expect(isLevelDone(completeLevel(fresh, id, 1), id, 1)).toBe(true);   // finishing it is still saved, as before
    }
  });
});
