// One Lasso problem's walk through its steps, as a pure reducer (like
// engine/session.js for Flip It). Whole-number groups for now; the fraction
// script (Whole → Split → Take → Count → Opposite) comes in Lasso step 4.

import { isFraction, isOpposite } from './groups.js';
import {
  validateGroups, validateGroupSign, validateGroup, validateFill, validateCount,
  validateOppositeAnswer, MAX_IN_LASSO, MAX_LASSOS,
} from './lassoMoves.js';
import { entryValue } from './session.js';

export const WHOLE_STEPS = [
  { id: 'groups', label: 'Groups' },
  { id: 'sign', label: '+ or −' },
  { id: 'fill', label: 'Fill' },
  { id: 'count', label: 'Count' },
  { id: 'opposite', label: 'Opposite' },
];

export function stepsFor(problem) {
  if (isFraction(problem)) throw new Error('Fraction groups arrive in Lasso step 4');
  return WHOLE_STEPS;
}

export function newLassoSession(problem) {
  stepsFor(problem); // fraction problems aren't playable yet
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
