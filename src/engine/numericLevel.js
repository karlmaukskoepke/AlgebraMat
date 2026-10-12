// Level 1 of Add to both sides: the numeric level (SPEC-ADD-TO-BOTH-SIDES.md §3D). Numbers only, no x: the balance is on, and
// each of the five problems is one item. A "do" item: add an amount (suggested, a positive for the first, a negative for the
// second) to the left, then to the right (the two actions are the point), then Go. A "quiz" item: does a change keep the
// balance or upset it? Either answer shows the equations before and after, then a green Next (no retry). After the fifth item
// comes a watched walkthrough on `x + 3 = 5` (a demonstration: no typing, one highlighted click at a time, and the only place
// the value is shown to the student). No DOM here.

import { typeInto, isTyping } from './entry.js';
import { MINUS } from './expr.js';

const signed = (v) => (v < 0 ? `${MINUS}${-v}` : `${v}`);
export const sideText = (terms) => terms.map((t) => signed(t.v)).join(' + ');
const sum = (terms) => terms.reduce((s, t) => s + t.v, 0);
export const readoutOf = (b) => {
  const l = sum(b.left);
  const r = sum(b.right);
  return { left: l, right: r, balanced: l === r, text: `${signed(l)} ${l === r ? '=' : '≠'} ${signed(r)}   ${l === r ? 'Balanced ✓' : 'Unbalanced ✗'}` };
};
export const equationText = (b) => `${sideText(b.left)} = ${sideText(b.right)}`;

let counter = 0;
const term = (v) => ({ id: `n${++counter}`, v });
const board = (p) => ({ left: p.left.map(term), right: p.right.map(term) });
const withTerm = (b, side, v) => ({ ...b, [side]: [...b[side], term(v)] });

// The "after" board of a quiz item.
export function quizAfter(p) {
  let b = board(p);
  if (p.addLeft) b = withTerm(b, 'left', p.addLeft);
  if (p.addRight) b = withTerm(b, 'right', p.addRight);
  return b;
}

// What the question says (the wording is the spec's: "added 3 to one side only" ...)
export function askOf(p) {
  if (p.scenario === 'one') return `What happens if we ADD ${p.amount} to ONE SIDE ONLY?`;
  if (p.scenario === 'both') return `What happens if we ADD ${p.amount} to BOTH SIDES?`;
  return `What happens if we ADD ${p.addLeft} to the LEFT and ${p.addRight} to the RIGHT?`;
}

// The same question in pieces, the "ADD ..." part (what is added, and where) apart so it can be drawn in blue.
export function askParts(p) {
  const what = p.scenario === 'one' ? `ADD ${p.amount} to ONE SIDE ONLY` : p.scenario === 'both' ? `ADD ${p.amount} to BOTH SIDES` : `ADD ${p.addLeft} to the LEFT and ${p.addRight} to the RIGHT`;
  return [{ text: 'What happens if we ' }, { text: what, blue: true }, { text: '?' }];
}

// The equation after the change, term by term, the added amounts marked (they are drawn in blue).
export function afterParts(p) {
  const side = (terms, add) => [...terms.map((v) => ({ text: signed(v) })), ...(add ? [{ text: signed(add), blue: true }] : [])];
  return { left: side(p.left, p.addLeft), right: side(p.right, p.addRight) };
}

const say = (s, key, params = {}, bad = false) => { s.feedback = { key, params, bad }; return s; };
const amountOf = (entry) => (/^-?\d+$/.test(entry) ? Number(entry) : null);

export function newNumeric(problem) {
  const isQuiz = problem.item === 'quiz';
  const s = {
    kind: 'numeric', problem, level: 1,
    stage: isQuiz ? 'quiz' : 'moves', step: isQuiz ? 'quiz' : 'moves',
    board: board(problem), base: null, history: [],
    menu: null, amountEntry: '', suggested: false, pending: null, leftDelta: 0, rightDelta: 0,
    reveal: null, walk: null, misses: 0, wrongs: 0, stuck: 0, taught: 0, helped: false, clean: false, skipped: [],
    finalText: null, anim: null, feedback: null,
  };
  return say(s, isQuiz ? 'nlQuiz' : 'nlStart', { amount: problem.amount, ask: isQuiz ? askOf(problem) : '' });
}

const snap = (s) => ({ board: s.board, pending: s.pending, amountEntry: s.amountEntry, menu: s.menu, leftDelta: s.leftDelta, rightDelta: s.rightDelta, suggested: s.suggested });

export function reduceNumeric(state, action) {
  if (state.stage === 'done') return state;
  const s = structuredClone(state);
  s.anim = null;
  const p = s.problem;

  if (isTyping(action)) {
    if (s.stage !== 'moves' || s.menu !== 'add') return state;
    const entry = typeInto(s.suggested ? '' : s.amountEntry, action, 'integer');      // typing replaces a suggested number
    if (entry === s.amountEntry && !s.suggested) return state;
    s.amountEntry = entry;
    s.suggested = false;
    return s;
  }

  switch (action.type) {
    case 'choose': {
      if (s.stage === 'walk') return reduceNumeric(state, { type: 'wtChoose' });
      if (s.stage !== 'moves' || s.pending || action.move !== 'add') return state;
      s.menu = 'add';
      s.amountEntry = String(p.amount);
      s.suggested = true;
      return say(s, 'nlSuggest', { amount: signed(p.amount), word: p.amount > 0 ? 'positive' : 'negative' });
    }
    case 'greyMove':
      return say(s, 'nlLater');
    case 'addTo': {
      if (s.stage !== 'moves' || s.menu !== 'add') return state;
      const side = action.side === 'right' ? 'right' : 'left';
      const amount = amountOf(s.amountEntry);
      if (amount === null || amount === 0) return say(s, 'nlZero', {}, true);
      if (Math.abs(amount) > 6) return say(s, 'nlBig', {}, true);
      if ((amount > 0) !== (p.amount > 0)) return say(s, 'nlSign', { word: p.amount > 0 ? 'positive' : 'negative' }, true);
      if (s.pending && s.pending.side === side) return say(s, 'nlOtherSide', {}, true);
      s.suggested = false;
      const first = !s.pending;
      if (first) s.history.push(snap(s));
      s.board = withTerm(s.board, side, amount);
      if (side === 'left') s.leftDelta += amount; else s.rightDelta += amount;
      const r = readoutOf(s.board);
      if (first) {
        s.pending = { side, amount };
        return say(s, 'nlAddedOne', { amount: signed(amount), side, readout: r.text });
      }
      s.pending = { ...s.pending, both: true };
      return say(s, r.balanced ? 'nlBalanced' : 'nlUnbalanced', { amount: signed(amount), readout: r.text }, !r.balanced);
    }
    case 'go': {
      if (s.stage === 'walk') return reduceNumeric(state, { type: 'wtGo' });
      if (s.stage !== 'moves' || !s.pending?.both || !readoutOf(s.board).balanced) return say(s, 'nlGoNotYet', {}, true);
      const l = sum(s.board.left);
      const r = sum(s.board.right);
      s.board = { left: [term(l)], right: [term(r)] };                                  // tidy: each side is what it comes to
      s.pending = null; s.menu = null; s.amountEntry = '';
      s.stage = 'done'; s.step = 'done'; s.clean = true;
      s.finalText = readoutOf(s.board).text;
      return say(s, 'nlDone', { amount: signed(p.amount), readout: s.finalText });
    }
    case 'undo': {
      if (!s.history.length || s.stage !== 'moves') return state;
      Object.assign(s, s.history.pop());
      return say(s, 'nlUndone');
    }
    // A quiz answer, right or wrong, shows what happened (the work stack: the equation, the equation after, what each side comes to,
    // and Balanced or Unbalanced), says whether it was right, and waits for the green Next. No retry (decided 2026-10-12).
    case 'quiz': {
      if (s.stage !== 'quiz') return state;
      const before = board(p);
      const after = quizAfter(p);
      const right = action.value === p.correct;
      const l = readoutOf(after);
      if (!right) s.misses += 1;
      s.clean = right;
      s.answered = { value: action.value, right };
      s.reveal = { lines: [equationText(before), equationText(after), `${signed(l.left)} = ${signed(l.right)}`], after: afterParts(p), ok: l.balanced };
      s.stage = p.last ? 'review' : 'done';           // the last item goes on to the watched walkthrough after the Next
      s.step = s.stage;
      return say(s, right ? 'nlQuizRight' : 'nlQuizWrong', { correct: p.correct, said: action.value }, !right);
    }
    case 'quizNext': {
      if (s.stage !== 'review') return state;
      s.stage = 'walk'; s.step = 'walk'; s.walk = { step: 'a' }; s.reveal = null;
      return say(s, 'wtA');
    }
    // ----- the watched walkthrough: x + 3 = 5 -----
    case 'wtChoose': {
      if (s.stage !== 'walk' || s.walk.step !== 'a') return state;
      s.walk = { step: 'b' };
      s.menu = 'add';
      s.amountEntry = '-3';
      return say(s, 'wtB');
    }
    case 'wtGo': {
      if (s.stage !== 'walk' || s.walk.step !== 'b') return state;
      s.walk = { step: 'c' };
      s.menu = null;
      s.amountEntry = '';
      return say(s, 'wtC');
    }
    case 'wtNext': {
      if (s.stage !== 'walk' || !['c', 'd', 'e', 'f', 'g'].includes(s.walk.step)) return state;
      const order = ['c', 'd', 'e', 'f', 'g'];
      const next = order[order.indexOf(s.walk.step) + 1];
      if (!next) {
        s.stage = 'done'; s.step = 'done'; s.walk = { step: 'end' };
        return say(s, 'wtEnd');
      }
      s.walk = { step: next };
      return say(s, `wt${next.toUpperCase()}`);
    }
    default:
      return state;
  }
}
