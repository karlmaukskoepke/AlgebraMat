// The moves behind Add to both sides (SPEC-ADD-TO-BOTH-SIDES.md, revision 2.3 "light build"), as one pure reducer. The
// equation is a board of terms (an x, and numbers). The BARE card has two paths: guess x (type it), or use a move: type an
// amount, press Go, and it is added to both sides in one action; the numbers on x's side cancel on their own and the other
// side is left as it is, so the value is never shown. The SCAFFOLD (the seesaw, the counters, the two-action move, the
// combining ritual) only comes in from I'm stuck or Teach me. The lights (Fewer terms, Solved for x) judge each committed
// move. Every typed value (a guess, or the value once x is alone) is plugged back in, a line a click, ending Balanced or Not
// balanced; a correct guess makes the next problem a move. The path (guess or move) is chosen at the start and fixed. No DOM here.

import { typeInto, isTyping } from './entry.js';
import { emptySkills } from './skills.js';
import {
  constantOf, oppositeOf, checkAddBoth, tagAddBoth, formatAddBoth, answerText, signed, isBattle,
} from './addBoth.js';


// ---------- the board ----------

let counter = 0;
const nextId = () => `t${++counter}`;
const x = () => ({ id: nextId(), kind: 'x' });
const num = (v) => ({ id: nextId(), kind: 'num', v });

export function startBoard(p) {
  const xSide = [x(), num(constantOf(p))];
  const other = [num(p.b)];
  return p.mirror ? { left: other, right: xSide } : { left: xSide, right: other };
}

const sideOf = (board, id) => (board.left.some((t) => t.id === id) ? 'left' : board.right.some((t) => t.id === id) ? 'right' : null);
const find = (board, id) => [...board.left, ...board.right].find((t) => t.id === id);
export const xSideOf = (board) => (board.left.some((t) => t.kind === 'x') ? 'left' : 'right');
export const countTerms = (board) => board.left.length + board.right.length;
const sumNums = (terms) => terms.filter((t) => t.kind === 'num').reduce((s, t) => s + t.v, 0);
// A side as written in the notes: "x + 3", "−6 + −3" (a negative number after a plus).
export const sideValueText = (terms) => terms.map((t) => (t.kind === 'x' ? 'x' : signed(t.v))).join(' + ');
export const boardText = (board) => `${sideValueText(board.left)} = ${sideValueText(board.right)}`;

// Groups that can be combined: any two numbers on the same side. Same signs make a Party, opposite signs a Battle.
export function combinable(board) {
  const out = [];
  for (const side of ['left', 'right']) {
    const nums = board[side].filter((t) => t.kind === 'num');
    for (let i = 0; i < nums.length; i++) for (let j = i + 1; j < nums.length; j++) out.push({ side, a: nums[i].id, b: nums[j].id });
  }
  return out;
}
export const unresolved = (board) => combinable(board).length > 0;
export const kindOf = (a, b) => (Math.sign(a) === Math.sign(b) ? 'party' : 'battle');

// A side with nothing left on it says 0 (a side is never empty).
const keepZero = (terms) => (terms.length ? terms : [{ id: nextId(), kind: 'num', v: 0 }]);

// Combine two numbers on one side into their sum (a Battle leaves what is left of the bigger; equal ones leave nothing).
function combineTerms(board, aId, bId) {
  const a = find(board, aId);
  const b = find(board, bId);
  const side = sideOf(board, aId);
  if (!a || !b || a.kind !== 'num' || b.kind !== 'num' || side !== sideOf(board, bId) || a.id === b.id) return null;
  const total = a.v + b.v;
  const terms = [];
  for (const t of board[side]) {
    if (t.id === a.id) { if (total !== 0) terms.push({ id: nextId(), kind: 'num', v: total }); } else if (t.id !== b.id) terms.push(t);
  }
  return { ...board, [side]: keepZero(terms) };
}

// Is x alone on its side (and so, once the other side is one number, solved)? What does the board say x is?
export const xAlone = (board) => board[xSideOf(board)].length === 1;
export function boardAnswer(board) {
  if (!xAlone(board)) return null;
  const other = board[xSideOf(board) === 'left' ? 'right' : 'left'];
  return other.length === 1 && other[0].kind === 'num' ? other[0].v : null;
}

// ---------- the lights (§3E) ----------

const xSideConstant = (board) => Math.abs(sumNums(board[xSideOf(board)]));
// The terms on x's side, counted as if its numbers were combined (§3E: only x's side is judged, so zeroing the other side
// never lights up green and the unsimplified side is never read).
export const xTerms = (board) => 1 + (sumNums(board[xSideOf(board)]) !== 0 ? 1 : 0);

// Fewer terms: green when x's side has fewer terms, red when it has more or the number next to x got bigger, else grey.
// Solved for x: green once x is the only term on its side (the student still types the value).
export function judge(before, after) {
  const fewer = xTerms(after) < xTerms(before) ? 'green'
    : xTerms(after) > xTerms(before) || xSideConstant(after) > xSideConstant(before) ? 'red' : 'neutral';
  return { lights: { fewer, solved: xAlone(after) ? 'green' : 'off' } };
}

// ---------- the session ----------

const amountOf = (entry) => (/^-?\d+$/.test(entry) ? Number(entry) : null);

export function newAddBoth(problem, { level = 2, forceMove = false, introTrade = false } = {}) {
  const board = startBoard(problem);
  const s = {
    problem, level, tradeIntro: introTrade && level >= TRADE_LEVEL && Boolean(problem.mirror), tradeCount: 0,
    stage: 'moves', step: 'moves',
    scaffold: false,                              // the seesaw, counters and two-action move: only from I'm stuck or Teach me
    built: { constant: 0, other: 0, x: false }, pick: null,
    board, base: board, history: [], resolving: false,
    menu: null, amountEntry: '', pending: null, typing: null, path: forceMove ? 'move' : null, mustMove: forceMove,
    rows: [{ type: 'eq', board }], zeroOther: false,
    leftDelta: 0, rightDelta: 0,
    prevBoard: board, lights: { fewer: 'off', solved: 'off' }, reds: 0,
    counterMode: false, startOver: false, forced: false, hint: null, rung: 0,
    entry: '', hintGiven: false, helpCombine: false, sub: null, work: null, undoCue: false, selected: null, combining: null, kindMisses: 0, countMisses: 0,
    skipped: [], wrongs: 0, tag: null, tags: [], stuck: 0, taught: 0, helped: false, clean: false,
    on: { ...emptySkills(), partyBattle: false, sign: false }, answers: [], supportsShown: [],
    finalText: null, lastAmount: null,
    feedback: null,
  };
  return say(s, forceMove ? (tradePending(s) ? 'aTradeIntro' : 'aMustMove') : 'aChoose');
}

// Trade places (swap the two sides) is offered from Level 5, where x can be on the right. The first time it matters it is
// pointed out and the student has to click it (SPEC-ADD-TO-BOTH-SIDES.md §3A "later cards"; Karl, 2026-10-12).
export const TRADE_LEVEL = 5;
export const tradeAvailable = (s) => s.level >= TRADE_LEVEL && !s.scaffold && s.path === 'move' && s.stage === 'moves' && !s.sub && !s.pending && !s.combining
  && !s.resolving && xSideOf(s.board) === 'right';
// The first time, Add waits until the sides have been traded.
export const tradePending = (s) => Boolean(s.tradeIntro) && s.tradeCount === 0 && tradeAvailable(s);

// A correct guess owes one problem solved with a move (the next one is forced).
export const owesMove = (s) => s.path === 'guess' && s.stage === 'done';

// What every message may say about the problem itself: the number next to x, its opposite, the other side.
const plus = (v) => (v < 0 ? signed(v) : `+${v}`);
const problemParams = (p) => ({ con: plus(constantOf(p)), opp: plus(oppositeOf(p)), a: p.a, other: signed(p.b), battle: isBattle(p), mirror: Boolean(p.mirror), form: p.form });
const say = (s, key, params = {}, bad = false) => { s.feedback = { key, params: { ...problemParams(s.problem), ...params }, bad }; return s; };
const snapshot = (s) => ({ board: s.board, rows: [...s.rows], leftDelta: s.leftDelta, rightDelta: s.rightDelta, pending: s.pending, prevBoard: s.prevBoard, lights: s.lights, reds: s.reds, resolving: s.resolving, menu: s.menu, amountEntry: s.amountEntry, work: s.work, undoCue: s.undoCue, startOver: s.startOver, combining: null, selected: null });
const restore = (s, snap) => Object.assign(s, snap);
export const tilt = (s) => s.leftDelta - s.rightDelta;            // positive: the left side is heavier
export const balanced = (s) => tilt(s) === 0;

function startOverBoard(s) {
  Object.assign(s, { board: s.base, rows: [{ type: 'eq', board: s.base }], history: [], pending: null, leftDelta: 0, rightDelta: 0, prevBoard: s.base, resolving: false, menu: null, amountEntry: '', typing: null, startOver: false, reds: 0, sub: null, entry: '', zeroOther: false, work: null, undoCue: false, lights: { fewer: 'off', solved: 'off' }, hint: null, combining: null, selected: null });
  s.path = s.mustMove || s.scaffold ? 'move' : null;                       // Start over returns to the choice (§9)
  return say(s, s.path ? 'aStartedOver' : 'aChoose');
}

// A move has been committed (and, in the scaffold, everything that can combine has): judge it and say how it went.
function resolve(s) {
  const { lights } = judge(s.prevBoard, s.board);
  s.lights = lights;
  s.prevBoard = s.board;
  s.resolving = false;
  s.reds = lights.fewer === 'red' || s.zeroOther ? s.reds + 1 : 0;
  s.undoCue = lights.fewer === 'red' || lights.fewer === 'neutral' || s.zeroOther;       // the next click to point at is Undo
  if (s.zeroOther) {                                                       // the side without x went to 0 (§3B step 8)
    if (s.reds >= 3) s.startOver = true;
    return say(s, 'aZeroOther', {}, true);
  }
  if (lights.fewer === 'red') {
    if (s.reds >= 3) s.startOver = true;
    return say(s, s.reds >= 3 ? 'aRed3' : 'aRed', { amount: signed(s.lastAmount) }, true);
  }
  if (lights.solved === 'green') return say(s, 'aSolvedBoard');
  if (lights.fewer === 'neutral') return say(s, 'aPartial', { amount: signed(s.lastAmount) });
  return say(s, 'aGreen');
}

function finish(s, key) {
  s.stage = 'done';
  s.step = 'done';
  s.clean = s.wrongs === 0 && s.stuck === 0 && s.taught === 0 && !s.helped;
  s.finalText = answerText(s.problem);
  return say(s, key, { answer: s.finalText });
}

// The scaffold comes in (and stays until the problem ends): the seesaw with the equation as counters, the tray, the
// two-action move, the combining ritual. At L2–L3, if no move has been made yet, the student builds the equation first.
function enterScaffold(s) {
  if (!s.scaffold) {
    s.scaffold = true;
    s.counterMode = true;
    s.sub = null;
    s.entry = '';
    s.typing = null;
    if (s.level <= 3 && s.history.length === 0) {
      s.stage = 'build';
      s.step = 'build';
      s.built = { constant: 0, other: 0, x: false };
      s.pick = null;
    }
  }
  return s;
}

// What a stuck click does at each rung (§4): 1 model it, 2 choose the move, 3 the guided amount.
function climb(s) {
  s.helped = true;
  // The first ask on the bare screen is a reminder of the move's logic, not a model: the number next to x is outlined and the
  // question is what to add to both sides to eliminate it. Only a second ask brings in the scaffold (rung 1 below).
  if (!s.scaffold && !s.hintGiven) {
    s.hintGiven = true;
    if (!s.supportsShown.includes('hint')) s.supportsShown.push('hint');
    const con = s.board[xSideOf(s.board)].find((t) => t.kind === 'num');
    if (xAlone(s.board)) return say(s, 'aStuckSolved');
    s.hint = con ? { kind: 'cancel', id: con.id } : null;
    s.menu = 'add';
    s.typing = null;
    s.amountEntry = '';
    return say(s, 'aStuckHint', { constant: con ? plus(con.v) : '' });
  }
  const rung = Math.min(s.rung + 1, 3);
  const fresh = rung !== s.rung;
  s.rung = rung;
  const names = ['', 'model', 'move', 'guided'];
  if (fresh && !s.supportsShown.includes(names[rung])) s.supportsShown.push(names[rung]);
  const wasScaffold = s.scaffold;
  enterScaffold(s);
  if (s.stage === 'build') return say(s, 'aBuild');
  const constant = s.board[xSideOf(s.board)].find((t) => t.kind === 'num');
  const p = { constant: constant ? plus(constant.v) : '', opposite: plus(oppositeOf(s.problem)) };
  if (xAlone(s.board)) {
    // x is alone but the other side still has numbers to put together: with the model up, the next ask walks them through it
    // (Party or Battle? then it combines for them) and asks for the answer one last time
    if (wasScaffold && !s.combining && combinable(s.board).length) { s.helpCombine = true; s.resolving = true; return startPair(s); }
    return say(s, 'aStuckSolved', p);
  }
  if (rung === 1) { s.hint = constant ? { kind: 'cancel', id: constant.id } : null; return say(s, 'aStuck1', p); }
  if (rung === 2) { s.menu = 'add'; return say(s, 'aStuck2', p); }
  s.menu = 'add';
  s.hint = { kind: 'amount', amount: oppositeOf(s.problem) };
  s.amountEntry = String(oppositeOf(s.problem));
  return say(s, 'aStuck3', p);
}

// The numbers on x's side cancel on their own; the other side just gets the amount added (left as separate terms).
function lightBoard(board, amount) {
  const xSide = xSideOf(board);
  const other = xSide === 'left' ? 'right' : 'left';
  const sum = sumNums(board[xSide]) + amount;
  const xTerm = board[xSide].find((t) => t.kind === 'x');
  const xTermsNow = [xTerm, ...(sum !== 0 ? [num(sum)] : [])];
  // the other side is left as it is, unless the amount cancels it to 0 (the zero-the-wrong-side slip shows the 0 they were after)
  const otherSum = sumNums(board[other]) + amount;
  return { ...board, [xSide]: xTermsNow, [other]: otherSum === 0 ? [num(0)] : [...board[other], num(amount)] };
}

export function reduceAddBoth(state, action) {
  if (state.stage === 'done') return state;
  const s = structuredClone(state);
  s.anim = null;

  // ----- typing: the amount (when the move is open) or the answer; a tap on a field says which -----
  if (isTyping(action)) {
    if (s.stage === 'build') return state;
    // while the substitution is stepped nothing can be typed; after a wrong value the first key clears it and the student retypes
    if (s.sub) { if (!(s.sub.kind === 'value' && s.sub.step >= 3 && !s.sub.ok)) return state; s.sub = null; }
    if (s.combining && s.combining.step !== 'count') return state;
    if (s.combining) {
      const entry = typeInto(s.combining.entry, action, 'integer');
      if (entry === s.combining.entry) return state;
      s.combining = { ...s.combining, entry };
      return s;
    }
    const amountMode = s.menu === 'add' && s.typing !== 'answer' && (!s.pending || s.pending.second);
    const key = amountMode ? 'amountEntry' : 'entry';
    // the answer row is greyed until the guess path is chosen, or (on the move path, scaffold included) until x is alone
    if (key === 'entry' && (!s.path || (s.path === 'move' && !xAlone(s.board)))) return state;
    const entry = typeInto(s[key], action, 'integer');
    if (entry === s[key]) return state;
    s[key] = entry;
    if (key === 'amountEntry' && !s.scaffold) s.hint = null;
    return s;
  }

  // While two groups are being combined, only that is going on (and help, Undo, and giving it up).
  if (s.combining && !['kind', 'crossOff', 'abandon', 'check', 'stuck', 'teach', 'undo'].includes(action.type)) return state;

  switch (action.type) {
    // ----- the choice at the start: guess x, or use a move -----
    case 'path': {
      if (s.stage !== 'moves' || s.path) return state;                                       // chosen once, fixed for the problem
      s.path = action.value === 'move' ? 'move' : 'guess';
      if (s.path === 'guess') { s.typing = 'answer'; return say(s, 'aGuessPrompt'); }
      s.typing = null;
      return say(s, tradePending(s) ? 'aTradeIntro' : 'aMovePrompt');
    }
    case 'focus': {
      if (action.target !== 'answer' && action.target !== 'amount') return state;
      s.typing = action.target;
      return s;
    }
    case 'greyMove':
      return say(s, 'aLater');

    // ----- the scaffold: build the equation from counters (a group at a time; a group is all one sign) -----
    case 'buildTap': {
      if (s.stage !== 'build') return state;
      return buildStep(s, buildChange(s, action.group === 'other' ? 'other' : 'constant', action.sign === '-' ? -1 : 1, Boolean(action.remove)));
    }
    // Build it's way: pick a piece (□, + or −) and tap a side, or drag it up onto that side. The x box goes on x's side;
    // counters go on a side as one group (a side's counters are all one sign).
    case 'pickPiece': {
      if (s.stage !== 'build' || !['x', '+', '-'].includes(action.piece)) return state;
      s.pick = s.pick === action.piece ? null : action.piece;
      return s;
    }
    case 'buildRemove': {
      if (s.stage !== 'build') return state;
      const side = action.side === 'right' ? 'right' : 'left';
      if (action.what === 'x') { if (!s.built.x) return state; s.built.x = false; return buildStep(s, null); }
      return buildStep(s, buildChange(s, side === xSideName(s) ? 'constant' : 'other', 1, true));
    }
    case 'zone':
    case 'drop': {
      const piece = action.type === 'zone' ? s.pick : action.piece;
      const side = action.side === 'right' ? 'right' : 'left';
      if (s.stage === 'build') {
        if (!['x', '+', '-'].includes(piece)) return say(s, 'aPickFirst', {}, true);
        if (piece === 'x') {
          if (side !== xSideName(s)) return say(s, 'aBuildXSide', { xside: xSideName(s) }, true);
          if (s.built.x) return say(s, 'aBuildXHave', {}, true);
          s.built.x = true;
          return buildStep(s, null);
        }
        return buildStep(s, buildChange(s, side === xSideName(s) ? 'constant' : 'other', piece === '-' ? -1 : 1, false));
      }
      if (s.stage === 'moves' && s.scaffold) {
        if (s.menu !== 'add') return say(s, 'aChooseMoveFirst', {}, true);
        return reduceAddBoth(state, { type: 'addTo', side, chip: action.type === 'drop' ? piece : undefined });
      }
      return state;
    }
    // A number dragged up into the blank of "Add ___ to both sides" fills it (the student still decides its sign).
    case 'setAmount': {
      if (s.stage !== 'moves' || s.path !== 'move' || s.resolving || (s.pending && !s.pending.second) || s.sub || s.combining || !Number.isInteger(action.value)) return state;
      s.menu = 'add';
      s.typing = null;
      s.amountEntry = String(action.value);
      return say(s, 'aAmountSet', { amount: signed(action.value) });
    }

    // ----- the menu: only "Add ___ to both sides" is a move on this card -----
    case 'choose': {
      if (s.stage !== 'moves' || s.pending || s.sub) return state;
      if (action.move !== 'add' && action.move !== 'trade') return state;
      if (!s.path) return say(s, 'aChooseFirst', {}, true);                                  // the path comes first
      if (s.path === 'guess') return say(s, 'aGuessing');
      if (s.resolving) return say(s, 'aSimplifyFirst', {}, true);
      if (action.move === 'trade') {
        if (!tradeAvailable(s)) return say(s, 'aTradeNot');
        s.history.push(snapshot(s));
        s.board = { left: s.board.right, right: s.board.left };                              // the same equation, the sides swapped
        s.rows.push({ type: 'eq', board: s.board });
        s.prevBoard = s.board;
        s.tradeCount += 1;
        s.menu = null;
        s.hint = null;
        s.amountEntry = '';
        s.undoCue = false;
        return say(s, 'aTraded');
      }
      if (tradePending(s)) return say(s, 'aTradeFirst', {}, true);
      s.menu = 'add';
      s.typing = null;
      s.undoCue = false;
      return say(s, 'aPickAmount');
    }

    // ----- the scaffold's two-action move: add an amount to one side, then to the other (either order) -----
    case 'addTo': {
      if (s.stage !== 'moves' || s.menu !== 'add' || !s.scaffold) return state;
      if (s.resolving) return say(s, 'aSimplifyFirst', {}, true);
      const side = action.side === 'right' ? 'right' : 'left';
      const amount = action.amount ?? amountOf(s.amountEntry);
      if (amount === null || amount === 0) return say(s, 'aAmountZero', {}, true);
      if (action.chip && (action.chip === '-') !== (amount < 0)) return say(s, 'aChipSign', { amount: signed(amount), chip: action.chip === '-' ? 'minus' : 'plus' }, true);
      if (Math.abs(amount) > 15) return say(s, 'aAmountBig', {}, true);
      if (s.forced && amount !== oppositeOf(s.problem)) return say(s, 'aForced', { amount: signed(oppositeOf(s.problem)) }, true);
      if (s.pending && s.pending.side === side) return say(s, 'aOtherSide', {}, true);
      const snap = snapshot(s);
      const term = num(amount);
      s.board = { ...s.board, [side]: [...s.board[side], term] };
      if (side === 'left') s.leftDelta += amount; else s.rightDelta += amount;
      if (!s.pending) {
        s.history.push(snap);
        s.pending = { side, amount, ids: [term.id], second: false };
        s.pending.second = true;
        s.amountEntry = String(amount);          // pre-filled for the other side
        return say(s, 'aAddedOne', { amount: signed(amount), side, tilt: Math.abs(tilt(s)), heavier: tilt(s) > 0 ? 'left' : 'right' });
      }
      s.pending = { ...s.pending, ids: [...s.pending.ids, term.id], both: true, otherAmount: amount };
      return balanced(s)
        ? say(s, 'aBalanced', { amount: signed(amount) })
        : say(s, 'aUnbalanced', { tilt: Math.abs(tilt(s)), heavier: tilt(s) > 0 ? 'left' : 'right' }, true);
    }

    // ----- Go -----
    case 'go': {
      if (s.scaffold) {
        // the two-action move: commit it when both sides got the same amount
        if (!s.pending?.both || !balanced(s)) return say(s, 'aGoNotYet', {}, true);
        s.lastAmount = s.pending.amount;
        s.pending = null;
        s.amountEntry = '';
        s.menu = null;
        s.hint = null;
        if (unresolved(s.board)) { s.resolving = true; return startPair(s); }
        return resolve(s);
      }
      // the bare move: the amount goes onto both sides in one action
      if (s.stage !== 'moves' || s.menu !== 'add' || s.sub) return state;
      const amount = amountOf(s.amountEntry);
      if (amount === null || amount === 0) return say(s, 'aAmountZero', {}, true);
      if (Math.abs(amount) > 15) return say(s, 'aAmountBig', {}, true);
      if (s.forced && amount !== oppositeOf(s.problem)) return say(s, 'aForced', { amount: signed(oppositeOf(s.problem)) }, true);
      s.history.push(snapshot(s));
      s.work = workLine(s.board, amount);
      const after = lightBoard(s.board, amount);
      s.zeroOther = !xAlone(after) && sumNums(s.board[xSideOf(s.board) === 'left' ? 'right' : 'left']) + amount === 0;
      s.board = after;
      s.rows.push({ type: 'work', work: s.work }, { type: 'eq', board: after });
      s.lastAmount = amount;
      s.menu = null;
      s.typing = null;
      s.amountEntry = '';
      s.hint = null;
      s.undoCue = false;
      return resolve(s);
    }

    // ----- combine two groups: tap one, then the other; Party or Battle? how many are left? (then they combine) -----
    case 'select': {
      if (s.stage !== 'moves' || !s.scaffold || s.pending || s.combining) return state;
      const t = find(s.board, action.id);
      if (!t || t.kind !== 'num') return say(s, 'aOnlyNumbers', {}, true);
      if (!s.selected) { s.selected = t.id; return s; }
      const first = s.selected;
      s.selected = null;
      if (first === t.id) return s;
      if (sideOf(s.board, first) !== sideOf(s.board, t.id)) return say(s, 'aSameSide', {}, true);
      s.combining = { a: first, b: t.id, step: 'kind', crossed: false, entry: '' };
      return say(s, 'aPartyOrBattle', combineParams(s));
    }
    // Party or Battle? A right answer combines the two highlighted groups for the student (no count to type) and moves to the next pair.
    case 'kind': {
      if (s.combining?.step !== 'kind') return state;
      const { a, b } = combineTerms2(s);
      const right = kindOf(a.v, b.v);
      if (action.value !== right) {
        s.kindMisses += 1;
        return say(s, 'aKindWrong', { ...combineParams(s), picked: action.value }, true);
      }
      const params = combineParams(s);
      s.history.push(snapshot(s));
      s.board = combineTerms(s.board, a.id, b.id);
      s.combining = null;
      s.combinedNote = { kind: right, g1: params.g1, g2: params.g2, total: params.total };
      return startPair(s);
    }
    case 'crossOff': {
      if (s.combining?.step !== 'count' || s.combining.crossed) return state;
      s.combining = { ...s.combining, crossed: true };
      s.helped = true;
      if (!s.supportsShown.includes('crossoff')) s.supportsShown.push('crossoff');
      return say(s, 'aCrossedOff', combineParams(s));
    }
    case 'abandon': {
      if (!s.combining) return state;
      s.combining = null;
      return say(s, 'aAbandoned');
    }

    // ----- undo (always one tap; a half-done move goes in one go) and start over -----
    case 'undo': {
      // after a wrong guess, once the substitution has been shown: take the guess back and go to the move
      if (s.sub) {
        if (s.sub.kind !== 'guess' || s.sub.ok || s.sub.step < 3) return state;
        s.sub = null;
        s.entry = '';
        s.path = 'move';
        s.typing = null;
        return say(s, 'aSimplerFirst');
      }
      if (!s.history.length) return state;
      const wasZero = s.zeroOther;
      restore(s, s.history.pop());
      s.zeroOther = false;
      s.helpCombine = false;
      s.selected = null;
      s.undoCue = false;
      s.hint = null;
      if (!s.scaffold) {
        s.menu = 'add';                                                      // the move stays chosen; the blank is cleared, not pre-filled
        s.amountEntry = '';
      }
      if (wasZero && !s.scaffold) {
        const con = s.board[xSideOf(s.board)].find((t) => t.kind === 'num');
        s.hint = con ? { kind: 'cancel', id: con.id } : null;               // the number next to x is highlighted
        return say(s, 'aZeroUndone');
      }
      return say(s, 'aUndone');
    }
    case 'startOver':
      return startOverBoard(s);

    // ----- I'm stuck / Teach me: the scaffold comes in -----
    case 'stuck': {
      if (s.stage === 'build' && s.scaffold) return state;
      if (!helpOk(s)) return state;
      moveMode(s);
      s.stuck += 1;
      return climb(s);
    }
    case 'teach': {
      if (s.stage === 'build' && s.scaffold) return state;
      if (!helpOk(s)) return state;
      moveMode(s);
      s.taught += 1;
      s.forced = true;
      s.helped = true;
      enterScaffold(s);
      if (!s.supportsShown.includes('forced')) s.supportsShown.push('forced');
      const params = { opposite: plus(oppositeOf(s.problem)), constant: plus(constantOf(s.problem)) };
      if (s.stage === 'build') return say(s, 'aBuild');
      s.menu = 'add';
      s.rung = 3;
      s.hint = { kind: 'amount', amount: oppositeOf(s.problem) };
      s.amountEntry = String(oppositeOf(s.problem));
      return say(s, 'aTeach', params);
    }

    // ----- the typed answer (a guess, or the value once x is alone) -----
    case 'check':
      return check(s, applyCombine);

    // ----- the substitution, a line a click (Next): the first line, the second, then Balanced or Not balanced -----
    case 'nextLine': {
      if (!s.sub || s.sub.step >= 3) return state;
      s.sub = { ...s.sub, step: s.sub.step + 1 };
      if (s.sub.step < 3) return s;
      const { kind, ok, typed, tag } = s.sub;
      if (ok) return finish(s, 'aCorrect');
      if (kind === 'guess') return say(s, 'aUndoGuess', { typed: signed(typed) });
      s.entry = '';                                                          // a wrong value: the row clears so the student retypes
      return say(s, 'aWrong', { typed: signed(typed), tag, value: signed(typed + constantOf(s.problem)) }, true);
    }
    default:
      return state;
  }

  function applyCombine(st, next) {
    st.history.push(snapshot(st));
    st.board = next;
    st.combining = null;
    if (unresolved(st.board)) return say(st, 'aCombined');
    return resolve(st);
  }
}

const xSideName = (s) => (s.problem.mirror ? 'right' : 'left');

// Change a group of counters while building: returns a message to say (a mistake), or null when it worked.
function buildChange(s, group, sign, remove) {
  const cur = s.built[group];
  if (remove) { if (cur === 0) return 'none'; s.built[group] = cur - Math.sign(cur); return null; }
  if (cur !== 0 && Math.sign(cur) !== sign) return say(s, 'aBuildOneSign', { group }, true);
  if (Math.abs(cur) >= 15) return 'none';
  s.built[group] = cur + sign;
  return null;
}

// After a build change: finished (the box and both groups match the equation) or keep going.
function buildStep(s, problem) {
  if (problem === 'none') return s;
  if (problem) return problem;
  const p = s.problem;
  if (s.built.x && s.built.constant === constantOf(p) && s.built.other === p.b) {
    s.stage = 'moves';
    s.step = 'moves';
    s.pick = null;
    if (s.forced) { s.menu = 'add'; s.rung = 3; s.hint = { kind: 'amount', amount: oppositeOf(p) }; s.amountEntry = String(oppositeOf(p)); }
    return say(s, 'aBuilt');
  }
  return say(s, 'aBuilding', { have: s.built.constant, other: s.built.other });
}

const combineTerms2 = (s) => ({ a: find(s.board, s.combining.a), b: find(s.board, s.combining.b) });
// What the messages need about the two groups being combined.
function combineParams(s) {
  const { a, b } = combineTerms2(s);
  const total = a.v + b.v;
  return { g1: signed(a.v), g2: signed(b.v), kind: kindOf(a.v, b.v), total: signed(total) };
}

// The next two numbers on a side that can combine (the left side first) are highlighted and the student is asked: Party or Battle?
function startPair(s) {
  const pair = combinable(s.board)[0];
  if (!pair) {
    s.combining = null;
    if (s.helpCombine) { s.helpCombine = false; s.resolving = false; return say(s, 'aSolvedBoard'); }   // help only: no judging
    return resolve(s);
  }
  s.combining = { a: pair.a, b: pair.b, step: 'kind', crossed: false, entry: '' };
  return say(s, 'aPartyOrBattle', { ...combineParams(s), before: s.combinedNote ? `${s.combinedNote.kind === 'party' ? 'Party' : 'Battle'}! ${s.combinedNote.g1} and ${s.combinedNote.g2} make ${s.combinedNote.total}.` : '' });
}

// The substitution of a typed value, as written in the equation (the value in place of x), then what it comes to.
// Two lines, then the mark (✓ Balanced / ✗ Not balanced) on its own line.
export function substitutionSteps(p, typed) {
  const op = p.form === 'x-a' ? '−' : '+';
  const inner = `${plugValue(typed)} ${op} ${p.a}`;
  const value = typed + constantOf(p);
  const first = p.mirror ? `${signed(p.b)} = ${inner}` : `${inner} = ${signed(p.b)}`;
  const second = p.mirror ? `${signed(p.b)} = ${signed(value)}` : `${signed(value)} = ${signed(p.b)}`;
  return [first, second];
}
// A negative value goes in parentheses when it replaces x, so it is seen how it would be re-entered.
export const plugValue = (typed) => (typed < 0 ? `(${signed(typed)})` : `${typed}`);
// The first line in pieces, the value (in blue on screen) apart from the rest.
export function substitutionParts(p, typed) {
  const op = p.form === 'x-a' ? '−' : '+';
  const val = { text: plugValue(typed), blue: true };
  const rest = { text: ` ${op} ${p.a}` };
  return p.mirror ? [{ text: `${signed(p.b)} = ` }, val, rest] : [val, rest, { text: ` = ${signed(p.b)}` }];
}

// What a move looked like before x's side was simplified: both sides with the added amount (coloured), and the numbers on x's
// side that are about to combine (struck through, then dropped). Shown as a line above the new equation.
function workLine(board, amount) {
  const xSide = xSideOf(board);
  const otherZero = sumNums(board[xSide === 'left' ? 'right' : 'left']) + amount === 0;       // the other side cancels to 0 too
  const side = (terms, isX) => [...terms.map((t) => (t.kind === 'x' ? { x: true } : { v: t.v, struck: isX || otherZero })), { v: amount, added: true, struck: isX || otherZero }];
  return { left: side(board.left, xSide === 'left'), right: side(board.right, xSide === 'right'), amount };
}

// The count of a combination: how many are left after the two groups meet.
function checkCount(s, applyCombine) {
  const c = s.combining;
  const { a, b } = combineTerms2(s);
  const text = c.entry;
  if (!/^-?\d+$/.test(text)) return say(s, text === '' || text === '-' ? 'typeCount' : 'answerUnreadable', {}, true);
  const typed = Number(text);
  const total = a.v + b.v;
  if (typed === total) return applyCombine(s, combineTerms(s.board, c.a, c.b));
  s.countMisses += 1;
  const tag = c.kind === 'battle' && typed === Math.abs(a.v) + Math.abs(b.v) ? 'sizes-added' : typed === -total ? 'sign-flipped' : 'unmatched';
  s.combining = { ...c, entry: '' };
  return say(s, 'aCountWrong', { ...combineParams(s), tag, typed }, true);
}

// Help is offered unless a substitution is being stepped (a wrong one, once finished, may still ask).
export const helpOk = (s) => !s.sub || (s.sub.step >= 3 && !s.sub.ok);
// Is the x = [ ] row live (cursor, pad, Check)? Greyed before the path is chosen, on the move path until x is alone, while the
// move's amount is being typed, while a substitution is stepped, and when the problem is done. The scaffold ends with the pad.
export function answerLive(s) {
  if (s.stage === 'done' || s.stage === 'build') return false;
  if (s.combining) return s.combining.step === 'count';
  if (s.sub) return s.sub.kind === 'value' && s.sub.step >= 3 && !s.sub.ok;
  if (s.menu === 'add' && s.typing !== 'answer') return false;
  return s.path === 'guess' || (s.path === 'move' && xAlone(s.board) && !s.pending && !s.resolving);
}

// Asking for help from the guess path moves the problem to the move path (the scaffolds are about moves).
function moveMode(s) {
  s.sub = null;
  if (s.path !== 'move') { s.path = 'move'; s.entry = ''; s.typing = null; }
}

function check(s, applyCombine) {
  if (s.combining) return s.combining.step === 'count' ? checkCount(s, applyCombine) : say(s, 'aPickKind', {}, true);
  const { correct, tag, typed, unreadable } = checkAddBoth(s.problem, s.entry);
  if (unreadable) return say(s, s.entry === '' || s.entry === '-' ? 'typeAnswer' : 'answerUnreadable', {}, true);
  if (s.stage === 'build' || s.pending) return say(s, 'aFinishMoveFirst', {}, true);
  if (s.sub) return s;
  if (!correct) { s.wrongs += 1; s.tag = tag; s.tags.push(tag); s.answers.push({ typed: s.entry, tag }); }
  // every typed value is plugged back in, a line a click. A first guess (x not alone yet) slides onto x.
  const kind = xAlone(s.board) || s.scaffold ? 'value' : 'guess';
  s.sub = { kind, typed, ok: correct, tag, lines: substitutionSteps(s.problem, typed), parts: substitutionParts(s.problem, typed), step: 0 };
  return correct ? say(s, 'aPlugIn', { typed: signed(typed) }) : say(s, kind === 'guess' ? 'aGuessed' : 'aPlugIn', { typed: signed(typed) }, kind === 'guess');
}

export { formatAddBoth, tagAddBoth };
