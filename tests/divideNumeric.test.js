import { describe, it, expect } from 'vitest';
import { generateDivideLevel, generateDivideNumeric } from '../src/engine/generateDivide.js';
import { newDivideNumeric, reduceDivideNumeric, readoutOf, equationText, askParts } from '../src/engine/divideNumeric.js';

const run = (s, ...a) => a.reduce(reduceDivideNumeric, s);

describe('the numeric items', () => {
  it('make five items: two do, three quiz, the last marked, no accidental balance, products really equal', () => {
    for (let seed = 0; seed < 100; seed++) {
      const items = generateDivideNumeric(seed);
      expect(items.map((i) => i.item)).toEqual(['do', 'do', 'quiz', 'quiz', 'quiz']);
      expect(items.map((i) => Boolean(i.last))).toEqual([false, false, false, false, true]);
      expect(items.map((i) => i.n ?? 0).slice(0, 2)).toEqual([3, 2]);
      for (const it of items) { expect(it.left[0] * it.left[1]).toBe(it.v); expect(it.right[0] * it.right[1]).toBe(it.v); expect(it.v % 6).toBe(0); }
      expect(items.slice(2).map((i) => i.correct)).toEqual(['upsets', 'keeps', 'upsets']);
    }
    expect(generateDivideLevel(0, 4)).toEqual(generateDivideNumeric(4));
  });
});

describe('a do item', () => {
  const items = generateDivideNumeric(7);
  it('takes the fraction of the left (unbalanced), then of the right (balanced), then Go finishes it', () => {
    let s = newDivideNumeric(items[0]);
    s = run(s, { type: 'choose', move: 'fraction' });
    expect(s.feedback.key).toBe('dnSuggest');
    expect(run(s, { type: 'go' }).feedback.key).toBe('dnGoNotYet');
    s = run(s, { type: 'takeSide', side: 'left' });
    expect(readoutOf(items[0], s.nLeft, s.nRight).balanced).toBe(false);
    expect(run(s, { type: 'takeSide', side: 'left' }).feedback.key).toBe('dnOtherSide');
    s = run(s, { type: 'takeSide', side: 'right' });
    expect([readoutOf(items[0], s.nLeft, s.nRight).balanced, s.feedback.key]).toEqual([true, 'dnBalanced']);
    s = run(s, { type: 'go' });
    expect([s.stage, s.clean]).toEqual(['done', true]);
    expect(run(run(newDivideNumeric(items[0]), { type: 'choose', move: 'fraction' }, { type: 'takeSide', side: 'left' }), { type: 'undo' }).nLeft).toBe(0);
  });
});

describe('a quiz item and the walkthrough', () => {
  const items = generateDivideNumeric(7);
  it('either answer shows what happened and waits for Next; the last one goes on to the walkthrough', () => {
    const q = items[2];
    const wrong = q.correct === 'keeps' ? 'upsets' : 'keeps';
    let s = run(newDivideNumeric(q), { type: 'quiz', value: wrong });
    expect([s.stage, s.clean, s.feedback.key, s.reveal.ok]).toEqual(['done', false, 'dnQuizWrong', false]);
    expect(run(s, { type: 'quiz', value: q.correct })).toBe(s);
    expect(askParts(items[3]).find((p) => p.blue).text).toMatch(/^TAKE .+ of BOTH SIDES$/);
    expect(equationText(items[3], items[3].nLeft, items[3].nRight)).toContain('(');
    const last = items[4];
    s = run(newDivideNumeric(last), { type: 'quiz', value: last.correct });
    expect(s.stage).toBe('review');
    s = run(s, { type: 'quizNext' });
    expect([s.stage, s.walk.step]).toEqual(['walk', 'a']);
    s = run(s, { type: 'wtChoose' }, { type: 'wtGo' });
    const seen = [s.walk.step];
    for (let i = 0; i < 4; i++) { s = run(s, { type: 'wtNext' }); seen.push(s.walk.step); }
    expect(seen).toEqual(['c', 'd', 'e', 'f', 'g']);
    s = run(s, { type: 'wtNext' });
    expect([s.stage, s.feedback.key]).toEqual(['done', 'dwEnd']);
  });
});
