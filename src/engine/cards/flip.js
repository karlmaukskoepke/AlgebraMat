// Flip everything (SPEC-FLIP-IT.md rev 1.2) as a card of the shared Solve it loop (engine/solveLoop.js), in basic form (Build J). The loop
// owns everything shared (x = [ ] at every state, guesses and the check, the forced move, folding, Undo, Start over, the help ladder);
// this file only says what is this card's own:
//   - the board: x with a minus in front (`−x = 12`, `−3x = 12`, x on either side) and a number on the other side;
//   - Flip everything (both sides times −1, the −1 option of Multiply or the Flip button): helpful when x has a minus, unhelpful when it
//     has none (`3x = −12` → `−3x = 12` waits for Undo). The flip that finishes leaves the other side as `−(12)`, never evaluated;
//   - Take a fraction of both sides from saved Level 4, the move Divide it uses (engine/fractionMove.js), including −⅓ in one move;
//   - Trade places from saved Level 3 (x on the right): the same equation with the sides swapped, not judged; either order is fine;
//   - the lights (No opposite box, Solved for x), the slips, and the words. The help is the scaffold registry's (solveit/rungs/flip.js).
// No DOM here.

import { createSolveLoop } from '../solveLoop.js';
import { shapeOfBoard } from '../solveit/shape.js';
import { signed, boardText } from '../solveTerms.js';
import { xTerm, numTerm } from '../divideBoard.js';
import { chooseFraction, takeStep, xSideOf, coefOn } from '../fractionMove.js';
import { applyFlip, commitFlip as commitFlipMove, commitFraction as commitFractionMove } from '../flipMove.js';
import { makeMultiplyMenu } from '../multiplyMenu.js';
import { hintAfterUndo } from '../solveit/registry.js';
import { tagFlip, formatFlip } from '../flip.js';

export { boardText, signed, formatFlip };

// The saved levels a move goes live at (saved 2 is shown as Level 1).
export const TRADE_LEVEL = 3;                 // b = −x
export const FRACTION_LEVEL = 4;              // −ax = b

// ---------- the board ----------
export const startBoard = (p) => {
  const xs = [xTerm(-p.a)];
  const bs = [numTerm(p.b)];
  return p.mirror ? { left: bs, right: xs } : { left: xs, right: bs };
};
// x is alone with nothing in front of it (−x is not alone: it still has its minus)
export const xAlone = (board) => coefOn(board) === 1;
const shape = (board) => shapeOfBoard(board, 'flip');

// Flip everything and the fraction after it are the shared moves (engine/flipMove.js), read with this card's family.
const FLIP_MOVE = { shape, alone: xAlone, say: (...a) => say(...a) };
export { applyFlip };

export const tradeAvailable = (s) => s.level >= TRADE_LEVEL && s.stage === 'moves' && !s.sub && !s.needUndo && !s.fail && xSideOf(s.board) === 'right';
// The first equation with x on the right in a level is pointed out (Add to both sides' message); either order is fine here, so it is
// not required.
export const tradePending = (s) => Boolean(s.tradeIntro) && s.tradeCount === 0 && tradeAvailable(s);

const say = (s, key, params = {}, bad = false) => { s.feedback = { key, params: { a: s.problem.a, b: signed(s.problem.b), ...params }, bad }; return s; };

// ---------- the card ----------

const loop = createSolveLoop({
  id: 'flip-everything',
  startBoard,
  alone: xAlone,
  noLights: () => ({ noopp: 'off', solved: 'off' }),
  params: (s) => ({ a: s.problem.a, b: signed(s.problem.b) }),
  extra: (p, { level, introTrade = false, introFlip = false }) => ({
    fail: null, deal: null, diag: null, pic: null, tried: [],
    tradeIntro: introTrade && level >= TRADE_LEVEL && Boolean(p.mirror), tradeCount: 0, flipIntro: introFlip, flipCount: 0,
  }),
  snapshotExtra: () => ({ fail: null, deal: null, diag: null, pic: null }),
  resetState: (s) => { s.fail = null; s.deal = null; s.diag = null; s.pic = null; },
  collapse: () => false,                                                          // a single-step card: the check never collapses
  mustMoveKey: () => 'aMustMove',
  undoKey: () => 'aUndone',
  touched: (s) => s.tradeCount > 0,
  // a fraction that did not split waits for Undo (or a new try), and so does a flip that put a minus on x
  waitingForUndo: (s) => Boolean(s.fail),
  undoReason: (s) => (s.fail ? 'fail' : 'flip'),
  tag: (p, typed) => tagFlip(p, typed),
  slip: (s, typed, tag) => ({ key: 'fWrong', params: { typed: signed(typed), tag } }),

  reduce(s, action, api) {
    switch (action.type) {
      // Add and Multiply by a whole number belong to other cards
      case 'greyMove':
        return say(s, 'aLater');
      case 'choose': {
        if (action.move === 'fraction') {
          if (s.level < FRACTION_LEVEL) return say(s, 'aLaterLevel');
          return chooseFraction(s, api, say, xAlone);
        }
        // the Multiply button (and the Flip button) checks first that a move can be made now
        if (action.move === 'flip') {
          const g = api.blockMove(s);
          if (g) return g;
          if (xAlone(s.board)) return say(s, 'aSolvedBoard');
          s.menu = 'flip';
          return s;
        }
        if (action.move === 'trade') {
          if (!tradeAvailable(s)) return say(s, 'aTradeNot');
          const g = api.blockMove(s);
          if (g) return g;
          api.pushHistory(s);
          s.board = { left: s.board.right, right: s.board.left };                     // the same equation, the sides swapped (not judged)
          s.rows.push({ type: 'eq', board: s.board });
          s.tradeCount += 1;
          Object.assign(s, { menu: null, hint: null });
          return say(s, 'fTraded');
        }
        return undefined;
      }
      case 'take':
        if (s.level < FRACTION_LEVEL) return 'ignore';
        return takeStep(s, action, api, say, (st, n, sign) => commitFraction(st, n, sign, api));
      case 'flip': {
        const g = api.blockMove(s);
        if (g) return g;
        if (xAlone(s.board)) return say(s, 'aSolvedBoard');
        return commitFlip(s, api);
      }
      default:
        return undefined;
    }
  },
});

// The first flip of a level that helps says, once, what −1 does (Build K: there is no "See why it works" yet), like the first Trade places.
function commitFlip(s, api) {
  const out = commitFlipMove(s, api, FLIP_MOVE);
  if (!out.needUndo && s.flipIntro && s.flipCount === 0) say(s, 'fFlipIntro');
  if (!out.needUndo) s.flipCount += 1;
  return out;
}
const commitFraction = (s, n, sign, api) => commitFractionMove(s, n, sign, api, FLIP_MOVE);

// ---------- the card's entry points ----------

export function newFlip(problem, { level = 2, forceMove = false, introTrade = false, introFlip = false } = {}) {
  const s = loop.newSession(problem, { level, forceMove, introTrade, introFlip });
  return tradePending(s) && !forceMove ? say(s, 'aTradeIntro') : s;
}
export const reduceFlip = loop.reduce;
export const solve = loop;

// Multiply on this card (the shared menu, engine/multiplyMenu.js; Build L): Divide is live from saved Level 4 (by 3, or by −3: −⅓ of both
// sides in one move; by −1 is Flip everything), the whole number and the general fraction are greyed, and Flip everything is the Flip
// button's.
export function flipOption(kind, s) {
  if (kind === 'flip') return 'live';
  if (kind === 'div' || kind === 'frac') return s.level >= FRACTION_LEVEL ? 'live' : 'grey';    // (Build O: the Fraction option is back)
  return 'grey';
}
export const FLIP_MENU = makeMultiplyMenu({
  xAlone,
  coefOf: coefOn,
  option: flipOption,
  greyKey: (kind, s) => ((kind === 'div' || kind === 'frac') && s.level < FRACTION_LEVEL ? 'aLaterLevel' : 'aLater'),
  probe: 'flip',
  negTop: true,
});

// The spotlight on this card (engine/spotlight.js): its errors, and the hint after Undo (the registry's, for the shape Undo returned to).
const FLIP_ERRORS = {
  fWorse: { target: 'coef', label: 'x has a minus', lit: ['newest'] },        // (the whole new equation stays readable: never grey out what the question is about)
  dFail: { target: 'failSide', label: 'doesn’t split' },
  dFail3: { target: 'failSide', label: 'doesn’t split' },
  aUndoFirstHelp: { target: 'lastMove', label: 'waiting for Undo' },
  aUndoGuess: { target: 'subst', lit: ['substLast'] },
  fWrong: { target: 'subst', clear: true, lit: ['substLast'] },
};
export const FLIP_SPOT = {
  error: (s) => FLIP_ERRORS[s.feedback?.key] ?? null,
  keepsReds: (s) => ['dFail', 'dFail3', 'fWorse'].includes(s.feedback?.key),
  clear: (s) => { s.entry = ''; s.sub = null; },
  hint: (s, before = null) => hintAfterUndo(s, before),
  prompt: (s) => (loop.moveOwed(s) ? 'aMustMove' : 'aFindX'),
};
