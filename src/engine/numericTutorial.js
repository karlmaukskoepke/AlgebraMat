// The numeric tutorials (SPEC-ADD-TO-BOTH-SIDES.md §3A–§3C): the move first on numbers with no unknown, where the balance
// readout shows both values, then a quiz ("keeps or upsets the balance?"). One pure reducer for all three:
//   add    `4 + 1 = 2 + 3`: add an amount to one side (unbalanced), then the same to the other (balanced), then Go; try more;
//          then the 3-item quiz. (The counters-with-a-box and symbols-only parts run on the real engine.)
//   trade  `5 = 2 + 3` → Trade places → `2 + 3 = 5`, twice; then the quiz (trading keeps; changing one sign upsets).
//   cross  `4 + 1 = 2 + 3`: cross a number over the border (it does not balance), switch teams (it does); changing every sign
//          keeps the balance, changing one upsets it; then the quiz.
// No DOM here.

import { typeInto, isTyping } from './entry.js';
import { MINUS } from './expr.js';

const signed = (v) => (v < 0 ? `${MINUS}${-v}` : `${v}`);
let counter = 0;
const term = (v) => ({ id: `n${++counter}`, v });
const sum = (terms) => terms.reduce((s, t) => s + t.v, 0);
// A side as written: "4 + 1", "2 + 3 + −1".
export const sideText = (terms) => terms.map((t) => signed(t.v)).join(' + ');
export const equationText = (b) => `${sideText(b.left)} = ${sideText(b.right)}`;
export const readoutOf = (b) => {
  const l = sum(b.left);
  const r = sum(b.right);
  return { left: l, right: r, balanced: l === r, text: `${signed(l)} ${l === r ? '=' : '≠'} ${signed(r)}   ${l === r ? 'Balanced ✓' : 'Unbalanced ✗'}` };
};

const START = { add: [[4, 1], [2, 3]], trade: [[5], [2, 3]], cross: [[4, 1], [2, 3]] };
const TRADE_ITEMS = [[[5], [2, 3]], [[7], [4, 3]]];
const board = ([l, r]) => ({ left: l.map(term), right: r.map(term) });

// The quizzes: what is done, to which equation, and whether it keeps the balance. `apply` makes the "after" board.
const START_BOARD = (kind) => board(START[kind]);
const withTerm = (b, side, v) => ({ ...b, [side]: [...b[side], term(v)] });
const QUIZ = {
  add: [
    { say: 'Adding 3 to one side only', correct: 'upsets', apply: (b) => withTerm(b, 'left', 3) },
    { say: 'Adding 3 to both sides', correct: 'keeps', apply: (b) => withTerm(withTerm(b, 'left', 3), 'right', 3) },
    { say: 'Adding 3 to the left and 2 to the right', correct: 'upsets', apply: (b) => withTerm(withTerm(b, 'left', 3), 'right', 2) },
  ],
  trade: [
    { say: 'Trading places', correct: 'keeps', apply: (b) => ({ left: b.right.map((t) => term(t.v)), right: b.left.map((t) => term(t.v)) }) },
    { say: 'Changing the sign of just one term', correct: 'upsets', apply: (b) => ({ ...b, right: b.right.map((t, i) => (i === 0 ? term(-t.v) : term(t.v))) }) },
  ],
  cross: [
    { say: 'Crossing the border and not switching teams', correct: 'upsets', apply: (b) => ({ left: b.left.filter((_, i) => i !== 1).map((t) => term(t.v)), right: [...b.right.map((t) => term(t.v)), term(b.left[1].v)] }) },
    { say: 'Crossing the border and switching teams', correct: 'keeps', apply: (b) => ({ left: b.left.filter((_, i) => i !== 1).map((t) => term(t.v)), right: [...b.right.map((t) => term(t.v)), term(-b.left[1].v)] }) },
  ],
};
export const QUIZ_LENGTH = (kind) => QUIZ[kind].length;

export function newTutorial(kind) {
  if (!START[kind]) throw new Error(`Unknown tutorial: ${kind}`);
  const b = kind === 'trade' ? board(TRADE_ITEMS[0]) : START_BOARD(kind);
  return {
    kind, stage: 'explore', board: b, item: 0, traded: false,
    pending: null, amountEntry: '', menu: null, leftDelta: 0, rightDelta: 0, history: [],
    moves: [], sawUnbalanced: false, crosses: 0, flips: 0, sawAllFlip: false, crossed: null, flipMode: false,
    quiz: 0, reveal: null, misses: 0, feedback: { key: `tuIntro_${kind}`, params: {} },
  };
}

const say = (t, key, params = {}, bad = false) => { t.feedback = { key, params, bad }; return t; };
const snap = (t) => ({ board: t.board, pending: t.pending, amountEntry: t.amountEntry, menu: t.menu, leftDelta: t.leftDelta, rightDelta: t.rightDelta, crossed: t.crossed });
const restore = (t, s) => Object.assign(t, s);

// Ready to leave the exploring and take the quiz?
export function readyForQuiz(t) {
  if (t.kind === 'add') return t.moves.length >= 2 && t.sawUnbalanced;
  if (t.kind === 'trade') return t.item >= TRADE_ITEMS.length - 1 && t.traded;
  return t.crosses >= 1 && t.flips >= 1;
}

export function reduceTutorial(state, action) {
  if (state.stage === 'done') return state;
  const t = structuredClone(state);
  t.anim = null;

  if (isTyping(action)) {
    if (t.stage !== 'explore' || t.kind !== 'add' || t.menu !== 'add') return state;
    const entry = typeInto(t.amountEntry, action, 'integer');
    if (entry === t.amountEntry) return state;
    t.amountEntry = entry;
    return t;
  }

  switch (action.type) {
    // ----- add -----
    case 'choose': {
      if (t.stage !== 'explore' || t.kind !== 'add' || t.pending) return state;
      t.menu = 'add';
      return say(t, 'tuPickAmount');
    }
    case 'addTo': {
      if (t.stage !== 'explore' || t.kind !== 'add' || t.menu !== 'add') return state;
      const side = action.side === 'right' ? 'right' : 'left';
      const amount = /^-?\d+$/.test(t.amountEntry) ? Number(t.amountEntry) : null;
      if (amount === null || amount === 0) return say(t, 'tuAmountZero', {}, true);
      if (Math.abs(amount) > 12) return say(t, 'tuAmountBig', {}, true);
      if (t.pending && t.pending.side === side) return say(t, 'tuOtherSide', {}, true);
      const first = !t.pending;
      if (first) t.history.push(snap(t));
      t.board = withTerm(t.board, side, amount);
      if (side === 'left') t.leftDelta += amount; else t.rightDelta += amount;
      if (first) {
        t.pending = { side, amount };
        t.sawUnbalanced = true;
        return say(t, 'tuAddedOne', { amount: signed(amount), side, readout: readoutOf(t.board).text });
      }
      t.pending = { ...t.pending, both: true, other: amount };
      const r = readoutOf(t.board);
      return say(t, r.balanced ? 'tuBalanced' : 'tuUnbalanced', { amount: signed(amount), readout: r.text }, !r.balanced);
    }
    case 'go': {
      if (t.kind === 'add') {
        if (!t.pending?.both || !readoutOf(t.board).balanced) return say(t, 'tuGoNotYet', {}, true);
        const amount = t.pending.amount;
        if (!t.moves.includes(amount)) t.moves.push(amount);
        const l = sum(t.board.left);
        const r = sum(t.board.right);
        t.board = { left: [term(l)], right: [term(r)] };       // tidy: each side is what it comes to
        t.pending = null; t.menu = null; t.amountEntry = '';
        return say(t, readyForQuiz(t) ? 'tuTryMoreDone' : 'tuTryMore', { amount: signed(amount), readout: readoutOf(t.board).text });
      }
      if (t.kind === 'cross') {
        if (t.crossed === null || !readoutOf(t.board).balanced) return say(t, 'tuGoNotYet', {}, true);
        t.crosses += 1;
        t.history.push(snap(t));
        const text = readoutOf(t.board).text;
        t.crossed = null;
        return say(t, readyForQuiz(t) ? 'tuCrossDone' : 'tuCrossed', { readout: text });
      }
      return state;
    }
    case 'undo': {
      if (!t.history.length || t.stage !== 'explore') return state;
      restore(t, t.history.pop());
      return say(t, 'tuUndone');
    }
    // ----- trade places -----
    case 'trade': {
      if (t.stage !== 'explore' || t.kind !== 'trade') return state;
      t.board = { left: t.board.right, right: t.board.left };
      t.traded = true;
      t.anim = 'trade';
      const r = readoutOf(t.board);
      return say(t, readyForQuiz(t) ? 'tuTradeDone' : 'tuTraded', { readout: r.text, equation: equationText(t.board) });
    }
    case 'nextItem': {
      if (t.stage !== 'explore' || t.kind !== 'trade' || !t.traded || t.item >= TRADE_ITEMS.length - 1) return state;
      t.item += 1;
      t.board = board(TRADE_ITEMS[t.item]);
      t.traded = false;
      return say(t, 'tuIntro_trade2');
    }
    // ----- cross the border -----
    case 'cross': {
      if (t.stage !== 'explore' || t.kind !== 'cross' || t.crossed) return state;
      const from = t.board.left.some((x) => x.id === action.id) ? 'left' : t.board.right.some((x) => x.id === action.id) ? 'right' : null;
      if (!from) return state;
      const to = from === 'left' ? 'right' : 'left';
      const moved = t.board[from].find((x) => x.id === action.id);
      t.history.push(snap(t));
      t.board = { [from]: t.board[from].filter((x) => x.id !== action.id), [to]: [...t.board[to], moved] };
      t.crossed = moved.id;
      return say(t, 'tuCrossedBare', { number: signed(moved.v), readout: readoutOf(t.board).text }, true);
    }
    case 'flipSign': {
      if (t.stage !== 'explore' || t.kind !== 'cross') return state;
      const all = [...t.board.left, ...t.board.right];
      if (!all.some((x) => x.id === action.id)) return state;
      t.history.push(snap(t));
      const flip = (x) => (x.id === action.id ? { ...x, v: -x.v } : x);
      t.board = { left: t.board.left.map(flip), right: t.board.right.map(flip) };
      if (action.id === t.crossed) { t.flips += 1; }
      const r = readoutOf(t.board);
      return say(t, r.balanced ? 'tuSwitched' : 'tuUpset', { readout: r.text }, !r.balanced);
    }
    case 'flipMode': {
      if (t.stage !== 'explore' || t.kind !== 'cross') return state;
      t.flipMode = !t.flipMode;
      return say(t, t.flipMode ? 'tuFlipModeOn' : 'tuFlipModeOff');
    }
    case 'flipAll': {
      if (t.stage !== 'explore' || t.kind !== 'cross') return state;
      t.history.push(snap(t));
      const flip = (x) => ({ ...x, v: -x.v });
      t.board = { left: t.board.left.map(flip), right: t.board.right.map(flip) };
      t.sawAllFlip = true;
      return say(t, 'tuFlipAll', { readout: readoutOf(t.board).text });
    }
    // ----- on to the quiz -----
    case 'continue': {
      if (t.stage === 'explore') {
        if (!readyForQuiz(t) || t.pending || t.crossed) return say(t, 'tuNotYet', {}, true);
        t.stage = 'quiz';
        t.board = kindBoard(t);
        t.quiz = 0;
        return say(t, 'tuQuizIntro', { say: QUIZ[t.kind][0].say });
      }
      if (t.stage === 'quizDone') { t.stage = 'done'; return say(t, 'tuAllDone'); }
      return state;
    }
    case 'quiz': {
      if (t.stage !== 'quiz') return state;
      const item = QUIZ[t.kind][t.quiz];
      const before = kindBoard(t);
      const after = item.apply(before);
      const ok = action.value === item.correct;
      if (ok) {
        t.reveal = null;
        if (t.quiz + 1 >= QUIZ[t.kind].length) { t.stage = 'quizDone'; return say(t, 'tuQuizPassed'); }
        t.quiz += 1;
        return say(t, 'tuQuizRight', { say: QUIZ[t.kind][t.quiz].say });
      }
      t.misses += 1;
      t.reveal = { before: equationText(before), beforeRead: readoutOf(before).text, after: equationText(after), afterRead: readoutOf(after).text };
      return say(t, 'tuQuizWrong', { say: item.say, correct: item.correct }, true);
    }
    default:
      return state;
  }
}

// The equation a quiz item starts from.
const kindBoard = (t) => (t.kind === 'trade' ? board(TRADE_ITEMS[0]) : START_BOARD(t.kind));
export const quizItem = (t) => (t.stage === 'quiz' ? QUIZ[t.kind][t.quiz] : null);
export const quizBoard = (t) => (t.stage === 'quiz' || t.stage === 'quizDone' ? kindBoard(t) : t.board);
