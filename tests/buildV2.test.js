import { describe, it, expect } from 'vitest';
import { PACKS, SECTIONS, packById } from '../src/packs/index.js';
import { newProgress, placeLevels, completeLevel, placedOpening, withLegacyCredit } from '../src/engine/progress.js';
import { PROBLEMS_PER_LEVEL } from '../src/engine/generate.js';

// Build V2 (Karl, 2026-11-02 and 2026-11-07).

describe('Part A: a placed level opens on its last problem', () => {
  const pack = packById('two-step-equations');
  it('a level placed by a no-help pass or the placement quiz (placeLevels) opens on problem 5 of 5', () => {
    const p = placeLevels(newProgress(PACKS), pack.id, 4);             // (Levels 1-3 placed, 4 open)
    expect(placedOpening(p, pack, 4, 5, PROBLEMS_PER_LEVEL)).toBe(0);
    expect(placedOpening(p, pack, 1, 5, PROBLEMS_PER_LEVEL)).toBe(4);
    expect(placedOpening(p, pack, 3, 5, PROBLEMS_PER_LEVEL)).toBe(4);
  });
  it('an earned level, an open level with nothing on it and a locked level open at problem 1', () => {
    let p = placeLevels(newProgress(PACKS), pack.id, 2);
    p = completeLevel(p, pack.id, 1);
    expect(placedOpening(p, pack, 1, 5, PROBLEMS_PER_LEVEL)).toBe(0);
    expect(placedOpening(p, pack, 3, 5, PROBLEMS_PER_LEVEL)).toBe(0);
    expect(placedOpening(newProgress(PACKS), pack, 1, 5, PROBLEMS_PER_LEVEL)).toBe(0);
  });
  it('legacy credit (an older card’s level) places, so it opens on the last problem too', () => {
    const p = withLegacyCredit(completeLevel(newProgress(PACKS), 'one-step', 3));     // (Divide it's Level 1, saved 2, placed)
    expect(placedOpening(p, packById('divide-it'), 2, 5, PROBLEMS_PER_LEVEL)).toBe(4);
    expect(placedOpening(p, packById('divide-it'), 3, 5, PROBLEMS_PER_LEVEL)).toBe(0);
  });
  it('Count it and Build it are unchanged: their placed levels open at problem 1', () => {
    const p = placeLevels(placeLevels(newProgress(PACKS), 'boxes', 4), 'divide-it', 4);
    expect(placedOpening(p, packById('boxes'), 1, 5, PROBLEMS_PER_LEVEL, SECTIONS)).toBe(0);
    expect(placedOpening(p, packById('divide-it'), 2, 5, PROBLEMS_PER_LEVEL, SECTIONS)).toBe(4);
  });
  it('a set that is not five problems (a test-out has two) is never jumped', () => {
    const p = placeLevels(newProgress(PACKS), pack.id, 3);
    expect(placedOpening(p, pack, 1, 2, PROBLEMS_PER_LEVEL)).toBe(0);
  });
});

// ---------- Parts 1 and 2: Strange solutions Levels 4-5, x disappears, the conclusion buttons ----------
import { generateStrangeLevel, makeStrange, typeOf, slipValuesOf, slipCollisions } from '../src/engine/generateStrange.js';
import { formatBoth, linear } from '../src/engine/bothSides.js';
import { same, isLowest, frac, fracText } from '../src/engine/fraction.js';
import { strangePlay as SP } from '../src/play/solveCards.js';
import { honestPath } from '../src/engine/solveit/honest.js';
import { boardText } from '../src/engine/solveTerms.js';
import { shapeOfBoard } from '../src/engine/solveit/shape.js';
import { REGISTRY } from '../src/engine/solveit/registry.js';
import { noX, statementTrue, concludeOpen } from '../src/engine/cards/strange.js';

const SEEDS = 200;
const actS = (s, a) => { const n = SP.reduce(s, a); return n && typeof n === 'object' ? n : s; };
const runS = (s, as) => as.reduce(actS, s);
const startS = (p) => runS(SP.newSession({ ...p, logLevel: p.level }, {}), [{ type: 'introNext' }, { type: 'spotDismiss' }]);
const Xt = (c) => ({ k: 'x', c });
const Nt = (v) => ({ k: 'n', v });
const Gt = (f, c) => ({ k: 'g', f, a: 1, c });
const SETS = {};
const setOf = (level, seed) => (SETS[`${level}:${seed}`] ??= generateStrangeLevel(level, seed));
// the type computed directly: substitute x = 0 and x = 1 with exact fractions; the same difference twice is no x, 0 is always true
const directType = (p) => {
  const at = (side, x) => { const { a, b } = linear(side); return a * x + b; };
  const d0 = at(p.right, 0) - at(p.left, 0);
  const d1 = at(p.right, 1) - at(p.left, 1);
  return d0 === d1 ? (d0 === 0 ? 'all' : 'none') : 'one';
};

describe('Part 1: Levels 4 and 5, 200 seeds a level', () => {
  for (const level of [4, 5]) {
    it(`Level ${level}: five problems, no repeated equation or answer, answers in lowest terms (or 0), never ±1, never whole, type stored = type computed, verified exactly`, () => {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const set = setOf(level, seed);
        expect(set).toHaveLength(5);
        expect(new Set(set.map(formatBoth)).size).toBe(5);
        const answers = set.filter((p) => p.ans && p.ans.n !== 0).map((p) => fracText(p.ans));
        expect(new Set(answers).size).toBe(answers.length);
        for (const p of set) {
          const where = `${formatBoth(p)} (level ${level}, seed ${seed})`;
          if (p.type !== directType(p)) throw new Error(`stored type ${p.type} but computed ${directType(p)}: ${where}`);
          expect(typeOf(p.left, p.right)).toBe(p.type);
          for (const q of [...p.left, ...p.right]) if (q.k === 'n') { expect(q.v).not.toBe(0); expect(Math.abs(q.v)).toBeLessThanOrEqual(15); }
          for (const q of [...p.left, ...p.right]) if (q.k === 'x') expect(Math.abs(q.c)).toBeLessThanOrEqual(9);
          if (p.type !== 'one') { expect(p.ans).toBeNull(); continue; }
          if (!isLowest(p.ans)) throw new Error(`answer not in lowest terms: ${fracText(p.ans)}, ${where}`);
          if (p.ans.n === 0) continue;
          if (p.ans.d === 1 || Math.abs(p.ans.n) === p.ans.d) throw new Error(`banned answer ${fracText(p.ans)}: ${where}`);
          expect(p.ans.d).toBeLessThanOrEqual(6);
          expect(Math.abs(p.ans.n)).toBeLessThanOrEqual(15);
          const at = (side) => { const { a, b } = linear(side); return frac(a * p.ans.n + b * p.ans.d, p.ans.d); };
          expect(same(at(p.left), at(p.right))).toBe(true);
          expect(slipValuesOf(p).some((sl) => same(sl.v, p.ans))).toBe(false);
        }
      }
    }, 120000);
  }
  it('Level 4: Karl’s form first, three strange (both kinds), two ordinary (a fraction and the zero case)', () => {
    const forms = {};
    let zeros = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
      const set = setOf(4, seed);
      expect(set[0].form).toBe('karl');
      expect(set[0].type === 'none' || set[0].type === 'all').toBe(true);
      expect(set.filter((p) => p.type !== 'one')).toHaveLength(3);
      expect(set.some((p) => p.type === 'none')).toBe(true);
      expect(set.some((p) => p.type === 'all')).toBe(true);
      for (const p of set) forms[p.form] = (forms[p.form] ?? 0) + 1;
      zeros += set.filter((p) => p.form === 'zero').length;
    }
    expect(forms.unmerged).toBeGreaterThan(20);
    expect(forms.group).toBeGreaterThan(20);
    expect(forms.signed).toBeGreaterThan(20);
    expect(zeros).toBe(SEEDS);
  });
  it('Level 5: a group in every problem; no solution, infinitely many, a fraction and 0 in every set', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const set = setOf(5, seed);
      for (const p of set) expect([...p.left, ...p.right].some((q) => q.k === 'g')).toBe(true);
      expect(set.some((p) => p.type === 'none')).toBe(true);
      expect(set.some((p) => p.type === 'all')).toBe(true);
      expect(set.some((p) => p.type === 'one' && p.ans.n !== 0)).toBe(true);
      expect(set.some((p) => p.type === 'one' && p.ans.n === 0)).toBe(true);
    }
  });
  it('Karl’s examples are made and typed right', () => {
    const t = (l, r) => makeStrange({ level: 4, left: l, right: r }).type;
    expect(t([Xt(5), Nt(3)], [Xt(5), Nt(7)])).toBe('none');
    expect(t([Xt(4), Nt(-2)], [Xt(4), Nt(-2)])).toBe('all');
    expect(t([Xt(2), Nt(6)], [Gt(2, 3)])).toBe('all');
    expect(t([Gt(3, 2)], [Xt(3), Nt(5)])).toBe('none');
    expect(t([Nt(5), Xt(1), Xt(1)], [Xt(2), Nt(5)])).toBe('all');
    expect(t([Xt(2), Nt(3), Xt(1)], [Xt(3), Nt(3)])).toBe('all');
    expect(t([Xt(3), Nt(-6), Xt(1)], [Xt(4), Nt(1)])).toBe('none');
    const z = makeStrange({ level: 4, left: [Xt(3), Nt(4)], right: [Nt(4)] });
    expect(fracText(z.ans)).toBe('0');
    expect(fracText(makeStrange({ level: 4, left: [Xt(4), Nt(1)], right: [Xt(1), Nt(5)] }).ans)).toBe('4/3');
  });
  it('the slip collisions are reported (Levels 4-5)', () => {
    for (const level of [4, 5]) expect(slipCollisions(level).problems).toBe(1000);
  }, 120000);
});

describe('Part 2: x disappears; the conclusion buttons', () => {
  it('every problem of Levels 4-5 (200 seeds) is finished by the honest path: a strange one by the right button on a no-x statement', () => {
    for (const level of [4, 5]) for (let seed = 1; seed <= SEEDS; seed++) for (const p of setOf(level, seed)) {
      const end = honestPath(SP.reduce, startS(p)).at(-1);
      if (end.stage !== 'done' || end.wrongs) throw new Error(`not finished: ${formatBoth(p)} (level ${level}, seed ${seed}): ${boardText(end.board)}`);
      if (p.type !== 'one') {
        expect(noX(end.board)).toBe(true);
        expect(end.concluded).toBe(p.type);
        expect(statementTrue(end.board)).toBe(p.type === 'all');
      }
    }
  }, 240000);
  const karl = () => makeStrange({ level: 4, left: [Xt(5), Nt(3)], right: [Xt(5), Nt(7)] });
  const cancel = (p, k) => runS(startS(p), [{ type: 'addPick', kind: 'x' }, ...[...String(Math.abs(k))].map((d) => ({ type: 'digit', digit: Number(d) })), ...(k < 0 ? [{ type: 'toggleSign' }] : []), { type: 'go' }]);
  it('adding the opposite x-term cancels both x-terms (both crossed); x = greys with its note; nothing can be typed in it', () => {
    const s = cancel(karl(), -5);
    expect(boardText(s.board)).toBe('3 = 7');
    expect(s.rows.at(-2).work.left.some((t) => t.struck)).toBe(true);
    expect(s.rows.at(-2).work.right.some((t) => t.struck)).toBe(true);
    expect(SP.loop?.answerLive?.(s) ?? false).toBe(false);
    expect(concludeOpen(s)).toBe(true);
    const typed = runS(s, [{ type: 'focus', target: 'answer' }, { type: 'digit', digit: 0 }]);
    expect(typed.entry ?? '').toBe('');                                          // (x = 0 can never stand for "no solution")
    expect(shapeOfBoard(s.board, 'strange').id).toBe('NF');
  });
  it('a right pick: the confirm line in the balance’s words, the problem solved', () => {
    const s = runS(cancel(karl(), -5), [{ type: 'conclude', pick: 'none' }]);
    expect(s.stage).toBe('done');
    expect(s.wrongs).toBe(0);
    expect(SP.feedbackText(s.feedback)).toBe('3 = 7 is never true, so no x can work. The sides never balance.');
    const all = runS(cancel(makeStrange({ level: 4, left: [Xt(3), Nt(3)], right: [Xt(3), Nt(3)] }), -3), [{ type: 'conclude', pick: 'all' }]);
    expect(SP.feedbackText(all.feedback)).toBe('3 = 3 is always true, so every x works. The sides always balance.');
  });
  it('a wrong pick: the statement lit with Undo ("3 = 7 is false. It is false whatever x is."), tag conclusion-wrong, then the hint', () => {
    let s = runS(cancel(karl(), -5), [{ type: 'conclude', pick: 'all' }]);
    expect(s.stage).toBe('moves');
    expect(SP.feedbackText(s.feedback)).toBe('3 = 7 is false. It is false whatever x is.');
    expect(s.answers.at(-1)).toEqual({ typed: 'Infinitely many', tag: 'conclusion-wrong' });
    expect(actS(s, { type: 'conclude', pick: 'none' })).toBe(s);              // (Undo first)
    s = actS(s, { type: 'undo' });
    expect(SP.feedbackText(s.feedback)).toBe('x disappeared. Is this statement ever true?');
    expect(s.spot?.target).toBe('conclude');
    s = actS(s, { type: 'conclude', pick: 'none' });
    expect(s.stage).toBe('done');
    const t = runS(cancel(makeStrange({ level: 4, left: [Xt(3), Nt(3)], right: [Xt(3), Nt(3)] }), -3), [{ type: 'conclude', pick: 'none' }]);
    expect(SP.feedbackText(t.feedback)).toBe('3 = 3 is always true.');
  });
  it('two opposite x-terms combined: 0 or 0x is accepted and the term drops from the row; the unmerged shape works in both orders', () => {
    const p = makeStrange({ level: 4, left: [Nt(5), Xt(1), Xt(1)], right: [Xt(2), Nt(5)] });
    // combine first (x + x = 2x), then cancel
    let s = startS(p);
    const [, a, b] = s.board.left;
    s = runS(s, [{ type: 'lxDrop', id: b.id, slot: { side: 'left', onto: a.id }, how: 'pointer' }, { type: 'digit', digit: 2 }, { type: 'typeChar', ch: 'x' }, { type: 'lxApply' }]);
    expect(boardText(s.board)).toBe('5 + 2x = 2x + 5');
    s = runS(s, [{ type: 'addPick', kind: 'x' }, { type: 'digit', digit: 2 }, { type: 'toggleSign' }, { type: 'go' }]);
    expect(boardText(s.board)).toBe('5 = 5');
    // cancel first (the 2x across), then combine to 0
    for (const typed of [['0'], ['0', 'x']]) {
      let t = startS(p);
      const two = t.board.right[0];
      t = runS(t, [{ type: 'lxDrop', id: two.id, slot: { side: 'left', at: 3 }, how: 'pointer' }, { type: 'foldNext' }]);
      expect(boardText(t.board)).toBe('5 + x + −2x + x = 5');
      const [, x1, m2] = t.board.left;
      t = runS(t, [{ type: 'lxDrop', id: m2.id, slot: { side: 'left', onto: x1.id }, how: 'pointer' }, { type: 'digit', digit: 1 }, { type: 'toggleSign' }, { type: 'typeChar', ch: 'x' }, { type: 'lxApply' }]);
      expect(boardText(t.board)).toBe('5 + −x + x = 5');
      const [, n1, x2] = t.board.left;
      t = runS(t, [{ type: 'lxDrop', id: x2.id, slot: { side: 'left', onto: n1.id }, how: 'pointer' }, ...typed.map((c) => (c === 'x' ? { type: 'typeChar', ch: 'x' } : { type: 'digit', digit: 0 })), { type: 'lxApply' }]);
      expect(boardText(t.board)).toBe('5 = 5');
      expect(concludeOpen(t)).toBe(true);
    }
  });
  it('the zero case (3x + 4 = 4, answer 0) is an ordinary problem: x = 0 is typed and checked', () => {
    const p = makeStrange({ level: 4, left: [Xt(3), Nt(4)], right: [Nt(4)] });
    const end = honestPath(SP.reduce, startS(p)).at(-1);
    expect(end.stage).toBe('done');
    expect(end.finalText).toBe('0');
    expect(end.concluded).toBeUndefined();
  });
  it('the shapes NT and NF have their reminder: "x disappeared. Is this statement ever true?" at the conclusion buttons', () => {
    for (const id of ['NT', 'NF']) expect(REGISTRY.strange?.[id] ?? REGISTRY[id]).toBeTruthy();
    const s = actS(cancel(karl(), -5), { type: 'stuck' });
    expect(SP.feedbackText(s.feedback)).toBe('x disappeared. Is this statement ever true?');
  });
});
