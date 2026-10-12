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
    expect(askOf(q)).toMatch(/^What happens if we ADD \d to ONE SIDE ONLY\?$/);
    expect(askOf(items[3])).toMatch(/ADD \d to BOTH SIDES\?$/);
    expect(askOf(items[4])).toMatch(/ADD \d to the LEFT and \d to the RIGHT\?$/);
    const s = run(newNumeric(q), { type: 'quiz', value: q.correct });
    expect([s.stage, s.clean, s.feedback.key]).toEqual(['done', true, 'nlQuizRight']);
  });
  it('either answer shows what happened, line by line, ending Balanced or Unbalanced; a wrong one is not retried', () => {
    const q = items[2];
    const wrong = q.correct === 'keeps' ? 'upsets' : 'keeps';
    let s = run(newNumeric(q), { type: 'quiz', value: wrong });
    expect([s.stage, s.misses, s.clean, s.feedback.key]).toEqual(['done', 1, false, 'nlQuizWrong']);
    expect(s.reveal.lines).toHaveLength(3);
    expect(s.reveal.lines[0]).toBe(equationText(newNumeric(q).board));
    expect(s.reveal.ok).toBe(false);                                                     // adding to one side only upsets it
    expect(run(s, { type: 'quiz', value: q.correct })).toBe(s);
    const right = run(newNumeric(items[3]), { type: 'quiz', value: items[3].correct });
    expect(right.reveal.ok).toBe(true);                                                  // both sides keeps it
  });
});

describe('the watched walkthrough after the fifth item', () => {
  const quizDone = () => run(newNumeric(items[4]), { type: 'quiz', value: items[4].correct }, { type: 'quizNext' });
  it('opens after the last quiz item and its Next (not before), without finishing the problem', () => {
    expect(items[4].last).toBe(true);
    expect(items.slice(0, 4).some((i) => i.last)).toBe(false);
    expect(run(newNumeric(items[4]), { type: 'quiz', value: items[4].correct }).stage).toBe('review');
    const s = quizDone();
    expect([s.stage, s.walk.step, s.feedback.key]).toEqual(['walk', 'a', 'wtA']);
    expect(run(newNumeric(items[3]), { type: 'quiz', value: items[3].correct }).stage).toBe('done');
  });
  it('goes a click at a time: Add, Go (with −3 filled in), then Next to the end, and only then is the problem done', () => {
    let s = quizDone();
    expect(run(s, { type: 'wtGo' })).toBe(s);                                            // only the highlighted click works
    s = run(s, { type: 'wtChoose' });
    expect([s.walk.step, s.amountEntry]).toEqual(['b', '-3']);
    s = run(s, { type: 'wtGo' });
    const seen = [s.walk.step];
    for (let i = 0; i < 4; i++) { s = run(s, { type: 'wtNext' }); seen.push(s.walk.step); }
    expect(seen).toEqual(['c', 'd', 'e', 'f', 'g']);
    expect(s.stage).toBe('walk');
    s = run(s, { type: 'wtNext' });
    expect([s.stage, s.feedback.key]).toEqual(['done', 'wtEnd']);
  });
});
