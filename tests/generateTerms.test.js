import { describe, it, expect } from 'vitest';
import {
  generateTermLevel, MAX_VALUE, MAX_TERMS, SMALL_PIECES, MAX_PIECES, switches, hasBareX, boxesCancel, numbersCancel,
  hasSubNeg, hasNegativeX, hasNegativeNumber,
} from '../src/engine/generateTerms.js';
import { evaluate, formatExpression, formatAnswer, effective, isX, totalPieces, needsRewrite } from '../src/engine/terms.js';
import { PROBLEMS_PER_LEVEL } from '../src/engine/generate.js';

const SEEDS = Array.from({ length: 150 }, (_, i) => i * 7919 + 13);
const sets = (level) => SEEDS.map((seed) => generateTermLevel(level, seed));
const count = (set, test) => set.filter(test).length;
const kindGone = (e) => { const { x, n } = evaluate(e); return (x === 0) !== (n === 0); };

describe('Boxes & Circles generator: every level', () => {
  for (const level of [1, 2, 3, 4, 5]) {
    describe(`Level ${level}`, () => {
      const all = sets(level);

      it('makes 5 different problems with 5 different answers', () => {
        for (const set of all) {
          expect(set).toHaveLength(PROBLEMS_PER_LEVEL);
          expect(new Set(set.map(formatExpression)).size).toBe(5);
          expect(new Set(set.map((e) => formatAnswer(evaluate(e)))).size).toBe(5);
        }
      });

      it('keeps every number from 1 to 9, 3 to 6 terms, and the pieces drawable', () => {
        for (const e of all.flat()) {
          expect(e.terms.length).toBeGreaterThanOrEqual(3);
          expect(e.terms.length).toBeLessThanOrEqual(MAX_TERMS);
          for (const t of e.terms) {
            expect(Math.abs(t.value)).toBeGreaterThanOrEqual(1);
            expect(Math.abs(t.value)).toBeLessThanOrEqual(MAX_VALUE);
          }
          expect(totalPieces(e)).toBeLessThanOrEqual(level <= 2 ? SMALL_PIECES : MAX_PIECES);
        }
      });

      it('has variable terms and numbers, interleaved, not already grouped', () => {
        for (const e of all.flat()) {
          const kinds = e.terms.map((t) => t.kind);
          expect(kinds).toContain('x');
          expect(kinds).toContain('int');
          expect(switches(kinds)).toBeGreaterThanOrEqual(2);
        }
      });

      it('writes the first term without an operation, and never "+ (−…)"', () => {
        for (const e of all.flat()) {
          expect(e.terms[0].op).toBe('+');
          for (const t of e.terms.slice(1)) {
            if (t.value < 0) expect(t.op).toBe('-'); // only subtracting a negative
          }
        }
      });

      it('never cancels everything, and lets at most one kind vanish per set', () => {
        for (const set of all) {
          for (const e of set) expect(formatAnswer(evaluate(e))).not.toBe('0');
          expect(count(set, kindGone)).toBeLessThanOrEqual(level <= 2 ? 0 : 1);
        }
      });

      it('gives the same set for the same seed, and different sets for different seeds', () => {
        expect(generateTermLevel(level, 4242)).toEqual(generateTermLevel(level, 4242));
        const texts = new Set(all.map((s) => s.map(formatExpression).join('|')));
        expect(texts.size).toBeGreaterThan(SEEDS.length * 0.95);
      });
    });
  }
});

describe('Boxes & Circles generator: what each level teaches', () => {
  it('Level 1: only + terms, no bare x, small', () => {
    for (const e of sets(1).flat()) {
      expect(e.terms.every((t) => t.op === '+' && t.value > 0)).toBe(true);
      expect(hasBareX(e)).toBe(false);
    }
  });

  it('Level 2: positive x terms, subtracted numbers, and at least 2 per set where the numbers cancel', () => {
    for (const set of sets(2)) {
      for (const e of set) {
        expect(e.terms.filter(isX).every((t) => effective(t) > 0)).toBe(true);
        expect(effective(e.terms[0])).toBeGreaterThan(0);
        expect(hasNegativeNumber(e)).toBe(true);
        expect(hasSubNeg(e)).toBe(false);
      }
      expect(count(set, numbersCancel)).toBeGreaterThanOrEqual(2);
    }
  });

  it('Level 3: a negative x term every time, bare x and canceling boxes at least twice, nothing to rewrite', () => {
    for (const set of sets(3)) {
      for (const e of set) {
        expect(hasNegativeX(e)).toBe(true);
        expect(hasSubNeg(e)).toBe(false);
      }
      expect(count(set, hasBareX)).toBeGreaterThanOrEqual(2);
      expect(count(set, boxesCancel)).toBeGreaterThanOrEqual(2);
    }
  });

  it('Level 3: negative first terms and bare −x do turn up', () => {
    const all = sets(3).flat();
    expect(all.some((e) => effective(e.terms[0]) < 0)).toBe(true);
    expect(all.some((e) => e.terms.some((t) => isX(t) && effective(t) === -1))).toBe(true);
  });

  it('Level 4: one or two subtracted negatives in every problem, and canceling boxes', () => {
    for (const set of sets(4)) {
      for (const e of set) {
        const n = e.terms.filter(needsRewrite).length;
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(2);
      }
      expect(count(set, boxesCancel)).toBeGreaterThanOrEqual(2);
    }
    const all = sets(4).flat();
    expect(all.some((e) => e.terms.some((t) => needsRewrite(t) && isX(t)))).toBe(true);
    expect(all.some((e) => e.terms.some((t) => needsRewrite(t) && !isX(t)))).toBe(true);
  });

  it('Level 5: at least 2 problems that subtract a negative and at least 2 with nothing to rewrite', () => {
    for (const set of sets(5)) {
      expect(count(set, hasSubNeg)).toBeGreaterThanOrEqual(2);
      expect(count(set, (e) => !hasSubNeg(e))).toBeGreaterThanOrEqual(2);
      for (const e of set) expect(e.terms.length).toBeGreaterThanOrEqual(5);
    }
  });

  it('rejects levels that do not exist', () => {
    expect(() => generateTermLevel(0, 1)).toThrow();
    expect(() => generateTermLevel(6, 1)).toThrow();
  });
});
