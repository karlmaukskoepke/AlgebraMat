// Distribute, combine, solve (Build M, basic form) as a card of the shared Solve it loop (engine/solveLoop.js), configured like Two-step
// equations (engine/cards/twoStep.js). The loop owns everything shared (x = [ ] at every state, guesses and the check, the forced move,
// folding, Undo, Start over, the help); this card is configuration of the shared moves:
//   - the board: a factor times a parenthesis (`3(x + 2) = 15`), a number beside it (`5 + 2(x + 3) = 21`, `5 − 2(x + 2) = 3`) or an
//     x-term (`3(x + 2) + 2x = 21`);
//   - the distribute move, the term layer's (engine/addBothLights.js with `distribute: true`; engine/distributeMove.js): the factor dragged
//     onto the parenthesis, one typed product a piece; a subtracted factor's minus is tapped first;
//   - combining like terms by dragging (numbers, and now x-terms, typed whole: `5x`); Add ___ to both sides (engine/addMove.js), with the
//     several numbers of a distributed row kept apart (an amount cancels one of them, or their sum);
//   - Divide (the Multiply menu's option) and Flip everything, live once each side is one term (Build K's rule; a parenthesis is one term,
//     so `3(x + 2) = 15` may be divided first: `x + 2 = ⅓(15)`); Trade places, Multiply's whole number and Fraction are greyed;
//   - the lights (Fewer terms, No parentheses, Solved for x), the slips and the words. The help is the scaffold registry's, the reminder only
//     (solveit/rungs/distribute.js, and Two-step's, Divide it's and Flip everything's entries for the shapes they share).
// Nothing is worked out for the student: the rows come from the products and sums they type, and the app never writes a solved value.
// No DOM here.

import { createSolveLoop } from '../solveLoop.js';
import { shapeOfBoard, lightsOf } from '../solveit/shape.js';
import { signed, fractionText } from '../solveTerms.js';
import { typeInto, isTyping } from '../entry.js';
import { num, xSideOf, hasX } from '../addBothMoves.js';
import { tagDistSolve, startTerms } from '../distSolve.js';
import { addBare } from '../addMove.js';
import { chooseFraction, takeStep, coefOn } from '../fractionMove.js';
import { commitFlip, commitFraction } from '../flipMove.js';
import { makeMultiplyMenu } from '../multiplyMenu.js';
import { hintAfterUndo } from '../solveit/registry.js';
import { addBoardKeep, addWorkKeep } from '../distributeMove.js';
import { ADD_ERRORS, moveOwed, withLights } from '../addBothLights.js';

// ---------- the board ----------
export const startBoard = (p) => startTerms(p);
// x is alone: one plain x on its side
export const xAlone = (board) => board[xSideOf(board)].length === 1 && board[xSideOf(board)][0].kind === 'x' && (board[xSideOf(board)][0].coef ?? 1) === 1;
// Karl's rule "B" (Build K): a fraction or a flip of both sides needs each side to be one term; a parenthesis is one term
export const singleTerm = (board) => board.left.length === 1 && board.right.length === 1;
export const hasGroup = (board) => [...board.left, ...board.right].some((t) => t.kind === 'group');
export const shape = (board) => shapeOfBoard(board, 'dist');

const say = (s, key, params = {}, bad = false) => { s.feedback = { key, params: { ...params }, bad }; return s; };
const MOVE = { shape, alone: xAlone, say, rebase: true, board: addBoardKeep, work: addWorkKeep };
const amountKeys = (s) => s.menu === 'add' && s.typing !== 'answer';
const coefText = (c) => (c === 1 ? 'x' : c === -1 ? '−x' : `${signed(c)}x`);

// What Multiply's options are on this card: Divide and Flip everything once each side is one term (a negative divides too: −⅓ in one
// move); the whole number and the general fraction belong to later cards.
export function optionOf(kind, s) {
  if (kind === 'whole' || kind === 'frac') return 'grey';
  return singleTerm(s.board) ? 'live' : 'grey';
}
export const greyKey = (kind) => (kind === 'whole' || kind === 'frac' ? 'aLater' : 'wOneTerm');

// The lights after a move the term layer makes (a distribute): Fewer terms is not judged there; No parentheses and Solved for x are.
export const distLights = (s, board) => { const l = lightsOf(shape(s.prevBoard ?? board), shape(board)); return { ...l, fewer: 'off' }; };

// ---------- the card ----------

const loop = createSolveLoop({
  id: 'distribute-solve',
  startBoard,
  alone: xAlone,
  noLights: () => ({ fewer: 'off', noparen: 'off', solved: 'off' }),
  params: () => ({}),
  extra: () => ({
    fail: null, deal: null, diag: null, pic: null, tried: [], mopts: null, tradeCount: 0, flipIntro: false, flipCount: 0,
    amountEntry: '', pending: null, combining: null, resolving: false, alone: null, prevBoard: null, zeroOther: false, work: null,
    lastAmount: null, forcedAmount: null, teachFlow: false, startOver: false, lastFlip: false,
  }),
  snapshotExtra: (s) => ({ fail: null, deal: null, diag: null, pic: null, prevBoard: s.prevBoard, amountEntry: s.amountEntry, work: s.work, zeroOther: false, lastFlip: false, startOver: s.startOver }),
  resetState(s) {
    Object.assign(s, { fail: null, deal: null, diag: null, pic: null, mopts: null, amountEntry: '', zeroOther: false, work: null, alone: null, prevBoard: s.board, lastFlip: false, startOver: false });
  },
  collapse: (level) => level >= 3,                                              // a multi-step card: full checks at Levels 1-2 (loop spec §6)
  mustMoveKey: () => 'lxMustMove',
  reminderOnly: true,                                                            // basic form: I'm stuck gives the reminder only
  touched: (s) => s.amountEntry !== '',
  waitingForUndo: (s) => Boolean(s.fail),
  undoReason: (s) => (s.fail ? 'fail' : s.zeroOther ? 'zero' : s.lastFlip ? 'flip' : s.feedback?.key === 'wBoxes' ? 'boxes' : s.lights.fewer === 'red' ? 'red' : 'partial'),
  afterUndo(s) { Object.assign(s, { zeroOther: false, alone: null, lastFlip: false }); },
  tag: (p, typed) => tagDistSolve(p, typed),
  slip: (s, typed, tag) => ({ key: 'wWrong', params: { typed: signed(typed), tag } }),

  reduce(s, action, api) {
    // typing: the Add move's blank while it is open (Divide's blank is the Multiply menu's); x = is the loop's
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
        if (action.move === 'trade') return say(s, 'aLater');
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
        return takeStep(s, action, api, say, (st, n, sign) => commitFraction(st, n, sign, api, MOVE));
      case 'flip': {
        const g = api.blockMove(s);
        if (g) return g;
        if (!singleTerm(s.board)) return say(s, 'wOneTerm');
        if (xAlone(s.board)) return say(s, 'aSolvedBoard');
        api.fold(s);
        const out = commitFlip(s, api, MOVE);
        s.lastFlip = out.needUndo;
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
        // nothing to cancel (`3x = 15`) and the number in front of x added as if it could be: Two-step's three x boxes
        const a = before.coef;
        if (s.needUndo && !s.zeroOther && before.id === 'D1' && a > 1 && Math.abs(s.lastAmount) === a) {
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

export function newDistSolve(problem, { level = 1, forceMove = false } = {}) {
  const s = loop.newSession(problem, { level, forceMove });
  s.prevBoard = s.board;
  return s;
}
export const reduceDistSolve = loop.reduce;
export const solve = loop;
export { coefOn, hasX };

// Multiply on this card (the shared menu): Divide and Flip once each side is one term; a negative divides (−⅓ in one move).
export const DIST_MENU = makeMultiplyMenu({ xAlone, coefOf: coefOn, option: optionOf, greyKey, probe: 'mult', negTop: true });

// The spotlight on this card: Add to both sides' errors, a wrong product (its blank and label lit), a wrong sum, the three x boxes, the
// shared fraction and flip errors; and the hint after Undo (the registry's, for the shape Undo returned to).
const DIST_ERRORS = {
  ...ADD_ERRORS,
  dxProductWrong: { target: 'prodbox', label: 'check this', lit: ['prodlabel', 'factor'] },
  wBoxes: { target: 'coef', label: 'x boxes', lit: ['workpair', 'newest'] },
  fWorse: { target: 'coef', label: 'x has a minus', lit: ['newest'] },
  dFail: { target: 'failSide', label: 'doesn’t split' },
  dFail3: { target: 'failSide', label: 'doesn’t split' },
  wWrong: { target: 'subst', clear: true, lit: ['substLast'] },
};
export const DIST_SPOT = {
  error: (s) => DIST_ERRORS[s.feedback?.key] ?? null,
  keepsReds: (s) => ['aRed', 'aRed3', 'aZeroOther', 'lxZero', 'aPartial', 'wBoxes', 'dFail', 'dFail3', 'fWorse'].includes(s.feedback?.key),
  startOverAt: 3,
  clear: (s) => { s.entry = ''; s.sub = null; },
  hint: (s, before = null) => hintAfterUndo(s, before),
  prompt: (s) => (moveOwed(s) ? 'lxMustMove' : 'aFindX'),
};

// The card's layers: Add's term layer (dragging, combining, the distribute move, the Add blank) round the Multiply menu round the card.
const layered = withLights(DIST_MENU.withMenu(reduceDistSolve), {
  alone: xAlone,
  menuPreview: (s, kind) => optionOf(kind, s) === 'live',
  distribute: true,
  lights: distLights,
  fold: loop.api.fold,
});
// A wrong sum that added the sizes (`6 + −4` typed 10) is recorded with its tag (Build M); a term picked up closes Multiply's options.
export function DIST_LAYER(s, action) {
  const out = layered((action.type === 'lxDrop' || action.type === 'lxDistribute') && s.mopts ? { ...s, mopts: null } : s, action);
  if (out !== s && out.feedback?.key === 'lxCombineWrong' && s.feedback?.key !== 'lxCombineWrong') sizesSlip(out);
  return out;
}
function sizesSlip(s) {
  const c = s.lx.combine;
  const find = (id) => [...s.board.left, ...s.board.right].find((t) => t.id === id);
  const v = (t) => (t.kind === 'x' ? (t.coef ?? 1) : t.v);
  const a = v(find(c.a));
  const b = v(find(c.b));
  const typed = Number(String(c.entry).replace('x', '') === '' || String(c.entry).replace('x', '') === '-' ? NaN : String(c.entry).replace('x', ''));
  const tag = Math.sign(a) !== Math.sign(b) && Math.abs(typed) === Math.abs(a) + Math.abs(b) ? 'sizes-added' : 'combine-wrong';
  s.answers.push({ typed: `${c.entry}`, tag });
  s.tags.push(tag);
}
export { num };
