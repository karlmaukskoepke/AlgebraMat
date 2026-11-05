import { describe, it, expect } from 'vitest';
import { makeFracX } from '../src/engine/fractionsX.js';
import { newFractions, reduceFractions, FRAC_SPOT } from '../src/engine/cards/fractions.js';
import { withSpotlight } from '../src/engine/spotlight.js';
import { boardText } from '../src/engine/solveTerms.js';
import { fractionsFeedbackText } from '../src/view/fractionsFeedback.js';
import { generateFractionsLevel } from '../src/engine/generateFractions.js';

// Build AE (Karl, 2026-11-03 and 2026-11-05).

const r = withSpotlight(reduceFractions, FRAC_SPOT);
const go = (s, ...a) => a.flat().reduce(r, s);
const keys = (t) => [...String(t)].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'typeChar', ch }));
const value = (v) => [...keys(v), { type: 'check' }, { type: 'placeValue' }];
const said = (s) => fractionsFeedbackText(s.feedback);
const P = (p, q, x, o = {}) => makeFracX({ p, q, x, ...o });
const stuck = { type: 'stuck' };
const multiply = (m) => [{ type: 'multOpen' }, { type: 'multPick', kind: 'whole' }, ...keys(m), { type: 'go' }];
const divide = (n) => [{ type: 'divPick' }, ...keys(n), { type: 'go' }];
const toEnd = (s) => { let t = s; for (let k = 0; k < 8 && t.sub && t.sub.step < t.sub.lines.length + 1; k++) t = go(t, { type: 'nextLine' }); return t; };

describe('Part 6: on a non-unit fraction of x the first move suggested is multiplying by the bottom', () => {
  it('⅔x = 6 (Level 4, the reminder first): multiply by 3, Multiply lit; then 2x = 18 and "Divide both sides by 2."', () => {
    let s = go(newFractions(P(2, 3, 9), { level: 4 }), stuck);
    expect(said(s)).toBe('⅔x means ⅔ of x. Multiply both sides by 3 to cancel the bottom 3.');
    expect(s.mopts?.lit).toBe('whole');
    expect(s.ui?.preview).toBe('whole');
    s = go(s, { type: 'spotDismiss' }, multiply(3), { type: 'foldNext' });
    expect(s.needUndo).toBe(false);
    expect(boardText(s.board)).toBe('2x = 18');
    s = go(s, stuck);
    expect(said(s)).toBe('2x means 2 · x. Divide both sides by 2.');
  });
  it('2x/3 = 6 says it in divide-by words', () => {
    const s = go(newFractions(P(2, 3, 9, { form: 'over' }), { level: 6 }), stuck);
    expect(said(s)).toBe('2x/3 means 2x divided by 3. Multiply both sides by 3 to cancel the divide by 3.');
  });
  it('Level 3: the model first (its bridge row unchanged), then the reminder names multiplying', () => {
    let s = go(newFractions(P(2, 3, 9), { level: 3 }), stuck);
    expect(s.model?.step).toBe('cut');
    s = go(s, stuck);
    expect(s.feedback.key).toBe('xOverHint');
    expect(s.mopts?.lit).toBe('whole');
  });
  it('dividing first stays helpful (never red), and the next reminder continues: multiply by the bottom', () => {
    let s = go(newFractions(P(2, 3, 9), { level: 4 }), divide(2), { type: 'foldNext' });
    expect(s.needUndo).toBe(false);
    expect(boardText(s.board)).toBe('⅓x = 3');
    s = go(s, stuck);
    expect(s.feedback.key).toBe('xUnitHint');
    expect(s.mopts?.lit).toBe('whole');
  });
  it('the hint after a wrong value and Undo (Level 4) names multiplying', () => {
    const s = go(toEnd(go(newFractions(P(2, 3, 9), { level: 4 }), value(6))), { type: 'undo' });
    expect(s.feedback.key).toBe('xOverHint');
    expect(s.mopts?.lit).toBe('whole');
  });
  it('a negative: −1 first, then multiply by the bottom', () => {
    let s = go(newFractions(P(2, 3, 9, { neg: true }), { level: 4 }), stuck);
    expect(said(s)).toBe('Multiply both sides by −1 first.');
    s = go(s, { type: 'spotDismiss' }, { type: 'flipPick' }, { type: 'go' }, { type: 'foldNext' }, stuck);
    expect(boardText(s.board)).toBe('⅔x = 6');
    expect(s.feedback.key).toBe('xOverHint');
  });
});

// The report's numbers (Part 6, item 4): the largest product a student multiplies to, over 200 seeds a level.
describe('Part 6: the largest number a student now multiplies to (report only)', () => {
  it('is worked out per level', () => {
    const out = {};
    for (let level = 1; level <= 6; level++) {
      let worst = null;
      const all = [];
      for (let seed = 1; seed <= 200; seed++) {
        for (const p of generateFractionsLevel(level, seed)) {
          const product = Math.abs(p.b) * p.q;
          all.push(product);
          if (!worst || product > worst.product) worst = { product, q: p.q, b: p.b, p: p.p };
        }
      }
      out[level] = { ...worst, over100: all.filter((v) => v > 100).length, over60: all.filter((v) => v > 60).length, n: all.length };
    }
    if (process.env.AE_REPORT) console.log(JSON.stringify(out, null, 1));
    for (const v of Object.values(out)) expect(v.product).toBeLessThanOrEqual(90);
  });
});
