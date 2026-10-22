import { describe, it, expect } from 'vitest';
import { PACKS, SECTIONS, twoStepEquations, twoStep as oldTwoStep } from '../src/packs/index.js';
import { makeTwoStep, tagTwoStep, formatTwoStep, constOf, coefOf } from '../src/engine/twoStep.js';
import { generateTwoStepLevel, TWO_STEP_LEVELS, worstCaseRows, slipCollisions, slipSafe } from '../src/engine/generateTwoStep.js';
import { newTwoStep, TWO_STEP_SPOT, TWO_STEP_LAYER, optionOf } from '../src/engine/cards/twoStep.js';
import { newFlip, reduceFlip, FLIP_MENU } from '../src/engine/cards/flip.js';
import { startLights } from '../src/engine/addBothLights.js';
import { withSpotlight } from '../src/engine/spotlight.js';
import { shapeOf, UNKNOWN, SHAPES } from '../src/engine/solveit/shape.js';
import { REGISTRY } from '../src/engine/solveit/registry.js';
import { newProgress, encodeProgress, decodeProgress, CODE_VERSION } from '../src/engine/progress.js';
import { substitutionLines, lineText, equationSegs } from '../src/engine/solveTerms.js';
import { readFileSync } from 'node:fs';

// Build K: the new Two-step equations card, in basic form.

const SEEDS = 200;
const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);

describe('the generator: every level, 200 seeds', () => {
  for (const level of range(1, 7)) {
    it(`Level ${level}: substitution, banned answers, ranges, no repeats, no accidental balance, its forms and signs`, () => {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const set = generateTwoStepLevel(level, seed);
        expect(set).toHaveLength(5);
        expect(new Set(set.map((p) => p.x)).size).toBe(5);
        expect(new Set(set.map(formatTwoStep)).size).toBe(5);
        for (const p of set) {
          expect(coefOf(p) * p.x + constOf(p)).toBe(p.c);
          expect(p.x === 0 || Math.abs(p.x) === 1).toBe(false);                 // banned answers
          expect(Math.abs(p.x)).toBeLessThanOrEqual(9);
          expect(p.a).toBeGreaterThanOrEqual(2); expect(p.a).toBeLessThanOrEqual(5);
          expect(p.b).toBeGreaterThanOrEqual(1); expect(p.b).toBeLessThanOrEqual(12);
          expect(Math.abs(p.c)).toBeLessThanOrEqual(30); expect(p.c).not.toBe(0);
          expect(slipSafe(p)).toBe(true);
        }
        const forms = set.map((p) => p.form);
        if (level === 1) expect(set.every((p) => p.form === 'ax+b' && !p.mirror && p.x > 0)).toBe(true);
        if (level === 2) { expect(set.every((p) => p.form === 'ax-b' && !p.mirror && p.x > 0)).toBe(true); expect(set.some((p) => p.c < 0)).toBe(true); }
        if (level === 3) { expect(set.every((p) => p.mirror && p.x > 0 && p.form !== 'b-ax')).toBe(true); expect(new Set(forms).size).toBe(3); }
        if (level === 4) expect(set.every((p) => p.form === 'b+ax' && !p.mirror && p.x > 0)).toBe(true);
        if (level === 5) { expect(set.every((p) => p.form === 'b-ax' && p.x > 0)).toBe(true); expect(set.filter((p) => p.c < 0).length).toBeGreaterThanOrEqual(2); }
        if (level === 6) { expect(set.every((p) => p.x < 0 && p.form !== 'b-ax')).toBe(true); expect(set.some((p) => p.mirror)).toBe(true); }
        if (level === 7) {
          expect(set.some((p) => p.form === 'b-ax' && p.x < 0) && set.some((p) => p.form === 'b-ax' && p.x > 0)).toBe(true);
          expect(set.some((p) => p.mirror) && set.some((p) => !p.mirror) && set.some((p) => p.x > 0) && set.some((p) => p.x < 0)).toBe(true);
        }
      }
    });
  }
  it('never fails to fill a level (300 seeds), and refuses a banned answer', () => {
    for (const level of range(1, 7)) for (let seed = 1; seed <= 300; seed++) expect(() => generateTwoStepLevel(level, seed)).not.toThrow();
    expect(() => makeTwoStep('ax+b', 3, 4, 1)).toThrow();
    expect(() => makeTwoStep('ax+b', 3, 4, 0)).toThrow();
    expect(() => makeTwoStep('ax+b', 3, 4, -1)).toThrow();
    expect(Object.keys(TWO_STEP_LEVELS)).toHaveLength(7);
  });
  it('reports the worst-case rows and the slip collisions (for the report)', () => {
    const rows = {};
    const slips = {};
    for (const level of range(1, 7)) { rows[level] = worstCaseRows(level).total; slips[level] = slipCollisions(level).counts; }
    console.log('two-step worst-case rows', JSON.stringify(rows), 'slip collisions', JSON.stringify(slips));
    for (const level of range(1, 7)) expect(rows[level]).toBeLessThanOrEqual(13);
  });
  it('tags the declared slips', () => {
    const p = makeTwoStep('ax+b', 3, 4, 5);                       // 3x + 4 = 19
    expect(formatTwoStep(p)).toBe('3x + 4 = 19');
    expect(tagTwoStep(p, 15)).toBe('skipped-fraction');
    expect(tagTwoStep(p, 23)).toBe('added-constant');
    expect(tagTwoStep(p, -5)).toBe('sign-flipped');
    expect(tagTwoStep(p, 5)).toBe(null);
    const q = makeTwoStep('b-ax', 3, 4, 5);                       // 4 − 3x = −11
    expect(formatTwoStep(q)).toBe('4 − 3x = −11');
    expect(tagTwoStep(q, -15)).toBe('skipped-fraction');
  });
  it('writes the check as the loop spec says: 3 × 5 + 4 = 19, and 4 − 3 × 5 = −11', () => {
    const board = (p) => newTwoStep(p).board;
    expect(substitutionLines(board(makeTwoStep('ax+b', 3, 4, 5)), 5).lines.map(lineText)).toEqual(['3 × 5 + 4 = 19', '15 + 4 = 19', '19 = 19']);
    const b = board(makeTwoStep('b-ax', 3, 4, 5));
    expect(equationSegs(b).map((x) => x.text).join('')).toBe('4 − 3x = −11');
    expect(substitutionLines(b, 5).lines.map(lineText)).toEqual(['4 − 3 × 5 = −11', '4 − 15 = −11', '−11 = −11']);
  });
});

// ---------- playing it, through the card's layers as a student does (the spotlight round the term layer round the Multiply menu) ----------

const layer = withSpotlight(TWO_STEP_LAYER, TWO_STEP_SPOT);
const start = (p, level, opts = {}) => startLights(newTwoStep({ ...p, logLevel: level }, { level, ...opts }));
const digits = (n) => [...String(Math.abs(n))].map((d) => ({ type: 'digit', digit: Number(d) })).concat(n < 0 ? [{ type: 'toggleSign' }] : []);
const A = {
  add: (k) => [{ type: 'choose', move: 'add' }, ...digits(k), { type: 'go' }],
  // (Build L: taking ⅓ is dividing by 3 on Multiply's Divide option; −⅓ is dividing by −3)
  frac: (n, sign = 1) => [{ type: 'multOpen' }, { type: 'multPick', kind: 'div' }, ...(sign < 0 ? [{ type: 'toggleSign' }] : []), { type: 'digit', digit: n }, { type: 'go' }],
  flip: () => [{ type: 'flipPick' }, { type: 'go' }],
  trade: () => [{ type: 'choose', move: 'trade' }],
  check: (v) => [{ type: 'focus', target: 'answer' }, ...digits(v), { type: 'check' }, { type: 'placeValue' }, ...Array(6).fill({ type: 'nextLine' })],
};
// combine the two numbers on the side without x: drag the first onto the second, type the sum, apply
function combine(s, typed = null) {
  const side = s.board.left.some((t) => t.kind === 'x') ? 'right' : 'left';
  const [a, b] = s.board[side];
  const sum = typed ?? a.v + b.v;
  return [{ type: 'lxDrop', id: a.id, slot: { side, onto: b.id } }, ...digits(sum), { type: 'lxApply' }];
}
const seen = new Map();
function run(s, actions, where = '') {
  for (const a of actions) {
    s = layer(s, a);
    const sh = shapeOf(s);
    if (sh.id === UNKNOWN) throw new Error(`unknown shape (${sh.why}) at ${where} after ${JSON.stringify(a)}: ${JSON.stringify(s.board)}`);
    seen.set(sh.id, (seen.get(sh.id) ?? 0) + 1);
  }
  return s;
}
const flow = (s, steps, where) => steps.reduce((st, step) => run(st, typeof step === 'function' ? step(st) : step, where), s);

describe('the worked example, 3x + 4 = 19', () => {
  const p = makeTwoStep('ax+b', 3, 4, 5);
  it('Add −4, combine 19 and −4 (typing 15), take ⅓, type 5: solved, nothing combined for the student', () => {
    let s = start(p, 1);
    expect(shapeOf(s).id).toBe('W1');
    s = run(s, A.add(-4));
    expect(shapeOf(s).id).toBe('W2');
    expect(s.board.right.map((t) => t.v)).toEqual([19, -4]);              // the other side stays 19 + −4
    expect(s.lights.fewer).toBe('green');
    s = run(s, combine(s));
    expect(shapeOf(s).id).toBe('D1');
    expect(s.board.right.map((t) => t.v)).toEqual([15]);
    s = run(s, A.frac(3));
    expect(shapeOf(s).id).toBe('F5');
    expect(s.lights.solved).toBe('green');
    s = run(s, A.check(5));
    expect(s.stage).toBe('done');
    expect(s.clean).toBe(true);
  });
  it('Divide and the flip are greyed until each side is one term; Multiply and the general fraction belong to later cards', () => {
    const s = run(start(p, 5), [{ type: 'multOpen' }, { type: 'multPick', kind: 'div' }]);
    expect(s.feedback.key).toBe('wOneTerm');
    expect(run(start(p, 5), [{ type: 'multOpen' }, { type: 'multPick', kind: 'frac' }]).feedback.key).toBe('aLater');
    expect(s.menu).not.toBe('fraction');
    expect(run(start(p, 5), [{ type: 'greyMove', move: 'flip' }]).feedback.key).toBe('wOneTerm');
    expect(run(start(p, 1), [{ type: 'greyMove', move: 'flip' }]).feedback.key).toBe('aLaterLevel');
    expect(run(start(p, 1), [{ type: 'multOpen' }, { type: 'multPick', kind: 'whole' }]).feedback.key).toBe('aLater');
    expect(optionOf('frac', start(p, 1))).toBe('grey');
  });
  it('Add at 3x = 15 (adding −3): the three x boxes, then Undo, then Divide lit with ⅓', () => {
    let s = flow(start(p, 1), [A.add(-4), (st) => combine(st), A.add(-3)]);
    expect(s.feedback.key).toBe('wBoxes');
    expect(s.feedback.params).toMatchObject({ ax: '3x', boxes: 3, amount: '−3', frac: '⅓' });
    expect(TWO_STEP_SPOT.error(s)).toMatchObject({ target: 'coef' });
    s = run(s, [{ type: 'check' }]);                                         // (nothing else gets in while it waits for Undo)
    expect(s.feedback.key).toBe('wBoxes');
    s = run(s, [{ type: 'undo' }]);
    expect(shapeOf(s).id).toBe('D1');
    expect(s.feedback.key).toBe('dReminder');
    expect(s.feedback.params).toMatchObject({ boxes: 3, frac: '⅓' });
    expect(s.spot).toMatchObject({ kind: 'hint', move: 'divOption' });
    expect(s.mopts).toBeTruthy();
    expect(s.ui.preview).toBe('div');
  });
  it('an Add that does not cancel says Add to both sides\' words; a wrong combine lights its numbers, then the hint', () => {
    expect(run(start(p, 1), A.add(-2)).feedback.key).toBe('aPartial');
    expect(run(start(p, 1), A.add(4)).feedback.key).toBe('aRed');
    let s = run(run(start(p, 1), A.add(-4)), []);
    s = run(s, combine(s, 23));
    expect(s.feedback.key).toBe('lxCombineWrong');
    expect(TWO_STEP_SPOT.error(s)).toMatchObject({ target: 'sumbox', lit: ['pair'] });
    s = run(s, [{ type: 'undo' }]);
    expect(s.feedback.key).toBe('wCombineHint');
    expect(s.feedback.params).toMatchObject({ g1: '19', g2: '−4' });
    expect(s.hint.kind).toBe('sum');
  });
  it('the slips: 15 and 23 are tagged, and Undo lights the Add move', () => {
    let s = run(start(p, 1), A.check(15));
    expect(s.tags).toEqual(['skipped-fraction']);
    s = run(s, [{ type: 'undo' }]);
    expect(s.feedback.key).toBe('aStuckHint');
    expect(s.spot.move).toBe('add');
    expect(run(start(p, 1), A.check(23)).tags).toEqual(['added-constant']);
  });
  it('I\'m stuck gives the reminder only, recorded as a reminder; never a picture', () => {
    const at = (s) => run(s, [{ type: 'stuck' }]);
    let s = at(start(p, 1));
    expect(s.feedback.key).toBe('aStuckHint');
    expect(s.menu).toBe('add');
    s = at(run(start(p, 1), A.add(-4)));
    expect(s.feedback.key).toBe('wCombineHint');
    s = flow(start(p, 1), [A.add(-4), (st) => combine(st), [{ type: 'stuck' }], [{ type: 'stuck' }]]);
    expect(s.feedback.key).toBe('dReminder');
    expect(s.scaffold).toBe(false);
    expect(s.supportsShown).toEqual(['hint']);
    s = run(start(p, 1), [...A.add(-2), { type: 'stuck' }]);                  // while a move waits for Undo, only Undo gets in
    expect(s.feedback.key).toBe('aPartial');
    expect(s.stuck).toBe(0);
  });
  it('collapses the check from Level 3; full at Levels 1 and 2', () => {
    const solved = (level) => flow(start(p, level), [A.add(-4), (st) => combine(st), A.frac(3), [{ type: 'focus', target: 'answer' }, ...digits(5), { type: 'check' }]]);
    expect(solved(1).sub.collapsed).toBe(false);
    expect(solved(2).sub.collapsed).toBe(false);
    expect(solved(3).sub.collapsed).toBe(true);
  });
});

describe('x on the right, the minus on x, the forced move', () => {
  it('Level 3: the first Trade places is pointed out (the symmetric property); Add first is helpful too', () => {
    const p = makeTwoStep('b+ax', 3, 4, 5, true);                // 19 = 4 + 3x
    const s = start(p, 3, { introTrade: true });
    expect(s.feedback.key).toBe('aTradeIntro');
    const t = run(s, A.trade());
    expect(t.board.left.some((u) => u.kind === 'x')).toBe(true);
    expect(t.movedOnce).toBe(true);
    const a = run(s, A.add(-4));
    expect(a.lights.fewer).toBe('green');
    expect(a.needUndo).toBe(false);
  });
  it('a forced problem: x = is greyed until a helpful move, and Trade places counts', () => {
    const p = makeTwoStep('ax+b', 3, 4, 5, true);
    const s = start(p, 3, { forceMove: true });
    expect(run(s, [{ type: 'focus', target: 'answer' }, ...digits(5)]).entry).toBe('');
    expect(run(s, [...A.trade(), { type: 'focus', target: 'answer' }, ...digits(5)]).entry).toBe('5');
  });
  it('Level 5, 4 − 3x = −11: Add −4, combine, then Flip and ⅓, or ⅓ then Flip, or −⅓ in one move', () => {
    const p = makeTwoStep('b-ax', 3, 4, 5);
    const at = flow(start(p, 5, { introFlip: true }), [A.add(-4), (st) => combine(st)]);
    expect(shapeOf(at).id).toBe('F2');
    const f = run(at, A.flip());
    expect(f.feedback.key).toBe('fFlipIntro');                                // the first flip of the level says what −1 does
    expect(f.rows.map((r) => r.type)).toEqual(['eq', 'fold', 'work', 'eq']);  // the Add and the combining folded first, then the flip
    expect(shapeOf(f).id).toBe('D1');
    expect(run(f, [...A.frac(3), ...A.check(5)]).stage).toBe('done');
    const g = run(at, A.frac(3));
    expect(shapeOf(g).id).toBe('F1');
    expect(run(g, [...A.flip(), ...A.check(5)]).stage).toBe('done');
    const h = run(at, A.frac(3, -1));
    expect(shapeOf(h).id).toBe('F5');
    expect(run(h, A.check(5)).stage).toBe('done');
    expect(run(run(at, A.flip()), [])).toBeTruthy();
  });
  it('a flip of x with no minus waits for Undo; −⅓ is not taken before Level 5', () => {
    const p = makeTwoStep('ax+b', 3, 4, 5);
    const d1 = flow(start(p, 5), [A.add(-4), (st) => combine(st)]);
    const w = run(d1, A.flip());
    expect(w.feedback.key).toBe('fWorse');
    expect(w.needUndo).toBe(true);
    const low = flow(start(p, 1), [A.add(-4), (st) => combine(st)]);
    expect(run(low, A.frac(3, -1)).feedback.key).not.toBe('aSolvedBoard');
    expect(shapeOf(run(low, A.frac(3, -1))).id).toBe('D1');
  });
});

describe('the first flip pop-up on Flip everything too (Build K)', () => {
  it('says what −1 does once, on the first flip that helps', () => {
    const r = FLIP_MENU.withMenu(reduceFlip);
    const p = { kind: 'flip', a: 1, b: 12, x: -12, mirror: false, logLevel: 2 };
    let s = newFlip(p, { level: 2, introFlip: true });
    s = r(r(s, { type: 'flipPick' }), { type: 'go' });
    expect(s.feedback.key).toBe('fFlipIntro');
    expect(s.flipCount).toBe(1);
    const plain = r(r(newFlip(p, { level: 2 }), { type: 'flipPick' }), { type: 'go' });
    expect(plain.feedback.key).toBe('aSolvedBoard');                         // (without the flag, as before)
  });
});

describe('shape coverage: every state on 200 problems a level, along every path', () => {
  const problems = (level) => Array.from({ length: 40 }, (_, i) => generateTwoStepLevel(level, i + 1)).flat();
  for (const level of range(1, 7)) {
    it(`Level ${level}: no unknown shape`, () => {
      for (const p of problems(level)) {
        const where = `L${level} ${formatTwoStep(p)}`;
        const s0 = start(p, level);
        expect(shapeOf(s0).id).toBe('W1');
        const B = constOf(p);
        const base = p.mirror && level >= 3 ? run(s0, A.trade(), where) : s0;
        const added = run(base, A.add(-B), where);
        expect(shapeOf(added).id).toBe('W2');
        const one = run(added, combine(added), where);
        const a = coefOf(p);
        expect(shapeOf(one).id).toBe(a > 0 ? 'D1' : 'F2');
        // the finishing moves
        const done = a > 0 ? run(one, [...A.frac(a), ...A.check(p.x)], where) : run(one, [...A.flip(), ...A.frac(-a), ...A.check(p.x)], where);
        expect(done.stage, where).toBe('done');
        if (a < 0) run(one, [...A.frac(-a), ...A.flip()], where);
        // the slips: an Add that does not cancel (bigger, partly), the other side zeroed, the x boxes, a wrong combine, a fraction that
        // does not split, a flip of x with no minus; each undone
        run(base, [...A.add(B), { type: 'undo' }], where);
        if (Math.abs(B) >= 2) run(base, [...A.add(-Math.sign(B)), { type: 'undo' }], where);
        if (Math.abs(p.c) <= 15 && B - p.c !== 0) run(base, [...A.add(-p.c), { type: 'undo' }], where);
        run(one, [...A.add(-Math.abs(a)), { type: 'undo' }], where);
        run(added, [...combine(added, 99), { type: 'undo' }], where);
        const n = [2, 3, 4, 5, 6].find((k) => Math.abs(a) % k !== 0 || (one.board.left.concat(one.board.right).find((t) => t.kind === 'num').v % k !== 0));
        if (n) run(one, [...A.frac(n), { type: 'undo' }], where);
        if (level >= 5 && a > 0) run(one, [...A.flip(), { type: 'undo' }], where);
        run(s0, [{ type: 'stuck' }, { type: 'stuck' }], where);
      }
    });
  }
  it('every Two-step shape was reached, and each has a registry entry (counts for the report)', () => {
    const counts = Object.fromEntries([...seen.entries()].sort());
    console.log('two-step shape counts', JSON.stringify(counts));
    for (const id of ['W1', 'W2', 'W3', 'W4', 'D1', 'F1', 'F2', 'F4', 'F5', 'DF']) {
      expect(counts[id] ?? 0, id).toBeGreaterThan(0);
      expect(REGISTRY[id], id).toBeTruthy();
    }
    for (const id of Object.keys(SHAPES)) expect(REGISTRY[id] ?? (id === 'S5' || id === 'S6' ? true : null), id).toBeTruthy();
  });
});

describe('the pack, old progress and save codes', () => {
  it('sits in the old Two-step card\'s slot; the old card is retired but kept with its levels', () => {
    expect(SECTIONS.find((s) => s.id === 'solve').packs).toEqual(['add-both', 'divide-it', 'flip-everything', 'one-step', 'two-step-equations', 'multi-step']);
    expect(twoStepEquations).toMatchObject({ id: 'two-step-equations', title: 'Two-step equations', levels: 7 });
    expect(twoStepEquations.firstLevel).toBeUndefined();
    expect(twoStepEquations.whyLevel).toBeUndefined();
    expect(oldTwoStep.retired).toBe(true);
    expect(PACKS.some((p) => p.id === 'two-step')).toBe(true);
    expect(PACKS.length).toBeLessThanOrEqual(30);                             // the class sheet's limit
  });
  it('v16 codes carry its seven levels; every older code means what it did', () => {
    expect(CODE_VERSION).toBe(16);
    const prog = newProgress(PACKS);
    prog.packs['two-step-equations'].levels = [true, false, true, false, false, true, false];
    prog.packs['flip-everything'].levels = [false, true, true, false, true, false];
    const code = encodeProgress(prog);
    expect(code).toMatch(/^MAT-J[2-9A-HJKMNP-Z]{19}$/);
    const back = decodeProgress(code, PACKS);
    expect(back.packs['two-step-equations'].levels).toEqual([true, false, true, false, false, true, false]);
    expect(back.packs['flip-everything'].levels).toEqual([false, true, true, false, true, false]);
    expect(encodeProgress(back)).toBe(code);
    const v15 = encodeProgress(prog, 15);
    expect(decodeProgress(v15, PACKS).packs['flip-everything'].levels).toEqual([false, true, true, false, true, false]);
    const baseline = JSON.parse(readFileSync(new URL('./parity/baseline/savecodes.json', import.meta.url), 'utf8'));
    for (const [name, { code: old, roundTrip }] of Object.entries(baseline)) {
      const p = decodeProgress(old, PACKS);
      expect(p, name).toBeTruthy();
      if (roundTrip) expect(encodeProgress(p, 14), name).toBe(old);
      const again = decodeProgress(encodeProgress(p), PACKS);
      for (const id of Object.keys(p.packs)) expect(again.packs[id].levels, `${name} ${id}`).toEqual(p.packs[id].levels);
    }
  });
  it('credits finished old Two-step and Switch sides levels where the forms match, and opens up to the highest', () => {
    const credit = (pack, level) => {
      const prog = newProgress(PACKS);
      prog.packs[pack].levels[level - 1] = true;
      return decodeProgress(encodeProgress(prog), PACKS).packs['two-step-equations'];
    };
    const table = { 1: [1], 2: [2], 3: [4], 4: [3], 5: [5], 6: [6], 7: [7] };
    for (const [old, news] of Object.entries(table)) {
      const got = credit('two-step', Number(old));
      expect(got.levels.map((d, i) => (d ? i + 1 : 0)).filter(Boolean), `old Two-step ${old}`).toEqual(news);
      if (Math.max(...news) >= 2) expect(got.open).toBe(Math.max(...news));
    }
    expect(credit('switch', 5).levels.map((d, i) => (d ? i + 1 : 0)).filter(Boolean)).toEqual([1, 2, 4]);
    expect(credit('switch', 6).levels.map((d, i) => (d ? i + 1 : 0)).filter(Boolean)).toEqual([6]);
    for (const l of [1, 2, 3, 4]) expect(credit('switch', l).levels.some(Boolean), `switch ${l}`).toBe(false);
    // the old card's own levels keep their bits
    const prog = newProgress(PACKS);
    prog.packs['two-step'].levels[2] = true;
    expect(decodeProgress(encodeProgress(prog), PACKS).packs['two-step'].levels[2]).toBe(true);
  });
});
