// One Boxes & Circles problem's walk through its steps, as a pure reducer (like
// engine/session.js for Flip It and engine/lassoSession.js for Group It).
// SPEC-BOXES.md §2:  (Rewrite) → Box & Circle → Draw → Cancel → Answer
//
// Built so far: Box & Circle, Draw, Cancel and Answer. Rewrite (Levels 4–5)
// comes in a later build, so those levels are played as written for now.

import { termParts, needsRewrite, prettyAnswer } from './terms.js';
import { canCancel, fullyCanceled, makePiece } from './termPieces.js';
import { validateShapes, validateDraw, validateAnswer, shapeInfo, overlaps, MAX_PER_TERM } from './termMoves.js';

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
    step: 'boxcircle',
    skipped: [],
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
    feedback: { key: 'boxCircleIntro' },
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
      if (column.length >= MAX_PER_TERM) return note(s, 'columnFull');
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
        s.selected = null;
        const pair = s.pairs.pop();
        if (!pair) return state;
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

