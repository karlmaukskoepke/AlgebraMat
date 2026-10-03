import { describe, it, expect } from 'vitest';
import { newWalkLight, reduceWalkLight } from '../src/engine/walkLight.js';
import { CARDS, tagTerms } from '../src/engine/lightCards.js';
import { parseAnswer } from '../src/engine/terms.js';
import { packById } from '../src/packs/index.js';
import { boxPlay } from '../src/play/boxPlay.js';
import { lassoPlay } from '../src/play/lassoPlay.js';
import { termGroupPlay } from '../src/play/termGroupPlay.js';
import { distributePlay } from '../src/play/distributePlay.js';
import { integerPlay } from '../src/play/integerPlay.js';
import { bigPlay } from '../src/play/bigPlay.js';
import { walkLightFeedbackText } from '../src/view/walkLightFeedback.js';

const WALKS = { integers: integerPlay, boxes: boxPlay, group: lassoPlay, termGroups: termGroupPlay, distribute: distributePlay };
const typedFrom = (text) => text.replace(/−/g, '-').replace(/\s+/g, '');
const keys = (text, pad) => [...typedFrom(text)].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'typeChar', ch, pad }));
const cardOf = (cardId, walk = WALKS[cardId]) => ({ ...CARDS[cardId], newWalk: walk.newSession, reduceWalk: walk.reduce });
const run = (card, s, ...actions) => actions.reduce((t, a) => reduceWalkLight(t, a, card), s);

// Every card, at a level that shows its range: [pack, level, card].
const CASES = [
  ['combineit', 4, 'integers'], ['combineit', 5, 'integers'], ['flipit', 5, 'integers'],
  ['lasso', 1, 'group'], ['lasso', 3, 'group'], ['lasso', 5, 'group'], ['lasso', 7, 'group'],
  ['boxes', 1, 'boxes'], ['boxes', 3, 'boxes'], ['boxes', 5, 'boxes'],
  ['groups-of-terms', 1, 'termGroups'], ['groups-of-terms', 4, 'termGroups'], ['groups-of-terms', 8, 'termGroups'],
  ['distribute-combine', 1, 'distribute'], ['distribute-combine', 2, 'distribute'], ['distribute-combine', 3, 'distribute'],
];

describe('light mode checks every card\'s typed answer', () => {
  for (const [pack, level, cardId] of CASES) {
    it(`${pack} level ${level}: the answer it states is accepted, and a wrong one is not`, () => {
      const card = CARDS[cardId];
      for (let seed = 1; seed <= 12; seed++) {
        for (const problem of packById(pack).generate(level, seed)) {
          const answer = card.answerText(problem);
          expect(card.check(problem, typedFrom(answer)), `${card.problemText(problem)} = ${answer}`).toEqual({ correct: true, tag: null });
          const wrong = card.check(problem, card.pad === 'integer' ? '999' : '99x+99');
          expect(wrong.correct).toBe(false);
          expect(wrong.tag).not.toBeNull();
          expect(card.check(problem, '').tag).toBe('unreadable');
          expect(card.check(problem, '+-').tag).toBe('unreadable');
          expect(card.problemText(problem)).toMatch(/\S/);
        }
      }
    });
  }
});

describe('what a wrong typed answer looked like', () => {
  const want = { x: 2, n: -3 };
  it('names the usual slips from the numbers', () => {
    expect(tagTerms(want, parseAnswer('2x-3+4-4'))).toBe('uncombined');
    expect(tagTerms(want, parseAnswer('-2x+3'))).toBe('sign-flipped');
    expect(tagTerms(want, parseAnswer('2x-5'))).toBe('n-off');
    expect(tagTerms(want, parseAnswer('3x-3'))).toBe('x-off');
    expect(tagTerms(want, parseAnswer('5x+9'))).toBe('unmatched');
    expect(tagTerms(want, parseAnswer('x+'))).toBe('unreadable');
  });
  it('a plain integer answer: dropped sign or wrong winner', () => {
    expect(tagTerms({ x: 0, n: -4 }, parseAnswer('4'))).toBe('sign-dropped');
    expect(tagTerms({ x: 0, n: 4 }, parseAnswer('-4'))).toBe('wrong-winner');
  });
});

describe('light mode around a card\'s walk', () => {
  const card = cardOf('boxes');
  const problem = packById('boxes').generate(1, 5)[0];
  const answer = CARDS.boxes.answerText(problem);
  const start = () => newWalkLight(problem, card);

  it('starts at the answer, with nothing helped', () => {
    expect(start()).toMatchObject({ stage: 'light', step: 'answer', entry: '', helped: false, clean: false, walk: null, wrongs: 0, stuck: 0 });
  });

  it('types with the algebra pad and deletes', () => {
    let s = run(card, start(), { type: 'digit', digit: 4 }, { type: 'typeChar', ch: 'x' }, { type: 'typeChar', ch: '+' }, { type: 'digit', digit: 2 });
    expect(s.entry).toBe('4x+2');
    expect(run(card, s, { type: 'backspace' }).entry).toBe('4x+');
    expect(run(card, s, { type: 'typeChar', ch: 'q' })).toBe(s);
    expect(run(card, s, { type: 'toggleSign' })).toBe(s);          // ± is the integer pad's
  });

  it('the integer pad types a number: ± or a leading −, no x or +, a short cap', () => {
    const c = cardOf('integers');
    const p = packById('combineit').generate(4, 3)[0];
    let s = run(c, newWalkLight(p, c), { type: 'toggleSign' }, { type: 'digit', digit: 1 }, { type: 'digit', digit: 2 });
    expect(s.entry).toBe('-12');
    expect(run(c, s, { type: 'toggleSign' }).entry).toBe('12');
    expect(run(c, s, { type: 'typeChar', ch: 'x' })).toBe(s);
    expect(run(c, newWalkLight(p, c), { type: 'typeChar', ch: '-' }).entry).toBe('-');
    s = run(c, s, { type: 'digit', digit: 3 }, { type: 'digit', digit: 4 });
    expect(s.entry).toBe('-1234');
    expect(run(c, s, { type: 'digit', digit: 5 })).toBe(s);
  });

  it('a right answer first time is done and clean', () => {
    const s = run(card, start(), ...keys(answer), { type: 'check' });
    expect(s).toMatchObject({ stage: 'done', step: 'done', clean: true, finalText: answer, feedback: { key: 'wlCorrect' }, helped: false });
    expect(run(card, s, { type: 'digit', digit: 1 })).toBe(s);       // nothing moves once done
  });

  it('an empty or unreadable Check is not a wrong answer', () => {
    const empty = run(card, start(), { type: 'check' });
    expect(empty).toMatchObject({ stage: 'light', wrongs: 0, feedback: { key: 'typeAnswer', bad: true } });
    const odd = run(card, start(), { type: 'typeChar', ch: '+' }, { type: 'check' });
    expect(odd).toMatchObject({ stage: 'light', wrongs: 0, feedback: { key: 'answerUnreadable' } });
  });

  it('a wrong answer opens the full walk on the same problem, and is logged with what it looked like', () => {
    const s = run(card, start(), { type: 'digit', digit: 1 }, { type: 'check' });
    expect(s).toMatchObject({ stage: 'walk', helped: true, wrongs: 1, entry: '', supportsShown: ['fullWalk'], feedback: { key: 'wlWalk' } });
    expect(s.tags).toHaveLength(1);
    expect(s.answers).toEqual([{ typed: '1', tag: s.tag }]);
    expect(s.walk.problem).toEqual(problem);   // (the session keeps its own copy)
    expect(s.step).toBe(s.walk.step);
  });

  it('I\'m stuck opens the walk without a wrong answer', () => {
    const s = run(card, start(), { type: 'stuck' });
    expect(s).toMatchObject({ stage: 'walk', stuck: 1, wrongs: 0, helped: true, feedback: { key: 'wlStuck' } });
    expect(s.tags).toEqual([]);
  });

  it('the walk takes over: its moves run, its messages show, and finishing it is not a clean answer', () => {
    let s = run(card, start(), { type: 'stuck' });
    const before = s.walk;
    s = run(card, s, { type: 'pickTool', tool: 'box' });
    expect(s.walk).not.toBe(before);
    expect(s.feedback.src).toBe('walk');
    // a walk that finishes, with a stand-in walk: the light session mirrors its done
    const fake = { ...card, newWalk: (p) => ({ problem: p, step: 'answer', skipped: [], feedback: null }), reduceWalk: (w, a) => (a.type === 'finish' ? { ...w, step: 'done', finalText: 'ok', feedback: { key: 'correct' } } : w) };
    let t = run(fake, newWalkLight(problem, fake), { type: 'digit', digit: 9 }, { type: 'check' });
    t = run(fake, t, { type: 'finish' });
    expect(t).toMatchObject({ stage: 'walk', step: 'done', finalText: 'ok', clean: false });
  });

  it('words: its own messages by key, the walk\'s for walk messages', () => {
    expect(walkLightFeedbackText({ key: 'wlCorrect', params: { answer: '-4x + 2' } }, () => 'x')).toBe('Yes! The answer is −4x + 2.');
    expect(walkLightFeedbackText({ key: 'answerUnreadable', params: { pad: 'algebra' } }, () => 'x')).toMatch(/2x \+ 3/);
    expect(walkLightFeedbackText({ key: 'answerUnreadable', params: { pad: 'integer' } }, () => 'x')).toMatch(/−2 or 7/);
    expect(walkLightFeedbackText({ key: 'whatever', src: 'walk' }, (fb) => `walk:${fb.key}`)).toBe('walk:whatever');
    expect(walkLightFeedbackText(null, () => 'x')).toBe('');
  });
});

describe('light mode starts every walk', () => {
  for (const [pack, level, cardId] of CASES) {
    it(`${pack} level ${level}: Stuck brings in a walk that has steps`, () => {
      const card = cardOf(cardId);
      const problem = packById(pack).generate(level, 9)[0];
      const s = run(card, newWalkLight(problem, card), { type: 'stuck' });
      expect(s.stage).toBe('walk');
      expect(WALKS[cardId].steps(s.walk).length).toBeGreaterThan(2);
    });
  }
  it('Combine it level 5 starts the big-number walk', () => {
    const card = cardOf('integers', bigPlay);
    const problem = packById('combineit').generate(5, 2)[0];
    expect(run(card, newWalkLight(problem, card), { type: 'stuck' }).walk.step).toBe('boxcircle');
  });
});
