import { describe, it, expect } from 'vitest';
import { newBoxLight, reduceBoxLight, rewriteView } from '../src/engine/boxLight.js';
import { tagTerms, CARDS } from '../src/engine/lightCards.js';
import { parseAnswer, makeTerm, makeExpression, termParts } from '../src/engine/terms.js';
import { newTermSession, reduceTerms } from '../src/engine/termSession.js';
import { boxLightPlay } from '../src/play/boxLightPlay.js';
import { boxLightFeedbackText } from '../src/view/boxLightFeedback.js';
import { lassoRange } from '../src/view/boxPointer.js';
import { exprLayout, SHAPE_TOP } from '../src/view/boxLayout.js';
import { generateTermLevel } from '../src/engine/generateTerms.js';

const x = (op, v) => makeTerm('x', op, v);
const n = (op, v) => makeTerm('int', op, v);
const P = (...terms) => ({ ...makeExpression(terms), level: 2 });
const run = (s, ...actions) => actions.reduce(reduceBoxLight, s);
const typed = (text) => [...text.replace(/−/g, '-').replace(/\s+/g, '')].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'typeChar', ch }));
const answer = (text) => [...typed(text), { type: 'check' }];
const check = { type: 'check' };

// 3x − 3 + 4x + 3x = 10x − 3
const SUB = P(x('+', 3), n('-', 3), x('+', 4), x('+', 3));
// the circling of every term, box tool for x and circle for numbers
function drawAll(s) {
  const problem = s.ts.problem;
  const parts = termParts(problem);
  let t = s;
  for (let term = 0; term < problem.terms.length; term++) {
    const idx = parts.map((p, i) => (p.term === term ? i : -1)).filter((i) => i >= 0);
    t = run(t, { type: 'pickTool', tool: problem.terms[term].kind === 'x' ? 'box' : 'circle' }, { type: 'drawShape', from: idx[0], to: idx.at(-1) });
  }
  return run(t, check);
}

describe('Boxes & Circles light mode', () => {
  it('starts at the answer, with the boxes and circles, and the rewrite, there to ask for', () => {
    const s = newBoxLight(SUB);
    expect(s).toMatchObject({ stage: 'light', step: 'answer', entry: '', boxed: false, rewritten: false, feedback: { key: 'blIntro' } });
    expect(boxLightPlay.steps(s).map((t) => t.id)).toEqual(['answer']);
    expect(s.ts.step).toBe('boxcircle');
  });

  it('types an expression with digits, x, + and −', () => {
    const s = run(newBoxLight(SUB), ...typed('10x-3'));
    expect(s.entry).toBe('10x-3');
    expect(run(s, { type: 'backspace' }).entry).toBe('10x-');
    expect(run(s, { type: 'toggleSign' })).toBe(s);
  });

  it('a right answer first time is done and clean', () => {
    const s = run(newBoxLight(SUB), ...answer('10x-3'));
    expect(s).toMatchObject({ stage: 'done', step: 'done', clean: true, finalText: '10x − 3', feedback: { key: 'blCorrect' } });
    expect(boxLightFeedbackText(s.feedback)).toBe('Yes! The answer is 10x − 3.');
    expect(run(s, { type: 'digit', digit: 1 })).toBe(s);
  });

  it('an empty or unreadable Check is not a wrong answer', () => {
    expect(run(newBoxLight(SUB), check)).toMatchObject({ wrongs: 0, feedback: { key: 'typeAnswer' } });
    expect(run(newBoxLight(SUB), ...answer('+'))).toMatchObject({ wrongs: 0, stage: 'light' });
  });

  describe('a wrong answer: draw the boxes and circles first, and only a second one brings in the counters', () => {
    it('the first wrong answer asks for boxes and circles, with the step bar to match', () => {
      const s = run(newBoxLight(SUB), ...answer('9x-3'));
      expect(s).toMatchObject({ stage: 'support', support: 'boxcircle', step: 'boxcircle', wrongs: 1, entry: '', supportsShown: ['boxcircle'] });
      expect(boxLightPlay.steps(s).map((t) => t.label)).toEqual(['Box & Circle', 'Answer']);
      expect(boxLightFeedbackText(s.feedback)).toMatch(/Draw boxes and circles first/);
      expect(run(s, { type: 'digit', digit: 1 })).toBe(s);        // no typing while drawing
    });

    it('the Box & Circle step is the walk\'s own: tools, shapes, then Check goes back to typing with the shapes kept', () => {
      let s = run(newBoxLight(SUB), ...answer('9x-3'));
      s = run(s, { type: 'pickTool', tool: 'box' }, { type: 'drawShape', from: 0, to: 0 });
      expect(s.stage).toBe('support');
      s = drawAll(s);
      expect(s).toMatchObject({ stage: 'light', step: 'answer', boxed: true, support: null });
      expect(s.ts.shapes.length).toBe(4);
      expect(boxLightFeedbackText(s.feedback)).toMatch(/boxed and circled/);
      expect(run(s, ...answer('10x-3'))).toMatchObject({ stage: 'done', clean: false });
    });

    it('Check before every term has a shape says what is missing, and stays', () => {
      let s = run(newBoxLight(SUB), ...answer('9x-3'));
      s = run(s, { type: 'pickTool', tool: 'box' }, { type: 'drawShape', from: 0, to: 0 }, check);
      expect(s).toMatchObject({ stage: 'support', feedback: { src: 'ts', bad: true } });
    });

    it('a second wrong answer opens the walk from Draw, with the boxes and circles already done', () => {
      let s = drawAll(run(newBoxLight(SUB), ...answer('9x-3')));
      s = run(s, ...answer('8x'));
      expect(s).toMatchObject({ stage: 'walk', wrongs: 2, helped: true, supportsShown: ['boxcircle', 'fullWalk'] });
      expect(s.ts.step).toBe('draw');
      expect(boxLightPlay.steps(s).map((t) => t.id)).toContain('draw');
      expect(boxLightFeedbackText(s.feedback)).toMatch(/^Not quite\. Let’s go step by step\./);
    });

    it('I\'m stuck goes the same way: the boxes and circles, then the walk', () => {
      let s = run(newBoxLight(SUB), { type: 'stuck' });
      expect(s).toMatchObject({ stage: 'support', support: 'boxcircle', stuck: 1, wrongs: 0 });
      s = run(s, { type: 'stuck' });
      expect(s).toMatchObject({ stage: 'walk', stuck: 2 });
    });

    it('Teach me step-by-step opens the whole walk at once, from the boxes and circles', () => {
      const s = run(newBoxLight(SUB), { type: 'teach' });
      expect(s).toMatchObject({ stage: 'walk', taught: 1, wrongs: 0, helped: true });
      expect(s.ts.step).toBe('boxcircle');
      expect(boxLightFeedbackText(s.feedback)).toMatch(/Here’s the step-by-step way\./);
    });

    it('the walk plays on to the end (draw, cancel, answer), and is not a clean answer', () => {
      let s = run(newBoxLight(P(x('+', 2), n('+', 3))), { type: 'teach' });
      s = drawAll(s);
      expect(s.ts.step).toBe('draw');
      s.ts = reduceTerms(s.ts, { type: 'pickPiece', pieceType: 'box', sign: '+' });
      s = { ...s };
      s = run(s, { type: 'tapZone', term: 0 }, { type: 'tapZone', term: 0 }, { type: 'pickPiece', pieceType: 'counter', sign: '+' },
        { type: 'tapZone', term: 1 }, { type: 'tapZone', term: 1 }, { type: 'tapZone', term: 1 }, check);
      expect(s.ts.step).toBe('answer');
      s = run(s, ...typed('2x+3'), check);
      expect(s).toMatchObject({ step: 'done', stage: 'walk', clean: false });
    });
  });

  describe('Draw boxes & circles, asked for at any time', () => {
    it('opens the support without anything being wrong; a wrong answer after it goes to the walk', () => {
      let s = run(newBoxLight(SUB), { type: 'drawBoxes' });
      expect(s).toMatchObject({ stage: 'support', support: 'boxcircle', wrongs: 0, helped: true, feedback: { key: 'blBoxesOn' } });
      s = drawAll(s);
      expect(s).toMatchObject({ stage: 'light', boxed: true });
      expect(run(s, ...answer('1x')).stage).toBe('walk');          // boxed already: the next rung is the walk
      expect(run(newBoxLight(SUB), { type: 'drawBoxes' }, { type: 'stuck' }).stage).toBe('walk');
    });

    it('is only there while typing', () => {
      const s = run(newBoxLight(SUB), { type: 'teach' });
      expect(run(s, { type: 'drawBoxes' })).toBe(s);
    });
  });

  describe('Rewrite subtractions, asked for at any time', () => {
    const ask = () => run(newBoxLight(SUB), { type: 'rewriteSubs' });
    const partsOf = (problem, term) => termParts(problem).map((p, i) => (p.term === term ? i : -1)).filter((i) => i >= 0);

    it('opens the support, with the step bar to match', () => {
      const s = ask();
      expect(s).toMatchObject({ stage: 'support', support: 'rewrite', step: 'rewrite', helped: true, wrongs: 0 });
      expect(boxLightPlay.steps(s).map((t) => t.label)).toEqual(['Rewrite', 'Answer']);
      expect(boxLightFeedbackText(s.feedback)).toMatch(/adding the opposite/);
    });

    it('flips the − and the number\'s sign of a subtraction (a half flip asks for the other), and Done rewrites it', () => {
      let s = ask();
      const [op, num] = partsOf(s.problem, 1);
      s = run(s, { type: 'flipPart', index: op });
      expect(s.rw).toEqual({ '1:op': true });
      expect(boxLightFeedbackText(s.feedback)).toMatch(/Flip both signs/);
      expect(run(s, { type: 'doneRewrite' })).toMatchObject({ stage: 'support', feedback: { key: 'flipBoth', bad: true } });
      s = run(s, { type: 'flipPart', index: num });
      expect(boxLightFeedbackText(s.feedback)).toMatch(/another subtraction/);
      s = run(s, { type: 'doneRewrite' });
      expect(s).toMatchObject({ stage: 'light', step: 'answer', rewritten: true, support: null });
      expect(s.problem.terms[1]).toEqual({ kind: 'int', op: '+', value: -3 });      // − 3 became + (−3), with no flip mark left
    });

    it('only the subtractions the student picks are rewritten, and a tap on anything else is told so', () => {
      const two = P(x('+', 3), n('-', 2), x('-', 5));
      let s = run(newBoxLight(two), { type: 'rewriteSubs' });
      expect(run(s, { type: 'flipPart', index: 0 })).toMatchObject({ feedback: { key: 'blNotSub', bad: true } });
      for (const i of partsOf(two, 2)) s = run(s, { type: 'flipPart', index: i });
      s = run(s, { type: 'doneRewrite' });
      expect(s.rewritten).toBe(true);
      expect(s.problem.terms.map((t) => [t.op, t.value])).toEqual([['+', 3], ['-', 2], ['+', -5]]);   // − 2 left alone
    });

    it('tapping a flipped part again takes the flip back; Done with nothing flipped changes nothing', () => {
      let s = ask();
      const [op] = partsOf(s.problem, 1);
      s = run(s, { type: 'flipPart', index: op }, { type: 'flipPart', index: op });
      expect(s.rw).toEqual({});
      s = run(s, { type: 'doneRewrite' });
      expect(s).toMatchObject({ stage: 'light', rewritten: false, feedback: { key: 'blNothingRewritten' } });
    });

    it('the answer is unchanged by the rewrite, and what is rewritten stays rewritten in the walk', () => {
      let s = ask();
      for (const i of partsOf(s.problem, 1)) s = run(s, { type: 'flipPart', index: i });
      s = run(s, { type: 'doneRewrite' });
      expect(CARDS.boxes.check(s.ts.problem, '10x-3').correct).toBe(true);
      const walk = run(s, { type: 'teach' });
      expect(walk.ts.problem.terms[1].op).toBe('+');
      expect(walk.ts.step).toBe('boxcircle');                       // nothing left owing a rewrite
      expect(run(s, ...answer('10x-3')).stage).toBe('done');
    });

    it('the Mat marks every subtraction as one that can flip', () => {
      const v = rewriteView(SUB);
      expect(v.terms.map((t) => Boolean(t.flip))).toEqual([false, true, false, false]);
    });

    it('works on a subtracted negative (− (−5)) the same way', () => {
      const neg = P(x('+', 3), n('-', -5));
      let s = run(newBoxLight(neg), { type: 'rewriteSubs' });
      for (const i of partsOf(neg, 1)) s = run(s, { type: 'flipPart', index: i });
      s = run(s, { type: 'doneRewrite' });
      expect(s.problem.terms[1]).toMatchObject({ op: '+', value: 5 });
    });
  });

  describe('two slips with their own words', () => {
    const ZERO = P(x('+', 3), n('+', 13), x('-', 3));        // 3x + 13 − 3x = 13

    it('0x + 13 is right with a zero term left in: take it out, nothing is wrong', () => {
      const s = run(newBoxLight(ZERO), ...answer('0x+13'));
      expect(s).toMatchObject({ stage: 'light', wrongs: 0, entry: '0x+13', feedback: { key: 'blZeroTerm', bad: true } });
      expect(boxLightFeedbackText(s.feedback)).toMatch(/zero/);
      const fixed = run(s, ...Array(5).fill({ type: 'backspace' }), ...answer('13'));
      expect(fixed).toMatchObject({ stage: 'done', clean: true });
    });

    it('x − 8x typed as −8x: the lone x has an invisible 1, said once before any support', () => {
      const LONE = P(x('+', 1), x('-', 8), n('+', 2));         // x − 8x + 2 = −7x + 2
      let s = run(newBoxLight(LONE), ...answer('-8x+2'));
      expect(s).toMatchObject({ stage: 'light', wrongs: 1, tag: 'invisible-one', hinted: true, feedback: { key: 'blInvisibleOne', bad: true } });
      expect(boxLightFeedbackText(s.feedback)).toMatch(/invisible 1/);
      s = run(s, ...answer('-8x+2'));
      expect(s).toMatchObject({ stage: 'support', support: 'boxcircle' });     // a second time goes up the ladder as usual
    });
  });
});

describe('what a wrong typed answer looked like, for the new slips', () => {
  const want = { x: -7, n: 2 };
  it('a zero term left in is not a wrong answer', () => {
    expect(tagTerms({ x: 0, n: 13 }, parseAnswer('0x+13'))).toBe('zero-term');
    expect(tagTerms({ x: 2, n: 0 }, parseAnswer('2x+0'))).toBe('zero-term');
    expect(tagTerms({ x: 0, n: 13 }, parseAnswer('0x+12'))).not.toBe('zero-term');
  });
  it('the lone x left out of the count', () => {
    const terms = [x('+', 1), x('-', 8), n('+', 2)];
    expect(tagTerms(want, parseAnswer('-8x+2'), terms)).toBe('invisible-one');
    expect(tagTerms(want, parseAnswer('-8x+2'), [])).toBe('x-off');                  // without the terms, an ordinary slip
    expect(tagTerms(want, parseAnswer('-6x+2'), terms)).toBe('x-off');
    expect(tagTerms({ x: 5, n: 0 }, parseAnswer('4x'), [x('+', 1), x('+', 4)])).toBe('invisible-one');
  });
  it('the card reports them for real problems', () => {
    const p = P(x('+', 1), x('-', 8), n('+', 2));
    expect(CARDS.boxes.check(p, '-8x+2')).toEqual({ correct: false, tag: 'invisible-one' });
    expect(CARDS.boxes.check(P(x('+', 3), n('+', 13), x('-', 3)), '0x+13')).toEqual({ correct: false, tag: 'zero-term' });
  });
});

describe('the lasso', () => {
  const problem = P(x('+', 3), n('+', 2), n('+', 5), x('+', 4));
  const layout = exprLayout(problem);
  const mid = (i) => layout.parts[i].cx;

  it('takes the parts under its horizontal span, when it crosses the row of the expression', () => {
    const y = SHAPE_TOP + 20;
    expect(lassoRange(layout, mid(0) - 30, y - 60, mid(0) + 10, y + 10)).toEqual({ from: 0, to: 0 });
    const across = lassoRange(layout, mid(0) - 30, y, mid(2) + 10, y);
    expect(across.from).toBe(0);
    expect(across.to).toBeGreaterThanOrEqual(2);
  });

  it('a press and drag high above the expression, or far below it, takes nothing', () => {
    expect(lassoRange(layout, mid(0), -30, mid(2), 10)).toBeNull();
    expect(lassoRange(layout, mid(0), 600, mid(2), 700)).toBeNull();
  });

  it('keeps the lasso rectangle on the session while dragging, with or without parts under it', () => {
    let s = { ...newTermSession(problem), tool: 'box' };
    const rect = { x0: 10, y0: 20, x1: 80, y1: 90 };
    const withParts = reduceTerms(s, { type: 'selecting', from: 0, to: 1, rect });
    expect(withParts.selecting).toEqual({ from: 0, to: 1, rect });
    const none = reduceTerms(s, { type: 'selecting', rect });
    expect(none.selecting).toEqual({ from: null, to: null, rect });
    expect(reduceTerms(none, { type: 'selecting', rect })).toBe(none);              // the same drag: nothing changes
    expect(reduceTerms(none, { type: 'selecting', rect: { ...rect, x1: 90 } }).selecting.rect.x1).toBe(90);
    expect(reduceTerms(none, { type: 'selecting', clear: true }).selecting).toBeNull();
    expect(reduceTerms(s, { type: 'selecting', rect: { x0: NaN } })).toBe(s);
    expect(reduceTerms(s, { type: 'selecting', from: 0, to: 1 }).selecting).toEqual({ from: 0, to: 1 });   // no rect: as before
  });
});

describe('every Boxes & Circles problem plays in light mode', () => {
  it('right first time, by the boxes and circles, and by the full walk', () => {
    for (let level = 1; level <= 5; level++) {
      for (const seed of [1, 9]) {
        for (const problem of generateTermLevel(level, seed).map((e) => ({ ...e, level }))) {
          const ans = CARDS.boxes.answerText(problem).replace(/ /g, '').replace(/−/g, '-');
          expect(run(newBoxLight(problem), ...answer(ans)), JSON.stringify(problem)).toMatchObject({ stage: 'done', clean: true });
          const boxed = drawAll(run(newBoxLight(problem), { type: 'drawBoxes' }));
          expect(boxed.boxed, JSON.stringify(problem)).toBe(true);
          expect(run(boxed, ...answer(ans)).stage).toBe('done');
          const walk = run(newBoxLight(problem), { type: 'teach' });
          expect(walk.ts.step).toBe(level >= 4 && walk.ts.problem.terms.some((t) => t.op === '-' && t.value < 0) ? 'rewrite' : 'boxcircle');
        }
      }
    }
  });
});
