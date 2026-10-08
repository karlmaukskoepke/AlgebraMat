import { describe, it, expect } from 'vitest';
import { makeSolve } from '../src/engine/solve.js';
import { makeSolve2 } from '../src/engine/solve2.js';
import { generateSwitchLevel } from '../src/engine/generateSwitch.js';
import { moveInfo, newSwitch, reduceSwitch } from '../src/engine/switchSides.js';
import { switchRows, pairsThatCancel } from '../src/view/switchMat.js';
import { crossedBorder } from '../src/view/switchPointer.js';
import { switchFeedbackText } from '../src/view/switchFeedback.js';
import { PACKS, packById, SECTIONS } from '../src/packs/index.js';
import { newProgress, encodeProgress, decodeProgress } from '../src/engine/progress.js';
import { formatEquation } from '../src/engine/equation.js';

const typed = (text) => [...text.replace(/−/g, '-')].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'toggleSign' }));
const answer = (text) => [...typed(text), { type: 'check' }];
const run = (s, ...actions) => actions.reduce(reduceSwitch, s);

const PLUS = makeSolve('x+a', 4, -6);                  // x + 4 = −2
const MINUS = makeSolve('x-a', 5, 12);                 // x − 5 = 7
const MIRROR = makeSolve('x+a', 5, 7, true);           // 12 = x + 5
const TWO = makeSolve2('ax+b', 2, 6, 4);               // 2x + 6 = 14
const TWO_NEG = makeSolve2('ax-b', 3, 4, -2);          // 3x − 4 = −10

describe('the move', () => {
  it('says what crosses, what it becomes, and how the work is written', () => {
    expect(moveInfo(PLUS)).toMatchObject({ con: '+4', flipped: '−4', rec: 'x = −2 + −4', two: false, left: '−6' });
    expect(moveInfo(MINUS)).toMatchObject({ con: '−5', flipped: '+5', rec: 'x = 7 + 5' });
    expect(moveInfo(MIRROR)).toMatchObject({ rec: '12 + −5 = x' });
    expect(moveInfo(TWO)).toMatchObject({ con: '+6', flipped: '−6', rec: '2x = 14 + −6', two: true });
    expect(moveInfo(TWO_NEG)).toMatchObject({ con: '−4', flipped: '+4', rec: '3x = −10 + 4' });
    expect(formatEquation(MIRROR)).toBe('12 = x + 5');
  });

  it('counts a drop as a crossing only past the border, from either side', () => {
    expect(crossedBorder(100, 400, 300)).toBe(true);
    expect(crossedBorder(100, 310, 300)).toBe(false);      // not far enough yet
    expect(crossedBorder(100, 250, 300)).toBe(false);
    expect(crossedBorder(500, 200, 300)).toBe(true);       // x on the right: the number goes left
    expect(crossedBorder(500, 290, 300)).toBe(false);
  });
});

describe('playing it', () => {
  it('waits for the move before it takes an answer, then finishes cleanly', () => {
    let s = newSwitch(PLUS);
    expect(s).toMatchObject({ step: 'move', moved: false });
    expect(switchFeedbackText(s.feedback)).toMatch(/drag the \+4 across the border/);
    s = run(s, ...answer('−6'));
    expect(s).toMatchObject({ moved: false, stage: 'light', wrongs: 0 });
    expect(switchFeedbackText(s.feedback)).toMatch(/Switch sides first/);
    s = run(s, { type: 'move' });
    expect(s).toMatchObject({ moved: true, step: 'answer' });
    expect(switchFeedbackText(s.feedback)).toMatch(/\+4 crossed the border and switched teams: it is −4 now/);
    expect(run(s, { type: 'move' })).toBe(s);
    s = run(s, { type: 'check' });                       // the −6 they had already typed
    expect(s).toMatchObject({ stage: 'done', clean: true, finalText: '−6' });
  });

  it('names the slip of a number that crossed but did not switch teams', () => {
    let s = run(newSwitch(PLUS), { type: 'move' }, ...answer('2'));                 // −2 + 4
    expect(s).toMatchObject({ rung: 1, tag: 'wrong-op' });
    expect(switchFeedbackText(s.feedback)).toMatch(/crossed the border, but it didn’t switch teams: it should be −4\. x = −2 \+ −4\./);
    s = run(s, ...answer('−2'));                                                   // what was already there
    expect(s).toMatchObject({ rung: 2, tag: 'untouched' });
    expect(switchFeedbackText(s.feedback)).toMatch(/meets its opposite/);
    expect(switchFeedbackText(run(newSwitch(PLUS), { type: 'move' }, ...answer('−2')).feedback)).toMatch(/already on the other side/);
    s = run(s, ...answer('−6'));
    expect(s).toMatchObject({ stage: 'done', clean: false });
    const two = run(newSwitch(TWO), { type: 'move' }, ...answer('10'));            // 14 + 6 − ... stopped: 14 − 6 = 8? (8 would be stopped-early)
    expect(two.wrongs).toBe(1);
    expect(switchFeedbackText(run(newSwitch(TWO), { type: 'move' }, ...answer('8')).feedback)).toMatch(/still multiplied by 2/);
  });

  it('makes the move for a student who is stuck or asks to be taught', () => {
    const stuck = run(newSwitch(MINUS), { type: 'stuck' });
    expect(stuck).toMatchObject({ moved: true, step: 'answer', stuck: 1, helped: true, rung: 0 });
    expect(switchFeedbackText(stuck.feedback)).toMatch(/I moved it for you/);
    const taught = run(newSwitch(TWO), { type: 'teach' });
    expect(taught).toMatchObject({ moved: true, taught: 1, rung: 3 });
    expect(switchFeedbackText(taught.feedback)).toMatch(/Step by step: the \+6 crosses the border and switches teams, −6: 2x = 14 \+ −6/);
    expect(run(run(newSwitch(PLUS), { type: 'move' }), { type: 'stuck' }).rung).toBe(2);
  });

  it('has a message for every key it can say, for both kinds of equation', () => {
    for (const p of [PLUS, MINUS, MIRROR, TWO, TWO_NEG]) {
      let s = run(newSwitch(p), { type: 'move' });
      const seen = [switchFeedbackText(s.feedback)];
      for (const guess of ['1', '3', '5']) { s = run(s, ...answer(guess)); seen.push(switchFeedbackText(s.feedback)); }
      s = run(s, { type: 'stuck' }, { type: 'teach' });
      seen.push(switchFeedbackText(s.feedback));
      for (const text of seen) expect(text).toMatch(/\S/);
    }
  });
});

describe('the pictures', () => {
  it('start with the number on the x side, ready to move, and a border', () => {
    const [row] = switchRows(PLUS);
    expect(row.border).toBe(true);
    expect(row.left.map((i) => [i.type, i.n ?? i.count, i.sign, Boolean(i.movable)])).toEqual([['box', 1, undefined, false], ['counters', 4, '+', true]]);
    expect(row.right).toEqual([expect.objectContaining({ n: 2, sign: '-' })]);
    const first = switchRows(makeSolve2('b+ax', 3, 5, 2))[0];
    expect(first.left[0]).toMatchObject({ movable: true });                 // 5 + 3x: the number comes first
    expect(switchRows(MIRROR)[0].right.map((i) => i.type)).toEqual(['box', 'counters']);
    expect(switchRows(MIRROR)[0].right[1].movable).toBe(true);
  });

  it('after the move, the counters switched teams and sit with the other side', () => {
    const [row] = switchRows(PLUS, { moved: true });
    expect(row.left.map((i) => i.type)).toEqual(['box']);
    expect(row.right.map((i) => [i.sign, i.n, i.moved, i.struck])).toEqual([['-', 2, undefined, 0], ['-', 4, true, 0]]);   // −2 and −4: same team, no pairs
    const [m] = switchRows(MINUS, { moved: true, rung: 2 });
    expect(m.right.map((i) => [i.sign, i.n, i.struck])).toEqual([['+', 7, 0], ['+', 5, 0]]);
    // opposites cancel in pairs: 12 − 5... in 2x + 6 = 14 the −6 meets 6 of the 14
    const rows = switchRows(TWO, { moved: true, rung: 3 });
    expect(rows[0].right.map((i) => [i.sign, i.n, i.struck])).toEqual([['+', 14, 6], ['-', 6, 6]]);
    expect(pairsThatCancel(moveInfo(TWO))).toBe(6);
    expect(rows.map((r) => r.label)).toEqual(['The pairs cancel', 'Share the counters equally: 2 boxes, 2 groups', 'What’s left']);
    expect(rows.at(-1)).toMatchObject({ solved: true });
    expect(rows.at(-1).right[0]).toMatchObject({ n: 4, sign: '+' });
  });
});

describe('the problems and the card', () => {
  it('are five a level, whole answers, no repeats, each level its kind', () => {
    for (let seed = 1; seed <= 100; seed++) {
      for (let level = 1; level <= 6; level++) {
        const set = generateSwitchLevel(level, seed);
        expect(set).toHaveLength(5);
        expect(new Set(set.map((p) => p.x)).size).toBe(5);
        for (const p of set) {
          expect(p.x !== 0 && Number.isInteger(p.x)).toBe(true);
          expect(level <= 4 ? p.kind === 'solve' : p.kind === 'solve2').toBe(true);
          if (level === 4) expect(p.mirror).toBe(true);
          if (level === 3) expect(p.x < 0).toBe(true);
          if (level === 5) expect(p.x > 0 && !p.mirror).toBe(true);
          if (level === 6) expect(p.x < 0).toBe(true);
        }
        if (level === 3) expect(set.filter((p) => p.b < 0).length).toBeGreaterThanOrEqual(2);
      }
    }
    expect(generateSwitchLevel(4, 9)).toEqual(generateSwitchLevel(4, 9));
  });

  it('is a card of six levels in Solve it, between One-step and Two-step, with room in the save code', () => {
    const pack = packById('switch');
    expect(pack).toMatchObject({ levels: 6, title: 'Switch sides' });
    expect(pack.levelNames).toHaveLength(6);
    expect(SECTIONS.find((s) => s.id === 'solve').packs).toEqual(['one-step', 'switch', 'two-step', 'multi-step']);
    const progress = newProgress(PACKS);
    progress.packs.switch.levels = [true, true, false, true, false, true];
    expect(decodeProgress(encodeProgress(progress), PACKS).packs.switch.levels).toEqual([true, true, false, true, false, true]);
    expect(decodeProgress(encodeProgress(newProgress(PACKS), 11), PACKS).packs.switch.levels).toEqual(Array(6).fill(false));
  });
});
