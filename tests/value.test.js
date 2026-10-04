import { describe, it, expect } from 'vitest';
import {
  makeValue, xTerm, numTerm, answerOf, answerText, formatValue, formatSubstituted, termWorths, tagValue, checkValue,
} from '../src/engine/value.js';
import { generateValueLevel, MAX_BOXES, MAX_COUNTERS } from '../src/engine/generateValue.js';
import { newValueLight, reduceValueLight } from '../src/engine/valueLight.js';
import { valueFeedbackText } from '../src/view/valueFeedback.js';
import { modelLayout, boxShape, sumText } from '../src/view/valueMat.js';
import { valueLightPlay } from '../src/play/valueLightPlay.js';
import { PACKS, packById } from '../src/packs/index.js';
import { newProgress, encodeProgress, decodeProgress } from '../src/engine/progress.js';

const typed = (text) => [...text.replace(/−/g, '-')].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'toggleSign' }));
const answer = (text) => [...typed(text), { type: 'check' }];
const run = (s, ...actions) => actions.reduce(reduceValueLight, s);

const A = makeValue([xTerm('+', 2), numTerm('+', 6)], 4);          // 2x + 6, x = 4 → 14
const B = makeValue([numTerm('+', 5), xTerm('-', 2)], -3);         // 5 − 2x, x = −3 → 11
const C = makeValue([xTerm('+', 3), numTerm('+', 5)], -2);         // 3x + 5, x = −2 → −1

describe('evaluating', () => {
  it('works the answer out and writes the problem', () => {
    expect(answerOf(A)).toBe(14);
    expect(answerText(B)).toBe('11');
    expect(answerText(C)).toBe('−1');
    expect(formatValue(A)).toBe('2x + 6, x = 4');
    expect(formatValue(B)).toBe('5 − 2x, x = −3');
    expect(formatSubstituted(A)).toBe('2(4) + 6');
    expect(formatSubstituted(B)).toBe('5 − 2(−3)');
    expect(formatSubstituted(makeValue([xTerm('+', -1), numTerm('+', 4)], 3))).toBe('−(3) + 4');
    expect(termWorths(B).map((w) => w.worth)).toEqual([5, 6]);
  });

  it('refuses a zero or non-integer x', () => {
    expect(() => makeValue([xTerm('+', 2)], 0)).toThrow();
    expect(() => makeValue([xTerm('+', 2)], 1.5)).toThrow();
  });
});

describe('what a wrong answer looked like', () => {
  it('the value written next to the number, with no parentheses', () => {
    expect(tagValue(A, 30)).toBe('no-parens');      // 24 + 6
    expect(tagValue(C, 6)).toBe('no-parens');       // 3 − 2 + 5
  });
  it('multiplication read as addition', () => {
    expect(tagValue(A, 12)).toBe('added');          // 2 + 4 + 6
  });
  it('a negative times a negative left negative', () => {
    expect(tagValue(B, -1)).toBe('neg-neg');        // 5 − 6
  });
  it('the opposite of the answer, and anything else', () => {
    expect(tagValue(A, -14)).toBe('sign-flipped');
    expect(tagValue(A, 99)).toBe('unmatched');
    expect(tagValue(A, 14)).toBe(null);
  });
  it('checks a typed integer; anything else is unreadable', () => {
    expect(checkValue(A, '14')).toEqual({ correct: true, tag: null });
    expect(checkValue(C, '−1')).toEqual({ correct: true, tag: null });
    expect(checkValue(C, '-1').correct).toBe(true);
    expect(checkValue(A, '').unreadable).toBe(true);
    expect(checkValue(A, '-').unreadable).toBe(true);
    expect(checkValue(A, '1.5').unreadable).toBe(true);
  });
});

describe('the problems', () => {
  it('are five a level, from the seed, drawable, with distinct answers', () => {
    for (let seed = 1; seed <= 120; seed++) {
      for (const level of [1, 2, 3]) {
        const set = generateValueLevel(level, seed);
        expect(set).toHaveLength(5);
        expect(generateValueLevel(level, seed)).toEqual(set);
        expect(new Set(set.map(answerText)).size).toBe(5);
        for (const p of set) {
          for (const t of p.expr.terms) if (t.kind === 'x') {
            expect(Math.abs(t.value)).toBeLessThanOrEqual(MAX_BOXES);
            expect(Math.abs(t.value * p.x)).toBeLessThanOrEqual(MAX_COUNTERS);
          }
          expect(p.x).not.toBe(0);
        }
      }
    }
  });

  it('follow the levels: positive values, then negative values, then everything', () => {
    for (let seed = 1; seed <= 60; seed++) {
      expect(generateValueLevel(1, seed).every((p) => p.x > 0 && p.expr.terms.every((t) => t.op === '+' && t.value > 0))).toBe(true);
      expect(generateValueLevel(2, seed).every((p) => p.x < 0 && p.expr.terms.every((t) => t.op === '+' && t.value > 0))).toBe(true);
      const three = generateValueLevel(3, seed);
      expect(three.some((p) => p.x < 0)).toBe(true);
      expect(three.some((p) => p.expr.terms.some((t) => t.op === '-' || t.value < 0))).toBe(true);
      expect(three.filter((p) => p.x < 0 && p.expr.terms.some((t) => t.kind === 'x' && (t.op === '-' || t.value < 0))).length).toBeGreaterThanOrEqual(1);
    }
  });

  it('are a pack of three levels, at the end of the map', () => {
    const pack = packById('value');
    expect(pack).toMatchObject({ levels: 3, title: 'Value it' });
    expect(PACKS[PACKS.length - 1]).toBe(pack);
    expect(pack.generate(2, 5)).toEqual(generateValueLevel(2, 5));
  });
});

describe('Value it in light mode', () => {
  it('starts at the answer; a right answer first time is clean', () => {
    const s = newValueLight(A);
    expect(s).toMatchObject({ stage: 'light', step: 'answer', rung: 0, feedback: { key: 'vIntro' } });
    expect(valueLightPlay.steps(s).map((t) => t.id)).toEqual(['answer']);
    const done = run(s, ...answer('14'));
    expect(done).toMatchObject({ stage: 'done', step: 'done', clean: true, finalText: '14' });
    expect(valueFeedbackText(done.feedback)).toBe('Yes! The answer is 14.');
    expect(run(done, ...typed('1'))).toBe(done);
  });

  it('types integers with the ± pad, and an empty or unreadable Check is not wrong', () => {
    expect(run(newValueLight(C), ...typed('-1')).entry).toBe('-1');
    expect(run(newValueLight(C), ...answer('−1'))).toMatchObject({ stage: 'done' });
    expect(run(newValueLight(A), { type: 'check' })).toMatchObject({ wrongs: 0, feedback: { key: 'typeAnswer' } });
  });

  it('a wrong answer puts the value in parentheses, with what the slip was', () => {
    const s = run(newValueLight(A), ...answer('30'));
    expect(s).toMatchObject({ stage: 'light', rung: 1, wrongs: 1, tag: 'no-parens', entry: '', feedback: { key: 'vTag_no_parens' } });
    expect(s.supportsShown).toEqual(['substitute']);
    expect(valueFeedbackText(s.feedback)).toMatch(/parentheses/);
    expect(run(newValueLight(A), ...answer('12')).feedback.key).toBe('vTag_added');
    expect(run(newValueLight(B), ...answer('−1')).feedback.key).toBe('vTag_neg_neg');
    expect(run(newValueLight(A), ...answer('99')).feedback.key).toBe('vTag_unmatched');
    expect(run(s, ...answer('14'))).toMatchObject({ stage: 'done', clean: false });
  });

  it('a second wrong answer fills the boxes; a third shows the sum; then it stays', () => {
    let s = run(newValueLight(A), ...answer('30'), ...answer('30'));
    expect(s).toMatchObject({ rung: 2, wrongs: 2, feedback: { key: 'vModelWrong' } });
    s = run(s, ...answer('30'));
    expect(s).toMatchObject({ rung: 3, wrongs: 3, feedback: { key: 'vWork' } });
    expect(s.supportsShown).toEqual(['substitute', 'model', 'work']);
    expect(run(s, ...answer('30'))).toMatchObject({ rung: 3, wrongs: 4 });
  });

  it('I\'m stuck climbs a rung without a wrong answer; Teach me goes to the last', () => {
    let s = run(newValueLight(A), { type: 'stuck' });
    expect(s).toMatchObject({ rung: 1, stuck: 1, wrongs: 0, feedback: { key: 'vSubstitute' } });
    s = run(s, { type: 'stuck' });
    expect(s).toMatchObject({ rung: 2, feedback: { key: 'vModel' } });
    expect(run(newValueLight(A), { type: 'teach' })).toMatchObject({ rung: 3, taught: 1, feedback: { key: 'vTeach' } });
    expect(run(newValueLight(A), { type: 'stuck' }, ...answer('14'))).toMatchObject({ stage: 'done', clean: false });
  });
});

describe('the filled-box model', () => {
  it('draws |coefficient| boxes, each holding |x| counters, and counters for a number', () => {
    const layout = modelLayout(A);
    expect(layout.groups.map((g) => [g.type, g.count, g.worth])).toEqual([['boxes', 2, 8], ['counters', 6, 6]]);
    expect(layout.groups[0].shape).toEqual(boxShape(4));
    expect(layout.groups[0].x).toBeLessThan(layout.groups[1].x);
    const neg = modelLayout(B);
    expect(neg.groups.map((g) => [g.type, g.count, g.worth])).toEqual([['counters', 5, 5], ['boxes', 2, 6]]);
  });
  it('lays out every generated problem inside the view, and writes the sum', () => {
    for (let seed = 1; seed <= 40; seed++) {
      for (const level of [1, 2, 3]) {
        for (const p of generateValueLevel(level, seed)) {
          const { groups, width } = modelLayout(p);
          for (const g of groups) { expect(g.x).toBeGreaterThanOrEqual(0); expect(g.x + g.width).toBeLessThanOrEqual(width); }
        }
      }
    }
    expect(sumText(A)).toBe('8 + 6');
    expect(sumText(C)).toBe('−6 + 5');
    expect(sumText(makeValue([numTerm('+', 4), xTerm('-', 2)], 3))).toBe('4 + (−6)');
  });
});

describe('save code v9', () => {
  it('carries Value it progress, and v8 codes still read', () => {
    const progress = newProgress(PACKS);
    progress.packs.value.levels = [true, false, true];
    const code = encodeProgress(progress);
    expect(code).toMatch(/^MAT-B/);
    expect(decodeProgress(code, PACKS).packs.value.levels).toEqual([true, false, true]);
    expect(decodeProgress(encodeProgress(newProgress(PACKS), 8), PACKS).packs.value.levels).toEqual([false, false, false]);
  });
});
