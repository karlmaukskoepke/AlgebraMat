// The Variables on both sides screen (Build R, basic form): Add to both sides' screen (view/addBothScreen.js) configured like Distribute's
// (view/distSolveScreen.js): the work stack with grabbable terms (an x-term dragged across the = is the Add of its opposite), Add with two
// options beside it (a number, `+ ▢`, or an x-term, `+ ▢x`), the shared Multiply move (Divide, Fraction and Flip everything once each side
// is one term), Trade places when x is on the right, the distribute move at Level 5, `x =` greyed with a note while x is on both sides,
// the lights (x on one side, No parentheses) and the reminders I'm stuck gives. No Teach me, seesaw, counters or pictures.

import { renderAddBothScreen, SILENT, NUDGE } from './addBothScreen.js';
import { html } from './addBothMat.js';
import { moveRow, fractionChoices } from './multiplyRow.js';
import { multiplyMoves } from './multiplyOptions.js';
import { goReady } from '../engine/multiplyMenu.js';
import { spotlightLayer } from './spotlight.js';
import { bothSidesFeedbackText, ONE_SIDE_NOTE } from './bothSidesFeedback.js';
import { solve, xAlone, xBoth, OPTION_LIVE, tradeAvailable, BOTH_MENU, BOTH_SPOT } from '../engine/cards/bothSides.js';
import { lightsAnswerLive } from '../engine/addBothLights.js';

const { fracOpen, fracOf } = BOTH_MENU;
const KINDS = ['whole', 'div', 'frac', 'flip'];

export const introOpen = () => false;                    // (no forced move on this card: there is no guess at the first state)

const REMINDER = {
  vMoveXHint: { target: 'hinted' }, mDistributeHint: { target: 'factor' }, mTapMinusHint: { target: 'factor' }, mCombineHint: { target: 'hinted' },
  wCombineHint: { target: 'otherSide' }, aStuckHint: { target: 'xnum', move: 'add' }, dReminder: { target: 'coef', move: 'divOption' },
  mWorkOut: { target: 'answer' }, fFlipHint: { target: 'coef', move: 'flip' }, fSignHint: { target: 'coef', move: 'flip' }, fNegHint: { target: 'answer' }, fFracHint: { target: 'answer' },
};

// Add's two options, beside the button while its blank is open (or hovered): a number, `+ ▢ = + ▢`, or an x-term, `+ ▢x = + ▢x`
function addOptions(s) {
  const opt = (kind, kids, label) => html('button', `btn mo-opt${(s.addKind ?? 'num') === kind ? ' is-on' : ''}${s.ui?.preview === (kind === 'x' ? 'addX' : 'addNum') ? ' is-preview' : ''}`, kids, {
    type: 'button', 'data-action': 'addPick', 'data-kind': kind, 'data-aopt': kind, 'aria-label': label,
  });
  const box = () => html('span', 'mo-box');
  return html('div', 'mo-flyout ao-flyout', [
    opt('num', ['+ ', box(), ' = + ', box()], 'Add a number to both sides'),
    opt('x', ['+ ', box(), html('span', 'ao-x', ['x']), ' = + ', box(), html('span', 'ao-x', ['x'])], 'Add an x-term to both sides'),
  ], { role: 'group', 'aria-label': 'Add' });
}

const CARD = {
  loop: solve,
  spot: BOTH_SPOT,
  text: bothSidesFeedbackText,
  tradeAvailable,
  tradePending: () => false,
  alone: xAlone,
  answerLive: (s) => lightsAnswerLive(s, solve),
  answerNote: (s) => (s.stage === 'moves' && !s.sub && xBoth(s.board) ? ONE_SIDE_NOTE : null),
  teach: false,
  cls: 'ts-light ds-light vb-light',
  handLights: [['xone', 'x on one side'], ['noparen', 'No parentheses']],
  silent: new Set([...SILENT, 'dPickFraction', 'lxCombined', 'lxCombinedAlone', 'dxDistributed', 'vPickX']),
  nudge: { ...NUDGE, wOneTerm: 'panel', vOneSide: 'panel', dDivNegIntro: 'panel', dBlankBad: 'answer', dUnitFraction: 'blank', dDivOneDigit: 'blank', dDivBad: 'preview', dDivZero: 'preview', dForced: 'fractions', dxTypeX: 'sumbox', dxNegFactor: 'newest' },
  ghost: (s) => (s.mopts?.kind || fracOpen(s) || (KINDS.includes(s.ui?.preview) && BOTH_MENU.canPreview(s)) ? moveRow(s, BOTH_MENU, { blueFlip: true }) : null),
  forward(s) {
    if (s.mopts?.kind) return { label: 'Go', action: 'go', enabled: goReady(s.mopts) };
    if (fracOpen(s)) return { label: 'Go', action: 'go', enabled: Boolean(fracOf(s.fb)) };
    return null;
  },
  panel(s, moves) {
    Object.assign(moves, multiplyMoves(s, OPTION_LIVE));
    if (OPTION_LIVE('flip', s) === 'live') moves.flip = { live: true, move: 'flip', action: 'flipPick', pressed: s.mopts?.kind === 'flip', attrs: { 'data-mopt': 'flip' } };
    if (s.menu === 'add' && s.stage === 'moves' && !s.sub) moves.add.flyout = addOptions(s);
  },
  popups(s, wrap, o, sp) {
    if (sp?.choose) { wrap.append(spotlightLayer({ ...sp, place: 'beside' }, { ...o, text: '', extra: fractionChoices(s, bothSidesFeedbackText) })); return true; }
    const remind = REMINDER[s.feedback?.key];
    if (!sp && remind && s.stage === 'moves' && !s.sub && !s.lx?.combine && !s.lx?.distribute) { wrap.append(spotlightLayer({ kind: 'hint', ...remind }, { ...o, text: bothSidesFeedbackText(s.feedback) })); return true; }
    return false;
  },
};

export const renderBothSidesScreen = (s) => renderAddBothScreen(s, CARD);
