import { describe, it, expect } from 'vitest';
import { newDistributeLight, reduceDistributeLight } from '../src/engine/distributeLight.js';
import { tagDistribute, CARDS } from '../src/engine/lightCards.js';
import { makeDistribute, groupPart, termPart, answerText } from '../src/engine/distribute.js';
import { parseAnswer } from '../src/engine/terms.js';
import { distributeLightFeedbackText } from '../src/view/distributeLightFeedback.js';
import { problemWords, problemLayout } from '../src/view/groupLightMat.js';
import { packById } from '../src/packs/index.js';

const X = (value) => ({ kind: 'x', value });
const N = (value) => ({ kind: 'int', value });
const typed = (text) => [...text.replace(/−/g, '-').replace(/\s+/g, '')].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'typeChar', ch }));
const answer = (text) => [...typed(text), { type: 'check' }];
const run = (s, ...actions) => actions.reduce(reduceDistributeLight, s);
const tagOf = (problem, text) => tagDistribute(problem, parseAnswer(text));

const PLUS = makeDistribute([termPart('int', '+', 1), groupPart('+', 3, [X(2), N(1)])]);                 // 1 + 3(2x + 1) = 6x + 4
const SIGN = makeDistribute([termPart('int', '+', 5), groupPart('-', 3, [X(2), N(-1)])]);                // 5 − 3(2x − 1) = −6x + 8
const NEG = makeDistribute([termPart('int', '+', 4), groupPart('-', 1, [X(2), N(5)], { hiddenOne: true })]); // 4 − (2x + 5) = −2x − 1
const OUTER = makeDistribute([termPart('x', '+', 3), groupPart('+', 2, [X(2), N(3)])]);                  // 3x + 2(2x + 3) = 7x + 6

describe('what a wrong answer to a Distribute problem looked like', () => {
  it('the number out front reached one term only', () => {
    expect(tagOf(PLUS, '2x+4')).toBe('dist-one');
    expect(tagOf(PLUS, '6x+2')).toBe('dist-one');
    expect(CARDS.distribute.check(PLUS, '6x+4')).toEqual({ correct: true, tag: null });
  });
  it('a negative inside lost its sign', () => {
    expect(tagOf(SIGN, '-6x+2')).toBe('inside-sign-lost');     // 5 − 3(2x + 1) = −6x + 2
  });
  it('a subtracted hidden 1 went to the first term only', () => {
    expect(tagOf(NEG, '-2x+9')).toBe('neg-first');             // x term negated, number left as +5
  });
  it('the number out front added as a term', () => {
    expect(tagOf(OUTER, '5x+5')).toBe('outer-as-term');        // 3x + (2x + 3) + 2
  });
  it('anything else is told apart as for any terms', () => {
    expect(tagOf(PLUS, '9x+9')).toBe('unmatched');
    expect(tagOf(PLUS, 'x+')).toBe('unreadable');
  });
  it('the pack\'s own problems accept the right answer', () => {
    for (let level = 1; level <= 5; level++) {
      for (const p of packById('distribute-combine').generate(level, 3)) {
        const right = answerText(p).replace(/ /g, '').replace(/−/g, '-');
        expect(CARDS.distribute.check(p, right), JSON.stringify(p)).toEqual({ correct: true, tag: null });
      }
    }
  });
});

describe('Distribute in light mode', () => {
  it('starts at the answer; a right answer first time is clean', () => {
    const s = newDistributeLight(PLUS);
    expect(s).toMatchObject({ stage: 'light', step: 'answer', arrows: false });
    expect(run(s, ...answer('6x+4'))).toMatchObject({ stage: 'done', clean: true });
  });

  it('dist-one: arrows, then ask again; a second wrong answer opens the walk', () => {
    const s = run(newDistributeLight(PLUS), ...answer('2x+4'));
    expect(s).toMatchObject({ stage: 'light', arrows: true, wrongs: 1, tag: 'dist-one' });
    expect(distributeLightFeedbackText(s.feedback)).toBe('3 distributes to both terms: each arrow is a multiplication. Try the answer again.');
    expect(run(s, ...answer('6x+4'))).toMatchObject({ stage: 'done', clean: false });
    expect(run(s, ...answer('2x+4'))).toMatchObject({ stage: 'walk', wrongs: 2, helped: true });
  });

  it('inside-sign-lost: box and circle the inside terms first', () => {
    expect(run(newDistributeLight(SIGN), ...answer('-6x+2'))).toMatchObject({ stage: 'support', support: 'inside', wrongs: 1 });
  });

  it('neg-first: write the hidden 1 first', () => {
    expect(run(newDistributeLight(NEG), ...answer('-2x+9'))).toMatchObject({ stage: 'support', support: 'one', wrongs: 1 });
  });

  it('outer-as-term and unmatched answers go to the walk', () => {
    expect(run(newDistributeLight(OUTER), ...answer('5x+5'))).toMatchObject({ stage: 'walk', tag: 'outer-as-term' });
    expect(run(newDistributeLight(PLUS), ...answer('9x+9'))).toMatchObject({ stage: 'walk' });
  });
});

describe('the problem on the typing mat', () => {
  it('writes the whole problem, with arrows from the number out front to each inside term', () => {
    expect(problemWords(PLUS).map((w) => w.text).join('')).toContain('3');
    const { from, to } = problemLayout(PLUS);
    expect(from).toBeDefined();
    expect(to.length).toBe(2);
  });
});
