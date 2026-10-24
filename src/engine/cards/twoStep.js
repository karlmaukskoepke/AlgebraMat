// Two-step equations (Build K, basic form) as a card of the shared Solve it loop (engine/solveLoop.js). The loop owns everything shared
// (x = [ ] at every state, guesses and the check, the forced move, folding, Undo, Start over, the help); this card is configuration of the
// shared moves, with nothing of its own but its board, its rules and its words:
//   - the board: x with a number in front (`3x + 4 = 19`, `4 − 3x = 19`, x on either side) and a number beside it;
//   - Add ___ to both sides, the shared move (engine/addMove.js): the number beside x cancels on its own, the other side is left as it is
//     (`3x = 19 + −4`) until the student combines it by dragging (Add's term layer, engine/addBothLights.js); the app never writes a value;
//   - Take a fraction (engine/fractionMove.js) and, from Level 5, Flip everything (engine/flipMove.js): live only once each side is one
//     term (Karl's rule "B": dividing or flipping a side of two terms needs the Distribute move, which comes with its own card);
//   - Trade places from Level 3 (x on the right): the same equation with the sides swapped; it counts as a helpful move;
//   - the lights (Fewer terms, Solved for x), the slips and the words. The help is the scaffold registry's, the reminder only
//     (solveit/rungs/twoStep.js, and Divide it's and Flip everything's entries for the shapes they share).
// No DOM here.

import { createSolveLoop } from '../solveLoop.js';
import { shapeOfBoard } from '../solveit/shape.js';
import { signed, fractionText } from '../solveTerms.js';
import { typeInto, isTyping } from '../entry.js';
import { xTerm } from '../divideBoard.js';
import { num, xSideOf } from '../addBothMoves.js';
import { coefOf, constOf, tagTwoStep } from '../twoStep.js';
import { addBare } from '../addMove.js';
import { chooseFraction, takeStep, coefOn } from '../fractionMove.js';
import { commitFlip, commitFraction } from '../flipMove.js';
import { makeMultiplyMenu } from '../multiplyMenu.js';
import { hintAfterUndo } from '../solveit/registry.js';
import { ADD_ERRORS, moveOwed, withLights } from '../addBothLights.js';

// The levels a move goes live at (displayed = saved on this card).
export const TRADE_LEVEL = 3;                 // x on the right
export const FLIP_LEVEL = 5;                  // b − ax = c

// ---------- the board ----------
export function startBoard(p) {
  const x = xTerm(coefOf(p));
  const n = num(constOf(p));
  const xs = p.form === 'b+ax' || p.form === 'b-ax' ? [n, x] : [x, n];
  const os = [num(p.c)];
  return p.mirror ? { left: os, right: xs } : { left: xs, right: os };
}
// x is alone: nothing beside it and a plain 1 in front
export const xAlone = (board) => board[xSideOf(board)].length === 1 && (board[xSideOf(board)][0].coef ?? 1) === 1;
// Karl's rule "B": a fraction or a flip of both sides needs each side to be one term
export const singleTerm = (board) => board.left.length === 1 && board.right.length === 1;
export const shape = (board) => shapeOfBoard(board, 'two');

const say = (s, key, params = {}, bad = false) => { s.feedback = { key, params: { a: s.problem.a, b: signed(s.problem.b), ...params }, bad }; return s; };
const MOVE = { shape, alone: xAlone, say, rebase: true };

export const tradeAvailable = (s) => s.level >= TRADE_LEVEL && s.stage === 'moves' && !s.sub && !s.needUndo && !s.fail && !s.lx?.combine && xSideOf(s.board) === 'right';
// The first equation with x on the right in a level is pointed out (the symmetric property); Add first is fine too, so it is not required.
export const tradePending = (s) => Boolean(s.tradeIntro) && s.tradeCount === 0 && tradeAvailable(s);
const amountKeys = (s) => s.menu === 'add' && s.typing !== 'answer';
const coefText = (c) => (c === 1 ? 'x' : c === -1 ? '−x' : `${signed(c)}x`);

// What Multiply's options are on this card (Build L): the whole number and the general fraction belong to later cards; Divide is live once
// each side is one term; Flip everything (its own button, or dividing by −1) too, from Level 5. A greyed option says why when tapped.
export function optionOf(kind, s) {
  if (kind === 'whole') return 'grey';                                    // (Build O: the Fraction option is live again, like Divide)
  if (kind === 'flip' && s.level < FLIP_LEVEL) return 'grey';
  return singleTerm(s.board) ? 'live' : 'grey';
}
export function greyKey(kind, s) {
  if (kind === 'whole') return 'aLater';
  if (kind === 'flip' && s.level < FLIP_LEVEL) return 'aLaterLevel';
  return 'wOneTerm';
}

// ---------- the card ----------

const loop = createSolveLoop({
  id: 'two-step-equations',
  startBoard,
  alone: xAlone,
  noLights: () => ({ fewer: 'off', solved: 'off' }),
  params: (s) => ({ a: s.problem.a, b: signed(s.problem.b) }),
  extra: (p, { level, introTrade = false, introFlip = false }) => ({
    fail: null, deal: null, diag: null, pic: null, tried: [], mopts: null,
    tradeIntro: introTrade && level >= TRADE_LEVEL && Boolean(p.mirror), tradeCount: 0, flipIntro: introFlip, flipCount: 0,
    amountEntry: '', pending: null, combining: null, resolving: false, alone: null, prevBoard: null, zeroOther: false, work: null,
    lastAmount: null, forcedAmount: null, teachFlow: false, startOver: false, lastFlip: false,
  }),
  snapshotExtra: (s) => ({ fail: null, deal: null, diag: null, pic: null, prevBoard: s.prevBoard, amountEntry: s.amountEntry, work: s.work, zeroOther: false, lastFlip: false, startOver: s.startOver }),
  resetState(s) {
    Object.assign(s, { fail: null, deal: null, diag: null, pic: null, mopts: null, amountEntry: '', zeroOther: false, work: null, alone: null, prevBoard: s.board, lastFlip: false, startOver: false });
  },
  mustMoveKey: () => 'lxMustMove',
  reminderOnly: true,                                                            // basic form: I'm stuck gives the reminder only
  touched: (s) => s.amountEntry !== '' || s.tradeCount > 0,
  // a fraction that did not split waits for Undo (or a new try), like an Add or a flip that did not help
  waitingForUndo: (s) => Boolean(s.fail),
  undoReason: (s) => (s.fail ? 'fail' : s.zeroOther ? 'zero' : s.lastFlip ? 'flip' : s.feedback?.key === 'wBoxes' ? 'boxes' : s.lights.fewer === 'red' ? 'red' : 'partial'),
  afterUndo(s) { Object.assign(s, { zeroOther: false, alone: null, lastFlip: false }); },
  tag: (p, typed) => tagTwoStep(p, typed),
  slip: (s, typed, tag) => ({ key: 'wWrong', params: { typed: signed(typed), tag } }),

  reduce(s, action, api) {
    // typing: the Add move's blank while it is open (the fraction's blank is the Multiply menu's); x = is the loop's
    if (isTyping(action)) {
      if (s.sub || !amountKeys(s)) return undefined;
      const entry = typeInto(s.amountEntry, action, 'integer');
      if (entry === s.amountEntry) return 'ignore';
      s.amountEntry = entry;
      s.hint = null;
      return s;
    }
    switch (action.type) {
      case 'greyMove':
        return say(s, action.move === 'flip' ? greyKey('flip', s) : 'aLater');
      // a number dragged up into the blank of "Add ___ to both sides" fills it (the student still decides its sign)
      case 'setAmount':
        if (s.stage !== 'moves' || s.sub || !Number.isInteger(action.value)) return 'ignore';
        s.menu = 'add';
        s.typing = null;
        s.amountEntry = String(action.value);
        return say(s, 'aAmountSet', { amount: signed(action.value) });
      case 'choose': {
        if (s.stage !== 'moves' || s.sub) return 'ignore';
        if (action.move === 'add') {
          const g = api.blockMove(s);
          if (g) return g;
          if (xAlone(s.board)) return say(s, 'aSolvedBoard');
          s.menu = 'add';
          s.typing = null;
          return say(s, 'aPickAmount');
        }
        if (action.move === 'trade') {
          if (!tradeAvailable(s)) return say(s, 'aTradeNot');
          const g = api.blockMove(s);
          if (g) return g;
          api.pushHistory(s);
          s.board = { left: s.board.right, right: s.board.left };                     // the same equation, the sides swapped (not judged)
          s.rows.push({ type: 'eq', board: s.board });
          s.prevBoard = s.board;
          s.tradeCount += 1;
          s.movedOnce = true;                                                         // a helpful move: it unlocks x = on a forced problem
          Object.assign(s, { menu: null, hint: null, amountEntry: '' });
          return say(s, 'aTraded');
        }
        // the Multiply button checks first that a move can be made now (its options say for themselves whether they are live)
        if (action.move === 'mult') {
          const g = api.blockMove(s);
          if (g) return g;
          if (xAlone(s.board)) return say(s, 'aSolvedBoard');
          s.menu = 'mult';
          return s;
        }
        if (action.move === 'fraction') {
          if (!singleTerm(s.board)) return say(s, 'wOneTerm');
          return chooseFraction(s, api, say, xAlone);
        }
        return undefined;
      }
      case 'take':
        if (!singleTerm(s.board)) return 'ignore';
        if (action.sign === -1 && s.level < FLIP_LEVEL) return say(s, 'aLaterLevel');     // (−⅓ in one move comes with Flip everything)
        return takeStep(s, action, api, say, (st, n, sign) => commitFraction(st, n, sign, api, MOVE));
      case 'flip': {
        const g = api.blockMove(s);
        if (g) return g;
        if (s.level < FLIP_LEVEL || !singleTerm(s.board)) return say(s, greyKey('flip', s));
        if (xAlone(s.board)) return say(s, 'aSolvedBoard');
        api.fold(s);                                       // the move before it (Add, and the combining) folds to its own row first
        const out = commitFlip(s, api, MOVE);
        s.lastFlip = out.needUndo;
        // the first flip of the level that helps: one sentence about what −1 does (once, like the first Trade places)
        if (!out.needUndo && s.flipIntro && s.flipCount === 0) say(s, 'fFlipIntro');
        if (!out.needUndo) s.flipCount += 1;
        return out;
      }
      // Go: the Add move in one action (the Multiply menu's Go is its own)
      case 'go': {
        if (s.stage !== 'moves' || s.menu !== 'add' || s.sub) return 'ignore';
        const before = shape(s.board);
        const made = s.history.length;
        const out = addBare(s, api, MOVE);
        if (s.history.length === made) return out;
        // nothing to cancel (`3x = 15`) and the number in front of x added as if it could be: the x boxes are not a number beside x
        const a = before.coef;
        if (s.needUndo && !s.zeroOther && before.xNums.length === 0 && a > 1 && Math.abs(s.lastAmount) === a) {
          return say(s, 'wBoxes', { ax: coefText(a), boxes: Math.abs(a), amount: signed(s.lastAmount), frac: fractionText(Math.abs(a)) }, true);
        }
        return out;
      }
      default:
        return undefined;
    }
  },
});

// ---------- the card's entry points ----------

export function newTwoStep(problem, { level = 1, forceMove = false, introTrade = false, introFlip = false } = {}) {
  const s = loop.newSession(problem, { level, forceMove, introTrade, introFlip });
  s.prevBoard = s.board;
  return tradePending(s) && !forceMove ? say(s, 'aTradeIntro') : s;
}
export const reduceTwoStep = loop.reduce;
export const solve = loop;
export { coefOn };

// Multiply on this card (the shared menu, engine/multiplyMenu.js): its options as `optionOf` says; Divide may take a negative from Level 5
// (−⅓ of both sides in one move), and dividing by −1 is Flip everything.
export const TWO_STEP_MENU = makeMultiplyMenu({
  xAlone,
  coefOf: coefOn,
  option: optionOf,
  greyKey,
  probe: 'mult',
  negTop: true,
});

// The spotlight on this card (engine/spotlight.js): Add to both sides' errors (the two numbers added and their sum, "still here", a wrong
// combine with its two numbers lit), the three x boxes, the shared fraction and flip errors; and the hint after Undo (the registry's, for
// the shape Undo returned to). The whole new equation stays readable: never grey out what the question is about.
const TWO_ERRORS = {
  ...ADD_ERRORS,
  wBoxes: { target: 'coef', label: 'x boxes', lit: ['workpair', 'newest'] },
  fWorse: { target: 'coef', label: 'x has a minus', lit: ['newest'] },
  dFail: { target: 'failSide', label: 'doesn’t split' },
  dFail3: { target: 'failSide', label: 'doesn’t split' },
  wWrong: { target: 'subst', clear: true, lit: ['substLast'] },
};
export const TWO_STEP_SPOT = {
  error: (s) => TWO_ERRORS[s.feedback?.key] ?? null,
  keepsReds: (s) => ['aRed', 'aRed3', 'aZeroOther', 'lxZero', 'aPartial', 'wBoxes', 'dFail', 'dFail3', 'fWorse'].includes(s.feedback?.key),
  startOverAt: 3,
  clear: (s) => { s.entry = ''; s.sub = null; },
  hint: (s, before = null) => hintAfterUndo(s, before),
  prompt: (s) => (moveOwed(s) ? 'lxMustMove' : 'aFindX'),
};

// The card's layers, as a student plays it: Add's term layer (dragging, combining, the Add blank) round the Multiply menu round the card.
// A term picked up closes Multiply's options (they would otherwise stay open under the drag).
const layered = withLights(TWO_STEP_MENU.withMenu(reduceTwoStep), { alone: xAlone, menuPreview: (s, kind) => optionOf(kind, s) === 'live' });
export const TWO_STEP_LAYER = (s, action) => layered(action.type === 'lxDrop' && s.mopts ? { ...s, mopts: null } : s, action);
