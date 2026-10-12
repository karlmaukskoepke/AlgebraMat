// The tutorials inside an Add to both sides session (SPEC-ADD-TO-BOTH-SIDES.md §3A). A tutorial plays once per student and
// afterwards only by choice (Karl, 2026-10-11), so it never blocks the card: Skip is always there, and a replay button brings
// it back. While one is on, the session carries a `tut` field and every action goes to it; the problem underneath is
// untouched, so finishing (or skipping) puts the student right back where they were.
//
//   add:    numbers only (with the quiz) → the same move with counters and a box → with symbols only
//   trade:  numbers only, with the quiz         cross: numbers only, with the quiz

import { newTutorial, reduceTutorial } from '../engine/numericTutorial.js';
import { newAddBoth, reduceAddBoth } from '../engine/addBothMoves.js';
import { makeAddBoth } from '../engine/addBoth.js';
import { markTutorialSeen } from '../tutorialStore.js';

// `x + 2 = 5` with the forced path: only the right amount is accepted, so the move is the whole lesson.
function practice(symbols) {
  const e = newAddBoth(makeAddBoth('x+a', 2, 3), { level: 3 });
  e.counterMode = !symbols;
  e.forced = true;
  e.feedback = { key: symbols ? 'tuSymbolsIntro' : 'tuBoxIntro', params: {} };
  return e;
}

export function startTutorial(s, kinds, replay = false) {
  if (!kinds.length) return s;
  const t = newTutorial(kinds[0]);
  const tut = { queue: kinds, i: 0, kind: kinds[0], phase: 'numeric', t, eng: null, replay, hold: { step: s.step, feedback: s.feedback } };
  return { ...s, step: 'tutorial', tut, feedback: t.feedback };
}

// This tutorial is over (finished or skipped): it counts as seen, and the next one in the queue starts, or the problem comes back.
function nextKind(s) {
  const { tut } = s;
  markTutorialSeen(tut.kind);
  const i = tut.i + 1;
  if (i >= tut.queue.length) return { ...s, tut: null, step: tut.hold.step, feedback: tut.replay ? { key: 'tuBack', params: {} } : tut.hold.feedback };
  const kind = tut.queue[i];
  const t = newTutorial(kind);
  return { ...s, tut: { ...tut, i, kind, phase: 'numeric', t, eng: null }, feedback: t.feedback };
}

export function reduceTutorialSession(s, action) {
  const { tut } = s;
  if (action.type === 'skipTutorial') return nextKind(s);
  if (action.type === 'replayTutorial') return s;

  if (tut.phase === 'numeric') {
    const t = reduceTutorial(tut.t, action);
    if (t === tut.t) return s;
    if (t.stage === 'done') {
      if (tut.kind !== 'add') return nextKind({ ...s, tut: { ...tut, t } });
      const eng = practice(false);
      return { ...s, tut: { ...tut, phase: 'box', t, eng }, feedback: eng.feedback };
    }
    return { ...s, tut: { ...tut, t }, feedback: t.feedback };
  }

  // counters with a box, then symbols: the real engine on a practice equation
  if (action.type === 'continue') {
    if (tut.eng.stage !== 'done') return s;
    if (tut.phase === 'box') {
      const eng = practice(true);
      return { ...s, tut: { ...tut, phase: 'symbols', eng }, feedback: eng.feedback };
    }
    return nextKind(s);
  }
  const eng = reduceAddBoth(tut.eng, action);
  if (eng === tut.eng) return s;
  return { ...s, tut: { ...tut, eng }, feedback: eng.feedback };
}
