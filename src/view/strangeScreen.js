// The Strange solutions screen (Build V): Variables on both sides' screen (view/bothSidesScreen.js) with its answer in one box, `x = [3/2]`,
// shown as typed (Build AF; it was two boxes, the top and the bottom, Build V), its value carried into the check as one stacked fraction,
// its own words and its reminders' targets. Rows show a divide that does not split as `x = 15/6`, stacked (view/solveScreen.js).

import { renderAddBothScreen } from './addBothScreen.js';
import { html } from './addBothMat.js';
import { BOTH_CARD } from './bothSidesScreen.js';
import { spotlightLayer } from './spotlight.js';
import { strangeFeedbackText, NO_X_NOTE } from './strangeFeedback.js';
import { solve, concludeOpen, noX, PICKS, STRANGE_SPOT } from '../engine/cards/strange.js';
import { lightsAnswerLive } from '../engine/addBothLights.js';
import { signed } from '../engine/solveTerms.js';
import { MINUS } from '../engine/expr.js';
import { noHelp } from '../engine/noHelp.js';
import { TRY_NOTES } from '../engine/strangeTry.js';
import { renderBalance } from './balance.js';
import { boxText, boxReady } from '../engine/fractionBox.js';

const shown = (v) => (v ? v.replace('-', MINUS) : ' ');
const ready = (top, bottom, part) => boxReady(top, bottom, part);
const OWN_REMINDER = {
  sDivideHint: { target: 'coef', move: 'divOption' }, sSimplifyHint: { target: 'answer' }, sTypeHint: { target: 'answer' },
  sFlipHint: { target: 'coef', move: 'flip' }, sNegHint: { target: 'answer' }, sNoXHint: { target: 'conclude' },
};

// x = [3/2], one box as typed; while the value is checked, the value itself (as typed), the chip that is dragged into x
function answerField(s, { live, last, placing }) {
  if (s.sub && !live) {
    // (the box stays as typed, `3/2`, while the check draws the value stacked: Build AF; it was drawn stacked here too, Build V)
    const text = signed(s.sub.typed);
    const el = html('button', `ab-typed lb-typed lx-field sv-ansbox sv-fracchip${placing ? ' is-chip' : ' is-off'}`, [text], placing
      ? { type: 'button', 'data-chip': '1', 'data-fk': 'answer', 'data-lx-field': '1', 'aria-label': `Your value ${text}: drag it into x` }
      : { type: 'button', 'aria-label': `Your value ${text}` });
    el.disabled = !placing;
    return el;
  }
  // one box, as typed (Build AF): `3/2`, `-4`, `3/`; the same element and name as every card's x = (a click clears it, Enter checks)
  const text = boxText(s.entry, s.den, s.part);
  const b = html('button', `ab-typed lb-typed lx-field sv-ansbox${last ? ' is-focus' : ''}${text ? '' : ' is-empty'}${last && !text ? ' is-blink' : ''}${live ? '' : ' is-off'}`, [shown(text)], {
    type: 'button', 'data-action': 'focus', 'data-target': 'answer', 'data-fk': 'answer', 'data-lx-field': '1', 'aria-label': 'x equals',
  });
  b.disabled = !live;
  if (last && live) b.dataset.lxFocus = '1';
  return b;
}

// The two conclusion buttons (Build V2), beside x = in the answer row while no x is left: the main line and the smaller line under it
// ("No solution" / "never balanced", "Infinitely many" / "always balanced"; Karl: "use both"). Real buttons: Tab reaches them, Enter or
// Space picks. After a right pick the picked one stays, marked, and the other goes.
const SUB = { none: 'never balanced', all: 'always balanced' };
function conclusions(s) {
  const open = concludeOpen(s);
  const picked = s.stage === 'done' && s.concluded ? s.concluded : null;
  if (!open && !picked) return null;
  const waiting = s.feedback?.key === 'sConcludeWrong';
  const b = (pick) => {
    const el = html('button', `btn sv-pick${picked === pick ? ' is-picked' : ''}`, [html('span', 'sv-pick-main', [PICKS[pick]]), html('span', 'sv-pick-sub', [SUB[pick]])], {
      type: 'button', 'data-action': 'conclude', 'data-pick': pick, 'data-fk': `conclude:${pick}`, 'aria-label': `${PICKS[pick]}: ${SUB[pick]}`,
    });
    el.disabled = Boolean(picked) || waiting;
    return el;
  };
  const kids = picked ? [b(picked)] : [b('none'), b('all')];
  return html('div', 'sv-conclude', kids, { role: 'group', 'aria-label': 'What does the equation say?' });
}

// After a right pick (Build V2): the confirm line, in the words of the balance, in the checking space (where a value's check would be);
// then "Try a number" (not in a no-help attempt): the box for a number, and once its check is done, the balance with Karl's line and the
// line after it. Never red, no Undo, nothing recorded.
const tryBox = (t) => {
  const text = boxText(t.entry, t.den, t.part);
  const box = html('button', `ab-typed lb-typed lx-field sv-ansbox sv-trybox is-focus${text ? '' : ' is-empty is-blink'}`, [shown(text)], {
    type: 'button', 'data-action': 'focus', 'data-target': 'tryBox', 'data-lx-field': '1', 'aria-label': 'x equals',
  });
  return html('div', 'sv-tryrow', [html('strong', 'sv-tryx', ['x =']), box]);
};
function concluded(s) {
  if (!(s.stage === 'done' && s.concluded)) return null;
  const kids = [html('p', 'sv-confirm', [strangeFeedbackText(s.feedback)], { role: 'status' })];
  const t = s.trial;
  if (!noHelp()) {
    if (t?.result) {
      kids.push(html('div', 'sv-balance', [renderBalance({ problem: s.problem, value: t.result.value, result: t.result, key: JSON.stringify(s.problem.left) + JSON.stringify(s.problem.right) })]));
      kids.push(html('p', 'sv-tryline', [t.result.line], { role: 'status' }), html('p', 'sv-tryafter', [t.result.after]));
      kids.push(html('button', 'btn sv-trybtn', ['Try a number'], { type: 'button', 'data-action': 'tryAgain' }));
    } else if (t?.typing) {
      kids.push(html('p', 'sv-tryask', ['Type any number for x, then Try.']), tryBox(t));
      if (t.note) kids.push(html('p', 'sv-trynote', [TRY_NOTES[t.note]]));
    } else {
      kids.push(html('button', 'btn sv-trybtn', ['Try a number'], { type: 'button', 'data-action': 'tryOpen' }));
    }
  }
  return html('div', `sv-concluded${t?.result ? ' has-balance' : ''}`, kids);
}
// the try's check: drawn by the usual renderer, on a view of the problem where the check in hand is the try's (the original equation,
// the student's number dragged into each x, a line a press; it stops at the last line, with no mark: the balance follows)
function tryView(s) {
  const t = s.trial;
  if (!(s.stage === 'done' && t?.sub && !t.result)) return null;
  const sub = { ...t.sub, lines: t.sub.lines, step: Math.min(t.sub.step, t.sub.lines.length) };
  return { ...s, stage: 'moves', step: 'moves', sub, history: [], needUndo: false, spot: null, concluded: null, unfolded: false,
    feedback: { key: sub.placing ? 'aPlace' : 'aPlugIn', params: { typed: signed(t.sub.typed), where: 'original' }, bad: false } };
}
// (Try waits for a number, and for the bottom once the slash is typed: `3/`, Build AF)
const doneForward = (s) => (s.trial?.typing && !noHelp() ? { label: 'Try', action: 'check', enabled: ready(s.trial.entry, s.trial.den, s.trial.part) && !/\./.test(s.trial.den) } : null);

const CARD = {
  ...BOTH_CARD,
  checkSpace: concluded,
  doneForward,
  spot: STRANGE_SPOT,
  answerNote: (s) => (s.stage === 'moves' && !s.sub && noX(s.board) ? NO_X_NOTE : BOTH_CARD.answerNote(s)),
  answerExtra: conclusions,
  loop: solve,
  text: strangeFeedbackText,
  answerLive: (s) => lightsAnswerLive(s, solve),
  answerField,
  // (the green Check waits for the bottom once the slash is typed, `3/`: Build AF)
  answerReady: (s) => /^-?\d+$/.test(s.entry ?? '') && (s.part !== 'den' || /^\d+$/.test(s.den ?? '')),
  nudge: { ...BOTH_CARD.nudge, sNoMoves: 'conclude', sSimplify: 'answer', sNoDecimal: 'answer', sZeroBottom: 'answer', sDivideFront: 'preview', sFlipFirst: 'panel' },
  popups(s, wrap, o, sp) {
    const remind = OWN_REMINDER[s.feedback?.key];
    if (!sp && remind && s.stage === 'moves' && !s.sub && !s.lx?.combine && !s.lx?.distribute) {
      wrap.append(spotlightLayer({ kind: 'hint', ...remind }, { ...o, text: strangeFeedbackText(s.feedback) }));
      return true;
    }
    return BOTH_CARD.popups(s, wrap, o, sp);
  },
};

export const renderStrangeScreen = (s) => renderAddBothScreen(tryView(s) ?? s, CARD);
