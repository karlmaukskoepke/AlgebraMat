// One Combine it problem in light mode (SPEC-SCAFFOLD.md §2 and §4), as a pure reducer. The student types the
// answer; a wrong answer (or I'm stuck) brings in a support, and the full step-by-step walk is the last rung.
//
//   light  → type the answer, Check          (right on the first try: done, a clean answer)
//   support→ the party-or-battle question    (then back to typing)
//   walk   → today's Draw → Party or Battle → Cancel → Answer, on the same problem
//
// A sign mistake gets the cloze: a sentence with a blank and four word-choices, read aloud once one is picked.

import { evaluate, rewrite, formatProblem } from './expr.js';

const rewrite_ = rewrite;   // (the support below has a `rewrite` session of its own)
import { newCombineSession } from './combineSession.js';
import { reduce as reduceWalk, newSession as newFlipWalk } from './session.js';
import { newBigSession, reduceBig } from './bigSession.js';
import { validatePartyBattle } from './moves.js';
import { classify, firstSupport, nextRung, buildCloze, spokenSentence, leftover, clozeFeedbackKey } from './scaffold.js';
import { emptySkills, whichOn } from './skills.js';

export const MAX_LIGHT_LENGTH = 4;

// The walk for a problem: Flip It's own (it starts at Rewrite) for a subtraction, Combine it's (no Rewrite) for an addition.
const startWalk = (problem) => (problem.op === '-' ? newFlipWalk(problem) : newCombineSession(problem));

// The party-or-battle question's message. A subtraction is shown as the addition it becomes first (adding the opposite).
function partyBattleMessage(problem) {
  const added = rewrite(problem);
  const params = { a: added.left.value, b: added.right.value };
  return problem.op === '-'
    ? { key: 'lightPartyBattleSub', params: { ...params, from: formatProblem(problem), to: formatProblem(added) } }
    : { key: 'lightPartyBattle', params };
}

// Supports built so far. Others fall back to the party-or-battle question.
const BUILT = new Set(['circle', 'rewrite', 'cloze', 'partyBattle', 'fullWalk']);

// The two numbers as a circling problem: each with the sign in front of it, like Combine it's big-number circle step.
const circleProblem = (problem) => ({
  mode: 'integers-big',
  terms: [{ kind: 'int', op: '+', value: problem.left.value }, { kind: 'int', op: '+', value: problem.right.value }],
});
const resolve = (kind) => (BUILT.has(kind) ? kind : 'partyBattle');

// `skills` are the supports that are on for this student (engine/skills.js): the party-or-battle question comes first
// when it's on (the student types after it), and the typed answer is read back in words when the sign support is on.
export function newLightSession(problem, skills = emptySkills()) {
  const on = whichOn(skills);
  const s = {
    problem,
    stage: 'light',            // 'light' | 'support' | 'walk' | 'done'
    step: 'answer',            // the step bar's current step
    skipped: [],
    entry: '',
    support: null,             // the support showing now: 'cloze' | 'partyBattle' | null
    cloze: null,               // the cloze, while it's showing: { sentence, choices, tried }
    said: null,                // once the right choice is picked: { sentence, leftover }, kept while the student types
    spoken: null,              // what to read aloud now: { id, text } (the view speaks it when the id changes)
    lastSupport: null,         // the last rung used on this problem
    wrongs: 0,                 // wrong answers typed
    tag: null,                 // what the latest wrong answer looked like (engine/scaffold.js)
    tags: [],                  // every wrong answer's tag, for the log
    stuck: 0,                  // times I'm stuck was pressed
    walk: null,                // Flip It's session, when the full walk is on
    circle: null,              // the circling session, while the circle support is showing
    circled: false,            // the numbers were circled with their signs (kept on the Mat while the student types)
    rewrite: null,             // Flip It's rewrite step, while the rewrite support is showing
    rewritten: false,          // the subtraction was rewritten as an addition (kept on the Mat while the student types)
    taught: 0,                 // times Teach me step-by-step was pressed
    helped: false,             // a support was brought in by a wrong answer or I'm stuck
    clean: false,              // right on the first try with no help: counts toward fading a support
    on,                        // which supports were on when the problem began: { partyBattle, sign }
    upfront: false,            // the party-or-battle question was showing first because that support is on
    answers: [],               // the wrong answers typed: { typed, tag }, for the log
    supportsShown: [],         // the supports brought in by a wrong answer or I'm stuck, for the log
    finalText: null,
    feedback: { key: 'lightIntro' },
  };
  if (on.sign && !on.partyBattle) s.feedback = { key: 'lightIntroSign' };
  if (on.partyBattle) {
    s.stage = 'support';
    s.support = 'partyBattle';
    s.step = 'partyBattle';
    s.lastSupport = 'partyBattle';
    s.upfront = true;
    s.feedback = partyBattleMessage(problem);
  }
  return s;
}

const say = (s, key, params, bad = false) => { s.feedback = { key, params, bad }; return s; };

// Bring in the next support: the first for this mistake, or the next rung once one has been used. `force` names one
// (Teach me step-by-step goes straight to the full walk).
function bringIn(s, tag, force = null) {
  const kind = force ?? resolve(s.lastSupport ? nextRung(s.lastSupport) : firstSupport(tag, s.problem));
  s.lastSupport = kind;
  s.helped = true;
  s.supportsShown.push(kind);
  s.cloze = null;
  s.circle = null;
  s.rewrite = null;
  if (kind === 'fullWalk') {
    s.stage = 'walk';
    s.walk = startWalk(s.problem);
    // A subtraction that was already rewritten starts the walk with that done.
    if (s.rewritten && s.problem.op === '-') for (const part of ['op', 'sign']) s.walk = reduceWalk(s.walk, { type: 'flip', part });
    s.step = s.walk.step;
    s.skipped = s.walk.skipped;
    return say(s, 'lightWalk', undefined);
  }
  s.stage = 'support';
  s.support = kind;
  if (kind === 'circle') {
    s.circle = newBigSession(circleProblem(s.problem));
    s.step = 'circle';
    s.feedback = { key: s.circle.feedback.key, src: 'circle' };
    return s;
  }
  if (kind === 'rewrite') {
    s.rewrite = newFlipWalk(s.problem);
    s.step = 'rewrite';
    s.feedback = { ...s.rewrite.feedback, src: 'rewrite' };
    return s;
  }
  if (kind === 'cloze') {
    const { sentence, choices, kind: situation } = buildCloze(s.problem);
    s.cloze = { sentence, choices, situation, tried: [] };
    s.step = 'cloze';
    return say(s, 'lightCloze', { situation });
  }
  s.step = 'partyBattle';
  const m = partyBattleMessage(s.problem);
  return say(s, m.key, m.params);
}

// Back to typing once a support is done.
function backToTyping(s, key, params) {
  s.stage = 'light';
  s.support = null;
  s.step = 'answer';
  s.circle = null;
  s.rewrite = null;
  return say(s, key, params);
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

  // The circle support: the numbers are circled with their signs (Boxes & Circles' drag), then back to typing.
  if (state.stage === 'support' && state.support === 'circle' && !['stuck', 'teach'].includes(action.type)) {
    let circle = reduceBig(state.circle, action);
    if (circle === state.circle) return state;
    // Every number circled: that's the step. Checked on its own (no Check button here), so a circle that leaves out
    // the sign is told so right away; with a number still to circle, nothing is said yet.
    if (action.type === 'drawShape' && circle.shapes.length >= circle.problem.terms.length) circle = reduceBig(circle, { type: 'check' });
    const s = { ...state, circle };
    if (circle.step !== 'boxcircle') {
      const done = structuredClone(s);
      done.circled = true;
      return backToTyping(done, 'lightCircled');
    }
    s.feedback = { ...circle.feedback, src: 'circle' };
    return s;
  }

  // The rewrite support: click the minus and the number's sign (Flip It's Rewrite step), then back to typing.
  if (state.stage === 'support' && state.support === 'rewrite' && !['stuck', 'teach'].includes(action.type)) {
    if (action.type !== 'flip') return state;
    const rewrite = reduceWalk(state.rewrite, action);
    if (rewrite === state.rewrite) return state;
    const s = { ...state, rewrite };
    if (rewrite.step !== 'rewrite') {
      const done = structuredClone(s);
      done.rewritten = true;
      return backToTyping(done, 'lightRewriteDone', { to: formatProblem(rewrite_(done.problem)) });
    }
    s.feedback = { ...rewrite.feedback, src: 'rewrite' };
    return s;
  }

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
        s.clean = s.wrongs === 0 && s.stuck === 0 && !s.helped;
        s.finalText = String(evaluate(s.problem));
        return say(s, 'lightCorrect', { answer: s.finalText });
      }
      s.wrongs += 1;
      s.tag = tag;
      s.tags.push(tag);
      s.answers.push({ typed: s.entry, tag });
      s.entry = '';
      return bringIn(s, tag);
    }

    // Teach me step-by-step: straight to the full walk.
    case 'teach': {
      if (s.stage !== 'light' && s.stage !== 'support') return state;
      s.taught += 1;
      s.entry = '';
      return bringIn(s, s.tag, 'fullWalk');
    }

    // I'm stuck: the smallest support first, then the next rung each time.
    case 'stuck': {
      if (s.stage !== 'light' && s.stage !== 'support') return state;
      s.stuck += 1;
      s.entry = '';
      return bringIn(s, s.tag);
    }

    // The cloze: a pick reads the whole sentence aloud. The right one shows what's left over and goes back to typing;
    // a wrong one says what's off and stays picked (no penalty).
    case 'pickChoice': {
      if (s.stage !== 'support' || s.support !== 'cloze') return state;
      const choice = s.cloze.choices[action.index];
      if (!choice || s.cloze.tried.includes(choice.index)) return state;
      s.spoken = { id: (s.spoken?.id ?? 0) + 1, text: spokenSentence(s.problem, choice) };
      if (!choice.right) {
        s.cloze.tried.push(choice.index);
        return say(s, clozeFeedbackKey(choice), { situation: s.cloze.situation, word: choice.text }, true);
      }
      s.said = { sentence: s.cloze.sentence.replace('____', choice.text), leftover: leftover(choice) };
      s.cloze = null;
      s.stage = 'light';
      s.support = null;
      s.step = 'answer';
      return say(s, 'lightClozeRight', { word: choice.text });
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

