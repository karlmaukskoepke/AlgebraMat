import { describe, it, expect } from 'vitest';
import { crossRefusal } from '../src/engine/addBothLights.js';
import { lightsFeedbackText } from '../src/view/addBothLightsFeedback.js';
import { substitutionLines, lineText } from '../src/engine/solveTerms.js';

// Build T. Terms: an id each, so a drag can name one.
let k = 0;
const x = (coef = 1) => ({ id: `t${k++}`, kind: 'x', coef });
const n = (v) => ({ id: `t${k++}`, kind: 'num', v });
const frac = (nn, v, sign = 1) => ({ id: `t${k++}`, kind: 'frac', n: nn, sign, inner: [{ id: `t${k++}`, kind: 'num', v }] });
const group = (factor, c) => ({ id: `t${k++}`, kind: 'group', factor, inner: [{ id: `t${k++}`, kind: 'x', coef: 1 }, { id: `t${k++}`, kind: 'num', v: c }] });
const say = (s, id) => { const r = crossRefusal(s, id); return lightsFeedbackText({ key: r.key, params: r.params }); };

describe('Part 1.1: the check writes a product with parentheses, never a times sign', () => {
  const first = (board, v) => lineText(substitutionLines(board, v).lines[0]);
  it('7(3), −3(−4), 4 − 3(5), 3(3 + 2) + 2(7)', () => {
    expect(first({ left: [x(7)], right: [n(21)] }, 3)).toBe('7(3) = 21');
    expect(first({ left: [x(-3)], right: [n(12)] }, -4)).toBe('−3(−4) = 12');
    expect(first({ left: [n(4), x(-3)], right: [n(-11)] }, 5)).toBe('4 − 3(5) = −11');
    const lines = substitutionLines({ left: [group(3, 2), x(2)], right: [n(41)] }, 7).lines.map(lineText);
    expect(lines[0]).toBe('3(7 + 2) + 2(7) = 41');
    for (const l of lines) expect(l).not.toMatch(/×/);
  });
});

describe('Part 1.3: a refused drag names a move that applies to the shape', () => {
  it('ax = b: divide by a (−a too, and −x)', () => {
    const a = x(3); expect(say({ board: { left: [a], right: [n(9)] } }, a.id)).toBe('x is already on the left side of the equation. Let’s keep x there. To get one x from 3x, divide both sides by 3.');
    const b = x(-3); expect(say({ board: { left: [n(9)], right: [b] } }, b.id)).toBe('x is already on the right side of the equation. Let’s keep x there. To get one x from −3x, divide both sides by −3.');
    const c = x(-1); expect(say({ board: { left: [c], right: [n(9)] } }, c.id)).toMatch(/To get x from −x, divide both sides by −1\.$/);
  });
  it('x + c = b: move the number (one), a number (several)', () => {
    const a = x(); expect(say({ board: { left: [a, n(4)], right: [n(9)] } }, a.id)).toMatch(/Let’s keep x there\. Try moving the number\.$/);
    const b = x(2); expect(say({ board: { left: [n(1), b, n(4)], right: [n(9)] } }, b.id)).toMatch(/Try moving a number\.$/);
  });
  it('x alone: type its value', () => {
    const a = x(); expect(say({ board: { left: [a], right: [n(9)] } }, a.id)).toMatch(/Let’s keep x there\. x is already alone\. Type its value\.$/);
  });
  it('two x-terms on one side: combine first; a parenthesis: multiply its number in', () => {
    const a = x(2); expect(say({ board: { left: [a, x(3)], right: [n(10)] } }, a.id)).toMatch(/Combine the x-terms first/);
    const g = group(3, 2); expect(say({ board: { left: [g], right: [n(15)] } }, g.id)).toMatch(/Drag the 3 onto its parenthesis to multiply it in\.$/);
  });
  it('an x inside a parenthesis on the other side: distribute first (not "keep x there")', () => {
    const a = x(5); expect(say({ board: { left: [group(3, 2)], right: [a] } }, a.id)).toBe('The other side has an x too, inside the parenthesis. Drag the 3 onto its parenthesis first.');
  });
  it('a number still to work out is said in its own form; at x alone, what x is', () => {
    const f = frac(3, 15);
    expect(say({ board: { left: [x()], right: [f] }, divIds: [f.id] }, f.id)).toBe('x is 15 divided by 3. Work it out, then type x.');
    expect(say({ board: { left: [x()], right: [f] }, divIds: [] }, f.id)).toBe('x is ⅓ of 15. Work it out, then type x.');
    expect(say({ board: { left: [x(), n(2)], right: [f] }, divIds: [f.id] }, f.id)).toBe('Work out 15 divided by 3 first: click the fraction bar.');
    expect(say({ board: { left: [x(), n(2)], right: [f] }, divIds: [] }, f.id)).toBe('Work out ⅓ of 15 first: click the ×.');
  });
});

// ---- Part 4: an Add that empties a side, with x-terms and numbers left together on the other ----
import { bothSidesPlay as BP } from '../src/play/solveCards.js';
import { zeroedSide } from '../src/engine/cards/bothSides.js';
import { packById } from '../src/packs/index.js';
import { boardText } from '../src/engine/solveTerms.js';

describe('Part 4: the wrong cancel', () => {
  const digits = (n) => [...String(Math.abs(n))].map((d) => ({ type: 'digit', digit: Number(d) })).concat(n < 0 ? [{ type: 'toggleSign' }] : []);
  const addX = (k) => [{ type: 'choose', move: 'add' }, { type: 'addPick', kind: 'x' }, ...digits(k), { type: 'go' }];
  const addN = (k) => [{ type: 'choose', move: 'add' }, { type: 'addPick', kind: 'num' }, ...digits(k), { type: 'go' }];
  const run = (s, acts) => acts.reduce((st, a) => BP.reduce(st, a), s);
  const start = (left, right) => { const s = BP.newSession({ ...packById('variables-both-sides').generate(1, 21)[0], logLevel: 1 }, {}); return { ...s, board: { left, right }, base: { left, right }, rows: [{ type: 'eq', board: { left, right } }], prevBoard: { left, right } }; };
  it('which Adds count: 5x = 3x + 10 with −5x (0 = −2x + 10) yes; 2x = 3x + 6 with −2x (0 = x + 6) yes too (Build Q, Part 6: any sign); a lone number taken off its side yes', () => {
    expect(zeroedSide({ left: [x(5)], right: [x(3), n(10)] }, { left: [n(0)], right: [x(-2), n(10)] }, true)).toMatchObject({ side: 'left' });
    expect(zeroedSide({ left: [x(2)], right: [x(3), n(6)] }, { left: [n(0)], right: [x(1), n(6)] }, true)).toMatchObject({ side: 'left' });
    expect(zeroedSide({ left: [x(2), n(6)], right: [n(10)] }, { left: [x(2), n(6), n(-10)], right: [n(0)] }, false)).toMatchObject({ side: 'right', beside: true });
    expect(zeroedSide({ left: [x(5)], right: [x(3), n(10)] }, { left: [x(2)], right: [n(10)] }, true)).toBeNull();
  });
  it('5x = 3x + 10, Add −5x: written, then the spotlight with Undo; the slip is tagged; Undo gives the hint with Add −3x ready, recorded as hint', () => {
    let s = start([x(5)], [x(3), n(10)]);
    s = run(s, addX(-5));
    expect(boardText(s.board)).toBe('0 = 3x + −5x + 10');
    expect(s.feedback).toMatchObject({ key: 'vZeroSide', bad: true });
    expect(s.needUndo).toBe(true);
    expect(s.tags).toContain('zeroed-side');
    s = run(s, [{ type: 'undo' }]);
    expect(boardText(s.board)).toBe('5x = 3x + 10');
    expect(s.feedback).toMatchObject({ key: 'vZeroHint', params: { amount: '−3x', term: '3x' } });
    expect([s.menu, s.addKind, s.amountEntry]).toEqual(['add', 'x', '-3']);
    expect(s.supportsShown).toContain('hint');
    s = run(s, [{ type: 'go' }]);
    expect(boardText(s.board)).toBe('5x + −3x = 10');
  });
  it('the same by dragging the 5x across the =', () => {
    let s = start([x(5)], [x(3), n(10)]);
    s = run(s, [{ type: 'lxDrop', id: s.board.left[0].id, slot: { side: 'right', at: 2 }, how: 'pointer' }]);
    expect(s.feedback.key).toBe('vZeroSide');
  });
  it('2x + 6 = 10, Add −10: the spotlight; the hint after Undo is Add −6', () => {
    let s = start([x(2), n(6)], [n(10)]);
    s = run(s, addN(-10));
    expect(s.feedback).toMatchObject({ key: 'vZeroSide', params: { x: false, beside: true } });
    s = run(s, [{ type: 'undo' }]);
    expect(s.feedback).toMatchObject({ key: 'vZeroHintNum', params: { opposite: '−6', constant: '+6' } });
  });
  it('2x = 3x + 6, Add −2x (0 = x + 6) is flagged too (Build Q, Part 6, Karl: any sign); the hint after Undo is Add −3x', () => {
    let s = run(start([x(2)], [x(3), n(6)]), addX(-2));
    expect([boardText(s.board), s.needUndo, s.feedback.bad, s.feedback.key]).toEqual(['0 = 3x + −2x + 6', true, true, 'vZeroSide']);
    s = run(s, [{ type: 'undo' }]);
    expect(s.feedback).toMatchObject({ key: 'vZeroHint', params: { amount: '−3x', term: '3x', beside: true } });
  });
});
