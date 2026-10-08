import { describe, it, expect } from 'vitest';
import {
  makeSolve, leftOf, formatEquation, answerText, substituteSegments, balanceOf, tagSolve, checkSolve,
} from '../src/engine/solve.js';
import { generateSolveLevel, MAX_SIDE } from '../src/engine/generateSolve.js';
import { newSolveLight, reduceSolveLight } from '../src/engine/solveLight.js';
import { solveFeedbackText } from '../src/view/solveFeedback.js';
import { balanceRows } from '../src/view/solveMat.js';
import { solveLightPlay } from '../src/play/solveLightPlay.js';
import { PACKS, packById } from '../src/packs/index.js';
import { newProgress, encodeProgress, decodeProgress } from '../src/engine/progress.js';

const typed = (text) => [...text.replace(/−/g, '-')].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'toggleSign' }));
const answer = (text) => [...typed(text), { type: 'check' }];
const run = (s, ...actions) => actions.reduce(reduceSolveLight, s);

const PLUS = makeSolve('x+a', 5, 7);     // x + 5 = 12
const MINUS = makeSolve('x-a', 3, 9);    // x − 3 = 6
const TIMES = makeSolve('ax', 4, 6);     // 4x = 24
const OVER = makeSolve('x/a', 4, 12);    // x/4 = 3

describe('equations', () => {
  it('are built from their solution, so the right side is right', () => {
    expect([PLUS, MINUS, TIMES, OVER].map((p) => p.b)).toEqual([12, 6, 24, 3]);
    expect([PLUS, MINUS, TIMES, OVER].map(formatEquation)).toEqual(['x + 5 = 12', 'x − 3 = 6', '4x = 24', 'x/4 = 3']);
    expect([PLUS, MINUS, TIMES, OVER].map(answerText)).toEqual(['7', '9', '6', '12']);
  });

  it('refuse a division that does not come out even', () => {
    expect(() => makeSolve('x/a', 4, 10)).toThrow();
    expect(() => makeSolve('x+a', 0, 3)).toThrow();
    expect(() => makeSolve('nope', 2, 3)).toThrow();
  });

  it('put a typed answer back in and say whether the sides balance', () => {
    expect(balanceOf(PLUS, 7)).toMatchObject({ balanced: true, text: '12' });
    expect(balanceOf(PLUS, 12)).toMatchObject({ balanced: false, text: '17', right: '12' });
    expect(balanceOf(OVER, 7)).toMatchObject({ balanced: false, text: '7/4' });
    expect(balanceOf(MINUS, 2)).toMatchObject({ balanced: false, text: '−1' });
    expect(leftOf('ax', 4, 6)).toBe(24);
    expect(substituteSegments(PLUS, 12).map((s) => s.text)).toEqual(['(12)', '+ 5', '= 12']);
    expect(substituteSegments(TIMES, 3).map((s) => s.text)).toEqual(['4', '(3)', '= 24']);
  });
});

describe('what a wrong answer looked like', () => {
  it('is named', () => {
    expect(tagSolve(PLUS, 17)).toBe('wrong-op');       // 12 + 5
    expect(tagSolve(PLUS, 12)).toBe('untouched');
    expect(tagSolve(PLUS, -7)).toBe('flipped');         // 5 − 12
    expect(tagSolve(MINUS, 3)).toBe('wrong-op');        // 6 − 3
    expect(tagSolve(TIMES, 96)).toBe('wrong-op');       // 24 × 4
    expect(tagSolve(TIMES, 20)).toBe('other-op');       // 24 − 4
    expect(tagSolve(OVER, 28)).toBe('unmatched');
    expect(tagSolve(OVER, 7)).toBe('other-op');         // 3 + 4
    expect(tagSolve(PLUS, 7)).toBeNull();
  });

  it('reads typed text', () => {
    expect(checkSolve(PLUS, '7')).toMatchObject({ correct: true, typed: 7 });
    expect(checkSolve(PLUS, '17')).toMatchObject({ correct: false, tag: 'wrong-op' });
    expect(checkSolve(PLUS, '').unreadable).toBe(true);
    expect(checkSolve(PLUS, '−').unreadable).toBe(true);
  });
});

describe('the problems', () => {
  it('are five a level, drawable, with no repeated answers, from a fixed seed', () => {
    const forms = { 1: ['x+a'], 2: ['x-a'], 3: ['ax'], 4: ['x/a'] };
    for (let seed = 1; seed <= 150; seed++) {
      for (let level = 1; level <= 5; level++) {
        const set = generateSolveLevel(level, seed);
        expect(set).toHaveLength(5);
        expect(new Set(set.map((p) => p.x)).size).toBe(5);
        for (const p of set) {
          expect(Number.isInteger(p.x) && p.x > 0).toBe(true);
          expect(Math.max(p.b, p.x)).toBeLessThanOrEqual(MAX_SIDE);
          expect(leftOf(p.form, p.a, p.x)).toBe(p.b);
          if (forms[level]) expect(forms[level]).toContain(p.form);
        }
        if (level === 5) expect(new Set(set.map((p) => p.form)).size).toBe(4);
        if (level === 2) expect(set.every((p) => p.b > 0)).toBe(true);
      }
    }
    expect(generateSolveLevel(3, 9)).toEqual(generateSolveLevel(3, 9));
  });

  it('are a pack of five levels, with room for more in the save code', () => {
    const pack = packById('one-step');
    expect(pack).toMatchObject({ levels: 5, title: 'One-step equations' });
    expect(pack.levelNames).toHaveLength(5);
    expect(pack.generate(4, 3)).toEqual(generateSolveLevel(4, 3));
    const progress = newProgress(PACKS);
    progress.packs['one-step'].levels = [true, false, true, true, true];
    const code = encodeProgress(progress);
    expect(decodeProgress(code, PACKS).packs['one-step'].levels).toEqual([true, false, true, true, true]);
    expect(decodeProgress(encodeProgress(newProgress(PACKS), 9), PACKS).packs['one-step'].levels).toEqual(Array(5).fill(false));
  });
});

describe('light mode', () => {
  it('finishes on a right answer, cleanly, and records the check', () => {
    const s = run(newSolveLight(PLUS), ...answer('7'));
    expect(s).toMatchObject({ stage: 'done', clean: true, tried: 7, finalText: '7', rung: 0 });
    expect(solveFeedbackText(s.feedback)).toContain('it balances');
  });

  it('puts a wrong answer back in first, with what the slip was', () => {
    let s = run(newSolveLight(PLUS), ...answer('17'));
    expect(s).toMatchObject({ stage: 'light', rung: 1, tried: 17, wrongs: 1, tag: 'wrong-op', entry: '' });
    expect(solveFeedbackText(s.feedback)).toMatch(/don’t balance/);
    expect(solveFeedbackText(s.feedback)).toMatch(/add its opposite/);
    s = run(s, ...answer('12'));
    expect(s).toMatchObject({ rung: 2, tried: 12, tag: 'untouched' });
    s = run(s, ...answer('11'));
    expect(s.rung).toBe(3);
    s = run(s, ...answer('7'));
    expect(s).toMatchObject({ stage: 'done', clean: false });
    expect(s.supportsShown).toEqual(['check', 'balance', 'undo']);
  });

  it('skips the check when nothing was typed, and Teach me goes to the last rung', () => {
    expect(run(newSolveLight(TIMES), { type: 'stuck' }).rung).toBe(2);
    expect(run(newSolveLight(TIMES), { type: 'teach' }).rung).toBe(3);
    expect(solveFeedbackText(run(newSolveLight(OVER), { type: 'teach' }).feedback)).toMatch(/multiply both sides/);
  });

  it('asks for something readable', () => {
    expect(solveFeedbackText(run(newSolveLight(PLUS), { type: 'check' }).feedback)).toMatch(/Type your answer/);
  });

  it('has a message for every key it can say', () => {
    for (const p of [PLUS, MINUS, TIMES, OVER]) {
      for (const tag of ['wrong-op', 'other-op', 'untouched', 'flipped', 'unmatched']) {
        const s = { ...newSolveLight(p), rung: 0, tried: 1 };
        const out = reduceSolveLight(s, { type: 'stuck' });
        expect(solveFeedbackText(out.feedback)).not.toBe('');
        const fb = { key: `sTag_${tag.replace(/-/g, '_')}`, params: { form: { 'x+a': 'Plus', 'x-a': 'Minus', ax: 'ax', 'x/a': 'Over' }[p.form] } };
        expect(solveFeedbackText(fb)).not.toBe('');
      }
    }
  });
});

describe('the pictures', () => {
  it('show a box and counters on each side, then the undo and what is left', () => {
    expect(balanceRows(PLUS, 1)).toEqual([]);
    const [balance] = balanceRows(PLUS, 2);
    expect(balance.left.map((i) => i.type)).toEqual(['box', 'counters']);
    expect(balance.left[1].n).toBe(5);
    expect(balance.right[0].n).toBe(12);
    const [undo, left] = balanceRows(PLUS, 3);
    expect(undo.label).toBe('Add −5 to both sides: the pairs cancel');
    expect(undo.left.slice(1).map((i) => [i.sign, i.n, i.struck])).toEqual([['+', 5, 5], ['-', 5, 5]]);   // +5 and the −5 added cancel
    expect(undo.right.map((i) => [i.sign, i.n, i.struck])).toEqual([['+', 12, 5], ['-', 5, 5]]);
    expect(left.right[0].n).toBe(7);
    // subtracting: a negative counters on the left, the same number added to both sides
    const [m, mLeft] = balanceRows(MINUS, 3);
    expect(m.left.map((i) => [i.sign, i.n, i.added])).toEqual([[undefined, undefined, undefined], ['-', 3, false], ['+', 3, true]]);
    expect(mLeft.right[0].n).toBe(9);
    // multiplying: a boxes, shared out equally; dividing: a parts of one box, then a copies
    expect(balanceRows(TIMES, 2)[0].left[0]).toMatchObject({ type: 'box', count: 4 });
    expect(balanceRows(TIMES, 3)[0].right[0]).toMatchObject({ type: 'groups', count: 4, size: 6 });
    expect(balanceRows(OVER, 2)[0].left[0]).toMatchObject({ parts: 4, taken: 1 });
    expect(balanceRows(OVER, 3)[0].right[0]).toMatchObject({ count: 4, size: 3 });
    expect(balanceRows(OVER, 3)[1].right[0].n).toBe(12);
  });

  it('the play adapter wires it together', () => {
    expect(solveLightPlay.steps()).toHaveLength(1);
    const s = solveLightPlay.newSession(PLUS);
    expect(s.stage).toBe('light');
  });
});
