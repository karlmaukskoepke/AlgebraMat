// Build Z (Karl, 2026-11-01): test out of a locked level. The logic (engine/testOut.js), the no-help switch, the records, the credit.
import { describe, it, expect, afterEach } from 'vitest';
import { newProgress, completeLevel, placeLevels, levelState, isLevelUnlocked, mergeProgress, encodeProgress } from '../src/engine/progress.js';
import { PACKS, SECTIONS, packById } from '../src/packs/index.js';
import {
  canTestOut, testOutSeed, testOutProblems, checkResult, quiet, HELP_ACTIONS, passCredit, suggestedLevel, attemptRecords, ALL_TAUGHT,
  PASS_WORD, FAIL_WORD, TEST_OUT_PROBLEMS, TEST_OUT_SECTIONS,
} from '../src/engine/testOut.js';
import { noHelp, setNoHelp } from '../src/engine/noHelp.js';
import { spotOf } from '../src/engine/spotlight.js';
import { divideMovesPlay, twoStepPlay, fractionsPlay, addBothPlay } from '../src/play/solveCards.js';
import { DIVIDE_SPOT } from '../src/engine/divideMoves.js';

const fresh = () => newProgress(PACKS);
const states = (p, id) => p.packs[id].levels.map((_, i) => levelState(p, id, i + 1));
const run = (adapter, s, ...actions) => actions.flat().reduce((st, a) => quiet(adapter.reduce(st, a)), s);
const keys = (n) => [...String(Math.abs(n))].map((d) => ({ type: 'digit', digit: Number(d) })).concat(n < 0 ? [{ type: 'toggleSign' }] : []);
const checkThrough = (n) => [{ type: 'focus', target: 'answer' }, ...keys(n), { type: 'check' }, { type: 'placeValue' }, ...Array(6).fill({ type: 'nextLine' })];

afterEach(() => setNoHelp(false));

describe('Part 1: which levels can be tried', () => {
  it('any locked, displayed level of a Solve it or Solve it Plus card, and nothing else', () => {
    const p = fresh();
    expect(TEST_OUT_SECTIONS).toEqual(['solve', 'solve-plus']);
    for (const sec of SECTIONS) {
      for (const id of sec.packs) {
        const pack = packById(id);
        const first = pack.firstLevel ?? 1;
        const last = pack.lastLevel ?? pack.levels;
        for (let l = 1; l <= pack.levels; l++) {
          const want = TEST_OUT_SECTIONS.includes(sec.id) && l > first && l <= last;
          expect(canTestOut(p, pack, l, SECTIONS), `${id} ${l}`).toBe(want);
        }
      }
    }
  });
  it('never the open first level, "See why it works", Strange solutions 4-5, an open, placed or earned level, or a retired card', () => {
    let p = fresh();
    expect(canTestOut(p, packById('add-both'), 1, SECTIONS)).toBe(false);          // See why it works
    expect(canTestOut(p, packById('add-both'), 2, SECTIONS)).toBe(false);          // shown as Level 1: open
    expect(canTestOut(p, packById('add-both'), 3, SECTIONS)).toBe(true);
    expect(canTestOut(p, packById('strange-solutions'), 3, SECTIONS)).toBe(true);
    expect(canTestOut(p, packById('strange-solutions'), 4, SECTIONS)).toBe(false); // hidden
    expect(canTestOut(p, packById('strange-solutions'), 5, SECTIONS)).toBe(false);
    expect(canTestOut(p, packById('one-step'), 4, SECTIONS)).toBe(false);          // retired
    expect(canTestOut(p, packById('combineit'), 3, SECTIONS)).toBe(false);         // Count it
    expect(canTestOut(p, packById('boxes'), 3, SECTIONS)).toBe(false);             // Build it
    p = completeLevel(p, 'two-step-equations', 1);
    expect(canTestOut(p, packById('two-step-equations'), 2, SECTIONS)).toBe(false); // open now
    expect(canTestOut(p, packById('two-step-equations'), 3, SECTIONS)).toBe(true);
  });
});

describe('Part 1: the attempt', () => {
  it('two problems from the level, fresh each attempt (a fixed seed: the same first attempt, a new set for each retry)', () => {
    const pack = packById('two-step-equations');
    expect(TEST_OUT_PROBLEMS).toBe(2);
    const a0 = testOutProblems(pack, 3, testOutSeed(7, 0));
    const a0again = testOutProblems(pack, 3, testOutSeed(7, 0));
    const a1 = testOutProblems(pack, 3, testOutSeed(7, 1));
    expect(a0).toHaveLength(2);
    expect(a0).toEqual(a0again);
    expect(a0).toEqual(pack.generate(3, 7).slice(0, 2));                          // (the level's own first two problems for that seed)
    expect(JSON.stringify(a1)).not.toBe(JSON.stringify(a0));
    let n = 0;
    expect(testOutSeed(null, 3, () => { n += 1; return 42; })).toBe(42);           // no fixed seed: a fresh one
    expect(n).toBe(1);
  });

  const divide = () => {
    const [p] = testOutProblems(packById('divide-it'), 4, 7);
    return { p, s: quiet(divideMovesPlay.newSession({ ...p, logLevel: 4 }, { flags: ALL_TAUGHT() })) };
  };
  it('a pass: the value right on the first check', () => {
    const { p, s } = divide();
    const solved = run(divideMovesPlay, s, [{ type: 'divPick' }, ...keys(p.a), { type: 'go' }, { type: 'foldNext' }], checkThrough(p.x));
    expect(solved.stage).toBe('done');
    expect(checkResult(solved)).toBe('right');
  });
  it('a correct guess before x is alone is right on the first check too', () => {
    const { p, s } = divide();
    const solved = run(divideMovesPlay, s, checkThrough(p.x));
    expect(checkResult(solved)).toBe('right');
  });
  it('each kind of fail: a wrong value, a wrong guess (once its check reaches "Not balanced")', () => {
    const { p, s } = divide();
    const typed = run(divideMovesPlay, s, { type: 'divPick' }, ...keys(p.a), { type: 'go' }, { type: 'foldNext' }, { type: 'focus', target: 'answer' }, ...keys(p.x + 1), { type: 'check' });
    expect(checkResult(typed)).toBe(null);                                         // the student is still checking
    const wrong = run(divideMovesPlay, typed, { type: 'placeValue' }, ...Array(6).fill({ type: 'nextLine' }));
    expect(wrong.sub.ok).toBe(false);
    expect(checkResult(wrong)).toBe('wrong');
    const guess = run(divideMovesPlay, s, checkThrough(p.x + 2));
    expect(checkResult(guess)).toBe('wrong');
    // a right value after a wrong one is still not independent
    expect(checkResult({ ...wrong, stage: 'done', step: 'done' })).toBe('wrong');
  });
  it('the help actions are never passed on', () => {
    expect([...HELP_ACTIONS].sort()).toEqual(['stuck', 'teach']);
  });
  it('the no-help mode: no spotlight of any kind, no hint, no outlined move, only the check’s own words', () => {
    const { s } = divide();
    const raw = [{ type: 'divPick' }, { type: 'digit', digit: 2 }, { type: 'go' }].reduce((st, a) => divideMovesPlay.reduce(st, a), s);   // 3x = 6 ÷ 2 does not split
    expect(spotOf(raw, DIVIDE_SPOT)?.kind).toBe('error');                          // (as a student sees it on the card)
    setNoHelp(true);
    expect(noHelp()).toBe(true);
    expect(spotOf(raw, DIVIDE_SPOT)).toBe(null);
    const red = quiet(raw);
    expect(red.fail).toBeTruthy();
    expect(red.feedback).toEqual({ key: 'aFindX', params: {}, bad: false });
    const undone = run(divideMovesPlay, red, { type: 'undo' });
    expect(undone.spot).toBe(null);
    expect(undone.hint).toBe(null);
    expect(undone.feedback.key).toBe('aFindX');
    const over = run(divideMovesPlay, red, { type: 'startOver' });                // Start over stays, even while a move waits for Undo
    expect(over.rows).toHaveLength(1);
    expect(over.fail).toBeFalsy();
    for (const key of ['aPlace', 'aPlugIn', 'aPlugCurrent', 'aCorrect']) expect(quiet({ feedback: { key, params: { typed: 3 } } }).feedback.key).toBe(key);
    expect(quiet({ feedback: { key: 'sSimplify', params: { second: true } } }).feedback.params.second).toBe(false);
    for (const key of ['aRed', 'dFail', 'aUndoFirst', 'wOneTerm', 'aTradeIntro', 'mCutAsk', 'aMustMove', 'dReminder']) expect(quiet({ feedback: { key, params: {}, bad: true } }).feedback).toEqual({ key: 'aFindX', params: {}, bad: false });
  });
  it('nothing is pointed out once a level, and no model draws itself (Fractions of x Levels 1 and 3)', () => {
    for (const level of [1, 3]) {
      const [p] = testOutProblems(packById('fractions-of-x'), level, 7);
      const s = fractionsPlay.newSession({ ...p, logLevel: level }, { flags: ALL_TAUGHT(), forceMove: false });
      expect(s.model).toBe(null);
      expect(s.rewriteIntro).toBe(false);
    }
    const [m] = testOutProblems(packById('two-step-equations'), 3, 7);
    const t = twoStepPlay.newSession({ ...m, logLevel: 3 }, { flags: ALL_TAUGHT(), forceMove: false });
    expect(t.tradeIntro).toBeFalsy();
    expect(t.flipIntro).toBeFalsy();
    const [a] = testOutProblems(packById('add-both'), 5, 7);
    expect(addBothPlay.newSession({ ...a, logLevel: 5 }, { flags: ALL_TAUGHT() }).feedback.key).not.toBe('aTradeIntro');
  });
});

describe('Part 1: the credit', () => {
  it('a pass places the level and every displayed level below it, and opens the next', () => {
    const p = passCredit(fresh(), 'two-step-equations', 3);
    expect(states(p, 'two-step-equations')).toEqual(['placed', 'placed', 'placed', 'none', 'none', 'none', 'none']);
    expect(isLevelUnlocked(p, 'two-step-equations', 4)).toBe(true);
    expect(isLevelUnlocked(p, 'two-step-equations', 5)).toBe(false);
    expect(canTestOut(p, packById('two-step-equations'), 3, SECTIONS)).toBe(false);   // the same level twice: it is open now, no test-out
    expect(canTestOut(p, packById('two-step-equations'), 5, SECTIONS)).toBe(true);
  });
  it('the credit below the level skips "See why it works" and starts at the card’s first displayed level', () => {
    const p = passCredit(fresh(), 'add-both', 4);
    expect(states(p, 'add-both')).toEqual(['none', 'placed', 'placed', 'placed', 'none', 'none']);
  });
  it('nothing is lowered: an earned level stays earned, other cards are untouched', () => {
    let p = completeLevel(fresh(), 'two-step-equations', 1);
    p = completeLevel(p, 'divide-it', 2);
    const before = structuredClone(p);
    p = passCredit(p, 'two-step-equations', 4);
    expect(states(p, 'two-step-equations')).toEqual(['earned', 'placed', 'placed', 'placed', 'none', 'none', 'none']);
    expect(p.packs['divide-it']).toEqual(before.packs['divide-it']);
    expect(mergeProgress(p, before).packs['two-step-equations']).toEqual(p.packs['two-step-equations']);
    expect(mergeProgress(before, p).packs['two-step-equations']).toEqual(p.packs['two-step-equations']);
  });
  it('a placed level is earned (gold) by one more problem: Build X’s rule, no new hook', () => {
    const p = completeLevel(passCredit(fresh(), 'two-step-equations', 3), 'two-step-equations', 3);
    expect(states(p, 'two-step-equations').slice(0, 3)).toEqual(['placed', 'placed', 'earned']);
  });
  it('the save code is unchanged (it carries earned levels only)', () => {
    const p = fresh();
    expect(encodeProgress(passCredit(p, 'two-step-equations', 3))).toBe(encodeProgress(p));
    expect(placeLevels(p, 'two-step-equations', 4)).toEqual(passCredit(p, 'two-step-equations', 3));
  });
  it('a fail: "Try Level N first", the highest level the student has open', () => {
    const pack = packById('two-step-equations');
    expect(suggestedLevel(fresh(), pack, 5)).toBe(1);
    let p = completeLevel(fresh(), 'two-step-equations', 1);
    expect(suggestedLevel(p, pack, 5)).toBe(2);
    p = passCredit(fresh(), 'two-step-equations', 3);
    expect(suggestedLevel(p, pack, 5)).toBe(4);
    expect(suggestedLevel(fresh(), packById('add-both'), 4)).toBe(2);            // shown as Level 1
  });
});

describe('Part 2: the class sheet', () => {
  const session = { answers: [{ typed: '4', tag: 'gave-opposite' }], supportsShown: [], stuck: 0, taught: 0, clean: false, on: {} };
  it('each problem of an attempt is its usual row, with the attempt’s word in its supports', () => {
    const rows = attemptRecords([
      { session: { ...session, answers: [], clean: true }, meta: { t: 1, pack: 'two-step-equations', level: 3, problem: '24 = 9 + 5x' } },
      { session, meta: { t: 2, pack: 'two-step-equations', level: 3, problem: '12 = 2 + 5x' } },
    ], FAIL_WORD);
    expect(rows).toEqual([
      { t: 1, pack: 'two-step-equations', level: 3, problem: '24 = 9 + 5x', answers: [], supports: ['test-out-fail'], stuck: 0, taught: 0, clean: true, on: {} },
      { t: 2, pack: 'two-step-equations', level: 3, problem: '12 = 2 + 5x', answers: [{ typed: '4', tag: 'gave-opposite' }], supports: ['test-out-fail'], stuck: 0, taught: 0, clean: false, on: {} },
    ]);
    expect(attemptRecords([{ session, meta: { t: 3 } }], PASS_WORD)[0].supports).toEqual(['test-out-pass']);
    expect([PASS_WORD, FAIL_WORD]).toEqual(['test-out-pass', 'test-out-fail']);
  });
});
