import { describe, it, expect } from 'vitest';
import { makeFlip } from '../src/engine/flip.js';
import { newFlip, reduceFlip, FLIP_MENU, FLIP_SPOT, flipOption } from '../src/engine/cards/flip.js';
import { makeTwoStep } from '../src/engine/twoStep.js';
import { newTwoStep, TWO_STEP_SPOT, TWO_STEP_LAYER, optionOf } from '../src/engine/cards/twoStep.js';
import { startLights } from '../src/engine/addBothLights.js';
import { makeMultiplyMenu, MULT_KINDS, goReady } from '../src/engine/multiplyMenu.js';
import { withSpotlight } from '../src/engine/spotlight.js';
import { boardText } from '../src/engine/solveTerms.js';
import { makeRecord } from '../src/engine/eventlog.js';
import { flipFeedbackText } from '../src/view/flipFeedback.js';
import { twoStepFeedbackText } from '../src/view/twoStepFeedback.js';
import { coefOn } from '../src/engine/fractionMove.js';

// Build L: the Multiply menu is Multiply / Divide / Fraction; Flip everything left it (its own button); −1 typed is Flip everything.
const digit = (d) => ({ type: 'digit', digit: d });
const divide = (n) => [{ type: 'divPick' }, ...(n < 0 ? [{ type: 'toggleSign' }] : []), digit(Math.abs(n)), { type: 'go' }];
const flipButton = [{ type: 'flipPick' }, { type: 'go' }];
// what a student sees and what the class sheet gets: the rows, the board, the lights, the words (ids aside)
// (a row's `shown: 'div'` is the drawing only: dividing by −1 is drawn in division form since Build P, Part 9; the move is the same)
const view = (s) => JSON.stringify({ rows: s.rows, board: s.board, lights: s.lights, feedback: s.feedback, history: s.history.length, moves: s.moves, label: s.lastMove }).replace(/"id":"[^"]*"/g, '').replace(/,"shown":"div"/g, '');

describe('the menu', () => {
  it('has two options again (Build O: Divide is its own button), and no −1 option', () => {
    expect(MULT_KINDS).toEqual(['whole', 'frac']);
    expect(goReady({ kind: 'div', entry: '-3' })).toBe(true);
    expect([goReady({ kind: 'div', entry: '-' }), goReady({ kind: 'div', entry: '' }), goReady({ kind: 'div', entry: '12' })]).toEqual([false, false, false]);
  });
});

describe('Flip everything: Divide from saved Level 4, a negative divisor, and dividing by −1', () => {
  const r = withSpotlight(FLIP_MENU.withMenu(reduceFlip), FLIP_SPOT);
  const go = (s, ...a) => a.reduce(r, s);
  it('which options are live: Divide from Level 4; Multiply and Fraction greyed; Flip is the button', () => {
    expect(['whole', 'div', 'frac'].map((k) => flipOption(k, { level: 3 }))).toEqual(['grey', 'grey', 'grey']);
    expect(['whole', 'div', 'frac'].map((k) => flipOption(k, { level: 4 }))).toEqual(['grey', 'live', 'live']);   // (Build O: Fraction live with Divide)
    expect(go(newFlip(makeFlip(3, -4), { level: 4 }), { type: 'multOpen' }, { type: 'multPick', kind: 'whole' }).feedback.key).toBe('aLater');
  });
  it('−3x = 12: dividing by −3 is −⅓ of both sides in one move; by 3 then the flip, or the flip then by 3, also finish', () => {
    const p = makeFlip(3, -4);
    const one = go(newFlip(p, { level: 4 }), ...divide(-3));
    expect(boardText(one.board)).toBe('x = −⅓(12)');
    expect(one.rows.at(-2).board.left[0]).toMatchObject({ kind: 'frac', n: 3, sign: -1 });
    expect(boardText(go(newFlip(p, { level: 4 }), ...divide(3), { type: 'foldNext' }, ...flipButton).board)).toBe('x = −(4)');
    expect(boardText(go(newFlip(p, { level: 4 }), ...flipButton, { type: 'foldNext' }, ...divide(3)).board)).toBe('x = ⅓(−12)');
  });
  it('dividing by −1 is Flip everything: the same row, lights, words and class-sheet record as the Flip button', () => {
    const p = makeFlip(3, -4);
    const byDivide = go(newFlip(p, { level: 4 }), ...divide(-1));
    const byButton = go(newFlip(p, { level: 4 }), ...flipButton);
    expect(boardText(byDivide.board)).toBe('3x = −12');
    expect(view(byDivide)).toBe(view(byButton));
    const finish = (s) => go(s, { type: 'foldNext' }, ...divide(3), { type: 'digit', digit: 4 }, { type: 'toggleSign' }, { type: 'check' }, { type: 'placeValue' }, { type: 'nextLine' }, { type: 'nextLine' });
    const rec = (s) => makeRecord(finish(s), { t: 0, pack: 'flip-everything', level: 4, problem: '−3x = 12' });
    expect(rec(byDivide)).toEqual(rec(byButton));
  });
  it('the Divide row is written in multiplication form (its label is the screen’s); a second digit gets the pop-up', () => {
    const s = go(newFlip(makeFlip(3, -4), { level: 4 }), { type: 'divPick' }, { type: 'toggleSign' }, digit(3), digit(3));
    expect([s.mopts, s.feedback.key, flipFeedbackText(s.feedback)]).toEqual([{ kind: 'div', entry: '-3' }, 'dDivOneDigit', 'Enter a one-digit number to divide by.']);
  });
});

describe('Two-step: Divide once each side is one term; a negative and −1 only from Level 5', () => {
  const layer = withSpotlight(TWO_STEP_LAYER, TWO_STEP_SPOT);
  const run = (s, ...a) => a.reduce(layer, s);
  const start = (p, level) => startLights(newTwoStep({ ...p, logLevel: level }, { level }));
  const toSingle = (s) => {
    s = run(s, { type: 'choose', move: 'add' }, ...String(Math.abs(s.problem.b)).split('').map(Number).map(digit), ...(s.problem.b > 0 ? [{ type: 'toggleSign' }] : []), { type: 'go' });
    const side = s.board.left.some((t) => t.kind === 'x') ? 'right' : 'left';
    const [a, b] = s.board[side];
    const sum = a.v + b.v;
    return run(s, { type: 'lxDrop', id: a.id, slot: { side, onto: b.id } }, ...String(Math.abs(sum)).split('').map(Number).map(digit), ...(sum < 0 ? [{ type: 'toggleSign' }] : []), { type: 'lxApply' });
  };
  it('the options before and after the Add: Divide greyed with Build K’s words, then live', () => {
    const p = makeTwoStep('ax+b', 3, 4, 5);
    const s = start(p, 1);
    expect(['whole', 'div', 'frac'].map((k) => optionOf(k, s))).toEqual(['grey', 'grey', 'grey']);
    expect(twoStepFeedbackText(run(s, { type: 'divPick' }).feedback)).toBe('That move works once each side is one term.');
    const one = toSingle(s);
    expect(boardText(one.board)).toBe('3x = 15');
    expect(['whole', 'div', 'frac'].map((k) => optionOf(k, one))).toEqual(['grey', 'live', 'live']);
    expect(boardText(run(one, ...divide(3)).board)).toBe('x = ⅓(15)');
  });
  it('below Level 5, dividing by −3 or by −1 says it unlocks on a later level, and the blank stays open', () => {
    const one = toSingle(start(makeTwoStep('ax+b', 3, 4, 5), 1));
    for (const n of [-3, -1]) {
      const s = run(one, ...divide(n));
      expect([s.feedback.key, boardText(s.board), s.mopts?.kind]).toEqual(['aLaterLevel', '3x = 15', 'div']);
    }
  });
  it('Level 5, 4 − 3x = −11: dividing by −3 finishes; dividing by −1 is the Flip button’s move', () => {
    const one = toSingle(start(makeTwoStep('b-ax', 3, 4, 5), 5));
    expect(coefOn(one.board)).toBe(-3);
    expect(boardText(run(one, ...divide(-3)).board)).toBe('x = −⅓(−15)');
    expect(view(run(one, ...divide(-1)))).toBe(view(run(one, ...flipButton)));
  });
  it('the three x boxes and the hint after Undo say "divide both sides by 3"', () => {
    const one = toSingle(start(makeTwoStep('ax+b', 3, 4, 5), 1));
    const boxes = run(one, { type: 'choose', move: 'add' }, digit(3), { type: 'toggleSign' }, { type: 'go' });
    expect(twoStepFeedbackText(boxes.feedback)).toBe('3x is three x boxes, not a 3 to cancel. Adding −3 does not take them away. To get one x, divide both sides by 3 (that is, multiply by ⅓): one of the three x boxes is ⅓.');
    const after = run(boxes, { type: 'undo' });
    expect([twoStepFeedbackText(after.feedback), after.ui.preview, after.spot.move]).toEqual(['To get one x, divide both sides by 3 (that is, multiply by ⅓): one of the 3 x boxes is ⅓.', 'div', 'divOption']);
  });
});

describe('typing −1 in Multiply is Flip everything (on a card where both are live)', () => {
  // no card has Multiply and Flip both live yet (the Multiply card will); this is the menu with both on, round Flip everything's engine
  const menu = makeMultiplyMenu({ xAlone: (b) => coefOn(b) === 1, coefOf: coefOn, option: (k) => (k === 'frac' ? 'grey' : 'live'), probe: 'flip', negTop: true });
  const r = menu.withMenu(reduceFlip);
  const go = (s, ...a) => a.reduce(r, s);
  it('the same row, words and record as the Flip button', () => {
    const p = makeFlip(1, -5);
    const typed = go(newFlip(p, { level: 2 }), { type: 'multOpen' }, { type: 'multPick', kind: 'whole' }, digit(1), { type: 'toggleSign' }, { type: 'go' });
    const button = go(newFlip(p, { level: 2 }), ...flipButton);
    expect(boardText(typed.board)).toBe('x = −(5)');
    expect(view(typed)).toBe(view(button));
  });
});
