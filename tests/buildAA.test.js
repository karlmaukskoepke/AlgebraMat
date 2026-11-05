import { describe, it, expect } from 'vitest';
import { makeFracX, formatFracX, tagFracX, slipValuesOf } from '../src/engine/fractionsX.js';
import { generateFractionsLevel, worstCaseRows, slipCollisions, stackRowsFor } from '../src/engine/generateFractions.js';
import { newFractions, reduceFractions, FRAC_SPOT, startBoard } from '../src/engine/cards/fractions.js';
import { fractionsLines } from '../src/engine/fractionsCheck.js';
import { withSpotlight } from '../src/engine/spotlight.js';
import { boardText, lineText } from '../src/engine/solveTerms.js';
import { shapeOf, shapeOfBoard, UNKNOWN } from '../src/engine/solveit/shape.js';
import { REGISTRY } from '../src/engine/solveit/registry.js';
import { fractionsFeedbackText } from '../src/view/fractionsFeedback.js';
import { PACKS, SECTIONS, packById, fractionsOfX } from '../src/packs/index.js';
import { newProgress, encodeProgress, decodeProgress, CODE_VERSION, completeLevel, withLegacyCredit, levelState, isLevelUnlocked, normalizeProgress } from '../src/engine/progress.js';
import { PROBES, diagnosticItems, readout, applyReadout, upgradePlacement } from '../src/engine/diagnostic.js';

// Build AA: Fractions of x, a configuration of the shared loop.
const r = withSpotlight(reduceFractions, FRAC_SPOT);
const go = (s, ...a) => a.flat().reduce(r, s);
const keys = (t) => [...String(t)].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'typeChar', ch }));
const mult = (m) => [{ type: 'multOpen' }, { type: 'multPick', kind: 'whole' }, ...keys(m), { type: 'go' }];
const divide = (n) => [{ type: 'divPick' }, ...keys(n), { type: 'go' }];
const value = (v) => [...keys(v), { type: 'check' }, { type: 'placeValue' }];
const said = (s) => fractionsFeedbackText(s.feedback);
const rows = (s) => s.rows.map((row) => boardText(row.board));
const P = (p, q, x, o = {}) => makeFracX({ p, q, x, ...o });
const SEEDS = 200;

describe('the generator: six levels, 200 seeds each', () => {
  for (let level = 1; level <= 6; level++) {
    it(`Level ${level}: verified by substitution, whole answers and parts, never 0 or ±1, at most 36, no repeats`, () => {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const set = generateFractionsLevel(level, seed);
        expect(set).toHaveLength(5);
        expect(new Set(set.map((p) => p.x)).size).toBe(5);
        expect(new Set(set.map(formatFracX)).size).toBe(5);
        for (const p of set) {
          expect([0, 1, -1]).not.toContain(p.x);                                       // a banned answer fails the test
          expect(Math.abs(p.x)).toBeLessThanOrEqual(36);
          expect(p.q).toBeLessThanOrEqual(6);                                           // at most 6 parts in the box
          expect(p.p).toBeLessThan(p.q);
          expect(Math.abs(p.b % p.p)).toBe(0);                                                     // one part is whole
          expect(fractionsLines(startBoard(p), p.x).ok).toBe(true);
          expect((p.neg ? -p.p : p.p) * p.x).toBe(p.q * p.b);
        }
        if (level === 1) expect(set.every((p) => p.p === 1 && p.form === 'times' && !p.neg && !p.mirror && p.b > 0)).toBe(true);
        if (level === 2) { expect(set.every((p) => p.p === 1 && !p.neg)).toBe(true); expect(set.filter((p) => p.form === 'over').length).toBeGreaterThanOrEqual(2); expect(set[0].form).toBe('times'); }
        if (level === 3) expect(set.every((p) => p.p >= 2 && p.form === 'times' && !p.neg && p.b > 0)).toBe(true);
        if (level === 4) { expect(set.some((p) => p.neg)).toBe(true); expect(set.some((p) => !p.neg && p.b < 0)).toBe(true); expect(set.every((p) => !p.mirror)).toBe(true); }
        if (level === 5) { expect(set.every((p) => p.mirror)).toBe(true); expect(set.some((p) => p.neg)).toBe(true); expect(set.some((p) => p.b < 0)).toBe(true); }
        if (level === 6) { expect(set.some((p) => p.form === 'over' && p.p > 1)).toBe(true); expect(set.some((p) => p.mirror)).toBe(true); expect(set.some((p) => p.neg)).toBe(true); }
      }
    });
  }
  it('reports its worst-case rows and its slip collisions', () => {
    expect([1, 2, 3, 4, 5, 6].map((l) => worstCaseRows(l).total)).toEqual([9, 9, 10, 11, 12, 13]);
    expect(stackRowsFor(P(2, 3, 9))).toEqual({ moves: 4, answer: 2, check: 4, total: 10 });
    for (let l = 1; l <= 6; l++) expect(slipCollisions(l).problems).toBe(1000);
  });
  it('makeFracX refuses a banned answer, a part that is not whole, more than 6 parts', () => {
    expect(() => P(1, 3, 1)).toThrow();
    expect(() => P(1, 3, 0)).toThrow();
    expect(() => P(2, 3, 4)).toThrow();
    expect(() => P(1, 7, 14)).toThrow();
    expect(() => P(2, 4, 8)).toThrow();                                                  // (lowest terms)
  });
});

describe('the problem, its slips and the check (no times sign, every step)', () => {
  it('writes ⅔x = 6 and its forms', () => {
    expect(formatFracX(P(2, 3, 9))).toBe('⅔x = 6');
    expect(formatFracX(P(1, 3, 12, { form: 'over' }))).toBe('x/3 = 4');
    expect(formatFracX(P(2, 3, 9, { form: 'over', mirror: true }))).toBe('6 = 2x/3');
    expect(formatFracX(P(2, 3, -9, { neg: true }))).toBe('−⅔x = 6');
  });
  it('tags the slips: the given number, one part, the top only, the bottom only, divided, the sign', () => {
    const p = P(2, 3, 9);
    expect(tagFracX(p, 6)).toBe('fx-given');
    expect(tagFracX(p, 3)).toBe('fx-part');
    expect(tagFracX(p, 12)).toBe('fx-top');
    expect(tagFracX(p, 18)).toBe('fx-bottom');
    expect(tagFracX(p, 2)).toBe('fx-divided');
    expect(tagFracX(p, -9)).toBe('fx-sign');
    expect(tagFracX(p, 9)).toBe(null);
    expect(slipValuesOf(P(1, 3, 12)).map((x) => x.tag)).toEqual(['fx-sign', 'fx-given']);
  });
  it('checks with parentheses for products, every step shown, in the form on the screen', () => {
    const lines = (p, v) => fractionsLines(startBoard(p), v).lines.map(lineText);
    expect(lines(P(2, 3, 9), 9)).toEqual(['⅔(9) = 6', '6 = 6']);
    const over = fractionsLines(startBoard(P(2, 3, 9, { form: 'over' })), 9).lines;
    expect(over).toHaveLength(3);                                                        // 2(9)/3 = 6, 18/3 = 6, 6 = 6
    expect(over[0].segs[0].stack.top.map((x) => x.text).join('')).toBe('2(9)');
    expect(over[1].segs[0].stack.top.map((x) => x.text).join('')).toBe('18');
    expect(lineText(over[2])).toBe('6 = 6');
    expect(lines(P(1, 3, 12, { form: 'over' }), 12).at(-1)).toBe('4 = 4');
    expect(lines(P(2, 3, 9), 10)).toEqual(['⅔(10) = 6', '20/3 = 6']);                   // a wrong value: a fraction, exactly
    expect(fractionsLines(startBoard(P(2, 3, 9)), 10).ok).toBe(false);
    for (const l of [...lines(P(2, 3, 9), 9), ...lines(P(2, 3, -9, { neg: true }), -9)]) expect(l).not.toMatch(/×/);
  });
});

describe('the moves', () => {
  it('x/3 = 4: multiplying by 3 cancels the divide (the two 3s crossed off) and writes x = 3(4); the student types 12', () => {
    let s = go(newFractions(P(1, 3, 12, { form: 'over' }), { level: 2 }), mult(3));
    expect(rows(s)).toEqual(['x/3 = 4', '3(x/3) = 3(4)', 'x = 3(4)']);
    expect(s.rows[1].board.left[0].kind).toBe('times');
    s = go(s, value(12), { type: 'nextLine' }, { type: 'nextLine' });
    expect(s.stage).toBe('done');
    expect(s.clean).toBe(true);
  });
  it('⅔x = 6: multiply by 3 then divide by 2, or divide by 2 then multiply by 3: both helpful, never red', () => {
    let a = go(newFractions(P(2, 3, 9), { level: 3 }), mult(3));
    expect(rows(a).at(-1)).toBe('2x = 18');
    expect(a.needUndo).toBe(false);
    a = go(a, { type: 'foldNext' }, divide(2));
    expect(rows(a).at(-1)).toBe('x = ½(18)');
    let b = go(newFractions(P(2, 3, 9), { level: 3 }), divide(2));
    expect(rows(b).at(-1)).toBe('⅓x = 3');                                              // the bridge to the model: one part is 3
    expect(b.needUndo).toBe(false);
    b = go(b, { type: 'foldNext' }, mult(3));
    expect(rows(b).at(-1)).toBe('x = 3(3)');
  });
  it('a multiply that does not cancel the bottom is legal, not helpful: the spotlight, then Undo and the reminder', () => {
    let s = go(newFractions(P(2, 3, 9), { level: 3 }), mult(2));
    expect(s.needUndo).toBe(true);
    expect(rows(s).at(-1)).toBe('4/3x = 12');
    expect(said(s)).toBe('Multiplying ⅔x by 2 makes 4/3x: x is still cut into parts. Press Undo.');
    s = go(s, { type: 'undo' });
    expect(rows(s)).toEqual(['⅔x = 6']);
    expect(s.spot?.kind).toBe('hint');
  });
  it('dividing by a number that does not go into the top makes the bottom bigger (spotlight, Undo); one that does not split the other side fails', () => {
    let s = go(newFractions(P(1, 3, 12, { form: 'over' }), { level: 2 }), divide(3));
    expect(s.feedback.key).toBe('xDivSplit');                                            // 4 ÷ 3 does not split
    s = go(newFractions(P(1, 3, 18, { form: 'over' }), { level: 2 }), divide(2));
    expect(s.needUndo).toBe(true);
    expect(rows(s).at(-1)).toBe('x/6 = 3');
    expect(said(s)).toMatch(/the bottom got bigger/);
  });
  it('Add, one over a blank and the fraction are greyed with the standard message; Flip everything from saved Level 4', () => {
    const s = newFractions(P(2, 3, 9), { level: 3 });
    expect(said(go(s, { type: 'greyMove', move: 'add' }))).toBe('That move unlocks on a later card.');
    expect(said(go(s, { type: 'multOpen' }, { type: 'multPick', kind: 'unit' }))).toBe('That move unlocks on a later card.');
    expect(said(go(s, { type: 'multOpen' }, { type: 'multPick', kind: 'frac' }))).toBe('That move unlocks on a later card.');
    expect(said(go(s, { type: 'greyMove', move: 'flip' }))).toBe('That move unlocks on a later level.');
  });
  it('a negative: −⅔x = 6, flip first (⅔x = −6) or multiply first (−2x = 18); x on the right: Trade places', () => {
    const p = P(2, 3, -9, { neg: true });
    let s = go(newFractions(p, { level: 4 }), { type: 'flipPick' }, { type: 'go' });
    expect(rows(s)).toEqual(['−⅔x = 6', '−1(−⅔x) = −1(6)', '⅔x = −6']);
    expect(s.needUndo).toBe(false);
    s = go(newFractions(p, { level: 4 }), mult(3));
    expect(rows(s).at(-1)).toBe('−2x = 18');
    s = go(newFractions(P(2, 3, 9, { mirror: true }), { level: 5 }), { type: 'choose', move: 'trade' });
    expect(rows(s)).toEqual(['6 = ⅔x', '⅔x = 6']);
  });
});

describe('the rewrite toggle', () => {
  it('a tap writes the other form as its own row ("rewrite"); the stored term is the same term (coef and den), only its form changes', () => {
    const s0 = newFractions(P(2, 3, 9), { level: 3 });
    let s = go(s0, { type: 'rewrite' });
    expect(rows(s)).toEqual(['⅔x = 6', '2x/3 = 6']);
    expect(s.rows[1]).toMatchObject({ type: 'fold', label: { rewrite: true } });
    const [a, b] = [s0.board.left[0], s.board.left[0]];
    expect([a.kind, a.coef, a.den, a.form]).toEqual(['x', 2, 3, 'times']);
    expect([b.kind, b.coef, b.den, b.form]).toEqual(['x', 2, 3, 'over']);
    s = go(s, { type: 'rewrite' });
    expect(rows(s).at(-1)).toBe('⅔x = 6');
    s = go(s, { type: 'undo' });
    expect(rows(s)).toEqual(['⅔x = 6', '2x/3 = 6']);
  });
  it('works with x on the right, and the hover shows a ghost (view state only)', () => {
    let s = go(newFractions(P(1, 4, 8, { mirror: true }), { level: 5 }), { type: 'ui', patch: { rewrite: true } });
    expect(s.ui.rewrite).toBe(true);
    s = go(s, { type: 'rewrite' });
    expect(rows(s)).toEqual(['2 = ¼x', '2 = x/4']);
  });
  it('Level 2 opens with the one-time instruction, in the form on the screen', () => {
    const s = newFractions(P(1, 3, 12), { level: 2, introRewrite: true });
    expect(said(s)).toBe('Tap the fraction to rewrite ⅓x as x/3. To cancel the divide by 3, multiply both sides by 3.');
  });
});

describe('the model: a box cut into equal parts', () => {
  const p = P(2, 3, 9);
  it('is drawn on its own on the first problem of Levels 1 and 3; its five steps; the "one part" row from the typed amount', () => {
    let s = newFractions(p, { level: 3, autoModel: true });
    expect(s.model.step).toBe('cut');
    s = go(s, { type: 'mCut', q: 4 });
    expect(said(s)).toBe('The fraction’s bottom is 3: cut the box into 3 equal parts.');
    s = go(s, { type: 'mCut', q: 3 }, { type: 'mPart', i: 1 }, { type: 'mGo' });
    expect(said(s)).toBe('The fraction says 2 of the 3 parts.');
    s = go(s, { type: 'mPart', i: 2 }, { type: 'mGo' });
    expect(s.model.step).toBe('value');
    s = go(s, keys(6), { type: 'mGo' });
    expect(said(s)).toBe('2 parts make 6. What does 1 part make?');
    s = go(s, keys(3), { type: 'mGo' });
    expect(rows(s)).toEqual(['⅔x = 6', '⅓x = 3']);
    expect(s.rows[1].label).toEqual({ part: true });
    s = go(s, { type: 'mPart', i: 0 });
    expect(s.feedback.key).toBe('mFillSelected');
    s = go(s, { type: 'mPart', i: 2 });
    expect(s.model.step).toBe('x');
    s = go(s, value(9), { type: 'nextLine' }, { type: 'nextLine' });
    expect(s.stage).toBe('done');
  });
  it('a unit fraction has nothing to type: the one part is the given number', () => {
    let s = newFractions(P(1, 3, 12), { level: 1, autoModel: true });
    s = go(s, { type: 'mCut', q: 3 }, { type: 'mPart', i: 0 }, { type: 'mGo' });
    expect(s.model.step).toBe('fill');
    expect(s.rows).toHaveLength(1);
  });
  it('I’m stuck: the model first, then the reminder (in the form on the screen), which repeats', () => {
    let s = go(newFractions(p, { level: 3 }), { type: 'stuck' });
    expect(s.model?.step).toBe('cut');
    expect(s.supportsShown).toContain('model');
    s = go(s, { type: 'stuck' });
    expect(said(s)).toBe('⅔x means ⅔ of x. Multiply both sides by 3 to cancel the bottom 3.');
    // (Build AC: on Levels 2, 4, 5 and 6 the reminder is the first click)
    let o = go(newFractions(P(2, 3, 9, { form: 'over' }), { level: 6 }), { type: 'stuck' });
    expect(said(o)).toBe('2x/3 means 2x divided by 3. Multiply both sides by 3 to cancel the divide by 3.');
    o = go(newFractions(P(1, 3, 12, { form: 'over' }), { level: 2 }), { type: 'stuck' });
    expect(said(o)).toBe('x/3 means x divided by 3. Multiply both sides by 3 to cancel the divide by 3.');
  });
  it('after a wrong value and Undo, the hint is the model', () => {
    let s = go(newFractions(p, { level: 3 }), value(6), { type: 'nextLine' }, { type: 'nextLine' });
    expect(s.feedback.key).toBe('aUndoGuess');
    s = go(s, { type: 'undo' });
    expect(s.model?.step).toBe('cut');
  });
});

describe('shapes: every state the card makes has a shape and a registry entry', () => {
  const ids = new Set();
  const visit = (s) => { const sh = shapeOf(s); expect(sh.id, JSON.stringify(s.board)).not.toBe(UNKNOWN); ids.add(sh.id); expect(REGISTRY[sh.id], sh.id).toBeTruthy(); };
  it('the honest paths of every problem of every level over 50 seeds, both orders and the rewrite', () => {
    for (let level = 1; level <= 6; level++) {
      for (let seed = 1; seed <= 50; seed++) {
        for (const p of generateFractionsLevel(level, seed)) {
          const s0 = newFractions(p, { level });
          let s = s0;
          visit(s);
          if (p.mirror) { s = go(s, { type: 'choose', move: 'trade' }); visit(s); }
          s = go(s, { type: 'rewrite' }); visit(s);
          if (p.neg) { s = go(s, { type: 'flipPick' }, { type: 'go' }); visit(s); }
          if (p.p > 1) { s = go(s, divide(p.p)); visit(s); expect(s.needUndo, formatFracX(p)).toBe(false); s = go(s, { type: 'foldNext' }); }
          s = go(s, mult(p.q)); visit(s); expect(s.needUndo).toBe(false);
          // the other order: multiply first
          let t = go(s0, mult(p.q)); visit(t);
          if (p.p > 1 || p.neg) { t = go(t, { type: 'foldNext' }); if (p.neg) { t = go(t, { type: 'flipPick' }, { type: 'go' }); visit(t); t = go(t, { type: 'foldNext' }); } if (p.p > 1) { t = go(t, divide(p.p)); visit(t); } }
        }
      }
    }
    for (const id of ['FU', 'FUD', 'FP', 'FPD', 'FN', 'FW', 'FWN', 'FM', 'F4', 'F5']) expect(ids.has(id), id).toBe(true);
  });
  it('an unknown board still fails loudly', () => {
    expect(shapeOfBoard({ left: [{ kind: 'x', coef: 1 }], right: [{ kind: 'num', v: 3 }] }, 'fracx').id).toBe(UNKNOWN);
  });
});

describe('the pack, save codes, legacy credit and the placement quiz', () => {
  it('is in Solve it in One-step’s slot; One-step is retired and kept with its saved levels', () => {
    expect(SECTIONS.find((s) => s.id === 'solve').packs).toEqual(['add-both', 'divide-it', 'flip-everything', 'fractions-of-x', 'two-step-equations', 'distribute-solve']);
    expect(packById('one-step').retired).toBe(true);
    expect(fractionsOfX).toMatchObject({ title: 'Fractions of x', subtitle: 'Cut the box, then solve', levels: 6 });
    expect(PACKS.at(-1).id).toBe('fractions-of-x');
  });
  it('codes v21 carry its six levels; every older layout decodes as before', () => {
    expect(CODE_VERSION).toBe(21);
    let p = newProgress(PACKS);
    p = completeLevel(completeLevel(p, 'fractions-of-x', 1), 'fractions-of-x', 6);
    p = completeLevel(p, 'add-both', 3);
    const back = decodeProgress(encodeProgress(p), PACKS);
    expect(back.packs['fractions-of-x'].levels).toEqual([true, false, false, false, false, true]);
    expect(back.packs['add-both'].levels[2]).toBe(true);
    for (let v = 1; v <= 20; v++) {
      const code = encodeProgress(p, v);
      const again = decodeProgress(code, PACKS);
      expect(again, `v${v}`).not.toBe(null);
      expect(again.packs['fractions-of-x'].levels.some(Boolean)).toBe(false);
    }
  });
  it('old One-step Level 4 or 5 places Levels 1 and 2 (silver); nothing credits Levels 3-6; the levels open in order', () => {
    for (const old of [4, 5]) {
      const p = withLegacyCredit(completeLevel(newProgress(PACKS), 'one-step', old));
      expect([1, 2, 3, 4, 5, 6].map((l) => levelState(p, 'fractions-of-x', l))).toEqual(['placed', 'placed', 'none', 'none', 'none', 'none']);
      expect(isLevelUnlocked(p, 'fractions-of-x', 3)).toBe(true);
      expect(isLevelUnlocked(p, 'fractions-of-x', 4)).toBe(false);
    }
    const none = withLegacyCredit(completeLevel(newProgress(PACKS), 'one-step', 3));
    expect(levelState(none, 'fractions-of-x', 1)).toBe('none');
    // a save from before Build X keeps its old credit earned, but this card's credit is new: placed
    const old = normalizeProgress({ packs: { 'one-step': { levels: [false, false, false, true] } } }, PACKS, { legacyEarned: true });
    expect(levelState(old, 'fractions-of-x', 1)).toBe('placed');
  });
  it('the quiz’s One-step slots read the Add card (x − a = b) and this card’s Level 2, in the same slots; no later problem changes', () => {
    expect(PROBES.map((p) => p.pack)).toEqual(['combineit', 'flipit', 'lasso', 'boxes', 'groups-of-terms', 'distribute-combine', 'value', 'one-step', 'two-step', 'add-both', 'divide-it']);
    const items = diagnosticItems(7, 'solve');
    expect(items.slice(0, 2).map((i) => [i.pack, i.level])).toEqual([['add-both', 3], ['fractions-of-x', 2]]);
    expect(items[0].problem.form).toBe('x-a');
    expect(items[1].problem.p).toBe(1);
    const right = items.map((it) => ({ typed: String(it.problem.x), skipped: false }));
    const res = readout(7, right, items, 'solve');
    expect(res.map((x) => x.pack)).toEqual(['add-both', 'fractions-of-x', 'two-step-equations', 'divide-it']);
    const frac = res.find((x) => x.pack === 'fractions-of-x');
    expect(frac.rec).toBe(3);
    const after = applyReadout(newProgress(PACKS), res);
    expect([1, 2, 3].map((l) => levelState(after, 'fractions-of-x', l))).toEqual(['placed', 'placed', 'none']);
    expect(isLevelUnlocked(after, 'fractions-of-x', 3)).toBe(true);
  });
  it('a device with an old saved result lands on the same levels: loading it opens and credits nothing new', () => {
    const items = diagnosticItems(7, 'solve');
    const answers = items.map(() => ({ typed: '5', skipped: false }));
    const p = newProgress(PACKS);
    const up = upgradePlacement(p, readout(7, answers, items, 'solve'));
    expect(up.packs['fractions-of-x']).toEqual(p.packs['fractions-of-x']);
    expect(up.packs['add-both']).toEqual(p.packs['add-both']);
  });
});
