// The Add to both sides screen, every equation level: the light design (Build D, 2026-10-18; it was lights round 2, behind ?ui=grab).
// Top to bottom of the left column: the work stack with a reserved ghost row under the newest equation (the preview, then the blank
// the amount is typed into, or the blank for a sum being combined), the bottom row [I'm stuck] x = [ ] [the green button] [Teach me],
// the substitution under it, and the small Undo and Start over in the corners. The narrow moves panel is on the right: icons only.
// There is no banner: what the card says is a pop-up (view/spotlight.js), and the line itself is kept only for screen readers.
// There is one green button, in the same place on every screen: only its word changes (Check, Go, Next, Combine, Got it...), it is
// greyed when there is nothing to move forward, and Enter presses it.
//
// Every row is written the way it is said: a negative number after the first term is subtraction, "x − 2" (its minus can be tapped
// to show "x + −2"). The terms of the newest row are tokens that can be grabbed (view/lightsGrabPointer.js).

import { MINUS } from '../engine/expr.js';
import { signed } from '../engine/addBoth.js';
import { factorText } from '../engine/solveTerms.js';
import { xAlone } from '../engine/addBothMoves.js';
import { solve, tradeAvailable, tradePending } from '../engine/cards/add.js';
import { lightsAnswerLive, blankOpen, canChoose, moveOwed, amountMode, canGrab, calcTerm, ADD_SPOT } from '../engine/addBothLights.js';
import { termText, findTerm, likeKey, crossedText, sideText, previewBoard } from '../engine/lightsGrab.js';
import { productLabels } from '../engine/distributeMove.js';
import { spotOf } from '../engine/spotlight.js';
import { lightsFeedbackText } from './addBothLightsFeedback.js';
import { spotlightLayer, findSolveTarget } from './spotlight.js';
import { boardBlock, trayFor, html, slipShown } from './addBothMat.js';
import { narrowPanel } from './narrowPanel.js';
import { optionSel } from './multiplyOptions.js';
import { forwardButton, srLine, notePopup, substBlock as sharedSubstBlock, sideTerms, waitingGhost, foldTag, sameAsLine, divisorOf, rowLine, rowKey, markFlips, FORCED_TEXT, FIRST_TEXT, placeText } from './solveScreen.js';
import { liveOf, onMounted } from './keepRows.js';
import { stackAt } from '../engine/cards/bothSides.js';
import { firstOpen } from './visit.js';
// Count it's counters Mat and its words, read-only, for the help at x alone (Build C, Part 3)
import { renderMat as renderCountersMat } from './mat.js';
import { feedbackText as countersText } from './feedback.js';
import { bigFeedbackText } from './bigFeedback.js';
import { bigNotes } from '../play/bigPlay.js';

// The card this screen draws (Build K): Add to both sides, or a card configured on the same term layer (the Two-step card,
// view/twoStepScreen.js), which names its loop, spotlight, words and Trade places rules, and may add its own rows, panel moves, pop-ups
// and green-button words (`ghost`, `panel`, `popups`, `forward`, `silent`, `nudge`). Set by renderAddBothScreen for the render.
const ADD_CARD = { loop: solve, spot: ADD_SPOT, text: lightsFeedbackText, tradeAvailable, tradePending, alone: xAlone, answerLive: (s) => lightsAnswerLive(s), teach: true };
let C = ADD_CARD;

const btn = (label, action, cls, attrs = {}) => html('button', cls, [label], { type: 'button', 'data-action': action, ...attrs });
const shown = (v) => (v ? v.replace('-', MINUS) : ' ');
const valid = (t) => /^-?\d+$/.test(t ?? '');

// ---------- the pop-ups: what the card says, now that there is no banner ----------

// The forced move (the problem after a correct guess): until the green Next or a move, the page greys out except the problem and the
// moves (and the move's preview while it is hovered).
export const introOpen = (s) => moveOwed(s) && !s.introSeen;
// The very first problem of a visit: "Find the value of x." until the first action.
const firstUp = (s) => firstOpen() && !s.mustMove && s.rows.length === 1 && s.history.length === 0 && !s.sub && !s.entry && s.stage === 'moves' && !s.scaffold;

// What the card says that needs no pop-up: the screen itself shows it (the blank, the rule line, the green button's word, x = live).
export const SILENT = new Set(['aTeachDo', 'aAloneBig', 'aPlace', 'aFindX', 'lxMustMove', 'aMustMove', 'aPickAmount', 'aAmountSet', 'aGreen', 'aSolvedBoard', 'aUndone', 'lxUndone',
  'aStartedOver', 'aPlugIn', 'aPlugCurrent', 'aGuessed', 'lxCombineAsk', 'lxCombined', 'lxCombinedAlone', 'lxCalcAsk', 'lxCalculated', 'aCorrect', 'aSimplerFirst',
  'aZeroUndone', 'aAloneCounters', 'aAloneCount', 'aAlonePB', 'aAloneRight', 'aUndoGuess', 'dxProducts', 'aTraded']);
// Input nudges with nothing to undo: a small pop-up next to where the student is, no dimming.
export const NUDGE = {
  typeAnswer: 'answer', answerUnreadable: 'answer', aFinishMoveFirst: 'answer', aUndoFirst: 'answer', aPickKind: 'answer', typeCount: 'answer',
  aAmountBig: 'blank', aAmountZero: 'blank', aGoNotYet: 'forward', aOtherSide: 'forward',
  aTradeFirst: 'panel', aTradeNot: 'panel', aTradeIntro: 'panel', aLater: 'panel', aNotNeeded: 'panel', aChooseMoveFirst: 'panel',
  lxXCross: 'newest', dxTapMinusFirst: 'newest', lxUnlike: 'newest', lxFactorParen: 'newest',
  dxTapMinusOne: 'newest', dxOneShown: 'newest', dxOneHidden: 'newest', dxTypeOne: 'sumbox',            // (the invisible 1: Build U)
};

// A wrong seesaw move's words, from its picture's numbers (Build F, Part 3).
function slipFeedback(s) {
  const { a, b, kind } = s.slipPair;
  const pairs = kind === 'party' ? 0 : Math.min(Math.abs(a), Math.abs(b));
  return { key: 'aSlipPic', params: { a: signed(a), b: signed(b), sum: signed(a + b), pairs, kind } };
}

function popups(s, wrap) {
  const sp = spotOf(s, C.spot);
  const o = { root: wrap, find: (root, target) => findSolveTarget(root, target, s), undo: '.lx-undo', help: true, moveSel: optionSel, work: '.lb-main' };
  if (C.popups?.(s, wrap, o, sp)) return;                                // the card's own pop-ups first (the Two-step card: its reminders)
  // two small questions at big numbers: their words come from their keys (Build H, Part 3)
  if (sp?.bubbles) { wrap.append(spotlightLayer({ ...sp, bubbles: sp.bubbles.map((b) => ({ ...b, text: C.text({ key: b.key, params: b.params }) })) }, { ...o, text: null })); return; }
  if (sp) { wrap.append(spotlightLayer(sp, { ...o, text: C.text(sp.kind === 'error' && sp.target === 'slip' && slipShown(s) ? slipFeedback(s) : s.feedback) })); return; }
  if (introOpen(s)) {
    const lit = ['newest', 'panel', 'forward', ...(s.ui?.preview ? ['preview'] : [])];
    wrap.append(spotlightLayer({ kind: 'intro', lit }, { ...o, text: FORCED_TEXT }));
    return;
  }
  // the seesaw just built and balanced: "Choose a move" with only the moves lit, the rest greyed (Build D-2, Part 5)
  if (s.scaffold && s.stage === 'moves' && s.feedback?.key === 'aBuilt' && !s.menu) {
    // (the equation and the seesaw it is about stay lit with the moves: never grey out what the question is about, Build H)
    wrap.append(spotlightLayer({ kind: 'intro', lit: ['panel', 'newest', 'board'] }, { ...o, text: C.text(s.feedback) }));
    return;
  }
  // a product being worked out (Build P, Part 2): the factor and its number lit, the blank under them, the rest greyed
  if (s.lx.calc && !s.lx.calc.wrong) {
    wrap.append(spotlightLayer({ kind: 'intro', lit: ['calc', 'calcbox', 'forward'] }, { ...o, text: null }));
    return;
  }
  // two x-terms combined with a bare number (Build P, Part 6): the picture, two x boxes and three x boxes, and "5 of what?", under the pair
  if (s.lx.combine?.pic && !s.lx.combine.wrong) {
    wrap.append(spotlightLayer({ kind: 'hint', target: 'pair', place: 'below', lit: ['sumbox', 'forward'] }, { ...o, text: null, extra: xBoxesPicture(s.lx.combine.pic, C.text(s.feedback)) }));
    return;
  }
  // combining two terms dropped together: they are lit with "Combine" over them, the box for their sum under them, the rest greyed
  if (s.lx.combine && !s.lx.combine.wrong) {
    wrap.append(spotlightLayer({ kind: 'intro', target: 'pair', label: 'Combine', labelTop: true, lit: ['sumbox', 'forward'] }, { ...o, text: null }));
    return;
  }
  // checking a value: everything greys out but the equation being checked and the checking space (and, while the value waits to be
  // dragged in, the value; once it is in, the green Next)
  if (s.sub && s.sub.step < C.loop.subTotal(s.sub)) {
    // (on the seesaw, the balance that mirrors the check is lit with it: it is what the check is drawn on)
    wrap.append(spotlightLayer({ kind: 'intro', lit: ['plugrow', 'check', ...(s.scaffold ? ['board'] : []), s.sub.placing ? 'answer' : 'forward'] }, { ...o, text: s.sub.placing ? placeText(s.sub.typed) : null }));
    return;
  }
  // Teach me: the move to make, in the Add move's blank, with Add lit; the green button says Do it
  if (s.teachFlow && blankOpen(s)) {
    wrap.append(spotlightLayer({ kind: 'hint', target: 'xnum', move: 'add', place: 'below' }, { ...o, text: C.text(s.feedback) }));
    return;
  }
  const note = notePopup(s, { silent: C.silent ?? SILENT, nudge: C.nudge ?? NUDGE, text: C.text, scaffold: s.scaffold ? 'board' : null });
  if (note) { wrap.append(spotlightLayer(note.spot, { ...o, text: note.text })); return; }
  if (firstUp(s)) wrap.append(spotlightLayer({ kind: 'note', place: 'below' }, { ...o, text: FIRST_TEXT }));
}

// The picture for two x-terms combined with a bare number (Build P, Part 6; Solve it's own small drawing): the x boxes of each term (a
// negative term's boxes say −x), a plus between, and the question under them, "5 of what?".
function xBoxesPicture({ a, b }, question) {
  const NS = 'http://www.w3.org/2000/svg';
  const BOX = 30;
  const GAP = 6;
  const groups = [a, b];
  const widths = groups.map((n) => Math.abs(n) * (BOX + GAP) - GAP);
  const PLUS = 30;
  const W = widths[0] + PLUS + widths[1] + 8;
  const H = BOX + 8;
  const svg = document.createElementNS(NS, 'svg');
  for (const [k, v] of Object.entries({ class: 'xb-svg', viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': `${Math.abs(a)} x boxes and ${Math.abs(b)} x boxes` })) svg.setAttribute(k, v);
  const mk = (name, attrs, text) => { const n = document.createElementNS(NS, name); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); if (text) n.textContent = text; svg.append(n); return n; };
  let x = 4;
  groups.forEach((n, g) => {
    for (let i = 0; i < Math.abs(n); i++) {
      mk('rect', { x, y: 4, width: BOX, height: BOX, rx: 6, class: `xb-box${n < 0 ? ' is-neg' : ''}` });
      mk('text', { x: x + BOX / 2, y: 4 + BOX / 2 + 6, 'text-anchor': 'middle', class: 'xb-x' }, n < 0 ? `${MINUS}x` : 'x');
      x += BOX + GAP;
    }
    x -= GAP;
    if (g === 0) { mk('text', { x: x + PLUS / 2, y: 4 + BOX / 2 + 8, 'text-anchor': 'middle', class: 'xb-plus' }, '+'); x += PLUS; }
  });
  return html('div', 'xb-pic', [svg, html('p', 'spot-text xb-question', [question])]);
}

// ---------- the rows, written as they are said ----------

// A side of an inert row (an older equation, the ghost row): "x − 2", or "x + −2" for the terms whose minus was tapped.
const sideEls = (terms, negIds = []) => {
  const out = [];
  terms.forEach((t, i) => {
    // a term just carried across the line (a drag's preview) is shown as the negative or positive it now is, in red or green
    const { op, body } = termText(t, i, negIds.includes(t.id) || Boolean(t.fresh));
    const fresh = t.fresh ? ` is-fresh ${(t.kind === 'x' ? t.coef ?? 1 : t.v) < 0 ? 'is-neg' : 'is-pos'}` : '';
    if (op) out.push(html('span', `lb-plus${fresh}`, [op]));
    out.push(t.kind === 'x' ? html('span', `lb-x${fresh}`, [body]) : t.kind === 'group' ? groupInert(body) : html('span', `lb-num${fresh}`, [body]));
  });
  return out;
};
// A factor times a parenthesis, inert (an older row): its x is an x of its own, so the check can drop the value into it (Build M).
function groupInert(body) {
  const at = body.indexOf('x');
  return html('span', 'lb-num lb-group', [body.slice(0, at), html('span', 'lb-x', ['x']), body.slice(at + 1)]);
}

// The line a move leaves above the new equation: the amount (blue) on both sides, x's numbers struck as they combine.
const xText = (c) => (c === 1 ? 'x' : c === -1 ? `${MINUS}x` : `${String(c).replace('-', MINUS)}x`);
const workEls = (items, negIds = [], judged = false) => {
  const out = [];
  // a cross-off only where the numbers really cancel (+8 and −8), never +8 and +8 (Build D-2)
  const struckSum = items.filter((t) => t.struck && !t.x && !(t.term && t.term.kind !== 'num')).reduce((a, t) => a + (t.term ? t.term.v : t.v), 0);
  const cancels = struckSum === 0;
  const xStruck = items.filter((t) => t.struck && t.x).reduce((a, t) => a + (t.coef ?? 1), 0) === 0;     // (x-terms cancel too: Build R)
  if (!judged) items = items.map((t) => (t.struck && !(t.x ? xStruck : cancels) ? { ...t, struck: false } : t));
  // an x-term added in a column (Build T, Part 5): the amount is written under the side's first x-term, not after the terms
  const under = items.find((t) => t.added && Number.isInteger(t.under));
  if (under) {
    const rest = items.filter((t) => t !== under);
    const els = workEls(rest, negIds, true);                       // (the cancelling pair was judged with the amount in it)
    const term = [...els].filter((e) => !e.classList.contains('lb-plus'))[under.under];
    const amount = html('span', 'lx-under', [html('span', 'lb-plus is-added', ['+']), html('span', `lb-x is-added${under.struck ? ' is-struck' : ''}`, [xText(under.coef ?? 1)])]);
    return term ? els.map((e) => (e === term ? stackCol(e, amount) : e)) : [...els, amount];
  }
  items.forEach((t, i) => {
    if (t.term) {                                                   // (a term other than a number or x: a parenthesis, a fraction; Build M)
      const { op, body } = termText(t.term, i, negIds.includes(t.term.id));
      const cls = `${t.added ? ' is-added' : ''}${t.struck ? ' is-struck' : ''}`;
      if (op) out.push(html('span', `lb-plus${t.added ? ' is-added' : ''}`, [op]));
      out.push(html('span', `${t.term.kind === 'num' ? 'lb-num' : 'lb-x'}${cls}`, [body]));
      return;
    }
    const sub = i > 0 && (t.x ? (t.coef ?? 1) < 0 : t.v < 0);
    if (i > 0) out.push(html('span', `lb-plus${t.added ? ' is-added' : ''}`, [sub ? MINUS : '+']));
    out.push(t.x ? html('span', `lb-x${t.added ? ' is-added' : ''}${t.struck ? ' is-struck' : ''}`, [xText(sub ? -(t.coef ?? 1) : t.coef ?? 1)]) : html('span', `lb-num${t.added ? ' is-added' : ''}${t.struck ? ' is-struck' : ''}`, [sub ? String(-t.v) : signed(t.v)]));
  });
  return out;
};

// A term with what is added to it written underneath, like adding in a column (Build T, Part 5): the x of the amount right under the x
// of the term; the column is as wide as the wider of the two.
function stackCol(term, under) {
  const col = html('span', 'lx-col', []);
  col.append(term, under);
  return col;
}

function eqRow(leftEls, rightEls, cls = '', attrs = {}) {
  const eq = html('div', `lb-eq ${cls}`.trim(), [], attrs);
  eq.append(html('div', 'lb-side lb-left', leftEls, { 'data-side': 'left' }), html('div', 'lb-border', [html('span', 'lb-equals', ['='])]), html('div', 'lb-side lb-right', rightEls, { 'data-side': 'right' }));
  return eq;
}
const eqClass = (chars) => (chars > 30 ? ' is-xlong' : chars > 20 ? ' is-long' : '');
const charsOf = (list) => list.map((x) => (x.term ? charsOf([x.term]) : x.kind === 'group' || x.kind === 'frac' || x.kind === 'neg' ? 6 + charsOf(x.inner) : x.kind === 'x' || x.x ? 2 : String(signed(x.v)).length + 3)).reduce((a, b) => a + b, 0);

// A token of the newest row: the whole signed term, grabbed with its sign. A subtracted number's minus (or, once tapped, the minus of
// the negative number) can be tapped to show the term as a negative number.
function token(s, t, i, side, held) {
  const neg = s.lx.negIds.includes(t.id) || Boolean(t.fresh);
  const { op, body, subtracted, neg: isNeg } = termText(t, i, neg);
  const kids = [];
  // (the invisible 1's minus is its factor, drawn by groupEls: Build U)
  if (op && !(t.kind === 'group' && t.hidden && subtracted)) kids.push(html('span', 'lx-op', [op], subtracted ? { 'data-minus': t.id } : {}));
  const shownNeg = op === '+' && isNeg;                             // a negative shown on request: its minus taps back
  if (t.kind === 'group') kids.push(...groupEls(s, t, i, subtracted, shownNeg));
  else if (shownNeg) kids.push(html('span', 'lx-body lx-negnum', [html('span', 'lx-negsign', [MINUS], { 'data-minus': t.id }), body.slice(1)]));
  else if (t.kind === 'x' && s.hint?.kind === 'coef' && Math.abs(t.coef ?? 1) > 1) {
    // the hint before dividing (Build Q, Part 3): a multiplication dot between the number and its x, `2 · x`, only while it shows
    const [, num] = body.match(/^(.*?)x$/) ?? [null, body];
    kids.push(html('span', 'lx-body lb-x', [num, html('span', 'lb-coefdot', ['·'], { 'aria-label': 'times' }), 'x']));
  } else kids.push(html('span', `lx-body${t.kind === 'x' ? ' lb-x' : ' lb-num'}`, [body]));
  const hint = (s.hint?.kind === 'cancel' && s.hint.id === t.id) || (s.hint?.kind === 'sum' && s.hint.ids.includes(t.id)) || (s.hint?.kind === 'cross' && s.hint.id === t.id);
  const crossHint = s.hint?.kind === 'cross' && s.hint.id === t.id;            // (moved across the =: Variables on both sides, Build R)
  const c = s.lx.combine;
  const said = op ? `${op === '+' ? 'plus' : 'minus'} ${body.replace(MINUS, 'negative ')}` : body.replace(MINUS, 'negative ');
  const lifted = s.ui?.drag?.id === t.id;                                          // the term being dragged leaves a dashed gap
  // an addition that did not cancel: the sum it made is drawn larger, under its spotlight (Build D-2)
  const big = ['aRed', 'aRed3'].includes(s.feedback?.key) && t.kind === 'num' && s.board[side].some((u) => u.kind === 'x');
  const el = html('span', `lx-tok${hint ? ' is-hint' : ''}${crossHint ? ' is-crosshint' : ''}${c && (c.a === t.id || c.b === t.id) ? ' is-pair' : ''}${held ? ' is-held' : ''}${lifted ? ' is-lifted' : ''}${big ? ' is-bigsum' : ''}${valueOfTerm(t) < 0 ? ' is-neg' : ' is-pos'}`, kids, {
    'data-tok': t.id, 'data-side': side, 'data-like': likeKey(t), 'data-fk': `tok:${t.id}`, tabindex: canGrab(s) ? '0' : undefined,
    role: 'button', 'aria-label': `${said}. Enter picks it up${subtracted || neg ? '; the minus key shows it as a negative number' : ''}.`,
  });
  if (s.ui?.focus === `tok:${t.id}` || held) el.dataset.lxFocus = '1';
  return el;
}

const valueOfTerm = (t) => (t.kind === 'num' ? t.v : t.kind === 'x' ? (t.coef ?? 1) : t.factor);
// A fraction factor drawn stacked, its top over its bottom (Build U)
const stacked = (n, d) => html('span', 'lx-sfrac', [html('span', 'lx-sfrac-top', [String(n)]), html('span', 'lx-sfrac-bar'), html('span', 'lx-sfrac-bot', [String(d)])], { 'aria-hidden': 'true' });

// A factor times a parenthesis (Build M): the factor is its own grab handle (dragged onto the parenthesis to distribute), the
// parenthesis is where it is dropped.
function groupEls(s, t, i, subtracted, shownNeg) {
  const carry = s.ui?.carry;
  const holding = carry?.id === `${t.id}:f`;
  const f = t.factor;
  const size = t.den > 1 ? stacked(Math.abs(f), t.den) : String(Math.abs(f));
  // the invisible 1 (Build U): the factor is the minus itself, tapped to show its −1 (at the start of a side too), dragged once it shows
  const one = t.hidden && s.lx.negIds.includes(t.id);
  const text = t.hidden ? [html('span', 'lx-negsign', [MINUS], { 'data-minus': t.id }), ...(one ? ['1'] : [])]
    : subtracted ? [size] : f < 0 ? [html('span', 'lx-negsign', [MINUS], i > 0 ? { 'data-minus': t.id } : {}), size] : [size];
  const hinted = s.hint?.kind === 'factor' && s.hint.id === t.id;
  const owed = moveOwed(s) && !s.lx.distribute;                     // the forced move: the factor to drag is ringed and pulses (Build M)
  const dist = s.lx.distribute?.group === t.id;                    // being distributed: the factor in colour, arcs to each piece (Build P)
  const factor = html('span', `lx-factor${shownNeg ? ' lx-negnum' : ''}${holding ? ' is-held' : ''}${hinted ? ' is-hint' : ''}${owed ? ' is-ring' : ''}${dist ? ' is-distributing' : ''}`, text, {
    'data-tok': `${t.id}:f`, 'data-factor': t.id, 'data-side': findTerm(s.board, t.id)?.side, 'data-fk': `tok:${t.id}:f`, tabindex: canGrab(s) ? '0' : undefined, role: 'button',
    'aria-label': t.hidden && !one ? 'A minus with no number: it means negative 1 times everything inside. The minus key shows its 1.'
      : `The factor ${factorText(f, t.den).replace(MINUS, 'negative ')}. Enter picks it up; drop it on the parenthesis to distribute.`,
  });
  if (holding || s.ui?.focus === `tok:${t.id}:f`) factor.dataset.lxFocus = '1';
  // (each piece inside is its own span, for the arcs drawn to it while the factor is distributed: Build P, Part 5)
  const pieces = t.inner.flatMap((u, k) => { const { op, body } = termText(u, k, false); return [...(op ? [` ${op} `] : []), html('span', 'lx-piece', [body], { 'data-piece-of': t.id })]; });
  const paren = html('span', `lx-paren${holding && carry.slot?.paren ? ' is-combine-target' : ''}${hinted ? ' is-hint' : ''}${owed ? ' is-ring' : ''}`, ['(', ...pieces, ')'], { 'data-paren': t.id });
  return [factor, paren];
}

// A term being dragged by the pointer: the equation it would make if dropped where it is (Build D-2, Part 3: shown in the row itself,
// the moved term as a shadow in its new place). null where the drop would change nothing.
const dragShape = (s) => (s.ui?.drag ? previewBoard(s.board, s.ui.drag.id, s.ui.drag.slot) : null);

// The newest row's side as tokens. While a term is carried by the keyboard, it is drawn lifted at the slot it is over: in a gap, beside
// a like term it would combine with, or on the other side showing its opposite sign.
function liveSide(s, side) {
  const shape = dragShape(s);
  if (shape) {
    const home = s.board[side].map((u) => u.id);
    return shape[side].map((u, i) => {
      const shadow = u.id === s.ui.drag.id || u.fresh;
      const el = token(s, u, i, side, false);
      if (shadow) {
        el.classList.add('is-shadow');
        if (u.fresh) el.classList.add('is-fresh');
      }
      // the moved term and a 0 left on an emptied side are not slots of their own
      if (shadow || !home.includes(u.id)) { el.removeAttribute('data-tok'); el.removeAttribute('tabindex'); el.classList.toggle('is-placeholder', !shadow); }
      return el;
    });
  }
  const carry = s.ui?.carry;
  const held = carry ? findTerm(s.board, carry.id) : null;
  const crossing = Boolean(held) && carry.slot.side !== held.side;
  const list = (held ? s.board[side].filter((t) => t.id !== carry.id) : s.board[side]).map((t) => ({ t }));
  if (held && carry.slot.side === side) {
    const at = carry.slot.onto ? list.findIndex((x) => x.t.id === carry.slot.onto) + 1 : carry.slot.at;
    list.splice(Math.min(at, list.length), 0, { t: held.term, held: true, crossing });
  }
  if (crossing && side === held.side) list.splice(held.at, 0, { gap: true });          // the dashed gap where it was
  let i = 0;
  return list.map((x) => {
    if (x.gap) return html('span', 'lx-tok is-gap', [' '], { 'aria-hidden': 'true' });
    const el = x.crossing
      ? html('span', 'lx-tok is-held is-crossing', [html('span', 'lx-body', [crossedText(x.t.v)]), html('span', 'lx-swap', ['⇄'])], {
        'data-fk': `tok:${x.t.id}`, tabindex: '0', role: 'button', 'data-lx-focus': '1',
        'aria-label': `Carried across the line: ${crossedText(x.t.v).replace(MINUS, 'minus')}. Enter drops it, Escape puts it back.`,
      })
      : token(s, x.t, i, side, Boolean(x.held));
    if (held && carry.slot.onto === x.t.id) el.classList.add('is-combine-target');
    if (crossing && side !== held.side && !x.held) el.classList.add('is-drop');
    i += 1;
    return el;
  });
}

// An animation plays once (Build S): each row carries a key (data-rk), and the Mat is redrawn keeping the rows already on screen
// (view/keepRows.js), so a row's entrance and its cross-off play when it first appears and never again: not on a pickup, a key, a click,
// Undo or a hover. (A guess's row is not a row of the stack: it is drawn with the check.)
function rowsOf(s) {
  const last = s.rows.length - 1;
  const rows = s.rows.map((row, i) => {
    // the move just made animates: its work row and the new equation (a combine or a reorder adds no work row, so only its row)
    const newest = s.rows.length > 1 && (i === last || (i === last - 1 && row.type === 'work'));
    const recent = i === last || (i === last - 1 && row.type === 'work');                   // earlier lines are drawn in lighter ink
    const cls = `lb-rowwrap${!newest ? ' is-settled' : ''}${row.type === 'work' ? ' has-work' : ''}${recent ? '' : ' is-old'}`;
    // a move written as an equation of whole sides: a fraction of both sides, or both sides times −1 (the Two-step card's Multiply)
    if (row.type === 'work' && row.board) {
      const div = { div: row.shown === 'div', work: !row.failed, mi: { n: 0 } };   // (made with the Divide button: division form, Build O; the cross-off, Build P)
      const w = eqRow(sideTerms(row.board.left, s, div), sideTerms(row.board.right, s, div), `lb-work${row.failed ? ' is-failed' : ''}${div.div ? ' is-division' : ''}${eqClass(charsOf([...row.board.left, ...row.board.right]) + 6)}`, { 'aria-hidden': 'true' });
      if (row.failed) w.append(html('span', 'lb-failmark', ['✗']));
      const line = rowLine(row);
      return html('div', `${cls} has-work`, [w, ...(line ? [line] : [])]);
    }
    if (row.type === 'work') {
      const stack = row.work.stack ? ' is-stacked' : '';                // (an x-term added in a column, Build T, Part 5)
      return html('div', `${cls}${stack ? ' is-stackwork' : ''}`, [eqRow(workEls(row.work.left, s.lx.negIds), workEls(row.work.right, s.lx.negIds), `lb-work${stack}${eqClass(charsOf([...row.work.left, ...row.work.right]))}`, { 'aria-hidden': 'true' })]);
    }
    // the equation the value goes back into: the original, or, for a wrong guess after a move, the current one (the loop's rule)
    const plug = Boolean(s.sub) && i === (s.sub.target === 'current' ? last : 0);
    // x alone with a side that is not worked out (`x = ⅓(15)`, `x = −(5)`): written as it is, nothing to pick up
    // (a factor times a parenthesis is live: its factor is grabbed, Build M; a fraction or the opposite of a number beside x is not)
    const inert = [...row.board.left, ...row.board.right].some((u) => u.kind !== 'x' && u.kind !== 'num' && u.kind !== 'group');
    const live = i === last && !plug && s.stage !== 'done' && !inert;
    const chars = eqClass(charsOf([...row.board.left, ...row.board.right]));
    const tag = row.type === 'fold' && row.label ? [foldTag(row.label)] : [];   // (what a folded fraction or flip did, above it)
    let eq;
    const div = { div: row.shown === 'div' };
    // a product that can be worked out on the newest row (Build P, Part 2): its dot (or its fraction bar) is a button; while its blank is
    // open, it is marked so it stays lit
    if (i === last && !plug && s.stage !== 'done') {
      if (s.lx.calc) div.calcOn = s.lx.calc.id;
      else if (canGrab(s)) div.calc = calcTerm(s, C.alone)?.id;
    }
    if (inert && !plug) eq = eqRow(sideTerms(row.board.left, s, div), sideTerms(row.board.right, s, div), `${div.div ? 'is-division ' : ''}${chars}`, { role: div.calc ? 'group' : 'img', 'aria-label': 'The equation' });
    else if (live) eq = eqRow(liveSide(s, 'left'), liveSide(s, 'right'), `lx-live${chars}${s.ui?.carry ? ' is-carrying' : ''}`, { role: 'group', 'aria-label': 'The equation: its terms can be picked up' });
    else {
      // the equation being checked: the value is dragged into its x (or x is tapped), which then changes colour (Build D, Part 2)
      let xi = 0;                                                   // which x of the equation, left to right (two on Level 5, Build M)
      const plugX = (el) => {
        const front = el.textContent.slice(0, -1);                    // the number in front of x stays (`3x`: the Two-step card)
        const at = String(xi++);
        const filled = !s.sub.placing || (s.sub.xs > 1 && s.sub.filled?.includes(Number(at)));
        // more than one x (Build P, Part 8): a drop each; a filled x gets the small green check above it (Build H), an empty one a faint
        // ghost of the value waiting once another x has it
        const manyX = (s.sub.xs ?? 1) > 1;
        const x = !filled
          ? html('span', `lb-x is-plugx is-droptarget${manyX ? ' has-xmark' : ''}`, ['x', ...(manyX && s.sub.filled?.length ? [waitingGhost(s.sub.typed)] : [])], { 'data-x': '1', 'data-xi': at, 'data-action': 'placeValue', role: 'button', tabindex: '0', 'aria-label': 'Put your value into x' })
          : html('span', `lb-x is-plugx is-placed${manyX ? ' has-xmark' : ''}`, ['x', ...(manyX ? [html('span', 'lb-xcheck', ['✓'], { 'aria-label': 'This x has the value' })] : [])], { 'data-x': '1', 'data-xi': at });
        return front ? html('span', 'lb-coef', [front, x]) : x;
      };
      const side = (terms) => sideEls(terms, s.lx.negIds).map((el) => {
        if (!plug) return el;
        if (el.classList.contains('lb-group')) { const inner = el.querySelector('.lb-x'); inner.replaceWith(plugX(inner)); return el; }
        return el.classList.contains('lb-x') ? plugX(el) : el;
      });
      eq = eqRow(side(row.board.left), side(row.board.right), chars, { role: 'img', 'aria-label': 'The equation' });
    }
    return html('div', `${cls}${plug ? ' is-plugrow' : ''}${tag.length ? ' is-fold' : ''}`, [...tag, eq]);
  });
  rows.forEach((el, i) => { el.dataset.rk = rowKey(s.rows[i], i); });
  return markFlips(rows);
}

// ---------- the ghost row: the move's preview and blank, or the blank for a sum ----------

function sumRow(s) {
  const c = s.lx.combine;
  const text = c.entry;
  const box = html('button', `lx-box is-sum${c.wrong ? ' is-wrong' : ''}${s.ui?.shake ? ' is-shake' : ''}${text ? '' : ' is-empty is-blink'} is-focus`, [shown(text)], {
    type: 'button', 'data-fk': 'sum', 'data-lx-field': '1', 'aria-label': 'The sum of the two terms',
  });
  if (s.ui?.focus === 'sum') box.dataset.lxFocus = '1';
  const terms = s.board[c.side];
  const first = Math.min(findTerm(s.board, c.a).at, findTerm(s.board, c.b).at);
  const els = [];
  let k = 0;
  terms.forEach((t) => {
    if (t.id === c.a || t.id === c.b) {
      if (findTerm(s.board, t.id).at !== first) return;
      if (k > 0) els.push(html('span', 'lb-plus', ['+']));
      els.push(html('span', 'lx-boxwrap', [box]));                                // (an x sum is typed whole, the x too: `5x`, Build M)
    } else {
      const { op, body } = termText(t, k, false);
      if (op) els.push(html('span', 'lb-plus', [op]));
      els.push(html('span', t.kind === 'x' ? 'lb-x' : 'lb-num', [body]));
    }
    k += 1;
  });
  const other = sideEls(s.board[c.side === 'left' ? 'right' : 'left']);
  const eq = eqRow(c.side === 'left' ? els : other, c.side === 'left' ? other : els, 'lx-ghosteq lx-sumeq');
  return html('div', 'lx-ghost is-chosen is-sum', [eq]);
}

// The distribute move's products (Build M): one blank per piece of the parenthesis, each labelled with its multiplication; the x blank has
// its x printed after it, so the number in front of x is typed with its sign.
function productRow(s) {
  const d = s.lx.distribute;
  const f = findTerm(s.board, d.group);
  const g = f.term;
  const labels = productLabels(g).map((l) => l.replace(/-/g, MINUS));
  const els = [];
  let k = 0;
  const pushText = (t) => {
    const { op, body } = termText(t, k, s.lx.negIds.includes(t.id));
    if (op) els.push(html('span', 'lb-plus', [op]));
    els.push(html('span', t.kind === 'num' ? 'lb-num' : 'lb-x', [body]));
    k += 1;
  };
  s.board[f.side].forEach((t) => {
    if (t.id !== g.id) { pushText(t); return; }
    g.inner.forEach((term, j) => {
      if (k > 0) els.push(html('span', 'lb-plus', ['+']));
      const text = d.entries[j];
      const box = html('button', `lx-box is-sum${d.wrong === j ? ' is-wrong' : ''}${d.focus === j ? ' is-focus' : ''}${d.focus === j && d.sel && text ? ' is-selected' : ''}${s.ui?.shake && d.focus === j ? ' is-shake' : ''}${text ? '' : ' is-empty'}${d.focus === j && !text ? ' is-blink' : ''}`, [shown(text)], {
        type: 'button', 'data-action': 'focus', 'data-target': 'dist', 'data-index': String(j), 'data-fk': `prod:${j}`, 'data-lx-field': '1', 'aria-label': `${labels[j]}: type the product`,
      });
      if (s.ui?.focus === `prod:${j}`) box.dataset.lxFocus = '1';
      // the x blank has its x printed after it: the number in front of x is typed, with its sign (Build M)
      const after = term.kind === 'x' ? [html('span', 'lb-x lx-prodx', ['x'])] : [];
      // the label (`3 · x`) is the scaffold after a wrong product (Build P, Part 5): until then its place is kept, empty, so nothing moves
      els.push(html('span', `lx-prod${d.wrong === j ? ' is-wrong' : ''}`, [html('span', `lx-prodlabel${s.lx.labels ? '' : ' is-hidden'}`, [labels[j]], s.lx.labels ? {} : { 'aria-hidden': 'true' }), html('span', 'lx-prodbox', [box, ...after])]));
      k += 1;
    });
  });
  const other = sideEls(s.board[f.side === 'left' ? 'right' : 'left'], s.lx.negIds);
  return html('div', 'lx-ghost is-chosen is-sum is-products', [eqRow(f.side === 'left' ? els : other, f.side === 'left' ? other : els, 'lx-ghosteq lx-sumeq')]);
}

// A product being worked out (Build P, Part 2): the side it is on, with a blank in its place for the signed product
function calcRow(s) {
  const c = s.lx.calc;
  const f = findTerm(s.board, c.id);
  const box = html('button', `lx-box is-sum is-calc${c.wrong ? ' is-wrong' : ''}${s.ui?.shake ? ' is-shake' : ''}${c.entry ? '' : ' is-empty is-blink'} is-focus`, [shown(c.entry)], {
    type: 'button', 'data-fk': 'calc', 'data-lx-field': '1', 'aria-label': 'The product, worked out',
  });
  if (s.ui?.focus === 'calc') box.dataset.lxFocus = '1';
  const mine = sideTerms(s.board[f.side], s, { swap: { [c.id]: html('span', 'lx-boxwrap', [box]) } });
  const other = sideTerms(s.board[f.side === 'left' ? 'right' : 'left'], s);
  return html('div', 'lx-ghost is-chosen is-sum is-calcrow', [eqRow(f.side === 'left' ? mine : other, f.side === 'left' ? other : mine, 'lx-ghosteq lx-sumeq')]);
}

function ghostRow(s) {
  const own = C.ghost?.(s);                                    // (the card's own move row: the Two-step card's Multiply)
  if (own) return own;
  if (s.lx.calc) return calcRow(s);
  if (s.lx.distribute) return productRow(s);
  if (s.lx.combine) return sumRow(s);
  // (a term being dragged shows where it would land in its own row, not here: Build D-2, Part 3)
  if (dragShape(s)) return html('div', 'lx-ghost');
  const open = blankOpen(s);
  const preview = !open && canChoose(s) && s.ui?.preview === true;
  const near = !open && canChoose(s) && s.ui?.preview === 'near';             // the pointer is coming: a faint preview
  const usable = open || canChoose(s);
  const slot = html('div', `lx-ghost${open ? ' is-chosen' : preview ? ' is-preview' : near ? ' is-near' : ''}${usable ? ' is-usable' : ''}`);
  if (!usable) return slot;
  // an option of Add hovered or focused while its blank is open (Variables on both sides, Build S): its form, with dashed blanks
  const optKind = open && s.ui?.preview === 'addX' ? 'x' : open && s.ui?.preview === 'addNum' ? 'num' : null;
  if (optKind) slot.classList.add('is-optpreview');
  const typing = open && amountMode(s) && !optKind;
  const text = open ? s.amountEntry : '';
  // the left box is the input; the right box mirrors it as typed
  const left = optKind ? html('span', `lx-box is-mirror${text ? '' : ' is-empty'}`, [shown(text)], { 'aria-hidden': 'true' }) : html('button', `lx-box${typing ? ' is-focus' : ''}${s.ui?.shake ? ' is-shake' : ''}${text ? '' : ' is-empty'}${typing && !text ? ' is-blink' : ''}`, [shown(text)], {
    type: 'button', 'data-action': 'focus', 'data-target': 'amount', 'data-blank': '1', 'data-fk': 'blank', 'data-lx-field': '1',
    'aria-label': 'The amount to add to both sides', ...(open ? {} : { tabindex: '-1' }),
  });
  if (typing && s.ui?.focus === 'blank') left.dataset.lxFocus = '1';      // (only while the keys go to it: Build N)
  const right = html('span', `lx-box is-mirror${text ? '' : ' is-empty'}`, [shown(text)], { 'aria-hidden': 'true' });
  const plus = () => html('span', 'lb-plus lx-plus', ['+']);
  // an x-term (Variables on both sides, Build R): the x printed after each box, so the number in front of x is typed with its sign
  const xKind = optKind ? optKind === 'x' : open ? s.addKind === 'x' : s.ui?.preview === 'addX';
  const xAfter = () => (xKind ? [html('span', 'lb-x lx-addx', ['x'])] : []);
  if (xKind) {
    // an x-term is added in a column (Build T, Part 5): a box under the first x-term of each side (its first term, where it has none),
    // the x printed after it. Either box takes the keys; the other shows the same amount (one amount, both sides). Tab goes between them.
    slot.classList.add('is-stacked');
    const side = s.amountSide === 'right' ? 'right' : 'left';
    const boxOf = (k) => {
      if (optKind || !open) return html('span', `lx-box is-mirror${text ? '' : ' is-empty'}`, [shown(text)], { 'aria-hidden': 'true' });
      const on = typing && k === side;
      const b = html('button', `lx-box is-stackbox${on ? ' is-focus' : ''}${on && s.ui?.shake ? ' is-shake' : ''}${text ? '' : ' is-empty'}${on && !text ? ' is-blink' : ''}`, [shown(text)], {
        type: 'button', 'data-action': 'focus', 'data-target': 'amount', 'data-side': k, 'data-blank': '1', 'data-fk': k === 'left' ? 'blank' : 'blank:right', 'data-lx-field': '1',
        'aria-label': `The number in front of x, to add an x-term to both sides (${k === 'left' ? 'left' : 'right'} side)`,
      });
      if (on && (s.ui?.focus === 'blank' || s.ui?.focus === `blank:${k}`)) b.dataset.lxFocus = '1';
      return b;
    };
    const stacked = (k) => {
      const els = sideEls(s.board[k], s.lx.negIds);
      const at = stackAt(s.board[k]);
      const terms = els.filter((e) => !e.classList.contains('lb-plus'));
      const under = html('span', 'lx-under', [plus(), boxOf(k), ...xAfter()]);
      return terms[at] ? els.map((e) => (e === terms[at] ? stackCol(e, under) : e)) : [...els, under];
    };
    slot.append(eqRow(stacked('left'), stacked('right'), 'lx-ghosteq is-stacked'));
    if (!open) slot.setAttribute('aria-hidden', 'true');
    return slot;
  }
  slot.append(eqRow([...sideEls(s.board.left, s.lx.negIds), plus(), left, ...xAfter()], [...sideEls(s.board.right, s.lx.negIds), plus(), right, ...xAfter()], 'lx-ghosteq'));
  if (!open) slot.setAttribute('aria-hidden', 'true');
  return slot;
}

// ---------- the work stack, with the rule lines of the moves applied ----------

// A move that helped is written under a solid rule line; one that waits for Undo has none.
function workStack(s) {
  const rows = rowsOf(s);
  s.rows.forEach((r, i) => {
    if (r.type === 'eq' && s.rows[i - 1]?.type === 'work' && !(i === s.rows.length - 1 && s.needUndo)) rows[i]?.classList.add('lx-ruled', 'is-solid');
  });
  return html('div', 'lb-stack', [...rows, ghostRow(s)]);
}

// ---------- the one green button ----------

// What moving forward means now: { label, action, enabled }. The first that applies wins.
export function forwardOf(s) {
  const sp = spotOf(s, C.spot);
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
  const own = C.forward?.(s);                                  // (the card's own move's Go: the Two-step card's Multiply)
  if (own) return own;
  if (s.sub?.placing) return { label: 'Next', action: 'nextLine', enabled: false };
  if (s.sub && s.sub.step < C.loop.subTotal(s.sub)) return { label: 'Next', action: 'nextLine', enabled: true };
  if (s.lx.distribute) return { label: 'Go', action: 'lxApply', enabled: s.lx.distribute.entries.every((e) => /\d/.test(e)) && s.lx.distribute.wrong === null };
  if (s.lx.combine) return { label: 'Combine', action: 'lxApply', enabled: (valid(s.lx.combine.entry) || /^-?\d*x$/.test(s.lx.combine.entry)) && !s.lx.combine.wrong };
  if (s.lx.calc) return { label: 'Go', action: 'lxApply', enabled: valid(s.lx.calc.entry) && !s.lx.calc.wrong };
  if (s.combining?.step === 'struck') return { label: 'Next', action: 'crossNext', enabled: true };
  if (s.combining) return { label: 'Check', action: 'check', enabled: false };
  if (s.teachFlow && blankOpen(s) && amountMode(s)) return { label: 'Go', action: 'go', enabled: valid(s.amountEntry) };   // (Karl: Go, as everywhere)
  if (s.scaffold && s.stage === 'moves' && s.menu === 'add') return { label: 'Go', action: 'go', enabled: (Boolean(s.pending?.both) && s.leftDelta === s.rightDelta) || (!s.pending && valid(s.amountEntry) && Number(s.amountEntry) !== 0) };
  if (blankOpen(s) && amountMode(s)) return { label: 'Go', action: 'go', enabled: valid(s.amountEntry) };
  if (!s.sub && (s.unfolded || s.pic)) return { label: 'Next', action: 'foldNext', enabled: true };   // (the loop: a move that folds, a picture)
  return { label: 'Check', action: 'check', enabled: C.answerLive(s) && valid(s.entry) };
}

// ---------- the answer row: x = [ ] [the green button] ----------

function answerRow(s) {
  const live = C.answerLive(s);
  const text = s.sub && !live ? String(s.sub.typed) : s.entry;
  // x = shows no cursor at first: it blinks once clicked (until anything else happens), and at the last step, x alone on its side
  // (and while the keys go into it, once clicked: Build N, the cursor is where the keys go)
  // (never while a sum, the distribute blanks or a Multiply blank takes the keys)
  const free = !s.mopts?.kind && !(s.menu === 'fraction' && s.typing !== 'answer') && !s.lx?.combine && !s.lx?.distribute && !s.lx?.calc;
  const last = live && !amountMode(s) && free && (C.alone(s.board) || Boolean(s.ui?.fieldCursor) || s.typing === 'answer' || s.ui?.focus === 'answer');
  const placing = Boolean(s.sub?.placing);                 // the typed value is what is dragged into x
  const typed = html('button', `ab-typed lb-typed lx-field${text ? '' : ' is-empty'}${last ? ' is-focus' : ''}${last && !text ? ' is-blink' : ''}${live || placing ? '' : ' is-off'}${placing ? ' is-chip' : ''}`, [shown(text)], placing
    ? { type: 'button', 'data-chip': '1', 'data-fk': 'answer', 'data-lx-field': '1', 'aria-label': `Your value ${shown(text)}: drag it into x` }
    : { type: 'button', 'data-action': 'focus', 'data-target': 'answer', 'aria-label': 'Your answer for x', 'data-fk': 'answer', 'data-lx-field': '1' });
  typed.disabled = !live && !placing;
  if (live && s.ui?.focus === 'answer') typed.dataset.lxFocus = '1';
  const f = forwardButton(forwardOf(s));
  if (!f.disabled && ['next', 'nextLine', 'foldNext', 'introNext'].includes(f.dataset.action)) f.dataset.lxFocus = '1';   // the one thing to do
  const row = html('div', 'lb-answerrow lx-answer', [html('strong', `lb-prompt${live || placing ? '' : ' is-off'}`, ['x =']), typed, f]);
  const note = C.answerNote?.(s);                                    // (a card's reason x = waits: "Get x on one side first.", Build R)
  if (note) row.append(html('p', 'lx-answernote', [note]));
  return row;
}

// The checking space: once the value is in x, the copy of the equation with the value in parentheses, then a line a press of the green
// Next, then Balanced or Not balanced. The loop's check, drawn by the shared renderer (view/solveScreen.js), as on every card.
const substBlock = (s) => sharedSubstBlock(s, C.loop);

// The corners: Undo bottom-left; Start over and the help, small and quiet, bottom-right. Teach me appears only after a second error on
// the problem (and flashes as it comes); I'm stuck starts to flash after 10 seconds with nothing done (view/helpTimer.js).
function corners(s) {
  const done = s.stage === 'done';
  const wrongGuess = s.sub?.kind === 'guess' && !s.sub.ok && s.sub.step >= C.loop.subTotal(s.sub);
  const undo = btn('↶ Undo', 'undo', 'btn lx-corner lx-undo', { 'data-key': 'u', 'data-fk': 'undo' });
  undo.disabled = done || !((s.history.length > 0 && !s.sub) || wrongGuess || s.lx.combine || s.lx.distribute);
  if (!undo.disabled && (s.needUndo || wrongGuess || s.lx.combine?.wrong)) undo.classList.add('is-target');
  const over = btn('Start over', 'startOver', 'btn lx-corner lx-startover', { 'data-fk': 'startOver' });
  over.disabled = done || !C.loop.startOverOk(s);                  // (the loop's rule: live once anything has been done)
  return html('div', 'lx-corners', [undo, html('div', 'lx-cornerright', [over, ...helpButtons(s)])]);
}
function helpButtons(s) {
  const off = !C.loop.helpOk(s);
  const stuck = btn('I’m stuck', 'stuck', 'btn lx-corner lx-help', { 'data-key': 's', 'data-fk': 'stuck' });
  stuck.disabled = off;
  const out = [stuck];
  if (C.teach && ((s.errors ?? 0) >= 2 || s.taught > 0)) {          // (no Teach me on a card in basic form)
    const teach = btn('Teach me', 'teach', `btn lx-corner lx-help${s.taught > 0 ? '' : ' is-new'}`, { 'data-key': 't', 'data-fk': 'teach' });
    teach.disabled = off;
    out.push(teach);
  }
  return out;
}

// ---------- the panel: the move icons only ----------

function panel(s) {
  const building = s.stage === 'build';
  const disabled = building || s.stage === 'done' || Boolean(s.combining) || Boolean(s.pending) || Boolean(s.sub) || Boolean(s.lx.combine) || Boolean(s.lx.distribute);
  const menu = s.scaffold || blankOpen(s) ? s.menu : null;
  const moves = {
    add: {
      live: true, pressed: menu === 'add', preview: canChoose(s) && s.ui?.preview === true, near: canChoose(s) && s.ui?.preview === 'near',
      ring: moveOwed(s) && !blankOpen(s) && !C.tradePending(s), focus: s.ui?.focus === 'add',
    },
  };
  // Trade places is live from Level 4 when x is on the right; the first time, it is the move to click
  if (C.tradeAvailable(s)) moves.trade = { live: true, pulse: C.tradePending(s) };
  const lights = building ? {} : { fewer: s.lights.fewer, fewerHand: s.lx.hand.fewer, solved: s.lights.solved, ...Object.fromEntries((C.handLights ?? []).map(([k]) => [k, s.lights[k] ?? 'off'])) };
  const flash = ['red', 'neutral'].includes(s.lights.fewer) && s.history.length > 0 ? ['fewer'] : [];
  C.panel?.(s, moves);                                          // (the card's own moves: the Two-step card's Multiply and Flip)
  const el = narrowPanel(moves, { disabled, lights, open: s.ui?.light ?? null, flash, hand: C.handLights ?? null });
  if (moveOwed(s)) el.classList.add('is-owed');                   // the forced move: the needed move has a steady ring and the pulse
  return el;
}

// Count it's counters walk on the two numbers at x alone, in a tray in the right-hand space beside the work (Build F, Part 2; it was
// an overlay above the numbers): its counter zones stand over the two numbers, as on Count it's Mat. The counters come drawn (Build F,
// Part 3); the tray has only what the walk needs here: Party / Battle if it was not answered at the numbers, then the pairs crossed off
// on the Mat, then the count. (+, − and Check stay for a walk that starts at the drawing.)
// Numbers past the counters' limit (Build D, Part 5): Count it's big-number walk in the same tray, without counters: Party or Battle,
// Add or Subtract, the sign; then the value is typed in x = (the walk never writes it).
function bigTray(s) {
  const b = s.alone.big;
  const tools = html('div', 'alone-tools');
  const choice = (label, action, value, cls = '') => html('button', `btn ${cls}`.trim(), [label], { type: 'button', 'data-action': action, 'data-value': value });
  if (b.step === 'partyBattle') tools.append(choice('Party!', 'cntChoose', 'party', 'btn-party'), choice('Battle!', 'cntChoose', 'battle', 'btn-battle'));
  else if (b.step === 'addSub') tools.append(choice('Add', 'bigOp', 'add'), choice('Subtract', 'bigOp', 'subtract'));
  else if (b.step === 'sign') tools.append(choice('+', 'bigSign', '+'), choice('−', 'bigSign', '-'));
  const notes = bigNotes(b).map((n) => html('p', 'alone-note', [n]));
  const caption = b.step === 'answer' ? 'Now type x.' : b.feedback?.key === 'bigPartyIntro' ? 'Look at the signs: the same (a Party) or different (a Battle)?' : bigFeedbackText(b.feedback);
  return html('div', 'alone-tray is-big', [...notes, html('p', 'alone-caption', [caption]), tools], { role: 'group', 'aria-label': 'Working out the two numbers' });
}
// Count it's words for the counters walk, with the one line that is not true here swapped, in this adapter (Count it itself is not
// touched): the counters arrive already drawn, so "Nice drawing!" would praise a drawing the student did not make (Build H, Part 1).
const aloneWords = (fb) => (fb?.key === 'drawDone' ? 'Party or Battle?' : countersText(fb));
function aloneTray(s) {
  if (s.sub) return null;                                       // the value is being checked: the walk's box is gone (Build D-2, Part 5)
  if (s.alone?.big && s.stage !== 'done') return bigTray(s);
  const w = s.alone?.walk;
  if (!w || s.stage === 'done') return null;
  const tools = html('div', 'alone-tools');
  if (w.step === 'draw') {
    for (const [sign, label] of [['+', '+'], ['-', '−']]) {
      tools.append(html('button', 'btn', [label], { type: 'button', 'data-action': 'cntPick', 'data-sign': sign, 'aria-pressed': String(w.drawSign === sign), 'aria-label': sign === '+' ? 'Draw plus counters' : 'Draw minus counters' }));
    }
    tools.append(html('button', 'btn btn-primary', ['Check ✓'], { type: 'button', 'data-action': 'cntCheck', 'aria-label': 'Check the drawing' }));
  } else if (w.step === 'partyBattle') {
    tools.append(html('button', 'btn btn-party', ['Party!'], { type: 'button', 'data-action': 'cntChoose', 'data-value': 'party' }),
      html('button', 'btn btn-battle', ['Battle!'], { type: 'button', 'data-action': 'cntChoose', 'data-value': 'battle' }));
  }
  const mat = renderCountersMat(w, {});
  mat.setAttribute('viewBox', '100 44 500 226');           // the counter zones over the two numbers, as on Count it's Mat
  // crossing off (Build F, Part 3): a tap on a counter crosses off a pair, a tap on a box every pair it can; crossed-off counters stay
  if (w.step === 'cancel') {
    for (const [zone, cx] of [[0, 210], [1, 490]]) {
      const box = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      Object.entries({ x: cx - 104, y: 50, width: 208, height: 160, rx: 12, class: 'alone-box', 'data-action': 'cntBox', 'data-box': zone, role: 'button', 'aria-label': 'Cross off every pair this box can' })
        .forEach(([k, v]) => box.setAttribute(k, v));
      mat.prepend(box);
    }
  }
  const caption = w.step === 'cancel' ? 'Cross off the pairs: tap a counter, or a whole box.'
    : w.step === 'answer' ? (w.choice === 'party' ? 'Count them all. Type it in x =.' : 'Count who is left. Type it in x =.') : aloneWords(w.feedback);
  return html('div', 'alone-tray', [mat, html('p', 'alone-caption', [caption]), tools], { role: 'group', 'aria-label': 'Counters for the two numbers' });
}

export function renderAddBothScreen(s, card = ADD_CARD) {
  C = card;
  const wrap = html('div', `lb-game lb-eqcard ui-lights ui-grab ui-light${C.cls ? ` ${C.cls}` : ''}`);
  // no banner: the line is kept for screen readers only (while a pop-up is up, it holds the prompt)
  const sp = spotOf(s, C.spot);
  wrap.append(srLine(C.text(sp ? { key: C.spot.prompt(s), params: {} } : s.feedback)));
  const body = html('div', 'lb-body');
  const main = html('div', 'lb-main');
  const work = html('div', 'sv-solve', [html('div', 'lb-eqblock', [workStack(s)])]);
  if (s.scaffold) {
    // The seesaw (and its tray) in the right-hand space beside the work, the slot the check uses: it never covers the equation or the
    // work (Build F, Part 2). At the end the check shares the slot, under the seesaw: both the x on the balance and the equation under it
    // take the value (Build D-2, Part 5).
    const board = boardBlock(s);
    const right = [board];
    if (s.sub) {
      board.classList.add('is-plugrow');
      if (s.sub.placing) {
        for (const x of board.querySelectorAll('[data-x], .ab-eqsvg')) {
          Object.assign(x.dataset, { x: '1', action: 'placeValue' });
          x.classList.add('is-droptarget');
          x.setAttribute('role', 'button');
          x.setAttribute('tabindex', '0');
          x.setAttribute('aria-label', 'Put your value into x');
        }
      }
      right.push(html('div', 'sv-checkspace', [substBlock(s)]));
    } else {
      const tray = trayFor(s);
      if (tray) right.push(tray);
    }
    main.append(html('div', `sv-work has-seesaw${s.sub ? ' is-checking' : ''}`, [work, html('div', 'sv-check', right)]));
  } else {
    // left: the solving space; right: the checking space (and the room the pop-ups use while nothing is being checked), where the
    // walks at x alone draw too
    const walk = aloneTray(s);
    main.append(html('div', `sv-work${s.sub ? ' is-checking' : ''}${walk ? ' has-walk' : ''}`, [work, html('div', 'sv-check', [walk ?? substBlock(s)])]));
  }
  main.append(answerRow(s), corners(s));
  body.append(main, panel(s));
  wrap.append(body);
  popups(s, wrap);
  if (s.lx.distribute) distributeArcs(wrap, s);
  return wrap;
}

// While the factor is distributed (Build P, Part 5): an arc from the factor to each piece inside the parenthesis, a small × on each, and
// "3 groups of" by the parenthesis, drawn under the row once it is on screen (in the room the labels would take: nothing moves).
function distributeArcs(wrap, s) {
  const g = findTerm(s.board, s.lx.distribute.group)?.term;
  if (!g) return;
  const draw = () => {
    const root = liveOf(wrap);                                        // (the Mat on screen: the rows were kept, Build S)
    const f = root.querySelector(`.lx-live [data-factor="${g.id}"]`);
    const paren = root.querySelector(`.lx-live [data-paren="${g.id}"]`);
    const pieces = [...root.querySelectorAll(`.lx-live [data-piece-of="${g.id}"]`)];
    const row = f?.closest('.lb-rowwrap');
    if (!f || !paren || !pieces.length || !row || row.querySelector('.dx-arcs')) return;
    const box = row.getBoundingClientRect();
    const at = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2 - box.left, y: r.bottom - box.top - 6 }; };
    const from = at(f);
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'dx-arcs');
    svg.setAttribute('aria-hidden', 'true');
    const mk = (name, attrs, text) => { const n = document.createElementNS(NS, name); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); if (text) n.textContent = text; svg.append(n); return n; };
    const depth = 30;
    pieces.forEach((p) => {
      const to = at(p);
      const c = { x: (from.x + to.x) / 2, y: Math.max(from.y, to.y) + depth * 1.6 };          // the control point, under both
      mk('path', { d: `M${from.x} ${from.y} Q${c.x} ${c.y} ${to.x} ${to.y}`, class: 'dx-arc' });
      mk('path', { d: `M${to.x - 6} ${to.y + 10} L${to.x} ${to.y} L${to.x + 6} ${to.y + 10}`, class: 'dx-arrowhead' });
      // the small × at the bottom of the arc (a quadratic's middle: a quarter of each end and half the control point)
      const m = { x: (from.x + to.x) / 4 + c.x / 2, y: (from.y + to.y) / 4 + c.y / 2 };
      mk('circle', { cx: m.x, cy: m.y, r: 10, class: 'dx-timesdot' });
      mk('text', { x: m.x, y: m.y + 6, class: 'dx-times', 'text-anchor': 'middle' }, '×');
    });
    const pr = paren.getBoundingClientRect();
    // "3 groups of"; "−1 group of" for the invisible 1; "⅔ of" for a fraction (Build U)
    const ft = factorText(g.factor, g.den);
    mk('text', { x: pr.right - box.left + 10, y: pr.bottom - box.top + 22, class: 'dx-groups' }, g.den > 1 ? `${ft} of` : Math.abs(g.factor) === 1 ? `${ft} group of` : `${ft} groups of`);
    row.append(svg);
  };
  onMounted(wrap, draw);                                             // at once, so a redraw never shows the row without them
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(draw);
}
