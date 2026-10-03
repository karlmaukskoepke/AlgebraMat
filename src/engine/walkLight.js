// Light mode for the cards that have no targeted support yet (SPEC-SCAFFOLD.md §8), as a pure reducer around the
// card's own walk. The student types the answer; a wrong answer or I'm stuck hands the problem to the card's full
// step-by-step walk, with nothing lost. The tags of wrong answers go in the anonymous log.
//
//   light → type the answer, Check   (right on the first try: done, a clean answer)
//   walk  → the card's walk on the same problem
//   done  → typed right (a walk that finishes stays in 'walk', showing its own Next →)
//
// `card` (engine/lightCards.js plus the walk's pieces): { pad, check, answerText, newWalk, reduceWalk }.

import { emptySkills } from './skills.js';

export const MAX_ENTRY = { integer: 4, algebra: 20 };

export function newWalkLight(problem, card) {
  return {
    problem,
    stage: 'light',           // 'light' | 'walk'
    step: 'answer',           // the step bar's current step
    skipped: [],
    entry: '',
    wrongs: 0,                // wrong answers typed
    tag: null,
    tags: [],                 // every wrong answer's tag, for the log
    stuck: 0,                 // times I'm stuck was pressed
    walk: null,               // the card's session, once the full walk is on
    helped: false,            // the walk was brought in by a wrong answer or I'm stuck
    clean: false,             // right on the first try with no help (counts toward the streak)
    on: { ...emptySkills(), partyBattle: false, sign: false },
    answers: [],              // the wrong answers typed: { typed, tag }, for the log
    supportsShown: [],        // 'fullWalk' once the walk was brought in, for the log
    finalText: null,
    feedback: { key: 'wlIntro', params: { pad: card.pad } },
  };
}

const say = (s, key, params, bad = false) => { s.feedback = { key, params, bad }; return s; };

function bringInWalk(s, card, why) {
  s.helped = true;
  s.supportsShown.push('fullWalk');
  s.stage = 'walk';
  s.walk = card.newWalk(s.problem);
  s.step = s.walk.step;
  s.skipped = s.walk.skipped;
  s.entry = '';
  return say(s, why);
}

export function reduceWalkLight(state, action, card) {
  if (state.stage === 'walk') {
    const walk = card.reduceWalk(state.walk, action);
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
  const max = MAX_ENTRY[card.pad];
  switch (action.type) {
    case 'digit':
      if (!Number.isInteger(action.digit) || action.digit < 0 || action.digit > 9) return state;
      if (s.entry.replace('-', '').length >= max) return state;
      s.entry += String(action.digit);
      return s;
    case 'toggleSign':
      if (card.pad !== 'integer') return state;
      s.entry = s.entry.startsWith('-') ? s.entry.slice(1) : `-${s.entry}`;
      return s;
    case 'typeChar':
      if (card.pad === 'integer' ? !(action.ch === '-' && s.entry === '') : !['x', '+', '-'].includes(action.ch)) return state;
      if (s.entry.length >= max) return state;
      s.entry += action.ch;
      return s;
    case 'backspace':
      if (s.entry === '') return state;
      s.entry = s.entry.slice(0, -1);
      return s;

    case 'check': {
      const { correct, tag } = card.check(s.problem, s.entry);
      if (tag === 'unreadable') return say(s, s.entry === '' ? 'typeAnswer' : 'answerUnreadable', { pad: card.pad }, true);
      if (correct) {
        s.step = 'done';
        s.clean = s.wrongs === 0 && s.stuck === 0 && !s.helped;
        s.finalText = card.answerText(s.problem);
        s.stage = 'done';
        return say(s, 'wlCorrect', { answer: s.finalText });
      }
      s.wrongs += 1;
      s.tag = tag;
      s.tags.push(tag);
      s.answers.push({ typed: s.entry, tag });
      return bringInWalk(s, card, 'wlWalk');
    }

    case 'stuck':
      s.stuck += 1;
      return bringInWalk(s, card, 'wlStuck');

    default:
      return state;
  }
}
