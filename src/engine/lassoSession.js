// One Lasso problem's walk through its steps, as a pure reducer (like
// engine/session.js for Flip It). Two scripts (SPEC-LASSO.md §3):
//   whole-number groups: Groups → + or − → Fill → Count → Opposite
//   fraction groups:     Whole → Split → Take → Count → Opposite

import { isFraction, isOpposite } from './groups.js';
import {
  validateGroups, validateGroupSign, validateGroup, validateFill, validateCount,
  validateOppositeAnswer, validateWhole, validateSplit, validateTake, validateOppositeChoice,
  MAX_IN_LASSO, MAX_LASSOS, MAX_PARTS,
} from './lassoMoves.js';
import { entryValue } from './session.js';

export const WHOLE_STEPS = [
  { id: 'groups', label: 'Groups' },
  { id: 'sign', label: '+ or −' },
  { id: 'fill', label: 'Fill' },
  { id: 'count', label: 'Count' },
  { id: 'opposite', label: 'Opposite' },
];

export const FRACTION_STEPS = [
  { id: 'whole', label: 'Whole' },
  { id: 'split', label: 'Split' },
  { id: 'take', label: 'Take' },
  { id: 'count', label: 'Count' },
  { id: 'opposite', label: 'Opposite' },
];

export const stepsFor = (problem) => (isFraction(problem) ? FRACTION_STEPS : WHOLE_STEPS);

export function newLassoSession(problem) {
  if (isFraction(problem)) return newFractionSession(problem);
  return {
    problem,
    script: 'whole',
    step: 'groups',
    skipped: [],
    wroteOne: !problem.hidden1,  // −(B) problems start with the 1 unwritten
    lassos: [],                  // [{ opposite, terms: [{ kind: 'int', sign }] }]
    history: [],                 // lasso indices filled, newest last (for Undo)
    drawSign: null,
    total: null,                 // the count, once right (the notes' "→ −8")
    flipped: false,
    answer: null,
    entry: { negative: false, digits: '' },
    tries: {},
    feedback: { key: problem.hidden1 ? 'groupsIntroHidden' : 'groupsIntro' },
  };
}

function newFractionSession(problem) {
  return {
    problem,
    script: 'fraction',
    step: 'whole',
    skipped: [],
    whole: [],                   // counters in the whole group
    parts: [],                   // [{ terms, taken }]
    history: [],                 // newest last: { type: 'draw' | 'part' | 'deal', index }
    drawSign: null,
    total: null,
    flipped: false,
    answer: null,
    entry: { negative: false, digits: '' },
    tries: {},
    feedback: { key: 'wholeIntro' },
  };
}

const clone = (s) => structuredClone(s);
const emptyEntry = () => ({ negative: false, digits: '' });

function say(s, res) {
  s.feedback = { key: res.feedbackKey, params: res.params, bad: !res.ok };
  return s;
}

function wrong(s, res) {
  s.tries[s.step] = (s.tries[s.step] ?? 0) + 1;
  return say(s, res);
}

const note = (s, key, params) => { s.feedback = { key, params }; return s; };

function finish(s, answer, res) {
  s.answer = answer;
  s.step = 'done';
  return say(s, res);
}

// The pad works in Count, and in Opposite once the groups are flipped.
const padOpen = (s) => s.step === 'count' || (s.step === 'opposite' && s.flipped);

export function reduceLasso(state, action) {
  if (state.script === 'fraction') return reduceFraction(state, action);
  const s = clone(state);
  const { problem } = s;

  switch (action.type) {
    case 'writeOne': {
      if (s.step !== 'groups' || s.wroteOne) return state;
      s.wroteOne = true;
      return note(s, 'groupsIntro');
    }

    case 'addLasso': {
      if (s.step !== 'groups') return state;
      if (!s.wroteOne) return wrong(s, { ok: false, feedbackKey: 'writeOneFirst' });
      if (s.lassos.length >= MAX_LASSOS) return note(s, 'tooManyLassos');
      s.lassos.push({ opposite: false, terms: [] });
      return note(s, 'groupsIntro');
    }

    case 'tapLasso': {
      const i = action.index;
      if (!s.lassos[i]) return state;

      if (s.step === 'groups') { // tapping a lasso erases it
        s.lassos.splice(i, 1);
        return s;
      }
      if (s.step !== 'fill') return state;

      if (i === 0) { // draw into the first lasso, one counter per tap
        if (!s.drawSign) return note(s, 'pickSignFirst');
        if (s.lassos[0].terms.length >= MAX_IN_LASSO) return note(s, 'lassoFull');
        s.lassos[0].terms.push({ kind: 'int', sign: s.drawSign });
        s.history.push(0);
        return note(s, 'fillIntro');
      }
      // Any other lasso: one tap copies the first group into it, once it's right.
      const first = validateGroup(problem, s.lassos[0].terms, 0);
      if (!first.ok) {
        return wrong(s, { ok: false, feedbackKey: 'fixFirstGroup', params: { b: problem.inside.value, count: Math.abs(problem.inside.value), sign: problem.inside.value > 0 ? '+' : '-' } });
      }
      s.lassos[i].terms = s.lassos[0].terms.map((t) => ({ ...t }));
      s.history.push(i);
      return note(s, 'copied');
    }

    case 'pickSign': {
      if (s.step !== 'fill') return state;
      s.drawSign = action.sign;
      return s;
    }

    case 'undo': { // takes back the latest counter or copy
      if (s.step !== 'fill' || s.history.length === 0) return state;
      const i = s.history.pop();
      if (i === 0) s.lassos[0].terms.pop();
      else s.lassos[i].terms = [];
      return s;
    }

    case 'chooseSign': {
      if (s.step !== 'sign') return state;
      const res = validateGroupSign(problem, action.sign);
      if (!res.ok) return wrong(s, res);
      for (const l of s.lassos) l.opposite = action.sign === '-';
      s.step = 'fill';
      return say(s, res);
    }

    case 'flip': { // opp.: every group flips at once (Karl's choice)
      if (s.step !== 'opposite' || s.flipped) return state;
      s.flipped = true;
      s.entry = emptyEntry();
      return note(s, 'oppDone', { total: s.total });
    }

    case 'check': {
      if (s.step === 'groups') {
        const res = validateGroups(problem, { count: s.lassos.length, wroteOne: s.wroteOne });
        if (!res.ok) return wrong(s, res);
        s.step = 'sign';
        return say(s, res);
      }
      if (s.step === 'fill') {
        const res = validateFill(problem, s.lassos);
        if (!res.ok) return wrong(s, res);
        s.step = 'count';
        s.entry = emptyEntry();
        return say(s, res);
      }
      if (s.step === 'count') {
        const value = entryValue(s.entry);
        const res = validateCount(problem, value);
        if (!res.ok) return res.feedbackKey === 'typeAnswer' ? say(s, res) : wrong(s, res);
        s.total = value;
        s.entry = emptyEntry();
        if (isOpposite(problem)) {
          s.step = 'opposite';
          return say(s, res);
        }
        s.skipped.push('opposite');
        return finish(s, value, res);
      }
      if (s.step === 'opposite') {
        if (!s.flipped) return note(s, 'tapOppFirst');
        const value = entryValue(s.entry);
        const res = validateOppositeAnswer(problem, value);
        if (!res.ok) return res.feedbackKey === 'typeAnswer' ? say(s, res) : wrong(s, res);
        return finish(s, value, res);
      }
      return state;
    }

    case 'digit': {
      if (!padOpen(s) || s.entry.digits.length >= 2) return state;
      s.entry.digits = s.entry.digits === '0' ? String(action.digit) : s.entry.digits + action.digit;
      return s;
    }

    case 'toggleSign': {
      if (!padOpen(s)) return state;
      s.entry.negative = !s.entry.negative;
      return s;
    }

    case 'backspace': {
      if (!padOpen(s)) return state;
      s.entry.digits = s.entry.digits.slice(0, -1);
      return s;
    }

    default:
      return state;
  }
}

// ---------- Fraction groups ----------

function reduceFraction(state, action) {
  const s = clone(state);
  const { problem } = s;

  switch (action.type) {
    case 'pickSign': {
      if (s.step !== 'whole') return state;
      s.drawSign = action.sign;
      return s;
    }

    case 'tapWhole': { // ① draw the whole group, one counter per tap
      if (s.step !== 'whole') return state;
      if (!s.drawSign) return note(s, 'pickSignFirst');
      if (s.whole.length >= MAX_IN_LASSO) return note(s, 'lassoFull');
      s.whole.push({ kind: 'int', sign: s.drawSign });
      s.history.push({ type: 'draw' });
      return note(s, 'wholeIntro');
    }

    case 'addPart': {
      if (s.step !== 'split') return state;
      if (s.parts.length >= MAX_PARTS) return note(s, 'tooManyParts');
      s.parts.push({ terms: [], taken: false });
      s.history.push({ type: 'part' });
      return note(s, 'splitIntro');
    }

    case 'tapPart': {
      const part = s.parts[action.index];
      if (!part) return state;
      if (s.step === 'split') { // deal one counter from the whole into this part
        if (s.whole.length === 0) return note(s, 'allDealt');
        part.terms.push(s.whole.pop());
        s.history.push({ type: 'deal', index: action.index });
        return note(s, 'splitIntro');
      }
      if (s.step === 'take') {
        part.taken = !part.taken;
        return note(s, 'takeIntro', { n: problem.count.n });
      }
      return state;
    }

    case 'undo': { // takes back the latest counter, part, or deal
      if ((s.step !== 'whole' && s.step !== 'split') || s.history.length === 0) return state;
      const last = s.history[s.history.length - 1];
      if (s.step === 'whole' && last.type !== 'draw') return state;
      if (s.step === 'split' && last.type === 'draw') return state; // the whole is already checked
      s.history.pop();
      if (last.type === 'draw') s.whole.pop();
      if (last.type === 'part') s.parts.pop();
      if (last.type === 'deal') s.whole.push(s.parts[last.index].terms.pop());
      return s;
    }

    case 'flip':
    case 'noOpposite': {
      if (s.step !== 'opposite' || s.flipped) return state;
      const res = validateOppositeChoice(problem, action.type === 'flip' ? 'opp' : 'none');
      if (!res.ok) return wrong(s, res);
      if (action.type === 'noOpposite') {
        s.skipped.push('opposite');
        return finish(s, s.total, { ok: true, feedbackKey: 'correct', params: { answer: s.total } });
      }
      s.flipped = true;
      s.entry = emptyEntry();
      return note(s, 'oppDone', { total: s.total });
    }

    case 'check': {
      if (s.step === 'whole') {
        const res = validateWhole(problem, s.whole);
        if (!res.ok) return wrong(s, res);
        s.step = 'split';
        return say(s, res);
      }
      if (s.step === 'split') {
        const res = validateSplit(problem, { whole: s.whole, parts: s.parts });
        if (!res.ok) return wrong(s, res);
        s.step = 'take';
        return say(s, res);
      }
      if (s.step === 'take') {
        const res = validateTake(problem, s.parts);
        if (!res.ok) return wrong(s, res);
        s.step = 'count';
        s.entry = emptyEntry();
        return say(s, res);
      }
      if (s.step === 'count') {
        const value = entryValue(s.entry);
        const res = validateCount(problem, value);
        if (res.feedbackKey === 'typeAnswer') return say(s, res);
        if (!res.ok) return wrong(s, { ...res, feedbackKey: 'countTaken' });
        s.total = value;
        s.entry = emptyEntry();
        s.step = 'opposite'; // every fraction problem asks: opp. or No opposite?
        return note(s, 'oppOrNot', { total: value });
      }
      if (s.step === 'opposite') {
        if (!s.flipped) return note(s, 'oppOrNot', { total: s.total });
        const value = entryValue(s.entry);
        const res = validateOppositeAnswer(problem, value);
        if (!res.ok) return res.feedbackKey === 'typeAnswer' ? say(s, res) : wrong(s, res);
        return finish(s, value, res);
      }
      return state;
    }

    case 'digit':
    case 'toggleSign':
    case 'backspace':
      return reducePad(state, s, action);

    default:
      return state;
  }
}

function reducePad(state, s, action) {
  if (!padOpen(s)) return state;
  if (action.type === 'digit') {
    if (s.entry.digits.length >= 2) return state;
    s.entry.digits = s.entry.digits === '0' ? String(action.digit) : s.entry.digits + action.digit;
  }
  if (action.type === 'toggleSign') s.entry.negative = !s.entry.negative;
  if (action.type === 'backspace') s.entry.digits = s.entry.digits.slice(0, -1);
  return s;
}
