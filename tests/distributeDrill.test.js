import { describe, it, expect } from 'vitest';
import { newDrill, reduceDrill, DRILL_PROBLEMS, productLabels, drillSummary } from '../src/engine/distributeDrill.js';
import { sideText } from '../src/engine/lightsGrab.js';

// The Distribute drill of the lights experiment (SPEC-LIGHTS-EXPERIMENT-ADD-rev02.md B6).
const run = (s, ...actions) => actions.reduce(reduceDrill, s);
const typed = (text) => [...text].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'toggleSign' }));
const text = (s) => `${sideText(s.board.left, s.lx.negIds)} = ${sideText(s.board.right, s.lx.negIds)}`;
const term = (s, side, i) => s.board[side][i].id;

describe('the Distribute drill: 5 − 2(x + 2) = 3', () => {
  const start = () => newDrill(DRILL_PROBLEMS[0]);
  it('reads as written, and the factor cannot be distributed until its minus is tapped', () => {
    const s = start();
    expect(text(s)).toBe('5 − 2(x + 2) = 3');
    const g = term(s, 'left', 1);
    const refused = run(s, { type: 'lxDistribute', id: g });
    expect(refused.feedback.key).toBe('dxTapMinusFirst');
    expect(refused.lx.distribute).toBe(null);
    const shown = run(s, { type: 'lxMinus', id: g });
    expect(text(shown)).toBe('5 + −2(x + 2) = 3');
    expect(productLabels(shown.board.left[1])).toEqual(['−2 · x', '−2 · 2']);
  });
  it('distributes by typing each product (the x blank takes only the number), then the rest is grabbed to the answer', () => {
    let s = start();
    const g = term(s, 'left', 1);
    s = run(s, { type: 'lxMinus', id: g }, { type: 'lxDistribute', id: g });
    expect(s.lx.distribute.entries).toEqual(['', '']);
    s = run(s, ...typed('-2'), { type: 'go' });                          // Enter goes to the next blank
    expect(s.lx.distribute.focus).toBe(1);
    s = run(s, ...typed('-3'), { type: 'go' });
    expect(s.feedback).toMatchObject({ key: 'dxProductWrong', bad: true, params: { product: '−2 · 2' } });
    s = run(s, ...typed('-4'), { type: 'go' });
    expect(text(s)).toBe('5 + −2x + −4 = 3');
    expect(s.rows.length).toBe(2);
    // combine 5 and −4 (B3)
    s = run(s, { type: 'lxDrop', id: term(s, 'left', 2), slot: { side: 'left', onto: term(s, 'left', 0) } }, ...typed('1'), { type: 'go' });
    expect(text(s)).toBe('1 + −2x = 3');
    // carry the 1 across (B2): the pair cancels on its side
    s = run(s, { type: 'lxDrop', id: term(s, 'left', 0), slot: { side: 'right', at: 1 } });
    expect(text(s)).toBe('−2x = 3 − 1');
    expect(s.rows.map((r) => r.type)).toEqual(['eq', 'eq', 'eq', 'work', 'eq']);
    s = run(s, { type: 'lxDrop', id: term(s, 'right', 1), slot: { side: 'right', onto: term(s, 'right', 0) } }, ...typed('2'), { type: 'go' });
    expect(text(s)).toBe('−2x = 2');
    s = run(s, ...typed('1'), { type: 'check' });
    expect(s.feedback.key).toBe('dxWrong');
    s = run(s, ...typed('-1'), { type: 'check' });
    expect([s.stage, s.lights.solved, s.feedback.key]).toEqual(['done', 'green', 'dxRight']);
    expect(drillSummary(s)).toMatchObject({ productsWrong: 1, refusedMinus: 0, minusTaps: 1, outcomes: { distribute: 1, combine: 2, cross: 1 } });
  });
  it('Undo takes back a distribute, a minus tap and a combine; Esc closes the blanks', () => {
    let s = start();
    const g = term(s, 'left', 1);
    s = run(s, { type: 'lxMinus', id: g }, { type: 'lxDistribute', id: g });
    expect(run(s, { type: 'lxCancel' }).lx.distribute).toBe(null);
    s = run(s, ...typed('-2'), { type: 'go' }, ...typed('-4'), { type: 'go' });
    s = run(s, { type: 'undo' });
    expect(text(s)).toBe('5 + −2(x + 2) = 3');
    s = run(s, { type: 'undo' });
    expect(text(s)).toBe('5 − 2(x + 2) = 3');
  });
  it('the parentheses and x do not cross; the moves in the panel are not used here', () => {
    const s = start();
    expect(run(s, { type: 'lxDrop', id: term(s, 'left', 1), slot: { side: 'right', at: 0 } }).feedback.key).toBe('dxGroupCross');
    expect(run(s, { type: 'choose', move: 'add' }).feedback.key).toBe('dxDragOnly');
  });
});

describe('the Distribute drill: 3(x + 1) = 9', () => {
  it('has no minus to tap; distributing gives 3x + 3 = 9', () => {
    let s = newDrill(DRILL_PROBLEMS[1]);
    expect(text(s)).toBe('3(x + 1) = 9');
    s = run(s, { type: 'lxDistribute', id: term(s, 'left', 0) }, ...typed('3'), { type: 'go' }, ...typed('3'), { type: 'go' });
    expect(text(s)).toBe('3x + 3 = 9');
  });
});
