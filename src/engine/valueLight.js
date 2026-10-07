// Value it in light mode as a pure reducer: type the answer. A wrong answer (or I'm stuck) brings the next support, one
// rung at a time: the problem with x replaced by its value in parentheses; then the filled-box model, each box holding
// the value's counters, with what each term comes to; then the sum to finish. Teach me goes straight to the last.

import { checkValue, answerText, answerOf } from './value.js';
import { typeInto, isTyping } from './entry.js';
import { emptySkills } from './skills.js';

export const LAST_RUNG = 3;
const SUPPORTS = ['', 'substitute', 'model', 'work'];

export function newValueLight(problem) {
  return {
    problem,
    stage: 'light',            // 'light' (typing) | 'done'
    step: 'answer',
    skipped: [],
    entry: '',
    rung: 0,                   // 0 the problem, 1 x replaced by its value, 2 the filled boxes, 3 the sum
    wrongs: 0, tag: null, tags: [], stuck: 0, taught: 0,
    helped: false, clean: false,
    on: { ...emptySkills(), partyBattle: false, sign: false },
    answers: [], supportsShown: [],
    finalText: null,
    feedback: { key: 'vIntro' },
  };
}

const say = (s, key, params, bad = false) => { s.feedback = { key, params, bad }; return s; };

// The next rung, with the message for it. `lead` says what asked: a wrong answer (its tag), I'm stuck, or Teach me.
function moreHelp(s, lead, tag) {
  s.helped = true;
  const rung = lead === 'teach' ? LAST_RUNG : Math.min(s.rung + 1, LAST_RUNG);
  const fresh = rung !== s.rung;
  s.rung = rung;
  if (fresh && SUPPORTS[rung] && !s.supportsShown.includes(SUPPORTS[rung])) s.supportsShown.push(SUPPORTS[rung]);
  if (rung === 1) return say(s, lead === 'wrong' ? `vTag_${String(tag).replace(/-/g, '_')}` : 'vSubstitute', { sub: true });
  if (rung === 2) return say(s, lead === 'wrong' ? 'vModelWrong' : 'vModel');
  return say(s, lead === 'teach' ? 'vTeach' : 'vWork');
}

export function reduceValueLight(state, action) {
  if (state.stage === 'done') return state;
  const s = structuredClone(state);
  if (isTyping(action)) {
    const entry = typeInto(s.entry, action, 'integer');
    if (entry === s.entry) return state;
    s.entry = entry;
    return s;
  }
  switch (action.type) {
    case 'check': {
      const { correct, tag, unreadable } = checkValue(s.problem, s.entry);
      if (unreadable) return say(s, s.entry === '' || s.entry === '-' ? 'typeAnswer' : 'answerUnreadable', undefined, true);
      if (correct) {
        s.stage = 'done';
        s.step = 'done';
        s.clean = s.wrongs === 0 && s.stuck === 0 && s.taught === 0 && !s.helped;
        s.finalText = answerText(s.problem);
        return say(s, 'vCorrect', { answer: s.finalText });
      }
      s.wrongs += 1;
      s.tag = tag;
      s.tags.push(tag);
      s.answers.push({ typed: s.entry, tag });
      s.entry = '';
      return moreHelp(s, 'wrong', tag);
    }
    case 'stuck':
      s.stuck += 1;
      return moreHelp(s, 'stuck');
    case 'teach':
      s.taught += 1;
      return moreHelp(s, 'teach');
    default:
      return state;
  }
}

export { answerOf };
