// @vitest-environment happy-dom
// Build Q (2026-10-25): panel polish. The two redrawn symbols, the lighter hint before dividing (a dot, the Divide preview, nothing boxed;
// I'm stuck's first rung on Divide it), and the Multiply menu's three options (the middle one, one over a blank, stored as the fraction).

import { describe, it, expect, afterEach } from 'vitest';
import { twoStepPlay, divideMovesPlay, flipPlay, distSolvePlay } from '../src/play/solveCards.js';
import { boardText } from '../src/engine/solveTerms.js';
import { makeRecord } from '../src/engine/eventlog.js';
import { packById } from '../src/packs/index.js';
import { MULT_KINDS } from '../src/engine/multiplyMenu.js';

const problem = (pack, level, i = 0, seed = 7) => ({ ...packById(pack).generate(level, seed)[i], logLevel: level });
const settle = () => new Promise((r) => setTimeout(r, 0));
const digit = (d) => ({ type: 'digit', digit: d });
const play = (p, s, ...actions) => actions.reduce(p.reduce, s);

// the Mat, as the app draws it (the same as Build O's test)
async function mat(p, s) {
  document.body.replaceChildren();
  const root = document.createElement('div');
  const pad = document.createElement('div');
  document.body.append(root, pad);
  const m = { s, root };
  const controls = p.buildControls(pad, (a) => m.dispatch(a));
  m.dispatch = (a) => {
    const n = p.reduce(m.s, a);
    if (n === m.s) return;
    m.s = n;
    controls.update(m.s);
    root.replaceChildren(p.renderMat(m.s, {}));
  };
  m.off = p.bindMat(root, m.dispatch, () => m.s);
  controls.update(m.s);
  root.replaceChildren(p.renderMat(m.s, {}));
  m.run = async (...actions) => { for (const a of actions) m.dispatch(a); await settle(); };
  m.q = (sel) => root.querySelector(sel);
  await settle();
  return m;
}
let m = null;
afterEach(() => { m?.off?.(); m = null; document.body.replaceChildren(); });

const clean = (s) => JSON.stringify({ rows: s.rows.map(({ shown, ...r }) => r), board: s.board, lights: s.lights, history: s.history.length }).replace(/"id":"[^"]*"/g, '');
const solveTo = (p, s, v) => [{ type: 'foldNext' }, ...String(Math.abs(v)).split('').map((d) => digit(Number(d))), ...(v < 0 ? [{ type: 'toggleSign' }] : []), { type: 'check' }, { type: 'placeValue' },
  { type: 'nextLine' }, { type: 'nextLine' }, { type: 'nextLine' }, { type: 'nextLine' }].reduce(p.reduce, s);

describe('Build Q, Part 1: the two symbols', () => {
  it('Flip everything and Trade places have their new drawings and names', async () => {
    m = await mat(flipPlay, flipPlay.newSession(problem('flip-everything', 3), {}));
    const names = [...m.root.querySelectorAll('.lx-panel .lx-symbol')].map((e) => e.getAttribute('aria-label'));
    expect(names).toEqual(['Plus sign', 'Times sign', 'Division sign', 'Cycle between minus and plus', 'Equals sign with two circling arrows']);
    const flip = m.root.querySelectorAll('.lx-panel .lx-symbol')[3];
    expect(flip.querySelectorAll('path').length).toBe(6);                    // two arcs, two arrowheads, a minus, a plus
  });
});

describe('Build Q, Part 3: the hint before dividing', () => {
  it('Divide it: I’m stuck’s first click shows 5 · x, the Divide button lit and previewed, nothing boxed; recorded as hint', async () => {
    m = await mat(divideMovesPlay, divideMovesPlay.newSession(problem('divide-it', 3), {}));
    await m.run({ type: 'stuck' });
    expect([m.s.feedback.key, m.s.supportsShown, m.s.ui.preview]).toEqual(['dReminder', ['hint'], 'div']);
    expect(m.q('.lb-coef').textContent).toBe('5·x');
    expect(m.q('.lb-hintbox')).toBeNull();
    expect(m.q('.lx-ghost .lx-ghosteq.is-division')).not.toBeNull();
    expect(m.q('.spot-layer.is-hint[data-spot="coef"]')).not.toBeNull();
    await m.run({ type: 'stuck' });
    expect([m.s.feedback.key, m.s.scaffold, m.s.supportsShown]).toEqual(['dModel', true, ['hint', 'model']]);
  });
  it('the same dot after a wrong value and Undo; it goes with the next move', async () => {
    let s = play(divideMovesPlay, divideMovesPlay.newSession(problem('divide-it', 3), {}), digit(1), digit(5), { type: 'toggleSign' }, { type: 'check' }, { type: 'placeValue' },
      { type: 'nextLine' }, { type: 'nextLine' }, { type: 'nextLine' }, { type: 'undo' });
    m = await mat(divideMovesPlay, s);
    expect(m.q('.lb-coef').textContent).toBe('5·x');
    await m.run({ type: 'divPick' }, digit(5), { type: 'go' });
    expect(m.q('.lb-coefdot')).toBeNull();
  });
  it('Two-step at 2x = 12: the reminder writes 2 · x in the row (no box)', async () => {
    const s0 = twoStepPlay.newSession(problem('two-step-equations', 1), {});
    m = await mat(twoStepPlay, s0);
    s0.hint = null;
    const s = { ...m.s, hint: { kind: 'coef' } };
    m.root.replaceChildren(twoStepPlay.renderMat(s, {}));
    const x = [...m.root.querySelectorAll('.lx-live .lx-tok .lb-x')].map((e) => e.textContent);
    expect(x.some((t) => /^\d·x$/.test(t))).toBe(true);
  });
});

describe('Build Q, Part 4: the Multiply menu has three options', () => {
  it('whole number, one over a blank, fraction, in that order, each with a floating symbol', async () => {
    expect(MULT_KINDS).toEqual(['whole', 'unit', 'frac']);
    m = await mat(divideMovesPlay, divideMovesPlay.newSession(problem('divide-it', 3), {}));
    await m.run({ type: 'multOpen' });
    expect([...m.root.querySelectorAll('.mo-flyout .mo-opt')].map((e) => e.dataset.kind)).toEqual(['whole', 'unit', 'frac']);
    expect([...m.root.querySelectorAll('.mo-flyout .lx-symbol')].map((e) => e.getAttribute('aria-label'))).toEqual(['Times sign', 'Division sign', 'Fraction']);
  });
  it('one over a blank: 5, Go writes ⅕(5x) = ⅕(−15) with "Dividing by 5 is multiplying by ⅕."; stored exactly as the fraction option', async () => {
    m = await mat(divideMovesPlay, divideMovesPlay.newSession(problem('divide-it', 3), {}));
    await m.run({ type: 'multOpen' }, { type: 'multPick', kind: 'unit' });
    expect(m.root.querySelectorAll('.lx-ghost .mo-unitblank').length).toBe(2);
    await m.run({ type: 'typeChar', ch: '/' }, digit(5));                    // (a slash means nothing here: the 1/ is printed)
    expect(m.s.mopts).toEqual({ kind: 'unit', entry: '5' });
    expect(m.q('.lx-ghost .mo-sameas').textContent).toBe('Dividing by 5 is multiplying by ⅕.');
    await m.run(digit(5));
    expect([m.s.mopts.entry, m.s.feedback.key]).toEqual(['5', 'dDivOneDigit']);
    await m.run({ type: 'go' });
    expect(boardText(m.s.board)).toBe('x = ⅕(−15)');
    const rows = [...m.root.querySelectorAll('.lb-stack .lb-rowwrap')].map((r) => r.textContent.replace(/\s+/g, ''));
    expect(rows.slice(1)).toEqual(['⅕(5x)=⅕(−15)Dividingby5ismultiplyingby⅕.', 'x=⅕(−15)']);
    const byFrac = play(divideMovesPlay, divideMovesPlay.newSession(problem('divide-it', 3), {}), { type: 'multOpen' }, { type: 'multPick', kind: 'frac' }, digit(1), digit(5), { type: 'go' });
    expect(clean(m.s)).toBe(clean(byFrac));
    const rec = (s) => makeRecord(solveTo(divideMovesPlay, s, -3), { t: 0, pack: 'divide-it', level: 3, problem: '5x = −15' });
    expect(rec(m.s)).toEqual(rec(byFrac));
    expect(m.s.divIds ?? []).toEqual([]);                                    // (fraction words, not division words)
  });
  it('a negative: −3 is −⅓ on Flip everything (Level 4); −1 is Flip everything', () => {
    const s0 = flipPlay.newSession(problem('flip-everything', 4), {});
    const a = Math.abs(s0.board.left.find((t) => t.kind === 'x')?.coef ?? s0.board.right.find((t) => t.kind === 'x').coef);
    const s = play(flipPlay, s0, { type: 'multOpen' }, { type: 'multPick', kind: 'unit' }, { type: 'toggleSign' }, digit(a), { type: 'go' });
    const byFrac = play(flipPlay, s0, { type: 'multOpen' }, { type: 'multPick', kind: 'frac' }, { type: 'toggleSign' }, digit(1), digit(a), { type: 'go' });
    expect(clean(s)).toBe(clean(byFrac));
    const byUnit = play(flipPlay, s0, { type: 'multOpen' }, { type: 'multPick', kind: 'unit' }, { type: 'toggleSign' }, digit(1), { type: 'go' });
    const byFlip = play(flipPlay, s0, { type: 'flipPick' }, { type: 'go' });
    expect(clean(byUnit)).toBe(clean(byFlip));
  });
  it('live wherever the Divide button is, with the same words where it is greyed', async () => {
    m = await mat(twoStepPlay, twoStepPlay.newSession(problem('two-step-equations', 1), {}));
    await m.run({ type: 'multOpen' });
    expect(m.q('.mo-opt[data-kind="unit"]').classList.contains('is-grey')).toBe(true);
    await m.run({ type: 'multPick', kind: 'unit' });
    expect(m.s.feedback.key).toBe('wOneTerm');
    m.off(); m = await mat(distSolvePlay, distSolvePlay.newSession(problem('distribute-solve', 1), {}));
    await m.run({ type: 'multOpen' });
    expect(m.q('.mo-opt[data-kind="unit"]').classList.contains('is-grey')).toBe(false);
  });
  it('Divide it: the / in the whole-number blank still opens the fraction, keeping the digit as its top; −1 typed there is still Flip’s move (explained here)', () => {
    const s0 = divideMovesPlay.newSession(problem('divide-it', 3), {});
    const s = play(divideMovesPlay, s0, { type: 'multOpen' }, { type: 'multPick', kind: 'whole' }, digit(1), { type: 'typeChar', ch: '/' });
    expect([s.menu, s.fb.num, s.fb.part]).toEqual(['fraction', '1', 'den']);
    const w = play(divideMovesPlay, s0, { type: 'multOpen' }, { type: 'multPick', kind: 'whole' }, { type: 'toggleSign' }, digit(1), { type: 'go' });
    expect(w.feedback.key).toBe('dFlipNo');
  });
});
