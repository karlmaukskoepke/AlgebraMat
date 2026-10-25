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
