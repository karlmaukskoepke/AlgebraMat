import { describe, it, expect } from 'vitest';
import { newTermGroupLight, reduceTermGroupLight, insideExpression } from '../src/engine/termGroupLight.js';
import { tagTermGroups, CARDS } from '../src/engine/lightCards.js';
import { makeTermGroups } from '../src/engine/termGroups.js';
import { parseAnswer, termParts } from '../src/engine/terms.js';
import { termGroupLightPlay } from '../src/play/termGroupLightPlay.js';
import { termGroupLightFeedbackText } from '../src/view/termGroupLightFeedback.js';
import { problemWords } from '../src/view/groupLightMat.js';
import { packById } from '../src/packs/index.js';

const X = (value) => ({ kind: 'x', value });
const N = (value) => ({ kind: 'int', value });
const P = (count, inside, opts) => makeTermGroups(count, inside, opts);
const typed = (text) => [...text.replace(/−/g, '-').replace(/\s+/g, '')].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'typeChar', ch }));
const answer = (text) => [...typed(text), { type: 'check' }];
const run = (s, ...actions) => actions.reduce(reduceTermGroupLight, s);
const tagOf = (problem, text) => tagTermGroups(problem, parseAnswer(text));

describe('what a wrong answer to a Groups of Terms problem looked like (Karl, 2026-10-03)', () => {
  it('the number out front reached only one term: 2(4x + 1) answered 8x + 1', () => {
    const p = P({ n: 2 }, [X(4), N(1)]);
    expect(tagOf(p, '8x+1')).toBe('dist-one');
    expect(tagOf(p, '4x+2')).toBe('dist-one');                       // the other term only
    expect(tagOf(P({ n: 3 }, [N(5), X(2)]), '15+2x')).toBe('dist-one');
    expect(CARDS.termGroups.check(p, '8x+2')).toEqual({ correct: true, tag: null });
  });

  it('a negative term inside lost its sign: −3(2x − 1) answered −6x − 3', () => {
    const p = P({ neg: true, n: 3 }, [X(2), N(-1)]);
    expect(tagOf(p, '-6x-3')).toBe('inside-sign-lost');
    expect(tagOf(P({ n: 3 }, [X(2), N(-1)]), '6x+3')).toBe('inside-sign-lost');
    expect(tagOf(P({ n: 2 }, [X(-3), N(4)]), '6x+8')).toBe('inside-sign-lost');
    expect(CARDS.termGroups.check(p, '-6x+3').correct).toBe(true);
  });

  it('a negative out front went to the first term only: −(2x + 5) answered −2x + 5', () => {
    const p = P({ neg: true, n: 1 }, [X(2), N(5)], { hidden1: true });
    expect(tagOf(p, '-2x+5')).toBe('neg-first');
    expect(tagOf(P({ neg: true, n: 1 }, [N(5), X(2)], { hidden1: true }), '-5+2x')).toBe('neg-first');   // number first: the number
    // with the 1 written (−1(2x + 5)) it's the ordinary slip
    expect(tagOf(P({ neg: true, n: 1 }, [X(2), N(5)]), '-2x+5')).toBe('dist-one');
  });

  it('the number out front added as a term: 2(2x + 3) answered 2x + 5', () => {
    const p = P({ n: 2 }, [X(2), N(3)]);
    expect(tagOf(p, '2x+5')).toBe('outer-as-term');
    expect(tagOf(P({ n: 2 }, [X(3), N(3)]), '5x+3')).toBe('outer-as-term');   // added to the x term
    expect(tagOf(P({ neg: true, n: 3 }, [X(2), N(5)]), '2x+2')).toBe('outer-as-term');
  });

  it('anything else is told apart as for any terms, and fractions are left to the walk', () => {
    const p = P({ n: 2 }, [X(4), N(1)]);
    expect(tagOf(p, '9x+9')).toBe('unmatched');
    expect(tagOf(p, '8x+2+0x')).toBe('zero-term');
    expect(tagOf(p, 'x+')).toBe('unreadable');
    const frac = P({ n: 1, d: 2 }, [X(4), N(6)]);
    expect(tagOf(frac, '4x+6')).not.toBe('dist-one');
  });

  it('the pack\'s own problems are all classified, and the right answer always passes', () => {
    for (let level = 1; level <= 5; level++) {
      for (const seed of [1, 7, 21]) {
        for (const p of packById('groups-of-terms').generate(level, seed)) {
          const right = CARDS.termGroups.answerText(p).replace(/ /g, '').replace(/−/g, '-');
          expect(CARDS.termGroups.check(p, right), JSON.stringify(p)).toEqual({ correct: true, tag: null });
        }
      }
    }
  });
});

describe('Groups of Terms in light mode', () => {
  const DIST = P({ n: 2 }, [X(4), N(1)]);                                      // 2(4x + 1) = 8x + 2
  const SIGN = P({ neg: true, n: 3 }, [X(2), N(-1)]);                          // −3(2x − 1) = −6x + 3
  const NEG = P({ neg: true, n: 1 }, [X(2), N(5)], { hidden1: true });         // −(2x + 5) = −2x − 5
  const OUTER = P({ n: 2 }, [X(2), N(3)]);                                     // 2(2x + 3) = 4x + 6

  it('starts at the answer', () => {
    const s = newTermGroupLight(DIST);
    expect(s).toMatchObject({ stage: 'light', step: 'answer', arrows: false, rung: 0, feedback: { key: 'tgIntro' } });
    expect(termGroupLightPlay.steps(s).map((t) => t.id)).toEqual(['answer']);
  });

  it('a right answer first time is done and clean', () => {
    const s = run(newTermGroupLight(DIST), ...answer('8x+2'));
    expect(s).toMatchObject({ stage: 'done', step: 'done', clean: true, finalText: '8x + 2' });
    expect(termGroupLightFeedbackText(s.feedback)).toBe('Yes! The answer is 8x + 2.');
    expect(run(s, ...typed('1'))).toBe(s);
  });

  it('empty and unreadable checks are not wrong; 0x + 2 is right with a zero term to take out', () => {
    expect(run(newTermGroupLight(DIST), { type: 'check' })).toMatchObject({ wrongs: 0, feedback: { key: 'typeAnswer' } });
    expect(run(newTermGroupLight(DIST), ...answer('+'))).toMatchObject({ wrongs: 0 });
    expect(run(newTermGroupLight(P({ n: 2 }, [X(1), N(-1)])), ...answer('2x-2+0x'))).toMatchObject({ wrongs: 0, feedback: { key: 'tgZeroTerm' } });
  });

  describe('2(4x + 1) answered 8x + 1: the arrows, then ask again, and only then the groups', () => {
    it('shows the arrows with "2 distributes to both terms", and goes straight back to typing', () => {
      const s = run(newTermGroupLight(DIST), ...answer('8x+1'));
      expect(s).toMatchObject({ stage: 'light', step: 'answer', arrows: true, arrowsFresh: true, rung: 1, wrongs: 1, tag: 'dist-one', entry: '' });
      expect(termGroupLightFeedbackText(s.feedback)).toBe('2 distributes to both terms: each arrow is a multiplication. Try the answer again.');
      expect(run(s, { type: 'digit', digit: 1 })).toMatchObject({ entry: '1', arrowsFresh: false });   // typed over the arrows, which stay
      expect(run(s, ...answer('8x+2'))).toMatchObject({ stage: 'done', clean: false });
    });

    it('a second wrong answer opens the groups walk', () => {
      const s = run(newTermGroupLight(DIST), ...answer('8x+1'), ...answer('8x+1'));
      expect(s).toMatchObject({ stage: 'walk', wrongs: 2, helped: true });
      expect(s.g.step).toBe('groups');
      expect(termGroupLightPlay.steps(s).map((t) => t.id)).toEqual(['groups', 'sign', 'fill', 'flip', 'answer', 'checkit']);
      expect(termGroupLightFeedbackText(s.feedback)).toMatch(/^Not quite\. Let’s go step by step\./);
    });
  });

  describe('−3(2x − 1) answered −6x − 3: box and circle the terms inside, then the arrows', () => {
    const insideDone = (s) => {
      let t = s;
      const parts = termParts(t.ts.problem);
      t = run(t, { type: 'pickTool', tool: 'box' }, { type: 'drawShape', from: 0, to: 0 });
      t = run(t, { type: 'pickTool', tool: 'circle' }, { type: 'drawShape', from: 1, to: parts.length - 1 }, { type: 'check' });
      return t;
    };

    it('asks for Box & Circle on the terms inside, with the step bar to match', () => {
      const s = run(newTermGroupLight(SIGN), ...answer('-6x-3'));
      expect(s).toMatchObject({ stage: 'support', support: 'inside', step: 'boxcircle', wrongs: 1, rung: 1, arrows: false });
      expect(termGroupLightPlay.steps(s).map((t) => t.label)).toEqual(['Box & Circle', 'Answer']);
      expect(s.ts.problem.terms.map((t) => [t.kind, t.op, t.value])).toEqual([['x', '+', 2], ['int', '-', 1]]);
      expect(termGroupLightFeedbackText(s.feedback)).toMatch(/Box the x term and circle the number inside the parentheses/);
      expect(run(s, { type: 'digit', digit: 1 })).toBe(s);          // no typing while drawing
    });

    it('Check with both terms shaped draws the arrows and goes back to typing; Check too soon says what is missing', () => {
      let s = run(newTermGroupLight(SIGN), ...answer('-6x-3'));
      s = run(s, { type: 'pickTool', tool: 'box' }, { type: 'drawShape', from: 0, to: 0 }, { type: 'check' });
      expect(s).toMatchObject({ stage: 'support', feedback: { src: 'ts', bad: true } });
      s = insideDone(run(newTermGroupLight(SIGN), ...answer('-6x-3')));
      expect(s).toMatchObject({ stage: 'light', step: 'answer', arrows: true, support: null, ts: null });
      expect(termGroupLightFeedbackText(s.feedback)).toBe('Boxed and circled, signs and all. Now −3 distributes to both terms: each arrow is a multiplication. Try the answer again.');
      expect(run(s, ...answer('-6x+3'))).toMatchObject({ stage: 'done', clean: false });
    });

    it('a second wrong answer after that opens the walk', () => {
      const s = run(insideDone(run(newTermGroupLight(SIGN), ...answer('-6x-3'))), ...answer('-6x-3'));
      expect(s.stage).toBe('walk');
    });
  });

  describe('−(2x + 5) answered −2x + 5: write the hidden 1 first, then the arrows', () => {
    it('asks for the hidden 1 (the walk\'s own first step), then draws the arrows with −1 out front', () => {
      let s = run(newTermGroupLight(NEG), ...answer('-2x+5'));
      expect(s).toMatchObject({ stage: 'support', support: 'one', step: 'groups', tag: 'neg-first', arrows: false });
      expect(termGroupLightPlay.steps(s).map((t) => t.label)).toEqual(['Write the 1', 'Answer']);
      expect(termGroupLightFeedbackText(s.feedback)).toMatch(/Write the hidden 1 in the gap/);
      s = run(s, { type: 'digit', digit: 2 }, { type: 'check' });                      // not 1
      expect(s).toMatchObject({ stage: 'support', support: 'one', feedback: { src: 'tg', bad: true } });
      s = run(s, { type: 'backspace' }, { type: 'digit', digit: 1 }, { type: 'check' });
      expect(s).toMatchObject({ stage: 'light', arrows: true, support: null });
      expect(termGroupLightFeedbackText(s.feedback)).toBe('Now it reads −1(…): −1 distributes to both terms, and each arrow is a multiplication. Try the answer again.');
      expect(s.g.wroteOne).toBe(true);
      expect(run(s, ...answer('-2x-5'))).toMatchObject({ stage: 'done' });
    });

    it('a second wrong answer opens the walk with the 1 already written', () => {
      let s = run(newTermGroupLight(NEG), ...answer('-2x+5'), { type: 'digit', digit: 1 }, { type: 'check' });
      s = run(s, ...answer('-2x+5'));
      expect(s).toMatchObject({ stage: 'walk' });
      expect(s.g.wroteOne).toBe(true);
    });
  });

  it('2(2x + 3) answered 2x + 5: the number out front is not a term, so straight to the groups', () => {
    const s = run(newTermGroupLight(OUTER), ...answer('2x+5'));
    expect(s).toMatchObject({ stage: 'walk', tag: 'outer-as-term', arrows: false, wrongs: 1 });
    expect(termGroupLightFeedbackText(s.feedback)).toMatch(/^Look at the number out front: it isn’t a term to add, it says how many groups\./);
  });

  it('any other mistake goes to the walk too; and the walk plays on to the end', () => {
    expect(run(newTermGroupLight(DIST), ...answer('9x+9')).stage).toBe('walk');
    const frac = P({ n: 1, d: 2 }, [X(4), N(6)]);
    expect(run(newTermGroupLight(frac), ...answer('4x+6')).stage).toBe('walk');
  });

  it('I\'m stuck shows the arrows first, then the walk; Teach me opens the walk at once', () => {
    let s = run(newTermGroupLight(DIST), { type: 'stuck' });
    expect(s).toMatchObject({ stage: 'light', arrows: true, stuck: 1, wrongs: 0, rung: 1 });
    expect(termGroupLightFeedbackText(s.feedback)).toMatch(/2 distributes to both terms/);
    s = run(s, { type: 'stuck' });
    expect(s).toMatchObject({ stage: 'walk', stuck: 2 });
    expect(run(newTermGroupLight(DIST), { type: 'teach' })).toMatchObject({ stage: 'walk', taught: 1, helped: true });
    expect(run(run(newTermGroupLight(SIGN), ...answer('-6x-3')), { type: 'stuck' }).stage).toBe('walk');   // stuck inside a support
  });

  it('draws the problem as words with the number out front first, for the arrows to point at', () => {
    expect(problemWords(DIST).map((w) => w.text)).toEqual(['2', '(', '4x', '+', '1', ')']);
    expect(problemWords(SIGN).map((w) => w.text)).toEqual(['−3', '(', '2x', '−', '1', ')']);
    expect(insideExpression(SIGN).terms).toHaveLength(2);
  });
});
