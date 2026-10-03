import { describe, it, expect } from 'vitest';
import { newLightSession, reduceLight as reduce } from '../src/engine/lightSession.js';
import { classify, firstSupport } from '../src/engine/scaffold.js';
import { lightPlay } from '../src/play/lightPlay.js';
import { lightFeedbackText } from '../src/view/lightFeedback.js';
import { makeProblem, evaluate, partyOrBattle } from '../src/engine/expr.js';
import { generateCombineLevel } from '../src/engine/generateCombine.js';

const run = (s, ...actions) => actions.reduce(reduce, s);
const check = { type: 'check' };
const stuck = { type: 'stuck' };
const typed = (n) => [...(n < 0 ? [{ type: 'toggleSign' }] : []), ...[...String(Math.abs(n))].map((d) => ({ type: 'digit', digit: Number(d) }))];
const answer = (n) => [...typed(n), check];
const P = (a, b) => makeProblem(a, '+', b);

// Do the full walk's work for a problem (counters, party or battle, cancel, answer).
function finishWalk(s) {
  const problem = s.problem;
  let t = s;
  for (const [z, n] of [[0, problem.left.value], [1, problem.right.value]]) {
    t = run(t, { type: 'pickSign', sign: n > 0 ? '+' : '-' }, ...Array(Math.abs(n)).fill({ type: 'tapZone', zone: z }));
  }
  t = run(t, check, { type: 'choose', choice: partyOrBattle(problem) });
  for (;;) {
    const all = t.walk.zones.flatMap((zn, z) => zn.map((c, i) => ({ z, i, c })));
    const plus = all.find((x) => x.c.sign === '+' && !x.c.canceled);
    const minus = all.find((x) => x.c.sign === '-' && !x.c.canceled);
    if (t.step !== 'cancel' || !plus || !minus) break;
    t = run(t, { type: 'tapCounter', zone: plus.z, index: plus.i }, { type: 'tapCounter', zone: minus.z, index: minus.i });
  }
  return run(t, ...answer(evaluate(problem)));
}

describe('light mode', () => {
  it('starts at the answer, with the step bar showing just that', () => {
    const s = newLightSession(P(-5, 3));
    expect(s).toMatchObject({ stage: 'light', step: 'answer', entry: '', feedback: { key: 'lightIntro' } });
    expect(lightPlay.steps(s).map((t) => t.id)).toEqual(['answer']);
  });

  it('types with the pad (± flips a leading minus), deletes, and caps the length', () => {
    let s = run(newLightSession(P(-5, 3)), { type: 'toggleSign' }, { type: 'digit', digit: 2 });
    expect(s.entry).toBe('-2');
    s = run(s, { type: 'toggleSign' });
    expect(s.entry).toBe('2');
    s = run(s, { type: 'backspace' });
    expect(s.entry).toBe('');
    s = run(s, ...Array(8).fill({ type: 'digit', digit: 1 }));
    expect(s.entry).toBe('1111');
    // the keyboard's − types a leading minus, once
    expect(run(newLightSession(P(-5, 3)), { type: 'typeChar', ch: '-' }, { type: 'typeChar', ch: '-' }).entry).toBe('-');
  });

  it('right on the first try is done, and a clean answer', () => {
    const s = run(newLightSession(P(-5, 3)), ...answer(-2));
    expect(s).toMatchObject({ stage: 'done', step: 'done', clean: true, finalText: '-2', wrongs: 0 });
    expect(lightFeedbackText(s.feedback)).toBe('Yes! The answer is −2.');
  });

  it('an empty or garbled answer is not a wrong try', () => {
    let s = run(newLightSession(P(-5, 3)), check);
    expect(s).toMatchObject({ stage: 'light', wrongs: 0, feedback: { key: 'typeAnswer', bad: true } });
    s = run(s, { type: 'toggleSign' }, check);
    expect(s).toMatchObject({ stage: 'light', wrongs: 0, feedback: { key: 'answerUnreadable' } });
  });

  it('a wrong answer brings in the party-or-battle question, with the step bar to match', () => {
    const s = run(newLightSession(P(-5, 3)), ...answer(-8));       // a battle answered by adding the sizes
    expect(s).toMatchObject({ stage: 'support', support: 'partyBattle', step: 'partyBattle', wrongs: 1, tag: 'battle-as-party', entry: '' });
    expect(lightFeedbackText(s.feedback)).toBe('Let’s look at −5 and 3. Same signs, or different signs?');
    expect(lightPlay.steps(s).map((t) => t.id)).toEqual(['partyBattle', 'answer']);
    expect(reduce(s, { type: 'digit', digit: 1 })).toBe(s);          // no typing during the question
  });

  it('the right choice goes back to typing, and a wrong choice is just a nudge', () => {
    let s = run(newLightSession(P(-5, 3)), ...answer(-8));
    s = run(s, { type: 'choose', choice: 'party' });
    expect(s).toMatchObject({ stage: 'support', feedback: { key: 'lightSameOrDifferent', bad: true }, wrongs: 1 });
    s = run(s, { type: 'choose', choice: 'battle' });
    expect(s).toMatchObject({ stage: 'light', step: 'answer', support: null, feedback: { key: 'lightBattleOk' } });
    s = run(s, ...answer(-2));
    expect(s).toMatchObject({ stage: 'done', clean: false });         // right after a support isn't clean
  });

  it('wrong again after a support goes to the full walk, which plays through to done', () => {
    let s = run(newLightSession(P(-5, 3)), ...answer(-8), { type: 'choose', choice: 'battle' }, ...answer(7));
    expect(s).toMatchObject({ stage: 'walk', step: 'draw', wrongs: 2, feedback: { key: 'lightWalk' } });
    expect(lightPlay.steps(s).map((t) => t.id)).toEqual(['draw', 'partyBattle', 'cancel', 'answer']);
    s = finishWalk(s);
    expect(s).toMatchObject({ stage: 'walk', step: 'done', clean: false });
  });

  it('an answer that matches no mistake goes straight to the full walk', () => {
    const s = run(newLightSession(P(-5, 3)), ...answer(7));
    expect(s).toMatchObject({ stage: 'walk', tag: 'unmatched' });
  });

  it('I\'m stuck starts at the smallest support, and the next press goes to the full walk', () => {
    let s = run(newLightSession(P(-5, 3)), stuck);
    expect(s).toMatchObject({ stage: 'support', support: 'partyBattle', stuck: 1, wrongs: 0 });
    s = run(s, stuck);
    expect(s).toMatchObject({ stage: 'walk', stuck: 2 });
    expect(run(s, stuck)).toBe(s);                                    // nothing after the full walk
  });

  it('a sign mistake brings in the cloze, with the step bar to match', () => {
    const s = run(newLightSession(P(-5, 3)), ...answer(2));            // the sign dropped
    expect(s).toMatchObject({ stage: 'support', support: 'cloze', step: 'cloze', tag: 'sign-dropped', entry: '' });
    expect(s.cloze.sentence).toBe('The battle of −5 and 3 leaves ____ standing.');
    expect(s.cloze.choices.map((c) => c.text).sort()).toEqual(['negative 2', 'negative 8', 'positive 2', 'positive 8']);
    expect(lightPlay.steps(s).map((t) => t.label)).toEqual(['Say it', 'Answer']);
    expect(lightFeedbackText(s.feedback)).toMatch(/who is left standing/);
    expect(reduce(s, { type: 'digit', digit: 1 })).toBe(s);          // no typing during the cloze
    expect(run(newLightSession(P(5, -3)), ...answer(-2)).support).toBe('cloze');   // wrong-winner too
  });

  it('every pick is read aloud, a wrong pick says what is off and is crossed out, with no penalty', () => {
    let s = run(newLightSession(P(-5, 3)), ...answer(2));
    const wrongSign = s.cloze.choices.find((c) => c.mistake === 'sign');
    const wrongSize = s.cloze.choices.find((c) => c.mistake === 'size');
    s = run(s, { type: 'pickChoice', index: wrongSign.index });
    expect(s.spoken).toEqual({ id: 1, text: 'The battle of negative five and three leaves positive two standing.' });
    expect(s).toMatchObject({ stage: 'support', wrongs: 1, feedback: { key: 'clozeSign', bad: true } });   // wrongs: the typed answer only
    expect(s.cloze.tried).toEqual([wrongSign.index]);
    expect(run(s, { type: 'pickChoice', index: wrongSign.index })).toBe(s);   // a crossed-out choice can't be picked again
    s = run(s, { type: 'pickChoice', index: wrongSize.index });
    expect(s.spoken.id).toBe(2);
    expect(s.feedback.key).toBe('clozeSize');
    expect(lightFeedbackText(s.feedback)).toMatch(/battle the two sides cancel/);
    expect(reduce(s, { type: 'pickChoice', index: 9 })).toBe(s);
  });

  it('the right pick shows what is left over, goes back to typing, and keeps it on the Mat', () => {
    let s = run(newLightSession(P(-5, 3)), ...answer(2));
    const right = s.cloze.choices.find((c) => c.right);
    s = run(s, { type: 'pickChoice', index: right.index });
    expect(s).toMatchObject({
      stage: 'light', step: 'answer', support: null, cloze: null,
      said: { sentence: 'The battle of −5 and 3 leaves negative 2 standing.', leftover: { sign: '-', count: 2 } },
      feedback: { key: 'lightClozeRight' },
    });
    expect(s.spoken.text).toBe('The battle of negative five and three leaves negative two standing.');
    expect(lightFeedbackText(s.feedback)).toBe('Yes, negative 2! Now type the answer, with its sign.');
    s = run(s, ...answer(-2));
    expect(s).toMatchObject({ stage: 'done', clean: false });
  });

  it('a party gets its own sentence, and being stuck again in the cloze goes to the full walk', () => {
    let s = run(newLightSession(P(-4, -6)), ...answer(10));            // a negative party answered positive
    expect(s.cloze.sentence).toBe('The party of −4 and −6 has ____ in all.');
    expect(lightFeedbackText(s.feedback)).toMatch(/party worth/);
    s = run(s, stuck);
    expect(s).toMatchObject({ stage: 'walk', stuck: 1 });
  });

  it('a right answer after being stuck is done but not clean', () => {
    const s = run(newLightSession(P(-5, 3)), stuck, { type: 'choose', choice: 'battle' }, ...answer(-2));
    expect(s).toMatchObject({ stage: 'done', clean: false, stuck: 1 });
  });

  it('plays every problem Levels 1 to 3 hand out: right first try, and by the full walk', () => {
    for (let level = 1; level <= 3; level++) {
      for (const seed of [1, 7, 99]) {
        for (const p of generateCombineLevel(level, seed)) {
          const direct = run(newLightSession(p), ...answer(evaluate(p)));
          expect(direct, JSON.stringify(p)).toMatchObject({ stage: 'done', clean: true });
          const stuckToWalk = finishWalk(run(newLightSession(p), stuck, stuck));
          expect(stuckToWalk.step, JSON.stringify(p)).toBe('done');
        }
      }
    }
  });
});

describe('light mode on Flip It\'s subtractions', () => {
  const S = (a, b) => makeProblem(a, '-', b);

  it('typing the sum of the numbers (the minus kept as a minus) is its own mistake', () => {
    expect(classify(S(5, -3), '2')).toEqual({ correct: false, tag: 'minus-as-minus' });
    expect(classify(S(5, -3), '8')).toEqual({ correct: true, tag: null });
    expect(classify(S(-5, -3), '-8')).toEqual({ correct: false, tag: 'minus-as-minus' });
    expect(firstSupport('minus-as-minus')).toBe('partyBattle');
  });

  it('shows the subtraction as the addition it becomes before asking party or battle', () => {
    const s = run(newLightSession(S(5, -3)), ...answer(2));
    expect(s).toMatchObject({ stage: 'support', support: 'partyBattle', feedback: { key: 'lightPartyBattleSub' } });
    expect(lightFeedbackText(s.feedback)).toMatch(/Subtracting is adding the opposite/);
    expect(lightFeedbackText(s.feedback)).toMatch(/5 − \(−3\) is 5 \+ 3/);
  });

  it('a subtraction\'s full walk is Flip It\'s, starting at Rewrite', () => {
    let s = newLightSession(S(5, -3));
    s = run(s, ...answer(2));      // partyBattle
    s = run(s, { type: 'stuck' }); // next rung: the cloze
    s = run(s, { type: 'stuck' }); // full walk
    expect(s.stage).toBe('walk');
    expect(s.walk.step).toBe('rewrite');
  });
});
