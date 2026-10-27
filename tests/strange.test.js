// Strange solutions (Build V, Levels 1-3): the problems (200 seeds a level, exact fractions), the answer typed in two boxes, the simplify
// nudge, a decimal refused, the divide that never fails (`x = 15/6`), the check with fractions, the slips, the shapes and their reminders,
// the hidden Levels 4-5, and the save codes.
import { describe, it, expect } from 'vitest';
import { formatBoth, linear } from '../src/engine/bothSides.js';
import { generateStrangeLevel, makeStrange, slipValuesOf, tagStrange, slipCollisions, STRANGE_SHOWN } from '../src/engine/generateStrange.js';
import { same, isLowest, frac, fracText, readFraction } from '../src/engine/fraction.js';
import { fractionLines } from '../src/engine/fractionCheck.js';
import { strangePlay as P } from '../src/play/solveCards.js';
import { shapeOf, shapeOfBoard, UNKNOWN } from '../src/engine/solveit/shape.js';
import { REGISTRY } from '../src/engine/solveit/registry.js';
import { honestPath, nextMove, xAlone } from '../src/engine/solveit/honest.js';
import { boardText, lineText } from '../src/engine/solveTerms.js';
import { PACKS, SECTIONS, strangeSolutions, packById, lastLevelOf } from '../src/packs/index.js';
import { newProgress, encodeProgress, decodeProgress, CODE_VERSION, isLevelUnlocked, isPackComplete, nextLevel, completeLevel } from '../src/engine/progress.js';

const SEEDS = 200;
const digits = (n) => [...String(Math.abs(n))].map((d) => ({ type: 'digit', digit: Number(d) })).concat(n < 0 ? [{ type: 'toggleSign' }] : []);
const act = (s, a) => { const n = P.reduce(s, a); return n && typeof n === 'object' ? n : s; };
const run = (s, actions) => actions.reduce(act, s);
const start = (p) => run(P.newSession({ ...p, logLevel: p.level }, {}), [{ type: 'introNext' }, { type: 'spotDismiss' }]);
const X = (c) => ({ k: 'x', c });
const N = (v) => ({ k: 'n', v });
const typeFrac = (n, d) => [...digits(n), ...(d ? [{ type: 'typeChar', ch: '/' }, ...digits(d)] : [])];
const SETS = {};
const setOf = (level, seed) => (SETS[`${level}:${seed}`] ??= generateStrangeLevel(level, seed));
// (a problem played on, by the honest path, to the state where x is alone: `x = 5/2`)
const toAlone = (p) => { const path = honestPath(P.reduce, start(p), { answer: false }); return path.at(-1); };
// Karl's sheet's example: 10x − 4 = 4x + 5 gives 9/6, so 3/2; and 4x + 1 = −2x + 16 gives 15/6, so 5/2
const sheet = () => makeStrange({ level: 2, left: [X(10), N(-4)], right: [X(4), N(5)] });
const sheet2 = () => makeStrange({ level: 2, left: [X(4), N(1)], right: [X(-2), N(16)] });

describe('the problems', () => {
  it('Levels 1-3, 200 seeds: five problems, answers p/q in lowest terms (q 2 to 6, |p| at most 15) or 0 (Level 3 only), never ±1 or whole, verified exactly', () => {
    for (let level = 1; level <= STRANGE_SHOWN; level++) {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const set = setOf(level, seed);
        expect(set).toHaveLength(5);
        expect(new Set(set.map(formatBoth)).size).toBe(5);
        const nonzero = set.filter((p) => p.ans.n !== 0);
        expect(new Set(nonzero.map((p) => fracText(p.ans))).size).toBe(nonzero.length);
        for (const p of set) {
          const where = `${formatBoth(p)} (level ${level}, seed ${seed})`;
          expect(p.kind).toBe('strange-solutions');
          if (!isLowest(p.ans)) throw new Error(`answer not in lowest terms: ${fracText(p.ans)}, ${where}`);
          if (p.ans.n === 0) { if (level !== 3) throw new Error(`0 outside Level 3: ${where}`); continue; }
          if (p.ans.d === 1 || Math.abs(p.ans.n) === p.ans.d) throw new Error(`banned answer ${fracText(p.ans)}: ${where}`);
          expect(p.ans.d).toBeGreaterThanOrEqual(2);
          expect(p.ans.d).toBeLessThanOrEqual(6);
          expect(Math.abs(p.ans.n)).toBeLessThanOrEqual(15);
          // substituted exactly: both sides the same fraction
          const at = (side) => { const { a, b } = linear(side); return frac(a * p.ans.n + b * p.ans.d, p.ans.d); };
          expect(same(at(p.left), at(p.right))).toBe(true);
          const L = linear(p.left);
          const R = linear(p.right);
          expect(Math.abs(L.a - R.a)).toBeGreaterThanOrEqual(2);
          expect(Math.abs(L.a - R.a)).toBeLessThanOrEqual(6);
          for (const q of [...p.left, ...p.right]) if (q.k === 'x') { expect(Math.abs(q.c)).toBeGreaterThanOrEqual(2); expect(Math.abs(q.c)).toBeLessThanOrEqual(9); }
          for (const q of [...p.left, ...p.right]) if (q.k === 'n') { expect(q.v).not.toBe(0); expect(Math.abs(q.v)).toBeLessThanOrEqual(15); }
          expect(slipValuesOf(p).some((sl) => same(sl.v, p.ans))).toBe(false);          // no accidental balances
        }
      }
    }
  }, 120000);
  it('each level is what it says: 1 already simple, 2 to simplify, 3 two zeros, two of Level 1 and one of Level 2; signs mixed', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const [l1, l2, l3] = [1, 2, 3].map((lv) => setOf(lv, seed));
      expect(l1.every((p) => isLowest(p.raw))).toBe(true);
      expect(l1.filter((p) => p.ans.n < 0).length).toBeGreaterThanOrEqual(2);
      expect(l1.filter((p) => p.ans.n > 0).length).toBeGreaterThanOrEqual(2);
      expect(l2.every((p) => !isLowest(p.raw))).toBe(true);
      expect(l2.some((p) => p.ans.n < 0)).toBe(true);
      expect(l3.filter((p) => p.ans.n === 0)).toHaveLength(2);
      expect(l3.filter((p) => p.ans.n !== 0 && isLowest(p.raw))).toHaveLength(2);
      expect(l3.filter((p) => p.ans.n !== 0 && !isLowest(p.raw))).toHaveLength(1);
    }
  });
  it('the sheet’s example: 10x − 4 = 4x + 5 divides to 9/6, so 3/2', () => {
    const p = sheet();
    expect(fracText(p.raw)).toBe('9/6');
    expect(fracText(p.ans)).toBe('3/2');
    expect(fracText(sheet2().raw)).toBe('15/6');
  });
  it('Levels 4-5 are not built yet (V2)', () => {
    expect(() => generateStrangeLevel(4, 1)).toThrow(/not built yet/);
    expect(() => generateStrangeLevel(5, 1)).toThrow(/not built yet/);
  });
  it('the slip collisions are reported (Levels 1-3, 200 seeds)', () => {
    for (let level = 1; level <= 3; level++) expect(slipCollisions(level).problems).toBe(1000);
  }, 120000);
});

describe('the slips', () => {
  it('9/6 (3/2): the wrong sign, upside down, the divisor left out, reduced the wrong way, the x-term’s sign kept, half collected', () => {
    const p = sheet();
    expect(tagStrange(p, frac(3, 2))).toBeNull();
    expect(tagStrange(p, frac(9, 6))).toBeNull();                                    // (the same number: it is nudged, never a slip)
    expect(tagStrange(p, frac(-3, 2))).toBe('sign-flipped');
    expect(tagStrange(p, frac(2, 3))).toBe('frac-swapped');
    expect(tagStrange(p, frac(9, 1))).toBe('frac-no-divide');
    expect(tagStrange(p, frac(9, 2))).toBe('frac-reduced-wrong');
    expect(tagStrange(p, frac(9, 14))).toBe('x-sign-lost');
    expect(tagStrange(p, frac(7, 3))).toBe('unmatched');
  });
});

describe('typing the answer: x = [ ] / [ ]', () => {
  const alone = toAlone(sheet2());                                                    // x = 15/6
  it('the honest path ends at x = 15/6, written as the divide left it', () => {
    expect(boardText(alone.board)).toBe('x = 15/6');
    expect(shapeOf(alone).id).toBe('SR');
  });
  it('digits go to the top, / to the bottom; Backspace in an empty bottom goes back to the top; a click on a box clears it', () => {
    let s = run(alone, [{ type: 'focus', target: 'ansTop' }, ...typeFrac(15, 6)]);
    expect([s.entry, s.den, s.part]).toEqual(['15', '6', 'den']);
    s = run(s, [{ type: 'backspace' }, { type: 'backspace' }]);
    expect([s.entry, s.den, s.part]).toEqual(['15', '', 'num']);
    s = run(s, [{ type: 'ansPart', part: 'den' }, ...digits(2), { type: 'ansPart', part: 'num' }, { type: 'toggleSign' }]);
    expect([s.entry, s.den]).toEqual(['-15', '2']);
    s = act(s, { type: 'focus', target: 'ansBottom' });
    expect([s.entry, s.den, s.part]).toEqual(['-15', '', 'den']);
    s = act(s, { type: 'focus', target: 'ansTop' });
    expect([s.entry, s.part]).toEqual(['', 'num']);
  });
  it('a decimal point: “Write it as a fraction, like 5/2.”, never red, nothing checked', () => {
    const s = run(alone, [{ type: 'focus', target: 'ansTop' }, ...digits(2), { type: 'typeChar', ch: '.' }, ...digits(5)]);
    expect(s.entry).toBe('2.5');
    expect(P.feedbackText(s.feedback)).toBe('Write it as a fraction, like 5/2.');
    const c = act(s, { type: 'check' });
    expect(c.sub).toBeFalsy();
    expect(c.feedback.bad).toBe(false);
  });
  it('15/6: “Can you simplify this further?”, not red, no check, not a wrong answer; the second time it adds the next line, recorded as hint', () => {
    let s = run(alone, [{ type: 'focus', target: 'ansTop' }, ...typeFrac(15, 6), { type: 'check' }]);
    expect(P.feedbackText(s.feedback)).toBe('Can you simplify this further?');
    expect(s.feedback.bad).toBe(false);
    expect(s.sub).toBeFalsy();
    expect(s.wrongs).toBe(0);
    expect(s.answers).toEqual([]);
    expect(s.tags).toContain('unsimplified');
    expect(s.supportsShown).not.toContain('hint');
    s = run(s, [...typeFrac(15, 6), { type: 'check' }]);                            // (the first digit starts the fraction again)
    expect([s.entry, s.den]).toEqual(['15', '6']);
    expect(P.feedbackText(s.feedback)).toBe('Can you simplify this further? Divide the top and the bottom by the same number.');
    expect(s.supportsShown).toContain('hint');
    s = run(s, [...typeFrac(5, 2), { type: 'check' }]);
    expect(s.sub?.ok).toBe(true);
  });
  it('an unsimplified wrong value is nudged too (the nudge never tells the student the value is right)', () => {
    const s = run(alone, [{ type: 'focus', target: 'ansTop' }, ...typeFrac(4, 6), { type: 'check' }]);
    expect(s.feedback.key).toBe('sSimplify');
  });
  it('a wrong value is checked and recorded with its tag: −5/2 sign-flipped, 2/5 upside down (with its second sentence, hint)', () => {
    let s = run(alone, [{ type: 'focus', target: 'ansTop' }, ...typeFrac(-5, 2), { type: 'check' }]);
    s = run(s, [{ type: 'placeValue', index: 0 }, { type: 'placeValue', index: 1 }]);
    for (let k = 0; k < 16 && s.sub && !s.feedback?.bad; k++) s = act(s, { type: 'nextLine' });
    expect(s.answers.at(-1)).toEqual({ typed: '-5/2', tag: 'sign-flipped' });
    expect(P.feedbackText(s.feedback)).toBe('When x = −5/2, the equation is not balanced.');
    s = run(s, [{ type: 'undo' }, { type: 'focus', target: 'ansTop' }, ...typeFrac(2, 5), { type: 'check' }, { type: 'placeValue', index: 0 }, { type: 'placeValue', index: 1 }]);
    for (let k = 0; k < 16 && s.sub && !s.feedback?.bad; k++) s = act(s, { type: 'nextLine' });
    expect(s.answers.at(-1)).toEqual({ typed: '2/5', tag: 'frac-swapped' });
    expect(P.feedbackText(s.feedback)).toContain('Check which number goes on top');
    expect(s.supportsShown).toContain('hint');
  });
  it('the honest path finishes every problem of 40 seeds a level, Balanced', () => {
    for (let level = 1; level <= 3; level++) {
      for (let seed = 1; seed <= 40; seed++) {
        for (const p of setOf(level, seed)) expect(honestPath(P.reduce, start(p)).at(-1).stage, formatBoth(p)).toBe('done');
      }
    }
  });
  it('the finished problem says its answer as a fraction', () => {
    const end = honestPath(P.reduce, start(sheet2())).at(-1);
    expect(end.finalText).toBe('5/2');
  });
  it('readFraction: a whole number in the top alone; a bottom of 0 is refused', () => {
    expect(readFraction('7', '')).toEqual({ value: { n: 7, d: 1 } });
    expect(readFraction('-', '')).toEqual({ key: 'typeAnswer' });
    expect(readFraction('3', '0')).toEqual({ key: 'sZeroBottom' });
  });
});

describe('dividing never fails here', () => {
  // 8x − 1 = 2x + 14 → 6x = 15
  const six = () => { const p = makeStrange({ level: 2, left: [X(8), N(-1)], right: [X(2), N(14)] }); const path = honestPath(P.reduce, start(p), { answer: false }); return path.find((s) => boardText(s.board) === '6x = 15'); };
  it('6x = 15 divided by 6 writes x = 15/6: no failed row, no Undo', () => {
    const s0 = six();
    expect(s0).toBeTruthy();
    expect(shapeOf(s0).id).toBe('SD');
    const s = run(s0, [{ type: 'divPick' }, ...digits(6), { type: 'go' }]);
    expect(boardText(s.board)).toBe('x = 15/6');
    expect(s.fail).toBeFalsy();
    expect(s.needUndo).toBe(false);
    expect(s.rows.some((r) => r.failed)).toBe(false);
    expect(s.rows.at(-2).shown).toBe('div');
  });
  it('the Fraction option (⅙) does the same', () => {
    const s = run(six(), [{ type: 'multOpen' }, { type: 'multPick', kind: 'frac' }, { type: 'focus', target: 'num' }, ...digits(1), { type: 'focus', target: 'den' }, ...digits(6), { type: 'go' }]);
    expect(boardText(s.board)).toBe('x = 15/6');
  });
  it('dividing by another number that would leave a fraction beside x is not made, kindly: “Divide by 6, the number in front of x”', () => {
    const s0 = six();
    const s = run(s0, [{ type: 'divPick' }, ...digits(2), { type: 'go' }]);
    expect(boardText(s.board)).toBe('6x = 15');
    expect(s.history.length).toBe(s0.history.length);
    expect(P.feedbackText(s.feedback)).toBe('Divide by 6, the number in front of x: then x is alone.');
    expect(s.feedback.bad).toBe(false);
    // (3 splits both: 2x = 5, as on every card)
    expect(boardText(run(s0, [{ type: 'divPick' }, ...digits(3), { type: 'go' }]).board)).toBe('2x = 5');
  });
  it('−6x = 15: ÷ −6 gives x = −15/6; ÷ 6 gives −x = 15/6, and a flip gives x = −(15/6)', () => {
    const p = makeStrange({ level: 2, left: [X(2), N(-1)], right: [X(8), N(14)] });      // −6x = 15 on the left once the 8x moves
    let s = start(p);
    s = run(s, [{ type: 'addPick', kind: 'x' }, ...digits(-8), { type: 'go' }, { type: 'foldNext' }]);
    for (let k = 0; k < 6 && boardText(s.board) !== '−6x = 15'; k++) { const m = nextMove(s, { grab: true }); if (!m) break; s = run(s, m); if (s.unfolded) s = act(s, { type: 'foldNext' }); }
    expect(boardText(s.board)).toBe('−6x = 15');
    expect(boardText(run(s, [{ type: 'divPick' }, ...digits(-6), { type: 'go' }]).board)).toBe('x = −15/6');
    const neg = run(s, [{ type: 'divPick' }, ...digits(6), { type: 'go' }, { type: 'foldNext' }]);
    expect(boardText(neg.board)).toBe('−x = 15/6');
    expect(shapeOf(neg).id).toBe('SF');
    const flipped = run(neg, [{ type: 'flipPick' }, { type: 'go' }]);
    expect(boardText(flipped.board)).toBe('x = −(15/6)');
    expect(shapeOf(flipped).id).toBe('SM');
    const done = honestPath(P.reduce, flipped).at(-1);
    expect(done.stage).toBe('done');
  });
});

describe('the check with a fraction (3x + 4 = x + 9 at 5/2)', () => {
  const board = { left: [{ kind: 'x', coef: 3 }, { kind: 'num', v: 4 }], right: [{ kind: 'x' }, { kind: 'num', v: 9 }] };
  it('every step: the products, a whole number over the denominator, the sums, 23/2 = 23/2', () => {
    const r = fractionLines(board, frac(5, 2));
    expect(r.lines.map(lineText)).toEqual(['3(5/2) + 4 = 5/2 + 9', '15/2 + 4 = 5/2 + 9', '15/2 + 8/2 = 5/2 + 9', '23/2 = 5/2 + 9', '23/2 = 5/2 + 18/2', '23/2 = 23/2']);
    expect(r.ok).toBe(true);
  });
  it('a negative fraction in parentheses, its sign on the top: 3(−5/2) + 4 = (−5/2) + 9, Not balanced', () => {
    const r = fractionLines(board, frac(-5, 2));
    expect(lineText(r.lines[0])).toBe('3(−5/2) + 4 = (−5/2) + 9');
    expect(r.ok).toBe(false);
  });
  it('a whole side meets a fraction at the end: written over the same bottom (8/2 = 4 → 8/2 = 8/2)', () => {
    const r = fractionLines({ left: [{ kind: 'x', coef: 4 }, { kind: 'num', v: -6 }], right: [{ kind: 'num', v: 4 }] }, frac(5, 2));
    expect(r.lines.map(lineText).slice(-2)).toEqual(['8/2 = 4', '8/2 = 8/2']);
    expect(r.ok).toBe(true);
  });
  it('the card checks a fraction on the original equation, one drop per x', () => {
    const alone = toAlone(sheet2());
    let s = run(alone, [{ type: 'focus', target: 'ansTop' }, ...typeFrac(5, 2), { type: 'check' }]);
    expect(s.sub.xs).toBe(2);
    expect(s.sub.typed).toBe('5/2');
    expect(lineText(s.sub.lines[0])).toBe('4(5/2) + 1 = −2(5/2) + 16');
  });
  it('a whole number on a board with no fraction keeps every other card’s check', () => {
    const p = makeStrange({ level: 3, left: [X(7), N(-6)], right: [X(2), N(-6)] });
    const end = honestPath(P.reduce, start(p)).at(-1);
    expect(end.stage).toBe('done');
    expect(end.finalText).toBe('0');
    expect(lineText(end.sub.lines[0])).toBe('7(0) − 6 = 2(0) − 6');
  });
});

describe('shapes and their reminders', () => {
  const seen = {};
  const texts = new Set();
  for (let level = 1; level <= 3; level++) {
    for (let seed = 1; seed <= 20; seed++) {
      for (const p of generateStrangeLevel(level, seed)) {
        for (const s of honestPath(P.reduce, start(p), { answer: false })) {
          if (!s.board || s.stage === 'done') continue;
          const sh = shapeOf(s);
          seen[sh.id] = (seen[sh.id] ?? 0) + 1;
          if (sh.id === UNKNOWN) throw new Error(`unknown shape at ${boardText(s.board)}: ${sh.why}`);
          if (!REGISTRY[sh.id]) throw new Error(`no registry entry for ${sh.id}`);
          if (s.needUndo || s.sub || s.lx?.combine || s.lx?.distribute || s.mopts?.kind) continue;
          const help = act(s, { type: 'stuck' });
          texts.add(`${sh.id}: ${P.feedbackText(help.feedback)}`);
        }
      }
    }
  }
  it('the new shapes are reached (SD, SR, SQ), and every shape has an entry', () => {
    for (const id of ['V1', 'SD', 'SR', 'SQ']) expect(seen[id], id).toBeGreaterThan(0);
    for (const id of ['SD', 'SR', 'SQ', 'SF', 'SM', 'NT', 'NF']) expect(REGISTRY[id], id).toBeTruthy();
  });
  it('the reminders: simplify at x = 15/6, divide at 6x = 15', () => {
    const all = [...texts];
    expect(all.some((t) => /^SR: Simplify −?\d+\/\d: divide the top and bottom by the same number, then type x\.$/.test(t))).toBe(true);
    expect(all.some((t) => /^SD: To get one x, divide both sides by −?\d\. The answer can be a fraction: that is fine\.$/.test(t))).toBe(true);
  });
  it('no x left reads as a true or a false statement (V2 adds its buttons)', () => {
    const b = (l, r) => ({ left: [{ kind: 'num', v: l }], right: [{ kind: 'num', v: r }] });
    expect(shapeOfBoard(b(3, 3), 'strange').id).toBe('NT');
    expect(shapeOfBoard(b(3, 7), 'strange').id).toBe('NF');
    expect(shapeOfBoard({ left: [{ kind: 'x', coef: -1 }], right: [{ kind: 'ratio', n: 15, d: 6 }] }, 'strange').id).toBe('SF');
  });
  it('reports the shapes seen', () => { expect(Object.keys(seen).length).toBeGreaterThan(5); });
});

describe('the pack: 5 saved levels, 3 shown; save codes', () => {
  it('sits in Solve it after Distribute more; five levels, the last two hidden', () => {
    expect(SECTIONS.find((s) => s.id === 'solve').packs.at(-1)).toBe('strange-solutions');
    expect(strangeSolutions).toMatchObject({ id: 'strange-solutions', title: 'Strange solutions', levels: 5, lastLevel: 3 });
    expect(lastLevelOf(strangeSolutions)).toBe(3);
    expect(packById('strange-solutions')).toBe(strangeSolutions);
    expect(PACKS.filter((p) => !p.comingSoon && p.levels).length).toBeLessThanOrEqual(30);
  });
  it('Level 4 never opens; the card is complete once 1-3 are done; nothing is offered after Level 3', () => {
    let prog = newProgress(PACKS);
    expect(isLevelUnlocked(prog, 'strange-solutions', 1)).toBe(true);
    expect(isLevelUnlocked(prog, 'strange-solutions', 2)).toBe(false);
    for (const l of [1, 2]) prog = completeLevel(prog, 'strange-solutions', l);
    expect(isPackComplete(prog, 'strange-solutions')).toBe(false);
    expect(nextLevel(prog, 'strange-solutions')).toBe(3);
    prog = completeLevel(prog, 'strange-solutions', 3);
    expect(isLevelUnlocked(prog, 'strange-solutions', 4)).toBe(false);
    expect(isPackComplete(prog, 'strange-solutions')).toBe(true);
    expect(nextLevel(prog, 'strange-solutions')).toBeNull();
  });
  it('v20 codes carry its five levels; v19 codes decode as before and round-trip', () => {
    expect(CODE_VERSION).toBe(20);
    const prog = newProgress(PACKS);
    prog.packs['strange-solutions'].levels = [true, false, true, false, false];
    prog.packs['distribute-more'].levels = [true, true, false, false, true];
    expect(decodeProgress(encodeProgress(prog), PACKS)).toEqual(prog);
    const old = newProgress(PACKS);
    old.packs['distribute-more'].levels = [true, true, true, false, false];
    const v19 = encodeProgress(old, 19);
    const back = decodeProgress(v19, PACKS);
    expect(back).toEqual(old);
    expect(back.packs['strange-solutions'].levels).toEqual([false, false, false, false, false]);
    expect(decodeProgress(encodeProgress(back), PACKS)).toEqual(old);
    // every saved bit of the new card round-trips, the hidden ones too (V2 will use them)
    const all = newProgress(PACKS);
    all.packs['strange-solutions'].levels = [true, true, true, true, true];
    expect(decodeProgress(encodeProgress(all), PACKS).packs['strange-solutions'].levels).toEqual([true, true, true, true, true]);
  });
});
