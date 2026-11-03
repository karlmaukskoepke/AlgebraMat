// @vitest-environment happy-dom
// Build AC, Part 5, as the student plays it: Fractions of x's model draws itself on the first problem of Level 1 (and Level 3) once per
// device, not once per run of the level.
import { describe, it, expect, beforeEach } from 'vitest';
import { fractionsPlay } from '../src/play/solveCards.js';
import { generateFractionsLevel } from '../src/engine/generateFractions.js';
import { FX_MODEL_KEY } from '../src/fxModelStore.js';

const first = (level) => ({ ...generateFractionsLevel(level, 7)[0], logLevel: level });
const start = (level) => fractionsPlay.newSession(first(level), { flags: {} });          // (a new run of the level: fresh flags)

describe('Part 5: once per device', () => {
  beforeEach(() => localStorage.clear());
  it('Level 1: drawn on the first run, not on a second run', () => {
    expect(start(1).model?.auto).toBe(true);
    expect(JSON.parse(localStorage.getItem(FX_MODEL_KEY))).toEqual([1]);
    expect(start(1).model).toBeNull();
  });
  it('Level 3 has its own first time; Levels 2, 4, 5, 6 never draw it by themselves', () => {
    expect(start(1).model?.auto).toBe(true);
    expect(start(3).model?.auto).toBe(true);
    expect(start(3).model).toBeNull();
    for (const l of [2, 4, 5, 6]) expect(start(l).model, `L${l}`).toBeNull();
  });
  it('cleared site data: drawn again', () => {
    start(1);
    localStorage.clear();
    expect(start(1).model?.auto).toBe(true);
  });
  it('the save code, the sync state and the class sheet do not hold it (its own key only)', () => {
    start(1);
    const keys = Object.keys(localStorage).filter((k) => localStorage.getItem(k)?.includes('fxmodel'));
    expect(keys).toEqual([]);
    expect(Object.keys(localStorage)).toContain(FX_MODEL_KEY);
  });
});
