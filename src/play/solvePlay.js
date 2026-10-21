// The play adapter every Solve it card shares (Build E): a card on the shared loop is configuration, and so is its adapter. What every
// card's adapter does the same way is here: no streaks, no steps bar, nothing on a timer, the line on the Mat, the light design; the
// spotlight round the card's layer (an error waits for Undo, then a hint) and the openings' pop-ups round that; the forced move from the
// loop; the finished problem recorded for the class sheet; and the Mat's common buttons. A card names only what is its own.
//
//   makeSolvePlay({ pack, loop, layer, spot, introOpen, format, newSession, feedbackText, buildControls, renderMat, bindMat, padOpen,
//                   matAction?, effects? })
//     layer        the card's reducer with its own layers (the loop's reduce, Divide's fraction blank, Add's term layer)
//     matAction    the card's own buttons (null for anything else: the common ones are handled here)
//     effects      the card's extra effects when the state changes (a log line, what this level has taught)

import { withSpotlight } from '../engine/spotlight.js';
import { withIntro } from './withIntro.js';
import { recordProblem } from '../lightStore.js';

const COMMON = new Set(['check', 'placeValue', 'nextLine', 'foldNext', 'next', 'stuck', 'teach', 'startOver', 'undo', 'go', 'spotDismiss', 'introNext']);

export function makeSolvePlay(card) {
  return {
    noStreak: true,       // no streaks: the stuck count is what is kept
    noSteps: true,        // no steps bar
    noAuto: true,         // nothing advances on a timer: every pause ends with a green button
    lineInMat: true,      // the line is on the Mat (for screen readers: what the card says is a pop-up)
    lightDesign: true,    // no pad on a keyboard, a pop-up keypad on touch, the header fades (Build D)
    padOpen: card.padOpen,
    owesMove: card.loop.owesMove,                                   // a correct guess at the first state makes the next problem a move
    steps: () => [],
    newSession: card.newSession,
    reduce: withIntro(withSpotlight(card.layer, card.spot), card.introOpen),
    feedbackText: card.feedbackText,
    buildControls: card.buildControls,
    bindMat: card.bindMat,
    renderMat: card.renderMat,
    effects(before, s) {
      if (before && before.step !== 'done' && s.step === 'done') {
        recordProblem(s, { pack: card.pack, level: s.problem.logLevel ?? null, problem: card.format(s.problem) });
      }
      card.effects?.(before, s);
      return { hint: null };
    },
    matAction(d) {
      const own = card.matAction?.(d);
      if (own) return own;
      if (d.action === 'focus') return { type: 'focus', target: d.target };
      if (d.action === 'choose') return { type: 'choose', move: d.move };
      if (d.action === 'placeValue') return { type: 'placeValue', ...(d.xi !== undefined && d.xi !== '' ? { index: Number(d.xi) } : {}) };   // (the x it was dropped on, when there is more than one)
      if (d.action === 'greyMove') return { type: 'greyMove', move: d.move };
      return COMMON.has(d.action) ? { type: d.action } : null;
    },
  };
}
