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
// On each side the term the amount cancels (its opposite) goes; on a side with nothing to cancel the amount is written beside the terms (a
// number at the end; an x-term right after the side's first x-term, so like terms sit together: `5x + −3x + 2 = 10`, Build T). A side
// left empty says 0. Returns the new board, the work row and which sides cancelled. An x-term's work row is stacked (Build T, Part 5):
// the amount sits under the side's first x-term (its first term, where it has none), `under`, like adding in a column.
export const stackAt = (terms) => Math.max(0, terms.findIndex((t) => t.kind === 'x'));
export function addToBoth(board, k, isX) {
  const cancels = (t) => (isX ? t.kind === 'x' && (t.coef ?? 1) === -k : t.kind === 'num' && t.v === -k);
  const out = {};
  const work = {};
  const hit = [];
  for (const side of ['left', 'right']) {
    const at = board[side].findIndex(cancels);
    const under = stackAt(board[side]);
    const added = isX ? { x: true, coef: k, added: true, struck: at >= 0, under } : { v: k, added: true, struck: at >= 0 };
    work[side] = [...board[side].map((t, i) => (t.kind === 'x' ? { x: true, coef: t.coef ?? 1, struck: i === at } : t.kind === 'num' ? { v: t.v, struck: i === at } : { term: t })), added];
    if (at >= 0) {
      hit.push(side);
      const rest = board[side].filter((_, i) => i !== at);
      out[side] = rest.length ? rest : [{ id: newId(), kind: 'num', v: 0 }];
    } else if (isX) {
      out[side] = [...board[side].slice(0, under + 1), { id: newId(), kind: 'x', coef: k }, ...board[side].slice(under + 1)];
    } else {
      out[side] = [...board[side], { id: newId(), kind: 'num', v: k }];
    }
  }
  return { board: { left: out.left, right: out.right }, work: { ...work, amount: k, x: isX, ...(isX ? { stack: true } : {}) }, hit };
}

// An Add that emptied a side (it says 0) and left an x-term and a number together on the other: { side, beside } or null, whatever the
// sign of the x-term left (Build Q, Part 6, Karl's rule: the error is not separating the x-terms and the numbers onto opposite sides;
// `2x = 3x + 6` + −2x makes `0 = x + 6` and is flagged too). `beside`: a number was beside x before (its opposite is the Add to make
// instead).
// The x-term with the smaller number in front (cancelling it leaves the other with a plus), or the only one
export function smallerX(board) {
  const l = board.left.find((t) => t.kind === 'x');
  const r = board.right.find((t) => t.kind === 'x');
  if (!l || !r) return l ?? r ?? null;
  return (l.coef ?? 1) <= (r.coef ?? 1) ? l : r;
}

export function zeroedSide(before, board, isX) {
  const side = ['left', 'right'].find((k) => board[k].length === 1 && board[k][0].kind === 'num' && board[k][0].v === 0 && !(before[k].length === 1 && before[k][0].kind === 'num' && before[k][0].v === 0));
  if (!side) return null;
  const full = board[side === 'left' ? 'right' : 'left'];
  const xs = full.filter((t) => t.kind === 'x');
  if (!xs.length || !full.some((t) => t.kind === 'num')) return null;
  const xSideBefore = before.left.some((t) => t.kind === 'x') ? before.left : before.right;
  return { side, beside: !isX && xSideBefore.some((t) => t.kind === 'num') };
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
  // the wrong cancel (Build T, Part 4): a legal Add that took everything off one side and left x-terms and numbers together on the other
  // (`5x = 3x + 10` + −5x makes `0 = −2x + 10`) is a deliberate exception to "a legal move is never red": the spotlight, Undo, a hint
  const zeroed = helpful ? zeroedSide(before, board, isX) : null;
  api.commit(s, { rows: [{ type: 'work', work }, { type: 'eq', board }], next: board, label: null, helpful: helpful && !zeroed, lights: boardLights(before, board, zeroed ? 'neutral' : fewer) });
  s.prevBoard = board;
  if (zeroed) {
    s.zeroSide = { x: isX };
    s.answers.push({ typed: `add ${added}`, tag: 'zeroed-side' });
    s.tags.push('zeroed-side');
    return say(s, 'vZeroSide', { x: isX, beside: zeroed.beside }, true);
  }
  if (helpful) return say(s, xAlone(board) ? 'aSolvedBoard' : 'aFindX');
  // an x-term that cancels no x-term (Build T, Part 5): said with the real numbers, the x-term to cancel being the one that keeps the
  // x-term left with a plus (the smaller)
  if (isX) {
    const small = smallerX(before);
    return say(s, 'vNoCancelX', small ? { term: coefText(small.coef ?? 1), amount: coefText(-(small.coef ?? 1)) } : {}, true);
  }
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
// ---------- the card ----------
// (a factory, Build V: Strange solutions is this card with its own answers, its own divide and its shapes' family; `own` is its config:
// `reduce` (tried first), and the loop's hooks it replaces)
function makeLoop({ id, family = 'both', own = null }) {
  const MOVE = { shape: (board) => shapeOfBoard(board, family), alone: xAlone, say, rebase: true };
  return createSolveLoop({
  id,
  startBoard,
  alone: xAlone,
  noLights: () => ({ fewer: 'off', noparen: 'off', xone: 'off', solved: 'off' }),
  params: () => ({}),
  extra: () => ({
    fail: null, deal: null, diag: null, pic: null, tried: [], mopts: null, tradeCount: 0, flipCount: 0, addKind: null,
    amountEntry: '', pending: null, combining: null, resolving: false, alone: null, prevBoard: null, zeroOther: false, zeroSide: null, work: null,
    lastAmount: null, lastAddX: false, forcedAmount: null, teachFlow: false, startOver: false, lastFlip: false, ...(own?.extra ?? {}),
  }),
  snapshotExtra: (s) => ({ fail: null, deal: null, diag: null, pic: null, prevBoard: s.prevBoard, amountEntry: s.amountEntry, work: s.work, zeroOther: false, zeroSide: null, lastFlip: false, startOver: s.startOver, addKind: s.addKind }),
  resetState(s) {
    Object.assign(s, { fail: null, deal: null, diag: null, pic: null, mopts: null, amountEntry: '', addKind: null, zeroOther: false, work: null, alone: null, prevBoard: s.board, lastFlip: false, startOver: false });
  },
  reminderOnly: true,                                                            // basic form: I'm stuck gives the reminder only
  touched: (s) => s.amountEntry !== '' || s.tradeCount > 0,
  // x on one side before checking (Karl's rule): x = is greyed while x is on both sides
  answerBlocked: (s) => xBoth(s.board),
  waitingForUndo: (s) => Boolean(s.fail),
  undoReason: (s) => (s.fail ? 'fail' : s.zeroSide ? 'zeroSide' : s.lastFlip ? 'flip' : s.lights.fewer === 'red' ? 'red' : 'partial'),
  afterUndo(s) { Object.assign(s, { zeroOther: false, zeroSide: null, alone: null, lastFlip: false }); },
  tag: (p, typed) => tagBoth(p, typed),
  slip: (s, typed, tag) => ({ key: 'wWrong', params: { typed: signed(typed), tag } }),

  reduce(s, action, api) {
    const mine = own?.reduce?.(s, action, api, MOVE);
    if (mine !== undefined) return mine;
    if (isTyping(action)) {
      if (s.sub || !amountKeys(s)) return undefined;
      // (a box clicked to retype: the first key replaces what is there, Build T)
      const entry = typeInto(s.amountSel && action.type !== 'toggleSign' ? '' : s.amountEntry, action, 'integer');
      s.amountSel = false;
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
        Object.assign(s, { menu: 'add', typing: null, addKind: action.kind === 'x' ? 'x' : 'num', mopts: null, amountSide: 'left', amountSel: false });
        return say(s, action.kind === 'x' ? 'vPickX' : 'aPickAmount');
      }
      case 'choose': {
        if (s.stage !== 'moves' || s.sub) return 'ignore';
        if (action.move === 'add') {
          const g = api.blockMove(s);
          if (g) return g;
          if (xAlone(s.board)) return say(s, 'aSolvedBoard');
          Object.assign(s, { menu: 'add', typing: null, addKind: s.addKind ?? 'num', amountSide: 'left', amountSel: false });
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
  ...(own?.loop ?? {}),
  });
}
export { coefOn, sumNums };

// The spotlight on this card: an Add that did not cancel (the work row and the new equation lit, never greyed), a wrong sum (Add's), a wrong
// product (Build M's), the shared fraction and flip errors, a wrong value; and the hint after Undo (the registry's, for the shape Undo
// returned to).
const BOTH_ERRORS = {
  ...ADD_ERRORS,
  vRed: { target: 'lastMove', label: 'got bigger', lit: ['newest'] },
  vPartial: { target: 'lastMove', label: 'still here', lit: ['newest'] },
  vZeroSide: { target: 'zeroSide', label: 'nothing left', lit: ['fullSide'] },        // (the wrong cancel, Build T, Part 4)
  vNoCancelX: { target: 'lastMove', label: 'nothing cancels', lit: ['newest'] },        // (an x-term that cancels none: its stacked amounts and the x-terms above them)
  dxProductWrong: { target: 'prodbox', label: 'check this', lit: ['prodlabel', 'factor'] },
  fWorse: { target: 'coef', label: 'x has a minus', lit: ['newest'] },
  dFail: { target: 'failSide', label: 'doesn’t split' },
  dFail3: { target: 'failSide', label: 'doesn’t split' },
  wWrong: { target: 'subst', clear: true, lit: ['substLast'] },
};
// The x-term to cancel after the wrong cancel (Build Q, Part 6): the one on the side that holds the number, so the number ends alone on
// its side (`2x = 3x + 6`: add −3x, `2x + −3x = 6`); never the move just undone. Where both sides (or neither) hold a number, the smaller.
export function xBesideNumber(board) {
  const holds = ['left', 'right'].filter((k) => board[k].some((t) => t.kind === 'num'));
  if (holds.length !== 1) return smallerX(board);
  return board[holds[0]].find((t) => t.kind === 'x') ?? smallerX(board);
}

// The hint after Undo of the wrong cancel (Build T, Part 4), recorded as `hint`: Add's x-term option lit with its preview and the x-term to
// add, the one beside the number (Build Q, Part 6; an x-term that cancelled none: the smaller, as its message says); after a number that
// emptied its side, Add's number option with the opposite of the number beside x.
function zeroSideHint(s, before) {
  const b = s.board;
  if (before.zeroSide?.x || before.feedback?.key === 'vNoCancelX') {
    const small = before.zeroSide?.x ? xBesideNumber(b) : smallerX(b);
    if (!small) return null;
    const k = -(small.coef ?? 1);
    Object.assign(s, { menu: 'add', addKind: 'x', typing: null, amountEntry: String(k), hint: { kind: 'cancel', id: small.id } });
    if (!s.supportsShown.includes('hint')) s.supportsShown.push('hint');
    return { target: 'hinted', key: 'vZeroHint', params: { term: coefText(-k), amount: coefText(k), ...(before.zeroSide?.x ? { beside: true } : {}) }, move: 'add' };
  }
  const xs = b.left.some((t) => t.kind === 'x') ? b.left : b.right;
  const con = xs.find((t) => t.kind === 'num');
  if (!con) return null;
  Object.assign(s, { menu: 'add', addKind: 'num', typing: null, amountEntry: String(-con.v), hint: { kind: 'cancel', id: con.id } });
  if (!s.supportsShown.includes('hint')) s.supportsShown.push('hint');
  return { target: 'hinted', key: 'vZeroHintNum', params: { constant: plus(signed(con.v)), opposite: plus(signed(-con.v)) }, move: 'add' };
}

export const BOTH_SPOT = {
  error: (s) => BOTH_ERRORS[s.feedback?.key] ?? null,
  keepsReds: (s) => ['vRed', 'vPartial', 'vZeroSide', 'vNoCancelX', 'dFail', 'dFail3', 'fWorse'].includes(s.feedback?.key),
  startOverAt: 3,
  clear: (s) => { s.entry = ''; s.sub = null; },
  hint: (s, before = null) => (['vZeroSide', 'vNoCancelX'].includes(before?.feedback?.key) ? zeroSideHint(s, before) ?? hintAfterUndo(s, before) : hintAfterUndo(s, before)),
  prompt: () => 'aFindX',
};

// A card made on this one (Variables on both sides; Distribute more shares it; Strange solutions, Build V, makes its own): its loop, its
// first state, its Multiply menu and its layers. Add's term layer (dragging, crossing the =, combining, the distribute move, the Add blank)
// round the Multiply menu round the card. An x-term dragged across the = is the Add of its opposite (`xAdd`).
export function makeBothCard({ id, family = 'both', own = null }) {
  const loop = makeLoop({ id, family, own });
  function newSession(problem, { level = 1 } = {}) {
    const s = loop.newSession(problem, { level, forceMove: false });              // (no forced move: there is no guess at the first state)
    s.prevBoard = s.board;
    s.lights = boardLights(s.board, s.board);
    return s;
  }
  // Multiply on this card (the shared menu): Divide, Fraction and Flip everything once each side is one term; the whole number greyed.
  const MENU = makeMultiplyMenu({ xAlone, coefOf: coefOn, option: OPTION_LIVE, greyKey, probe: 'mult', negTop: true });
  const layered = withLights(MENU.withMenu(loop.reduce), {
    alone: xAlone,
    menuPreview: (s, kind) => OPTION_LIVE(kind, s) === 'live',
    distribute: true,
    xAdd: true,
    lights: (s, board) => boardLights(s.prevBoard ?? board, board),
    fold: loop.api.fold,
  });
  // The lights follow the board: x on one side, Solved for x and No parentheses; Fewer terms only for an Add or a combine (it goes off after
  // a distribute, a divide or a flip). A term picked up closes Multiply's options.
  function LAYER(s, action) {
    const pre = own?.layer?.(s, action);                                         // (the card's own, before the term layer: Build V)
    if (pre !== undefined) return pre;
    const out = layered((action.type === 'lxDrop' || action.type === 'lxDistribute') && s.mopts ? { ...s, mopts: null } : s, action);
    if (out === s || !out.board) return out;
    if (out.lx?.combine && out.feedback?.key === 'lxCombineWrong' && s.feedback?.key !== 'lxCombineWrong') sizesSlip(out);
    const moved = JSON.stringify(out.board) !== JSON.stringify(s.board);
    // x back on both sides: x = is greyed again, so what was typed in it goes (it could not be changed while greyed: Build T)
    if (moved && xBoth(out.board) && out.entry && !out.sub) { out.entry = ''; if (out.den !== undefined) out.den = ''; }
    const combined = Boolean(s.lx?.combine) && !out.lx?.combine && moved;
    const added = out.history.length > s.history.length && out.rows.at(-2)?.type === 'work' && Boolean(out.rows.at(-2)?.work);
    // (an Add, by the button or by dragging across the =, judged itself; a combine is one term fewer; Undo puts back what was; any other
    // move that changes the board is not judged for Fewer terms)
    const fewer = added ? out.lights.fewer : combined ? 'green' : action.type === 'undo' || action.type === 'startOver' || !moved ? out.lights?.fewer ?? 'off' : 'off';
    return { ...out, lights: boardLights(out.board, out.board, fewer) };
  }
  return { loop, newSession, MENU, LAYER };
}

const BOTH = makeBothCard({ id: 'variables-both-sides' });
export const newBothSides = BOTH.newSession;
export const reduceBothSides = BOTH.loop.reduce;
export const solve = BOTH.loop;
export const BOTH_MENU = BOTH.MENU;
export const BOTH_LAYER = BOTH.LAYER;
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
