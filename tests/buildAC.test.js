import { describe, it, expect } from 'vitest';
import { PACKS, packById, forcedMoveOn, fractionsOfX } from '../src/packs/index.js';

// Build AC: Fractions of x refinements (Karl, 2026-11-03).

describe('Part 1: the forced-move rule is off on Fractions of x Levels 1 and 3 (a setting on the levels)', () => {
  it('is off on Levels 1 and 3 and on at Levels 2, 4, 5 and 6', () => {
    expect(fractionsOfX.noForcedMove).toEqual([1, 3]);
    expect([1, 2, 3, 4, 5, 6].map((l) => forcedMoveOn(fractionsOfX, l))).toEqual([false, true, false, true, true, true]);
  });
  it('is on at every level of every other card', () => {
    for (const pack of PACKS.filter((p) => p.id !== 'fractions-of-x')) {
      for (let l = 1; l <= (pack.levels || 1); l++) expect(forcedMoveOn(pack, l), `${pack.id} L${l}`).toBe(true);
    }
    expect(forcedMoveOn(packById('add-both'), 2)).toBe(true);
    expect(forcedMoveOn(null, 1)).toBe(true);
  });
});
