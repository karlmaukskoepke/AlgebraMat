// Build P: nudges for mechanical steps, calculate a product, cross-off, moving between blanks, Distribute polish, full checks, one drop
// per x, and Build O's follow-ups. Each describe names its Part.
import { describe, it, expect } from 'vitest';
import { makeDistSolve } from '../src/engine/distSolve.js';
import { newDistSolve, DIST_SPOT, DIST_LAYER } from '../src/engine/cards/distribute.js';
import { startLights } from '../src/engine/addBothLights.js';
import { withSpotlight } from '../src/engine/spotlight.js';
import { nudgeOf } from '../src/engine/nudge.js';
import { shapeOf, shapeOfBoard } from '../src/engine/solveit/shape.js';
import { calcTerm } from '../src/engine/addBothLights.js';
import { boardText, lineText } from '../src/engine/solveTerms.js';

const layer = withSpotlight(DIST_LAYER, DIST_SPOT);
const P = (o) => makeDistSolve({ level: 1, ...o });
const start = (p, opts = {}) => startLights(newDistSolve({ ...p, logLevel: p.level }, { level: p.level, ...opts }));
const digits = (n) => [...String(Math.abs(n))].map((d) => ({ type: 'digit', digit: Number(d) })).concat(n < 0 ? [{ type: 'toggleSign' }] : []);
const run = (s, actions) => actions.reduce((st, a) => layer(st, a), s);
const typeValue = (v) => [{ type: 'focus', target: 'answer' }, ...digits(v), { type: 'check' }];

describe('Part 7: the check shows every step, on every level', () => {
  it('Distribute at Level 4: the value is dropped, then the group is worked out a line a press, ending Balanced', () => {
    const p = P({ level: 4, n: 5, f: -2, c: 2, x: 4 });                 // 5 − 2(x + 2) = −7
    let s = run(start(p), typeValue(4));
    expect(s.sub.placing).toBe(true);
    s = run(s, [{ type: 'placeValue' }]);
    expect(s.sub.step).toBe(1);
    const texts = s.sub.lines.map(lineText);
    expect(texts.length).toBeGreaterThanOrEqual(4);                         // 5 − 2(4 + 2), 5 − 2(6), 5 − 12, −7 = −7
    for (let k = 0; k < texts.length; k++) s = run(s, [{ type: 'nextLine' }]);
    expect(s.stage).toBe('done');
  });
  it('the worked example 3(x + 2) = 15 shows 3(3 + 2) = 15, 3(5) = 15, 15 = 15 at every level', () => {
    for (const level of [1, 3, 5]) {
      const s = run(start({ ...P({ f: 3, c: 2, x: 3 }), level }), typeValue(3));
      expect(s.sub.lines.map(lineText)).toEqual(['3(3 + 2) = 15', '3(5) = 15', '15 = 15']);
    }
  });
});

describe('Part 8: several x\'s take one drop each', () => {
  const p = P({ level: 5, f: 3, c: 2, bx: 2, x: 7 });
  it('a drop fills the x it lands on only; the check begins when every x has the value', () => {
    let s = start(p);
    s = run(s, typeValue(s.problem.x));
    expect(s.sub.xs).toBe(2);
    s = run(s, [{ type: 'placeValue', index: 1 }]);
    expect(s.sub).toMatchObject({ placing: true, filled: [1], step: 0 });
    s = run(s, [{ type: 'placeValue', index: 1 }]);                          // the same x again: nothing more
    expect(s.sub).toMatchObject({ placing: true, filled: [1] });
    s = run(s, [{ type: 'placeValue', index: 0 }]);
    expect(s.sub).toMatchObject({ placing: false, step: 1 });
  });
});

// ---------- Part 1: the nudge (what to nudge; the screen half is walked in Features to check) ----------

let nid = 1000;
const n = (v) => ({ id: `t${nid++}`, kind: 'num', v });
const x = (coef = 1) => ({ id: `t${nid++}`, kind: 'x', coef });
const grp = (factor, c) => ({ id: `t${nid++}`, kind: 'group', factor, inner: [{ id: `t${nid++}`, kind: 'x', coef: 1 }, n(c)] });
const frac = (k, v) => ({ id: `t${nid++}`, kind: 'frac', n: k, inner: [n(v)] });
const quiet = (board) => ({ stage: 'moves', board, entry: '', lx: {} });

describe('Part 1: the combine nudge, on every shape with terms to put together', () => {
  const cases = [
    ['W2', 'two', { left: [x(2)], right: [n(-11), n(3)] }, 'right'],           // 2x = −11 + 3 (after Add)
    ['E1', 'dist', { left: [n(5), x(3), n(6)], right: [n(20)] }, 'left'],       // 5 + 3x + 6 = 20
    ['E2', 'dist', { left: [x(3), n(6), x(2)], right: [n(41)] }, 'left'],       // 3x + 6 + 2x = 41
    ['E4', 'dist', { left: [x(3), n(6)], right: [n(20), n(-5)] }, 'right'],     // 3x + 6 = 20 − 5
    ['P6', 'dist', { left: [grp(3, 2)], right: [n(20), n(-5)] }, 'right'],      // 3(x + 2) = 20 − 5
  ];
  for (const [id, family, board, side] of cases) {
    it(`${id}: the first two like terms glow (on the ${side})`, () => {
      expect(shapeOfBoard(board, family).id).toBe(id);
      const got = nudgeOf(quiet(board));
      expect(got).toMatchObject({ kind: 'combine', side });
      const terms = board[side];
      const a = terms.find((t) => t.id === got.a);
      const b = terms.find((t) => t.id === got.b);
      expect(a.kind).toBe(b.kind);
    });
  }
  it('E2 puts the x-terms or the numbers together, x\'s side first, in reading order', () => {
    const board = { left: [x(3), n(6), x(2)], right: [n(41)] };
    const got = nudgeOf(quiet(board));
    expect([got.a, got.b]).toEqual([board.left[0].id, board.left[2].id]);
  });
  it('never at x alone (the student types x), and never when there is nothing to put together', () => {
    expect(nudgeOf(quiet({ left: [x(1)], right: [n(-3), n(5)] }))).toBeNull();            // S2: x = −3 + 5
    expect(nudgeOf(quiet({ left: [x(1)], right: [frac(3, 15), n(-2)] }))).toBeNull();     // Q2: x = ⅓(15) − 2
    expect(nudgeOf(quiet({ left: [x(3), n(4)], right: [n(19)] }))).toBeNull();            // W1: choosing a move is the thinking
    expect(nudgeOf(quiet({ left: [grp(3, 2)], right: [n(15)] }))).toBeNull();             // P1: the same
  });
  it('never while anything else is going on: a check, a move waiting for Undo, a scaffold, a move chosen, something typed, a combine', () => {
    const board = { left: [x(2)], right: [n(-11), n(3)] };
    for (const extra of [{ sub: {} }, { needUndo: true }, { scaffold: true }, { menu: 'add' }, { entry: '4' }, { lx: { combine: {} } }, { lx: { distribute: {} } }, { hint: {} }, { stage: 'done' }]) {
      expect(nudgeOf({ ...quiet(board), ...extra })).toBeNull();
    }
  });
  it('is not help: the state is never changed by it (it dispatches nothing)', () => {
    const s = quiet({ left: [x(2)], right: [n(-11), n(3)] });
    const before = JSON.stringify(s);
    nudgeOf(s);
    expect(JSON.stringify(s)).toBe(before);
  });
});

// ---------- Part 2: calculate a product ----------

const divide = (n) => [{ type: 'divPick' }, ...(n < 0 ? [{ type: 'toggleSign' }] : []), { type: 'digit', digit: Math.abs(n) }, { type: 'go' }];
const calcIt = (s, v) => [{ type: 'lxCalc', id: calcTerm(s).id }, ...digits(v), { type: 'lxApply' }];

describe('Part 2: calculate a product on the divide-first route', () => {
  const p = P({ f: 3, c: 2, x: 3 });                                      // 3(x + 2) = 15
  it('x + 2 = ⅓(15): the product is worked out to 5, then Add −2, then x is typed', () => {
    let s = run(start(p), divide(3));
    expect(boardText(s.board)).toBe('x + 2 = ⅓(15)');
    expect(shapeOf(s).id).toBe('Q1');
    expect(nudgeOf(s)).toMatchObject({ kind: 'calc', div: true });         // the nudge: the fraction bar
    s = run(s, calcIt(s, 5));
    expect(boardText(s.board)).toBe('x + 2 = 5');
    expect(shapeOf(s).id).toBe('Q4');
    expect(s.rows.at(-1).board).toBe(s.board);
    s = run(s, [{ type: 'choose', move: 'add' }, ...digits(-2), { type: 'go' }]);
    expect(boardText(s.board)).toBe('x = 5 − 2');
    expect(shapeOf(s).id).toBe('Q5');
    expect(calcTerm(s)).toBeNull();
    s = run(s, [...typeValue(3), { type: 'placeValue' }, ...Array(6).fill({ type: 'nextLine' })]);
    expect(s.stage).toBe('done');
  });
  it('a wrong product waits for Undo with the factor and number lit; after Undo the hint lights the product', () => {
    let s = run(start(p), divide(3));
    s = run(s, calcIt(s, 45));
    expect(s.feedback).toMatchObject({ key: 'lxCalcWrong', bad: true });
    expect(DIST_SPOT.error(s)).toMatchObject({ target: 'calcbox', lit: ['calc'] });
    expect(run(s, [{ type: 'lxApply' }, { type: 'stuck' }])).toBe(s);       // Undo is the only way out
    s = run(s, [{ type: 'undo' }]);
    expect(s.lx.calc).toBeNull();
    expect(s.spot).toMatchObject({ kind: 'hint', target: 'calc' });
    expect(s.feedback.key).toBe('mCalcHint');
    expect(s.feedback.params).toMatchObject({ expr: '15 ÷ 3', div: true });
    expect(s.supportsShown).not.toContain('model');
  });
  it('Undo after a product takes it back; at x alone there is nothing to work out', () => {
    let s = run(start(p), divide(3));
    const before = boardText(s.board);
    s = run(s, calcIt(s, 5));
    s = run(s, [{ type: 'undo' }]);
    expect(boardText(s.board)).toBe(before);
    // x = ⅓(9) on the other route: no product to work out, the student types x
    const alone = { ...s, board: { left: [{ id: 'q1', kind: 'x', coef: 1 }], right: [{ id: 'q2', kind: 'frac', n: 3, inner: [{ id: 'q3', kind: 'num', v: 9 }] }] } };
    expect(calcTerm(alone)).toBeNull();
    expect(run(alone, [{ type: 'lxCalc', id: 'q2' }])).toBe(alone);
  });
  it('the multiplication form (the Fraction option) words it ⅓ × 15; a negative divisor keeps its sign', () => {
    const q = P({ f: -2, c: 3, x: 4 });                                    // −2(x + 3) = −14
    let s = run(start(q), divide(-2));
    expect(nudgeOf(s)).toMatchObject({ kind: 'calc' });
    s = run(s, calcIt(s, 6));
    expect(s.feedback.key).toBe('lxCalcWrong');
    expect(s.feedback.params.expr).toBe('−14 ÷ (−2)');
    s = run(s, [{ type: 'undo' }]);
    s = run(s, calcIt(s, 7));
    expect(boardText(s.board)).toBe('x + 3 = 7');
  });
});

describe('Part 4: moving between blanks with the keyboard', () => {
  it('the distribute products: Tab (blankMove +1) goes on, Shift+Tab back; the contents are selected, so typing replaces them', () => {
    const p = P({ f: 3, c: 2, x: 3 });
    let s = start(p);
    const g = s.board.left[0];
    s = run(s, [{ type: 'lxDistribute', id: g.id }, ...digits(3), { type: 'blankMove', dir: 1 }, ...digits(6)]);
    expect(s.lx.distribute).toMatchObject({ entries: ['3', '6'], focus: 1 });
    s = run(s, [{ type: 'blankMove', dir: -1 }]);
    expect(s.lx.distribute).toMatchObject({ focus: 0, sel: true });
    s = run(s, digits(4));
    expect(s.lx.distribute).toMatchObject({ entries: ['4', '6'], sel: false });
    expect(run(s, [{ type: 'blankMove', dir: -1 }])).toBe(s);              // nothing before the first
    s = run(s, [{ type: 'blankMove', dir: 1 }, { type: 'backspace' }]);
    expect(s.lx.distribute.entries).toEqual(['4', '']);
  });
  it('the fraction blank: → to the bottom, ← to the top, the contents selected; Enter in the top goes on to an empty bottom', () => {
    const p = P({ f: 3, c: 2, x: 3 });
    let s = run(start(p), [{ type: 'multOpen' }, { type: 'multPick', kind: 'frac' }, ...digits(1)]);
    expect(s.fb).toMatchObject({ num: '1', part: 'den' });
    s = run(s, [{ type: 'blankMove', dir: -1 }]);
    expect(s.fb).toMatchObject({ part: 'num', sel: true });
    s = run(s, [{ type: 'go' }]);
    expect(s.fb).toMatchObject({ part: 'den' });
    expect(s.fb.sel).toBeFalsy();
    expect(s.feedback?.key).not.toBe('dBlankBad');
    s = run(s, [...digits(3), { type: 'blankMove', dir: -1 }, ...digits(2)]);
    expect(s.fb).toMatchObject({ num: '2', den: '3', part: 'den', sel: true });
    s = run(s, digits(5));
    expect(s.fb).toMatchObject({ num: '2', den: '5' });
    expect(s.fb.sel).toBeFalsy();
  });
});
