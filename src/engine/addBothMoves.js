// The moves behind Add to both sides (SPEC-ADD-TO-BOTH-SIDES.md §3–§4), as one pure reducer. The equation is a board of
// terms (an x, and numbers); the student adds an amount to one side and then to the other (two actions), Goes when it
// balances, cancels the pairs that make, and the like numbers on a side combine by themselves. Then the lights judge the
// move. Trade places and Cross the border are moves of their own. I'm stuck climbs a ladder; Teach me is a forced path;
// a wrong committed move climbs its own ladder; typing the answer early opens the drag-check. No DOM here.

import { typeInto, isTyping } from './entry.js';
import { emptySkills } from './skills.js';
import {
  constantOf, oppositeOf, checkAddBoth, tagAddBoth, formatAddBoth, answerText, signed,
} from './addBoth.js';

export const MOVES_BY_LEVEL = (level) => ['add', ...(level >= 4 ? ['trade'] : []), ...(level >= 6 ? ['cross'] : [])];

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

// Pairs that can cancel: a + and a − number on the same side.
export function cancellable(board) {
  const out = [];
  for (const side of ['left', 'right']) {
    const nums = board[side].filter((t) => t.kind === 'num');
    for (const a of nums) for (const b of nums) if (a.v > 0 && b.v < 0) out.push({ side, a: a.id, b: b.id });
  }
  return out;
}

// Cancel a + and a − on one side: as many pairs as both have, and what is left of the bigger (a Battle) stays.
function cancelPair(board, aId, bId) {
  const a = find(board, aId);
  const b = find(board, bId);
  const side = sideOf(board, aId);
  if (!a || !b || a.kind !== 'num' || b.kind !== 'num' || side !== sideOf(board, bId) || a.id === b.id || Math.sign(a.v) === Math.sign(b.v)) return null;
  const rest = a.v + b.v;
  const terms = [];
  for (const t of board[side]) {
    if (t.id === a.id) { if (rest !== 0) terms.push({ id: nextId(), kind: 'num', v: rest }); } else if (t.id !== b.id) terms.push(t);
  }
  return { ...board, [side]: keepZero(terms) };
}

// A side with nothing left on it says 0 (a side is never empty).
const keepZero = (terms) => (terms.length ? terms : [{ id: nextId(), kind: 'num', v: 0 }]);

// Like numbers on a side combine into one (once there is nothing left to cancel, so every one has the same sign).
function combineLike(board) {
  const fix = (terms) => {
    const nums = terms.filter((t) => t.kind === 'num');
    if (nums.length <= 1) return terms;
    const total = sumNums(terms);
    const out = [];
    let placed = false;
    for (const t of terms) {
      if (t.kind !== 'num') out.push(t);
      else if (!placed) { placed = true; if (total !== 0) out.push({ id: nextId(), kind: 'num', v: total }); }
    }
    return keepZero(out);
  };
  return { left: fix(board.left), right: fix(board.right) };
}

// Is x alone on its side (and so, once the other side is one number, solved)? What does the board say x is?
export const xAlone = (board) => board[xSideOf(board)].length === 1;
export function boardAnswer(board) {
  if (!xAlone(board)) return null;
  const other = board[xSideOf(board) === 'left' ? 'right' : 'left'];
  return other.length === 1 && other[0].kind === 'num' ? other[0].v : null;
}

// ---------- the lights (§3F) ----------

const xSideConstant = (board) => Math.abs(sumNums(board[xSideOf(board)]));

// green / neutral / red for "Fewer terms"; "x alone" and "x on the left" are green or neutral and grey (off) until earned.
export function judge(before, after, { level, earnedFewer }) {
  const fewer = countTerms(after) < countTerms(before) ? 'green'
    : countTerms(after) > countTerms(before) || xSideConstant(after) > xSideConstant(before) ? 'red' : 'neutral';
  const gotFewer = earnedFewer || fewer === 'green';
  const alone = gotFewer ? (xAlone(after) ? 'green' : 'neutral') : 'off';
  const left = level >= 4 && alone === 'green' ? (xSideOf(after) === 'left' ? 'green' : 'neutral') : 'off';
  return { lights: { fewer, xAlone: alone, xLeft: left }, earnedFewer: gotFewer };
}

// ---------- the session ----------

const amountOf = (entry) => (/^-?\d+$/.test(entry) ? Number(entry) : null);

export function newAddBoth(problem, { level = 1 } = {}) {
  const board = startBoard(problem);
  return {
    problem, level,
    stage: level <= 2 ? 'build' : 'moves',     // L1–L2: the student builds the equation from counters first
    built: { constant: 0, other: 0 },
    step: level <= 2 ? 'build' : 'moves',
    board, base: board, history: [], resolving: false,
    menu: null, amountEntry: '', pending: null,
    leftDelta: 0, rightDelta: 0,
    prevBoard: board, lights: { fewer: 'off', xAlone: 'off', xLeft: 'off' }, earnedFewer: false, reds: 0,
    counterMode: level <= 3, startOver: false, forced: false, hint: null, rung: 0,
    entry: '', early: null, selected: null,
    skipped: [], wrongs: 0, tag: null, tags: [], stuck: 0, taught: 0, helped: false, clean: false,
    on: { ...emptySkills(), partyBattle: false, sign: false }, answers: [], supportsShown: [],
    finalText: null, lastAmount: null,
    feedback: { key: level <= 2 ? 'aBuild' : 'aIntro' },
  };
}

const say = (s, key, params = {}, bad = false) => { s.feedback = { key, params, bad }; return s; };
const snapshot = (s) => ({ board: s.board, leftDelta: s.leftDelta, rightDelta: s.rightDelta, pending: s.pending, prevBoard: s.prevBoard, lights: s.lights, earnedFewer: s.earnedFewer, reds: s.reds, resolving: s.resolving, menu: s.menu, amountEntry: s.amountEntry });
const restore = (s, snap) => Object.assign(s, snap);
export const tilt = (s) => s.leftDelta - s.rightDelta;            // positive: the left side is heavier
export const balanced = (s) => tilt(s) === 0;

function startOverBoard(s) {
  Object.assign(s, { board: s.base, history: [], pending: null, leftDelta: 0, rightDelta: 0, prevBoard: s.base, resolving: false, menu: null, amountEntry: '', startOver: false, reds: 0 });
  return say(s, 'aStartedOver');
}

// A move has been committed and nothing is left to cancel: combine, judge, and say how it went.
function resolve(s) {
  s.board = combineLike(s.board);
  const { lights, earnedFewer } = judge(s.prevBoard, s.board, { level: s.level, earnedFewer: s.earnedFewer });
  s.lights = lights;
  s.earnedFewer = earnedFewer;
  s.prevBoard = s.board;
  s.resolving = false;
  s.reds = lights.fewer === 'red' ? s.reds + 1 : 0;
  if (s.early?.step === 'move' && s.lastAmount === oppositeOf(s.problem)) {
    // the first good move after a correct early answer finishes the problem
    return finish(s, 'aDoneEarly');
  }
  if (lights.fewer === 'red') {
    if (s.reds >= 2) s.counterMode = true;
    if (s.reds >= 3) s.startOver = true;
    return say(s, `aRed${Math.min(s.reds, 3)}`, { amount: s.lastAmount, nowAmount: signed(s.lastAmount) });
  }
  if (lights.fewer === 'neutral') return say(s, 'aNeutral', { amount: s.lastAmount });
  const answer = boardAnswer(s.board);
  return say(s, answer !== null ? 'aSolvedBoard' : 'aGreen', { answer });
}

function finish(s, key) {
  s.stage = 'done';
  s.step = 'done';
  s.clean = s.wrongs === 0 && s.stuck === 0 && s.taught === 0 && !s.helped;
  s.finalText = answerText(s.problem);
  s.early = null;
  return say(s, key, { answer: s.finalText });
}

// What a stuck click does at each rung (§4): 1 counter mode, 2 choose the move, 3 the guided move.
function climb(s) {
  s.helped = true;
  const rung = Math.min(s.rung + 1, 3);
  const fresh = rung !== s.rung;
  s.rung = rung;
  const names = ['', 'counters', 'move', 'guided'];
  if (fresh && !s.supportsShown.includes(names[rung])) s.supportsShown.push(names[rung]);
  const constant = s.board[xSideOf(s.board)].find((t) => t.kind === 'num');
  const p = { constant: constant ? signed(constant.v) : '', opposite: signed(oppositeOf(s.problem)) };
  if (boardAnswer(s.board) !== null) return say(s, 'aStuckSolved', p);
  if (rung === 1) { s.counterMode = true; s.hint = constant ? { kind: 'cancel', id: constant.id } : null; return say(s, 'aStuck1', p); }
  if (rung === 2) { s.menu = 'add'; return say(s, 'aStuck2', p); }
  s.menu = 'add';
  s.hint = { kind: 'amount', amount: oppositeOf(s.problem) };
  s.amountEntry = String(oppositeOf(s.problem));
  return say(s, 'aStuck3', p);
}

export function reduceAddBoth(state, action) {
  if (state.stage === 'done') return state;
  const s = structuredClone(state);
  const level = s.level;

  // ----- typing: the amount while the move menu is open and no add has started, otherwise the answer -----
  if (isTyping(action)) {
    if (s.stage === 'build' || (s.early && s.early.step !== 'move')) return state;
    const amountMode = s.menu === 'add' && (!s.pending || s.pending.second);
    const key = amountMode ? 'amountEntry' : 'entry';
    const entry = typeInto(s[key], action, 'integer');
    if (entry === s[key]) return state;
    s[key] = entry;
    return s;
  }

  switch (action.type) {
    // ----- L1–L2: build the equation from counters (a group at a time; a group is all one sign) -----
    case 'buildTap': {
      if (s.stage !== 'build') return state;
      const group = action.group === 'other' ? 'other' : 'constant';
      const target = group === 'other' ? s.problem.b : constantOf(s.problem);
      const cur = s.built[group];
      const sign = action.sign === '-' ? -1 : 1;
      if (action.remove) { if (cur === 0) return state; s.built[group] = cur - Math.sign(cur); } else {
        if (cur !== 0 && Math.sign(cur) !== sign) return say(s, 'aBuildOneSign', { group }, true);
        if (Math.abs(cur) >= 15) return state;
        s.built[group] = cur + sign;
      }
      if (s.built.constant === constantOf(s.problem) && s.built.other === s.problem.b) {
        s.stage = 'moves';
        s.step = 'moves';
        return say(s, 'aBuilt');
      }
      return say(s, 'aBuilding', { group, have: s.built[group], need: target });
    }

    // ----- the menu -----
    case 'choose': {
      if (s.stage !== 'moves' || s.pending || s.early?.step === 'drag') return state;
      if (!MOVES_BY_LEVEL(level).includes(action.move)) return state;
      if (action.move === 'trade') return commitTrade(s);
      s.menu = action.move;
      return say(s, action.move === 'add' ? 'aPickAmount' : 'aCross');
    }

    // ----- add an amount to a side (two actions, either order) -----
    case 'addTo': {
      if (s.stage !== 'moves' || s.menu !== 'add') return state;
      const side = action.side === 'right' ? 'right' : 'left';
      const amount = action.amount ?? amountOf(s.amountEntry);
      if (amount === null || amount === 0) return say(s, 'aAmountZero', {}, true);
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

    // ----- Go: commit a balanced move -----
    case 'go': {
      if (!s.pending?.both || !balanced(s)) return say(s, 'aGoNotYet', {}, true);
      s.lastAmount = s.pending.kind === 'cross' ? find(s.board, s.pending.id).v : s.pending.amount;
      s.pending = null;
      s.amountEntry = '';
      s.menu = null;
      s.hint = null;
      if (cancellable(s.board).length) { s.resolving = true; return say(s, 'aCancelPairs'); }
      return resolve(s);
    }

    // ----- cancel a + and a − (tap one, then the other) -----
    case 'select': {
      if (s.stage !== 'moves' || s.pending) return state;
      const t = find(s.board, action.id);
      if (!t || t.kind !== 'num') return say(s, 'aOnlyPairs', {}, true);
      if (!s.selected) { s.selected = t.id; return s; }
      const first = s.selected;
      s.selected = null;
      if (first === t.id) return s;
      const next = cancelPair(s.board, first, t.id) ?? cancelPair(s.board, t.id, first);
      if (!next) return say(s, 'aOnlyPairs', {}, true);
      return applyCancel(s, next);
    }
    case 'cancel': {
      if (s.stage !== 'moves' || s.pending) return state;
      const next = cancelPair(s.board, action.a, action.b) ?? cancelPair(s.board, action.b, action.a);
      if (!next) return say(s, 'aOnlyPairs', {}, true);
      return applyCancel(s, next);
    }

    // ----- Cross the border (L6): a number crosses and switches teams; crossed but not flipped it does not balance -----
    case 'cross': {
      if (s.stage !== 'moves' || s.menu !== 'cross' || (s.pending && s.pending.kind !== 'cross')) return state;
      const t = find(s.board, action.id);
      if (!t || t.kind !== 'num' || (s.pending && s.pending.id === t.id)) return state;
      if (s.pending) return say(s, 'aOtherSide', {}, true);
      const from = sideOf(s.board, t.id);
      const to = from === 'left' ? 'right' : 'left';
      s.history.push(snapshot(s));
      s.board = { ...s.board, [from]: s.board[from].filter((u) => u.id !== t.id), [to]: [...s.board[to], t] };
      if (from === 'left') { s.leftDelta -= t.v; s.rightDelta += t.v; } else { s.rightDelta -= t.v; s.leftDelta += t.v; }
      s.pending = { kind: 'cross', id: t.id, both: true, flipped: false };
      return say(s, 'aCrossed', { number: signed(t.v) }, !balanced(s));
    }
    case 'flipSign': {
      if (s.pending?.kind !== 'cross' || action.id !== s.pending.id) return state;
      const side = sideOf(s.board, action.id);
      const t = find(s.board, action.id);
      s.board = { ...s.board, [side]: s.board[side].map((u) => (u.id === t.id ? { ...u, v: -u.v } : u)) };
      if (side === 'left') s.leftDelta -= 2 * t.v; else s.rightDelta -= 2 * t.v;
      s.pending = { ...s.pending, flipped: !s.pending.flipped };
      return balanced(s) ? say(s, 'aSwitchedTeams', { number: signed(-t.v) }) : say(s, 'aUnbalanced', { tilt: Math.abs(tilt(s)), heavier: tilt(s) > 0 ? 'left' : 'right' }, true);
    }

    // ----- undo (always one tap; a half-done move goes in one go) and start over -----
    case 'undo': {
      if (!s.history.length) return state;
      restore(s, s.history.pop());
      s.selected = null;
      return say(s, 'aUndone');
    }
    case 'startOver':
      return startOverBoard(s);

    // ----- I'm stuck / Teach me -----
    case 'stuck': {
      s.stuck += 1;
      return climb(s);
    }
    case 'teach': {
      s.taught += 1;
      s.forced = true;
      s.helped = true;
      s.counterMode = true;
      s.menu = 'add';
      s.rung = 3;
      s.hint = { kind: 'amount', amount: oppositeOf(s.problem) };
      s.amountEntry = String(oppositeOf(s.problem));
      if (!s.supportsShown.includes('forced')) s.supportsShown.push('forced');
      return say(s, 'aTeach', { opposite: signed(oppositeOf(s.problem)), constant: signed(constantOf(s.problem)) });
    }

    // ----- the typed answer -----
    case 'check':
      return check(s);

    // ----- the early answer's drag-check -----
    case 'dropValue': {
      if (s.early?.step !== 'drag') return state;
      s.early = { ...s.early, step: 'check', lines: checkLines(s.problem, s.early.typed), shown: 0 };
      return say(s, 'aCheckStart', { typed: signed(s.early.typed) });
    }
    case 'nextLine': {
      if (s.early?.step !== 'check') return state;
      const shown = s.early.shown + 1;
      if (shown < s.early.lines.length) { s.early = { ...s.early, shown }; return s; }
      const ok = s.early.correct;
      s.early = ok ? { ...s.early, shown, step: 'move' } : null;
      if (ok) { s.menu = 'add'; return say(s, 'aEarlyMove'); }
      return say(s, 'aCheckFailed', { typed: signed(s.early?.typed ?? 0) }, true);
    }
    default:
      return state;
  }

  function commitTrade(st) {
    const snap = snapshot(st);
    st.history.push(snap);
    st.board = { left: st.board.right, right: st.board.left };
    [st.leftDelta, st.rightDelta] = [st.rightDelta, st.leftDelta];
    const { lights, earnedFewer } = judge(st.board, st.board, { level: st.level, earnedFewer: st.earnedFewer });
    st.lights = lights;
    st.earnedFewer = earnedFewer;
    st.prevBoard = st.board;
    return say(st, boardAnswer(st.board) !== null ? 'aTradedSolved' : 'aTraded');
  }

  function applyCancel(st, next) {
    st.history.push(snapshot(st));
    st.board = next;
    if (cancellable(st.board).length) return say(st, 'aCancelled');
    return resolve(st);
  }
}

// What the early answer's drag-check shows: the order of operations for the x side with the typed value in.
export function checkLines(p, typed) {
  const sign = p.form === 'x-a' ? '−' : '+';
  const inner = `(${signed(typed)}) ${sign} ${p.a}`;
  const value = typed + constantOf(p);
  return [`${inner}`, `${signed(typed)} ${sign} ${p.a} = ${signed(value)}`, `${signed(value)} ${value === p.b ? '=' : '≠'} ${signed(p.b)}   ${value === p.b ? 'Balanced ✓' : 'Unbalanced ✗'}`];
}

function check(s) {
  const { correct, tag, typed, unreadable } = checkAddBoth(s.problem, s.entry);
  if (unreadable) return say(s, s.entry === '' || s.entry === '-' ? 'typeAnswer' : 'answerUnreadable', {}, true);
  const onBoard = boardAnswer(s.board);
  if (s.stage === 'build' || s.pending || s.resolving) return say(s, 'aFinishMoveFirst', {}, true);
  if (onBoard !== null) {
    // x is alone: the board says what x is
    if (correct) return finish(s, 'aCorrect');
    s.wrongs += 1; s.tag = tag; s.tags.push(tag); s.answers.push({ typed: s.entry, tag }); s.entry = '';
    return say(s, 'aReadBoard', { answer: onBoard }, true);
  }
  // typed before x is alone: the early answer (never a stuck click)
  if (!correct) { s.wrongs += 1; s.tag = tag; s.tags.push(tag); s.answers.push({ typed: s.entry, tag }); }
  s.early = { typed, correct, tag, step: 'drag' };
  s.entry = '';
  return say(s, correct ? 'aEarlyYes' : 'aEarlyDrag', { typed: signed(typed), tag });
}

export { formatAddBoth, tagAddBoth };
