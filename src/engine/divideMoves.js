// The moves behind Divide it (SPEC-DIVIDE-IT.md on the light-build pattern of Add to both sides), as one pure reducer. The equation
// is `ax = b`: a boxes on the left, b counters on the right. The student chooses a path (guess x, or use a move) and the choice is
// fixed. The one move is "Take a fraction of both sides": tapping ½ ⅓ ¼ ⅕ or ⅙ takes that fraction of BOTH sides in one action.
// The work stack keeps `⅓(3x) = ⅓(−12)` and the new equation; a fraction that does not split the boxes or the counters is a failed
// attempt (shown, with Undo), never a committed move. Every typed value is plugged back in a line a click. No DOM here.

import { typeInto, isTyping } from './entry.js';
import { signed, takeFraction, fractionText, checkDivide, answerText, legalFractions, groupsOf, FRACTIONS, formatDivide } from './divide.js';

// ---------- the board: terms, as on Add to both sides, plus a coefficient and a fraction of a part ----------

let counter = 0;
const id = () => `d${++counter}`;
const xTerm = (coef) => ({ id: id(), kind: 'x', coef });
const numTerm = (v) => ({ id: id(), kind: 'num', v });
const fracOf = (n, inner) => ({ id: id(), kind: 'frac', n, inner, blue: true });

export const startBoard = (p) => ({ left: [xTerm(p.a)], right: [numTerm(p.b)] });
export const coefOf = (board) => board.left[0].coef;
export const xAlone = (board) => coefOf(board) === 1;
// A side as written: "3x", "x", "−12", "⅓(−12)".
export function termText(t) {
  if (t.kind === 'x') return t.coef > 1 ? `${t.coef}x` : 'x';
  if (t.kind === 'frac') return `${fractionText(t.n)}(${t.inner.map(termText).join(' + ')})`;
  return signed(t.v);
}
export const boardText = (board) => `${board.left.map(termText).join(' + ')} = ${board.right.map(termText).join(' + ')}`;

// The board after taking 1/n of both sides, and the work row that shows it. The right side stays unsimplified on the move that
// finishes (x alone), so the value is never shown before it is typed; a partial move shows the smaller numbers.
function applyFraction(board, p, n) {
  const a = coefOf(board);
  const b = board.right[0].kind === 'num' ? board.right[0].v : p.b;
  const work = { left: [fracOf(n, [board.left[0]])], right: [fracOf(n, [board.right[0]])] };
  const next = a / n === 1
    ? { left: [xTerm(1)], right: [fracOf(n, [numTerm(b)])] }
    : { left: [xTerm(a / n)], right: [numTerm(b / n)] };
  return { work, next };
}
// The numbers the right side stands for, for the lights: how big is each number now?
const sizes = (board) => [coefOf(board), board.right[0].kind === 'num' ? Math.abs(board.right[0].v) : null];

// ---------- the session ----------

const say = (s, key, params = {}, bad = false) => { s.feedback = { key, params: { a: s.problem.a, b: signed(s.problem.b), ...params }, bad }; return s; };
const snapshot = (s) => ({ board: s.board, rows: [...s.rows], lights: s.lights, reds: s.reds, menu: s.menu, startOver: s.startOver, fail: null });
const restore = (s, snap) => Object.assign(s, snap);

export function newDivide(problem, { level = 2, forceMove = false } = {}) {
  const board = startBoard(problem);
  const s = {
    problem, level, stage: 'moves', step: 'moves', path: forceMove ? 'move' : null, mustMove: forceMove,
    board, base: board, rows: [{ type: 'eq', board }], history: [], menu: null, typing: null, entry: '', sub: null, fail: null,
    lights: { smaller: 'off', onebox: 'off' }, reds: 0, startOver: false, forced: false, hint: null, hintGiven: false, rung: 0, taught: 0, stuck: 0,
    wrongs: 0, tag: null, tags: [], answers: [], helped: false, clean: false, skipped: [], supportsShown: [], finalText: null, feedback: null,
  };
  return say(s, forceMove ? 'aMustMove' : 'aChoose');
}

export const owesMove = (s) => s.path === 'guess' && s.stage === 'done';
export const helpOk = (s) => !s.sub || (s.sub.step >= 3 && !s.sub.ok);

// Is the x = [ ] row live? Greyed before the path is chosen, on the move path until x is alone, and while a substitution is stepped.
export function answerLive(s) {
  if (s.stage === 'done') return false;
  if (s.sub) return s.sub.kind === 'value' && s.sub.step >= 3 && !s.sub.ok;
  return s.path === 'guess' || (s.path === 'move' && xAlone(s.board) && !s.fail);
}

function startOverBoard(s) {
  Object.assign(s, { board: s.base, rows: [{ type: 'eq', board: s.base }], history: [], menu: null, typing: null, startOver: false, reds: 0, sub: null, entry: '', fail: null, lights: { smaller: 'off', onebox: 'off' }, hint: null });
  s.path = s.mustMove ? 'move' : null;
  return say(s, s.path ? 'aStartedOver' : 'aChoose');
}

function finish(s, key) {
  s.stage = 'done';
  s.step = 'done';
  s.clean = s.wrongs === 0 && s.stuck === 0 && s.taught === 0 && !s.helped;
  s.finalText = answerText(s.problem);
  return say(s, key, { answer: s.finalText });
}

// The first I'm stuck is a reminder of the move's logic; the next points at the fraction that leaves one box.
function climb(s) {
  s.helped = true;
  const p = s.problem;
  if (xAlone(s.board)) return say(s, 'aStuckSolved');
  const a = coefOf(s.board);
  s.menu = 'fraction';
  if (!s.hintGiven) {
    s.hintGiven = true;
    s.hint = { kind: 'coef' };
    if (!s.supportsShown.includes('hint')) s.supportsShown.push('hint');
    return say(s, 'dStuckHint', { boxes: a });
  }
  s.rung = Math.min(s.rung + 1, 2);
  s.hint = { kind: 'fraction', n: a };
  if (!s.supportsShown.includes('guided')) s.supportsShown.push('guided');
  return say(s, 'dStuckGuided', { boxes: a, frac: fractionText(a), n: a, b: signed(p.b) });
}

// What a failed attempt says: which side broke.
function failParams(p, board, n, res) {
  const a = coefOf(board);
  return { n, frac: fractionText(n), boxes: a, b: board.right[0].kind === 'num' ? signed(board.right[0].v) : signed(p.b), left: res.leftOver, boxesSplit: res.boxesSplit, countersSplit: res.countersSplit };
}

// The substitution of a typed value into ax = b: a × (value) = b, then what it comes to.
export const plugValue = (typed) => (typed < 0 ? `(${signed(typed)})` : `${typed}`);
export function substitutionSteps(p, typed) {
  const first = `${p.a} × ${plugValue(typed)} = ${signed(p.b)}`;
  return [first, `${signed(p.a * typed)} = ${signed(p.b)}`];
}
export const substitutionParts = (p, typed) => [{ text: `${p.a} × ` }, { text: plugValue(typed), blue: true }, { text: ` = ${signed(p.b)}` }];

export function reduceDivide(state, action) {
  if (state.stage === 'done') return state;
  const s = structuredClone(state);

  if (isTyping(action)) {
    if (s.sub) { if (!(s.sub.kind === 'value' && s.sub.step >= 3 && !s.sub.ok)) return state; s.sub = null; }
    if (!s.path || (s.path === 'move' && !xAlone(s.board))) return state;
    const entry = typeInto(s.entry, action, 'integer');
    if (entry === s.entry) return state;
    s.entry = entry;
    return s;
  }

  switch (action.type) {
    case 'path': {
      if (s.path) return state;
      s.path = action.value === 'move' ? 'move' : 'guess';
      if (s.path === 'guess') { s.typing = 'answer'; return say(s, 'aGuessPrompt'); }
      return say(s, 'dMovePrompt');
    }
    case 'greyMove':
      return say(s, 'aLater');
    case 'choose': {
      if (s.stage !== 'moves' || s.sub || action.move !== 'fraction') return state;
      if (!s.path) return say(s, 'aChooseFirst', {}, true);
      if (s.path === 'guess') return say(s, 'aGuessing');
      if (xAlone(s.board)) return say(s, 'aSolvedBoard');
      s.menu = 'fraction';
      s.fail = null;
      return say(s, 'dPickFraction');
    }
    // Take 1/n of both sides, in one action (or fail to: the boxes or the counters do not split into n equal groups).
    case 'take': {
      if (s.stage !== 'moves' || s.menu !== 'fraction' || s.sub || !FRACTIONS.includes(action.n)) return state;
      const n = action.n;
      const p = s.problem;
      if (s.fail && s.history.length) { const reds = s.reds; restore(s, s.history.pop()); s.reds = reds; }   // a new try replaces the failed one
      const a = coefOf(s.board);
      if (s.forced && n !== a) return say(s, 'dForced', { frac: fractionText(a) }, true);
      const check = takeFraction({ a, b: p.b }, n);
      s.history.push(snapshot(s));
      s.hint = null;
      if (!check.ok) {
        s.fail = { n, boxesSplit: check.boxesSplit, countersSplit: check.countersSplit };
        s.reds += 1;
        const work = { left: [fracOf(n, [s.board.left[0]])], right: [fracOf(n, [s.board.right[0]])] };
        s.rows.push({ type: 'work', board: work, failed: true });
        if (s.reds >= 3) s.startOver = true;
        return say(s, s.reds >= 3 ? 'dFail3' : 'dFail', failParams(p, s.board, n, check), true);
      }
      const { work, next } = applyFraction(s.board, p, n);
      s.rows.push({ type: 'work', board: work }, { type: 'eq', board: next });
      s.board = next;
      s.menu = null;
      s.fail = null;
      s.reds = 0;
      s.lights = { smaller: 'green', onebox: xAlone(next) ? 'green' : 'neutral' };
      if (xAlone(next)) return say(s, 'aSolvedBoard');
      return say(s, 'dPartial', { frac: fractionText(n), boxes: coefOf(next) });
    }
    case 'undo': {
      if (s.sub) {
        if (s.sub.kind !== 'guess' || s.sub.ok || s.sub.step < 3) return state;
        s.sub = null; s.entry = ''; s.path = 'move'; s.typing = null;
        return say(s, 'aSimplerFirst');
      }
      if (!s.history.length) return state;
      restore(s, s.history.pop());
      s.hint = null;
      s.menu = s.path === 'move' ? 'fraction' : null;
      return say(s, 'dUndone');
    }
    case 'startOver':
      return startOverBoard(s);
    case 'stuck': {
      if (!helpOk(s)) return state;
      s.sub = null;
      if (s.path !== 'move') { s.path = 'move'; s.entry = ''; s.typing = null; }
      s.stuck += 1;
      return climb(s);
    }
    case 'teach': {
      if (!helpOk(s)) return state;
      s.sub = null;
      if (s.path !== 'move') { s.path = 'move'; s.entry = ''; s.typing = null; }
      s.taught += 1; s.forced = true; s.helped = true;
      if (!s.supportsShown.includes('forced')) s.supportsShown.push('forced');
      if (xAlone(s.board)) return say(s, 'aStuckSolved');
      const a = coefOf(s.board);
      s.menu = 'fraction';
      s.hint = { kind: 'fraction', n: a };
      return say(s, 'dTeach', { boxes: a, frac: fractionText(a), b: signed(s.problem.b) });
    }
    case 'check': {
      const { correct, tag, typed, unreadable } = checkDivide(s.problem, s.entry);
      if (unreadable) return say(s, s.entry === '' || s.entry === '-' ? 'typeAnswer' : 'answerUnreadable', {}, true);
      if (s.sub) return s;
      if (!correct) { s.wrongs += 1; s.tag = tag; s.tags.push(tag); s.answers.push({ typed: s.entry, tag }); }
      const kind = xAlone(s.board) ? 'value' : 'guess';
      s.sub = { kind, typed, ok: correct, tag, lines: substitutionSteps(s.problem, typed), parts: substitutionParts(s.problem, typed), step: 0 };
      return correct ? say(s, 'aPlugIn', { typed: signed(typed) }) : say(s, kind === 'guess' ? 'aGuessed' : 'aPlugIn', { typed: signed(typed) }, kind === 'guess');
    }
    case 'nextLine': {
      if (!s.sub || s.sub.step >= 3) return state;
      s.sub = { ...s.sub, step: s.sub.step + 1 };
      if (s.sub.step < 3) return s;
      const { kind, ok, typed, tag } = s.sub;
      if (ok) return finish(s, 'aCorrect');
      if (kind === 'guess') return say(s, 'aUndoGuess', { typed: signed(typed) });
      s.entry = '';
      return say(s, 'dWrong', { typed: signed(typed), tag, groups: groupsOf(s.problem, typed), per: groupsOf(s.problem, typed) ? s.problem.a / groupsOf(s.problem, typed) : 0, product: signed(s.problem.a * typed), word: s.problem.b < 0 ? 'negatives' : 'positives', wordx: typed < 0 ? 'negatives' : 'positives' }, true);
    }
    default:
      return state;
  }
}

export { formatDivide, legalFractions, FRACTIONS };
