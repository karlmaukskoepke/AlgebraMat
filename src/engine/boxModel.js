// Boxes & Circles' "read the model" round as a pure reducer (Karl, 2026-10-03). The student sees a picture of boxes,
// negative boxes and counters, in columns, and types the expression it shows (any expression worth the same: one term
// per column in order, or combined). No walk: a wrong answer gets the key (a box is x, a box with a dash is −x, a
// counter is +1 or −1) and a second one labels each column with what it is worth, read aloud. Teach me does that at once.

import { parseAnswer, prettyAnswer, evaluate, formatAnswer, numberText } from './terms.js';
import { typeInto, isTyping } from './entry.js';
import { tagTerms } from './lightCards.js';
import { emptySkills } from './skills.js';

// The column labels: what each column is worth, as a term ("2x", "−3").
export const columnLabels = (problem) => problem.terms.map((t) => (t.kind === 'x' ? numberText(t) : (t.value < 0 ? `−${-t.value}` : `${t.value}`)));

// The same, in words, for reading aloud: "two boxes, that's two x".
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
export function spokenModel(problem) {
  return problem.terms.map((t, i) => {
    const n = Math.abs(t.value);
    const word = WORDS[n] ?? String(n);
    const neg = t.value < 0;
    const what = t.kind === 'x'
      ? `${word} ${neg ? 'negative ' : ''}${n === 1 ? 'box' : 'boxes'}, that's ${neg ? 'negative ' : ''}${n === 1 ? '' : `${word} `}x`
      : `${word} ${neg ? 'negative' : 'positive'} ${n === 1 ? 'counter' : 'counters'}, that's ${neg ? 'negative' : 'positive'} ${word}`;
    return `Column ${WORDS[i + 1]}: ${what}.`;
  }).join(' ');
}

// What a typed answer is: right when it's worth the same as the model (any order, combined or not).
export function checkModel(problem, text) {
  const read = parseAnswer(text);
  if (!read.ok) return { correct: false, tag: 'unreadable' };
  const want = evaluate(problem);
  if (read.x === want.x && read.n === want.n) {
    return read.terms.some((t) => t.value === 0) ? { correct: false, tag: 'zero-term' } : { correct: true, tag: null };
  }
  return { correct: false, tag: tagTerms(want, read) };
}

export const modelAnswer = (problem) => formatAnswer(evaluate(problem));

export function newBoxModel(problem) {
  return {
    problem,
    stage: 'light',            // 'light' (typing) | 'done'
    step: 'answer',
    skipped: [],
    entry: '',
    hint: 0,                   // 0 nothing yet, 1 the key, 2 each column labelled
    wrongs: 0, tag: null, tags: [], stuck: 0, taught: 0,
    helped: false, clean: false,
    on: { ...emptySkills(), partyBattle: false, sign: false },
    answers: [], supportsShown: [],
    spoken: null,              // what to read aloud now: { id, text } (the view speaks it when the id changes)
    finalText: null,
    feedback: { key: 'bmIntro' },
  };
}

const say = (s, key, params, bad = false) => { s.feedback = { key, params, bad }; return s; };

// The next hint: the key, then the labels (read aloud). Further asks keep the labels.
function moreHelp(s, lead) {
  s.helped = true;
  if (s.hint === 0) {
    s.hint = 1;
    s.supportsShown.push('key');
    return say(s, lead === 'wrong' ? 'bmKeyWrong' : 'bmKey');
  }
  if (s.hint === 1) {
    s.hint = 2;
    s.supportsShown.push('labels');
    s.spoken = { id: (s.spoken?.id ?? 0) + 1, text: spokenModel(s.problem) };
  }
  return say(s, 'bmLabels');
}

export function reduceBoxModel(state, action) {
  if (state.stage === 'done') return state;
  const s = structuredClone(state);
  if (isTyping(action)) {
    const entry = typeInto(s.entry, action, 'algebra');
    if (entry === s.entry) return state;
    s.entry = entry;
    return s;
  }
  switch (action.type) {
    case 'check': {
      const { correct, tag } = checkModel(s.problem, s.entry);
      if (tag === 'unreadable') return say(s, s.entry === '' ? 'typeAnswer' : 'answerUnreadable', undefined, true);
      if (tag === 'zero-term') return say(s, 'bmZeroTerm', undefined, true);      // right, with a zero term left in: nothing wrong
      if (correct) {
        s.stage = 'done';
        s.step = 'done';
        s.clean = s.wrongs === 0 && s.stuck === 0 && s.taught === 0 && !s.helped;
        s.finalText = prettyAnswer(s.entry);
        return say(s, 'bmCorrect', { answer: modelAnswer(s.problem) });
      }
      s.wrongs += 1;
      s.tag = tag;
      s.tags.push(tag);
      s.answers.push({ typed: s.entry, tag });
      s.entry = '';
      return moreHelp(s, 'wrong');
    }
    case 'stuck':
      s.stuck += 1;
      return moreHelp(s, 'stuck');
    case 'teach':
      s.taught += 1;
      s.hint = Math.max(s.hint, 1);          // the labels at once
      return moreHelp(s, 'teach');
    default:
      return state;
  }
}
