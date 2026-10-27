// The Strange solutions screen (Build V): Variables on both sides' screen (view/bothSidesScreen.js) with its answer in two boxes, `x =
// [ ] / [ ]` (the top, a slash, the bottom; a whole number in the top alone), its value carried into the check as one stacked fraction,
// its own words and its reminders' targets. Rows show a divide that does not split as `x = 15/6`, stacked (view/solveScreen.js).

import { renderAddBothScreen } from './addBothScreen.js';
import { html } from './addBothMat.js';
import { BOTH_CARD } from './bothSidesScreen.js';
import { spotlightLayer } from './spotlight.js';
import { segKids } from './solveScreen.js';
import { strangeFeedbackText } from './strangeFeedback.js';
import { solve } from '../engine/cards/strange.js';
import { lightsAnswerLive } from '../engine/addBothLights.js';
import { signed } from '../engine/solveTerms.js';
import { MINUS } from '../engine/expr.js';

const shown = (v) => (v ? v.replace('-', MINUS) : ' ');
const OWN_REMINDER = {
  sDivideHint: { target: 'coef', move: 'divOption' }, sSimplifyHint: { target: 'answer' }, sTypeHint: { target: 'answer' },
  sFlipHint: { target: 'coef', move: 'flip' }, sNegHint: { target: 'answer' }, sNoXHint: { target: 'answer' },
};

// x = [top] / [bottom]; while the value is checked, the value itself (stacked when it is a fraction), the chip that is dragged into x
function answerField(s, { live, last, placing }) {
  if (s.sub && !live) {
    const text = signed(s.sub.typed);
    const el = html('button', `ab-typed lb-typed lx-field sv-fracchip${placing ? ' is-chip' : ' is-off'}`, segKids(text), placing
      ? { type: 'button', 'data-chip': '1', 'data-fk': 'answer', 'data-lx-field': '1', 'aria-label': `Your value ${text}: drag it into x` }
      : { type: 'button', 'aria-label': `Your value ${text}` });
    el.disabled = !placing;
    return el;
  }
  const part = s.part ?? 'num';
  const box = (which) => {
    const text = which === 'num' ? s.entry : s.den;
    const on = last && part === which;
    const b = html('button', `ab-typed lb-typed lx-field sv-ansbox${on ? ' is-focus' : ''}${on && which === 'den' && s.denSel && text ? ' is-selected' : ''}${text ? '' : ' is-empty'}${on && !text ? ' is-blink' : ''}${live ? '' : ' is-off'}`, [shown(text)], {
      type: 'button', 'data-action': 'focus', 'data-target': which === 'num' ? 'ansTop' : 'ansBottom', 'data-fk': which === 'num' ? 'answer' : 'answer:den', 'data-lx-field': '1',
      'aria-label': which === 'num' ? 'The top of your answer for x (a whole number goes here alone)' : 'The bottom of your answer for x',
    });
    b.disabled = !live;
    if (on && live) b.dataset.lxFocus = '1';
    return b;
  };
  return html('span', `sv-fracans${live ? '' : ' is-off'}`, [box('num'), html('span', 'sv-fracslash', ['/'], { 'aria-hidden': 'true' }), box('den')], { role: 'group', 'aria-label': 'Your answer for x: the top, then the bottom' });
}

const CARD = {
  ...BOTH_CARD,
  loop: solve,
  text: strangeFeedbackText,
  answerLive: (s) => lightsAnswerLive(s, solve),
  answerField,
  nudge: { ...BOTH_CARD.nudge, sSimplify: 'answer', sNoDecimal: 'answer', sZeroBottom: 'answer', sDivideFront: 'preview', sFlipFirst: 'panel' },
  popups(s, wrap, o, sp) {
    const remind = OWN_REMINDER[s.feedback?.key];
    if (!sp && remind && s.stage === 'moves' && !s.sub && !s.lx?.combine && !s.lx?.distribute) {
      wrap.append(spotlightLayer({ kind: 'hint', ...remind }, { ...o, text: strangeFeedbackText(s.feedback) }));
      return true;
    }
    return BOTH_CARD.popups(s, wrap, o, sp);
  },
};

export const renderStrangeScreen = (s) => renderAddBothScreen(s, CARD);
