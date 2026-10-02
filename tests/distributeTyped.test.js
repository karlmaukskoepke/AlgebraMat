import { describe, it, expect } from 'vitest';
import { newTypedSession, reduceTyped as reduce, typedHintFor, helpLines, canShowMe, TYPED_STEPS } from '../src/engine/distributeTyped.js';
import { makeDistribute, groupPart, termPart, distributedText, answerText } from '../src/engine/distribute.js';
import { generateDistributeLevel } from '../src/engine/generateDistribute.js';
import { distributeFeedbackText } from '../src/view/distributeFeedback.js';
import { packById } from '../src/packs/index.js';

const x = (value) => ({ kind: 'x', value });
const n = (value) => ({ kind: 'int', value });
const run = (s, ...actions) => actions.reduce(reduce, s);
const check = { type: 'check' };
const typed = (text) => [...text].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'typeChar', ch }));
const keys = (text) => typed(text.replace(/\s/g, '').replace(/−/g, '-'));

// 2(3x − 4) − x + 5 → 6x − 8 − x + 5 → 5x − 3
const P = (level) => ({ ...makeDistribute([groupPart('+', 2, [x(3), n(-4)]), termPart('x', '-', 1), termPart('int', '+', 5)]), level });

describe('Rounds 4 and 5: typed', () => {
  it('has two steps, and Show me only in Round 4', () => {
    expect(TYPED_STEPS.map((t) => t.id)).toEqual(['open', 'answer']);
    expect(canShowMe(P(4))).toBe(true);
    expect(canShowMe(P(5))).toBe(false);
    expect(reduce(newTypedSession(P(5)), { type: 'showMe' }).asked).toBe(false);
  });

  it('opens the groups, then combines, both typed', () => {
    let s = newTypedSession(P(4));
    expect(distributeFeedbackText(s.feedback)).toMatch(/Open the groups/);
    s = run(s, ...keys('6x - 8 - x + 5'), check);
    expect(s).toMatchObject({ step: 'answer', openedText: '6x − 8 − x + 5', entry: '', feedback: { key: 'typedOpened' } });
    expect(distributeFeedbackText(s.feedback)).toMatch(/Opened! 6x − 8 − x \+ 5/);
    s = run(s, ...keys('5x-3'), check);
    expect(s).toMatchObject({ step: 'done', finalText: '5x − 3' });
    expect(distributeFeedbackText(s.feedback)).toBe('Yes! The answer is 5x − 3.');
  });

  it('says what is off, and counts the wrong tries', () => {
    let s = run(newTypedSession(P(4)), ...keys('5x-3'), check);
    expect(s).toMatchObject({ step: 'open', feedback: { key: 'lineTooSoon', bad: true }, tries: { open: 1 } });
    s = run(s, ...Array(4).fill({ type: 'backspace' }), check);
    expect(s.feedback.key).toBe('typeAnswer');
    expect(s.tries.open).toBe(1);                               // an empty try is not a wrong one
    s = run(s, ...keys('6x-8-x+5'), check, ...keys('5x+3'), check);
    expect(s).toMatchObject({ step: 'answer', feedback: { key: 'checkNumbers', bad: true }, tries: { open: 1, answer: 1 } });
  });

  it('hints after three wrong tries, showing each group times its terms, then the tally', () => {
    let s = newTypedSession(P(5));
    expect(typedHintFor(s)).toBeNull();
    for (let i = 0; i < 3; i++) s = run(s, ...keys('1'), check, { type: 'backspace' });
    expect(typedHintFor(s)).toMatchObject({ key: 'hintOpen', src: 'dist' });
    expect(helpLines(s)).toEqual(['2 · 3x = 6x', '2 · (−4) = −8']);
    expect(distributeFeedbackText(typedHintFor(s))).toContain('2 · 3x = 6x; 2 · (−4) = −8');
    s = run(s, ...keys('6x-8-x+5'), check);
    expect(typedHintFor(s)).toBeNull();                         // a new step, a fresh count
    expect(helpLines(s)).toEqual(['boxes: 6 − 1 = 5', 'numbers: −8 + 5 = −3']);
    for (let i = 0; i < 3; i++) s = run(s, ...keys('1'), check, { type: 'backspace' });
    expect(distributeFeedbackText(typedHintFor(s))).toContain('boxes: 6 − 1 = 5');
  });

  it('Show me asks for the same help early (Round 4), once per step', () => {
    let s = run(newTypedSession(P(4)), { type: 'showMe' });
    expect(s.asked).toBe(true);
    expect(typedHintFor(s)).toMatchObject({ key: 'hintOpen' });
    s = run(s, ...keys('6x-8-x+5'), check);
    expect(s.asked).toBe(false);
    expect(typedHintFor(s)).toBeNull();
  });

  it('a subtracted and a hidden-1 group show their own products', () => {
    const Q = { ...makeDistribute([termPart('int', '+', 5), groupPart('-', 2, [x(2), n(-3)]), termPart('x', '+', 1)]), level: 5 };
    expect(helpLines(newTypedSession(Q))).toEqual(['−2 · 2x = −4x', '−2 · (−3) = 6']);
  });

  it('reads every generated Round 4 and 5 problem through to its answer', () => {
    for (const level of [4, 5]) {
      for (const seed of [2, 9, 31]) {
        for (const base of generateDistributeLevel(level, seed)) {
          const p = { ...base, level };
          let s = run(newTypedSession(p), ...keys(distributedText(p)), check);
          expect(s.step).toBe('answer');
          s = run(s, ...keys(answerText(p)), check);
          expect(s).toMatchObject({ step: 'done', finalText: answerText(p) });
        }
      }
    }
  });

  it('the pack has five rounds, each problem carrying its round', () => {
    const pack = packById('distribute-combine');
    expect(pack.levels).toBe(5);
    expect(pack.levelNames).toHaveLength(5);
    expect(pack.generate(4, 7).every((p) => p.level === 4)).toBe(true);
  });
});
