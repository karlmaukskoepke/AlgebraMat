// The Flip everything screen (SPEC-FLIP-IT.md rev 1.2) on the shared Solve it loop, laid out like Divide it: the work on the left (the
// equation, each earlier move folded to one row, the current move's work), the checking space on the right, the Multiply move's row
// while an option is hovered or chosen, x = [ ] with the one green button, Undo and the quiet help in the corners, and the narrow moves
// panel (Multiply, Flip everything, Trade places live; Add greyed) with its collapsed lights. Basic form (Build J): no pictures yet.

import { html } from './addBothMat.js';
import { stackRows, substBlock, forwardButton, srLine, notePopup, FORCED_TEXT, FIRST_TEXT, placeText } from './solveScreen.js';
import { multiplyOptions, optionSel } from './multiplyOptions.js';
import { goReady, MULT_KINDS } from '../engine/multiplyMenu.js';
import { moveRow as sharedMoveRow, fractionChoices as sharedFractionChoices } from './multiplyRow.js';
import { flipFeedbackText } from './flipFeedback.js';
import { narrowPanel } from './narrowPanel.js';
import { solve, xAlone, FLIP_SPOT, FLIP_MENU, flipOption, tradeAvailable, tradePending } from '../engine/cards/flip.js';
import { coefOn } from '../engine/fractionMove.js';
import { spotOf } from '../engine/spotlight.js';
import { spotlightLayer, findSolveTarget } from './spotlight.js';
import { MINUS } from '../engine/expr.js';
import { firstOpen } from './visit.js';

const btn = (label, action, cls, attrs = {}) => html('button', cls, [label], { type: 'button', 'data-action': action, ...attrs });
const valid = (t) => /^-?\d+$/.test(t ?? '');
const { fracOpen, canPreview, fracOf } = FLIP_MENU;

// ---------- the one green button ----------

export const introOpen = (s) => solve.moveOwed(s) && !s.introSeen;
const firstUp = (s) => firstOpen() && !s.mustMove && s.rows.length === 1 && s.history.length === 0 && !s.sub && !s.entry && s.stage === 'moves';

export function forwardOf(s) {
  const sp = spotOf(s, FLIP_SPOT);
  if (s.stage === 'done') return { label: 'Next problem', action: 'next', enabled: true };
  if (sp?.kind === 'error') return { label: 'Check', action: 'check', enabled: false };
  if (introOpen(s)) return { label: 'Next', action: 'introNext', enabled: true };
  if (sp?.kind === 'hint') {
    const f = forwardCore(s);
    return f.enabled ? f : { label: 'Got it', action: 'spotDismiss', enabled: true };
  }
  return forwardCore(s);
}
function forwardCore(s) {
  if (s.mopts?.kind) return { label: 'Go', action: 'go', enabled: goReady(s.mopts) };
  if (fracOpen(s)) return { label: 'Go', action: 'go', enabled: Boolean(fracOf(s.fb)) };
  if (s.sub?.placing) return { label: 'Next', action: 'nextLine', enabled: false };
  if (s.sub && s.sub.step < solve.subTotal(s.sub)) return { label: 'Next', action: 'nextLine', enabled: true };
  if (!s.sub && s.unfolded) return { label: 'Next', action: 'foldNext', enabled: true };
  return { label: 'Check', action: 'check', enabled: solve.answerLive(s) && valid(s.entry) };
}

// x = [ ] and the green button. While the value waits to be placed on x, the field is the chip that is dragged.
function answerRow(s) {
  const live = solve.answerLive(s);
  const placing = Boolean(s.sub?.placing);
  const text = s.sub && !live ? String(s.sub.typed) : s.entry;
  const last = live && (xAlone(s.board) || Boolean(s.ui?.fieldCursor) || s.typing === 'answer');   // x = blinks once clicked (and keeps the cursor while typed in), and at the last step: x alone
  const typed = html('button', `ab-typed lb-typed lx-field${text ? '' : ' is-empty'}${last ? ' is-focus' : ''}${last && !text ? ' is-blink' : ''}${placing ? ' is-chip' : ''}${live || placing ? '' : ' is-off'}`, [text ? text.replace('-', MINUS) : ' '], {
    type: 'button', 'data-fk': 'answer', 'data-lx-field': '1',
    ...(placing ? { 'data-chip': '1', 'aria-label': `Your value ${text}: drag it onto x` } : { 'data-action': 'focus', 'data-target': 'answer', 'aria-label': 'Your answer for x' }),
  });
  typed.disabled = !live && !placing;
  const f = forwardButton(forwardOf(s));
  if (!f.disabled && ['next', 'nextLine', 'foldNext', 'introNext'].includes(f.dataset.action)) f.dataset.lxFocus = '1';
  return html('div', 'lb-answerrow lx-answer', [html('strong', `lb-prompt${live || placing ? '' : ' is-off'}`, ['x =']), typed, f]);
}

// The corners: Undo; Start over and the quiet help (I'm stuck flashes after 10 seconds idle). No Teach me on this card yet (basic form).
function corners(s) {
  const done = s.stage === 'done';
  const wrongGuess = s.sub?.kind === 'guess' && !s.sub.ok && s.sub.step >= solve.subTotal(s.sub);
  const undo = btn('↶ Undo', 'undo', 'btn lx-corner lx-undo btn-undo', { 'data-key': 'u', 'data-fk': 'undo' });
  undo.disabled = done || !((s.history.length > 0 && !s.sub) || wrongGuess);
  if (!undo.disabled && (s.fail || s.needUndo || wrongGuess)) undo.classList.add('is-target');
  const over = btn('Start over', 'startOver', 'btn lx-corner lx-startover', { 'data-fk': 'startOver' });
  over.disabled = done || !solve.startOverOk(s);
  const stuck = btn('I’m stuck', 'stuck', 'btn lx-corner lx-help', { 'data-key': 's', 'data-fk': 'stuck' });
  stuck.disabled = done || !solve.helpOk(s);
  return html('div', 'lx-corners', [undo, html('div', 'lx-cornerright', [over, stuck])]);
}

// The narrow panel: Multiply (Divide live from saved Level 4; its whole number and fraction greyed), Flip everything (its own button; Build
// L: no longer a Multiply option), Trade places when x is on the right (from saved Level 3). The lights: No opposite box and Solved for x.
function panel(s) {
  const mapLight = (v) => (v === 'neutral' ? 'off' : v);
  const owed = solve.moveOwed(s) && !s.menu && !s.mopts && !s.sub && !xAlone(s.board);
  const negated = coefOn(s.board) < 0;
  const grey = MULT_KINDS.filter((k) => flipOption(k, s) !== 'live');
  const flyout = s.mopts && !s.mopts.kind ? multiplyOptions(MULT_KINDS, s.ui?.preview, grey) : null;
  const moves = {
    multiply: { live: true, move: 'fraction', action: 'multOpen', label: 'Multiply', pressed: s.menu === 'fraction' || (Boolean(s.mopts) && s.mopts.kind !== 'flip'), ring: owed && !negated, flyout },
    flip: { live: true, move: 'flip', action: 'flipPick', label: 'Flip everything (× −1)', pressed: s.mopts?.kind === 'flip', ring: owed && negated, attrs: { 'data-mopt': 'flip' } },
  };
  if (tradeAvailable(s)) moves.trade = { live: true, pulse: tradePending(s) };
  const el = narrowPanel(moves, {
    disabled: s.stage === 'done' || Boolean(s.sub),
    lights: { noopp: mapLight(s.lights.noopp), solved: xAlone(s.board) ? 'green' : 'off' },
  });
  if (solve.moveOwed(s)) el.classList.add('is-owed');
  return el;
}

// ---------- the pop-ups ----------

const SILENT = new Set(['aPlace', 'aFindX', 'aMustMove', 'dPickFraction', 'aPlugIn', 'aPlugCurrent', 'aSolvedBoard', 'aUndone', 'aCorrect', 'aStartedOver',
  'aSimplerFirst', 'aUndoGuess', 'fTraded']);
const NUDGE = {
  dBlankBad: 'answer', dUnitFraction: 'blank', dDivOneDigit: 'blank', dDivBad: 'preview', dDivZero: 'preview', typeAnswer: 'answer', answerUnreadable: 'answer', aUndoFirst: 'answer', aFinishMoveFirst: 'answer',
  aLater: 'panel', aLaterLevel: 'panel', aNotNeeded: 'panel', aTradeNot: 'panel', aTradeIntro: 'panel', fFlipIntro: 'panel', dForced: 'fractions',
};

const REMINDER = {
  fFlipHint: { target: 'coef', move: 'flip' }, fSignHint: { target: 'coef', move: 'flip' }, dReminder: { target: 'coef', move: 'divOption' },
  fNegHint: { target: 'answer' }, fFracHint: { target: 'answer' },
};

function popups(s, wrap) {
  const sp = spotOf(s, FLIP_SPOT);
  const o = { root: wrap, find: (root, target) => findSolveTarget(root, target, s), undo: '.lx-undo', help: true, moveSel: optionSel, work: '.lb-main' };
  if (sp) { wrap.append(spotlightLayer(sp.choose ? { ...sp, place: 'beside' } : sp, { ...o, text: sp.choose ? '' : flipFeedbackText(s.feedback), extra: sp.choose ? sharedFractionChoices(s, flipFeedbackText) : null })); return; }
  if (introOpen(s)) { wrap.append(spotlightLayer({ kind: 'intro', lit: ['newest', 'panel', 'forward'] }, { ...o, text: FORCED_TEXT })); return; }
  // checking a value: everything greys out but the equation being checked and the checking space
  if (s.sub && s.sub.step < solve.subTotal(s.sub)) {
    wrap.append(spotlightLayer({ kind: 'intro', lit: ['plugrow', 'check', s.sub.placing ? 'answer' : 'forward'] }, { ...o, text: s.sub.placing ? placeText(s.sub.typed) : null }));
    return;
  }
  // I'm stuck's reminder (basic form) lights the move it names, as the hint after Undo does
  const remind = REMINDER[s.feedback?.key];
  if (remind && s.stage === 'moves' && !s.sub) { wrap.append(spotlightLayer({ kind: 'hint', ...remind }, { ...o, text: flipFeedbackText(s.feedback) })); return; }
  const note = notePopup(s, { silent: SILENT, nudge: NUDGE, text: flipFeedbackText, scaffold: null });
  if (note) { wrap.append(spotlightLayer(note.spot, { ...o, text: note.text })); return; }
  if (firstUp(s)) wrap.append(spotlightLayer({ kind: 'note', place: 'below' }, { ...o, text: FIRST_TEXT }));
}

export function renderFlipScreen(s) {
  const wrap = html('div', 'lb-game lb-eqcard dv-light fl-light ui-light');
  const sp = spotOf(s, FLIP_SPOT);
  wrap.append(srLine(flipFeedbackText(sp ? { key: FLIP_SPOT.prompt(s), params: {} } : s.feedback)));
  const body = html('div', 'lb-body');
  const main = html('div', 'lb-main');
  const check = html('div', 'sv-check', s.sub ? [substBlock(s, solve)] : []);
  main.append(html('div', `sv-work${s.sub ? ' is-checking' : ''}`, [html('div', 'sv-solve', [html('div', 'lb-stack', [html('div', 'lb-rows', [...stackRows(s), sharedMoveRow(s, FLIP_MENU, { blueFlip: true })])])]), check]));
  main.append(answerRow(s), corners(s));
  body.append(main, panel(s));
  wrap.append(body);
  popups(s, wrap);
  return wrap;
}
