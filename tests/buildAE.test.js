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

// ---------- Parts 1-5: the no-help choice ----------
import { newProgress, completeLevel, placeLevels, levelState, isLevelUnlocked } from '../src/engine/progress.js';
import { PACKS, SECTIONS, packById } from '../src/packs/index.js';
import { canTryOpen, canTestOut, chooserDue, passCredit, TEST_OUT_SECTIONS, ALL_TAUGHT, attemptRecords, FAIL_WORD } from '../src/engine/testOut.js';
import { levelStarted, markStarted, STARTED_KEY } from '../src/startedStore.js';
import { fractionsPlay } from '../src/play/solveCards.js';
import { FX_MODEL_KEY } from '../src/fxModelStore.js';
import { generateFractionsLevel as genFx } from '../src/engine/generateFractions.js';

const fresh = () => newProgress(PACKS);
const memory = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), map: m }; };
const due = (o) => chooserDue({ progress: fresh(), sections: SECTIONS, started: false, choose: null, fixedSeed: null, ...o });

describe('Part 1: when the chooser appears', () => {
  it('on a fresh open, displayed level of every Solve it and Solve it Plus card, from Level 1 on; never on Count it or Build it', () => {
    const p = fresh();
    for (const sec of SECTIONS) {
      for (const id of sec.packs) {
        const pack = packById(id);
        const first = pack.firstLevel ?? 1;
        const want = TEST_OUT_SECTIONS.includes(sec.id) && !pack.comingSoon && !pack.hidden && first !== pack.whyLevel;
        expect(canTryOpen(p, pack, first, SECTIONS), `${id} L${first}`).toBe(want);
        expect(due({ pack, level: first }), `${id} L${first}`).toBe(want);
        // a locked level is the other door
        if (pack.levels > first) expect(canTryOpen(p, pack, first + 1, SECTIONS)).toBe(false);
      }
    }
  });
  it('the numeric levels (Divide it’s and Add to both sides’ saved Level 1) are not displayed levels: no chooser', () => {
    expect(canTryOpen(fresh(), packById('divide-it'), 1, SECTIONS)).toBe(false);
    expect(canTryOpen(fresh(), packById('add-both'), 1, SECTIONS)).toBe(false);
    expect(canTryOpen(fresh(), packById('add-both'), 2, SECTIONS)).toBe(true);
  });
  it('not on a level in progress, placed or earned; not with a seed or choose=0; choose=1 brings it back on a test link', () => {
    const pack = packById('two-step-equations');
    expect(due({ pack, level: 1 })).toBe(true);
    expect(due({ pack, level: 1, started: true })).toBe(false);                            // in progress: it resumes
    expect(due({ pack, level: 1, progress: placeLevels(fresh(), pack.id, 2) })).toBe(false);   // placed
    expect(due({ pack, level: 1, progress: completeLevel(fresh(), pack.id, 1) })).toBe(false); // earned
    expect(due({ pack, level: 1, fixedSeed: 7 })).toBe(false);                             // a test link
    expect(due({ pack, level: 1, choose: '0' })).toBe(false);
    expect(due({ pack, level: 1, choose: '1', fixedSeed: 7 })).toBe(true);                // testers: on a test link too
    expect(due({ pack, level: 1, choose: '1', fixedSeed: 7, started: true })).toBe(false); // (still not on a level in progress)
    expect(due({ pack, level: 2, choose: '1' })).toBe(false);                              // locked: the other door
    expect(due({ pack: packById('combineit'), level: 1, choose: '1' })).toBe(false);       // Count it
    expect(due({ pack: packById('distribute-combine'), level: 1, choose: '1' })).toBe(false); // Build it
  });
  it('a level started with help is remembered on this device only (its own key), and storage refused never breaks it', () => {
    const store = memory();
    expect(levelStarted('two-step-equations', 3, { store })).toBe(false);
    markStarted('two-step-equations', 3, { store });
    markStarted('two-step-equations', 3, { store });
    expect(levelStarted('two-step-equations', 3, { store })).toBe(true);
    expect(levelStarted('two-step-equations', 2, { store })).toBe(false);
    expect(JSON.parse(store.map.get(STARTED_KEY))).toEqual({ 'two-step-equations': [3] });
    const refused = { getItem: () => { throw new Error('no'); }, setItem: () => { throw new Error('no'); } };
    expect(() => markStarted('x', 1, { store: refused })).not.toThrow();
    expect(levelStarted('x', 1, { store: refused })).toBe(false);
    expect(levelStarted('x', 1, { store: null })).toBe(false);
  });
});

describe('Part 2: a pass on an open level', () => {
  it('places the level and every displayed level below it (silver), opens the next, and one problem earns gold later; nothing lowered', () => {
    const id = 'two-step-equations';
    let p = completeLevel(fresh(), id, 1);                    // Level 1 earned, Level 2 open
    expect(canTryOpen(p, packById(id), 2, SECTIONS)).toBe(true);
    p = passCredit(p, id, 2);
    expect(levelState(p, id, 1)).toBe('earned');              // never lowered
    expect(levelState(p, id, 2)).toBe('placed');
    expect(isLevelUnlocked(p, id, 3)).toBe(true);
    expect(canTryOpen(p, packById(id), 2, SECTIONS)).toBe(false);   // a placed level opens as today
    expect(canTestOut(p, packById(id), 3, SECTIONS)).toBe(false);   // (open now: not a locked door)
    expect(canTryOpen(p, packById(id), 3, SECTIONS)).toBe(true);
  });
  it('Fractions of x: an attempt draws no model and never sets the once-per-device memory', () => {
    const store = memory();
    const old = globalThis.localStorage;
    globalThis.localStorage = store;
    try {
      for (const level of [1, 3]) {
        const problems = genFx(level, 5).slice(0, 2).map((q) => ({ ...q, logLevel: level }));
        for (const q of problems) {
          const s = fractionsPlay.newSession(q, { flags: ALL_TAUGHT(), forceMove: false });
          expect(s.model, `L${level}`).toBe(null);
        }
      }
      expect(store.map.has(FX_MODEL_KEY)).toBe(false);
      // (the level with help still draws it, and remembers: Build AC unchanged)
      const s = fractionsPlay.newSession({ ...genFx(1, 5)[0], logLevel: 1 }, { flags: {} });
      expect(s.model?.auto).toBe(true);
      expect(JSON.parse(store.map.get(FX_MODEL_KEY))).toEqual([1]);
    } finally { globalThis.localStorage = old; }
  });
});

describe('Part 5: the class-sheet rows of a no-help attempt that missed', () => {
  it('every row of the attempt carries test-out-fail (no new words), the problem with the miss included', () => {
    const q = { ...genFx(3, 5)[0], logLevel: 3 };
    const s = fractionsPlay.newSession(q, { flags: ALL_TAUGHT() });
    const rows = attemptRecords([{ session: s, meta: { t: 1, pack: 'fractions-of-x', level: 3, problem: 'p' } }], FAIL_WORD);
    expect(rows[0].supports.filter((w) => w.startsWith('test-out'))).toEqual(['test-out-fail']);
  });
});
