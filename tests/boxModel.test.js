import { describe, it, expect } from 'vitest';
import { generateModelLevel, MAX_COLUMN, MAX_PIECES } from '../src/engine/generateModel.js';
import { newBoxModel, reduceBoxModel, checkModel, columnLabels, spokenModel, modelAnswer } from '../src/engine/boxModel.js';
import { evaluate, makeTerm, makeExpression, formatAnswer } from '../src/engine/terms.js';
import { piecesForExpression } from '../src/engine/termPieces.js';
import { boxModelFeedbackText } from '../src/view/boxModelFeedback.js';
import { boxModelPlay } from '../src/play/boxModelPlay.js';
import { PROBLEMS_PER_LEVEL } from '../src/engine/generate.js';
import { boxes } from '../src/packs/index.js';

const x = (v) => makeTerm('x', '+', v);
const n = (v) => makeTerm('int', '+', v);
const P = (...terms) => ({ ...makeExpression(terms), mode: 'model' });
const typed = (text) => [...text.replace(/−/g, '-').replace(/\s+/g, '')].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'typeChar', ch }));
const answer = (text) => [...typed(text), { type: 'check' }];
const run = (s, ...actions) => actions.reduce(reduceBoxModel, s);

describe('the "read the model" problems', () => {
  it('are five, from the seed, one term per column, with no empty or zero columns', () => {
    for (let seed = 1; seed <= 150; seed++) {
      const set = generateModelLevel(seed);
      expect(set).toHaveLength(PROBLEMS_PER_LEVEL);
      expect(generateModelLevel(seed)).toEqual(set);
      for (const p of set) {
        expect(p.mode).toBe('model');
        expect(p.terms.length).toBeGreaterThanOrEqual(2);
        expect(p.terms.length).toBeLessThanOrEqual(4);
        for (const t of p.terms) {
          expect(t.op).toBe('+');
          expect(Math.abs(t.value)).toBeGreaterThanOrEqual(1);
          expect(Math.abs(t.value)).toBeLessThanOrEqual(MAX_COLUMN);
        }
        expect(p.terms.reduce((s, t) => s + Math.abs(t.value), 0)).toBeLessThanOrEqual(MAX_PIECES);
      }
    }
  });

  it('always have boxes and counters, a negative to read, and an answer with both an x and a number; no repeats in a set', () => {
    for (let seed = 1; seed <= 150; seed++) {
      const set = generateModelLevel(seed);
      const keys = new Set();
      for (const p of set) {
        expect(p.terms.some((t) => t.kind === 'x')).toBe(true);
        expect(p.terms.some((t) => t.kind === 'int')).toBe(true);
        expect(p.terms.some((t) => t.value < 0)).toBe(true);
        const total = evaluate(p);
        expect(total.x).not.toBe(0);
        expect(total.n).not.toBe(0);
        keys.add(`${total.x}|${total.n}`);
      }
      expect(keys.size).toBe(PROBLEMS_PER_LEVEL);
      expect(set.filter((p) => p.terms.some((t) => t.kind === 'x' && t.value < 0)).length).toBeGreaterThanOrEqual(2);   // negative boxes, twice
      expect(set.filter((p) => p.terms.some((t) => t.kind === 'int' && t.value < 0)).length).toBeGreaterThanOrEqual(2); // negative counters, twice
    }
  });

  it('a seed gives one set, another seed another; and the pack\'s Level 2 is this round', () => {
    expect(generateModelLevel(7)).not.toEqual(generateModelLevel(8));
    expect(boxes.generate(2, 7)).toEqual(generateModelLevel(7));
    expect(boxes.levels).toBe(6);
    expect(boxes.levelNames[1]).toBe('read the model');
  });

  it('draw as one column of the right pieces per term', () => {
    const cols = piecesForExpression(P(x(-2), n(3)));
    expect(cols[0].map((p) => [p.type, p.sign])).toEqual([['box', '-'], ['box', '-']]);
    expect(cols[1].map((p) => [p.type, p.sign])).toEqual([['counter', '+'], ['counter', '+'], ['counter', '+']]);
  });
});

describe('reading a model', () => {
  const MODEL = P(x(2), n(-3), x(-1), n(1));      // 2x − 3 − x + 1 = x − 2

  it('accepts any expression worth the same: in order, reordered, or combined', () => {
    for (const ok of ['2x-3-x+1', '2x-x-3+1', '-3+1+2x-x', 'x-2', '-2+x', '1x-2']) {
      expect(checkModel(MODEL, ok), ok).toEqual({ correct: true, tag: null });
    }
  });

  it('is not fooled by anything else, and says what it looked like', () => {
    expect(checkModel(MODEL, 'x+2').correct).toBe(false);
    expect(checkModel(MODEL, '2x-3').correct).toBe(false);
    expect(checkModel(MODEL, '-x+2').tag).toBe('sign-flipped');
    expect(checkModel(MODEL, 'x').tag).toBe('n-off');
    expect(checkModel(MODEL, '').tag).toBe('unreadable');
    expect(checkModel(MODEL, '+-').tag).toBe('unreadable');
  });

  it('a zero term left in is right but asks to take it out (not wrong)', () => {
    expect(checkModel(MODEL, 'x-2+0x').tag).toBe('zero-term');
    const s = run(newBoxModel(MODEL), ...answer('x-2+0x'));
    expect(s).toMatchObject({ stage: 'light', wrongs: 0, feedback: { key: 'bmZeroTerm', bad: true } });
  });

  it('labels and words for the columns', () => {
    expect(columnLabels(MODEL)).toEqual(['2x', '−3', '−x', '1']);
    expect(spokenModel(MODEL)).toBe("Column one: two boxes, that's two x. Column two: three negative counters, that's negative three. Column three: one negative box, that's negative x. Column four: one positive counter, that's positive one.");
    expect(modelAnswer(MODEL)).toBe(formatAnswer({ x: 1, n: -2 }));
  });

  it('starts with the picture and a prompt; a right answer is done and clean', () => {
    const s = newBoxModel(MODEL);
    expect(s).toMatchObject({ stage: 'light', step: 'answer', hint: 0, feedback: { key: 'bmIntro' } });
    expect(boxModelPlay.steps(s).map((t) => t.label)).toEqual(['Write the expression']);
    const done = run(s, ...answer('x-2'));
    expect(done).toMatchObject({ stage: 'done', step: 'done', clean: true, finalText: 'x − 2' });
    expect(boxModelFeedbackText(done.feedback)).toBe('Yes! That model is worth x − 2.');
    expect(run(done, ...typed('1'))).toBe(done);
  });

  it('types with the terms pad, and an empty or unreadable Check is not wrong', () => {
    expect(run(newBoxModel(MODEL), ...typed('2x+1')).entry).toBe('2x+1');
    expect(run(newBoxModel(MODEL), { type: 'check' })).toMatchObject({ wrongs: 0, feedback: { key: 'typeAnswer' } });
    expect(run(newBoxModel(MODEL), ...answer('+'))).toMatchObject({ wrongs: 0 });
  });

  it('a wrong answer brings the key; a second labels each column, read aloud; nothing else', () => {
    let s = run(newBoxModel(MODEL), ...answer('3x'));
    expect(s).toMatchObject({ stage: 'light', wrongs: 1, hint: 1, helped: true, entry: '', spoken: null, feedback: { key: 'bmKeyWrong' } });
    expect(boxModelFeedbackText(s.feedback)).toMatch(/A box is x\. A box with a dash is −x/);
    s = run(s, ...answer('3x'));
    expect(s).toMatchObject({ wrongs: 2, hint: 2, feedback: { key: 'bmLabels' }, spoken: { id: 1 } });
    expect(s.spoken.text).toBe(spokenModel(MODEL));
    s = run(s, ...answer('3x'));
    expect(s).toMatchObject({ wrongs: 3, hint: 2, spoken: { id: 1 } });         // already said: not repeated
    expect(run(s, ...answer('x-2'))).toMatchObject({ stage: 'done', clean: false });
  });

  it('I\'m stuck goes the same way, and Teach me step-by-step labels the columns at once', () => {
    let s = run(newBoxModel(MODEL), { type: 'stuck' });
    expect(s).toMatchObject({ stuck: 1, wrongs: 0, hint: 1, feedback: { key: 'bmKey' } });
    s = run(s, { type: 'stuck' });
    expect(s).toMatchObject({ hint: 2, spoken: { id: 1 } });
    const t = run(newBoxModel(MODEL), { type: 'teach' });
    expect(t).toMatchObject({ taught: 1, hint: 2, feedback: { key: 'bmLabels' }, spoken: { id: 1 } });
    expect(run(t, ...answer('x-2'))).toMatchObject({ stage: 'done', clean: false });
  });

  it('every generated model can be answered both ways', () => {
    for (let seed = 1; seed <= 40; seed++) {
      for (const p of generateModelLevel(seed)) {
        const inOrder = p.terms.map((t, i) => `${t.value < 0 ? '-' : i ? '+' : ''}${Math.abs(t.value)}${t.kind === 'x' ? 'x' : ''}`).join('');
        expect(checkModel(p, inOrder), inOrder).toMatchObject({ correct: true });
        expect(checkModel(p, modelAnswer(p).replace(/ /g, '').replace(/−/g, '-')).correct).toBe(true);
      }
    }
  });
});
