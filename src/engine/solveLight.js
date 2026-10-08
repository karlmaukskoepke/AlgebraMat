// One-step equations in light mode as a pure reducer: type x. Check puts the typed answer back into the equation, so a
// wrong answer shows an unbalanced equation (the first support); then, one rung at a time for each wrong answer or
// I'm stuck: the equation as a balance of boxes and counters, then the undo (the same thing done to both sides), with
// the answer to finish. Teach me goes straight to the last. A right answer is checked the same way and shows it balances.

import { checkSolve, answerText, answerOf } from './solve.js';
import { typeInto, isTyping } from './entry.js';
import { emptySkills } from './skills.js';

export const LAST_RUNG = 3;
const SUPPORTS = ['', 'check', 'balance', 'undo'];

export function newSolveLight(problem) {
  return {
    problem,
    stage: 'light',            // 'light' (typing) | 'done'
    step: 'answer',
    skipped: [],
    entry: '',
    rung: 0,                   // 0 the equation, 1 your answer put in, 2 the balance, 3 the undo and the answer
    tried: null,               // the last answer typed (a number), for the check line
    wrongs: 0, tag: null, tags: [], stuck: 0, taught: 0,
    helped: false, clean: false,
    on: { ...emptySkills(), partyBattle: false, sign: false },
    answers: [], supportsShown: [],
    finalText: null,
    feedback: { key: 'sIntro' },
  };
}

const say = (s, key, params, bad = false) => { s.feedback = { key, params, bad }; return s; };

// The next rung, with the message for it. `lead` says what asked: a wrong answer (its tag), I'm stuck, or Teach me.
function moreHelp(s, lead, tag) {
  s.helped = true;
  let rung = lead === 'teach' ? LAST_RUNG : Math.min(s.rung + 1, LAST_RUNG);
  if (rung === 1 && s.tried === null) rung = 2;            // nothing typed yet, so nothing to put back in
  const fresh = rung !== s.rung;
  s.rung = rung;
  if (fresh && SUPPORTS[rung] && !s.supportsShown.includes(SUPPORTS[rung])) s.supportsShown.push(SUPPORTS[rung]);
  const form = { 'x+a': 'Plus', 'x-a': 'Minus', ax: 'ax', 'x/a': 'Over' }[s.problem.form];
  if (rung === 1) return say(s, lead === 'wrong' ? `sTag_${String(tag).replace(/-/g, '_')}` : 'sCheck', { form });
  if (rung === 2) return say(s, lead === 'wrong' ? 'sModelWrong' : 'sModel', { form });
  return say(s, lead === 'teach' ? 'sTeach' : 'sWork', { form });
}

export function reduceSolveLight(state, action) {
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
      const { correct, tag, typed, unreadable } = checkSolve(s.problem, s.entry);
      if (unreadable) return say(s, s.entry === '' || s.entry === '-' ? 'typeAnswer' : 'answerUnreadable', undefined, true);
      s.tried = typed;
      if (correct) {
        s.stage = 'done';
        s.step = 'done';
        s.clean = s.wrongs === 0 && s.stuck === 0 && s.taught === 0 && !s.helped;
        s.finalText = answerText(s.problem);
        return say(s, 'sCorrect', { answer: s.finalText });
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
