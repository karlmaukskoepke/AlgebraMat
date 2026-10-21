import { describe, it, expect } from 'vitest';
import { addBoth, divideIt, flipEverything } from '../src/packs/index.js';
import { newFlip, reduceFlip, FLIP_MENU, FLIP_SPOT } from '../src/engine/cards/flip.js';
import { withSpotlight } from '../src/engine/spotlight.js';
import { reduceAddBoth } from '../src/engine/cards/add.js';
import { newLightsSession, withLights } from '../src/engine/addBothLights.js';
import { newDivide, reduceDivide } from '../src/engine/divideMoves.js';
import { constantOf } from '../src/engine/addBoth.js';
import { shapeOf, shapeOfBoard, lightsOf, SHAPES, UNKNOWN } from '../src/engine/solveit/shape.js';

// Build E, P2: the shape classifier on the generators' real output. Every state along the optimal path and the common slips must have a
// known shape: an unknown one fails here, loudly, with the board that caused it.
const SEEDS = 40;                                     // 40 seeds × 5 problems = 200 problems per level
const type = (n) => [...String(Math.abs(n))].map((d) => ({ type: 'digit', digit: Number(d) })).concat(n < 0 ? [{ type: 'toggleSign' }] : []);
const addMove = (k) => [{ type: 'choose', move: 'add' }, ...type(k), { type: 'go' }];
const check = (v) => [...type(v), { type: 'check' }, { type: 'placeValue' }, { type: 'nextLine' }, { type: 'nextLine' }];

const seen = new Map();
function known(s, where) {
  const sh = shapeOf(s);
  if (sh.id === UNKNOWN) throw new Error(`unknown shape (${sh.why}) at ${where}: ${JSON.stringify(s.board)}`);
  seen.set(sh.id, (seen.get(sh.id) ?? 0) + 1);
  return sh;
}
function walk(start, reduce, actions, where) {
  let s = start;
  const out = [known(s, `${where} start`)];
  actions.forEach((a, i) => { s = reduce(s, a); out.push(known(s, `${where} #${i} ${JSON.stringify(a)}`)); });
  return { s, shapes: out.map((x) => x.id) };
}
const problemsOf = (pack, level) => Array.from({ length: SEEDS }, (_, i) => pack.generate(level, i + 1)).flat();

describe('Build E, P2: the shape of every state on Add to both sides', () => {
  const raw = (p, level) => newLightsSession({ ...p, logLevel: level }, { level });
  const lit = withLights(reduceAddBoth);
  for (let level = 2; level <= 6; level++) {
    it(`Level ${level}: ${SEEDS * 5} problems, the optimal path and the slips`, () => {
      const list = problemsOf(addBoth, level);
      expect(list.length).toBeGreaterThanOrEqual(200);
      for (const p of list) {
        const c = constantOf(p);
        const where = `L${level} ${JSON.stringify(p)}`;
        const start = raw(p, level);
        const first = known(start, where);
        expect(first.id).toBe('S1');
        expect(first.r).toBe(Boolean(p.mirror));
        // optimal: the opposite, then the value
        const opt = walk(start, reduceAddBoth, [...addMove(-c), ...check(p.x)], `${where} optimal`).shapes;
        expect(opt[addMove(-c).length]).toBe('S2');
        // red (the same number again), partly cancelled, zeroed the other side, stacked moves without Undo
        // (a red or partial move that also zeroes the other side is S4)
        expect(['S3', 'S4']).toContain(walk(start, reduceAddBoth, addMove(c), `${where} red`).shapes.at(-1));
        if (Math.abs(c) >= 2) expect(['S3', 'S4']).toContain(walk(start, reduceAddBoth, addMove(-Math.sign(c)), `${where} partial`).shapes.at(-1));
        if (c - p.b !== 0) expect(walk(start, reduceAddBoth, addMove(-p.b), `${where} zero`).shapes.at(-1)).toBe('S4');
        // stacking moves without Undo is no longer possible (Build E: the loop's rule), so S5 and S6 are never reached: a second move waits
        const stacked = walk(start, reduceAddBoth, [...addMove(c), ...addMove(-c)], `${where} stacked`);
        expect(['S3', 'S4']).toContain(stacked.shapes.at(-1));
        expect(stacked.s.feedback.key).toBe('aUndoFirst');
        // the lights layer: the same paths with Next, a wrong guess, Undo
        walk(start, lit, [...addMove(-c), { type: 'lxNext' }, ...check(p.x)], `${where} lights`);
        walk(start, lit, [...check(p.x + 1), { type: 'undo' }, ...addMove(-c)], `${where} wrong guess`);
        // grab the terms: the student's own combining at x alone is the only way to S7
        const alone = walk(start, lit, [...addMove(-c), { type: 'lxNext' }], `${where} grab`).s;
        const side = alone.board.left.some((tm) => tm.kind === 'x') ? 'right' : 'left';
        const [n1, n2] = alone.board[side];
        const sumTyped = walk(alone, lit, [{ type: 'lxDrop', id: n2.id, slot: { side, onto: n1.id } }, ...type(n1.v + n2.v), { type: 'lxApply' }], `${where} combine`);
        expect(sumTyped.shapes.at(-1)).toBe('S7');
        // the seesaw: build (Levels 2-3), one side, both sides, the pairs, x alone
        walk(start, reduceAddBoth, [{ type: 'stuck' }, { type: 'stuck' }, { type: 'stuck' }, { type: 'stuck' },
          { type: 'addTo', side: 'left', amount: -c }, { type: 'addTo', side: 'right', amount: -c }, { type: 'go' }], `${where} seesaw`);
        // Teach me, at the start and at x alone
        walk(start, reduceAddBoth, [{ type: 'teach' }, { type: 'go' }], `${where} teach`);
        walk(start, reduceAddBoth, [...addMove(-c), { type: 'teach' }, { type: 'stuck' }, { type: 'stuck' }], `${where} alone`);
        if (p.mirror && level >= 5) walk(start, reduceAddBoth, [{ type: 'choose', move: 'trade' }, ...addMove(-c)], `${where} trade`);
      }
    });
  }
  it('reaches the seesaw shapes: T0 while building, T1 after one side, T2 after both', () => {
    const p = addBoth.generate(2, 1)[0];
    const c = constantOf(p);
    const built = walk(raw(p, 2), reduceAddBoth, [{ type: 'stuck' }, { type: 'stuck' }], 'build').shapes;
    expect(built.at(-1)).toBe('T0');
    const p4 = addBoth.generate(4, 1)[0];
    const c4 = constantOf(p4);
    const sea = walk(raw(p4, 4), reduceAddBoth, [{ type: 'stuck' }, { type: 'stuck' }, { type: 'stuck' }, { type: 'addTo', side: 'left', amount: -c4 }, { type: 'addTo', side: 'right', amount: -c4 }], 'sea').shapes;
    expect(sea.slice(-2)).toEqual(['T1', 'T2']);
    expect(c).not.toBe(0);
  });
  it('is order-free: c + x = b and x + c = b are the same shape', () => {
    const b = { left: [{ kind: 'num', v: -2 }, { kind: 'x' }], right: [{ kind: 'num', v: 5 }] };
    expect(shapeOfBoard(b)).toMatchObject({ id: 'S1', params: { c: -2, b: 5 } });
  });
});

describe('Build E, P2: the shape of every state on Divide it', () => {
  for (let level = 2; level <= 6; level++) {
    it(`Level ${level}: ${SEEDS * 5} problems, the move, a partial move and a fraction that does not split`, () => {
      const list = problemsOf(divideIt, level);
      expect(list.length).toBeGreaterThanOrEqual(200);
      for (const p of list) {
        const where = `L${level} ${JSON.stringify(p)}`;
        const start = newDivide(p, { level });
        expect(known(start, where).id).toBe('D1');
        const take = (n) => [{ type: 'choose', move: 'fraction' }, { type: 'take', n }];
        expect(walk(start, reduceDivide, [...take(p.a), ...check(p.x), { type: 'nextLine' }, { type: 'nextLine' }], `${where} optimal`).shapes[2]).toBe('D2');
        const bad = [2, 3, 4, 5, 6].find((n) => p.a % n !== 0);
        if (bad) expect(walk(start, reduceDivide, take(bad), `${where} fail`).shapes.at(-1)).toBe('DF');
        const part = [2, 3].find((n) => p.a % n === 0 && n < p.a);
        if (part) expect(walk(start, reduceDivide, [...take(part), { type: 'stuck' }, { type: 'stuck' }], `${where} partial`).shapes[2]).toBe('D1');
        walk(start, reduceDivide, [{ type: 'stuck' }, { type: 'stuck' }, { type: 'teach' }], `${where} help`);
      }
    });
  }
});

describe('Build E, P2: lights from shapes', () => {
  // the rule the cards judged by before Build E, written out: Add counts x's side as if combined; Divide is green on any split
  const oldAdd = (before, after) => {
    const xs = (b) => b[b.left.some((t) => t.kind === 'x') ? 'left' : 'right'];
    const sumx = (b) => xs(b).filter((t) => t.kind === 'num').reduce((a, t) => a + t.v, 0);
    const terms = (b) => 1 + (sumx(b) !== 0 ? 1 : 0);
    const fewer = terms(after) < terms(before) ? 'green' : terms(after) > terms(before) || Math.abs(sumx(after)) > Math.abs(sumx(before)) ? 'red' : 'neutral';
    return { fewer, solved: xs(after).length === 1 ? 'green' : 'off' };
  };
  it('match the old Add rule on every move from every Level 2-6 problem', () => {
    for (let level = 2; level <= 6; level++) {
      for (const p of problemsOf(addBoth, level)) {
        const start = newLightsSession({ ...p, logLevel: level }, { level });
        for (const k of [-15, -9, -4, -1, 1, 2, 7, 15, -constantOf(p), constantOf(p), -p.b]) {
          if (k === 0) continue;
          const s = [{ type: 'choose', move: 'add' }, ...type(k), { type: 'go' }].reduce(reduceAddBoth, start);
          if (s.board === start.board) continue;
          expect(lightsOf(shapeOfBoard(start.board), shapeOfBoard(s.board))).toEqual(oldAdd(start.board, s.board));
          expect(s.lights).toEqual(oldAdd(start.board, s.board));
        }
      }
    }
  });
  it('Divide: Smaller numbers on a split, One box at x alone', () => {
    const s0 = newDivide(divideIt.generate(5, 3).find((p) => p.a === 4) ?? { kind: 'divide', a: 4, b: 8, x: 2 }, { level: 5 });
    const half = [{ type: 'choose', move: 'fraction' }, { type: 'take', n: 2 }].reduce(reduceDivide, s0);
    expect(half.lights).toEqual({ smaller: 'green', onebox: 'off' });
    const one = [{ type: 'choose', move: 'fraction' }, { type: 'take', n: 2 }].reduce(reduceDivide, half);
    expect(one.lights).toEqual({ smaller: 'green', onebox: 'green' });
  });
});

describe('Build J: the shape of every state on Flip everything', () => {
  const r = withSpotlight(FLIP_MENU.withMenu(reduceFlip), FLIP_SPOT);
  const frac = (top, n) => [{ type: 'multOpen' }, { type: 'multPick', kind: 'frac' }, ...(top < 0 ? [{ type: 'typeChar', ch: '-' }] : []), { type: 'digit', digit: 1 }, { type: 'digit', digit: n }, { type: 'go' }];
  const flip = [{ type: 'flipPick' }, { type: 'go' }];
  for (let level = 2; level <= 6; level++) {
    it(`Level ${level}: ${SEEDS * 5} problems, both orders, −⅟a in one move, a flip that makes it worse, a fraction that does not split, the slips`, () => {
      const list = problemsOf(flipEverything, level);
      expect(list.length).toBeGreaterThanOrEqual(200);
      for (const p of list) {
        const where = `L${level} ${JSON.stringify(p)}`;
        const start = newFlip({ ...p, logLevel: level }, { level });
        const trade = p.mirror ? [{ type: 'choose', move: 'trade' }] : [];
        walk(start, r, [...trade, ...flip, ...check(p.x)], `${where} flip`);
        walk(start, r, [...check(-p.x), { type: 'undo' }, { type: 'spotDismiss' }, ...flip, ...check(p.x)], `${where} sign slip, then flip`);
        if (p.a > 1) {
          walk(start, r, [...flip, { type: 'foldNext' }, ...frac(1, p.a), ...check(p.x)], `${where} flip, then fraction`);
          walk(start, r, [...flip, { type: 'foldNext' }, ...flip, { type: 'undo' }, { type: 'spotDismiss' }], `${where} flip twice (worse), Undo`);
          walk(start, r, [...frac(1, p.a), { type: 'foldNext' }, ...flip, ...check(p.x)], `${where} fraction, then flip`);
          walk(start, r, [...frac(-1, p.a), ...check(p.x)], `${where} −⅟a in one move`);
          const bad = [2, 3, 4, 5, 6].find((n) => p.a % n !== 0);
          if (bad) walk(start, r, [...frac(1, bad), { type: 'stuck' }, { type: 'undo' }], `${where} a fraction that does not split`);
        }
      }
    });
  }
});

describe('Build E, P2: unknown shapes fail loudly, never quietly', () => {
  it('x on both sides, no x, a term the classifier does not know', () => {
    expect(shapeOfBoard({ left: [{ kind: 'x' }], right: [{ kind: 'x' }] }).id).toBe(UNKNOWN);
    expect(shapeOfBoard({ left: [{ kind: 'num', v: 1 }], right: [{ kind: 'num', v: 1 }] }).id).toBe(UNKNOWN);
    expect(shapeOfBoard({ left: [{ kind: 'x' }, { kind: 'group', factor: 2, inner: [] }], right: [{ kind: 'num', v: 1 }] })).toMatchObject({ id: UNKNOWN, why: 'a group beside x' });
    expect(() => known({ board: { left: [{ kind: 'x' }], right: [{ kind: 'x' }] } }, 'test')).toThrow(/unknown shape/);
    // Flip everything's family (Build J): x alone with a plain number is never made there; two terms on the other side are not its
    expect(shapeOfBoard({ left: [{ kind: 'x', coef: 1 }], right: [{ kind: 'num', v: 4 }] }, 'flip').id).toBe(UNKNOWN);
    expect(shapeOfBoard({ left: [{ kind: 'x', coef: -1 }], right: [{ kind: 'num', v: 4 }, { kind: 'num', v: 1 }] }, 'flip').id).toBe(UNKNOWN);
    expect(shapeOfBoard({ left: [{ kind: 'x', coef: -2 }], right: [{ kind: 'neg', inner: [{ kind: 'num', v: 4 }] }] }, 'flip').id).toBe(UNKNOWN);
  });
  it('every shape in the list was reached by the walks above (counts for the report)', () => {
    const counts = Object.fromEntries([...seen.entries()].sort());
    // S5 and S6 (moves stacked without Undo) can no longer happen on the shared loop; they stay classified and registered
    const unreachable = ['S5', 'S6'];
    for (const id of Object.keys(SHAPES)) {
      if (unreachable.includes(id)) expect(counts[id] ?? 0, `shape ${id}`).toBe(0);
      else expect(counts[id] ?? 0, `shape ${id}`).toBeGreaterThan(0);
    }
    expect(shapeOfBoard({ left: [{ kind: 'x' }], right: [{ kind: 'num', v: 1 }, { kind: 'num', v: 2 }, { kind: 'num', v: 3 }] }).id).toBe('S5');
    expect(shapeOfBoard({ left: [{ kind: 'x' }, { kind: 'num', v: 1 }], right: [{ kind: 'num', v: 1 }, { kind: 'num', v: 2 }, { kind: 'num', v: 3 }] }).id).toBe('S6');
    console.log('shape counts', JSON.stringify(counts));
  });
});
