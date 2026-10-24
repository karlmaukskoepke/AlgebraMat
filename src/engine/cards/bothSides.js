// Variables on both sides (Build R, basic form) as a card of the shared Solve it loop (engine/solveLoop.js), configured like Two-step
// equations and Distribute, combine, solve. The loop owns everything shared (x = [ ], guesses and the check, folding, Undo, Start over, the
// help); this card is configuration:
//   - the board: x-terms on both sides (`5x + 2 = 3x + 10`, `−2x + 3 = x − 6`), and at Level 5 a parenthesis (`3(x + 2) = 5x − 4`);
//   - Add with two options: a number (`+ ▢`) or an x-term (`+ ▢x`, the student types the number in front of x with its sign). On each side
//     the term it cancels goes (`5x + 2 + −3x = 3x + 10 + −3x` makes `5x + 2 + −3x = 10`); everywhere else the amount is written beside the
//     terms, nothing put together for the student;
//   - dragging a term across the = (Add's term layer: an x-term across is the same Add of its opposite, a number as before), combining
//     like terms by dragging (x-terms typed whole, `2x`), the distribute move from Build M (Level 5);
//   - Divide, Fraction and Flip everything once each side is one term (a parenthesis counts as one); Trade places when x ends on the
//     right; Multiply's whole number greyed;
//   - x on one side before checking (Karl's rule, Build D-2): `x =` is greyed with a note while x is on both sides, so there is no guess
//     at the first state and no forced move on this card;
//   - the lights: x on one side (new), Fewer terms (Add and combine only), Solved for x, No parentheses (Level 5).
// The help is the scaffold registry's, the reminder only (solveit/rungs/bothSides.js, and the entries of the shapes other cards share).
// Nothing is worked out for the student: the rows come from the amounts and sums they type, and the app never writes a solved value.
// No DOM here.

import { createSolveLoop } from '../solveLoop.js';
import { shapeOfBoard } from '../solveit/shape.js';
import { signed } from '../solveTerms.js';
import { typeInto, isTyping } from '../entry.js';
import { hasX, sumNums } from '../addBothMoves.js';
import { tagBoth, startTerms } from '../bothSides.js';
import { chooseFraction, takeStep, coefOn } from '../fractionMove.js';
import { commitFlip, commitFraction } from '../flipMove.js';
import { makeMultiplyMenu } from '../multiplyMenu.js';
import { hintAfterUndo } from '../solveit/registry.js';
import { newId } from '../lightsGrab.js';
import { ADD_ERRORS, withLights } from '../addBothLights.js';

// ---------- the board ----------
export const startBoard = (p) => startTerms(p);
export const xOnLeft = (board) => board.left.some(hasX);
export const xOnRight = (board) => board.right.some(hasX);
// x on both sides: the rule that keeps x = greyed
export const xBoth = (board) => xOnLeft(board) && xOnRight(board);
const xSide = (board) => (xOnLeft(board) ? 'left' : 'right');
// x is alone: one plain x on its side, and x on that side only
export const xAlone = (board) => !xBoth(board) && board[xSide(board)].length === 1 && board[xSide(board)][0].kind === 'x' && (board[xSide(board)][0].coef ?? 1) === 1;
// a fraction or a flip of both sides needs each side to be one term (a parenthesis is one term), and x on one side
export const singleTerm = (board) => board.left.length === 1 && board.right.length === 1 && !xBoth(board);
export const hasGroup = (board) => [...board.left, ...board.right].some((t) => t.kind === 'group');
export const shape = (board) => shapeOfBoard(board, 'both');

const say = (s, key, params = {}, bad = false) => { s.feedback = { key, params: { ...params }, bad }; return s; };
const coefText = (c) => (c === 1 ? 'x' : c === -1 ? '−x' : `${signed(c)}x`);
const termShown = (t) => (t.kind === 'x' ? coefText(t.coef ?? 1) : signed(t.v));
const plus = (text) => (text.startsWith('−') ? text : `+${text}`);
// The lights of a board (Build R): x on one side, and the shapes' own (Fewer terms is the move's, set where an Add or a combine is judged)
export const boardLights = (prev, board, fewer = 'off') => ({ fewer, noparen: hasGroup(board) ? 'off' : 'green', xone: xBoth(board) ? 'off' : 'green', solved: xAlone(board) ? 'green' : 'off' });

// ---------- the Add move, with a number or an x-term ----------
// On each side the term the amount cancels (its opposite) goes; on a side with nothing to cancel the amount is written at the end. A side
// left empty says 0. Returns the new board, the work row and which sides cancelled.
export function addToBoth(board, k, isX) {
  const cancels = (t) => (isX ? t.kind === 'x' && (t.coef ?? 1) === -k : t.kind === 'num' && t.v === -k);
  const out = {};
  const work = {};
  const hit = [];
  for (const side of ['left', 'right']) {
    const at = board[side].findIndex(cancels);
    const added = isX ? { x: true, coef: k, added: true, struck: at >= 0 } : { v: k, added: true, struck: at >= 0 };
    work[side] = [...board[side].map((t, i) => (t.kind === 'x' ? { x: true, coef: t.coef ?? 1, struck: i === at } : t.kind === 'num' ? { v: t.v, struck: i === at } : { term: t })), added];
    if (at >= 0) {
      hit.push(side);
      const rest = board[side].filter((_, i) => i !== at);
      out[side] = rest.length ? rest : [{ id: newId(), kind: 'num', v: 0 }];
    } else {
      out[side] = [...board[side], isX ? { id: newId(), kind: 'x', coef: k } : { id: newId(), kind: 'num', v: k }];
    }
  }
  return { board: { left: out.left, right: out.right }, work: { ...work, amount: k, x: isX }, hit };
}

// The Add, judged: helpful when it cancels a term on a side (moving an x-term either way, or a number); else it waits for Undo, said in
// the student's numbers: a term of the same kind and the opposite sign only partly cancelled ("still here"), or nothing cancelled at all.
function addMove(s, api) {
  const k = /^-?\d+$/.test(s.amountEntry ?? '') ? Number(s.amountEntry) : null;
  const isX = s.addKind === 'x';
  if (k === null || k === 0) return say(s, 'aAmountZero', {}, true);
  if (Math.abs(k) > (isX ? 9 : 30)) return say(s, 'aAmountBig', {}, true);
  const gate = api.blockMove(s);
  if (gate) return gate;
  api.fold(s);                                       // (the move before it is committed first: Undo takes back this one)
  api.pushHistory(s);
  const before = s.board;
  const { board, work, hit } = addToBoth(before, k, isX);
  const added = isX ? coefText(k) : signed(k);
  const like = (t) => (isX ? t.kind === 'x' : t.kind === 'num');
  const helpful = hit.length > 0;
  const opposite = [...before.left, ...before.right].find((t) => like(t) && Math.sign(isX ? (t.coef ?? 1) : t.v) === -Math.sign(k));
  const fewer = helpful ? 'green' : opposite ? 'neutral' : 'red';
  s.lastAmount = k;
  s.lastAddX = isX;
  Object.assign(s, { menu: null, typing: null, amountEntry: '', hint: null, addKind: null });
  api.commit(s, { rows: [{ type: 'work', work }, { type: 'eq', board }], next: board, label: null, helpful, lights: boardLights(before, board, fewer) });
  s.prevBoard = board;
  if (helpful) return say(s, xAlone(board) ? 'aSolvedBoard' : 'aFindX');
  if (opposite) {
    const v = isX ? (opposite.coef ?? 1) : opposite.v;
    return say(s, 'vPartial', { before: plus(termShown(opposite)), added: plus(added), left: isX ? coefText(v + k) : signed(v + k) }, true);
  }
  const val = (t) => (isX ? (t.coef ?? 1) : t.v);
  const all = [...before.left, ...before.right].filter(like);
  const same = all.find((t) => val(t) === k) ?? all.find((t) => Math.sign(val(t)) === Math.sign(k)) ?? all[0];
  return say(s, 'vRed', { before: same ? plus(termShown(same)) : '', added: plus(added), x: isX }, true);
}

// ---------- Multiply's options on this card ----------
export function optionOf(kind) {
  return kind === 'whole' ? 'grey' : 'live';
}
export const OPTION_LIVE = (kind, s) => (kind === 'whole' ? 'grey' : singleTerm(s.board) ? 'live' : 'grey');
export const greyKey = (kind, s) => (kind === 'whole' ? 'aLater' : s && xBoth(s.board) ? 'vOneSide' : 'wOneTerm');

export const tradeAvailable = (s) => s.stage === 'moves' && !s.sub && !s.needUndo && !s.fail && !s.lx?.combine && !xBoth(s.board) && xOnRight(s.board);
const amountKeys = (s) => s.menu === 'add' && s.typing !== 'answer';
const MOVE = { shape, alone: xAlone, say, rebase: true };

// ---------- the card ----------

const loop = createSolveLoop({
  id: 'variables-both-sides',
  startBoard,
  alone: xAlone,
  noLights: () => ({ fewer: 'off', noparen: 'off', xone: 'off', solved: 'off' }),
  params: () => ({}),
  extra: () => ({
    fail: null, deal: null, diag: null, pic: null, tried: [], mopts: null, tradeCount: 0, flipCount: 0, addKind: null,
    amountEntry: '', pending: null, combining: null, resolving: false, alone: null, prevBoard: null, zeroOther: false, work: null,
    lastAmount: null, lastAddX: false, forcedAmount: null, teachFlow: false, startOver: false, lastFlip: false,
  }),
  snapshotExtra: (s) => ({ fail: null, deal: null, diag: null, pic: null, prevBoard: s.prevBoard, amountEntry: s.amountEntry, work: s.work, zeroOther: false, lastFlip: false, startOver: s.startOver, addKind: s.addKind }),
  resetState(s) {
    Object.assign(s, { fail: null, deal: null, diag: null, pic: null, mopts: null, amountEntry: '', addKind: null, zeroOther: false, work: null, alone: null, prevBoard: s.board, lastFlip: false, startOver: false });
  },
  reminderOnly: true,                                                            // basic form: I'm stuck gives the reminder only
  touched: (s) => s.amountEntry !== '' || s.tradeCount > 0,
  // x on one side before checking (Karl's rule): x = is greyed while x is on both sides
  answerBlocked: (s) => xBoth(s.board),
  waitingForUndo: (s) => Boolean(s.fail),
  undoReason: (s) => (s.fail ? 'fail' : s.lastFlip ? 'flip' : s.lights.fewer === 'red' ? 'red' : 'partial'),
  afterUndo(s) { Object.assign(s, { zeroOther: false, alone: null, lastFlip: false }); },
  tag: (p, typed) => tagBoth(p, typed),
  slip: (s, typed, tag) => ({ key: 'wWrong', params: { typed: signed(typed), tag } }),

  reduce(s, action, api) {
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
        Object.assign(s, { menu: 'add', typing: null, amountEntry: String(action.value) });
        return say(s, 'aAmountSet', { amount: signed(action.value) });
      // Add's two options: a number, or an x-term (Build R); the blank stays open, only what it adds changes
      case 'addPick': {
        if (s.stage !== 'moves' || s.sub) return 'ignore';
        const g = api.blockMove(s);
        if (g) return g;
        if (xAlone(s.board)) return say(s, 'aSolvedBoard');
        Object.assign(s, { menu: 'add', typing: null, addKind: action.kind === 'x' ? 'x' : 'num', mopts: null });
        return say(s, action.kind === 'x' ? 'vPickX' : 'aPickAmount');
      }
      case 'choose': {
        if (s.stage !== 'moves' || s.sub) return 'ignore';
        if (action.move === 'add') {
          const g = api.blockMove(s);
          if (g) return g;
          if (xAlone(s.board)) return say(s, 'aSolvedBoard');
          Object.assign(s, { menu: 'add', typing: null, addKind: s.addKind ?? 'num' });
          return say(s, 'aPickAmount');
        }
        if (action.move === 'trade') {
          if (!tradeAvailable(s)) return say(s, xBoth(s.board) ? 'vOneSide' : 'aTradeNot');
          const g = api.blockMove(s);
          if (g) return g;
          api.fold(s);
          api.pushHistory(s);
          s.board = { left: s.board.right, right: s.board.left };                     // the same equation, the sides swapped (not judged)
          s.rows.push({ type: 'eq', board: s.board });
          s.prevBoard = s.board;
          s.tradeCount += 1;
          s.movedOnce = true;
          Object.assign(s, { menu: null, hint: null, amountEntry: '' });
          return say(s, 'aTraded');
        }
        if (action.move === 'mult') {
          const g = api.blockMove(s);
          if (g) return g;
          if (xAlone(s.board)) return say(s, 'aSolvedBoard');
          s.menu = 'mult';
          return s;
        }
        if (action.move === 'fraction') {
          if (!singleTerm(s.board)) return say(s, greyKey('frac', s));
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
        if (!singleTerm(s.board)) return say(s, greyKey('flip', s));
        if (xAlone(s.board)) return say(s, 'aSolvedBoard');
        api.fold(s);
        const out = commitFlip(s, api, MOVE);
        s.lastFlip = out.needUndo;
        if (!out.needUndo) s.flipCount += 1;
        return out;
      }
      case 'go': {
        if (s.stage !== 'moves' || s.menu !== 'add' || s.sub) return 'ignore';
        return addMove(s, api);
      }
      default:
        return undefined;
    }
  },
});

// ---------- the card's entry points ----------

export function newBothSides(problem, { level = 1 } = {}) {
  const s = loop.newSession(problem, { level, forceMove: false });              // (no forced move: there is no guess at the first state)
  s.prevBoard = s.board;
  s.lights = boardLights(s.board, s.board);
  return s;
}
export const reduceBothSides = loop.reduce;
export const solve = loop;
export { coefOn, sumNums };

// Multiply on this card (the shared menu): Divide, Fraction and Flip everything once each side is one term; the whole number greyed.
export const BOTH_MENU = makeMultiplyMenu({ xAlone, coefOf: coefOn, option: OPTION_LIVE, greyKey, probe: 'mult', negTop: true });

// The spotlight on this card: an Add that did not cancel (the work row and the new equation lit, never greyed), a wrong sum (Add's), a wrong
// product (Build M's), the shared fraction and flip errors, a wrong value; and the hint after Undo (the registry's, for the shape Undo
// returned to).
const BOTH_ERRORS = {
  ...ADD_ERRORS,
  vRed: { target: 'lastMove', label: 'got bigger', lit: ['newest'] },
  vPartial: { target: 'lastMove', label: 'still here', lit: ['newest'] },
  dxProductWrong: { target: 'prodbox', label: 'check this', lit: ['prodlabel', 'factor'] },
  fWorse: { target: 'coef', label: 'x has a minus', lit: ['newest'] },
  dFail: { target: 'failSide', label: 'doesn’t split' },
  dFail3: { target: 'failSide', label: 'doesn’t split' },
  wWrong: { target: 'subst', clear: true, lit: ['substLast'] },
};
export const BOTH_SPOT = {
  error: (s) => BOTH_ERRORS[s.feedback?.key] ?? null,
  keepsReds: (s) => ['vRed', 'vPartial', 'dFail', 'dFail3', 'fWorse'].includes(s.feedback?.key),
  startOverAt: 3,
  clear: (s) => { s.entry = ''; s.sub = null; },
  hint: (s, before = null) => hintAfterUndo(s, before),
  prompt: () => 'aFindX',
};

// The card's layers: Add's term layer (dragging, crossing the =, combining, the distribute move, the Add blank) round the Multiply menu
// round the card. An x-term dragged across the = is the Add of its opposite (`xAdd`).
const layered = withLights(BOTH_MENU.withMenu(reduceBothSides), {
  alone: xAlone,
  menuPreview: (s, kind) => OPTION_LIVE(kind, s) === 'live',
  distribute: true,
  xAdd: true,
  lights: (s, board) => boardLights(s.prevBoard ?? board, board),
  fold: loop.api.fold,
});
// The lights follow the board: x on one side, Solved for x and No parentheses; Fewer terms only for an Add or a combine (it goes off after a
// distribute, a divide or a flip). A term picked up closes Multiply's options.
export function BOTH_LAYER(s, action) {
  const out = layered((action.type === 'lxDrop' || action.type === 'lxDistribute') && s.mopts ? { ...s, mopts: null } : s, action);
  if (out === s || !out.board) return out;
  if (out.lx?.combine && out.feedback?.key === 'lxCombineWrong' && s.feedback?.key !== 'lxCombineWrong') sizesSlip(out);
  const moved = JSON.stringify(out.board) !== JSON.stringify(s.board);
  const combined = Boolean(s.lx?.combine) && !out.lx?.combine && moved;
  const added = out.history.length > s.history.length && out.rows.at(-2)?.type === 'work' && Boolean(out.rows.at(-2)?.work);
  // (an Add, by the button or by dragging across the =, judged itself; a combine is one term fewer; Undo puts back what was; any other move
  // that changes the board is not judged for Fewer terms)
  const fewer = added ? out.lights.fewer : combined ? 'green' : action.type === 'undo' || action.type === 'startOver' || !moved ? out.lights?.fewer ?? 'off' : 'off';
  return { ...out, lights: boardLights(out.board, out.board, fewer) };
}
// A wrong sum of two x-terms that added the sizes (`5x + −3x` typed 8x) is recorded with its tag.
function sizesSlip(s) {
  const c = s.lx.combine;
  const find = (id) => [...s.board.left, ...s.board.right].find((t) => t.id === id);
  const v = (t) => (t.kind === 'x' ? (t.coef ?? 1) : t.v);
  const a = v(find(c.a));
  const b = v(find(c.b));
  const typed = Number(String(c.entry).replace('x', ''));
  const tag = Math.sign(a) !== Math.sign(b) && Math.abs(typed) === Math.abs(a) + Math.abs(b) ? 'sizes-added' : 'combine-wrong';
  s.answers.push({ typed: `${c.entry}`, tag });
  s.tags.push(tag);
}
