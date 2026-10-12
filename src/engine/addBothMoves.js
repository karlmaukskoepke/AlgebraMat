// The moves behind Add to both sides (SPEC-ADD-TO-BOTH-SIDES.md, revision 2 "light build"), as one pure reducer. The
// equation is a board of terms (an x, and numbers). The BARE card has two paths: guess x (type it), or use a move: type an
// amount, press Go, and it is added to both sides in one action; the numbers on x's side cancel on their own and the other
// side is left as it is, so the value is never shown. The SCAFFOLD (the seesaw, the counters, the two-action move, the
// combining ritual) only comes in from I'm stuck or Teach me. The lights (Fewer terms, Solved for x) judge each committed
// move. A wrong guess offers "Put it back in"; a right one gets a click-through of the move. No DOM here.

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
// Terms counted as if the numbers on a side were combined (the screen never shows the combined value of the unsimplified side).
const sideTerms = (terms) => (terms.some((t) => t.kind === 'x') ? 1 : 0) + (sumNums(terms) !== 0 || !terms.some((t) => t.kind === 'x') ? 1 : 0);
export const effTerms = (board) => sideTerms(board.left) + sideTerms(board.right);

// Fewer terms: green when the terms went down, red when they went up or the number next to x got bigger, else grey.
// Solved for x: green once x is the only term on its side (the student still types the value).
export function judge(before, after) {
  const fewer = effTerms(after) < effTerms(before) ? 'green'
    : effTerms(after) > effTerms(before) || xSideConstant(after) > xSideConstant(before) ? 'red' : 'neutral';
  return { lights: { fewer, solved: xAlone(after) ? 'green' : 'off' } };
}

// ---------- the session ----------

const amountOf = (entry) => (/^-?\d+$/.test(entry) ? Number(entry) : null);

export function newAddBoth(problem, { level = 2 } = {}) {
  const board = startBoard(problem);
  return say({
    problem, level,
    stage: 'moves', step: 'moves',
    scaffold: false,                              // the seesaw, counters and two-action move: only from I'm stuck or Teach me
    built: { constant: 0, other: 0, x: false }, pick: null,
    board, base: board, history: [], resolving: false,
    menu: null, amountEntry: '', pending: null, typing: null, path: null,
    leftDelta: 0, rightDelta: 0,
    prevBoard: board, lights: { fewer: 'off', solved: 'off' }, reds: 0,
    counterMode: false, startOver: false, forced: false, hint: null, rung: 0,
    entry: '', early: null, walk: null, canPutBack: null, selected: null, combining: null, kindMisses: 0, countMisses: 0,
    skipped: [], wrongs: 0, tag: null, tags: [], stuck: 0, taught: 0, helped: false, clean: false,
    on: { ...emptySkills(), partyBattle: false, sign: false }, answers: [], supportsShown: [],
    finalText: null, lastAmount: null,
    feedback: null,
  }, 'aChoose');
}

// What every message may say about the problem itself: the number next to x, its opposite, the other side.
const plus = (v) => (v < 0 ? signed(v) : `+${v}`);
const problemParams = (p) => ({ con: plus(constantOf(p)), opp: plus(oppositeOf(p)), a: p.a, other: signed(p.b), battle: isBattle(p), mirror: Boolean(p.mirror), form: p.form });
const say = (s, key, params = {}, bad = false) => { s.feedback = { key, params: { ...problemParams(s.problem), ...params }, bad }; return s; };
const snapshot = (s) => ({ board: s.board, leftDelta: s.leftDelta, rightDelta: s.rightDelta, pending: s.pending, prevBoard: s.prevBoard, lights: s.lights, reds: s.reds, resolving: s.resolving, menu: s.menu, amountEntry: s.amountEntry, walk: s.walk, startOver: s.startOver, combining: null, selected: null });
const restore = (s, snap) => Object.assign(s, snap);
export const tilt = (s) => s.leftDelta - s.rightDelta;            // positive: the left side is heavier
export const balanced = (s) => tilt(s) === 0;

function startOverBoard(s) {
  Object.assign(s, { board: s.base, history: [], pending: null, leftDelta: 0, rightDelta: 0, prevBoard: s.base, resolving: false, menu: null, amountEntry: '', typing: null, startOver: false, reds: 0, walk: null, canPutBack: null, early: null, lights: { fewer: 'off', solved: 'off' }, hint: null, combining: null, selected: null });
  return say(s, 'aStartedOver');
}

// A move has been committed (and, in the scaffold, everything that can combine has): judge it and say how it went.
function resolve(s) {
  const { lights } = judge(s.prevBoard, s.board);
  s.lights = lights;
  s.prevBoard = s.board;
  s.resolving = false;
  s.reds = lights.fewer === 'red' ? s.reds + 1 : 0;
  if (s.walk?.step === 'go') {
    s.walk = { ...s.walk, step: 'match' };
    return say(s, 'aWalkMatch', { typed: signed(s.walk.typed) });
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
  s.early = null;
  return say(s, key, { answer: s.finalText });
}

// The scaffold comes in (and stays until the problem ends): the seesaw with the equation as counters, the tray, the
// two-action move, the combining ritual. At L2–L3, if no move has been made yet, the student builds the equation first.
function enterScaffold(s) {
  if (!s.scaffold) {
    s.scaffold = true;
    s.counterMode = true;
    s.walk = null;
    s.canPutBack = null;
    s.early = null;
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
  const rung = Math.min(s.rung + 1, 3);
  const fresh = rung !== s.rung;
  s.rung = rung;
  const names = ['', 'model', 'move', 'guided'];
  if (fresh && !s.supportsShown.includes(names[rung])) s.supportsShown.push(names[rung]);
  enterScaffold(s);
  if (s.stage === 'build') return say(s, 'aBuild');
  const constant = s.board[xSideOf(s.board)].find((t) => t.kind === 'num');
  const p = { constant: constant ? plus(constant.v) : '', opposite: plus(oppositeOf(s.problem)) };
  if (xAlone(s.board)) return say(s, 'aStuckSolved', p);
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
  const xTerms = [xTerm, ...(sum !== 0 ? [num(sum)] : [])];
  return { ...board, [xSide]: xTerms, [other]: [...board[other], num(amount)] };
}

export function reduceAddBoth(state, action) {
  if (state.stage === 'done') return state;
  const s = structuredClone(state);
  s.anim = null;

  // ----- typing: the amount (when the move is open) or the answer; a tap on a field says which -----
  if (isTyping(action)) {
    if (s.stage === 'build' || s.early) return state;
    if (s.combining && s.combining.step !== 'count') return state;
    if (s.combining) {
      const entry = typeInto(s.combining.entry, action, 'integer');
      if (entry === s.combining.entry) return state;
      s.combining = { ...s.combining, entry };
      return s;
    }
    const amountMode = s.menu === 'add' && s.typing !== 'answer' && (!s.pending || s.pending.second);
    const key = amountMode ? 'amountEntry' : 'entry';
    const entry = typeInto(s[key], action, 'integer');
    if (entry === s[key]) return state;
    s[key] = entry;
    return s;
  }

  // While two groups are being combined, only that is going on (and help, Undo, and giving it up).
  if (s.combining && !['kind', 'crossOff', 'abandon', 'check', 'stuck', 'teach', 'undo'].includes(action.type)) return state;

  switch (action.type) {
    // ----- the choice at the start: guess x, or use a move -----
    case 'path': {
      if (s.stage !== 'moves' || s.walk) return state;
      s.path = action.value === 'move' ? 'move' : 'guess';
      if (s.path === 'guess') { s.typing = 'answer'; return say(s, 'aGuessPrompt'); }
      s.typing = null;
      return say(s, 'aMovePrompt');
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
      if (s.stage !== 'moves' || s.resolving || (s.pending && !s.pending.second) || s.early || s.combining || s.walk || !Number.isInteger(action.value)) return state;
      s.menu = 'add';
      s.typing = null;
      s.amountEntry = String(action.value);
      return say(s, 'aAmountSet', { amount: signed(action.value) });
    }

    // ----- the menu: only "Add ___ to both sides" is a move on this card -----
    case 'choose': {
      if (s.stage !== 'moves' || s.pending || s.early) return state;
      if (action.move !== 'add') return state;
      if (s.resolving) return say(s, 'aSimplifyFirst', {}, true);
      s.menu = 'add';
      s.typing = null;
      if (s.walk?.step === 'move') {
        s.walk = { ...s.walk, step: 'go' };
        s.amountEntry = String(oppositeOf(s.problem));
        return say(s, 'aWalkAmount', { opposite: plus(oppositeOf(s.problem)) });
      }
      s.path = 'move';
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
        if (unresolved(s.board)) { s.resolving = true; return say(s, 'aCombineGroups'); }
        return resolve(s);
      }
      // the bare move: the amount goes onto both sides in one action
      if (s.stage !== 'moves' || s.menu !== 'add' || s.early) return state;
      const amount = amountOf(s.amountEntry);
      if (amount === null || amount === 0) return say(s, 'aAmountZero', {}, true);
      if (Math.abs(amount) > 15) return say(s, 'aAmountBig', {}, true);
      if ((s.forced || s.walk) && amount !== oppositeOf(s.problem)) return say(s, 'aForced', { amount: signed(oppositeOf(s.problem)) }, true);
      s.history.push(snapshot(s));
      s.board = lightBoard(s.board, amount);
      s.lastAmount = amount;
      s.menu = null;
      s.typing = null;
      s.amountEntry = '';
      s.hint = null;
      s.canPutBack = null;
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
    case 'kind': {
      if (s.combining?.step !== 'kind') return state;
      const { a, b } = combineTerms2(s);
      const right = kindOf(a.v, b.v);
      if (action.value !== right) {
        s.kindMisses += 1;
        return say(s, 'aKindWrong', { ...combineParams(s), picked: action.value }, true);
      }
      s.combining = { ...s.combining, step: 'count', kind: right };
      return say(s, 'aHowMany', combineParams(s));
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
      if (!s.history.length) return state;
      const wasBad = ['red', 'neutral'].includes(s.lights.fewer) && s.history.length > 0;
      restore(s, s.history.pop());
      s.selected = null;
      s.canPutBack = null;
      return say(s, wasBad ? 'aUndoneTip' : 'aUndone');
    }
    case 'startOver':
      return startOverBoard(s);

    // ----- I'm stuck / Teach me: the scaffold comes in -----
    case 'stuck': {
      if (s.stage === 'build' && s.scaffold) return state;
      s.stuck += 1;
      return climb(s);
    }
    case 'teach': {
      if (s.stage === 'build' && s.scaffold) return state;
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

    // ----- after a wrong guess: put it back in (the student's choice) -----
    case 'putBack': {
      if (!s.canPutBack || s.early) return state;
      const { typed, tag } = s.canPutBack;
      s.early = { typed, correct: false, tag, step: 'drag', lines: checkLines(s.problem, typed), shown: 0 };
      s.canPutBack = null;
      return say(s, 'aEarlyDrag', { typed: signed(typed), tag });
    }
    case 'dropValue': {
      if (s.early?.step !== 'drag') return state;
      s.early = { ...s.early, step: 'check', lines: checkLines(s.problem, s.early.typed), shown: 0 };
      return say(s, 'aCheckStart', { typed: signed(s.early.typed) });
    }
    case 'nextLine': {
      if (s.early?.step !== 'check') return state;
      const shown = s.early.shown + 1;
      if (shown < s.early.lines.length) { s.early = { ...s.early, shown }; return s; }
      const early = s.early;
      s.early = null;
      return say(s, 'aCheckFailed', { typed: signed(early.typed), tag: early.tag, value: signed(early.typed + constantOf(s.problem)) }, true);
    }
    // ----- after a right guess: the last tap of the click-through shows the value matching the other side -----
    case 'matchGuess': {
      if (s.walk?.step !== 'match') return state;
      return finish(s, 'aCorrect');
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

// What the early answer's drag-check shows: the order of operations for the x side with the typed value in.
export function checkLines(p, typed) {
  const sign = p.form === 'x-a' ? '−' : '+';
  const inner = `(${signed(typed)}) ${sign} ${p.a}`;
  const value = typed + constantOf(p);
  return [`${inner}`, `${signed(typed)} ${sign} ${p.a} = ${signed(value)}`, `${signed(value)} ${value === p.b ? '=' : '≠'} ${signed(p.b)}   ${value === p.b ? 'Balanced ✓' : 'Unbalanced ✗'}`];
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

function check(s, applyCombine) {
  if (s.combining) return s.combining.step === 'count' ? checkCount(s, applyCombine) : say(s, 'aPickKind', {}, true);
  const { correct, tag, typed, unreadable } = checkAddBoth(s.problem, s.entry);
  if (unreadable) return say(s, s.entry === '' || s.entry === '-' ? 'typeAnswer' : 'answerUnreadable', {}, true);
  if (s.stage === 'build' || s.pending) return say(s, 'aFinishMoveFirst', {}, true);
  if (s.walk) return say(s, 'aWalkFirst', {}, true);
  if (correct) {
    // x is already alone (or the scaffold is on): that's it. A right guess before that gets the click-through of the move.
    if (xAlone(s.board) || s.scaffold) return finish(s, 'aCorrect');
    s.walk = { step: 'move', typed };
    s.entry = '';
    s.path = 'move';
    return say(s, 'aCorrectWalk');
  }
  s.wrongs += 1; s.tag = tag; s.tags.push(tag); s.answers.push({ typed: s.entry, tag }); s.entry = '';
  s.canPutBack = { typed, tag };
  return say(s, 'aWrong', { typed: signed(typed), tag, value: signed(typed + constantOf(s.problem)) }, true);
}

export { formatAddBoth, tagAddBoth };
