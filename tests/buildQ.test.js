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

describe('Build Q, Part 1: the two symbols (redrawn in Build W)', () => {
  it('Flip everything and Trade places: ×(−1) and two curved arrows making a circle, with no minus, plus or equals sign', async () => {
    m = await mat(flipPlay, flipPlay.newSession(problem('flip-everything', 3), {}));
    const names = [...m.root.querySelectorAll('.lx-panel .lx-glyph')].map((e) => e.getAttribute('aria-label'));
    expect(names).toEqual(['Plus sign', 'Times sign', 'Division sign', 'Times negative one', 'Two curved arrows making a circle']);
    const [flip, trade] = [...m.root.querySelectorAll('.lx-panel .lx-glyph')].slice(3);
    expect(flip.textContent).toBe('(−1)');                                   // (a drawn ×, then (−1))
    expect(trade.querySelectorAll('path').length).toBe(4);                   // two arcs, two arrowheads: nothing else
    expect(trade.textContent).toBe('');
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
  it('whole number, one over a blank, fraction, in that order, with no floating symbol (Build W)', async () => {
    expect(MULT_KINDS).toEqual(['whole', 'unit', 'frac']);
    m = await mat(divideMovesPlay, divideMovesPlay.newSession(problem('divide-it', 3), {}));
    await m.run({ type: 'multOpen' });
    expect([...m.root.querySelectorAll('.mo-flyout .mo-opt')].map((e) => e.dataset.kind)).toEqual(['whole', 'unit', 'frac']);
    expect(m.root.querySelectorAll('.mo-flyout svg, .mo-flyout .lx-symbol, .mo-flyout .lx-glyph').length).toBe(0);
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

describe('Build Q, Part 5: Flip’s cross-off can be skipped', () => {
  it('finishFlips settles a flip still playing and the row it makes, and nothing else', async () => {
    const { finishFlips } = await import('../src/view/keepRows.js');
    const root = document.createElement('div');
    root.innerHTML = '<div class="lb-rowwrap is-settled">a</div><div class="lb-rowwrap has-work is-flipwork">b</div><div class="lb-rowwrap">c</div>';
    finishFlips(root);
    expect([...root.children].map((r) => r.classList.contains('is-settled'))).toEqual([true, true, true]);
    root.innerHTML = '<div class="lb-rowwrap has-work">b</div><div class="lb-rowwrap">c</div>';
    finishFlips(root);
    expect([...root.children].map((r) => r.classList.contains('is-settled'))).toEqual([false, false]);
  });
});

describe('Build Q, Part 6: the wrong cancel, any sign (Karl’s rule)', async () => {
  const { bothSidesPlay: BP } = await import('../src/play/solveCards.js');
  const { shapeOf } = await import('../src/engine/solveit/shape.js');
  let k = 0;
  const x = (coef = 1) => ({ id: `q${k++}`, kind: 'x', coef });
  const n = (v) => ({ id: `q${k++}`, kind: 'num', v });
  const digits = (v) => [...String(Math.abs(v))].map((d) => digit(Number(d))).concat(v < 0 ? [{ type: 'toggleSign' }] : []);
  const addX = (c) => [{ type: 'choose', move: 'add' }, { type: 'addPick', kind: 'x' }, ...digits(c), { type: 'go' }];
  const start = (left, right) => { const s = BP.newSession({ ...packById('variables-both-sides').generate(1, 21)[0], logLevel: 1 }, {}); return { ...s, board: { left, right }, base: { left, right }, rows: [{ type: 'eq', board: { left, right } }], prevBoard: { left, right } }; };
  it('2x = 3x + 6 + −2x (x-term left positive) and 5x = 3x + 10 + −5x (negative): both flagged, tagged zeroed-side', () => {
    for (const [l, r, add] of [[[x(2)], [x(3), n(6)], -2], [[x(5)], [x(3), n(10)], -5], [[x(3), n(4)], [x(2)], -2]]) {
      const s = play(BP, start(l, r), ...addX(add));
      expect([s.feedback.key, s.needUndo, s.tags.includes('zeroed-side')]).toEqual(['vZeroSide', true, true]);
    }
  });
  it('the hint after Undo cancels the x-term beside the number, never the move undone: 2x = 3x + 6 → Add −3x → 2x + −3x = 6', () => {
    let s = play(BP, start([x(2)], [x(3), n(6)]), ...addX(-2), { type: 'undo' });
    expect([s.menu, s.addKind, s.amountEntry, s.feedback.key]).toEqual(['add', 'x', '-3', 'vZeroHint']);
    s = play(BP, s, { type: 'go' });
    expect([boardText(s.board), s.needUndo]).toEqual(['2x + −3x = 6', false]);
    // the number on the left this time (3x + 4 = 2x, Add −2x empties the right): the x-term beside the 4 is the 3x
    let t = play(BP, start([x(3), n(4)], [x(2)]), ...addX(-2), { type: 'undo' });
    expect(t.amountEntry).toBe('-3');
  });
  it('the reminder (V1) outlines the x-term beside the number when the other side is a lone x-term, on every Level 1 problem', () => {
    for (let seed = 1; seed <= 30; seed++) {
      for (const p of packById('variables-both-sides').generate(1, seed)) {
        const s = BP.newSession({ ...p, logLevel: 1 }, {});
        const shape = shapeOf(s);
        expect(shape.id).toBe('V1');
        const lone = ['left', 'right'].find((side) => s.board[side].length === 1);
        if (!lone) continue;
        const other = lone === 'left' ? 'right' : 'left';
        expect(s.board[other].find((t) => t.kind === 'x').id).toBe(shape.params.small);
      }
    }
  });
});
