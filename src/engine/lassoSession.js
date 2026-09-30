// One Group It problem's walk through its steps, as a pure reducer (like
// engine/session.js for Flip It). Two scripts (SPEC-LASSO.md §3):
//   whole-number groups: Groups → + or − → Fill → Flip → Count
//   fraction groups:     Groups → + or − → Fill → Take → Flip → Count
// Flip is skipped for + groups. Counting comes last, after any flip, so the
// number counted is the answer (Karl's revision).

import { isFraction, isOpposite } from './groups.js';
import {
  validateHiddenOne, validateGroups, validateGroupSign, validateFill, validateDeal, validateTake, validateCount,
  MAX_PER_GROUP, MAX_GROUPS_MADE, MAX_PARTS, MAX_DEALT,
} from './lassoMoves.js';
import { entryValue } from './session.js';

export const WHOLE_STEPS = [
  { id: 'groups', label: 'Groups' },
  { id: 'sign', label: '+ or −' },
  { id: 'fill', label: 'Fill' },
  { id: 'flip', label: 'Flip' },
  { id: 'count', label: 'Count' },
];

export const FRACTION_STEPS = [
  { id: 'groups', label: 'Groups' },
  { id: 'sign', label: '+ or −' },
  { id: 'fill', label: 'Fill' },
  { id: 'take', label: 'Take' },
  { id: 'flip', label: 'Flip' },
  { id: 'count', label: 'Count' },
];

export const stepsFor = (problem) => (isFraction(problem) ? FRACTION_STEPS : WHOLE_STEPS);

export function newLassoSession(problem) {
  const fraction = isFraction(problem);
  return {
    problem,
    script: fraction ? 'fraction' : 'whole',
    step: 'groups',
    skipped: [],
    wroteOne: !problem.hidden1,  // −(B) problems start with the 1 unwritten: the student types it
    // Whole numbers: separate groups. Fractions: the parts of one bar.
    // Terms stay as drawn; a flipped group is redrawn (opposite signs) beside the original.
    groups: [],                  // [{ terms: [{ kind: 'int', sign }], taken, flipped }]
    opposite: false,             // − groups, once chosen in step ②
    history: [],                 // group indices filled, newest last (for Undo)
    drawSign: null,
    answer: null,
    entry: { negative: false, digits: '' },
    tries: {},
    feedback: { key: problem.hidden1 ? 'groupsIntroHidden' : fraction ? 'partsIntro' : 'groupsIntro', params: { d: problem.count.d } },
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

// The hidden 1 in −(B) is typed in step ①, before any group can be made.
export const oneOpen = (s) => s.step === 'groups' && s.problem.hidden1 && !s.wroteOne;

// The pad works in Count, and in Groups while the hidden 1 is still to type.
const padOpen = (s) => s.step === 'count' || oneOpen(s);

// Fractions deal one counter into each part in turn, top to bottom, then around again.
export const nextPart = (s) => s.history.length % Math.max(1, s.groups.length);

// The groups that flip: every group, or in a fraction the parts taken.
export const flippable = (s) => s.groups.map((g, i) => i).filter((i) => s.script === 'whole' || s.groups[i].taken);

function toCount(s, key, params) {
  s.step = 'count';
  s.entry = emptyEntry();
  return note(s, key, params);
}

// After Fill (whole) or Take (fraction): flip opposite groups, else count.
function afterFilled(s, res) {
  say(s, res);
  if (s.opposite) { s.step = 'flip'; return s; }
  s.skipped.push('flip');
  s.step = 'count';
  s.entry = emptyEntry();
  return s;
}

function flipGroup(s, i) {
  const g = s.groups[i];
  if (!g || g.flipped || !flippable(s).includes(i)) return false;
  g.flipped = true;
  return true;
}

const allFlipped = (s) => flippable(s).every((i) => s.groups[i].flipped);

export function reduceLasso(state, action) {
  const s = clone(state);
  const { problem } = s;
  const fraction = s.script === 'fraction';

  switch (action.type) {
    case 'addGroup': {
      if (s.step !== 'groups') return state;
      if (!s.wroteOne) return wrong(s, { ok: false, feedbackKey: 'writeOneFirst' });
      if (s.groups.length >= (fraction ? MAX_PARTS : MAX_GROUPS_MADE)) return note(s, 'tooManyGroups');
      s.groups.push({ terms: [], taken: false, flipped: false });
      return s;
    }

    case 'tapGroup': {
      const i = action.index;
      const g = s.groups[i];
      if (!g) return state;

      if (s.step === 'groups') { // tapping a group erases it
        s.groups.splice(i, 1);
        return s;
      }
      if (s.step === 'fill') {
        if (!s.drawSign) return note(s, 'pickSignFirst');
        if (fraction) {
          if (i !== nextPart(s)) return note(s, 'dealHere');
          if (s.history.length >= MAX_DEALT) return note(s, 'groupFull');
        } else if (g.terms.length >= MAX_PER_GROUP) return note(s, 'groupFull');
        g.terms.push({ kind: 'int', sign: s.drawSign });
        s.history.push(i);
        return note(s, fraction ? 'dealIntro' : 'fillIntro');
      }
      if (s.step === 'take') {
        g.taken = !g.taken;
        return note(s, 'takeIntro', { n: problem.count.n });
      }
      if (s.step === 'flip') return reduceLasso(state, { type: 'flipGroup', index: i });
      return state;
    }

    case 'pickSign': {
      if (s.step !== 'fill') return state;
      s.drawSign = action.sign;
      return s;
    }

    case 'undo': { // takes back the latest counter
      if (s.step !== 'fill' || s.history.length === 0) return state;
      s.groups[s.history.pop()].terms.pop();
      return s;
    }

    case 'chooseSign': {
      if (s.step !== 'sign') return state;
      const res = validateGroupSign(problem, action.sign);
      if (!res.ok) return wrong(s, res);
      s.opposite = action.sign === '-';
      s.step = 'fill';
      return say(s, res);
    }

    // Flip: tap a group's − to flip that group (in a fraction bar, the one −
    // flips the parts taken), or Flip all for every one at once.
    case 'flipGroup':
    case 'flipAll': {
      if (s.step !== 'flip') return state;
      const targets = action.type === 'flipAll' || fraction ? flippable(s) : [action.index];
      if (!targets.map((i) => flipGroup(s, i)).some(Boolean)) return state;
      if (allFlipped(s)) return toCount(s, 'flipDone', { fraction });
      return note(s, 'flipMore');
    }

    case 'check': {
      if (s.step === 'groups' && oneOpen(s)) { // type the hidden 1, then Check
        const res = validateHiddenOne(entryValue(s.entry));
        if (!res.ok) return res.feedbackKey === 'typeOne' ? say(s, res) : wrong(s, res);
        s.wroteOne = true;
        s.entry = emptyEntry();
        return say(s, res);
      }
      if (s.step === 'groups') {
        const res = validateGroups(problem, { count: s.groups.length, wroteOne: s.wroteOne });
        if (!res.ok) return wrong(s, res);
        s.step = 'sign';
        return say(s, res);
      }
      if (s.step === 'fill') {
        const res = fraction ? validateDeal(problem, s.groups) : validateFill(problem, s.groups);
        if (!res.ok) return wrong(s, res);
        if (fraction) { s.step = 'take'; return say(s, res); }
        return afterFilled(s, res);
      }
      if (s.step === 'take') {
        const res = validateTake(problem, s.groups);
        if (!res.ok) return wrong(s, res);
        return afterFilled(s, res);
      }
      if (s.step === 'flip') return note(s, fraction ? 'tapFlipBar' : 'tapFlip');
      if (s.step === 'count') {
        const value = entryValue(s.entry);
        const res = validateCount(problem, value);
        if (!res.ok) return res.feedbackKey === 'typeAnswer' ? say(s, res) : wrong(s, res);
        s.answer = value;
        s.step = 'done';
        return say(s, res);
      }
      return state;
    }

    case 'digit': {
      if (!padOpen(s) || s.entry.digits.length >= (oneOpen(s) ? 1 : 2)) return state;
      s.entry.digits = s.entry.digits === '0' ? String(action.digit) : s.entry.digits + action.digit;
      return s;
    }

    case 'toggleSign': {
      if (s.step !== 'count') return state; // the hidden 1 is always positive
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
