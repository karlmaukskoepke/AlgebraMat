import { describe, it, expect } from 'vitest';
import {
  makeSolve2, leftOf2, coefOf, constOf, formatEquation, answerText, substituteSegments, balanceOf, tagSolve2, checkSolve2, slipsOf, messageParams,
} from '../src/engine/solve2.js';
import { formatEquation as formatAny, checkEquation } from '../src/engine/equation.js';
import { generateSolve2Level, MAX_C } from '../src/engine/generateSolve2.js';
import { newSolveLight, reduceSolveLight } from '../src/engine/solveLight.js';
import { solveFeedbackText } from '../src/view/solveFeedback.js';
import { twoStepRows } from '../src/view/solve2Rows.js';
import { PACKS, packById } from '../src/packs/index.js';
import { newProgress, encodeProgress, decodeProgress } from '../src/engine/progress.js';

const typed = (text) => [...text.replace(/−/g, '-')].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'toggleSign' }));
const answer = (text) => [...typed(text), { type: 'check' }];
const run = (s, ...actions) => actions.reduce(reduceSolveLight, s);

const PLUS = makeSolve2('ax+b', 3, 6, 5);            // 3x + 6 = 21
const MINUS = makeSolve2('ax-b', 2, 3, 5);           // 2x − 3 = 7
const FIRST = makeSolve2('b+ax', 4, 5, 2);           // 5 + 4x = 13
const NEG = makeSolve2('b-ax', 2, 5, 4);             // 5 − 2x = −3
const MIRROR = makeSolve2('ax+b', 3, 6, 5, true);    // 21 = 3x + 6
const NEGX = makeSolve2('ax+b', 3, 12, -5);          // 3x + 12 = −3

describe('equations', () => {
  it('are built from their solution and written as in the book', () => {
    expect([PLUS, MINUS, FIRST, NEG, MIRROR, NEGX].map(formatEquation)).toEqual(['3x + 6 = 21', '2x − 3 = 7', '5 + 4x = 13', '5 − 2x = −3', '21 = 3x + 6', '3x + 12 = −3']);
    expect([PLUS, NEG, NEGX].map(answerText)).toEqual(['5', '4', '−5']);
    expect([PLUS, MINUS, FIRST, NEG].map((p) => [coefOf(p), constOf(p)])).toEqual([[3, 6], [2, -3], [4, 5], [-2, 5]]);
    expect(leftOf2(NEG, 4)).toBe(-3);
    expect(formatAny(MIRROR)).toBe('21 = 3x + 6');
  });

  it('refuse bad numbers', () => {
    expect(() => makeSolve2('ax+b', 1, 3, 4)).toThrow();
    expect(() => makeSolve2('ax+b', 2, 3, 0)).toThrow();
    expect(() => makeSolve2('nope', 2, 3, 4)).toThrow();
  });

  it('put a typed answer back in, whichever side x is on', () => {
    expect(balanceOf(PLUS, 5)).toMatchObject({ balanced: true, text: '21' });
    expect(balanceOf(PLUS, 9)).toMatchObject({ balanced: false, text: '33', right: '21' });
    expect(balanceOf(NEG, 1)).toMatchObject({ balanced: false, text: '3', right: '−3' });
    expect(substituteSegments(PLUS, 9).map((s) => s.text)).toEqual(['3', '(9)', '+ 6', '= 21']);
    expect(substituteSegments(FIRST, 2).map((s) => s.text)).toEqual(['5', '+ 4', '(2)', '= 13']);
    expect(substituteSegments(MIRROR, 2).map((s) => s.text)).toEqual(['21 =', '3', '(2)', '+ 6']);
    expect(substituteSegments(NEG, -1).map((s) => s.text)).toEqual(['5', '− 2', '(−1)', '= −3']);
  });
});

describe('what a wrong answer looked like (the big one)', () => {
  it('names the slips', () => {
    expect(tagSolve2(PLUS, 5)).toBeNull();
    expect(tagSolve2(PLUS, 1)).toBe('divided-one-term');       // 21 ÷ 3 − 6: divided the x term and the 21, not the 6
    expect(tagSolve2(PLUS, 15)).toBe('stopped-early');         // 21 − 6
    expect(tagSolve2(PLUS, 7)).toBe('skipped-constant');       // 21 ÷ 3
    expect(tagSolve2(PLUS, 9)).toBe('constant-wrong-way');     // (21 + 6) ÷ 3
    expect(tagSolve2(PLUS, 45)).toBe('multiplied');            // 15 × 3
    expect(tagSolve2(PLUS, 21)).toBe('untouched');
    expect(tagSolve2(PLUS, -5)).toBe('sign-flipped');
    expect(tagSolve2(PLUS, 4)).toBe('unmatched');
    // a negative coefficient: 5 − 2x = −3 (x = 4); the boxes are −x
    expect(tagSolve2(NEG, -4)).toBe('sign-lost');
    expect(tagSolve2(NEG, -1)).toBe('constant-wrong-way');     // (−3 + 5) ÷ −2
    expect(tagSolve2(NEG, -8)).toBe('stopped-early');          // −3 − 5
    expect(tagSolve2(MINUS, 2)).toBe('constant-wrong-way');    // (7 − 3) ÷ 2: took away when it should add
    expect(tagSolve2(MINUS, 4)).toBe('unmatched');             // 7 ÷ 2 + 3 isn't a whole number, so it can't be typed
  });

  it('only uses slips that can be typed (a whole number)', () => {
    expect(Object.values(slipsOf(MINUS)).some(Number.isNaN)).toBe(true);
    expect(tagSolve2(MINUS, NaN)).toBe('unmatched');
  });

  it('reads typed text', () => {
    expect(checkSolve2(PLUS, '5')).toMatchObject({ correct: true, typed: 5 });
    expect(checkSolve2(PLUS, '15')).toMatchObject({ correct: false, tag: 'stopped-early' });
    expect(checkSolve2(NEGX, '−5').correct).toBe(true);
    expect(checkSolve2(PLUS, '').unreadable).toBe(true);
    expect(checkEquation(PLUS, '5').correct).toBe(true);
  });
});

describe('the problems', () => {
  it('are five a level, drawable, whole answers, no repeats, and each level is its form', () => {
    for (let seed = 1; seed <= 150; seed++) {
      for (let level = 1; level <= 7; level++) {
        const set = generateSolve2Level(level, seed);
        expect(set).toHaveLength(5);
        expect(new Set(set.map((p) => p.x)).size).toBe(5);
        for (const p of set) {
          expect(p.kind).toBe('solve2');
          expect(Number.isInteger(p.x) && p.x !== 0 && Math.abs(p.x) <= 9).toBe(true);
          expect(p.c).toBe(coefOf(p) * p.x + constOf(p));
          expect(p.c !== 0 && Math.abs(p.c) <= MAX_C).toBe(true);
          expect(p.a >= 2 && p.a <= 5 && p.b >= 1 && p.b <= 12).toBe(true);
          if (level <= 4) expect(p.x > 0 && p.c > 0).toBe(true);
          if (level <= 3) expect(p.mirror).toBe(false);
        }
        if (level === 1) expect(set.every((p) => p.form === 'ax+b')).toBe(true);
        if (level === 2) expect(set.every((p) => p.form === 'ax-b')).toBe(true);
        if (level === 3) expect(set.every((p) => p.form === 'b+ax')).toBe(true);
        if (level === 4) expect(set.every((p) => p.mirror) && new Set(set.map((p) => p.form)).size === 3).toBe(true);
        if (level === 5) { expect(set.every((p) => p.form === 'b-ax')).toBe(true); expect(set.filter((p) => p.c < 0).length).toBeGreaterThanOrEqual(2); }
        if (level === 6) { expect(set.every((p) => p.x < 0 && p.form !== 'b-ax')).toBe(true); }
        if (level === 7) { expect(set.some((p) => p.x < 0)).toBe(true); expect(set.some((p) => p.form === 'b-ax')).toBe(true); }
      }
    }
    expect(generateSolve2Level(5, 9)).toEqual(generateSolve2Level(5, 9));
  });

  it('are a pack of seven levels, with room for one more in the save code', () => {
    const pack = packById('two-step');
    expect(pack).toMatchObject({ levels: 7, title: 'Two-step equations' });
    expect(pack.levelNames).toHaveLength(7);
    expect(pack.generate(5, 3)).toEqual(generateSolve2Level(5, 3));
    const progress = newProgress(PACKS);
    progress.packs['two-step'].levels = [true, false, true, true, false, true, true];
    expect(decodeProgress(encodeProgress(progress), PACKS).packs['two-step'].levels).toEqual([true, false, true, true, false, true, true]);
    expect(decodeProgress(encodeProgress(newProgress(PACKS), 10), PACKS).packs['two-step'].levels).toEqual(Array(7).fill(false));
  });
});

describe('light mode', () => {
  it('finishes on a right answer, including a negative one', () => {
    expect(run(newSolveLight(PLUS), ...answer('5'))).toMatchObject({ stage: 'done', clean: true, finalText: '5' });
    expect(run(newSolveLight(NEGX), ...answer('−5'))).toMatchObject({ stage: 'done', clean: true, finalText: '−5' });
  });

  it('puts a wrong answer back in first, with the slip named and its own numbers', () => {
    let s = run(newSolveLight(PLUS), ...answer('1'));
    expect(s).toMatchObject({ rung: 1, tag: 'divided-one-term', tried: 1 });
    const msg = solveFeedbackText(s.feedback);
    expect(msg).toMatch(/divide every term, including the number/);
    expect(msg).toContain('3x ÷ 3 = x, 6 ÷ 3 = 2, and 21 ÷ 3 = 7');
    s = run(s, ...answer('15'));
    expect(s.rung).toBe(2);
    expect(solveFeedbackText(s.feedback)).toMatch(/Undo the number first/);
    s = run(s, ...answer('7'));
    expect(s.rung).toBe(3);
    s = run(s, ...answer('5'));
    expect(s).toMatchObject({ stage: 'done', clean: false });
    expect(s.supportsShown).toEqual(['check', 'balance', 'undo']);
  });

  it('says every slip in words, for every form', () => {
    for (const p of [PLUS, MINUS, FIRST, NEG, MIRROR, NEGX]) {
      const params = messageParams(p);
      for (const tag of ['divided-one-term', 'stopped-early', 'skipped-constant', 'constant-wrong-way', 'multiplied', 'untouched', 'sign-flipped', 'sign-lost', 'unmatched']) {
        expect(solveFeedbackText({ key: `tTag_${tag.replace(/-/g, '_')}`, params }), tag).toMatch(/\S/);
      }
      for (const key of ['tCheck', 'tModel', 'tModelWrong', 'tWork', 'tTeach']) expect(solveFeedbackText({ key, params })).toMatch(/\S/);
    }
    expect(solveFeedbackText(run(newSolveLight(NEG), { type: 'teach' }).feedback)).toMatch(/flip at the end/);
    expect(run(newSolveLight(PLUS), { type: 'stuck' }).rung).toBe(2);
  });
});

describe('the pictures', () => {
  it('start from a balance of boxes and counters, constant first', () => {
    expect(twoStepRows(PLUS, 1)).toEqual([]);
    const [bal] = twoStepRows(PLUS, 2);
    expect(bal.left.map((i) => i.type)).toEqual(['box', 'counters']);
    expect(bal.left[0]).toMatchObject({ count: 3, neg: false });
    expect(bal.left[1].n).toBe(6);
    expect(bal.right[0].n).toBe(21);
    expect(twoStepRows(FIRST, 2)[0].left.map((i) => i.type)).toEqual(['counters', 'box']);        // 5 + 4x: the number first
    expect(twoStepRows(MIRROR, 2)[0].right.map((i) => i.type)).toEqual(['box', 'counters']);       // x on the right
    expect(twoStepRows(MIRROR, 2)[0].left[0].n).toBe(21);
  });

  it('take the number away when the other side has it, else add its opposite; then share; then (negative) flip', () => {
    const [undo, share, left] = twoStepRows(PLUS, 3);
    expect(undo.left[1].struck).toBe(6);
    expect(undo.right[0].struck).toBe(6);
    expect(share.right[0]).toMatchObject({ type: 'groups', count: 3, size: 5 });
    expect(left.right[0].n).toBe(5);
    expect(left.solved).toBe(true);
    // 2x − 3 = 7: put 3 on both sides
    const [m] = twoStepRows(MINUS, 3);
    expect(m.left.map((i) => [i.type, i.sign, i.added])).toEqual([['box', undefined, undefined], ['counters', '-', false], ['counters', '+', true]]);
    expect(m.right.map((i) => [i.n, i.sign, i.added])).toEqual([[7, '+', false], [3, '+', true]]);
    // 5 − 2x = −3: negative boxes, add 5 negatives to both sides, share 8 negatives, flip
    const rows = twoStepRows(NEG, 3);
    expect(rows).toHaveLength(4);
    expect(rows[0].left.at(-1)).toMatchObject({ type: 'box', neg: true });   // 5 − 2x: the number first, then the boxes of −x
  });

  it('a negative coefficient ends with a flip to x', () => {
    const rows = twoStepRows(NEG, 3);
    expect(rows.map((r) => r.label)).toEqual(['Take 5 away from both sides', 'Share the counters equally: 2 boxes, 2 groups', 'What’s left: the opposite of x', 'Flip both sides to the opposite']);
    expect(rows[1].right[0]).toMatchObject({ count: 2, size: 4, sign: '-' });
    expect(rows[3].right[0]).toMatchObject({ n: 4, sign: '+' });
    expect(rows[3].solved).toBe(true);
    expect(twoStepRows(NEGX, 3).at(-1).right[0]).toMatchObject({ n: 5, sign: '-' });
    expect(twoStepRows(NEGX, 3).at(-1).solved).toBe(true);
  });
});
