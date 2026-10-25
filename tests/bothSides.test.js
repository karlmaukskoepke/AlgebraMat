// Variables on both sides (Build R, basic form): the problems, the worked example, Add's two options, an x-term dragged across the =, x = held
// back until x is on one side, the slips, the lights, the shapes and their help, the check with two x's, and the save codes.
import { describe, it, expect } from 'vitest';
import { makeBoth, formatBoth, tagBoth, slipValuesOf, sideAt, linear } from '../src/engine/bothSides.js';
import { generateBothLevel, BOTH_LEVEL_COUNT, slipCollisions, MAX_NUM } from '../src/engine/generateBoth.js';
import { newBothSides, BOTH_LAYER, BOTH_SPOT, solve, xBoth, addToBoth } from '../src/engine/cards/bothSides.js';
import { startLights } from '../src/engine/addBothLights.js';
import { withSpotlight } from '../src/engine/spotlight.js';
import { shapeOf, shapeOfBoard, UNKNOWN } from '../src/engine/solveit/shape.js';
import { REGISTRY } from '../src/engine/solveit/registry.js';
import { boardText, substitutionLines, lineText } from '../src/engine/solveTerms.js';
import { PACKS, SECTIONS, variablesBothSides } from '../src/packs/index.js';
import { newProgress, encodeProgress, decodeProgress, CODE_VERSION } from '../src/engine/progress.js';
import { bothSidesFeedbackText } from '../src/view/bothSidesFeedback.js';

const SEEDS = 200;
const layer = withSpotlight(BOTH_LAYER, BOTH_SPOT);
const start = (p) => startLights(newBothSides({ ...p, logLevel: p.level }, { level: p.level }));
const run = (s, actions) => actions.reduce((st, a) => layer(st, a), s);
const digits = (n) => [...String(Math.abs(n))].map((d) => ({ type: 'digit', digit: Number(d) })).concat(n < 0 ? [{ type: 'toggleSign' }] : []);
const X = (c) => ({ k: 'x', c });
const N = (v) => ({ k: 'n', v });
const G = (f, c) => ({ k: 'g', f, c });
const worked = () => makeBoth({ level: 2, left: [X(5), N(2)], right: [X(3), N(10)], x: 4 });     // 5x + 2 = 3x + 10
const combineFirst = (s, side, kind, typed) => {
  const [a, b] = s.board[side].filter((t) => t.kind === kind);
  const keys = [...String(typed)].map((ch) => (ch === 'x' ? { type: 'typeChar', ch: 'x' } : ch === '-' ? { type: 'toggleSign' } : { type: 'digit', digit: Number(ch) }));
  return run(s, [{ type: 'lxDrop', id: b.id, slot: { side, onto: a.id } }, ...keys, { type: 'lxApply' }]);
};

describe('the problems', () => {
  it('every level, 200 seeds: five problems, whole answers 2 to 9 in size (never 0 or ±1), no repeats, verified by substitution', () => {
    for (let level = 1; level <= BOTH_LEVEL_COUNT; level++) {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const set = generateBothLevel(level, seed);
        expect(set).toHaveLength(5);
        expect(new Set(set.map((p) => p.x)).size).toBe(5);
        expect(new Set(set.map(formatBoth)).size).toBe(5);
        for (const p of set) {
          expect(Math.abs(p.x)).toBeGreaterThanOrEqual(2);
          expect(Math.abs(p.x)).toBeLessThanOrEqual(9);
          expect(sideAt(p.left, p.x)).toBe(sideAt(p.right, p.x));
          const L = linear(p.left);
          const R = linear(p.right);
          expect(L.a).not.toBe(R.a);                                                      // the numbers in front of x differ
          expect(Math.abs(L.a - R.a)).toBeGreaterThanOrEqual(2);
          expect(Math.abs(L.a - R.a)).toBeLessThanOrEqual(6);
          for (const q of [...p.left, ...p.right]) {
            if (q.k === 'n') { expect(q.v).not.toBe(0); expect(Math.abs(q.v)).toBeLessThanOrEqual(MAX_NUM); }
            if (q.k === 'x') { expect(Math.abs(q.c)).toBeGreaterThanOrEqual(2); expect(Math.abs(q.c)).toBeLessThanOrEqual(9); }
            if (q.k === 'g') expect(Math.abs(q.f * q.c)).toBeLessThanOrEqual(MAX_NUM);
          }
          expect(slipValuesOf(p).some((sl) => sl.v === p.x)).toBe(false);              // no accidental balances
        }
      }
    }
  });
  it('each level has its form and sign mix', () => {
    for (let seed = 1; seed <= 40; seed++) {
      expect(generateBothLevel(1, seed).every((p) => p.left.length === 1 && p.left[0].c > p.right[0].c && p.right[0].c > 0)).toBe(true);
      expect(generateBothLevel(2, seed).every((p) => p.left[0].c > p.right[0].c)).toBe(true);
      expect(generateBothLevel(3, seed).every((p) => p.right[0].c > p.left[0].c)).toBe(true);
      const l2 = generateBothLevel(2, seed);
      expect(l2.some((p) => p.left[1].v < 0)).toBe(true);
      const l4 = generateBothLevel(4, seed);
      expect(l4.some((p) => p.left[0].c < 0) && l4.some((p) => p.right[0].c < 0) && l4.some((p) => p.x < 0)).toBe(true);
      const l5 = generateBothLevel(5, seed);
      expect(l5.every((p) => p.left[0].k === 'g')).toBe(true);
      expect(l5.some((p) => p.right[0].k === 'g') && l5.some((p) => p.right[0].k === 'x')).toBe(true);
    }
  });
  it('writes the equations as they are said', () => {
    expect(formatBoth(worked())).toBe('5x + 2 = 3x + 10');
    expect(formatBoth(makeBoth({ level: 4, left: [X(-2), N(3)], right: [X(1), N(-6)], x: 3 }))).toBe('−2x + 3 = x − 6');
    expect(formatBoth(makeBoth({ level: 5, left: [G(2, -1)], right: [G(4, 3)], x: -7 }))).toBe('2(x − 1) = 4(x + 3)');
  });
  it('reports the slip collisions (for the build report)', () => {
    const report = Object.fromEntries([1, 2, 3, 4, 5].map((l) => [l, slipCollisions(l, SEEDS).counts]));
    expect(report).toBeTruthy();
    console.log('Variables on both sides, slip collisions per level (200 seeds):', JSON.stringify(report));
  });
});

describe('the worked example, 5x + 2 = 3x + 10', () => {
  it('drag 3x across (−3x), combine to 2x, Add −2, combine, divide by 2, type 4: the check drops 4 into each x', () => {
    let s = start(worked());
    expect(shapeOf(s).id).toBe('V1');
    expect(solve.answerLive(s)).toBe(false);                                         // x on both sides: x = waits
    expect(run(s, [{ type: 'focus', target: 'answer' }, ...digits(4)]).entry).toBe('');
    s = run(s, [{ type: 'lxDrop', id: s.board.right[0].id, slot: { side: 'left', at: 2 } }]);
    expect(boardText(s.board)).toBe('5x + −3x + 2 = 10');
    expect(s.rows.at(-2).work).toMatchObject({ amount: -3, x: true });
    expect(s.lights).toMatchObject({ xone: 'green', fewer: 'green' });
    expect(solve.answerLive(s)).toBe(true);
    s = combineFirst(s, 'left', 'x', '2x');
    expect(boardText(s.board)).toBe('2x + 2 = 10');
    s = run(s, [{ type: 'choose', move: 'add' }, ...digits(-2), { type: 'go' }]);
    expect(boardText(s.board)).toBe('2x = 10 − 2');
    s = combineFirst(s, 'right', 'num', 8);
    s = run(s, [{ type: 'divPick' }, { type: 'digit', digit: 2 }, { type: 'go' }]);
    expect(boardText(s.board)).toBe('x = ½(8)');
    s = run(s, [{ type: 'focus', target: 'answer' }, ...digits(4), { type: 'check' }]);
    expect(s.sub).toMatchObject({ xs: 2, placing: true });
    s = run(s, [{ type: 'placeValue', index: 1 }]);
    expect(s.sub).toMatchObject({ placing: true, filled: [1] });
    s = run(s, [{ type: 'placeValue', index: 0 }]);
    expect(s.sub.lines.map(lineText)).toEqual(['5(4) + 2 = 3(4) + 10', '20 + 2 = 3(4) + 10', '22 = 3(4) + 10', '22 = 12 + 10', '22 = 22']);
    s = run(s, Array(5).fill({ type: 'nextLine' }));
    expect(s.stage).toBe('done');
    expect(s.clean).toBe(true);
  });
  it('the Add button\'s x-term option does the same as the drag', () => {
    let s = start(worked());
    s = run(s, [{ type: 'choose', move: 'add' }, { type: 'addPick', kind: 'x' }, ...digits(-3), { type: 'go' }]);
    expect(boardText(s.board)).toBe('5x + −3x + 2 = 10');
    expect(s.needUndo).toBe(false);
    // moving the left x-term instead is helpful too: x ends on the right
    let t = start(worked());
    t = run(t, [{ type: 'addPick', kind: 'x' }, ...digits(-5), { type: 'go' }]);
    expect(boardText(t.board)).toBe('2 = 3x + −5x + 10');
    expect(t.lights.fewer).toBe('green');
  });
  it('a number may be moved first: helpful when it cancels, x = still waits', () => {
    const s = run(start(worked()), [{ type: 'choose', move: 'add' }, ...digits(-2), { type: 'go' }]);
    expect(boardText(s.board)).toBe('5x = 3x + 10 − 2');
    expect(s.needUndo).toBe(false);
    expect(solve.answerLive(s)).toBe(false);
    expect(xBoth(s.board)).toBe(true);
  });
  it('Divide, Fraction and Flip wait until each side is one term (and x is on one side): "Get x on one side first."', () => {
    const s = run(start(worked()), [{ type: 'divPick' }]);
    expect(s.feedback.key).toBe('vOneSide');
    expect(bothSidesFeedbackText(s.feedback)).toBe('Get x on one side first.');
  });
});

describe('the slips: the spotlight, Undo, then the hint', () => {
  it('adding 3x instead of −3x cancels no x-term (Build T): "Add so that one x-term cancels. To cancel 3x, add −3x.", Undo, then Add −3x ready', () => {
    let s = run(start(worked()), [{ type: 'addPick', kind: 'x' }, ...digits(3), { type: 'go' }]);
    expect(s.feedback).toMatchObject({ key: 'vNoCancelX', bad: true, params: { term: '3x', amount: '−3x' } });
    expect(bothSidesFeedbackText(s.feedback)).toBe('Add so that one x-term cancels. To cancel 3x, add −3x. Press Undo.');
    expect(BOTH_SPOT.error(s)).toMatchObject({ target: 'lastMove', label: 'nothing cancels' });
    expect(s.lights.fewer).toBe('red');
    s = run(s, [{ type: 'undo' }]);
    expect(boardText(s.board)).toBe('5x + 2 = 3x + 10');
    expect(s.feedback).toMatchObject({ key: 'vZeroHint', params: { amount: '−3x', term: '3x' } });
    expect(s.spot).toMatchObject({ kind: 'hint', target: 'hinted' });
    expect([s.menu, s.addKind, s.amountEntry]).toEqual(['add', 'x', '-3']);
    expect(s.hint).toMatchObject({ kind: 'cancel', id: s.board.right[0].id });
  });
  it('an x-term that only partly cancels is the same: it cancels no x-term (Build T)', () => {
    const s = run(start(worked()), [{ type: 'addPick', kind: 'x' }, ...digits(-2), { type: 'go' }]);
    expect(s.feedback).toMatchObject({ key: 'vNoCancelX', params: { term: '3x', amount: '−3x' } });
    expect(s.lights.fewer).toBe('neutral');
  });
  it('a bare number for two x-terms is sent back with the picture; adding the sizes is tagged', () => {
    let s = run(start(worked()), [{ type: 'lxDrop', id: start(worked()).board.right[0].id, slot: { side: 'left', at: 2 } }]);
    s = start(worked());
    s = run(s, [{ type: 'lxDrop', id: s.board.right[0].id, slot: { side: 'left', at: 2 } }]);
    const bare = combineFirst(s, 'left', 'x', '2');
    expect(bare.feedback.key).toBe('dxXBoxes');
    const sizes = combineFirst(s, 'left', 'x', '8x');
    expect(sizes.feedback.key).toBe('lxCombineWrong');
    expect(sizes.tags).toContain('sizes-added');
  });
  it('the typed value slips are tagged (new tags); a typed value is never accepted while x is on both sides', () => {
    const p = worked();
    expect(tagBoth(p, 4)).toBeNull();
    expect(tagBoth(p, 1)).toBe('x-sign-lost');                                       // (10 − 2) / (5 + 3)
    expect(tagBoth(p, -4)).toBe('sign-flipped');
  });
  it('x on one side already: dragging x across is refused with the info pop-up', () => {
    let s = start(worked());
    s = run(s, [{ type: 'lxDrop', id: s.board.right[0].id, slot: { side: 'left', at: 2 } }]);
    const x = s.board.left[0];
    const out = run(s, [{ type: 'lxDrop', id: x.id, slot: { side: 'right', at: 1 } }]);
    expect(out.feedback.key).toBe('lxXCross');
    expect(boardText(out.board)).toBe(boardText(s.board));
  });
});

describe('Trade places, Level 5 and the shapes', () => {
  it('Level 3: moving the left x-term leaves x on the right; Trade places swaps the sides', () => {
    const p = makeBoth({ level: 3, left: [X(3), N(5)], right: [X(5), N(-9)], x: 7 });          // 3x + 5 = 5x − 9
    let s = run(start(p), [{ type: 'lxDrop', id: start(p).board.left[0].id, slot: { side: 'right', at: 2 } }]);
    s = start(p);
    s = run(s, [{ type: 'lxDrop', id: s.board.left[0].id, slot: { side: 'right', at: 2 } }]);
    expect(boardText(s.board)).toBe('5 = 5x + −3x − 9');
    s = combineFirst(s, 'right', 'x', '2x');
    s = run(s, [{ type: 'choose', move: 'trade' }]);
    expect(boardText(s.board)).toBe('2x − 9 = 5');
    expect(s.tradeCount).toBe(1);
  });
  it('Level 5: distribute first (Build M\'s move), then as above; VP reminds to distribute', () => {
    const p = makeBoth({ level: 5, left: [G(5, 3)], right: [X(7), N(3)], x: 6 });             // 5(x + 3) = 7x + 3
    let s = start(p);
    expect(shapeOf(s).id).toBe('VP');
    expect(run(s, [{ type: 'stuck' }]).feedback.key).toBe('mDistributeHint');
    const g = s.board.left[0];
    s = run(s, [{ type: 'lxDistribute', id: g.id }, { type: 'focus', target: 'dist', index: 0 }, ...digits(5), { type: 'focus', target: 'dist', index: 1 }, ...digits(15), { type: 'lxApply' }]);
    expect(boardText(s.board)).toBe('5x + 15 = 7x + 3');
    expect(shapeOf(s).id).toBe('V1');
    expect(s.lights.noparen).toBe('green');
  });
  it('every state the walks reach has a known shape with an entry; x on both sides is never unknown', () => {
    const seen = new Map();
    for (let level = 1; level <= 5; level++) {
      for (let seed = 1; seed <= 20; seed++) {
        for (const p of generateBothLevel(level, seed)) {
          let s = start(p);
          const note = () => {
            const sh = shapeOf(s);
            expect(sh.id, `${formatBoth(p)}: ${boardText(s.board)} ${sh.why ?? ''}`).not.toBe(UNKNOWN);
            expect(REGISTRY[sh.id], `${sh.id}`).toBeTruthy();
            seen.set(sh.id, (seen.get(sh.id) ?? 0) + 1);
          };
          note();
          const g = s.board.left.find((t) => t.kind === 'group');
          for (const grp of [...s.board.left, ...s.board.right].filter((t) => t.kind === 'group')) {
            s = run(s, [{ type: 'lxDistribute', id: grp.id }, ...grp.inner.flatMap((t, k) => [{ type: 'focus', target: 'dist', index: k }, ...digits(grp.factor * (t.kind === 'x' ? 1 : t.v))]), { type: 'lxApply' }]);
            note();
          }
          void g;
          const sh = shapeOf(s);
          if (sh.id !== 'V1') continue;
          s = run(s, [{ type: 'lxDrop', id: sh.params.small, slot: { side: sh.params.from === 'left' ? 'right' : 'left', at: 0 } }]);
          note();
          const xSideName = s.board.left.some((t) => t.kind === 'x') ? 'left' : 'right';
          const xs = s.board[xSideName].filter((t) => t.kind === 'x');
          if (xs.length === 2) { s = combineFirst(s, xSideName, 'x', `${xs[0].coef + xs[1].coef}x`); note(); }
        }
      }
    }
    expect(seen.get('V1')).toBeGreaterThan(0);
    expect(seen.get('VP')).toBeGreaterThan(0);
    console.log('Variables on both sides, shapes reached:', JSON.stringify(Object.fromEntries([...seen.entries()].sort())));
  });
  it('the classifier is order-free and mirrored', () => {
    const t = (kind, v) => (kind === 'x' ? { id: `i${v}`, kind: 'x', coef: v } : { id: `n${v}`, kind: 'num', v });
    expect(shapeOfBoard({ left: [t('num', 2), t('x', 5)], right: [t('num', 10), t('x', 3)] }, 'both').id).toBe('V1');
    expect(shapeOfBoard({ left: [t('num', 10), t('x', 3)], right: [t('x', 5), t('num', 2)] }, 'both').id).toBe('V1');
    expect(shapeOfBoard({ left: [t('num', 2)], right: [t('x', 3), t('x', -5)] }, 'both')).toMatchObject({ id: 'E2', r: true });
  });
});

describe('the Add move\'s board', () => {
  it('cancels the opposite on each side and writes the amount elsewhere; a side left empty says 0', () => {
    const b = { left: [{ id: 'a', kind: 'x', coef: 5 }], right: [{ id: 'b', kind: 'x', coef: 5 }, { id: 'c', kind: 'num', v: 10 }] };
    const out = addToBoth(b, -5, true);
    expect(boardText(out.board)).toBe('0 = 10');
    expect(out.hit).toEqual(['left', 'right']);
  });
});

describe('the pack, save codes and the class sheet', () => {
  it('sits in Solve it after Distribute, combine, solve; replaces the "Multi-step equations (soon)" placeholder; five levels', () => {
    expect(SECTIONS.find((s) => s.id === 'solve').packs.at(-1)).toBe('variables-both-sides');
    expect(PACKS.some((p) => p.id === 'multi-step')).toBe(false);
    expect(variablesBothSides).toMatchObject({ title: 'Variables on both sides', levels: 5 });
    expect(PACKS.filter((p) => !p.comingSoon && p.levels).length).toBe(16);            // the class sheet takes up to 30
  });
  it('v18 codes carry its five levels; every older code decodes as before and round-trips', () => {
    expect(CODE_VERSION).toBe(18);
    const prog = newProgress(PACKS);
    prog.packs['variables-both-sides'].levels = [true, false, true, true, false];
    prog.packs['distribute-solve'].levels = [true, true, false, false, true];
    const code = encodeProgress(prog);
    expect(decodeProgress(code, PACKS).packs['variables-both-sides'].levels).toEqual([true, false, true, true, false]);
    expect(decodeProgress(code, PACKS).packs['distribute-solve'].levels).toEqual([true, true, false, false, true]);
    for (let v = 1; v <= 17; v++) {
      const old = encodeProgress(prog, v);
      const back = decodeProgress(old, PACKS);
      expect(back, `v${v}`).toBeTruthy();
      expect(back.packs['variables-both-sides'].levels).toEqual([false, false, false, false, false]);
      expect(decodeProgress(encodeProgress(back), PACKS)).toEqual(back);
    }
    expect(substitutionLines).toBeTruthy();
  });
});
