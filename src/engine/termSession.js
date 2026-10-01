// One Boxes & Circles problem's walk through its steps, as a pure reducer (like
// engine/session.js for Flip It and engine/lassoSession.js for Group It).
// SPEC-BOXES.md §2:  (Rewrite) → Box & Circle → Draw → Cancel → Answer
//
// Built so far: Box & Circle. Draw, Cancel and Answer come in the next builds,
// and Rewrite (Levels 4–5) after them, so for now a problem stops at Draw.

import { termParts } from './terms.js';
import { validateShapes, shapeInfo, overlaps } from './termMoves.js';

export const TERM_STEPS = [
  { id: 'boxcircle', label: 'Box & Circle' },
  { id: 'draw', label: 'Draw' },
  { id: 'cancel', label: 'Cancel' },
  { id: 'answer', label: 'Answer' },
];

export function newTermSession(problem) {
  return {
    problem,                    // the expression (engine/terms.js)
    step: 'boxcircle',
    skipped: [],
    tool: null,                 // 'box' | 'circle' | null: which shape a drag draws
    shapes: [],                 // [{ kind, from, to }] around parts of the expression
    selecting: null,            // { from, to } while a drag is in progress
    answer: null,
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

export function reduceTerms(state, action) {
  const s = clone(state);
  const { problem } = s;
  const partCount = termParts(problem).length;
  const validPart = (i) => Number.isInteger(i) && i >= 0 && i < partCount;

  switch (action.type) {
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

    case 'undo': { // takes back the latest shape
      if (s.step !== 'boxcircle' || s.shapes.length === 0) return state;
      s.shapes.pop();
      return note(s, 'boxCircleIntro');
    }

    case 'check': {
      if (s.step === 'boxcircle') {
        const res = validateShapes(problem, s.shapes);
        if (!res.ok) return wrong(s, res);
        s.selecting = null;
        s.step = 'draw';
        return say(s, res);
      }
      return state;
    }

    default:
      return state;
  }
}
