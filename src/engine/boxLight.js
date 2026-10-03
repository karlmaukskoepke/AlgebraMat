// Light mode for Boxes & Circles (Karl, 2026-10-03), as a pure reducer around the card's own walk. Every problem starts
// with typing the answer. Two supports can be asked for at any time, and a wrong answer brings the first one in:
//
//   draw boxes & circles   a box round each x term and a circle round each number (the Box & Circle step), then back to typing
//   rewrite subtractions   as adding the opposite: tap the − in front and the number's sign, for as many as you like, then Done
//
// A wrong answer: draw the boxes and circles first, then type again. A second wrong answer (or I'm stuck after that)
// opens the walk from where the student is: draw the counters above, cancel, answer. Teach me step-by-step is the
// whole walk at once. Two slips get their own words: 0x + 13 (a zero term left in) and x − 8x typed as −8x (the lone x
// has an invisible 1).

import { newTermSession, reduceTerms, hasRewrite, rewritable, fullyFlipped, flipKey } from './termSession.js';
import { termParts, rewriteTerm, prettyAnswer } from './terms.js';
import { typeInto, isTyping } from './entry.js';
import { CARDS } from './lightCards.js';
import { emptySkills } from './skills.js';

const CARD = CARDS.boxes;

export function newBoxLight(problem) {
  const ts = newTermSession(problem);
  ts.step = 'boxcircle';                       // the walk's Rewrite is optional here, so every problem starts the same way
  ts.feedback = { key: 'boxCircleIntro' };
  return {
    problem, ts,
    stage: 'light',                            // 'light' | 'support' | 'walk' | 'done'
    support: null,                             // 'boxcircle' | 'rewrite' | null
    step: 'answer',                            // the step bar's current step
    skipped: [],
    entry: '',
    boxed: false,                              // the boxes and circles are drawn (they stay on the Mat while typing)
    rewritten: false,                          // some subtractions were rewritten as adding the opposite
    rw: {},                                    // the parts flipped so far in the rewrite support: { 'term:op': true }
    lastSupport: null,                         // the last rung a wrong answer or I'm stuck used
    hinted: false,                             // the lone-x message has been shown
    wrongs: 0, tag: null, tags: [], stuck: 0, taught: 0,
    helped: false, clean: false,
    on: { ...emptySkills(), partyBattle: false, sign: false },
    answers: [], supportsShown: [],
    finalText: null,
    feedback: { key: 'blIntro' },
  };
}

const say = (s, key, params, bad = false, src) => { s.feedback = { key, params, bad, src }; return s; };
const fromTs = (s) => { s.feedback = { ...s.ts.feedback, src: 'ts' }; return s; };

// The terms a student can rewrite here: every subtraction (adding the opposite works on − 3 and on − (−3)).
const isSubtraction = (problem, term) => problem.terms[term]?.op === '-';

// What the Mat draws while rewriting: every subtraction can flip, so each is marked as one that may.
export const rewriteView = (problem) => ({ ...problem, terms: problem.terms.map((t) => (t.op === '-' ? { ...t, flip: true } : t)) });

function toTyping(s, key, params) {
  s.stage = 'light';
  s.support = null;
  s.step = 'answer';
  s.rw = {};
  return say(s, key, params);
}

// The walk, from where the student is: the boxes and circles done (or not), and any rewrite still needed first.
function startWalk(s, lead) {
  s.helped = true;
  if (!s.supportsShown.includes('fullWalk')) s.supportsShown.push('fullWalk');
  s.stage = 'walk';
  s.support = null;
  s.entry = '';
  s.rw = {};
  const ts = s.ts;
  ts.flips = {};
  const owing = hasRewrite(ts.problem) && rewritable(ts.problem).length > 0;   // a − (−…) that was never rewritten
  ts.step = owing ? 'rewrite' : s.boxed ? 'draw' : 'boxcircle';
  ts.skipped = hasRewrite(ts.problem) && !owing ? ['rewrite'] : [];
  ts.feedback = { key: owing ? 'rewriteIntro' : s.boxed ? 'drawIntro' : 'boxCircleIntro' };
  s.step = ts.step;
  s.skipped = ts.skipped;
  s.feedback = { ...ts.feedback, src: 'ts', lead };
  return s;
}

function startBoxes(s, why) {
  s.stage = 'support';
  s.support = 'boxcircle';
  s.step = 'boxcircle';
  s.entry = '';
  s.rw = {};
  s.ts.step = 'boxcircle';
  s.ts.tool = null;
  s.ts.feedback = { key: 'boxCircleIntro' };
  if (!s.supportsShown.includes('boxcircle')) s.supportsShown.push('boxcircle');
  s.lastSupport = 'boxcircle';
  return say(s, why);
}

// The next rung for a wrong answer or I'm stuck: boxes and circles first (unless they're drawn), then the walk.
function nextRung(s, lead) {
  if (!s.boxed && s.lastSupport === null) return startBoxes(s, lead === 'blStuck' ? 'blStuckBoxes' : 'blWrongBoxes');
  return startWalk(s, lead);
}

export function reduceBoxLight(state, action) {
  if (state.stage === 'done') return state;

  // The walk: the card's own session takes every action.
  if (state.stage === 'walk') {
    const ts = reduceTerms(state.ts, action);
    if (ts === state.ts) return state;
    const s = { ...state, ts, step: ts.step, skipped: ts.skipped };
    s.feedback = { ...ts.feedback, src: 'ts' };
    if (ts.step === 'done') s.finalText = ts.finalText;
    return s;
  }

  // Box & Circle as a support: the walk's own step, then back to typing once every term has its shape.
  if (state.stage === 'support' && state.support === 'boxcircle' && !['stuck', 'teach'].includes(action.type)) {
    const ts = reduceTerms(state.ts, action);
    if (ts === state.ts) return state;
    const s = { ...state, ts };
    if (ts.step !== 'boxcircle') {                       // Check passed: the step is done
      const done = structuredClone(s);
      done.boxed = true;
      done.ts.step = 'draw';
      return toTyping(done, 'blBoxesDone');
    }
    s.feedback = { ...ts.feedback, src: 'ts' };
    return s;
  }

  // Rewrite as a support: tap the signs of the subtractions you want to rewrite, then Done.
  if (state.stage === 'support' && state.support === 'rewrite' && !['stuck', 'teach'].includes(action.type)) {
    const s = structuredClone(state);
    const view = rewriteView(s.problem);
    if (action.type === 'flipPart') {
      const p = termParts(view)[action.index];
      if (!p) return state;
      if (!isSubtraction(s.problem, p.term)) return say(s, 'blNotSub', undefined, true);
      const key = flipKey(p.term, p.part);
      if (s.rw[key]) delete s.rw[key]; else s.rw[key] = true;
      const one = Boolean(s.rw[flipKey(p.term, 'op')]) !== Boolean(s.rw[flipKey(p.term, 'num')]);
      return one ? say(s, 'flipBoth', undefined, false, 'ts') : say(s, 'blRewriteMore');
    }
    if (action.type === 'doneRewrite') {
      const subs = s.problem.terms.map((t, i) => i).filter((i) => isSubtraction(s.problem, i));
      const half = subs.filter((i) => Boolean(s.rw[flipKey(i, 'op')]) !== Boolean(s.rw[flipKey(i, 'num')]));
      if (half.length) return say(s, 'flipBoth', undefined, true, 'ts');
      const flipped = subs.filter((i) => fullyFlipped({ flips: s.rw }, i));
      if (!flipped.length) return toTyping(s, 'blNothingRewritten');
      // (the rewritten term is just an addition now: it must not keep the `flip` mark that said it could be flipped)
      const terms = s.problem.terms.map((t, i) => {
        if (!flipped.includes(i)) return t;
        const { flip, ...rewritten } = rewriteTerm({ ...t, flip: true });
        return rewritten;
      });
      s.problem = { ...s.problem, terms };
      s.ts.problem = s.problem;
      s.rewritten = true;
      return toTyping(s, 'blRewriteDone');
    }
    return state;
  }

  const s = structuredClone(state);
  if (isTyping(action)) {
    if (s.stage !== 'light') return state;
    const entry = typeInto(s.entry, action, 'algebra');
    if (entry === s.entry) return state;
    s.entry = entry;
    return s;
  }

  switch (action.type) {
    // The two supports, asked for at any time. They count as help (no streak), but nothing is wrong.
    case 'drawBoxes': {
      if (s.stage !== 'light') return state;
      s.helped = true;
      return startBoxes(s, 'blBoxesOn');
    }
    case 'rewriteSubs': {
      if (s.stage !== 'light') return state;
      s.helped = true;
      s.stage = 'support';
      s.support = 'rewrite';
      s.step = 'rewrite';
      s.rw = {};
      s.entry = '';
      if (!s.supportsShown.includes('rewrite')) s.supportsShown.push('rewrite');
      return say(s, 'blRewriteIntro', undefined, false, undefined);
    }

    case 'check': {
      if (s.stage !== 'light') return state;
      const { correct, tag } = CARD.check(s.ts.problem, s.entry);
      if (tag === 'unreadable') return say(s, s.entry === '' ? 'typeAnswer' : 'answerUnreadable', undefined, true);
      // 0x + 13 is right with a zero term left in: take it out and type it again (nothing wrong).
      if (tag === 'zero-term') return say(s, 'blZeroTerm', undefined, true);
      if (correct) {
        s.stage = 'done';
        s.step = 'done';
        s.clean = s.wrongs === 0 && s.stuck === 0 && s.taught === 0 && !s.helped;
        s.finalText = prettyAnswer(s.entry);
        s.ts.step = 'done';
        s.ts.finalText = s.finalText;
        return say(s, 'blCorrect', { answer: CARD.answerText(s.ts.problem) });
      }
      s.wrongs += 1;
      s.tag = tag;
      s.tags.push(tag);
      s.answers.push({ typed: s.entry, tag });
      s.entry = '';
      // A lone x has an invisible 1: say so once, before any support.
      if (tag === 'invisible-one' && !s.hinted) {
        s.hinted = true;
        s.helped = true;
        return say(s, 'blInvisibleOne', undefined, true);
      }
      return nextRung(s, 'blWrong');
    }

    case 'stuck': {
      if (s.stage !== 'light' && s.stage !== 'support') return state;
      s.stuck += 1;
      s.entry = '';
      s.helped = true;
      return nextRung(s, 'blStuck');
    }

    case 'teach': {
      if (s.stage !== 'light' && s.stage !== 'support') return state;
      s.taught += 1;
      s.entry = '';
      return startWalk(s, 'blTeach');
    }

    default:
      return state;
  }
}

