// The Fractions of x screen (Build AA), laid out like Flip everything's: the work on the left (the equation, each earlier move folded to
// one row, the current move's work), the right-hand space for the check or the model (never both: the check takes it while a value is
// checked), the Multiply move's row while an option is hovered or chosen (or the rewrite's ghost while the fraction is hovered), x = [ ]
// with the one green button, Undo and the quiet help in the corners, and the narrow moves panel.
//
// The model (engine/fractionsModel.js) is a box cut into equal parts, in the look of Group It's fraction walk: one bar, its parts side by
// side, a bracket over the given parts with what they make, a bracket under the whole box marked x. Every part is a button (Tab reaches it,
// Enter selects or fills it); the cut is a row of buttons; the one typed value has a box of its own. Its words sit in its own caption.

import { html } from './addBothMat.js';
import { stackRows, substBlock, forwardButton, srLine, notePopup, FORCED_TEXT, FIRST_TEXT, placeText, sideTerms } from './solveScreen.js';
import { equationRow } from './lightScreen.js';
import { multiplyMoves, optionSel } from './multiplyOptions.js';
import { goReady } from '../engine/multiplyMenu.js';
import { moveRow as sharedMoveRow } from './multiplyRow.js';
import { fractionsFeedbackText, MODEL_KEYS, MODEL_BAD } from './fractionsFeedback.js';
import { narrowPanel } from './narrowPanel.js';
import { solve, xAlone, FRAC_SPOT, FRAC_MENU, fracOption, tradeAvailable, tradePending, xTermOf, hasFx } from '../engine/cards/fractions.js';
import { CUTS, partValues, STEP_KEY, stepParams } from '../engine/fractionsModel.js';
import { mapSides } from '../engine/fractionMove.js';
import { spotOf } from '../engine/spotlight.js';
import { spotlightLayer, findSolveTarget } from './spotlight.js';
import { MINUS } from '../engine/expr.js';
import { firstOpen } from './visit.js';

const btn = (label, action, cls, attrs = {}) => html('button', cls, [label], { type: 'button', 'data-action': action, ...attrs });
const valid = (t) => /^-?\d+$/.test(t ?? '');
const { fracOpen, fracOf } = FRAC_MENU;
const sgn = (v) => String(v).replace('-', MINUS);

// ---------- the one green button ----------

export const introOpen = (s) => solve.moveOwed(s) && !s.introSeen;
const firstUp = (s) => firstOpen() && !s.mustMove && !s.model && s.rows.length === 1 && s.history.length === 0 && !s.sub && !s.entry && s.stage === 'moves';

export function forwardOf(s) {
  const sp = spotOf(s, FRAC_SPOT);
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
  if (s.model && !s.sub && s.model.step === 'select') return { label: 'Go', action: 'mGo', enabled: s.model.sel.length > 0 };
  if (s.model && !s.sub && s.model.step === 'value') return { label: 'Go', action: 'mGo', enabled: valid(s.model.entry) };
  if (s.sub?.placing) return { label: 'Next', action: 'nextLine', enabled: false };
  if (s.sub && s.sub.step < solve.subTotal(s.sub)) return { label: 'Next', action: 'nextLine', enabled: true };
  if (!s.sub && s.unfolded) return { label: 'Next', action: 'foldNext', enabled: true };
  return { label: 'Check', action: 'check', enabled: solve.answerLive(s) && valid(s.entry) };
}

function answerRow(s) {
  const live = solve.answerLive(s);
  const placing = Boolean(s.sub?.placing);
  const text = s.sub && !live ? String(s.sub.typed) : s.entry;
  const modelX = s.model?.step === 'x' && !s.sub;
  const last = live && !FRAC_MENU.typingOpen(s) && (xAlone(s.board) || modelX || Boolean(s.ui?.fieldCursor) || s.typing === 'answer');
  const typed = html('button', `ab-typed lb-typed lx-field${text ? '' : ' is-empty'}${last ? ' is-focus' : ''}${last && !text ? ' is-blink' : ''}${placing ? ' is-chip' : ''}${live || placing ? '' : ' is-off'}`, [text ? text.replace('-', MINUS) : ' '], {
    type: 'button', 'data-fk': 'answer', 'data-lx-field': '1',
    ...(placing ? { 'data-chip': '1', 'aria-label': `Your value ${text}: drag it onto x` } : { 'data-action': 'focus', 'data-target': 'answer', 'aria-label': 'Your answer for x' }),
  });
  typed.disabled = !live && !placing;
  const f = forwardButton(forwardOf(s));
  if (!f.disabled && ['next', 'nextLine', 'foldNext', 'introNext', 'mGo'].includes(f.dataset.action)) f.dataset.lxFocus = '1';
  return html('div', 'lb-answerrow lx-answer', [html('strong', `lb-prompt${live || placing ? '' : ' is-off'}`, ['x =']), typed, f]);
}

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

// The panel: Multiply (the whole number live; one over a blank and the fraction greyed), Divide, Flip everything (from saved Level 4),
// Trade places when x is on the right (from saved Level 5); Add greyed.
function panel(s) {
  const owed = solve.moveOwed(s) && !s.menu && !s.mopts && !s.sub && !xAlone(s.board);
  const negated = (xTermOf(s.board).coef ?? 1) < 0;
  const flipLive = fracOption('flip', s) === 'live';
  const moves = {
    ...multiplyMoves(s, fracOption, { move: 'mult', ring: owed && !(negated && flipLive) ? (hasFx(s.board) ? 'multiply' : 'divide') : null }),
    flip: flipLive ? { live: true, move: 'flip', action: 'flipPick', pressed: s.mopts?.kind === 'flip', ring: owed && negated, attrs: { 'data-mopt': 'flip' } } : { live: false, move: 'flip' },
  };
  if (tradeAvailable(s)) moves.trade = { live: true, pulse: tradePending(s) };
  const el = narrowPanel(moves, { disabled: s.stage === 'done' || Boolean(s.sub), lights: { solved: xAlone(s.board) ? 'green' : 'off' } });
  if (solve.moveOwed(s)) el.classList.add('is-owed');
  return el;
}

// ---------- the model ----------

function brace(label, where, span, of) {
  // a bracket over (or under) `span` of `of` parts, starting at part `at`; drawn as a bordered bar with its label
  return html('div', `fm-brace is-${where}`, [html('span', 'fm-bracelabel', [label])], { style: `--at:${span.at};--span:${span.n};--of:${of}` });
}
export function modelEl(s) {
  const m = s.model;
  const fb = s.feedback && MODEL_KEYS.has(s.feedback.key) ? s.feedback : { key: STEP_KEY[m.step], params: stepParams(m) };
  const caption = html('p', `fm-caption${MODEL_BAD.has(fb.key) ? ' is-bad' : ''}`, [fractionsFeedbackText(fb)], { role: 'status' });
  const wrap = html('div', `fm-model is-${m.step}`, [caption], { 'aria-label': 'The model: x as a box cut into equal parts' });
  const n = m.q ?? 1;
  const values = partValues(m);
  const parts = Array.from({ length: n }, (_, i) => {
    const sel = m.sel.includes(i);
    const v = values[i];
    const typing = m.step === 'value' && sel && i === m.sel[0];
    const kids = typing
      ? [html('span', `lx-box fm-valuebox is-focus${m.entry ? '' : ' is-empty is-blink'}`, [m.entry ? sgn(m.entry) : ' '], { 'data-lx-field': '1', 'aria-label': 'What one part makes' })]
      : v != null ? [sgn(v)] : [];
    const clickable = m.q && (m.step === 'select' || (m.step === 'fill' && !sel && !m.filled.includes(i)));
    const attrs = m.q ? { 'data-action': 'mPart', 'data-i': String(i), 'aria-pressed': String(sel), 'aria-label': `Part ${i + 1} of ${n}${v != null ? `: ${sgn(v)}` : ''}${sel ? ', chosen' : ''}` } : { 'aria-label': 'The whole box, x' };
    const el = html(m.q ? 'button' : 'div', `fm-part${sel ? ' is-sel' : ''}${m.filled.includes(i) ? ' is-filled' : ''}${clickable ? ' is-live' : ''}`, kids, m.q ? { type: 'button', ...attrs } : attrs);
    if (m.q && !clickable && m.step !== 'select') el.setAttribute('tabindex', '-1');
    return el;
  });
  const bar = html('div', 'fm-bar', parts, { style: `--of:${n}` });
  const area = html('div', 'fm-area');
  // over the given parts: what they make (after Go at the select step); the parts are side by side, so the chosen ones are bracketed as a run
  if (m.q && ['value', 'fill', 'x'].includes(m.step) && m.sel.length) {
    const at = Math.min(...m.sel);
    area.append(brace(sgn(m.given), 'over', { at, n: Math.max(...m.sel) - at + 1 }, n));
  }
  area.append(bar, brace('x', 'under', { at: 0, n }, n));
  wrap.append(area);
  if (m.step === 'cut') {
    wrap.append(html('div', 'fm-cuts', [html('span', 'fm-cutlabel', ['Cut into']), ...CUTS.map((q) => btn(`${q}`, 'mCut', 'btn fm-cut', { 'data-q': String(q), 'aria-label': `Cut into ${q} equal parts` })), html('span', 'fm-cutlabel', ['equal parts'])]));
  }
  return wrap;
}

// ---------- the rewrite's ghost (the hover on the fraction) ----------
function rewriteGhost(s) {
  const t = xTermOf(s.board);
  const other = mapSides(s.board, (terms, mine) => (mine ? [{ ...t, form: t.form === 'over' ? 'times' : 'over' }] : terms));
  const slot = html('div', 'lx-ghost dv-ghost is-preview fx-ghost', [], { 'aria-hidden': 'true' });
  slot.append(equationRow(sideTerms(other.left, s), sideTerms(other.right, s), 'lx-ghosteq'));
  return slot;
}

// ---------- the pop-ups ----------

const SILENT = new Set(['aPlace', 'aFindX', 'aMustMove', 'dPickFraction', 'aPlugIn', 'aPlugCurrent', 'aSolvedBoard', 'aUndone', 'aCorrect', 'aStartedOver',
  'aSimplerFirst', 'aUndoGuess', 'fTraded', 'xRewritten', ...MODEL_KEYS]);
const NUDGE = {
  dBlankBad: 'answer', dDivOneDigit: 'blank', dDivBad: 'preview', dDivZero: 'preview', dZeroNo: 'preview', typeAnswer: 'answer', answerUnreadable: 'answer', aUndoFirst: 'answer', aFinishMoveFirst: 'answer',
  aLater: 'panel', aLaterLevel: 'panel', aNotNeeded: 'panel', aTradeNot: 'panel', aTradeIntro: 'panel', fFlipIntro: 'panel', dDivNegIntro: 'panel',
};
const REMINDER = {
  xUnitHint: { target: 'coef', move: 'mult' }, xNonUnitHint: { target: 'coef', move: 'divOption' }, xOverHint: { target: 'coef', move: 'mult' },
  xNegHint: { target: 'coef', move: 'flip' }, xNegFirst: { target: 'coef', move: 'flip' }, xModelFlipFirst: { target: 'coef', move: 'flip' }, xWholeHint: { target: 'coef', move: 'divOption' }, fFlipHint: { target: 'coef', move: 'flip' },
  xTimesHint: { target: 'answer' }, fNegHint: { target: 'answer' }, fFracHint: { target: 'answer' },
};

function popups(s, wrap) {
  const sp = spotOf(s, FRAC_SPOT);
  const o = { root: wrap, find: (root, target) => findSolveTarget(root, target, s), undo: '.lx-undo', help: true, moveSel: optionSel, work: '.lb-main' };
  if (sp) { wrap.append(spotlightLayer(sp, { ...o, text: fractionsFeedbackText(s.feedback) })); return; }
  if (introOpen(s)) { wrap.append(spotlightLayer({ kind: 'intro', lit: ['newest', 'panel', 'forward'] }, { ...o, text: FORCED_TEXT })); return; }
  if (s.sub && s.sub.step < solve.subTotal(s.sub)) {
    wrap.append(spotlightLayer({ kind: 'intro', ...(s.sub.placing ? { place: 'checkspace' } : {}), lit: ['plugrow', 'check', s.sub.placing ? 'answer' : 'forward'] }, { ...o, text: s.sub.placing ? placeText(s.sub.typed) : null }));
    return;
  }
  const remind = REMINDER[s.feedback?.key];
  if (remind && s.stage === 'moves' && !s.sub) { wrap.append(spotlightLayer({ kind: 'hint', ...remind }, { ...o, text: fractionsFeedbackText(s.feedback) })); return; }
  // Level 2's one-time instruction: a pop-up below the action (the equation)
  if (s.feedback?.key === 'xRewriteIntro' && s.stage === 'moves' && !s.sub) { wrap.append(spotlightLayer({ kind: 'note', place: 'below' }, { ...o, text: fractionsFeedbackText(s.feedback) })); return; }
  const note = notePopup(s, { silent: SILENT, nudge: NUDGE, text: fractionsFeedbackText, scaffold: null });
  if (note) { wrap.append(spotlightLayer(note.spot, { ...o, text: note.text })); return; }
  if (firstUp(s)) wrap.append(spotlightLayer({ kind: 'note', place: 'below' }, { ...o, text: FIRST_TEXT }));
}

export function renderFractionsScreen(s) {
  const wrap = html('div', 'lb-game lb-eqcard dv-light fl-light fx-light ui-light');
  const sp = spotOf(s, FRAC_SPOT);
  wrap.append(srLine(fractionsFeedbackText(sp ? { key: FRAC_SPOT.prompt(s), params: {} } : s.feedback)));
  const body = html('div', 'lb-body');
  const main = html('div', 'lb-main');
  const right = s.sub ? [substBlock(s, solve)] : s.model && s.stage !== 'done' ? [modelEl(s)] : [];
  const check = html('div', `sv-check${s.model && !s.sub ? ' has-model' : ''}`, right);
  const ghost = s.ui?.rewrite && !s.mopts && !s.menu && hasFx(s.board) ? rewriteGhost(s) : sharedMoveRow(s, FRAC_MENU, { blueFlip: true });
  main.append(html('div', `sv-work${s.sub ? ' is-checking' : ''}`, [html('div', 'sv-solve', [html('div', 'lb-stack', [html('div', 'lb-rows', [...stackRows(s), ghost])])]), check]));
  main.append(answerRow(s), corners(s));
  body.append(main, panel(s));
  wrap.append(body);
  popups(s, wrap);
  return wrap;
}
