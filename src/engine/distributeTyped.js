// Rounds 4 and 5 of Distribute, then combine (SPEC-DISTRIBUTE.md §2, §5): the supports fade. There's no
// drawing: the student types the line with the groups opened, then the combined answer. Help comes as a
// hint after 3 wrong tries; in Round 4 a Show me button asks for it early. A hint shows the move and never
// makes it. Pure logic, no DOM; one session, as a reducer like the others.
//
//   Open it → Answer

import { effective, prettyAnswer, numberText } from './terms.js';
import { validateAnswer } from './termMoves.js';
import { validateLine } from './distributeMoves.js';
import { groupParts, groupOf, distributedExpression, distributedText, formatDistribute } from './distribute.js';
import { distributeLines } from './termGroups.js';
import { HINT_AFTER } from './hints.js';

export const TYPED_STEPS = [
  { id: 'open', label: 'Open it' },
  { id: 'answer', label: 'Answer' },
];
export const MAX_TYPED_LENGTH = 30;

// Round 4 can ask for help early; Round 5 only gets hints after wrong tries.
export const canShowMe = (problem) => problem.level === 4;

export function newTypedSession(problem) {
  return {
    problem,
    step: 'open',
    skipped: [],
    entry: '',
    openedText: null,      // the opened line, once it's right
    finalText: null,       // the answer, once it's right
    asked: false,          // Show me was pressed on this step
    everAsked: false,      // Show me was pressed on any step
    clean: false,          // right with no wrong try and no Show me (counts toward the streak)
    tries: {},
    feedback: { key: 'typedOpenIntro', src: 'dist' },
  };
}

const say = (s, res, src) => { s.feedback = { key: res.feedbackKey, params: res.params, bad: !res.ok, src }; return s; };

export function reduceTyped(state, action) {
  const s = structuredClone(state);
  const typing = s.step === 'open' || s.step === 'answer';
  switch (action.type) {
    case 'digit':
      if (!typing || !Number.isInteger(action.digit) || action.digit < 0 || action.digit > 9 || s.entry.length >= MAX_TYPED_LENGTH) return state;
      s.entry += String(action.digit);
      return s;
    case 'typeChar':
      if (!typing || !['x', '+', '-'].includes(action.ch) || s.entry.length >= MAX_TYPED_LENGTH) return state;
      s.entry += action.ch;
      return s;
    case 'backspace':
      if (!typing || s.entry === '') return state;
      s.entry = s.entry.slice(0, -1);
      return s;
    case 'showMe':
      if (!typing || !canShowMe(s.problem) || s.asked) return state;
      s.asked = true;
      s.everAsked = true;
      return s;
    case 'check': {
      if (s.step === 'open') {
        const res = validateLine(s.problem, s.entry);
        if (!res.ok) {
          if (res.feedbackKey !== 'typeAnswer') s.tries.open = (s.tries.open ?? 0) + 1;
          return say(s, res, 'dist');
        }
        s.openedText = prettyAnswer(s.entry);
        s.entry = '';
        s.step = 'answer';
        s.asked = false;
        return say(s, { ok: true, feedbackKey: 'typedOpened', params: { line: distributedText(s.problem) } }, 'dist');
      }
      if (s.step === 'answer') {
        const res = validateAnswer(distributedExpression(s.problem), s.entry);
        if (!res.ok) {
          if (res.feedbackKey !== 'typeAnswer') s.tries.answer = (s.tries.answer ?? 0) + 1;
          return say(s, res, 'ts');
        }
        s.finalText = prettyAnswer(s.entry);
        s.step = 'done';
        s.clean = !s.tries.open && !s.tries.answer && !s.everAsked;
        return say(s, res, 'ts');
      }
      return state;
    }
    default:
      return state;
  }
}

// ---------- Help ----------

// What a hint or Show me puts on the Mat for the current step.
//   Open it: one line per group, the number in front times each term inside.
//   Answer:  each kind of term from the opened line, added up.
export function helpLines(s) {
  if (s.step === 'open') {
    return groupParts(s.problem).flatMap((part) => distributeLines(groupOf(part)).map((l) => l.text));
  }
  const terms = distributedExpression(s.problem).terms;
  return [['x', 'boxes'], ['int', 'numbers']].flatMap(([kind, word]) => {
    const values = terms.filter((t) => t.kind === kind).map(effective);
    if (values.length === 0) return [];
    const sum = values.reduce((a, b) => a + b, 0);
    const sumed = values.map((v, i) => (i === 0 ? numberText({ kind: 'int', value: v }) : `${v < 0 ? '−' : '+'} ${Math.abs(v)}`)).join(' ');
    return [`${word}: ${sumed} = ${numberText({ kind: 'int', value: sum })}`];
  });
}

// null, or { key, params, show, src }: after 3 wrong tries on the step, or when Show me was pressed.
export function typedHintFor(s) {
  if (!s || s.step === 'done') return null;
  const wrong = (s.tries[s.step] ?? 0) >= HINT_AFTER;
  if (!wrong && !s.asked) return null;
  return {
    key: s.step === 'open' ? 'hintOpen' : 'hintTally',
    params: { lines: helpLines(s), whole: formatDistribute(s.problem) },
    show: {},
    src: 'dist',
  };
}

