import { describe, it, expect } from 'vitest';
import { makeSolve } from '../src/engine/solve.js';
import { makeSolve2 } from '../src/engine/solve2.js';
import { generateSwitchLevel } from '../src/engine/generateSwitch.js';
import { PACKS, packById, SECTIONS } from '../src/packs/index.js';
import { newProgress, encodeProgress, decodeProgress } from '../src/engine/progress.js';
import { formatEquation } from '../src/engine/equation.js';

const typed = (text) => [...text.replace(/−/g, '-')].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'toggleSign' }));

const PLUS = makeSolve('x+a', 4, -6);                  // x + 4 = −2
const MINUS = makeSolve('x-a', 5, 12);                 // x − 5 = 7
const MIRROR = makeSolve('x+a', 5, 7, true);           // 12 = x + 5
const TWO = makeSolve2('ax+b', 2, 6, 4);               // 2x + 6 = 14
const TWO_NEG = makeSolve2('ax-b', 3, 4, -2);          // 3x − 4 = −10

describe('the problems and the card', () => {
  it('are five a level, whole answers, no repeats, each level its kind', () => {
    for (let seed = 1; seed <= 100; seed++) {
      for (let level = 1; level <= 6; level++) {
        const set = generateSwitchLevel(level, seed);
        expect(set).toHaveLength(5);
        expect(new Set(set.map((p) => p.x)).size).toBe(5);
        for (const p of set) {
          expect(p.x !== 0 && Number.isInteger(p.x)).toBe(true);
          expect(level <= 4 ? p.kind === 'solve' : p.kind === 'solve2').toBe(true);
          if (level === 4) expect(p.mirror).toBe(true);
          if (level === 3) expect(p.x < 0).toBe(true);
          if (level === 5) expect(p.x > 0 && !p.mirror).toBe(true);
          if (level === 6) expect(p.x < 0).toBe(true);
        }
        if (level === 3) expect(set.filter((p) => p.b < 0).length).toBeGreaterThanOrEqual(2);
      }
    }
    expect(generateSwitchLevel(4, 9)).toEqual(generateSwitchLevel(4, 9));
  });

  it('is a retired card of six levels: off the Solve it screen, still saved in the code (its levels feed Add to both sides)', () => {
    const pack = packById('switch');
    expect(pack).toMatchObject({ levels: 6, title: 'Switch sides' });
    expect(pack.levelNames).toHaveLength(6);
    expect(pack.retired).toBe(true);
    expect(SECTIONS.flatMap((s) => (s.id.startsWith('solve') ? s.packs : []))).toEqual(['add-both', 'divide-it', 'flip-everything', 'fractions-of-x', 'two-step-equations', 'distribute-solve', 'variables-both-sides', 'distribute-more', 'strange-solutions']);   // (two sections since Build X)
    const progress = newProgress(PACKS);
    progress.packs.switch.levels = [true, true, false, true, false, true];
    expect(decodeProgress(encodeProgress(progress), PACKS).packs.switch.levels).toEqual([true, true, false, true, false, true]);
    expect(decodeProgress(encodeProgress(newProgress(PACKS), 11), PACKS).packs.switch.levels).toEqual(Array(6).fill(false));
  });
});
