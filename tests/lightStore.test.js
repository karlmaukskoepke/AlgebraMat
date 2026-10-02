import { describe, it, expect, beforeEach } from 'vitest';
import { loadSkills, loadLog, recordProblem, SKILLS_KEY, LOG_KEY } from '../src/lightStore.js';
import { newLightSession, reduceLight } from '../src/engine/lightSession.js';
import { makeProblem } from '../src/engine/expr.js';
import { combineit } from '../src/packs/combineit.js';

const P = makeProblem(-5, '+', 3);
const run = (s, ...a) => a.reduce(reduceLight, s);
const type = (n) => [...(n < 0 ? [{ type: 'toggleSign' }] : []), ...[...String(Math.abs(n))].map((d) => ({ type: 'digit', digit: Number(d) })), { type: 'check' }];

beforeEach(() => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); },
  };
});

describe('light mode\'s per-device memory', () => {
  it('starts with nothing on and an empty log, and survives a store that throws', () => {
    expect(loadSkills()).toEqual({ partyBattle: 0, sign: 0 });
    expect(loadLog()).toEqual([]);
    globalThis.localStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
    expect(loadSkills()).toEqual({ partyBattle: 0, sign: 0 });
    expect(() => recordProblem(run(newLightSession(P), ...type(-2)), { pack: 'combineit', level: 3, problem: 'x' })).not.toThrow();
  });

  it('a mistake turns a support on for the next problem, and three clean answers turn it off', () => {
    // a dropped sign, then a right answer after the cloze
    let s = run(newLightSession(P, loadSkills()), ...type(2));
    const right = s.cloze.choices.find((c) => c.right);
    s = run(s, { type: 'pickChoice', index: right.index }, ...type(-2));
    recordProblem(s, { pack: 'combineit', level: 3, problem: '−5 + 3' });
    expect(loadSkills()).toEqual({ partyBattle: 0, sign: 3 });
    for (const left of [2, 1, 0]) {
      const next = newLightSession(P, loadSkills());
      expect(next.on.sign).toBe(true);
      recordProblem(run(next, ...type(-2)), { pack: 'combineit', level: 3, problem: '−5 + 3' });
      expect(loadSkills().sign).toBe(left);
    }
    expect(newLightSession(P, loadSkills()).on.sign).toBe(false);
    const log = loadLog();
    expect(log).toHaveLength(4);
    expect(log[0]).toMatchObject({ pack: 'combineit', level: 3, answers: [{ typed: '2', tag: 'sign-dropped' }], supports: ['cloze'], clean: false });
    expect(log[1]).toMatchObject({ answers: [], supports: [], clean: true, on: { sign: true } });
  });

  it('keeps its keys, and the pack hands out problems that carry their level', () => {
    expect([SKILLS_KEY, LOG_KEY]).toEqual(['mat.skills.v1', 'mat.events.v1']);
    expect(combineit.generate(3, 5).every((p) => p.level === 3)).toBe(true);
    expect(combineit.generate(1, 5).every((p) => p.level === 1)).toBe(true);
    expect(combineit.generate(5, 5).every((p) => p.level === undefined)).toBe(true);
  });
});
