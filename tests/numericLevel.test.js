import { describe, it, expect } from 'vitest';
import { generateAddBothLevel } from '../src/engine/generateAddBoth.js';
import { newNumeric, reduceNumeric, readoutOf, equationText, askOf } from '../src/engine/numericLevel.js';

const run = (s, ...a) => a.reduce(reduceNumeric, s);
const typed = (text) => [...text.replace(/−/g, '-')].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'toggleSign' }));
const items = generateAddBothLevel(1, 7);

describe('a "do" item', () => {
  it('suggests the amount, adds it to one side (unbalanced), then the other (balanced), then Go finishes it', () => {
    let s = newNumeric(items[0]);
    expect(s.stage).toBe('moves');
    s = run(s, { type: 'choose', move: 'add' });
    expect([s.amountEntry, s.feedback.key]).toEqual([String(items[0].amount), 'nlSuggest']);
    s = run(s, { type: 'addTo', side: 'left' });
    expect(readoutOf(s.board).balanced).toBe(false);
    expect(run(s, { type: 'go' }).feedback.key).toBe('nlGoNotYet');
    expect(run(s, { type: 'addTo', side: 'left' }).feedback.key).toBe('nlOtherSide');
    s = run(s, { type: 'addTo', side: 'right' });
    expect(readoutOf(s.board).balanced).toBe(true);
    s = run(s, { type: 'go' });
    expect([s.stage, s.clean]).toEqual(['done', true]);
  });
  it('wants a positive on the first item and a negative on the second, never 0, and typing replaces the suggestion', () => {
    let s = run(newNumeric(items[0]), { type: 'choose', move: 'add' }, ...typed('−2'), { type: 'addTo', side: 'left' });
    expect(s.feedback.key).toBe('nlSign');
    s = run(newNumeric(items[1]), { type: 'choose', move: 'add' });
    expect(s.amountEntry).toBe(String(items[1].amount));
    expect(run(s, ...typed('3'), { type: 'addTo', side: 'left' }).feedback.key).toBe('nlSign');
    expect(run(newNumeric(items[0]), { type: 'choose', move: 'add' }, ...typed('0'), { type: 'addTo', side: 'left' }).feedback.key).toBe('nlZero');
  });
  it('undo takes both actions back', () => {
    let s = run(newNumeric(items[0]), { type: 'choose', move: 'add' }, { type: 'addTo', side: 'left' }, { type: 'addTo', side: 'right' });
    s = run(s, { type: 'undo' });
    expect(equationText(s.board)).toBe(equationText(newNumeric(items[0]).board));
    expect(s.pending).toBeNull();
  });
});

describe('a quiz item', () => {
  it('asks in the spec\'s words and takes the right answer', () => {
    const q = items[2];
    expect(askOf(q)).toMatch(/^What would happen if we added \d to one side only\?$/);
    expect(askOf(items[3])).toMatch(/to both sides\?$/);
    expect(askOf(items[4])).toMatch(/to the left and \d to the right\?$/);
    const s = run(newNumeric(q), { type: 'quiz', value: q.correct });
    expect([s.stage, s.clean]).toEqual(['done', true]);
  });
  it('a wrong answer shows before and after and lets the student try again', () => {
    const q = items[2];
    const wrong = q.correct === 'keeps' ? 'upsets' : 'keeps';
    let s = run(newNumeric(q), { type: 'quiz', value: wrong });
    expect([s.stage, s.misses, s.feedback.key]).toEqual(['quiz', 1, 'nlQuizWrong']);
    expect(s.reveal.beforeRead).toContain('Balanced');
    expect(s.reveal.afterRead).toContain('Unbalanced');
    s = run(s, { type: 'quiz', value: q.correct });
    expect([s.stage, s.clean, s.reveal]).toEqual(['done', false, null]);
  });
});
