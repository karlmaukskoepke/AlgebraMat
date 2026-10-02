// One Boxes & Circles problem's walk through its steps, as a pure reducer (like
// engine/session.js for Flip It and engine/lassoSession.js for Group It).
// SPEC-BOXES.md §2:  (Rewrite) → Box & Circle → Draw → Cancel → Answer
//
// Levels 4–5 start with Rewrite (a problem carries `level`); the rest start at Box & Circle.
//
// The same walk runs the integer problems of Combine it and Flip It (SPEC-COMBINE.md), which have no
// x terms to box and circle, so a problem with `mode` set starts at Draw (Combine it's Level 3,
// mode 'integers') or at Rewrite and then Draw (Flip It's Level 5, mode 'integers-flip').

import { termParts, needsRewrite, prettyAnswer } from './terms.js';

// Integer problems (no x terms): Combine it's Level 3 and Flip It's mixed Level 5.
export const isIntegers = (problem) => problem.mode === 'integers' || problem.mode === 'integers-flip';

// Does this problem begin with Rewrite? Boxes & Circles' Levels 4 and 5 do (even when nothing needs it),
// and so does Flip It's mixed level.
export const hasRewrite = (problem) => problem.mode === 'integers-flip' || (!isIntegers(problem) && (problem.level ?? 0) >= 4);

// The step after Rewrite, and the first step when there's no Rewrite: Box & Circle, or Draw for integers.
const firstDrawingStep = (problem) => (isIntegers(problem) ? 'draw' : 'boxcircle');

export function termSteps(problem) {
  const steps = isIntegers(problem) ? TERM_STEPS.filter((t) => t.id !== 'boxcircle') : TERM_STEPS;
  return hasRewrite(problem) ? [REWRITE_STEP, ...steps] : steps;
}

// The terms of `- (-7)` kind, and which of their two parts (operation, number) are flipped.
export const rewritable = (problem) => problem.terms.map((t, i) => (needsRewrite(t) ? i : -1)).filter((i) => i >= 0);
export const flipKey = (term, part) => `${term}:${part}`;
export const fullyFlipped = (s, term) => Boolean(s.flips[flipKey(term, 'op')] && s.flips[flipKey(term, 'num')]);

import { canCancel, fullyCanceled, makePiece } from './termPieces.js';
import { validateShapes, validateDraw, validateAnswer, shapeInfo, overlaps, maxPieces } from './termMoves.js';

export const REWRITE_STEP = { id: 'rewrite', label: 'Rewrite' };
export const TERM_STEPS = [
  { id: 'boxcircle', label: 'Box & Circle' },
  { id: 'draw', label: 'Draw' },
  { id: 'cancel', label: 'Cancel' },
  { id: 'answer', label: 'Answer' },
];

export const MAX_ANSWER_LENGTH = 12;

export function newTermSession(problem) {
  return {
    problem,                    // the expression (engine/terms.js)
    step: hasRewrite(problem) ? 'rewrite' : firstDrawingStep(problem),
    skipped: [],
    flips: {},                  // { 'term:op'|'term:num': true } the parts of a − (−7) term the student flipped
    tool: null,                 // 'box' | 'circle' | null: which shape a drag draws
    shapes: [],                 // [{ kind, from, to }] around parts of the expression
    selecting: null,            // { from, to } while a drag is in progress
    pick: null,                 // { type: 'box' | 'counter', sign } the piece Draw adds
    pieces: problem.terms.map(() => []), // one column of pieces per term
    drawn: [],                  // term indexes in the order pieces were added (for Undo)
    selected: null,             // { term, index }: the first piece picked to cancel
    pairs: [],                  // canceled pairs, newest last: [[term, index], [term, index]]
    entry: '',                  // what's been typed for the answer
    finalText: null,
    tries: {},
    feedback: { key: hasRewrite(problem) ? 'rewriteIntro' : isIntegers(problem) ? 'drawIntro' : 'boxCircleIntro' },
  };
}

const clone = (s) => structuredClone(s);

function say(s, res) {
  s.feedback = { key: res.feedbackKey, params: res.params, bad: !res.ok };
  return s;
}

function wrong(s, res) {
  s.tries[s.step] = (s.tries[s.step] ?? 0) + 1;
  return say(s, res);
}

const note = (s, key, params) => { s.feedback = { key, params }; return s; };

// A shape is finished when it is exactly one whole term (the view draws the
// rest dashed).
export const shapeComplete = (problem, shape) => shapeInfo(problem, shape).complete;

const sameRange = (a, b) => a && b && a.from === b.from && a.to === b.to;

// What the answer line shows: what's been typed, set out the way it reads.
export const answerText = (s) => prettyAnswer(s.entry);

// Move to the step after Draw: Cancel, or straight to Answer when nothing can cancel.
function afterDraw(s) {
  if (fullyCanceled(s.pieces)) {
    s.skipped.push('cancel');
    s.step = 'answer';
    return note(s, 'drawDoneNoCancel');
  }
  s.step = 'cancel';
  return note(s, 'drawDone');
}

export function reduceTerms(state, action) {
  const s = clone(state);
  const { problem } = s;
  const partCount = termParts(problem).length;
  const validPart = (i) => Number.isInteger(i) && i >= 0 && i < partCount;
  const validTerm = (t) => Number.isInteger(t) && t >= 0 && t < problem.terms.length;

  switch (action.type) {
    // ---------- ⓪ Rewrite (Levels 4–5) ----------

    // The Mat reports which part (an index into termParts) was tapped.
    case 'flipPart': {
      const p = termParts(problem)[action.index];
      return p ? reduceTerms(state, { type: 'flip', term: p.term, part: p.part }) : state;
    }

    // Tapped the operation or the number of a term: flip it (tap again to flip back).
    case 'flip': {
      if (s.step !== 'rewrite' || !validTerm(action.term) || !['op', 'num'].includes(action.part)) return state;
      if (!needsRewrite(problem.terms[action.term])) return wrong(s, { ok: false, feedbackKey: 'notNegative' });
      const key = flipKey(action.term, action.part);
      if (s.flips[key]) delete s.flips[key]; else s.flips[key] = true;
      const todo = rewritable(problem);
      if (todo.every((t) => fullyFlipped(s, t))) {
        s.step = firstDrawingStep(problem);
        return note(s, 'rewriteDone');
      }
      const half = s.flips[key] && !fullyFlipped(s, action.term);
      return note(s, half ? 'flipBoth' : 'rewriteIntro');
    }

    case 'nothingToRewrite': {
      if (s.step !== 'rewrite') return state;
      if (rewritable(problem).length > 0) return wrong(s, { ok: false, feedbackKey: 'somethingToRewrite' });
      s.step = firstDrawingStep(problem);
      return note(s, 'nothingToRewriteOk');
    }

    // ---------- ① Box & Circle ----------

    case 'pickTool': {
      if (s.step !== 'boxcircle' || !['box', 'circle'].includes(action.tool)) return state;
      s.tool = action.tool;
      return note(s, action.tool === 'box' ? 'boxToolOn' : 'circleToolOn');
    }

    // The drag in progress: highlight what's under it (nothing is drawn yet).
    case 'selecting': {
      if (s.step !== 'boxcircle') return state;
      if (action.clear) {
        if (!s.selecting) return state;
        s.selecting = null;
        return s;
      }
      if (!validPart(action.from) || !validPart(action.to)) return state;
      const next = { from: Math.min(action.from, action.to), to: Math.max(action.from, action.to) };
      if (sameRange(s.selecting, next)) return state;
      s.selecting = next;
      return s;
    }

    // Released a drag (or tapped): draw the shape. It replaces any shape it overlaps.
    case 'drawShape': {
      if (s.step !== 'boxcircle') return state;
      s.selecting = null;
      if (!s.tool) return note(s, 'pickToolFirst');
      if (!validPart(action.from) || !validPart(action.to)) return state;
      const shape = { kind: s.tool, from: Math.min(action.from, action.to), to: Math.max(action.from, action.to) };
      s.shapes = [...s.shapes.filter((other) => !overlaps(other, shape)), shape];
      return note(s, 'boxCircleIntro');
    }

    // Tapped a finished shape: take it away.
    case 'removeShape': {
      if (s.step !== 'boxcircle' || !s.shapes[action.index]) return state;
      s.shapes.splice(action.index, 1);
      s.selecting = null;
      return note(s, 'boxCircleIntro');
    }

    // ---------- ② Draw ----------

    case 'pickPiece': {
      if (s.step !== 'draw' || !['box', 'counter'].includes(action.pieceType) || !['+', '-'].includes(action.sign)) return state;
      s.pick = { type: action.pieceType, sign: action.sign };
      return note(s, 'drawIntro');
    }

    // Tapped above a term: add the picked piece to its column.
    case 'tapZone': {
      if (s.step !== 'draw' || !validTerm(action.term)) return state;
      if (!s.pick) return note(s, 'pickPieceFirst');
      const column = s.pieces[action.term];
      if (column.length >= maxPieces(problem.terms[action.term])) return note(s, 'columnFull');
      // A piece from a term that was subtracted from a negative is "opposite" (magenta).
      column.push(makePiece(s.pick.type, s.pick.sign, needsRewrite(problem.terms[action.term])));
      s.drawn.push(action.term);
      return note(s, 'drawIntro');
    }

    // ---------- ② Draw and ③ Cancel: tapping a piece ----------

    case 'tapPiece': {
      const piece = s.pieces[action.term]?.[action.index];
      if (!piece) return state;

      if (s.step === 'draw') { // tapping a piece takes it away
        s.pieces[action.term].splice(action.index, 1);
        const at = s.drawn.lastIndexOf(action.term);
        if (at >= 0) s.drawn.splice(at, 1);
        return note(s, 'drawIntro');
      }

      if (s.step === 'cancel') {
        if (piece.canceled) return note(s, 'alreadyCanceled');
        const first = s.selected;
        if (!first) {
          s.selected = { term: action.term, index: action.index };
          return note(s, 'cancelPick');
        }
        if (first.term === action.term && first.index === action.index) { // tapped again: let go of it
          s.selected = null;
          return note(s, 'cancelIntro');
        }
        const other = s.pieces[first.term][first.index];
        if (!canCancel(other, piece)) {
          return wrong(s, { ok: false, feedbackKey: other.type !== piece.type ? 'notLikeTerms' : 'pairIsPlusMinus' });
        }
        other.canceled = true;
        piece.canceled = true;
        s.pairs.push([[first.term, first.index], [action.term, action.index]]);
        s.selected = null;
        if (fullyCanceled(s.pieces)) {
          s.step = 'answer';
          return note(s, 'cancelDone');
        }
        return note(s, 'cancelPaired');
      }
      return state;
    }

    case 'undo': {
      if (s.step === 'boxcircle') {
        if (s.shapes.length === 0) return state;
        s.shapes.pop(); // takes back the latest shape
        return note(s, 'boxCircleIntro');
      }
      if (s.step === 'draw') {
        const term = s.drawn.pop();
        if (term === undefined) return state;
        s.pieces[term].pop();
        return note(s, 'drawIntro');
      }
      if (s.step === 'cancel') {
        const held = s.selected;
        s.selected = null;
        const pair = held ? null : s.pairs.pop(); // with a piece picked, Undo lets go of it first
        if (!pair) return held ? note(s, 'cancelIntro') : state;
        for (const [term, index] of pair) s.pieces[term][index].canceled = false;
        return note(s, 'cancelIntro');
      }
      return state;
    }

    // ---------- ④ Answer: the typing buttons and keys ----------

    case 'digit': {
      if (s.step !== 'answer' || !Number.isInteger(action.digit) || action.digit < 0 || action.digit > 9) return state;
      if (s.entry.length >= MAX_ANSWER_LENGTH) return state;
      s.entry += String(action.digit);
      return s;
    }

    case 'typeChar': {
      if (s.step !== 'answer' || !['x', '+', '-'].includes(action.ch)) return state;
      if (s.entry.length >= MAX_ANSWER_LENGTH) return state;
      s.entry += action.ch;
      return s;
    }

    // The ± button on integer problems (Flip It's pad): flips a leading minus on what's typed.
    case 'toggleSign': {
      if (s.step !== 'answer' || !isIntegers(problem)) return state;
      if (!s.entry.startsWith('-') && s.entry.length >= MAX_ANSWER_LENGTH) return state;
      s.entry = s.entry.startsWith('-') ? s.entry.slice(1) : `-${s.entry}`;
      return s;
    }

    case 'backspace': {
      if (s.step !== 'answer' || s.entry === '') return state;
      s.entry = s.entry.slice(0, -1);
      return s;
    }

    case 'check': {
      if (s.step === 'boxcircle') {
        const res = validateShapes(problem, s.shapes);
        if (!res.ok) return wrong(s, res);
        s.selecting = null;
        s.step = 'draw';
        return note(s, 'boxCircleDone');
      }
      if (s.step === 'draw') {
        const res = validateDraw(problem, s.pieces);
        if (!res.ok) return wrong(s, res);
        return afterDraw(s);
      }
      if (s.step === 'answer') {
        const res = validateAnswer(problem, s.entry);
        if (!res.ok) return res.feedbackKey === 'typeAnswer' ? say(s, res) : wrong(s, res);
        s.finalText = prettyAnswer(s.entry);
        s.step = 'done';
        return say(s, res);
      }
      return state;
    }

    default:
      return state;
  }
}

