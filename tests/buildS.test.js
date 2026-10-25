// @vitest-environment happy-dom
// Build S (2026-10-24): the redraw that kept nothing, the drag that silently did nothing, and the honest path every problem can be
// solved by. (The real-browser checks are in tests/screenSweep.test.js.)

import { describe, it, expect } from 'vitest';
import { bothSidesPlay, twoStepPlay, distSolvePlay, addBothPlay, divideMovesPlay, flipPlay } from '../src/play/solveCards.js';
import { packById } from '../src/packs/index.js';
import { honestPath } from '../src/engine/solveit/honest.js';
import { redrawMat, liveOf } from '../src/view/keepRows.js';

const problem = (pack, level, seed = 7, i = 0) => ({ ...packById(pack).generate(level, seed)[i], logLevel: level });
const digits = (n) => [...String(Math.abs(n))].map((d) => ({ type: 'digit', digit: Number(d) })).concat(n < 0 ? [{ type: 'toggleSign' }] : []);

describe('Build S, Part 4: a number dragged across works while the move before it still shows its work', () => {
  it('Variables on both sides: 11 = 4x − 1 straight after combining, the −1 dragged to the left is added to both sides', () => {
    const P = bothSidesPlay;
    let s = P.newSession(problem('variables-both-sides', 3), {});                       // 4x + 11 = 8x − 1
    const run = (a) => { s = P.reduce(s, a); };
    run({ type: 'lxDrop', id: s.board.left[0].id, slot: { side: 'right', at: 2 }, how: 'pointer' });
    run({ type: 'lxDrop', id: s.board.right[2].id, slot: { side: 'right', onto: s.board.right[0].id }, how: 'pointer' });
    run({ type: 'digit', digit: 4 }); run({ type: 'typeChar', ch: 'x' }); run({ type: 'lxApply' });
    expect(s.unfolded).toBe(true);                                                      // (the move before it is not folded yet)
    const before = JSON.stringify(s.board);
    run({ type: 'lxDrop', id: s.board.right[1].id, slot: { side: 'left', at: 1 }, how: 'pointer' });
    expect(JSON.stringify(s.board)).not.toBe(before);
    expect(s.board.right.map((t) => t.kind)).toEqual(['x']);
  });
  it('Variables on both sides Level 5: the first drag after distributing moves the term (it used to only clear "Distributed")', () => {
    const P = bothSidesPlay;
    let s = P.newSession(problem('variables-both-sides', 5, 11), {});                  // 4(x − 3) = 2x − 6
    const g = s.board.left[0];
    for (const a of [{ type: 'lxDistribute', id: g.id }, { type: 'focus', target: 'dist', index: 0 }, ...digits(g.factor), { type: 'focus', target: 'dist', index: 1 }, ...digits(g.factor * g.inner[1].v), { type: 'lxApply' }]) s = P.reduce(s, a);
    expect(s.feedback.key).toBe('dxDistributed');
    const x = s.board.right.find((t) => t.kind === 'x');
    s = P.reduce(s, { type: 'lxDrop', id: x.id, slot: { side: 'left', at: 2 }, how: 'pointer' });
    expect(s.board.right.some((t) => t.kind === 'x')).toBe(false);
  });
  it('a term dropped on a term it cannot combine with says why; a factor let go off its parenthesis says where it goes', () => {
    let s = twoStepPlay.newSession(problem('two-step-equations', 1), {});              // 2x + 4 = 16
    s = twoStepPlay.reduce(s, { type: 'lxDrop', id: s.board.left[0].id, slot: { side: 'left', onto: s.board.left[1].id }, how: 'pointer' });
    expect(s.feedback.key).toBe('lxUnlike');
    let d = distSolvePlay.newSession(problem('distribute-solve', 1), {});
    const g = [...d.board.left, ...d.board.right].find((t) => t.kind === 'group');
    d = distSolvePlay.reduce(d, { type: 'lxDrop', id: g.id, slot: { factorMiss: true }, how: 'pointer' });
    expect(d.feedback).toMatchObject({ key: 'lxFactorParen', params: { factor: String(g.factor).replace('-', '−') } });
  });
});

describe('Build S: the honest path solves every card and level', () => {
  const CARDS = [['add-both', addBothPlay, [2, 3, 4, 5, 6], true], ['divide-it', divideMovesPlay, [2, 3, 4, 5, 6], false], ['flip-everything', flipPlay, [2, 3, 4, 5, 6], false],
    ['two-step-equations', twoStepPlay, [1, 2, 3, 4, 5, 6, 7], true], ['distribute-solve', distSolvePlay, [1, 2, 3, 4, 5], true], ['variables-both-sides', bothSidesPlay, [1, 2, 3, 4, 5], true]];
  for (const [pack, P, levels, grab] of CARDS) {
    it(`${pack}: every problem of seeds 1-3, every level, ends Balanced`, () => {
      for (const lv of levels) for (const seed of [1, 2, 3]) packById(pack).generate(lv, seed).forEach((p) => {
        const path = honestPath(P.reduce, P.newSession({ ...p, logLevel: lv }, {}), { grab });
        expect(path.at(-1).stage, `${pack} L${lv} seed ${seed} x=${p.x}`).toBe('done');
      });
    });
  }
});

describe('Build S, Part 2: a redraw keeps the rows already on screen', () => {
  const tree = (rows) => {
    const g = document.createElement('div');
    g.className = 'lb-game';
    const stack = document.createElement('div');
    stack.className = 'lb-stack';
    for (const [rk, text, cls = ''] of rows) { const r = document.createElement('div'); r.className = `lb-rowwrap ${cls}`.trim(); r.dataset.rk = rk; r.textContent = text; stack.append(r); }
    const other = document.createElement('p');
    other.textContent = 'answer row';
    g.append(stack, other);
    return g;
  };
  it('the same row is the same element; a new row is added; a settled row stays settled; the rest is the new tree', () => {
    const root = document.createElement('div');
    redrawMat(root, tree([['0.eq.a', '3x = 12', 'is-settled'], ['1.work.b', 'work']]));
    const [first, second] = root.querySelectorAll('.lb-rowwrap');
    const next = tree([['0.eq.a', '3x = 12'], ['1.work.b', 'work', 'is-settled'], ['2.eq.c', 'x = 4']]);
    const on = redrawMat(root, next);
    const rows = root.querySelectorAll('.lb-rowwrap');
    expect(rows[0]).toBe(first);
    expect(rows[1]).toBe(second);
    expect(rows[0].classList.contains('is-settled')).toBe(true);                       // (never unsettled again: no replay after Undo)
    expect(rows[2].textContent).toBe('x = 4');
    expect(liveOf(next)).toBe(on);
    expect(root.querySelector('p').textContent).toBe('answer row');
  });
});
