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

import { makeFracX } from '../src/engine/fractionsX.js';
import { newFractions, reduceFractions, FRAC_SPOT } from '../src/engine/cards/fractions.js';
import { withSpotlight } from '../src/engine/spotlight.js';
import { boardText } from '../src/engine/solveTerms.js';
import { fractionsFeedbackText } from '../src/view/fractionsFeedback.js';

const r = withSpotlight(reduceFractions, FRAC_SPOT);
const go = (s, ...a) => a.flat().reduce(r, s);
const keys = (t) => [...String(t)].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'typeChar', ch }));
const value = (v) => [...keys(v), { type: 'check' }, { type: 'placeValue' }];
const said = (s) => fractionsFeedbackText(s.feedback);
const P = (p, q, x, o = {}) => makeFracX({ p, q, x, ...o });
const stuck = { type: 'stuck' };
const toEnd = (s) => { let t = s; for (let k = 0; k < 8 && t.sub && t.sub.step < t.sub.lines.length + 1; k++) t = go(t, { type: 'nextLine' }); return t; };

describe('Part 2: which help comes first, by level', () => {
  it('Levels 1 and 3: the model first, then the reminder, which repeats', () => {
    let s = go(newFractions(P(1, 3, 12), { level: 1 }), stuck);
    expect(s.model?.step).toBe('cut');
    expect(s.supportsShown).toEqual(['model']);
    s = go(s, stuck);
    expect(s.feedback.key).toBe('xUnitHint');
    let t = go(newFractions(P(2, 3, 9), { level: 3 }), stuck);
    expect(t.model?.want).toBe(3);
    t = go(t, stuck);
    expect(said(t)).toBe('⅔x means ⅔ of x. Multiply both sides by 3 to cancel the bottom 3.');
    t = go(t, stuck);
    expect(t.feedback.key).toBe('xOverHint');
  });
  it('Levels 2, 4, 5 and 6: the reminder first, then the model on the current equation, then the reminder again', () => {
    for (const [level, p, key] of [[2, P(1, 3, 12, { form: 'over' }), 'xUnitHint'], [4, P(2, 3, 9), 'xOverHint'], [5, P(2, 3, 9, { mirror: true }), 'xOverHint'], [6, P(2, 3, 9, { form: 'over' }), 'xOverHint']]) {
      let s = go(newFractions(p, { level }), stuck);
      expect(s.feedback.key, `L${level}`).toBe(key);
      expect(s.model, `L${level}: no model on the first click`).toBeNull();
      expect(s.supportsShown).toEqual(['hint']);
      s = go(s, stuck);
      expect(s.model?.step, `L${level}: the model on the second click`).toBe('cut');
      expect(s.supportsShown).toEqual(['hint', 'model']);
      s = go(s, stuck);
      expect(s.feedback.key, `L${level}: the reminder on the third`).toBe(key);
    }
    expect(said(go(newFractions(P(1, 3, 12, { form: 'over' }), { level: 2 }), stuck))).toBe('x/3 means x divided by 3. Multiply both sides by 3 to cancel the divide by 3.');
  });
  it('the model on a later level draws the equation on screen (after a divide: one part)', () => {
    const d = [{ type: 'divPick' }, ...keys(2), { type: 'go' }];
    let s = go(newFractions(P(2, 3, 9), { level: 6 }), d, { type: 'foldNext' });
    expect(boardText(s.board)).toBe('⅓x = 3');
    s = go(s, stuck, stuck);
    expect(s.model).toMatchObject({ want: 3, p: 1, given: 3 });
    // (Levels 1 and 3 draw the original problem, as built)
    let t = go(newFractions(P(2, 3, 9), { level: 3 }), d, { type: 'foldNext' }, stuck);
    expect(t.model).toMatchObject({ want: 3, p: 2, given: 6 });
  });
  it('after a wrong value and Undo: the model on Levels 1 and 3, the reminder on the others (the model on the next I’m stuck)', () => {
    let s = go(toEnd(go(newFractions(P(1, 3, 12), { level: 1 }), value(4))), { type: 'undo' });
    expect(s.model?.step).toBe('cut');
    let t = toEnd(go(newFractions(P(2, 3, 9, { form: 'over' }), { level: 6 }), value(6)));
    t = go(t, { type: 'undo' });
    expect(t.model).toBeNull();
    expect(t.spot?.kind).toBe('hint');
    expect(t.feedback.key).toBe('xOverHint');
    t = go(t, { type: 'spotDismiss' }, stuck);
    expect(t.model?.step).toBe('cut');
  });
});

describe('Part 2: a negative fraction asks for −1 first, then the box', () => {
  const neg = () => newFractions(P(2, 3, 9, { neg: true }), { level: 4 });          // −⅔x = −6
  it('the first I’m stuck says “Multiply both sides by −1 first.” and lights Flip everything', () => {
    const s = go(neg(), stuck);
    expect(boardText(s.board)).toBe('−⅔x = −6');
    expect(said(s)).toBe('Multiply both sides by −1 first.');
    expect(s.ui?.preview).toBe('flip');
  });
  it('the model asked for before the flip is not drawn: it says so, Flip lit, recorded as a reminder', () => {
    const s = go(neg(), stuck, stuck);
    expect(s.model).toBeNull();
    expect(said(s)).toBe('Multiply both sides by −1 first, then I can draw the box.');
    expect(s.supportsShown).toEqual(['hint']);
  });
  it('after the flip the model draws from the current equation; either order stays helpful', () => {
    let s = go(neg(), stuck, { type: 'flipPick' }, { type: 'go' });
    expect(s.needUndo).toBe(false);
    expect(boardText(s.board)).toBe('⅔x = 6');
    s = go(s, { type: 'foldNext' }, stuck);
    expect(s.feedback.key).toBe('xOverHint');
    s = go(s, stuck);
    expect(s.model).toMatchObject({ want: 3, p: 2, given: 6, part: 3 });
    const m = go(neg(), [{ type: 'multOpen' }, { type: 'multPick', kind: 'whole' }, ...keys(3), { type: 'go' }]);
    expect(m.needUndo).toBe(false);
  });
  it('a negative on the right only keeps Build AA’s model: parts worth negative amounts', () => {
    const s = go(newFractions(P(2, 3, -9), { level: 4 }), stuck, stuck);
    expect(s.model).toMatchObject({ want: 3, given: -6, part: -3 });
  });
  it('a wrong value on a negative fraction: the hint after Undo is −1 first', () => {
    const s = go(toEnd(go(neg(), value(6))), { type: 'undo' });
    expect(s.model).toBeNull();
    expect(said(s)).toBe('Multiply both sides by −1 first.');
  });
});

import { modelAutoDue, markModelShown, FX_MODEL_KEY } from '../src/fxModelStore.js';

const memStore = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), m }; };
const refusing = { getItem: () => { throw new Error('SecurityError'); }, setItem: () => { throw new Error('SecurityError'); } };

describe('Part 5: the model draws itself once per device', () => {
  it('the first time on Level 1, and on Level 3, then never again', () => {
    const store = memStore();
    expect(modelAutoDue(1, { store, force: false })).toBe(true);
    markModelShown(1, { store });
    expect(modelAutoDue(1, { store, force: false })).toBe(false);
    expect(modelAutoDue(3, { store, force: false })).toBe(true);           // (Level 3 is its own first time)
    markModelShown(3, { store });
    expect(modelAutoDue(3, { store, force: false })).toBe(false);
    expect(JSON.parse(store.m.get(FX_MODEL_KEY))).toEqual([1, 3]);
  });
  it('storage refused, or missing: drawn each time, and nothing breaks', () => {
    expect(modelAutoDue(1, { store: refusing, force: false })).toBe(true);
    expect(() => markModelShown(1, { store: refusing })).not.toThrow();
    expect(modelAutoDue(1, { store: refusing, force: false })).toBe(true);
    expect(modelAutoDue(1, { store: null, force: false })).toBe(true);
    const junk = memStore(); junk.setItem(FX_MODEL_KEY, '{not json');
    expect(modelAutoDue(1, { store: junk, force: false })).toBe(true);
  });
  it('?model=auto draws it again for testers', () => {
    const store = memStore();
    markModelShown(1, { store });
    expect(modelAutoDue(1, { store, force: true })).toBe(true);
  });
});
