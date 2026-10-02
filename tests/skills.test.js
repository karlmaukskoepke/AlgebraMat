import { describe, it, expect } from 'vitest';
import { FADE_AFTER, emptySkills, readSkills, isOn, whichOn, afterProblem } from '../src/engine/skills.js';
import { makeRecord, appendRecord, LOG_CAP } from '../src/engine/eventlog.js';
import { newLightSession, reduceLight } from '../src/engine/lightSession.js';
import { makeProblem } from '../src/engine/expr.js';

const OFF = { partyBattle: false, sign: false };
const out = (o) => ({ tags: [], wrongs: 0, stuck: 0, on: OFF, ...o });

describe('supports that stay on, and fade', () => {
  it('start off, and read whatever was saved as clean whole numbers', () => {
    expect(emptySkills()).toEqual({ partyBattle: 0, sign: 0 });
    expect(readSkills({ partyBattle: 2, sign: 9, extra: 1 })).toEqual({ partyBattle: 2, sign: FADE_AFTER });
    expect(readSkills({ partyBattle: -1, sign: 'x' })).toEqual({ partyBattle: 0, sign: 0 });
    expect(readSkills(null)).toEqual({ partyBattle: 0, sign: 0 });
    expect(isOn({ sign: 1 }, 'sign')).toBe(true);
    expect(whichOn({ partyBattle: 0, sign: 2 })).toEqual({ partyBattle: false, sign: true });
  });

  it('a mistake turns its support on, three clean answers to go', () => {
    expect(afterProblem(emptySkills(), out({ tags: ['sign-dropped'], wrongs: 1 }))).toEqual({ partyBattle: 0, sign: 3 });
    expect(afterProblem(emptySkills(), out({ tags: ['wrong-winner'], wrongs: 1 })).sign).toBe(3);
    expect(afterProblem(emptySkills(), out({ tags: ['battle-as-party'], wrongs: 1 })).partyBattle).toBe(3);
    expect(afterProblem(emptySkills(), out({ tags: ['party-as-battle'], wrongs: 1 })).partyBattle).toBe(3);
    // an unmatched mistake has no skill of its own: nothing turns on
    expect(afterProblem(emptySkills(), out({ tags: ['unmatched'], wrongs: 1 }))).toEqual(emptySkills());
  });

  it('a support that is on counts down with each clean answer, and is off after three', () => {
    let skills = { partyBattle: 0, sign: 3 };
    for (const left of [2, 1, 0]) {
      skills = afterProblem(skills, out({ on: whichOn(skills) }));
      expect(skills.sign).toBe(left);
    }
    expect(afterProblem(skills, out({ on: whichOn(skills) })).sign).toBe(0);        // stays off
  });

  it('a wrong first answer starts the count again, even from another mistake', () => {
    let skills = { partyBattle: 0, sign: 1 };
    skills = afterProblem(skills, out({ tags: ['unmatched'], wrongs: 1, on: whichOn(skills) }));
    expect(skills.sign).toBe(FADE_AFTER);
    skills = afterProblem({ partyBattle: 2, sign: 2 }, out({ tags: ['sign-dropped'], wrongs: 1, on: { partyBattle: true, sign: true } }));
    expect(skills).toEqual({ partyBattle: 3, sign: 3 });                           // a wrong answer re-arms every support that was on
  });

  it('being stuck without a wrong answer changes nothing', () => {
    expect(afterProblem({ partyBattle: 2, sign: 0 }, out({ stuck: 1, on: { partyBattle: true, sign: false } }))).toEqual({ partyBattle: 2, sign: 0 });
  });
});

describe('light mode with supports on', () => {
  const P = makeProblem(-5, '+', 3);
  const answer = (s, n) => [...(n < 0 ? [{ type: 'toggleSign' }] : []), ...[...String(Math.abs(n))].map((d) => ({ type: 'digit', digit: Number(d) })), { type: 'check' }].reduce(reduceLight, s);

  it('the party-or-battle question comes first when that support is on, then the student types', () => {
    let s = newLightSession(P, { partyBattle: 2, sign: 0 });
    expect(s).toMatchObject({ stage: 'support', support: 'partyBattle', step: 'partyBattle', upfront: true, helped: false, on: { partyBattle: true, sign: false } });
    s = reduceLight(s, { type: 'choose', choice: 'battle' });
    expect(s).toMatchObject({ stage: 'light', step: 'answer' });
    s = answer(s, -2);
    expect(s).toMatchObject({ stage: 'done', clean: true });                      // right first try: a clean answer, with the support on
  });

  it('I\'m stuck while that question is up goes to the full walk', () => {
    const s = reduceLight(newLightSession(P, { partyBattle: 3, sign: 0 }), { type: 'stuck' });
    expect(s).toMatchObject({ stage: 'walk', stuck: 1, helped: true });
  });

  it('a wrong answer after the up-front question goes to the full walk, not the same question again', () => {
    let s = reduceLight(newLightSession(P, { partyBattle: 3, sign: 0 }), { type: 'choose', choice: 'battle' });
    s = answer(s, -8);
    expect(s.stage).toBe('walk');
  });

  it('with the sign support on, typing starts at once and the intro says it will read the answer back', () => {
    const s = newLightSession(P, { partyBattle: 0, sign: 3 });
    expect(s).toMatchObject({ stage: 'light', step: 'answer', on: { partyBattle: false, sign: true }, feedback: { key: 'lightIntroSign' } });
  });

  it('keeps what the log needs: the wrong answers typed, the supports shown, being stuck', () => {
    let s = newLightSession(P);
    s = answer(s, 2);                                                              // a dropped sign: the cloze
    s = reduceLight(s, { type: 'stuck' });                                          // stuck inside it: the full walk
    expect(s.answers).toEqual([{ typed: '2', tag: 'sign-dropped' }]);
    expect(s.supportsShown).toEqual(['cloze', 'fullWalk']);
    expect(s.stuck).toBe(1);
    const rec = makeRecord(s, { t: 5, pack: 'combineit', level: 3, problem: '−5 + 3' });
    expect(rec).toEqual({
      t: 5, pack: 'combineit', level: 3, problem: '−5 + 3', answers: [{ typed: '2', tag: 'sign-dropped' }],
      supports: ['cloze', 'fullWalk'], stuck: 1, clean: false, on: { partyBattle: false, sign: false },
    });
  });
});

describe('the log keeps the newest 500', () => {
  it('appends, and drops the oldest past the cap', () => {
    let log = [];
    for (let i = 0; i < LOG_CAP + 5; i++) log = appendRecord(log, { i });
    expect(log).toHaveLength(LOG_CAP);
    expect(log[0].i).toBe(5);
    expect(log.at(-1).i).toBe(LOG_CAP + 4);
    expect(appendRecord(null, { i: 1 })).toEqual([{ i: 1 }]);
  });
});
