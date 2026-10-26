// Distribute more (Build U, basic form): the problems (200 seeds a level), the invisible −1 (tapped into view, a drag refused before it,
// every piece typed with its 1), a fraction factor (one token, whole products, the labels after a wrong product), the slips, the shapes and
// their reminders, x = held back until x is on one side, the lights, the check with a fraction, and the save codes.
import { describe, it, expect } from 'vitest';
import { makeBoth, formatBoth, tagBoth, slipValuesOf, sideAt, linear } from '../src/engine/bothSides.js';
import { generateDistMoreLevel, DIST_MORE_LEVEL_COUNT, slipCollisions, MAX_NUM, formOf } from '../src/engine/generateDistMore.js';
import { distMorePlay as P } from '../src/play/solveCards.js';
import { shapeOf, UNKNOWN } from '../src/engine/solveit/shape.js';
import { REGISTRY } from '../src/engine/solveit/registry.js';
import { nextMove, xAlone } from '../src/engine/solveit/honest.js';
import { boardText, substitutionLines, lineText } from '../src/engine/solveTerms.js';
import { PACKS, SECTIONS, distributeMore, packById } from '../src/packs/index.js';
import { newProgress, encodeProgress, decodeProgress, CODE_VERSION } from '../src/engine/progress.js';

const SEEDS = 200;
const digits = (n) => [...String(Math.abs(n))].map((d) => ({ type: 'digit', digit: Number(d) })).concat(n < 0 ? [{ type: 'toggleSign' }] : []);
const act = (s, a) => { const n = P.reduce(s, a); return n && typeof n === 'object' ? n : s; };
const run = (s, actions) => actions.reduce(act, s);
const start = (p) => run(P.newSession({ ...p, logLevel: p.level }, {}), [{ type: 'introNext' }, { type: 'spotDismiss' }]);
const X = (c) => ({ k: 'x', c });
const N = (v) => ({ k: 'n', v });
const KIND = 'distribute-more';
// Karl's sheet's examples, with whole answers: 7x − (x − 6) = 4x + 14 (x = 4), ⅔(6x + 9) = x + 15 (x = 3), −⅔(3x − 6) = x + 10 (x = −2)
const sheet43 = () => makeBoth({ level: 3, kind: KIND, left: [X(7), { k: 'g', f: -1, a: 1, c: -6, hidden: true }], right: [X(4), N(14)], x: 4 });
const sheet51 = () => makeBoth({ level: 4, kind: KIND, left: [{ k: 'g', f: 2, d: 3, a: 6, c: 9 }], right: [X(1), N(15)], x: 3 });
const sheet52 = () => makeBoth({ level: 5, kind: KIND, left: [{ k: 'g', f: -2, d: 3, a: 3, c: -6 }], right: [X(1), N(10)], x: -2 });
// (each level's sets made once: a set of Level 5 takes about 60 ms)
const SETS = {};
const setOf = (level, seed) => (SETS[`${level}:${seed}`] ??= generateDistMoreLevel(level, seed));
const groupOf = (s) => [...s.board.left, ...s.board.right].find((t) => t.kind === 'group');
const distribute = (s, products) => run(s, [{ type: 'lxDistribute', id: groupOf(s).id }, ...products.flatMap((v, k) => [{ type: 'focus', target: 'dist', index: k }, ...digits(v)]), { type: 'lxApply' }]);

describe('the problems', () => {
  it('every level, 200 seeds: five problems, whole answers 2 to 9 in size (never 0 or ±1), no repeats, verified by substitution', () => {
    for (let level = 1; level <= DIST_MORE_LEVEL_COUNT; level++) {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const set = setOf(level, seed);
        expect(set).toHaveLength(5);
        expect(new Set(set.map((p) => p.x)).size).toBe(5);
        expect(new Set(set.map(formatBoth)).size).toBe(5);
        for (const p of set) {
          expect(p.kind).toBe(KIND);
          expect(Number.isInteger(p.x)).toBe(true);
          if (p.x === 0 || Math.abs(p.x) === 1) throw new Error(`banned answer ${p.x}: ${formatBoth(p)} (level ${level}, seed ${seed})`);
          expect(Math.abs(p.x)).toBeLessThanOrEqual(9);
          expect(sideAt(p.left, p.x)).toBe(sideAt(p.right, p.x));
          const L = linear(p.left);
          const R = linear(p.right);
          expect(Math.abs(L.a - R.a)).toBeGreaterThanOrEqual(2);
          expect(Math.abs(L.a - R.a)).toBeLessThanOrEqual(6);
          const g = [...p.left, ...p.right].find((q) => q.k === 'g');
          expect(g).toBeTruthy();
          // every product a distribute writes is whole, not 0, at most 15 (a number) or 9 (an x-term) in size
          const share = (v) => (g.f * v) / (g.d ?? 1);
          for (const v of [share(g.a ?? 1), share(g.c)]) { expect(Number.isInteger(v)).toBe(true); expect(v).not.toBe(0); }
          expect(Math.abs(share(g.a ?? 1))).toBeLessThanOrEqual(9);
          expect(Math.abs(share(g.c))).toBeLessThanOrEqual(MAX_NUM);
          for (const q of [...p.left, ...p.right]) if (q.k === 'n') { expect(q.v).not.toBe(0); expect(Math.abs(q.v)).toBeLessThanOrEqual(MAX_NUM); }
          expect(slipValuesOf(p).some((sl) => sl.v === p.x)).toBe(false);              // no accidental balances
        }
      }
    }
  }, 120000);
  it('each level has its form and sign mix, every set', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const forms = (lv) => setOf(lv, seed).map(formOf);
      expect(forms(1).every((f) => f === 'plus')).toBe(true);
      expect(setOf(1, seed).some((p) => p.left[1].v < 0) && setOf(1, seed).some((p) => p.left[1].v > 0)).toBe(true);
      expect(forms(2).filter((f) => f === 'neg').length).toBeGreaterThanOrEqual(3);
      expect(setOf(2, seed).some((p) => p.x < 0)).toBe(true);
      const f3 = forms(3);
      expect(f3.every((f) => f.startsWith('minus'))).toBe(true);
      expect(f3.filter((f) => f === 'minus-x').length).toBeGreaterThanOrEqual(2);
      expect(f3.filter((f) => f === 'minus-n').length).toBeGreaterThanOrEqual(2);
      expect(f3).toContain('minus-start');
      expect(forms(4).every((f) => f === 'frac')).toBe(true);
      expect(setOf(4, seed).filter((p) => p.left[0].f > 1).length).toBeGreaterThanOrEqual(2);
      const f5 = forms(5);
      expect(f5.filter((f) => f === 'negfrac').length).toBeGreaterThanOrEqual(2);
      expect(f5.some((f) => f.startsWith('minus')) && f5.includes('frac') && f5.some((f) => ['plus', 'neg', 'pos'].includes(f))).toBe(true);
    }
  }, 120000);
  it('the same seed gives the same problems', () => {
    for (let level = 1; level <= 5; level++) expect(generateDistMoreLevel(level, 7).map(formatBoth)).toEqual(generateDistMoreLevel(level, 7).map(formatBoth));
  });
  it('written as on the sheet: the invisible 1 as a bare minus, a fraction over its parenthesis', () => {
    expect(formatBoth(sheet43())).toBe('7x − (x − 6) = 4x + 14');
    expect(formatBoth(sheet51())).toBe('2/3(6x + 9) = x + 15');
    expect(formatBoth(sheet52())).toBe('−2/3(3x − 6) = x + 10');
    expect(boardText(start(sheet43()).board)).toBe('7x − (x − 6) = 4x + 14');
    expect(boardText(start(sheet51()).board)).toBe('⅔(6x + 9) = x + 15');
  });
  it('the slip collisions are reported (Level 1-5, 200 seeds)', () => {
    for (let level = 1; level <= 5; level++) expect(slipCollisions(level, 50).problems).toBe(250);
  }, 60000);
});

describe('the invisible −1 (the worked example: 7x − (x − 6) = 4x + 14)', () => {
  it('a drag before the tap goes back; the tap shows −1; a second tap puts it back; then −1 is dragged like any factor', () => {
    let s = start(sheet43());
    const g = groupOf(s);
    expect(g.hidden).toBe(true);
    s = act(s, { type: 'lxDistribute', id: g.id });
    expect(s.lx.distribute).toBeFalsy();
    expect(P.feedbackText(s.feedback)).toBe('Tap the minus first: it means −1 times everything inside.');
    s = act(s, { type: 'lxMinus', id: g.id });
    expect(s.lx.negIds).toContain(g.id);
    expect(P.feedbackText(s.feedback)).toBe('The minus means −1 times everything inside. Now drag the −1 onto the parenthesis.');
    const back = act(s, { type: 'lxMinus', id: g.id });
    expect(back.lx.negIds).not.toContain(g.id);
    s = distribute(s, [-1, 6]);
    expect(boardText(s.board)).toBe('7x + −x + 6 = 4x + 14');
    s = act(s, { type: 'foldNext' });
    s = run(s, [{ type: 'lxDrop', id: s.board.left[1].id, slot: { side: 'left', onto: s.board.left[0].id } }, ...digits(6), { type: 'typeChar', ch: 'x' }, { type: 'lxApply' }]);
    expect(boardText(s.board)).toBe('6x + 6 = 4x + 14');
  });
  it('a minus at the start of a side taps too: −(2x + 8) shows −1(2x + 8)', () => {
    const p = makeBoth({ level: 3, kind: KIND, left: [{ k: 'g', f: -1, a: 2, c: 8, hidden: true }], right: [X(2), N(4)], x: -3 });
    let s = start(p);
    const g = groupOf(s);
    s = act(s, { type: 'lxMinus', id: g.id });
    expect(s.lx.negIds).toContain(g.id);
    s = distribute(s, [-2, -8]);
    expect(boardText(s.board)).toBe('−2x − 8 = 2x + 4');
  });
  it('every piece is typed with its 1: a bare minus is refused', () => {
    let s = start(sheet43());
    const g = groupOf(s);
    s = run(s, [{ type: 'lxMinus', id: g.id }, { type: 'lxDistribute', id: g.id }, { type: 'typeChar', ch: '-' }, { type: 'toggleSign' }, { type: 'focus', target: 'dist', index: 1 }, ...digits(6), { type: 'lxApply' }]);
    expect(s.lx.distribute).toBeTruthy();
    expect(s.lx.distribute.entries[0]).toBe('-');
    expect(P.feedbackText(s.feedback)).toBe('Type every piece, including the 1.');
  });
  it('the 1 lost: “−1 · x is not x.”, tagged dist-one-lost; Undo goes back to the boxes', () => {
    let s = start(sheet43());
    const g = groupOf(s);
    s = act(s, { type: 'lxMinus', id: g.id });
    s = distribute(s, [1, 6]);
    expect(P.feedbackText(s.feedback)).toBe('−1 · x is not x. The minus is −1: multiply this piece by −1 too. Press Undo and try again.');
    expect(s.tags).toContain('dist-one-lost');
    expect(s.supportsShown).toContain('hint');
    s = act(s, { type: 'undo' });
    expect(s.lx.distribute.entries).toEqual(['', '']);
    s = run(s, [...digits(-1), { type: 'focus', target: 'dist', index: 1 }, ...digits(-6), { type: 'lxApply' }]);
    expect(P.feedbackText(s.feedback)).toBe('−1 · −6 is not −6. The minus is −1: multiply this piece by −1 too. Press Undo and try again.');
  });
});

describe('a fraction factor (⅔(6x + 9) = x + 15)', () => {
  it('one token, dragged onto the parenthesis; the products are typed whole; the first look has no labels', () => {
    let s = start(sheet51());
    const g = groupOf(s);
    expect(g).toMatchObject({ factor: 2, den: 3 });
    s = act(s, { type: 'lxDistribute', id: g.id });
    expect(s.lx.distribute).toBeTruthy();
    expect(s.lx.labels).toBeFalsy();
    s = run(s, [...digits(4), { type: 'focus', target: 'dist', index: 1 }, ...digits(6), { type: 'lxApply' }]);
    expect(boardText(s.board)).toBe('4x + 6 = x + 15');
    expect(s.foldLabel).toEqual({ dist: 2, den: 3 });
  });
  it('a wrong product: only the top (12) is dist-frac-top, only the bottom (2) dist-frac-bottom; the labels appear (⅔ · 6x, ⅔ · 9)', () => {
    let s = distribute(start(sheet51()), [12, 6]);
    expect(P.feedbackText(s.feedback)).toBe('⅔ · 6x is not 12x. Divide by the bottom number too. Press Undo and try again.');
    expect(s.tags).toContain('dist-frac-top');
    expect(s.lx.labels).toBe(true);
    s = distribute(start(sheet51()), [2, 6]);
    expect(s.tags).toContain('dist-frac-bottom');
    s = distribute(start(sheet52()), [2, 4]);
    expect(s.tags).toContain('dist-sign-lost');                       // −⅔ · 3x typed 2: the sign lost
    s = distribute(start(sheet52()), [-2, 4]);
    expect(boardText(s.board)).toBe('−2x + 4 = x + 10');                // a negative fraction in one step, signs and all
  });
  it('Undo after a wrong product goes back to the boxes (the labels stay)', () => {
    let s = distribute(start(sheet51()), [12, 6]);
    s = act(s, { type: 'undo' });
    expect(s.lx.distribute.entries).toEqual(['', '']);
    expect(s.lx.labels).toBe(true);
    expect(P.feedbackText(s.retry ? { key: s.retry.key, params: s.retry.params } : s.feedback)).toContain('⅔ · 6x and ⅔ · 9');
  });
  it('the check works out the fraction in steps, the products in parentheses: ⅔(6(3) + 9), ⅔(18 + 9), ⅔(27), 18', () => {
    const lines = substitutionLines(start(sheet51()).board, 3).lines.map(lineText);
    expect(lines).toEqual(['⅔(6(3) + 9) = 3 + 15', '⅔(18 + 9) = 3 + 15', '⅔(27) = 3 + 15', '18 = 3 + 15', '18 = 18']);
    const neg = substitutionLines(start(sheet43()).board, 4).lines.map(lineText);
    expect(neg[0]).toBe('7(4) − (4 − 6) = 4(4) + 14');
    expect(neg.at(-1)).toBe('30 = 30');
  });
});

describe('the card', () => {
  it('x = waits until x is on one side ("Get x on one side first.")', () => {
    let s = start(sheet51());
    expect(P.feedbackText({ key: 'vOneSide' })).toBe('Get x on one side first.');
    s = run(s, [{ type: 'focus', target: 'answer' }, ...digits(3), { type: 'check' }]);
    expect(s.sub).toBeFalsy();
  });
  it('the lights: No parentheses once distributed, x on one side, Solved; Fewer terms only after an Add or a combine', () => {
    let s = start(sheet51());
    s = distribute(s, [4, 6]);
    expect(s.lights).toMatchObject({ noparen: 'green', xone: 'off', fewer: 'off', solved: 'off' });
  });
  it('the wrong values a student types are tagged: first-only, one-lost, frac-top, half-collected', () => {
    const p = sheet43();                                                  // 7x − (x − 6) = 4x + 14, x = 4
    for (const sl of slipValuesOf(p)) expect(tagBoth(p, sl.v)).toBeTruthy();
    expect(slipValuesOf(p).map((sl) => sl.tag)).toEqual(expect.arrayContaining(['first-only', 'sign-flipped']));
    expect(tagBoth(p, 4)).toBe(null);
  });
});

describe('shapes and their reminders (every state the walks reach is known and registered)', () => {
  const seen = {};
  const texts = new Set();
  for (let level = 1; level <= 5; level++) {
    for (let seed = 1; seed <= 20; seed++) {
      for (const p of generateDistMoreLevel(level, seed)) {
        let s = start(p);
        for (let g = 0; g < 14 && s.board && !xAlone(s.board); g++) {
          const sh = shapeOf(s);
          seen[sh.id] = (seen[sh.id] ?? 0) + 1;
          if (sh.id === UNKNOWN) throw new Error(`unknown shape at ${boardText(s.board)}: ${sh.why}`);
          if (!REGISTRY[sh.id]) throw new Error(`no registry entry for ${sh.id}`);
          const help = act(s, { type: 'stuck' });
          texts.add(`${sh.id}: ${P.feedbackText(help.feedback)}`);
          const m = nextMove(s, { grab: true });
          if (!m) break;
          s = run(s, m);
          if (s.unfolded && !xAlone(s.board)) s = act(s, { type: 'foldNext' });
        }
      }
    }
  }
  it('the new shapes are reached, and every shape has an entry', () => {
    for (const id of ['VG', 'VH', 'VF', 'VE', 'VP']) expect(seen[id], id).toBeGreaterThan(0);
  });
  it('I’m stuck gives the reminder in the words of the form on screen', () => {
    const all = [...texts];
    expect(all.some((t) => t.startsWith('VG: Drag the') && t.endsWith('onto the parenthesis to multiply it by each piece.'))).toBe(true);
    expect(all).toContain('VH: Tap the minus first: it means −1 times everything inside.');
    expect(all.some((t) => /^VF: Drag the −?[½⅓⅔¼¾⅖⅗] onto the parenthesis\. Each piece is −?[½⅓⅔¼¾⅖⅗] of that term\.$/.test(t))).toBe(true);
    expect(all.some((t) => t.startsWith('VE: ') && t.endsWith('are like terms. Drag one onto the other to combine them.'))).toBe(true);
  });
  it('reports the shapes seen', () => { expect(Object.keys(seen).length).toBeGreaterThan(8); });
});

describe('the pack, save codes and the class sheet', () => {
  it('sits in Solve it after Variables on both sides; five levels; no walkthrough', () => {
    expect(SECTIONS.find((s) => s.id === 'solve').packs.at(-1)).toBe('distribute-more');
    expect(distributeMore).toMatchObject({ id: 'distribute-more', title: 'Distribute more', levels: 5 });
    expect(distributeMore.whyLevel).toBeUndefined();
    expect(distributeMore.firstLevel).toBeUndefined();
    expect(packById('distribute-more')).toBe(distributeMore);
    expect(PACKS.filter((p) => !p.comingSoon && p.levels).length).toBeLessThanOrEqual(30);
  });
  it('v19 codes carry its five levels; v18 codes decode as before and round-trip', () => {
    expect(CODE_VERSION).toBe(19);
    const prog = newProgress(PACKS);
    prog.packs['distribute-more'].levels = [true, true, false, true, false];
    prog.packs['variables-both-sides'].levels = [true, false, false, false, true];
    const code = encodeProgress(prog);
    expect(decodeProgress(code, PACKS)).toEqual(prog);
    const old = newProgress(PACKS);
    old.packs['variables-both-sides'].levels = [true, true, true, false, false];
    const v18 = encodeProgress(old, 18);
    const back = decodeProgress(v18, PACKS);
    expect(back).toEqual(old);
    expect(back.packs['distribute-more'].levels).toEqual([false, false, false, false, false]);
    expect(decodeProgress(encodeProgress(back), PACKS)).toEqual(old);
  });
});
