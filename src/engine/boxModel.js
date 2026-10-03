// Boxes & Circles' "read the model" round as a pure reducer (Karl, 2026-10-03). The student sees a picture of boxes,
// negative boxes and counters, in columns, and types the expression it shows (any expression worth the same: one term
// per column in order, or combined). No walk: a wrong answer gets the key (a box is x, a box with a dash is −x, a
// counter is +1 or −1); a second one (or Teach me) starts the language piece: "Column 1 has ____", four choices per
// column, a right one is read aloud and labels that column. After the last column all the labels stay and the student
// types the expression. I'm stuck while saying jumps to all the labels.

import { parseAnswer, prettyAnswer, evaluate, formatAnswer, numberText } from './terms.js';
import { typeInto, isTyping } from './entry.js';
import { tagTerms } from './lightCards.js';
import { emptySkills } from './skills.js';

// The column labels: what each column is worth, as a term ("2x", "−3").
export const columnLabels = (problem) => problem.terms.map((t) => (t.kind === 'x' ? numberText(t) : (t.value < 0 ? `−${-t.value}` : `${t.value}`)));

// The same, in words, for reading aloud: "two boxes, that's two x".
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
export function spokenColumn(problem, i) {
  const t = problem.terms[i];
  const n = Math.abs(t.value);
  const word = WORDS[n] ?? String(n);
  const neg = t.value < 0;
  const what = t.kind === 'x'
    ? `${word} ${neg ? 'negative ' : ''}${n === 1 ? 'box' : 'boxes'}, that's ${neg ? 'negative ' : ''}${n === 1 ? '' : `${word} `}x`
    : `${word} ${neg ? 'negative' : 'positive'} ${n === 1 ? 'counter' : 'counters'}, that's ${neg ? 'negative' : 'positive'} ${word}`;
  return `Column ${WORDS[i + 1]}: ${what}.`;
}
export const spokenModel = (problem) => problem.terms.map((_, i) => spokenColumn(problem, i)).join(' ');

// The language piece: what a column has, as a phrase to finish "Column 1 has ____" ("3 negative boxes").
const phrase = (kind, n, neg) => (kind === 'x'
  ? `${n} ${neg ? 'negative ' : ''}${n === 1 ? 'box' : 'boxes'}`
  : `${n} ${neg ? 'negative' : 'positive'} ${n === 1 ? 'counter' : 'counters'}`);
const WHY = {
  sign: (kind) => (kind === 'x'
    ? 'Look at the dash: a box with a dash is negative, a box without one is positive.'
    : 'Look at the counter: a + counter is positive, a − counter is negative.'),
  type: () => 'Boxes are x; counters are plain numbers. Which is in this column?',
  count: () => 'Count the pieces in that column again.',
};

// Four choices for one column: the right phrase and three slips (sign, box/counter, count), with the right one's
// place moved around by column. Each: { text, ok, why }.
export function columnChoices(problem, col) {
  const t = problem.terms[col];
  const n = Math.abs(t.value);
  const neg = t.value < 0;
  const list = [
    { text: phrase(t.kind, n, neg), ok: true },
    { text: phrase(t.kind, n, !neg), ok: false, why: WHY.sign(t.kind) },
    { text: phrase(t.kind === 'x' ? 'int' : 'x', n, neg), ok: false, why: WHY.type() },
    { text: phrase(t.kind, n === 1 ? 2 : n - 1, neg), ok: false, why: WHY.count() },
  ];
  const at = col % list.length;
  [list[0], list[at]] = [list[at], list[0]];
  return list;
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
    stage: 'light',            // 'light' (typing) | 'cloze' (saying each column) | 'done'
    step: 'answer',            // 'say' while stage is 'cloze'
    skipped: [],
    entry: '',
    hint: 0,                   // 0 nothing yet, 1 the key, 2 saying the columns, 3 every column labelled
    col: 0, said: [], misses: [],   // the language piece: the column being said, the ones done, the wrong picks
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

// Every column labelled and read aloud, and back to typing.
function showAll(s) {
  s.hint = 3;
  s.stage = 'light';
  s.step = 'answer';
  s.said = s.problem.terms.map((_, i) => i);
  s.supportsShown.push('labels');
  s.spoken = { id: (s.spoken?.id ?? 0) + 1, text: spokenModel(s.problem) };
  return say(s, 'bmLabels');
}

// The next hint: the key, then saying each column, then (asked again while saying) all the labels.
function moreHelp(s, lead) {
  s.helped = true;
  if (s.hint === 0) {
    s.hint = 1;
    s.supportsShown.push('key');
    return say(s, lead === 'wrong' ? 'bmKeyWrong' : 'bmKey');
  }
  if (s.hint === 1) {
    s.hint = 2;
    s.stage = 'cloze';
    s.step = 'say';
    s.col = 0;
    s.said = [];
    s.entry = '';
    s.supportsShown.push('say');
    return say(s, 'bmSay', { col: 1 });
  }
  if (s.hint === 2) return showAll(s);
  return say(s, 'bmLabels');
}

export function reduceBoxModel(state, action) {
  if (state.stage === 'done') return state;
  const s = structuredClone(state);
  if (s.stage === 'cloze' && action.type !== 'pick' && action.type !== 'stuck' && action.type !== 'teach') return state;
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
    case 'pick': {
      // `digit` carries the index of the choice.
      const choice = columnChoices(s.problem, s.col)[action.digit];
      if (!choice) return state;
      if (!choice.ok) {
        s.misses.push({ col: s.col, text: choice.text });
        return say(s, 'bmPickWrong', { why: choice.why }, true);
      }
      s.said.push(s.col);
      s.spoken = { id: (s.spoken?.id ?? 0) + 1, text: spokenColumn(s.problem, s.col) };
      if (s.col + 1 >= s.problem.terms.length) {
        s.hint = 3;
        s.stage = 'light';
        s.step = 'answer';
        s.supportsShown.push('labels');
        return say(s, 'bmLabels');
      }
      s.col += 1;
      return say(s, 'bmSayNext', { said: choice.text, label: columnLabels(s.problem)[s.col - 1], col: s.col + 1 });
    }
    case 'stuck':
      s.stuck += 1;
      return moreHelp(s, 'stuck');
    case 'teach':
      s.taught += 1;
      s.hint = Math.max(s.hint, 1);          // the language piece at once (or, already there, every label)
      return moreHelp(s, 'teach');
    default:
      return state;
  }
}
