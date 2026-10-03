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
    stage: 'light',           // 'light' | 'support' | 'walk'
    step: 'answer',           // the step bar's current step
    skipped: [],
    entry: '',
    wrongs: 0,                // wrong answers typed
    tag: null,
    tags: [],                 // every wrong answer's tag, for the log
    stuck: 0,                 // times I'm stuck was pressed
    taught: 0,                // times Teach me step-by-step was pressed
    walk: null,               // the card's session, once the full walk is on
    support: null,            // the support showing now: 'cloze' (a sign mistake, on cards that have one) | null
    cloze: null,              // { sentence, choices: [{ text, right, reason, index }], tried: [index] }
    said: null,               // once the right choice is picked: { sentence }, kept while the student types
    clozeUsed: false,         // the closed passage is a first rung only
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
  // The walk's own first instruction, led by why it's here ("Not quite.", "No problem.").
  s.feedback = { ...s.walk.feedback, src: 'walk', lead: why };
  return s;
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
  if (state.stage === 'support' && !['pickChoice', 'stuck', 'teach'].includes(action.type)) return state;
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

    // The closed passage (a sign mistake on a card that has one): a wrong pick says what is off and is crossed out;
    // the right one goes back to typing.
    case 'pickChoice': {
      if (s.stage !== 'support' || s.support !== 'cloze') return state;
      const choice = s.cloze.choices[action.index];
      if (!choice || s.cloze.tried.includes(choice.index)) return state;
      if (!choice.right) {
        s.cloze.tried.push(choice.index);
        return say(s, 'wlClozeNo', { reason: choice.reason }, true);
      }
      s.said = { sentence: s.cloze.sentence.replace('____', choice.text) };
      s.cloze = null;
      s.stage = 'light';
      s.support = null;
      s.step = 'answer';
      return say(s, 'wlClozeRight', { text: choice.text });
    }

    case 'check': {
      if (s.stage !== 'light') return state;
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
      // A sign mistake on a card with a closed passage gets it first; any other miss (or a second one) the full walk.
      if (card.signCloze && !s.clozeUsed && (tag === 'sign-dropped' || tag === 'wrong-winner')) {
        const { sentence, choices } = card.signCloze(s.problem);
        s.clozeUsed = true;
        s.helped = true;
        s.supportsShown.push('cloze');
        s.stage = 'support';
        s.support = 'cloze';
        s.cloze = { sentence, choices, tried: [] };
        s.step = 'cloze';
        s.entry = '';
        return say(s, 'wlCloze');
      }
      return bringInWalk(s, card, 'wlWalk');
    }

    case 'stuck':
      if (s.stage === 'support') s.cloze = null;
      s.stuck += 1;
      return bringInWalk(s, card, 'wlStuck');

    // Teach me step-by-step: the full walk at once.
    case 'teach':
      s.cloze = null;
      s.taught += 1;
      return bringInWalk(s, card, 'wlTeach');

    default:
      return state;
  }
}
