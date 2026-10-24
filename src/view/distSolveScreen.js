// The Distribute, combine, solve screen (Build M, basic form): Add to both sides' screen (view/addBothScreen.js: the work stack with
// grabbable terms, the factor that is dragged onto its parenthesis and the labelled blanks for its products, combining by dragging, the Add
// move's preview and blank, x = [ ] with the one green button, the corners, the narrow panel), configured for this card like Two-step's
// (view/twoStepScreen.js): the shared Multiply move (Divide, and Flip everything as its own button, once each side is one term), the No
// parentheses light, and the reminders I'm stuck gives. No Teach me, seesaw, counters or area pictures yet.

import { renderAddBothScreen, SILENT, NUDGE } from './addBothScreen.js';
import { moveRow, fractionChoices } from './multiplyRow.js';
import { multiplyMoves } from './multiplyOptions.js';
import { goReady } from '../engine/multiplyMenu.js';
import { spotlightLayer } from './spotlight.js';
import { distSolveFeedbackText } from './distSolveFeedback.js';
import { solve, xAlone, singleTerm, optionOf, hasGroup, DIST_MENU, DIST_SPOT, coefOn } from '../engine/cards/distribute.js';
import { lightsAnswerLive, moveOwed } from '../engine/addBothLights.js';

const { fracOpen, fracOf } = DIST_MENU;
const KINDS = ['whole', 'div', 'frac', 'flip'];

export const introOpen = (s) => moveOwed(s) && !s.introSeen;

// I'm stuck's reminder lights what it names (as the hint after Undo does).
const REMINDER = {
  mDistributeHint: { target: 'factor' }, mTapMinusHint: { target: 'factor' }, mCombineHint: { target: 'hinted' }, wCombineHint: { target: 'otherSide' },
  aStuckHint: { target: 'xnum', move: 'add' }, dReminder: { target: 'coef', move: 'divOption' }, mWorkOut: { target: 'answer' },
  mCalcHint: { target: 'calc' },
  fFlipHint: { target: 'coef', move: 'flip' }, fSignHint: { target: 'coef', move: 'flip' }, fNegHint: { target: 'answer' }, fFracHint: { target: 'answer' },
};

const CARD = {
  loop: solve,
  spot: DIST_SPOT,
  text: distSolveFeedbackText,
  tradeAvailable: () => false,
  tradePending: () => false,
  alone: xAlone,
  answerLive: (s) => lightsAnswerLive(s, solve),
  teach: false,
  cls: 'ts-light ds-light',
  handLights: [['noparen', 'No parentheses']],
  silent: new Set([...SILENT, 'dPickFraction', 'lxCombined', 'lxCombinedAlone', 'dxDistributed']),
  nudge: { ...NUDGE, wOneTerm: 'panel', dDivNegIntro: 'panel', dBlankBad: 'answer', dUnitFraction: 'blank', dDivOneDigit: 'blank', dDivBad: 'preview', dDivZero: 'preview', dForced: 'fractions', dxTypeX: 'sumbox', dxNegFactor: 'newest' },
  ghost: (s) => (s.mopts?.kind || fracOpen(s) || (KINDS.includes(s.ui?.preview) && DIST_MENU.canPreview(s)) ? moveRow(s, DIST_MENU, { blueFlip: true }) : null),
  forward(s) {
    if (s.mopts?.kind) return { label: 'Go', action: 'go', enabled: goReady(s.mopts) };
    if (fracOpen(s)) return { label: 'Go', action: 'go', enabled: Boolean(fracOf(s.fb)) };
    return null;
  },
  // Multiply (Divide live once each side is one term) and Flip everything (its own button, the same rule). On a forced problem the move
  // owed is the factor while there is a parenthesis (ringed in the row), else the move this equation needs.
  panel(s, moves) {
    const owed = moveOwed(s) && !s.menu && !s.mopts && !s.sub && !xAlone(s.board);
    const one = singleTerm(s.board) && !hasGroup(s.board);
    const flipNeeded = one && coefOn(s.board) < 0;
    Object.assign(moves, multiplyMoves(s, optionOf, { ring: owed && one && !flipNeeded ? 'divide' : null }));
    if (optionOf('flip', s) === 'live') moves.flip = { live: true, move: 'flip', action: 'flipPick', pressed: s.mopts?.kind === 'flip', ring: owed && flipNeeded, attrs: { 'data-mopt': 'flip' } };
    if (owed && (one || hasGroup(s.board))) moves.add.ring = false;
  },
  popups(s, wrap, o, sp) {
    if (sp?.choose) { wrap.append(spotlightLayer({ ...sp, place: 'beside' }, { ...o, text: '', extra: fractionChoices(s, distSolveFeedbackText) })); return true; }
    const remind = REMINDER[s.feedback?.key];
    if (!sp && remind && s.stage === 'moves' && !s.sub && !s.lx?.combine && !s.lx?.distribute) { wrap.append(spotlightLayer({ kind: 'hint', ...remind }, { ...o, text: distSolveFeedbackText(s.feedback) })); return true; }
    return false;
  },
};

export const renderDistSolveScreen = (s) => renderAddBothScreen(s, CARD);
