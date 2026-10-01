import { describe, it, expect } from 'vitest';
import { newCombineSession, combinePlay } from '../src/play/combinePlay.js';
import { reduce } from '../src/engine/session.js';
import { generateCombineLevel } from '../src/engine/generateCombine.js';
import { combineit } from '../src/packs/combineit.js';
import { makeProblem, evaluate, partyOrBattle } from '../src/engine/expr.js';
import { feedbackText } from '../src/view/feedback.js';

const run = (s, ...actions) => actions.reduce(reduce, s);
const sign = (v) => ({ type: 'pickSign', sign: v });
const zone = (z) => ({ type: 'tapZone', zone: z });
const check = { type: 'check' };

// Play one problem the way a student would, from the engine's point of view.
function play(problem) {
  let s = newCombineSession(problem);
  const [a, b] = [problem.left.value, problem.right.value];
  for (const [z, n] of [[0, a], [1, b]]) {
    s = run(s, sign(n > 0 ? '+' : '-'), ...Array(Math.abs(n)).fill(zone(z)));
  }
  s = run(s, check, { type: 'choose', choice: partyOrBattle(problem) });
  if (s.step === 'cancel') {
    for (;;) {
      const plus = s.zones.flatMap((zn, z) => zn.map((c, i) => ({ z, i, c }))).find((x) => x.c.sign === '+' && !x.c.canceled);
      const minus = s.zones.flatMap((zn, z) => zn.map((c, i) => ({ z, i, c }))).find((x) => x.c.sign === '-' && !x.c.canceled);
      if (!plus || !minus) break;
      s = run(s, { type: 'tapCounter', zone: plus.z, index: plus.i }, { type: 'tapCounter', zone: minus.z, index: minus.i });
    }
  }
  const answer = evaluate(problem);
  if (answer < 0) s = run(s, { type: 'toggleSign' });
  for (const d of String(Math.abs(answer))) s = run(s, { type: 'digit', digit: Number(d) });
  return run(s, check);
}

describe('Combine it (Levels 1 and 2 on Flip It\'s engine)', () => {
  it('starts at Draw with no Rewrite, and the step bar leaves it out', () => {
    const s = newCombineSession(makeProblem(5, '+', -8));
    expect(s).toMatchObject({ step: 'draw', combine: true, feedback: { key: 'drawIntro' } });
    expect(combinePlay.steps().map((t) => t.id)).toEqual(['draw', 'partyBattle', 'cancel', 'answer']);
    expect(feedbackText(s.feedback)).toMatch(/Tap above a number/);
  });

  it('plays every generated problem on both levels through to done', () => {
    for (let level = 1; level <= 2; level++) {
      for (const seed of [1, 7, 99, 20260930]) {
        for (const p of generateCombineLevel(level, seed)) {
          const s = play(p);
          expect(s.step, `${level}: ${JSON.stringify(p)}`).toBe('done');
        }
      }
    }
  });

  it('a Battle needs Cancel and a Party skips it', () => {
    const battle = newCombineSession(makeProblem(5, '+', -8));
    let s = run(battle, sign('+'), ...Array(5).fill(zone(0)), sign('-'), ...Array(8).fill(zone(1)), check, { type: 'choose', choice: 'battle' });
    expect(s.step).toBe('cancel');
    const party = newCombineSession(makeProblem(-4, '+', -6));
    s = run(party, sign('-'), ...Array(4).fill(zone(0)), ...Array(6).fill(zone(1)), check, { type: 'choose', choice: 'party' });
    expect(s).toMatchObject({ step: 'answer', skipped: ['cancel'] });
  });

  it('nothing to rewrite can\'t be done: the step is gone', () => {
    const s = newCombineSession(makeProblem(5, '+', -8));
    expect(reduce(s, { type: 'nothingToRewrite' })).toBe(s);
    expect(reduce(s, { type: 'flip', part: 'op' })).toBe(s);
  });

  it('the pack lists two levels with names and a generator for each', () => {
    expect(combineit.levels).toBe(2);
    expect(combineit.levelNames).toHaveLength(2);
    for (let l = 1; l <= 2; l++) expect(combineit.generate(l, 7)).toHaveLength(5);
  });
});
