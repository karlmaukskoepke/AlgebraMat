import { describe, it, expect } from 'vitest';
import { PACKS, SECTIONS, packById } from '../src/packs/index.js';
import { newProgress, placeLevels, completeLevel, placedOpening, withLegacyCredit } from '../src/engine/progress.js';
import { PROBLEMS_PER_LEVEL } from '../src/engine/generate.js';

// Build V2 (Karl, 2026-11-02 and 2026-11-07).

describe('Part A: a placed level opens on its last problem', () => {
  const pack = packById('two-step-equations');
  it('a level placed by a no-help pass or the placement quiz (placeLevels) opens on problem 5 of 5', () => {
    const p = placeLevels(newProgress(PACKS), pack.id, 4);             // (Levels 1-3 placed, 4 open)
    expect(placedOpening(p, pack, 4, 5, PROBLEMS_PER_LEVEL)).toBe(0);
    expect(placedOpening(p, pack, 1, 5, PROBLEMS_PER_LEVEL)).toBe(4);
    expect(placedOpening(p, pack, 3, 5, PROBLEMS_PER_LEVEL)).toBe(4);
  });
  it('an earned level, an open level with nothing on it and a locked level open at problem 1', () => {
    let p = placeLevels(newProgress(PACKS), pack.id, 2);
    p = completeLevel(p, pack.id, 1);
    expect(placedOpening(p, pack, 1, 5, PROBLEMS_PER_LEVEL)).toBe(0);
    expect(placedOpening(p, pack, 3, 5, PROBLEMS_PER_LEVEL)).toBe(0);
    expect(placedOpening(newProgress(PACKS), pack, 1, 5, PROBLEMS_PER_LEVEL)).toBe(0);
  });
  it('legacy credit (an older card’s level) places, so it opens on the last problem too', () => {
    const p = withLegacyCredit(completeLevel(newProgress(PACKS), 'one-step', 3));     // (Divide it's Level 1, saved 2, placed)
    expect(placedOpening(p, packById('divide-it'), 2, 5, PROBLEMS_PER_LEVEL)).toBe(4);
    expect(placedOpening(p, packById('divide-it'), 3, 5, PROBLEMS_PER_LEVEL)).toBe(0);
  });
  it('Count it and Build it are unchanged: their placed levels open at problem 1', () => {
    const p = placeLevels(placeLevels(newProgress(PACKS), 'boxes', 4), 'divide-it', 4);
    expect(placedOpening(p, packById('boxes'), 1, 5, PROBLEMS_PER_LEVEL, SECTIONS)).toBe(0);
    expect(placedOpening(p, packById('divide-it'), 2, 5, PROBLEMS_PER_LEVEL, SECTIONS)).toBe(4);
  });
  it('a set that is not five problems (a test-out has two) is never jumped', () => {
    const p = placeLevels(newProgress(PACKS), pack.id, 3);
    expect(placedOpening(p, pack, 1, 2, PROBLEMS_PER_LEVEL)).toBe(0);
  });
});
