// Combine it's Level 4 (SPEC-COMBINE.md §3): big numbers (11 to 60), no counters. The student circles each
// term with its sign in front, then reasons it out:
//
//   two terms:   Circle → Party or Battle? → Add or Subtract? → Sign → Answer
//   three terms: Circle → Combine → Party or Battle? → Add or Subtract? → Sign → Answer
//
// With three terms, the two that share a sign are combined first (a party), which leaves two numbers of
// different signs: a battle. The Circle step is Boxes & Circles' (engine/termSession.js), so its shapes,
// drag and checks are reused as they are; this file adds the steps after it. Pure logic, no DOM.

import { newTermSession, reduceTerms } from './termSession.js';
import { effective, prettyAnswer, parseAnswer } from './terms.js';
import { combineFirst, meeting } from './combine.js';

export const isBig = (problem) => problem.mode === 'integers-big';

export const BIG_STEPS = {
  boxcircle: 'Circle', combine: 'Combine', partyBattle: 'Party or Battle?', addSub: 'Add or Subtract?', sign: 'Sign', answer: 'Answer',
};

export const hasCombine = (problem) => problem.terms.length === 3;

export function bigSteps(problem) {
  const ids = ['boxcircle', ...(hasCombine(problem) ? ['combine'] : []), 'partyBattle', 'addSub', 'sign', 'answer'];
  return ids.map((id) => ({ id, label: BIG_STEPS[id] }));
}

// The two numbers that meet: the two terms themselves, or (three terms) the combined pair and the other.
export function meetingNumbers(problem) {
  const values = problem.terms.map(effective);
  if (!hasCombine(problem)) return { a: values[0], b: values[1] };
  const c = combineFirst(problem);
  return { a: c.partial, b: values[c.other], pair: c.pair, other: c.other, partial: c.partial };
}

// What the answer is, and each step's right answer.
export const bigAnswer = (problem) => problem.terms.reduce((sum, t) => sum + effective(t), 0);
export const rightChoice = (problem) => { const { a, b } = meetingNumbers(problem); return meeting(a, b); };
export const rightOp = (problem) => (rightChoice(problem) === 'party' ? 'add' : 'subtract');
export function rightSign(problem) {
  const { a, b } = meetingNumbers(problem);
  const winner = rightChoice(problem) === 'party' || Math.abs(a) > Math.abs(b) ? a : b;
  return winner < 0 ? '-' : '+';
}

export const MAX_BIG_ENTRY = 5;

export function newBigSession(problem) {
  return {
    ...newTermSession(problem),
    tool: 'circle',              // only circles: every term is a number
    picked: [],                  // Combine: the terms tapped
    choice: null,                // 'party' | 'battle'
    op: null,                    // 'add' | 'subtract'
    sign: null,                  // '+' | '-'
    feedback: { key: 'bigCircleIntro' },
  };
}

const clone = (s) => structuredClone(s);
const say = (s, res) => { s.feedback = { key: res.feedbackKey, params: res.params, bad: !res.ok }; return s; };
const wrong = (s, res) => { s.tries[s.step] = (s.tries[s.step] ?? 0) + 1; return say(s, res); };
const note = (s, key, params) => { s.feedback = { key, params }; return s; };

// What's typed: a whole number, with a − for negative (the pad's − key, or the keyboard's -).
const typedValue = (text) => {
  const r = parseAnswer(text);
  return r.ok && r.terms.length === 1 && r.terms[0].kind === 'int' && r.n !== 0 ? r.n : null;
};

export function reduceBig(state, action) {
  const problem = state.problem;

  // ① Circle: Boxes & Circles' step, then on to Combine or Party or Battle.
  if (state.step === 'boxcircle') {
    const next = reduceTerms(state, action);
    if (next !== state && action.type === 'check' && next.step === 'draw') {
      next.step = hasCombine(problem) ? 'combine' : 'partyBattle';
      return note(next, hasCombine(problem) ? 'bigCombineIntro' : 'bigPartyIntro');
    }
    return next;
  }

  const s = clone(state);

  switch (action.type) {
    // ② Combine (three terms): tap the two that share a sign, then type what they come to.
    case 'tapTerm': {
      if (s.step !== 'combine' || !Number.isInteger(action.term) || action.term < 0 || action.term >= problem.terms.length) return state;
      const at = s.picked.indexOf(action.term);
      if (at >= 0) s.picked.splice(at, 1);
      else if (s.picked.length >= 2) return note(s, 'twoOnly');
      else s.picked.push(action.term);
      s.picked.sort((x, y) => x - y);
      return note(s, 'bigCombineIntro');
    }

    case 'digit': {
      if (!['combine', 'answer'].includes(s.step) || !Number.isInteger(action.digit) || action.digit < 0 || action.digit > 9) return state;
      if (s.entry.length >= MAX_BIG_ENTRY) return state;
      s.entry += String(action.digit);
      return s;
    }

    case 'typeChar': {
      if (!['combine', 'answer'].includes(s.step) || action.ch !== '-' || s.entry.length >= MAX_BIG_ENTRY) return state;
      s.entry += '-';
      return s;
    }

    case 'backspace': {
      if (!['combine', 'answer'].includes(s.step) || s.entry === '') return state;
      s.entry = s.entry.slice(0, -1);
      return s;
    }

    // ③ Party or Battle?
    case 'choose': {
      if (s.step !== 'partyBattle' || !['party', 'battle'].includes(action.choice)) return state;
      if (action.choice !== rightChoice(problem)) return wrong(s, { ok: false, feedbackKey: 'sameOrDifferent' });
      s.choice = action.choice;
      s.step = 'addSub';
      return note(s, action.choice === 'party' ? 'bigPartyOk' : 'bigBattleOk');
    }

    // ④ Add or Subtract?
    case 'chooseOp': {
      if (s.step !== 'addSub' || !['add', 'subtract'].includes(action.op)) return state;
      if (action.op !== rightOp(problem)) return wrong(s, { ok: false, feedbackKey: 'bigOpOff', params: { choice: s.choice } });
      s.op = action.op;
      s.step = 'sign';
      return note(s, s.choice === 'party' ? 'bigSignParty' : 'bigSignBattle');
    }

    // ⑤ Sign
    case 'chooseSign': {
      if (s.step !== 'sign' || !['+', '-'].includes(action.sign)) return state;
      if (action.sign !== rightSign(problem)) return wrong(s, { ok: false, feedbackKey: 'bigSignOff', params: { choice: s.choice } });
      s.sign = action.sign;
      s.step = 'answer';
      s.entry = '';
      return note(s, 'bigAnswerIntro');
    }

    case 'check': {
      if (s.step === 'combine') {
        const c = combineFirst(problem);
        if (s.picked.length < 2) return note(s, 'pickTwo');
        if (s.picked[0] !== c.pair[0] || s.picked[1] !== c.pair[1]) return wrong(s, { ok: false, feedbackKey: 'wrongPair' });
        const value = typedValue(s.entry);
        if (value === null) return note(s, 'typeCombine');
        if (value !== c.partial) return wrong(s, { ok: false, feedbackKey: 'combineOff' });
        s.step = 'partyBattle';
        s.entry = '';
        return note(s, 'combineDone');
      }
      if (s.step === 'answer') {
        const value = typedValue(s.entry);
        if (s.entry === '') return say(s, { ok: false, feedbackKey: 'typeAnswer' });
        if (value === null) return wrong(s, { ok: false, feedbackKey: 'answerUnreadable' });
        const want = bigAnswer(problem);
        if (value !== want) {
          // The size can be right with the wrong sign; say which (never the number).
          const sizeRight = Math.abs(value) === Math.abs(want);
          return wrong(s, { ok: false, feedbackKey: sizeRight ? 'bigAnswerSign' : 'bigAnswerSize', params: { op: s.op, sign: s.sign } });
        }
        s.finalText = prettyAnswer(s.entry);
        s.step = 'done';
        return say(s, { ok: true, feedbackKey: 'correct', params: { answer: want < 0 ? `−${-want}` : `${want}` } });
      }
      return state;
    }

    default:
      return state;
  }
}
