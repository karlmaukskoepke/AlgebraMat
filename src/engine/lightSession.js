// One Combine it problem in light mode (SPEC-SCAFFOLD.md §2 and §4), as a pure reducer. The student types the
// answer; a wrong answer (or I'm stuck) brings in a support, and the full step-by-step walk is the last rung.
//
//   light  → type the answer, Check          (right on the first try: done, a clean answer)
//   support→ the party-or-battle question    (then back to typing)
//   walk   → today's Draw → Party or Battle → Cancel → Answer, on the same problem
//
// The cloze (the sign support) comes in the next build; until then a sign mistake gets the party-or-battle
// question, the smallest support.

import { evaluate } from './expr.js';
import { newCombineSession } from './combineSession.js';
import { reduce as reduceWalk } from './session.js';
import { validatePartyBattle } from './moves.js';
import { classify, firstSupport, nextRung } from './scaffold.js';

export const MAX_LIGHT_LENGTH = 4;

// Supports built so far. Others fall back to the party-or-battle question.
const BUILT = new Set(['partyBattle', 'fullWalk']);
const resolve = (kind) => (BUILT.has(kind) ? kind : 'partyBattle');

export function newLightSession(problem) {
  return {
    problem,
    stage: 'light',            // 'light' | 'support' | 'walk' | 'done'
    step: 'answer',            // the step bar's current step
    skipped: [],
    entry: '',
    support: null,             // the support showing now: 'partyBattle' | null
    lastSupport: null,         // the last rung used on this problem
    wrongs: 0,                 // wrong answers typed
    tag: null,                 // what the latest wrong answer looked like (engine/scaffold.js)
    tags: [],                  // every wrong answer's tag, for the log
    stuck: 0,                  // times I'm stuck was pressed
    walk: null,                // Flip It's session, when the full walk is on
    clean: false,              // right on the first try with no support: counts toward fading a support
    finalText: null,
    feedback: { key: 'lightIntro' },
  };
}

const say = (s, key, params, bad = false) => { s.feedback = { key, params, bad }; return s; };

// Bring in the next support: the first for this mistake, or the next rung once one has been used.
function bringIn(s, tag) {
  const kind = resolve(s.lastSupport ? nextRung(s.lastSupport) : firstSupport(tag));
  s.lastSupport = kind;
  if (kind === 'fullWalk') {
    s.stage = 'walk';
    s.walk = newCombineSession(s.problem);
    s.step = s.walk.step;
    s.skipped = s.walk.skipped;
    return say(s, 'lightWalk', undefined);
  }
  s.stage = 'support';
  s.support = kind;
  s.step = 'partyBattle';
  return say(s, 'lightPartyBattle', { a: s.problem.left.value, b: s.problem.right.value });
}

export function reduceLight(state, action) {
  if (state.stage === 'walk') {
    const walk = reduceWalk(state.walk, action);
    if (walk === state.walk) return state;
    const s = { ...state, walk };
    s.step = walk.step;
    s.skipped = walk.skipped;
    s.feedback = { ...walk.feedback, src: 'walk' };
    if (walk.step === 'done') s.finalText = walk.finalText ?? null;
    return s;
  }
  if (state.stage === 'done') return state;

  const s = structuredClone(state);
  switch (action.type) {
    // The pad (Flip It's: ± flips a leading minus).
    case 'digit':
      if (s.stage !== 'light' || !Number.isInteger(action.digit) || action.digit < 0 || action.digit > 9) return state;
      if (s.entry.replace('-', '').length >= MAX_LIGHT_LENGTH) return state;
      s.entry += String(action.digit);
      return s;
    case 'toggleSign':
      if (s.stage !== 'light') return state;
      s.entry = s.entry.startsWith('-') ? s.entry.slice(1) : `-${s.entry}`;
      return s;
    case 'typeChar':
      if (s.stage !== 'light' || action.ch !== '-' || s.entry !== '') return state;
      s.entry = '-';
      return s;
    case 'backspace':
      if (s.stage !== 'light' || s.entry === '') return state;
      s.entry = s.entry.slice(0, -1);
      return s;

    case 'check': {
      if (s.stage !== 'light') return state;
      const { correct, tag } = classify(s.problem, s.entry);
      if (tag === 'unreadable') return say(s, s.entry === '' ? 'typeAnswer' : 'answerUnreadable', undefined, true);
      if (correct) {
        s.stage = 'done';
        s.step = 'done';
        s.clean = s.wrongs === 0 && s.stuck === 0 && !s.lastSupport;
        s.finalText = String(evaluate(s.problem));
        return say(s, 'lightCorrect', { answer: s.finalText });
      }
      s.wrongs += 1;
      s.tag = tag;
      s.tags.push(tag);
      s.entry = '';
      return bringIn(s, tag);
    }

    // I'm stuck: the smallest support first, then the next rung each time.
    case 'stuck': {
      if (s.stage !== 'light' && s.stage !== 'support') return state;
      s.stuck += 1;
      s.entry = '';
      return bringIn(s, s.tag);
    }

    // The party-or-battle question, as a support.
    case 'choose': {
      if (s.stage !== 'support' || s.support !== 'partyBattle') return state;
      const res = validatePartyBattle(s.problem, action.choice);
      if (!res.ok) return say(s, 'lightSameOrDifferent', undefined, true);
      s.stage = 'light';
      s.support = null;
      s.step = 'answer';
      return say(s, action.choice === 'party' ? 'lightPartyOk' : 'lightBattleOk');
    }

    default:
      return state;
  }
}

