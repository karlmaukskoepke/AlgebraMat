// The Two-step equations screen (Build K, basic form): Add to both sides' screen (view/addBothScreen.js: the work stack with grabbable
// terms, the Add move's preview and blank, combining by dragging, x = [ ] with the one green button, the corners, the narrow panel),
// configured for this card. What it adds is the shared Multiply move (its options beside the button, its row under the newest equation:
// view/multiplyRow.js), Flip everything in the panel, and the reminders I'm stuck gives. No Teach me, seesaw or counters yet.

import { renderAddBothScreen, SILENT, NUDGE } from './addBothScreen.js';
import { moveRow, fractionChoices } from './multiplyRow.js';
import { multiplyOptions } from './multiplyOptions.js';
import { spotlightLayer } from './spotlight.js';
import { twoStepFeedbackText } from './twoStepFeedback.js';
import { solve, xAlone, singleTerm, optionOf, tradeAvailable, tradePending, TWO_STEP_MENU, TWO_STEP_SPOT, FLIP_LEVEL, coefOn } from '../engine/cards/twoStep.js';
import { lightsAnswerLive, moveOwed } from '../engine/addBothLights.js';

const { fracOpen, fracOf } = TWO_STEP_MENU;
const KINDS = ['whole', 'frac', 'flip'];

export const introOpen = (s) => moveOwed(s) && !s.introSeen;

// I'm stuck's reminder lights the move it names (as the hint after Undo does), with its preview on the equation.
const REMINDER = {
  aStuckHint: { target: 'xnum', move: 'add' }, wCombineHint: { target: 'otherSide' }, dReminder: { target: 'coef', move: 'fracOption' },
  fFlipHint: { target: 'coef', move: 'flip' }, fSignHint: { target: 'coef', move: 'flip' }, fNegHint: { target: 'answer' }, fFracHint: { target: 'answer' },
};

const CARD = {
  loop: solve,
  spot: TWO_STEP_SPOT,
  text: twoStepFeedbackText,
  tradeAvailable,
  tradePending,
  alone: xAlone,
  answerLive: (s) => lightsAnswerLive(s, solve),
  teach: false,
  cls: 'ts-light',
  silent: new Set([...SILENT, 'dPickFraction', 'lxCombined', 'lxCombinedAlone']),
  nudge: { ...NUDGE, wOneTerm: 'panel', aLaterLevel: 'panel', fFlipIntro: 'panel', dBlankBad: 'answer', dUnitFraction: 'blank', dForced: 'fractions' },
  // the Multiply row: its preview while an option is hovered, then the chosen option (the fraction blank, or −1)
  ghost: (s) => (s.mopts || fracOpen(s) || (KINDS.includes(s.ui?.preview) && TWO_STEP_MENU.canPreview(s)) ? moveRow(s, TWO_STEP_MENU, { blueFlip: true }) : null),
  forward(s) {
    if (s.mopts?.kind) return { label: 'Go', action: 'go', enabled: s.mopts.kind === 'flip' };
    if (fracOpen(s)) return { label: 'Go', action: 'go', enabled: Boolean(fracOf(s.fb)) };
    return null;
  },
  // Multiply (its options: the whole number greyed, the fraction and −1 live once each side is one term, −1 from Level 5) and Flip
  // everything (the same −1, a button of its own). The move owed on a forced problem has the steady ring: Trade places when x is on the
  // right, else the move this equation needs.
  panel(s, moves) {
    const grey = KINDS.filter((k) => optionOf(k, s) !== 'live');
    const flyout = s.mopts && !s.mopts.kind ? multiplyOptions(KINDS, s.ui?.preview, grey) : null;
    const owed = moveOwed(s) && !s.menu && !s.mopts && !s.sub && !xAlone(s.board);
    const one = singleTerm(s.board);
    const flipNeeded = one && coefOn(s.board) < 0 && s.level >= FLIP_LEVEL;
    moves.multiply = { live: true, move: 'mult', action: 'multOpen', label: 'Multiply', pressed: s.menu === 'fraction' || (Boolean(s.mopts) && s.mopts.kind !== 'flip'), ring: owed && one && !flipNeeded && !moves.trade, flyout };
    if (optionOf('flip', s) === 'live') moves.flip = { live: true, move: 'flip', action: 'flipPick', label: 'Flip everything (× −1)', pressed: s.mopts?.kind === 'flip', ring: owed && flipNeeded && !moves.trade, attrs: { 'data-mopt': 'flip' } };
    if (moves.trade && owed) { moves.trade.ring = true; moves.trade.pulse = true; }
    if (owed && (one || moves.trade)) moves.add.ring = false;
  },
  popups(s, wrap, o, sp) {
    if (sp?.choose) { wrap.append(spotlightLayer({ ...sp, place: 'beside' }, { ...o, text: '', extra: fractionChoices(s, twoStepFeedbackText) })); return true; }
    const remind = REMINDER[s.feedback?.key];
    if (!sp && remind && s.stage === 'moves' && !s.sub && !s.lx?.combine) { wrap.append(spotlightLayer({ kind: 'hint', ...remind }, { ...o, text: twoStepFeedbackText(s.feedback) })); return true; }
    return false;
  },
};

export const renderTwoStepScreen = (s) => renderAddBothScreen(s, CARD);
