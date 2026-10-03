// Light mode for the cards built on groups of terms, as one pure reducer around each card's own walk (Karl,
// 2026-10-03): Groups of Terms, and Distribute then combine's first rounds. The student types the answer, and what a
// wrong answer looks like decides what happens next (engine/lightCards.js `tagTermGroups` and `tagDistribute`):
//
//   dist-one          2(4x + 1) → 8x + 1     the arrows show up above the problem ("2 distributes to both terms"), then retype
//   inside-sign-lost  −3(2x − 1) → −6x − 3   box the x term and circle the number inside, then the arrows, then retype
//   neg-first         −(2x + 5) → −2x + 5    write the hidden −1 first, then the arrows, then retype
//   outer-as-term     2(2x + 3) → 2x + 5     straight to the groups walk ("2 groups of 2x + 3")
//
// A second wrong answer, or any other mistake, opens the card's full walk. Fractions of a group have no targeted
// supports yet and go to the walk. I'm stuck shows the arrows; Teach me opens the walk.
//
// `cfg` (what differs between the cards):
//   card          { check(problem, text) → { correct, tag }, answerText(problem) }
//   groupProblem  (problem) → the Groups of Terms problem for the group (its inside terms, and the hidden 1)
//   outer         (problem) → what's out front, as written ("2", "−3", "−1")
//   newWalk       (problem, group) → the card's walk session (`group` is the hidden-1 session, if one was used)
//   reduceWalk    (walk, action) → walk
//   ownWalk       the walk is its own session (Distribute's), kept in `walk`; otherwise the groups session `g` is the walk

import { newTermGroupSession, reduceTermGroups } from './termGroupSession.js';
import { newTermSession, reduceTerms } from './termSession.js';
import { makeExpression } from './terms.js';
import { isFraction } from './termGroups.js';
import { typeInto, isTyping } from './entry.js';
import { emptySkills } from './skills.js';

// What to do first for each mistake: the interactive supports (in order), then the arrows.
const PLAN = { 'dist-one': [], 'inside-sign-lost': ['inside'], 'neg-first': ['one'] };

// The terms inside the parentheses, as a Boxes & Circles expression (the second term's sign is its operation).
export const insideExpression = (group) => makeExpression(group.inside.map((t, i) => (
  i > 0 && t.value < 0 ? { kind: t.kind, op: '-', value: -t.value } : { kind: t.kind, op: '+', value: t.value })));

// The session the walk runs in: the groups session itself, or the card's own.
export const walkOf = (s) => (s.walk ?? s.g);

export function createGroupLight(cfg) {
  const say = (s, key, params, bad = false, src) => { s.feedback = { key, params, bad, src }; return s; };
  const groupOf = (s) => cfg.groupProblem(s.problem);

  function newSession(problem) {
    return {
      problem,
      stage: 'light',            // 'light' | 'support' | 'walk' | 'done'
      support: null,             // 'inside' | 'one' | null
      step: 'answer',
      skipped: [],
      entry: '',
      arrows: false,             // the arrows show above the problem while the student types
      arrowsFresh: false,        // they were just drawn (the view draws them in once, not again on every key)
      ts: null,                  // Box & Circle on the terms inside, while that support is showing
      g: null,                   // the groups session: the hidden 1 while that support is showing (and the walk, for Groups of Terms)
      walk: null,                // the card's own walk, when it has one (Distribute's)
      plan: [],                  // the interactive supports still to do
      rung: 0,                   // supports given for wrong answers so far (one, then the walk)
      wrongs: 0, tag: null, tags: [], stuck: 0, taught: 0,
      helped: false, clean: false,
      on: { ...emptySkills(), partyBattle: false, sign: false },
      answers: [], supportsShown: [],
      finalText: null,
      feedback: { key: 'tgIntro' },
    };
  }

  function toTyping(s, key) {
    s.stage = 'light';
    s.support = null;
    s.step = 'answer';
    s.arrows = true;
    s.arrowsFresh = true;
    s.ts = null;
    return say(s, key, { outer: cfg.outer(s.problem) });
  }

  // The next interactive support in the plan, or (none left) back to typing with the arrows showing.
  function nextInPlan(s, doneKey) {
    const kind = s.plan.shift();
    if (!kind) return toTyping(s, doneKey);
    s.stage = 'support';
    s.support = kind;
    s.entry = '';
    s.supportsShown.push(kind);
    if (kind === 'inside') {
      s.ts = newTermSession(insideExpression(groupOf(s)));
      s.step = 'boxcircle';
      return say(s, 'tgInside');
    }
    s.g = newTermGroupSession(groupOf(s));          // at Groups, with the hidden 1 to write
    s.step = 'groups';
    return say(s, 'tgOne');
  }

  function startWalk(s, lead) {
    s.helped = true;
    if (!s.supportsShown.includes('fullWalk')) s.supportsShown.push('fullWalk');
    s.stage = 'walk';
    s.support = null;
    s.entry = '';
    s.ts = null;
    if (cfg.ownWalk) s.walk = cfg.newWalk(s.problem, s.g);
    else s.g = cfg.newWalk(s.problem, s.g);
    const walk = walkOf(s);
    s.step = walk.step;
    s.skipped = walk.skipped;
    s.feedback = { ...walk.feedback, src: walk.feedback?.src ?? 'tg', lead };
    return s;
  }

  function reduce(state, action) {
    if (state.stage === 'done') return state;

    // The walk: the card's own session takes every action.
    if (state.stage === 'walk') {
      const walk = cfg.reduceWalk(walkOf(state), action);
      if (walk === walkOf(state)) return state;
      const s = { ...state, [cfg.ownWalk ? 'walk' : 'g']: walk, step: walk.step, skipped: walk.skipped };
      s.feedback = { ...walk.feedback, src: walk.feedback?.src ?? 'tg' };
      if (walk.step === 'done') s.finalText = walk.finalText ?? null;
      return s;
    }

    // Box & Circle on the terms inside the parentheses: the walk's own step, then on to the next support.
    if (state.stage === 'support' && state.support === 'inside' && !['stuck', 'teach'].includes(action.type)) {
      const ts = reduceTerms(state.ts, action);
      if (ts === state.ts) return state;
      const s = structuredClone({ ...state, ts });
      if (ts.step !== 'boxcircle') return nextInPlan(s, 'tgInsideDone');
      s.feedback = { ...ts.feedback, src: 'bc' };
      return s;
    }

    // The hidden 1: the groups walk's own first step (type the 1 for the gap, Check), then on to the next support.
    if (state.stage === 'support' && state.support === 'one' && !['stuck', 'teach'].includes(action.type)) {
      const g = reduceTermGroups(state.g, action);
      if (g === state.g) return state;
      const s = structuredClone({ ...state, g });
      if (g.wroteOne) {
        s.g.step = 'groups';
        return nextInPlan(s, 'tgOneDone');
      }
      s.feedback = { ...g.feedback, src: 'tg' };
      return s;
    }

    const s = structuredClone(state);
    if (isTyping(action)) {
      if (s.stage !== 'light') return state;
      const entry = typeInto(s.entry, action, 'algebra');
      if (entry === s.entry) return state;
      s.entry = entry;
      s.arrowsFresh = false;
      return s;
    }

    switch (action.type) {
      case 'check': {
        if (s.stage !== 'light') return state;
        const { correct, tag } = cfg.card.check(s.problem, s.entry);
        if (tag === 'unreadable') return say(s, s.entry === '' ? 'typeAnswer' : 'answerUnreadable', undefined, true);
        if (tag === 'zero-term') return say(s, 'tgZeroTerm', undefined, true);
        if (correct) {
          s.stage = 'done';
          s.step = 'done';
          s.clean = s.wrongs === 0 && s.stuck === 0 && s.taught === 0 && !s.helped;
          s.finalText = cfg.card.answerText(s.problem);
          return say(s, 'tgCorrect', { answer: s.finalText });
        }
        s.wrongs += 1;
        s.tag = tag;
        s.tags.push(tag);
        s.answers.push({ typed: s.entry, tag });
        s.entry = '';
        s.helped = true;
        // The first wrong answer gets the support that answers it; a second, or one with no support, the walk.
        if (s.rung === 0 && tag in PLAN && !isFraction(groupOf(s))) {
          s.rung = 1;
          s.plan = [...PLAN[tag]];
          return nextInPlan(s, 'tgArrows');
        }
        return startWalk(s, tag === 'outer-as-term' ? 'tgOuter' : 'tgWrong');
      }

      // I'm stuck: the arrows first, then the walk.
      case 'stuck': {
        if (s.stage !== 'light' && s.stage !== 'support') return state;
        s.stuck += 1;
        s.helped = true;
        s.entry = '';
        if (s.stage === 'light' && s.rung === 0 && !isFraction(groupOf(s))) {
          s.rung = 1;
          s.supportsShown.push('arrows');
          return toTyping(s, 'tgArrows');
        }
        return startWalk(s, 'tgStuck');
      }

      case 'teach': {
        if (s.stage !== 'light' && s.stage !== 'support') return state;
        s.taught += 1;
        s.entry = '';
        return startWalk(s, 'tgTeach');
      }

      default:
        return state;
    }
  }

  return { newSession, reduce };
}
