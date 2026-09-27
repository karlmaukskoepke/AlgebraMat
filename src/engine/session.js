// One problem's walk through the five steps, as a pure reducer:
// reduce(state, action) → new state. The view renders the state and
// dispatches actions; all rules live in engine/moves.js.

import { isSubtraction, evaluate } from './expr.js';
import {
  validateRewrite, validateNothingToRewrite, validateDraw, validatePartyBattle,
  validatePair, isCancelComplete, validateAnswer,
} from './moves.js';
import { MAX_PER_ZONE } from './moves.js';

export const STEPS = ['rewrite', 'draw', 'partyBattle', 'cancel', 'answer'];

export function newSession(problem) {
  return {
    problem,
    step: 'rewrite',          // one of STEPS, or 'done'
    skipped: [],              // steps shown as done without doing them (Cancel on a Party)
    flips: { op: false, sign: false },
    drawSign: null,           // '+' | '-' chosen in the palette
    zones: [[], []],          // counters: { sign, canceled }
    tidy: false,              // true once Draw passes: lay counters out as a balanced grid
    choice: null,             // 'party' | 'battle' once chosen correctly
    selected: null,           // { zone, index } during Cancel
    entry: { negative: false, digits: '' },
    tries: {},                // wrong tries per step, for hints (Step 7)
    feedback: { key: 'rewriteIntro' },
    shake: null,              // { zone, index } of a rejected counter tap
  };
}

export function entryValue(entry) {
  if (entry.digits === '') return null;
  const n = parseInt(entry.digits, 10);
  return entry.negative ? -n : n;
}

const clone = (s) => structuredClone(s);

function say(s, res, extra = {}) {
  s.feedback = { key: res.feedbackKey, params: res.params, bad: !res.ok, ...extra };
  return s;
}

function wrong(s, res) {
  s.tries[s.step] = (s.tries[s.step] ?? 0) + 1;
  return say(s, res);
}

function advance(s, step) {
  s.step = step;
  s.selected = null;
  return s;
}

export function reduce(state, action) {
  const s = clone(state);
  s.shake = null;
  const { problem } = s;

  switch (action.type) {
    case 'flip': {
      if (s.step !== 'rewrite') return state;
      if (!isSubtraction(problem)) {
        return wrong(s, validateRewrite(problem, { ...s.flips, [action.part]: true }));
      }
      s.flips[action.part] = !s.flips[action.part];
      const res = validateRewrite(problem, s.flips);
      if (res.ok) return say(advance(s, 'draw'), res);
      return say(s, res, { bad: false });
    }

    case 'nothingToRewrite': {
      if (s.step !== 'rewrite') return state;
      const res = validateNothingToRewrite(problem);
      return res.ok ? say(advance(s, 'draw'), res) : wrong(s, res);
    }

    case 'pickSign': {
      if (s.step !== 'draw') return state;
      s.drawSign = action.sign;
      return s;
    }

    case 'tapZone': {
      if (s.step !== 'draw') return state;
      if (!s.drawSign) return say(s, { ok: false, feedbackKey: 'pickSignFirst' });
      const zone = s.zones[action.zone];
      if (zone.length >= MAX_PER_ZONE) return say(s, { ok: false, feedbackKey: 'zoneFull' });
      zone.push({ sign: s.drawSign, canceled: false });
      s.feedback = { key: 'drawIntro' };
      return s;
    }

    case 'tapCounter': {
      const { zone, index } = action;
      const counter = s.zones[zone]?.[index];
      if (!counter) return state;

      if (s.step === 'draw') {
        s.zones[zone].splice(index, 1);
        return s;
      }

      if (s.step !== 'cancel' || counter.canceled) return state;
      const sel = s.selected;
      if (!sel) {
        s.selected = { zone, index };
        s.feedback = { key: 'pickPartner', params: { sign: counter.sign } };
        return s;
      }
      if (sel.zone === zone && sel.index === index) {
        s.selected = null;
        return s;
      }
      const first = s.zones[sel.zone][sel.index];
      const res = validatePair(first, counter);
      if (!res.ok) {
        s.shake = { zone, index };
        return wrong(s, res);
      }
      first.canceled = true;
      counter.canceled = true;
      s.selected = null;
      if (isCancelComplete(s.zones)) return say(advance(s, 'answer'), { ok: true, feedbackKey: 'cancelDone' });
      return say(s, res);
    }

    case 'check': {
      if (s.step === 'draw') {
        const res = validateDraw(problem, s.zones);
        if (!res.ok) return wrong(s, res);
        s.tidy = true;
        return say(advance(s, 'partyBattle'), res);
      }
      if (s.step === 'answer') {
        const res = validateAnswer(problem, entryValue(s.entry));
        if (!res.ok) return res.feedbackKey === 'typeAnswer' ? say(s, res) : wrong(s, res);
        return say(advance(s, 'done'), res);
      }
      return state;
    }

    case 'choose': {
      if (s.step !== 'partyBattle') return state;
      const res = validatePartyBattle(problem, action.choice);
      if (!res.ok) return wrong(s, res);
      s.choice = action.choice;
      if (action.choice === 'party') {
        s.skipped.push('cancel');
        return say(advance(s, 'answer'), res);
      }
      // A Battle with nothing to cancel can't happen (both zones are nonempty
      // and of different signs), so Cancel always has at least one pair.
      return say(advance(s, 'cancel'), res);
    }

    case 'digit': {
      if (s.step !== 'answer') return state;
      if (s.entry.digits.length >= 2) return state;
      s.entry.digits = s.entry.digits === '0' ? String(action.digit) : s.entry.digits + action.digit;
      s.feedback = { key: 'answerIntro' };
      return s;
    }

    case 'toggleSign': {
      if (s.step !== 'answer') return state;
      s.entry.negative = !s.entry.negative;
      return s;
    }

    case 'backspace': {
      if (s.step !== 'answer') return state;
      s.entry.digits = s.entry.digits.slice(0, -1);
      return s;
    }

    default:
      return state;
  }
}

// Expected answer, for the celebration line.
export const answerOf = (state) => evaluate(state.problem);
