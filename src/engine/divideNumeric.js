// Level 1 of Divide it: the numeric level (no x). Each side is a product (`3 × 4 = 2 × 6`), the balance is on, and taking ⅓ or ½ of a
// side divides that side's value. A "do" item takes the fraction of the left, then of the right (the two actions are the point),
// then Go. A "quiz" item asks if a change keeps the balance or upsets it; either answer shows what happened and waits for the
// green Next (no retry). After the fifth item comes a watched walkthrough on 3x = 6. No DOM here.

import { MINUS } from './expr.js';
import { fractionText } from './divide.js';

const signed = (v) => (v < 0 ? `${MINUS}${-v}` : `${v}`);
export const sideText = (pair, n) => (n ? `${fractionText(n)}(${pair[0]} × ${pair[1]})` : `${pair[0]} × ${pair[1]}`);
export const sideValue = (v, n) => (n ? v / n : v);
export function readoutOf(p, nLeft, nRight) {
  const l = sideValue(p.v, nLeft);
  const r = sideValue(p.v, nRight);
  return { left: l, right: r, balanced: l === r, text: `${signed(l)} ${l === r ? '=' : '≠'} ${signed(r)}   ${l === r ? 'Balanced ✓' : 'Unbalanced ✗'}` };
}
export const equationText = (p, nLeft, nRight) => `${sideText(p.left, nLeft)} = ${sideText(p.right, nRight)}`;

// A side as segments, the fraction applied in blue (loop §3D): `⅓(3 × 4)`, or `3 × 4` before anything is taken.
export const segsOf = (pair, n) => (n ? [{ text: fractionText(n), blue: true }, { text: `(${pair[0]} × ${pair[1]})` }] : [{ text: `${pair[0]} × ${pair[1]}` }]);
const markOf = (r) => (r.balanced ? { text: '✓ Balanced', good: true } : { text: '✗ Unbalanced', good: false });

// The work the level writes, a row at a time (loop §3E: every action writes what each side becomes, never just a readout):
//   { type: 'eq', left, right, tag }        the equation, the fraction applied in blue, and (words) which side it was taken of
//   { type: 'values', left, right, mark }   what each side comes to, and Balanced or Unbalanced
// e.g. `½(2 × 6) = 3 × 4`, `6 = 12  ✗ Unbalanced`, then `½(2 × 6) = ½(3 × 4)`, `6 = 6  ✓ Balanced`.
export function workRows(s) {
  const p = s.problem;
  const rows = [{ type: 'eq', left: segsOf(p.left, 0), right: segsOf(p.right, 0), mark: markOf(readoutOf(p, 0, 0)), values: `${p.v} = ${p.v}` }];
  if (!s.pending) return rows;
  const first = s.pending.side;
  const one = first === 'left' ? [p.n, 0] : [0, p.n];
  rows.push({ type: 'eq', left: segsOf(p.left, one[0]), right: segsOf(p.right, one[1]), tag: `take ${fractionText(p.n)} of the ${first}` });
  const r1 = readoutOf(p, one[0], one[1]);
  rows.push({ type: 'values', left: signed(r1.left), right: signed(r1.right), mark: markOf(r1) });
  if (s.pending.both) {
    rows.push({ type: 'eq', left: segsOf(p.left, s.nLeft), right: segsOf(p.right, s.nRight), tag: `take ${fractionText(p.n)} of the ${first === 'left' ? 'right' : 'left'}` });
    const r2 = readoutOf(p, s.nLeft, s.nRight);
    rows.push({ type: 'values', left: signed(r2.left), right: signed(r2.right), mark: markOf(r2) });
  }
  return rows;
}

// A quiz item's evidence: the equation after the change (the fraction in blue), what each side comes to, and the mark.
export function quizRows(p) {
  const r = readoutOf(p, p.nLeft, p.nRight);
  return [
    { type: 'eq', left: segsOf(p.left, p.nLeft), right: segsOf(p.right, p.nRight) },
    { type: 'values', left: signed(r.left), right: signed(r.right), mark: markOf(r) },
  ];
}

// The question, with the "TAKE ⅓ ..." part apart so it is drawn in blue.
export function askParts(p) {
  const f = (n) => fractionText(n);
  const what = p.scenario === 'one' ? `TAKE ${f(p.n)} of ONE SIDE ONLY` : p.scenario === 'both' ? `TAKE ${f(p.n)} of BOTH SIDES` : `TAKE ${f(p.nLeft)} of the LEFT and ${f(p.nRight)} of the RIGHT`;
  return [{ text: 'What happens if we ' }, { text: what, blue: true }, { text: '?' }];
}

const say = (s, key, params = {}, bad = false) => { s.feedback = { key, params, bad }; return s; };

export function newDivideNumeric(problem) {
  const isQuiz = problem.item === 'quiz';
  const s = {
    kind: 'divide-numeric', problem, level: 1, stage: isQuiz ? 'quiz' : 'moves', step: isQuiz ? 'quiz' : 'moves',
    menu: null, nLeft: 0, nRight: 0, pending: null, history: [], reveal: null, answered: null, walk: null, misses: 0, wrongs: 0, stuck: 0, taught: 0, helped: false,
    clean: false, skipped: [], finalText: null, feedback: null,
  };
  return say(s, isQuiz ? 'dnQuiz' : 'dnStart', { frac: fractionText(problem.n ?? 3) });
}

const snap = (s) => ({ menu: s.menu, nLeft: s.nLeft, nRight: s.nRight, pending: s.pending });

export function reduceDivideNumeric(state, action) {
  if (state.stage === 'done') return state;
  const s = structuredClone(state);
  const p = s.problem;
  switch (action.type) {
    case 'greyMove': return say(s, 'aLater');
    case 'choose': {
      if (s.stage === 'walk') return reduceDivideNumeric(state, { type: 'wtChoose' });
      if (s.stage !== 'moves' || s.pending || action.move !== 'fraction') return state;
      s.menu = 'fraction';
      return say(s, 'dnSuggest', { frac: fractionText(p.n) });
    }
    // the fraction of one side (the suggested fraction is already chosen)
    case 'takeSide': {
      if (s.stage !== 'moves' || s.menu !== 'fraction') return state;
      const side = action.side === 'right' ? 'right' : 'left';
      if (side === 'left' ? s.nLeft : s.nRight) return say(s, 'dnOtherSide', {}, true);
      const first = !s.pending;
      if (first) s.history.push(snap(s));
      if (side === 'left') s.nLeft = p.n; else s.nRight = p.n;
      const r = readoutOf(p, s.nLeft, s.nRight);
      if (first) { s.pending = { side }; return say(s, 'dnTookOne', { frac: fractionText(p.n), side, readout: r.text }); }
      s.pending = { ...s.pending, both: true };
      return say(s, r.balanced ? 'dnBalanced' : 'dnUnbalanced', { frac: fractionText(p.n), readout: r.text }, !r.balanced);
    }
    case 'go': {
      if (s.stage === 'walk') return reduceDivideNumeric(state, { type: 'wtGo' });
      if (s.stage !== 'moves' || !s.pending?.both) return say(s, 'dnGoNotYet', {}, true);
      s.stage = 'done'; s.step = 'done'; s.clean = true; s.menu = null;
      return say(s, 'dnDone', { frac: fractionText(p.n), readout: readoutOf(p, s.nLeft, s.nRight).text });
    }
    case 'undo': {
      if (!s.history.length || s.stage !== 'moves') return state;
      Object.assign(s, s.history.pop());
      return say(s, 'dnUndone');
    }
    case 'quiz': {
      if (s.stage !== 'quiz') return state;
      const right = action.value === p.correct;
      const r = readoutOf(p, p.nLeft, p.nRight);
      if (!right) s.misses += 1;
      s.clean = right;
      s.answered = { value: action.value, right };
      s.reveal = { lines: [equationText(p, p.nLeft, p.nRight), `${signed(r.left)} = ${signed(r.right)}`], ok: r.balanced, rows: quizRows(p) };
      s.stage = p.last ? 'review' : 'done';
      s.step = s.stage;
      return say(s, right ? 'dnQuizRight' : 'dnQuizWrong', { correct: p.correct, said: action.value }, !right);
    }
    case 'quizNext': {
      if (s.stage !== 'review') return state;
      s.stage = 'walk'; s.step = 'walk'; s.walk = { step: 'a' }; s.reveal = null;
      return say(s, 'dwA');
    }
    // ----- the watched walkthrough: 3x = 6 -----
    case 'wtChoose': {
      if (s.stage !== 'walk' || s.walk.step !== 'a') return state;
      s.walk = { step: 'b' }; s.menu = 'fraction';
      return say(s, 'dwB');
    }
    case 'wtGo': {
      if (s.stage !== 'walk' || s.walk.step !== 'b') return state;
      s.walk = { step: 'c' }; s.menu = null;
      return say(s, 'dwC');
    }
    case 'wtNext': {
      if (s.stage !== 'walk' || !['c', 'd', 'e', 'f', 'g'].includes(s.walk.step)) return state;
      const order = ['c', 'd', 'e', 'f', 'g'];
      const next = order[order.indexOf(s.walk.step) + 1];
      if (!next) { s.stage = 'done'; s.step = 'done'; s.walk = { step: 'end' }; return say(s, 'dwEnd'); }
      s.walk = { step: next };
      return say(s, `dw${next.toUpperCase()}`);
    }
    default: return state;
  }
}
