// One Distribute, then combine problem's walk through its steps, as a pure reducer (SPEC-DISTRIBUTE.md §3).
// It runs two sessions it already has and one new step between them:
//
//   ① distribute   Groups of Terms on the group: Groups → + or − → Fill → Flip → Answer → Check it
//                  Write it: the whole line with the group opened
//   ② combine      Boxes & Circles on that line: Box & Circle → Draw → Cancel → Answer
//
// `stage` says which is running ('tg', 'line', 'ts'); `step` is the active step's id, so the shared play
// screen's step bar, dots and controls read this session like any other. Round 1 has one group.

import { groupParts, groupOf, distributedExpression, distributedText } from './distribute.js';
import { newTermGroupSession, reduceTermGroups, stepsFor } from './termGroupSession.js';
import { newTermSession, reduceTerms, termSteps } from './termSession.js';
import { validateLine } from './distributeMoves.js';
import { answerText as groupAnswerText } from './termGroups.js';

export const LINE_STEP = { id: 'line', label: 'Write it' };
export const MAX_LINE_LENGTH = 24;
// The opened line runs on Boxes & Circles' steps with no Rewrite (the sign stays on its operation).
export const COMBINE_LEVEL = 3;

export const openedProblem = (problem) => ({ ...distributedExpression(problem), level: COMBINE_LEVEL });

// The group being opened, as a Groups of Terms problem.
export const groupProblem = (problem) => groupOf(groupParts(problem)[0]);

export function newDistributeSession(problem) {
  const tg = newTermGroupSession(groupProblem(problem));
  return sync({ problem, stage: 'tg', tg, line: '', ts: null, finalText: null, tries: {}, step: tg.step, skipped: [], feedback: null });
}

// The steps strip shows the active phase's steps.
export function distributeSteps(s) {
  return s.stage === 'ts' ? termSteps(s.ts.problem) : [...stepsFor(s.tg.problem), LINE_STEP];
}
export const phaseLabel = (s) => (s.stage === 'ts' ? '② combine' : '① distribute');

// Copy the active sub-session's step, skipped steps and message onto the top level.
function sync(s) {
  if (s.stage === 'tg') {
    s.step = s.tg.step;
    s.skipped = s.tg.skipped;
    s.feedback = { ...s.tg.feedback, src: 'tg' };
  } else if (s.stage === 'line') {
    s.step = 'line';
    s.skipped = s.tg.skipped;
  } else {
    s.step = s.ts.step;
    s.skipped = s.ts.skipped;
    s.finalText = s.ts.finalText;
    s.feedback = { ...s.ts.feedback, src: s.ts.feedback?.src ?? 'ts' };
  }
  return s;
}

const say = (s, res) => { s.feedback = { key: res.feedbackKey, params: res.params, bad: !res.ok, src: 'dist' }; return s; };

export function reduceDistribute(state, action) {
  if (state.stage === 'tg') {
    if (action.type === 'continue') {
      if (state.tg.step !== 'checkit') return state;
      const s = { ...state, stage: 'line', line: '' };
      sync(s);
      s.feedback = { key: 'lineIntro', params: { group: groupAnswerText(state.tg.problem) }, src: 'dist' };
      return s;
    }
    const tg = reduceTermGroups(state.tg, action);
    return tg === state.tg ? state : sync({ ...state, tg });
  }

  if (state.stage === 'line') {
    const s = { ...state, tries: { ...state.tries } };
    switch (action.type) {
      case 'digit':
        if (!Number.isInteger(action.digit) || action.digit < 0 || action.digit > 9 || s.line.length >= MAX_LINE_LENGTH) return state;
        s.line += String(action.digit);
        return s;
      case 'typeChar':
        if (!['x', '+', '-'].includes(action.ch) || s.line.length >= MAX_LINE_LENGTH) return state;
        s.line += action.ch;
        return s;
      case 'backspace':
        if (s.line === '') return state;
        s.line = s.line.slice(0, -1);
        return s;
      case 'check': {
        const res = validateLine(s.problem, s.line);
        if (!res.ok) {
          if (res.feedbackKey !== 'typeAnswer') s.tries.line = (s.tries.line ?? 0) + 1;
          return say(s, res);
        }
        s.stage = 'ts';
        s.ts = newTermSession(openedProblem(s.problem));
        s.ts.feedback = { key: 'lineOk', params: { line: distributedText(s.problem) }, src: 'dist' };
        return sync(s);
      }
      default:
        return state;
    }
  }

  const ts = reduceTerms(state.ts, action);
  return ts === state.ts ? state : sync({ ...state, ts });
}

