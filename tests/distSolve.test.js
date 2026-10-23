import { describe, it, expect } from 'vitest';
import { PACKS, SECTIONS, distributeSolve } from '../src/packs/index.js';
import { makeDistSolve, formatDistSolve, tagDistSolve, valueAt, slipValuesOf } from '../src/engine/distSolve.js';
import { generateDistSolveLevel, DIST_LEVELS, slipCollisions, slipSafe, addAmountOf, MAX_ADD, MAX_SIDE } from '../src/engine/generateDistSolve.js';
import { newDistSolve, DIST_SPOT, DIST_LAYER, optionOf, xAlone } from '../src/engine/cards/distribute.js';
import { startLights } from '../src/engine/addBothLights.js';
import { withSpotlight } from '../src/engine/spotlight.js';
import { shapeOf, UNKNOWN, SHAPES } from '../src/engine/solveit/shape.js';
import { REGISTRY } from '../src/engine/solveit/registry.js';
import { substitutionLines, lineText, equationSegs, boardText } from '../src/engine/solveTerms.js';
import { productLabels } from '../src/engine/distributeMove.js';

// Build M: Distribute, combine, solve, in basic form.

const SEEDS = 200;
const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
const P = (o) => makeDistSolve({ level: 1, ...o });

describe('the generator: every level, 200 seeds', () => {
  for (const level of range(1, 5)) {
    it(`Level ${level}: substitution, banned answers, ranges, the limits of every row, no repeats, no accidental balance, its forms and signs`, () => {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const set = generateDistSolveLevel(level, seed);
        expect(set).toHaveLength(5);
        expect(new Set(set.map((p) => p.x)).size).toBe(5);
        expect(new Set(set.map(formatDistSolve)).size).toBe(5);
        for (const p of set) {
          expect(valueAt(p, p.x)).toBe(p.b);                                      // substitution
          if (p.x === 0 || Math.abs(p.x) === 1) throw new Error(`banned answer ${p.x} at Level ${level}, seed ${seed}`);
          expect(Math.abs(p.x)).toBeLessThanOrEqual(9);
          expect(Math.abs(p.f)).toBeGreaterThanOrEqual(2); expect(Math.abs(p.f)).toBeLessThanOrEqual(5);
          expect(Math.abs(p.c)).toBeGreaterThanOrEqual(1); expect(Math.abs(p.c)).toBeLessThanOrEqual(9);
          expect(Math.abs(p.n)).toBeLessThanOrEqual(12);
          expect(Math.abs(p.f * p.c)).toBeLessThanOrEqual(MAX_ADD);
          expect(Math.abs(addAmountOf(p))).toBeLessThanOrEqual(MAX_ADD); expect(addAmountOf(p)).not.toBe(0);
          expect(Math.abs(p.b)).toBeLessThanOrEqual(MAX_SIDE); expect(p.b).not.toBe(0);
          expect(p.x + p.c).not.toBe(0);
          expect(slipSafe(p)).toBe(true);
        }
        const cs = set.map((p) => Math.sign(p.c));
        expect(cs).toContain(1); expect(cs).toContain(-1);                         // both signs of c, every level
        if (level === 1) expect(set.every((p) => p.f > 0 && !p.n && !p.bx && p.x > 0)).toBe(true);
        if (level === 2) expect(set.every((p) => p.f < 0 && !p.n && !p.bx) && set.some((p) => p.x < 0) && set.some((p) => p.x > 0)).toBe(true);
        if (level === 3) expect(set.every((p) => p.f > 0 && p.n > 0 && !p.bx)).toBe(true);
        if (level === 4) expect(set.every((p) => p.f < 0 && p.n > 0 && !p.bx) && set.some((p) => p.x < 0)).toBe(true);
        if (level === 5) {
          expect(set.every((p) => p.f > 0 && !p.n && p.bx && p.f + p.bx >= 2 && p.f + p.bx <= 6)).toBe(true);
          expect(set.some((p) => p.xFirst) && set.some((p) => !p.xFirst) && set.some((p) => p.bx < 0) && set.some((p) => p.bx > 0)).toBe(true);
        }
      }
    });
  }
  it('never fails to fill a level (300 seeds), and refuses a banned answer', () => {
    for (const level of range(1, 5)) for (let seed = 1; seed <= 300; seed++) expect(() => generateDistSolveLevel(level, seed)).not.toThrow();
    for (const x of [0, 1, -1]) expect(() => P({ f: 3, c: 2, x })).toThrow();
    expect(Object.keys(DIST_LEVELS)).toHaveLength(5);
  });
  it('reports the slip collisions (for the report)', () => {
    const slips = {};
    for (const level of range(1, 5)) slips[level] = slipCollisions(level);
    console.log('distribute slip collisions', JSON.stringify(slips));
  });
});

describe('the problems, the tags and the check', () => {
  it('writes each form as it is said', () => {
    expect(formatDistSolve(P({ f: 3, c: 2, x: 3 }))).toBe('3(x + 2) = 15');
    expect(formatDistSolve(P({ f: -2, c: 4, x: -7 }))).toBe('−2(x + 4) = 6');
    expect(formatDistSolve(P({ f: 2, c: -4, x: 5 }))).toBe('2(x − 4) = 2');
    expect(formatDistSolve(P({ n: 5, f: -2, c: 2, x: -3 }))).toBe('5 − 2(x + 2) = 7');
    expect(formatDistSolve(P({ n: 5, f: 2, c: 3, x: 5 }))).toBe('5 + 2(x + 3) = 21');
    expect(formatDistSolve(P({ f: 3, c: 2, bx: 2, x: 3 }))).toBe('3(x + 2) + 2x = 21');
    expect(formatDistSolve(P({ f: 3, c: -1, bx: -2, xFirst: true, x: 4 }))).toBe('−2x + 3(x − 1) = 1');
    const p = P({ f: 3, c: 2, x: 3 });
    expect(boardText(newDistSolve(p).board)).toBe('3(x + 2) = 15');
  });
  it('tags the declared slips: distributed to the first term only, the factor left out, the sign flipped', () => {
    const p = P({ f: 2, c: 3, x: 5 });                                           // 2(x + 3) = 16: 2x + 3 = 16 is not whole
    expect(tagDistSolve(p, 13)).toBe('no-distribute');                           // x + 3 = 16
    expect(tagDistSolve(p, -5)).toBe('sign-flipped');
    expect(tagDistSolve(p, 5)).toBe(null);
    const q = P({ f: 3, c: 3, x: 4 });                                           // 3(x + 3) = 21: 3x + 3 = 21 gives 6
    expect(tagDistSolve(q, 6)).toBe('first-only');
    expect(slipValuesOf(q).map((s) => s.tag)).toEqual(['first-only', 'no-distribute', 'sign-flipped']);
  });
  it('checks a group as the brief says: 3(3 + 2) = 15; −2(−7 + 4) = 6; a negative value after a subtracted group', () => {
    const lines = (p, v) => substitutionLines(newDistSolve(p).board, v).lines.map(lineText);
    expect(lines(P({ f: 3, c: 2, x: 3 }), 3)).toEqual(['3(3 + 2) = 15', '3(5) = 15', '15 = 15']);
    expect(lines(P({ f: -2, c: 4, x: -7 }), -7)).toEqual(['−2(−7 + 4) = 6', '−2(−3) = 6', '6 = 6']);
    const b = newDistSolve(P({ n: 5, f: -2, c: 2, x: -3 })).board;
    expect(equationSegs(b).map((x) => x.text).join('')).toBe('5 − 2(x + 2) = 7');
    expect(lines(P({ n: 5, f: -2, c: 2, x: -3 }), -3)).toEqual(['5 − 2(−3 + 2) = 7', '5 − 2(−1) = 7', '5 + 2 = 7', '7 = 7']);
    // the value is blue and numbered as the x it replaced, so it sits under it (Build I's two stacked lines)
    const first = substitutionLines(newDistSolve(P({ f: -2, c: 4, x: -7 })).board, -7).lines[0].segs;
    expect(first.filter((s) => s.cls.includes('is-blue')).map((s) => s.text)).toEqual(['−7']);
    expect(equationSegs(newDistSolve(P({ f: 3, c: 2, bx: 2, x: 3 })).board).filter((s) => s.xi !== undefined)).toHaveLength(2);
    expect(substitutionLines(newDistSolve(P({ f: 3, c: 2, x: 3 })).board, 4).ok).toBe(false);
  });
  it('labels each blank with its multiplication', () => {
    const g = newDistSolve(P({ n: 5, f: -2, c: 2, x: -3 })).board.left[1];
    expect(productLabels(g)).toEqual(['−2 · x', '−2 · 2']);
  });
});

// ---------- playing it, through the card's layers as a student does ----------

const layer = withSpotlight(DIST_LAYER, DIST_SPOT);
const start = (p, opts = {}) => startLights(newDistSolve({ ...p, logLevel: p.level }, { level: p.level, ...opts }));
const digits = (n) => [...String(Math.abs(n))].map((d) => ({ type: 'digit', digit: Number(d) })).concat(n < 0 ? [{ type: 'toggleSign' }] : []);
const groupOf = (s) => [...s.board.left, ...s.board.right].find((t) => t.kind === 'group');
const xSide = (s) => (s.board.left.some((t) => t.kind === 'x' || t.kind === 'group') ? 'left' : 'right');
const A = {
  add: (k) => (st) => [...(st?.menu === 'add' ? [] : [{ type: 'choose', move: 'add' }]), ...digits(k), { type: 'go' }],
  div: (n) => [{ type: 'multOpen' }, { type: 'multPick', kind: 'div' }, ...(n < 0 ? [{ type: 'toggleSign' }] : []), { type: 'digit', digit: Math.abs(n) }, { type: 'go' }],
  flip: () => [{ type: 'flipPick' }, { type: 'go' }],
  check: (v) => [{ type: 'focus', target: 'answer' }, ...digits(v), { type: 'check' }, { type: 'placeValue' }, { type: 'placeValue' }, ...Array(8).fill({ type: 'nextLine' })],
  minus: (s) => [{ type: 'lxMinus', id: groupOf(s).id }],
  // the factor dropped on its parenthesis, then each product typed (Enter goes to the next blank), then Go
  dist: (s, typed = null) => {
    const g = groupOf(s);
    const right = g.inner.map((t) => g.factor * (t.kind === 'x' ? 1 : t.v));
    const ps = typed ?? right;
    return [{ type: 'lxDistribute', id: g.id }, ...ps.flatMap((v, k) => [{ type: 'focus', target: 'dist', index: k }, ...digits(v)]), { type: 'lxApply' }];
  },
  undo: () => [{ type: 'undo' }],
  stuck: () => [{ type: 'stuck' }],
};
// combine two like terms on a side: the first two of a kind (numbers on x's side, x-terms, or the other side's numbers)
function combine(s, where, typed = null) {
  const side = where === 'other' ? (xSide(s) === 'left' ? 'right' : 'left') : xSide(s);
  const kind = where === 'x' ? 'x' : 'num';
  const [a, b] = s.board[side].filter((t) => t.kind === kind);
  const sum = (a.kind === 'x' ? a.coef : a.v) + (b.kind === 'x' ? b.coef : b.v);
  const text = typed ?? (kind === 'x' ? `${sum}x` : String(sum));
  const keys = [...text].map((ch) => (ch === 'x' ? { type: 'typeChar', ch: 'x' } : ch === '-' ? null : { type: 'digit', digit: Number(ch) })).filter(Boolean);
  if (text.startsWith('-')) keys.splice(text.endsWith('x') ? keys.length - 1 : keys.length, 0, { type: 'toggleSign' });
  return [{ type: 'lxDrop', id: a.id, slot: { side, onto: b.id } }, ...keys, { type: 'lxApply' }];
}
const seen = new Map();
function run(s, actions, where = '') {
  if (typeof actions === 'function') actions = actions(s);
  for (const a of actions) {
    s = layer(s, a);
    const sh = shapeOf(s);
    if (sh.id === UNKNOWN) throw new Error(`unknown shape (${sh.why}) at ${where} after ${JSON.stringify(a)}: ${JSON.stringify(s.board)}`);
    if (!REGISTRY[sh.id]) throw new Error(`no registry entry for ${sh.id}`);
    seen.set(sh.id, (seen.get(sh.id) ?? 0) + 1);
  }
  return s;
}
const flow = (s, steps, where) => steps.reduce((st, step) => run(st, typeof step === 'function' ? step(st) : step, where), s);
const xSideNums = (s) => s.board[xSide(s)].filter((t) => t.kind === 'num');
const otherNums = (s) => s.board[xSide(s) === 'left' ? 'right' : 'left'];

// The honest path for any problem: tap the minus if it is subtracted, distribute, put the x-terms together, put the numbers beside x
// together, Add their opposite, combine the other side, flip if x has a minus, divide, type x.
function solvePath(s, { flipFirst = false } = {}) {
  const g = groupOf(s);
  const side = s.board[xSide(s)];
  if (g.factor < 0 && side.indexOf(g) > 0) s = run(s, A.minus(s));
  s = run(s, A.dist(s), 'distribute');
  expect(s.lights.noparen).toBe('green');
  if (s.board[xSide(s)].filter((t) => t.kind === 'x').length >= 2) s = run(s, combine(s, 'x'), 'combine x');
  if (xSideNums(s).length >= 2) s = run(s, combine(s, 'x side'), 'combine numbers');
  const k = xSideNums(s)[0]?.v;
  if (k) { s = run(s, A.add(-k), 'add'); expect(s.lights.fewer).toBe('green'); }
  if (otherNums(s).length >= 2) s = run(s, combine(s, 'other'), 'combine other');
  const a = s.board[xSide(s)][0].coef;
  if (a < 0 && flipFirst) s = run(s, A.flip(), 'flip');
  const a2 = s.board[xSide(s)][0].coef;
  if (a2 !== 1) s = run(s, A.div(a2), 'divide');
  expect(xAlone(s.board)).toBe(true);
  expect(s.lights.solved).toBe('green');
  return run(s, A.check(s.problem.x), 'check');
}

describe('the worked example, 3(x + 2) = 15', () => {
  const p = P({ f: 3, c: 2, x: 3 });
  it('drag the 3 onto the parenthesis, type 3 and 6: the app writes 3x + 6 = 15; then Add −6, combine, divide by 3, type 3', () => {
    let s = start(p);
    expect(shapeOf(s).id).toBe('P1');
    s = run(s, [{ type: 'lxDistribute', id: groupOf(s).id }]);
    expect(s.lx.distribute.entries).toEqual(['', '']);
    s = run(s, [...digits(3), { type: 'go' }]);                                  // Enter on a filled blank goes to the next
    expect(s.lx.distribute.focus).toBe(1);
    s = run(s, [...digits(6), { type: 'go' }]);
    expect(boardText(s.board)).toBe('3x + 6 = 15');
    expect(shapeOf(s).id).toBe('W1');
    expect(s.lights).toMatchObject({ fewer: 'off', noparen: 'green', solved: 'off' });   // a distribute is never red; Fewer terms is off
    s = run(s, A.add(-6));
    expect(boardText(s.board)).toBe('3x = 15 − 6');
    s = run(s, combine(s, 'other'));
    expect(boardText(s.board)).toBe('3x = 9');
    s = run(s, A.div(3));
    expect(boardText(s.board)).toBe('x = ⅓(9)');                                 // never evaluated for the student
    s = run(s, A.check(3));
    expect(s.stage).toBe('done');
    expect(s.clean).toBe(true);
  });
  it('Go with a blank still empty shakes it; Undo closes the blanks; the x is printed, so typing x does nothing', () => {
    let s = start(p);
    s = run(s, [{ type: 'lxDistribute', id: groupOf(s).id }, ...digits(3), { type: 'typeChar', ch: 'x' }, { type: 'lxApply' }]);
    expect(s.lx.distribute.entries).toEqual(['3', '']);
    expect(s.ui.shake).toBe(true);
    s = run(s, A.undo());
    expect(s.lx.distribute).toBe(null);
    expect(boardText(s.board)).toBe('3(x + 2) = 15');
  });
  it('a wrong second product (the piece not multiplied: 2 for 3 · 2): the spotlight, then Undo, then the hint lights the factor', () => {
    let s = run(start(p), (st) => A.dist(st, [3, 2]));
    expect(s.feedback).toMatchObject({ key: 'dxProductWrong', bad: true, params: { product: '3 · 2', typed: '2', tag: 'dist-unmultiplied' } });
    expect(DIST_SPOT.error(s)).toMatchObject({ target: 'prodbox' });
    expect(s.lx.distribute.wrong).toBe(1);
    expect(s.answers.at(-1)).toEqual({ typed: '3 · 2 = 2', tag: 'dist-unmultiplied' });
    expect(layer(s, { type: 'choose', move: 'add' })).toBe(s);                    // (only Undo gets out)
    s = run(s, A.undo());
    expect(s.lx.distribute).toBe(null);
    expect(s.spot).toMatchObject({ kind: 'hint', target: 'factor' });
    expect(s.feedback.key).toBe('mDistributeHint');
    expect(s.hint).toEqual({ kind: 'factor', id: groupOf(s).id });
    expect(s.supportsShown).not.toContain('model');
  });
  it('dividing first is helpful: x + 2 = ⅓(15), never red; then Add −2 leaves x alone, and the student types 3', () => {
    let s = run(start(p), A.div(3));
    expect(boardText(s.board)).toBe('x + 2 = ⅓(15)');
    expect(shapeOf(s).id).toBe('Q1');
    expect(s.needUndo).toBe(false);
    expect(s.lights.fewer).not.toBe('red');
    expect(s.lights.noparen).toBe('green');
    s = run(s, A.add(-2));
    expect(shapeOf(s).id).toBe('Q2');
    expect(xAlone(s.board)).toBe(true);
    s = run(s, A.check(3));
    expect(s.stage).toBe('done');
  });
  it('a fraction that does not split the factor gets the shared failure; one that only partly cancels it is legal and neutral', () => {
    const s = run(start(p), A.div(5));
    expect(s.feedback.key).toBe('dFail');
    expect(shapeOf(s).id).toBe('DF');
    let q = run(start(P({ f: 4, c: 2, x: 3 })), A.div(2));                       // 4(x + 2) = 20, ½: 2(x + 2) = 10
    expect(boardText(q.board)).toBe('2(x + 2) = 10');
    expect(q.needUndo).toBe(false);
    expect(Object.values(q.lights)).not.toContain('red');
    expect(shapeOf(q).id).toBe('P1');
    q = solvePath(q);
    expect(q.stage).toBe('done');
  });
  it('a negative factor divided by its size leaves −(x + 2): classified, and flipping it gives x + 2 = −(b)', () => {
    let s = run(start(P({ level: 2, f: -4, c: 2, x: 3 })), A.div(4));           // −4(x + 2) = −20, ¼
    expect(boardText(s.board)).toBe('−(x + 2) = −5');
    expect(shapeOf(s).id).toBe('P2');
    s = run(s, A.flip());
    expect(boardText(s.board)).toBe('x + 2 = −(−5)');
    expect(shapeOf(s).id).toBe('Q1');
    s = flow(s, [A.add(-2), A.check(3)]);
    expect(s.stage).toBe('done');
  });
  it('Add at the parenthesis does not cancel the 2 inside it: Add’s words, then Undo', () => {
    const s = run(start(p), A.add(-2));
    expect(s.needUndo).toBe(true);
    expect(s.lights.fewer).toBe('red');
    expect(boardText(s.board)).toBe('3(x + 2) − 2 = 15 − 2');
  });
});

describe('the rules of each level', () => {
  it('Level 2: a negative factor needs no tap (−2 is the factor); Flip first is helpful too', () => {
    const p = P({ level: 2, f: -2, c: 4, x: -7 });
    let s = run(start(p), (st) => A.dist(st));
    expect(boardText(s.board)).toBe('−2x − 8 = 6');
    expect(s.lx.negIds).toHaveLength(1);                                         // the −8 shows as "+ −8", as in the notes
    s = solvePath(start(p), { flipFirst: true });
    expect(s.stage).toBe('done');
    let f = run(start(p), A.flip());
    expect(boardText(f.board)).toBe('2(x + 4) = −6');
    expect(f.needUndo).toBe(false);
    f = run(start(P({ f: 3, c: 2, x: 3 })), A.flip());                           // a flip of a plus factor makes it worse: waits for Undo
    expect(f.needUndo).toBe(true);
  });
  it('Level 3: n + a(x ± c): Divide and Flip need each side to be one term; Add −n first is helpful too', () => {
    const p = P({ level: 3, n: 5, f: 2, c: 3, x: 5 });                           // 5 + 2(x + 3) = 21
    let s = start(p);
    expect(optionOf('div', s)).toBe('grey');
    expect(run(s, [{ type: 'multOpen' }, { type: 'multPick', kind: 'div' }]).feedback.key).toBe('wOneTerm');
    s = run(s, A.add(-5));
    expect(boardText(s.board)).toBe('2(x + 3) = 21 − 5');
    expect(shapeOf(s).id).toBe('P6');
    expect(s.lights.fewer).toBe('green');
    s = run(s, combine(s, 'other'));
    expect(shapeOf(s).id).toBe('P1');
    expect(optionOf('div', s)).toBe('live');
    s = solvePath(s);
    expect(s.stage).toBe('done');
  });
  it('Level 4: the minus before the factor is tapped first, as in the drill: 5 − 2(x + 2) = 7', () => {
    const p = P({ level: 4, n: 5, f: -2, c: 2, x: -3 });
    let s = start(p);
    const refused = run(s, [{ type: 'lxDistribute', id: groupOf(s).id }]);
    expect(refused.feedback).toMatchObject({ key: 'dxTapMinusFirst', params: { factor: '−2' } });
    expect(refused.lx.distribute).toBeFalsy();
    s = run(s, A.stuck());
    expect(s.feedback.key).toBe('mTapMinusHint');
    s = run(s, A.minus(s));
    expect(s.lx.negIds).toContain(groupOf(s).id);
    s = run(s, A.dist(s));
    expect(boardText(s.board)).toBe('5 + −2x − 4 = 7');                                     // (on screen: 5 + −2x + −4 = 7)
    expect(s.lx.negIds).toHaveLength(2);                                          // written 5 + −2x + −4 = 3
    expect(shapeOf(s).id).toBe('E1');
    expect(run(s, A.stuck()).feedback.key).toBe('mCombineHint');
    // an Add that cancels one of the two numbers is helpful (the other stays); one that cancels neither waits for Undo
    const one = run(s, A.add(-5));
    expect(boardText(one.board)).toBe('−2x − 4 = 7 − 5');
    expect(one.lights.fewer).toBe('green');
    expect(shapeOf(one).id).toBe('E4');
    const bad = run(s, A.add(3));
    expect(bad.needUndo).toBe(true);
    expect(boardText(bad.board)).toBe('5 + −2x − 4 + 3 = 7 + 3');
    // the sizes added (5 + −4 typed 9) is a wrong sum, recorded with its tag
    const sizes = run(s, combine(s, 'x side', '9'));
    expect(sizes.feedback.key).toBe('lxCombineWrong');
    expect(sizes.answers.at(-1)).toEqual({ typed: '9', tag: 'sizes-added' });
    // the sign lost on the product: −2 · 2 typed 4
    const lost = run(run(start(p), (st) => A.minus(st)), (st) => A.dist(st, [-2, 4]));
    expect(lost.feedback.params.tag).toBe('dist-sign-lost');
    expect(solvePath(start(p)).stage).toBe('done');
  });
  it('Level 5: two x-terms are combined by typing every piece, the x too; a bare number is sent back', () => {
    const p = P({ level: 5, f: 3, c: 2, bx: 2, x: 3 });                          // 3(x + 2) + 2x = 21
    let s = run(start(p), (st) => A.dist(st));
    expect(boardText(s.board)).toBe('3x + 6 + 2x = 21');
    expect(shapeOf(s).id).toBe('E2');
    expect(run(s, A.stuck()).feedback).toMatchObject({ key: 'mCombineHint', params: { g1: '3x', g2: '2x' } });
    const bare = run(s, combine(s, 'x', '5'));
    expect(bare.feedback.key).toBe('dxTypeX');
    expect(bare.lx.combine).not.toBe(null);
    expect(bare.needUndo).toBe(false);
    const wrong = run(s, combine(s, 'x', '6x'));
    expect(wrong.feedback.key).toBe('lxCombineWrong');
    expect(DIST_SPOT.error(wrong)).toBeTruthy();
    s = run(s, combine(s, 'x'));
    expect(boardText(s.board)).toBe('5x + 6 = 21');
    expect(solvePath(start(P({ level: 5, f: 3, c: -1, bx: -1, xFirst: true, x: 4 }))).stage).toBe('done');
  });
  it('the forced move: after a right guess with no move, the next problem needs a move; distributing or dividing first counts', () => {
    const p = P({ f: 3, c: 2, x: 3 });
    const s = start(p, { forceMove: true });
    expect(run(s, [{ type: 'focus', target: 'answer' }, ...digits(3)]).entry).toBe('');
    const d = run(s, A.dist(s));
    expect(d.movedOnce).toBe(true);
    expect(run(d, [{ type: 'focus', target: 'answer' }, ...digits(3)]).entry).toBe('3');
    expect(run(s, A.div(3)).movedOnce).toBe(true);
  });
});

describe('the shapes: every level, 40 seeds, along every path', () => {
  it('reaches no unknown shape; every new shape has an entry and is reached', () => {
    for (const level of range(1, 5)) {
      for (let seed = 1; seed <= 40; seed++) {
        for (const p of generateDistSolveLevel(level, seed)) {
          const where = `L${level} s${seed} ${formatDistSolve(p)}`;
          const s0 = run(start(p), A.stuck(), where);
          solvePath(s0);
          if (p.f < 0) solvePath(start(p), { flipFirst: true });
          // the slips, each undone (then I'm stuck)
          const s1 = groupOf(s0).factor < 0 && s0.board[xSide(s0)].indexOf(groupOf(s0)) > 0 ? run(s0, A.minus(s0), where) : s0;
          const g = groupOf(s1);
          flow(s1, [(st) => A.dist(st, [g.factor, g.inner[1].v]), A.undo(), A.stuck()], where);
          flow(s1, [(st) => A.dist(st, [g.factor, -g.factor * g.inner[1].v]), A.undo(), A.stuck()], where);
          flow(s0, [A.add(-g.inner[1].v), A.stuck(), A.undo(), A.stuck()], where);
          flow(s0, [A.check(p.x + 1), A.undo(), A.stuck()], where);
          // dividing first, where each side is one term
          if (!p.n && !p.bx) {
            let q = run(s0, A.div(p.f), where);
            q = flow(q, [A.stuck(), A.add(p.c + 1), A.undo(), A.add(-p.c), A.stuck()], where);
            run(q, A.check(p.x), where);
          }
          // Add the number before the parenthesis first
          if (p.n) {
            const q = flow(s0, [A.add(-p.n), A.stuck()], where);
            flow(q, [(st) => combine(st, 'other'), A.stuck()], where);
          }
          // after distributing: an Add before putting the numbers together, a wrong sum
          const d = run(s1, A.dist(s1), where);
          flow(d, [A.stuck(), A.add(1), A.undo()], where);
          if (xSideNums(d).length >= 2) flow(d, [A.add(-xSideNums(d)[0].v), A.stuck(), (st) => combine(st, 'other'), A.stuck()], where);
        }
      }
    }
    const counts = Object.fromEntries([...seen.entries()].sort());
    console.log('distribute shape counts', JSON.stringify(counts));
    for (const id of ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'E1', 'E2', 'E4', 'Q1', 'Q2', 'Q3', 'W1', 'W2', 'D1', 'F2', 'F5']) expect(counts[id] ?? 0, id).toBeGreaterThan(0);
    for (const id of Object.keys(SHAPES)) expect(REGISTRY[id], `registry entry for ${id}`).toBeTruthy();
  }, 120_000);
});

describe('rows and fit', () => {
  // Rows on screen at worst: the most rows the work stack holds on the honest path and its slips, plus the ghost row, plus the x = row;
  // the check beside it (a wrong value is always full) is the equation, a line per operation, and the mark.
  it('reports the worst-case rows (200 seeds a level)', () => {
    const worst = {};
    for (const level of range(1, 5)) {
      let most = 0;
      let check = 0;
      for (let seed = 1; seed <= SEEDS; seed++) {
        for (const p of generateDistSolveLevel(level, seed)) {
          let s = start(p);
          const track = (st) => { most = Math.max(most, st.rows.length); return st; };
          const g = groupOf(s);
          if (g.factor < 0 && s.board[xSide(s)].indexOf(g) > 0) s = track(run(s, A.minus(s)));
          s = track(run(s, A.dist(s)));
          if (s.board[xSide(s)].filter((t) => t.kind === 'x').length >= 2) s = track(run(s, combine(s, 'x')));
          if (xSideNums(s).length >= 2) s = track(run(s, combine(s, 'x side')));
          s = track(run(s, A.add(-xSideNums(s)[0].v)));
          s = track(run(s, combine(s, 'other')));
          if (s.board[xSide(s)][0].coef < 0) s = track(run(s, A.flip()));
          s = track(run(s, A.div(s.board[xSide(s)][0].coef)));
          check = Math.max(check, substitutionLines(newDistSolve(p).board, p.x + 1).lines.length + 2);
        }
      }
      worst[level] = { stack: most, ghost: 1, answer: 1, check, total: most + 2 };
    }
    console.log('distribute worst-case rows', JSON.stringify(worst));
    for (const level of range(1, 5)) expect(worst[level].total).toBeLessThanOrEqual(13);
  }, 120_000);
});

describe('the pack', () => {
  it('sits in Solve it after Two-step equations, five saved levels shown as saved, with its practice link to Build it', () => {
    expect(SECTIONS.find((s) => s.id === 'solve').packs).toEqual(['add-both', 'divide-it', 'flip-everything', 'one-step', 'two-step-equations', 'distribute-solve', 'multi-step']);
    expect(distributeSolve).toMatchObject({ id: 'distribute-solve', title: 'Distribute, combine, solve', levels: 5, practice: { pack: 'distribute-combine' } });
    expect(distributeSolve.firstLevel).toBeUndefined();
    expect(PACKS.filter((p) => !p.comingSoon && p.levels).length).toBe(15);        // the class sheet takes up to 30
  });
});
