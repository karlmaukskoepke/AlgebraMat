// Build P: nudges for mechanical steps, calculate a product, cross-off, moving between blanks, Distribute polish, full checks, one drop
// per x, and Build O's follow-ups. Each describe names its Part.
import { describe, it, expect } from 'vitest';
import { makeDistSolve } from '../src/engine/distSolve.js';
import { newDistSolve, DIST_SPOT, DIST_LAYER } from '../src/engine/cards/distribute.js';
import { startLights } from '../src/engine/addBothLights.js';
import { withSpotlight } from '../src/engine/spotlight.js';
import { lineText } from '../src/engine/solveTerms.js';
import { nudgeOf } from '../src/engine/nudge.js';
import { shapeOfBoard } from '../src/engine/solveit/shape.js';

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
