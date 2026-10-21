// Divide it's help, as entries of the scaffold registry (./../registry.js), keyed by shape (./../shape.js). Each rung reads the
// equation on screen through the shape, never the original problem. The shared ladder decides which rung a click gets and records the
// class-sheet word; a rung only sets up what the student does next. (Moved here from divideMoves.js in Build E, P3; the rungs, their
// messages and their words are unchanged.)

import { fractionText, signed } from '../../solveTerms.js';
import { coefOf, pileSize, diagOf } from '../../divideBoard.js';
import { coefOn } from '../../fractionMove.js';

// After a fraction that did not split, Undo brings back the boxes and the counters, "We want only one of the five x boxes.", and the
// fractions to choose from, the ones tried crossed off (Build D, Part 4). Shared by every card that takes a fraction (Build J): x may be
// on either side, and the boxes are counted by the size of the number in front of x.
export function fractionCycleHint(s, before) {
  if (!before?.fail || !s.tried.length) return null;
  s.menu = 'fraction';
  return { target: 'coef', key: 'dWhichFraction', params: { boxes: Math.abs(coefOn(s.board)) }, choose: true };
}

// D1 `ax = b`
const D1 = {
  ladder: ['modelIt', 'guided'],                    // (rev 1.2: every rung gives something to do, so the picture-only rung is merged into the next)
  // after Undo, the reminder (Build F, Part 3): the number in front of x outlined, Multiply's options open with the fraction option lit
  // and its preview on the equation, and one line with the real numbers; recorded as a reminder (`hint`). After a fraction that did not
  // split (Build D, Part 4): the boxes and the counters, "We want only one of the five x boxes.", and the fractions to choose from, the
  // ones tried crossed off.
  hintPopup: {
    word: 'hint',
    after(s, before) {
      s.hint = { kind: 'coef' };
      const cycle = fractionCycleHint(s, before);
      if (cycle) return cycle;
      const a = coefOf(s.board);
      s.mopts = { kind: null, entry: '' };
      s.ui = { ...(s.ui ?? {}), preview: 'frac' };
      if (!s.supportsShown.includes('hint')) s.supportsShown.push('hint');
      return { target: 'coef', key: 'dReminder', params: { boxes: a, frac: fractionText(a) }, move: 'fracOption' };
    },
  },
  // 1. Model it and deal it: the fractions are live; choose one, deal the counters, keep a group
  modelIt: {
    word: 'model',
    open(s, { say }) {
      s.scaffold = true;
      s.menu = 'fraction';
      s.hint = { kind: 'coef' };
      return say(s, 'dModel', { boxes: coefOf(s.board), size: pileSize(s.board) });
    },
  },
  // 2. Guided: the fraction that leaves one box is lit
  guided: {
    word: 'guided',
    open(s, { say }) {
      s.scaffold = true;
      const a = coefOf(s.board);
      s.menu = 'fraction';
      s.hint = { kind: 'fraction', n: a };
      return say(s, 'dStuckGuided', { boxes: a, frac: fractionText(a), n: a });
    },
  },
  // Teach me: the same scaffolds on a forced path
  teach: {
    open(s, { say }) {
      s.scaffold = true;
      const a = coefOf(s.board);
      s.menu = 'fraction';
      s.hint = { kind: 'fraction', n: a };
      return say(s, 'dTeach', { boxes: a, frac: fractionText(a), b: signed(s.problem.b) });
    },
  },
};

// D2 `x = ⅟a(b)`: the counters of the right side, in a pile ready to deal, then already in groups with one kept
const D2 = {
  ladder: ['modelIt', 'guided'],
  hintPopup: { after: () => ({ target: 'answer', key: 'aStuckSolved' }) },
  modelIt: {
    word: null,                                     // (as before Build E: the pile at x alone is not recorded as a model)
    open(s, { say }) {
      s.scaffold = true;
      s.diag = diagOf(s.board);
      s.diag.groups = Array(s.diag.n).fill(0);
      return say(s, 'dDiag1', { frac: fractionText(s.diag.n), val: s.diag.val, n: s.diag.n });
    },
  },
  guided: {
    word: 'guided',
    open(s, { say }) {
      s.scaffold = true;
      s.diag = { ...(s.diag ?? diagOf(s.board)) };
      s.diag.groups = Array(s.diag.n).fill(s.diag.size / s.diag.n);
      s.diag.kept = 0;
      s.diag.guided = true;
      return say(s, 'dDiag3', { frac: fractionText(s.diag.n), n: s.diag.n });
    },
  },
  teach: {
    open(s, { say }) {
      s.scaffold = true;
      s.diag = diagOf(s.board);
      s.diag.groups = Array(s.diag.n).fill(0);
      return say(s, 'dDiag2', { frac: fractionText(s.diag.n), size: s.diag.size, n: s.diag.n });
    },
  },
};

// DF: a fraction that did not split waits for Undo. The ladder's first answer there is "Undo first" (the loop's, for every waiting
// state); after Undo the state is D1 again, and D1's hint names the fractions tried.
const DF = { waiting: true };

export const DIVIDE_RUNGS = { D1, D2, DF };
