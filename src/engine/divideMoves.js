// Divide it (SPEC-DIVIDE-IT.md rev 2.1) as a card of the shared Solve it loop (engine/solveLoop.js). The loop owns the choice at every
// state, the forced-move rule, the substitution, folding, Undo, Start over and the help ladder; this file only says what is
// Divide it's own: the board (`ax = b`: a boxes on the left, b counters on the right), the one move (take 1/n of BOTH sides, in one
// action, or by hand with the counters), the failed attempt (a fraction that does not split), the lights, the slips, and the
// pictures that go with the help rungs. No DOM here.

import { createSolveLoop } from './solveLoop.js';
import { signed, fractionText, boardText } from './solveTerms.js';
import { takeFraction, tagDivide, groupsOf, FRACTIONS, legalFractions, formatDivide } from './divide.js';

// ---------- the board: terms, as on Add to both sides, plus a coefficient and a fraction of a part ----------

let counter = 0;
const id = () => `d${++counter}`;
const xTerm = (coef) => ({ id: id(), kind: 'x', coef });
const numTerm = (v) => ({ id: id(), kind: 'num', v });
const fracOf = (n, inner) => ({ id: id(), kind: 'frac', n, inner, blue: true });

export const startBoard = (p) => ({ left: [xTerm(p.a)], right: [numTerm(p.b)] });
export const coefOf = (board) => board.left[0].coef;
export const xAlone = (board) => coefOf(board) === 1;
export { boardText, signed };

// The board after taking 1/n of both sides, and the work row that shows it. The right side stays unsimplified on the move that
// finishes (x alone), so the value is never shown before it is typed; a partial move shows the smaller numbers.
function applyFraction(board, n) {
  const a = coefOf(board);
  const b = board.right[0].v;
  const work = { left: [fracOf(n, [board.left[0]])], right: [fracOf(n, [board.right[0]])] };
  const next = a / n === 1
    ? { left: [xTerm(1)], right: [fracOf(n, [numTerm(b)])] }
    : { left: [xTerm(a / n)], right: [numTerm(b / n)] };
  return { work, next };
}

// ---------- the counters: a pile the size of the number on the right, dealt into n groups, one kept ----------

export const DEAL_ROUND_LEVEL = 4;                                              // Deal a round arrives with the bigger levels (spec §2: Level 4)
export const pileSize = (board) => (board.right[0].kind === 'num' ? Math.min(36, Math.abs(board.right[0].v)) : 0);
const dealt = (d) => d.groups.reduce((a, b) => a + b, 0);
const evenGroups = (groups) => groups.every((c) => c === groups[0]);

// At x alone with an unevaluated side (`x = ⅓(6)`): the diagram of the right side only, on every rung (spec §5).
function diagOf(board) {
  const t = board.right[0];
  return { n: t.n, size: Math.min(36, Math.abs(t.inner[0].v)), neg: t.inner[0].v < 0, val: signed(t.inner[0].v), groups: null, kept: null, guided: false };
}

const EARLIER = ['add', 'cross', 'trade'];                                      // the moves of earlier cards (Add to both sides)

const say = (s, key, params = {}, bad = false) => { s.feedback = { key, params: { a: s.problem.a, b: signed(s.problem.b), ...params }, bad }; return s; };

// What the dealing says. In a real problem the number in each group is what the student is there to find, so it is never printed once the
// groups are even (and never at x alone, where the groups' size is the answer): the student counts a group and types it.
function dealtMessage(s, d, total) {
  const got = dealt(d);
  const left = total - got;
  const holds = d.groups.join(', ');
  if (left > 0) return { key: 'dDealt', params: { got, total, holds: s.diag ? '' : holds } };
  return evenGroups(d.groups) ? { key: 'dKeepReady', params: { frac: fractionText(d.n) } } : { key: 'dUneven', params: { holds } };
}

// What a failed attempt says: which side broke.
function failParams(board, n, res) {
  const a = coefOf(board);
  return { n, frac: fractionText(n), boxes: a, b: signed(board.right[0].v), left: res.leftOver, boxesSplit: res.boxesSplit, countersSplit: res.countersSplit };
}

// ---------- the card ----------

const loop = createSolveLoop({
  id: 'divide-it',
  startBoard,
  alone: xAlone,
  noLights: () => ({ smaller: 'off', onebox: 'off' }),
  params: (s) => ({ a: s.problem.a, b: signed(s.problem.b) }),
  extra: () => ({ fail: null, deal: null, diag: null, pic: null, taught: 0 }),
  snapshotExtra: () => ({ fail: null, deal: null, diag: null, pic: null }),
  resetState: (s) => { s.fail = null; s.deal = null; s.diag = null; s.pic = null; },
  collapse: () => false,                                                          // a single-step card: the check never collapses
  mustMoveKey: () => 'aMustMove',
  undoKey: () => 'dUndone',
  // a fraction that did not split waits for Undo (or a new try): I'm stuck then says so first (Build A)
  waitingForUndo: (s) => Boolean(s.fail),
  undoReason: () => 'fail',
  tag: (p, typed) => tagDivide(p, typed),
  slip: (s, typed, tag) => {
    const p = s.problem;
    const groups = groupsOf(p, typed);
    return { key: 'dWrong', params: { typed: signed(typed), tag, groups, per: groups ? p.a / groups : 0, product: signed(p.a * typed), word: p.b < 0 ? 'negatives' : 'positives', wordx: typed < 0 ? 'negatives' : 'positives' } };
  },

  // ----- Divide it's own actions: choosing the move, taking a fraction, dealing and keeping -----
  reduce(s, action, api) {
    const gate = () => { const g = api.blockMove(s); return g; };
    switch (action.type) {
      // a move from an earlier card is not needed here; a move from a later card unlocks later (spec §4)
      case 'greyMove':
        return say(s, EARLIER.includes(action.move) ? 'aNotNeeded' : 'aLater');
      case 'choose': {
        if (action.move !== 'fraction') return undefined;
        const g = gate();
        if (g) return g;
        if (xAlone(s.board)) return say(s, 'aSolvedBoard');
        s.menu = 'fraction';
        s.fail = null;
        return say(s, 'dPickFraction');
      }
      case 'take': {
        if (s.menu !== 'fraction' || !FRACTIONS.includes(action.n)) return 'ignore';
        const g = gate();
        if (g) return g === 'ignore' ? g : 'ignore';
        const n = action.n;
        if ((s.fail || s.deal) && s.history.length) { const reds = s.reds; api.restore(s, s.history.pop()); s.reds = reds; }   // a new try replaces the last one
        const a = coefOf(s.board);
        if (s.forced && n !== a) return say(s, 'dForced', { frac: fractionText(a) }, true);
        const check = takeFraction({ a, b: s.board.right[0].v }, n);
        api.pushHistory(s);
        s.hint = null;
        if (!check.ok) {
          s.fail = { n, boxesSplit: check.boxesSplit, countersSplit: check.countersSplit };
          s.reds += 1;
          const work = { left: [fracOf(n, [s.board.left[0]])], right: [fracOf(n, [s.board.right[0]])] };
          s.rows.push({ type: 'work', board: work, failed: true });
          return say(s, s.reds >= 3 ? 'dFail3' : 'dFail', failParams(s.board, n, check), true);
        }
        // with the counters up, the move is done by hand: n empty groups appear, the boxes split into the same n, the pile is dealt
        if (s.scaffold) { s.deal = { n, groups: Array(n).fill(0) }; return say(s, 'dDealPrompt', { n, frac: fractionText(n), boxes: a, size: pileSize(s.board), per: a / n }); }
        return commitFraction(s, n, api);
      }
      // ----- dealing: one counter at a time (or a round), then keep one group; also the diagram at x alone -----
      case 'deal': {
        const d = s.deal ?? s.diag;
        if (!d || !d.groups || s.sub) return 'ignore';
        const total = s.deal ? pileSize(s.board) : d.size;
        if (total - dealt(d) <= 0) return say(s, 'dAllShared', {}, true);
        const gi = action.group;
        if (!Number.isInteger(gi) || gi < 0 || gi >= d.n) return 'ignore';
        d.groups[gi] += 1;
        return sayDealt(s, d, total);
      }
      case 'dealRound': {
        const d = s.deal ?? s.diag;
        if (!d || !d.groups || s.sub || s.level < DEAL_ROUND_LEVEL) return 'ignore';
        const total = s.deal ? pileSize(s.board) : d.size;
        if (total - dealt(d) < d.n) return say(s, 'dNoRound', { n: d.n }, true);
        d.groups = d.groups.map((c) => c + 1);
        return sayDealt(s, d, total);
      }
      case 'keep': {
        const d = s.deal ?? s.diag;
        if (!d || !d.groups || s.sub) return 'ignore';
        const gi = action.group;
        if (!Number.isInteger(gi) || gi < 0 || gi >= d.n) return 'ignore';
        const total = s.deal ? pileSize(s.board) : d.size;
        const left = total - dealt(d);
        if (left > 0) return say(s, 'dShareFirst', { left }, true);
        if (!evenGroups(d.groups)) return say(s, 'dUneven', { holds: d.groups.join(', ') }, true);
        if (s.diag) { d.kept = gi; return say(s, 'dDiagKept', { frac: fractionText(d.n) }); }
        const n = s.deal.n;
        const pic = { n, boxes: coefOf(s.board), size: pileSize(s.board), neg: s.board.right[0].v < 0, groups: [...s.deal.groups], kept: gi };
        s.deal = null;
        return commitFraction(s, n, api, pic);                                       // keeping one group is taking 1/n of both sides; the picture stays until Next
      }
      default:
        return undefined;
    }
  },

  // ----- the help ladder: rungs restart at every equation state -----
  // two rungs (rev 1.2: every rung gives the student something to do, so the picture-only first rung is merged into the next)
  rungs: [
    (s) => {                                                                          // 1. Model it and deal it
      s.scaffold = true;
      if (xAlone(s.board)) {                                                          // x = ⅓(−18): the counters in a pile, ready to deal at once
        s.diag = diagOf(s.board);
        s.diag.groups = Array(s.diag.n).fill(0);
        return say(s, 'dDiag1', { frac: fractionText(s.diag.n), val: s.diag.val, n: s.diag.n });
      }
      s.menu = 'fraction';                                                            // the fractions are live: choose one, deal the counters, keep a group
      s.hint = { kind: 'coef' };
      if (!s.supportsShown.includes('model')) s.supportsShown.push('model');
      return say(s, 'dModel', { boxes: coefOf(s.board), size: pileSize(s.board) });
    },
    (s) => {                                                                          // 2. Guided
      s.scaffold = true;
      if (xAlone(s.board)) {
        s.diag = { ...(s.diag ?? diagOf(s.board)) };
        s.diag.groups = Array(s.diag.n).fill(s.diag.size / s.diag.n);
        s.diag.kept = 0;
        s.diag.guided = true;
        if (!s.supportsShown.includes('guided')) s.supportsShown.push('guided');
        return say(s, 'dDiag3', { frac: fractionText(s.diag.n), n: s.diag.n });
      }
      const a = coefOf(s.board);
      s.menu = 'fraction';
      s.hint = { kind: 'fraction', n: a };
      if (!s.supportsShown.includes('guided')) s.supportsShown.push('guided');
      return say(s, 'dStuckGuided', { boxes: a, frac: fractionText(a), n: a });
    },
  ],
  teach(s) {                                                                          // the same scaffolds on a forced path
    s.scaffold = true;
    if (xAlone(s.board)) {
      s.diag = diagOf(s.board);
      s.diag.groups = Array(s.diag.n).fill(0);
      return say(s, 'dDiag2', { frac: fractionText(s.diag.n), size: s.diag.size, n: s.diag.n });
    }
    const a = coefOf(s.board);
    s.menu = 'fraction';
    s.hint = { kind: 'fraction', n: a };
    return say(s, 'dTeach', { boxes: a, frac: fractionText(a), b: signed(s.problem.b) });
  },
});

function sayDealt(s, d, total) {
  const m = dealtMessage(s, d, total);
  return say(s, m.key, m.params, m.key === 'dUneven');
}

// A move that splits both sides is committed: the work row `⅓(3x) = ⅓(−12)` and the new equation. Smaller numbers goes green with it,
// and One box when x is alone. A partial move leaves the prompt, and folds when the student goes on.
function commitFraction(s, n, api, pic = null) {
  const { work, next } = applyFraction(s.board, n);
  api.commit(s, {
    rows: [{ type: 'work', board: work }, { type: 'eq', board: next }], next, label: { n }, helpful: true,
    lights: { smaller: 'green', onebox: xAlone(next) ? 'green' : 'off' },
  });
  s.fail = null;
  s.deal = null;
  s.diag = null;
  s.pic = pic;                                                                     // what the student made stays on screen until Next folds the move
  return say(s, xAlone(next) ? 'aSolvedBoard' : 'aFindX');
}

export const newDivide = (problem, opts = {}) => loop.newSession(problem, { level: opts.level ?? 2, forceMove: opts.forceMove ?? false });
export const reduceDivide = loop.reduce;
export const solve = loop;
export const { answerLive, helpOk, startOverOk, subView, subTotal, touched, owesMove } = loop;
export { formatDivide, legalFractions, FRACTIONS };

// The spotlight on Divide it (Build C, Part 2: engine/spotlight.js): its errors, and the hint after Undo (the number in front of x
// outlined, with the card's own prompt for the move: "Pick a fraction of both sides. Which one leaves one box?").
const DIVIDE_ERRORS = {
  dFail: { target: 'failSide', label: 'doesn’t split' },
  dFail3: { target: 'failSide', label: 'doesn’t split' },
  aUndoFirstHelp: { target: 'lastMove', label: 'waiting for Undo' },
  aUndoGuess: { target: 'subst', label: 'not balanced' },
  dWrong: { target: 'answer', label: 'check this', clear: true },
};
export const DIVIDE_SPOT = {
  error: (s) => DIVIDE_ERRORS[s.feedback?.key] ?? null,
  keepsReds: (s) => ['dFail', 'dFail3'].includes(s.feedback?.key),
  clear: (s) => { s.entry = ''; },
  hint(s) {
    if (xAlone(s.board)) return { target: 'answer', key: 'aStuckSolved' };
    s.hint = { kind: 'coef' };
    return { target: 'coef', key: 'dPickFraction', move: 'fraction' };
  },
  prompt: (s) => (loop.moveOwed(s) ? 'aMustMove' : 'aFindX'),
};
