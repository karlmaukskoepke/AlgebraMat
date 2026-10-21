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
import { xAlone } from '../engine/addBothMoves.js';
import { solve, tradeAvailable, tradePending } from '../engine/cards/add.js';
import { lightsAnswerLive, blankOpen, canChoose, moveOwed, amountMode, canGrab, ADD_SPOT } from '../engine/addBothLights.js';
import { termText, findTerm, likeKey, crossedText, sideText, previewBoard } from '../engine/lightsGrab.js';
import { productLabels, needsFlip } from '../engine/distributeDrill.js';
import { spotOf } from '../engine/spotlight.js';
import { lightsFeedbackText } from './addBothLightsFeedback.js';
import { spotlightLayer, findSolveTarget } from './spotlight.js';
import { boardBlock, trayFor, html, slipShown } from './addBothMat.js';
import { narrowPanel } from './narrowPanel.js';
import { multiplyOptions } from './multiplyOptions.js';
import { forwardButton, srLine, notePopup, substBlock as sharedSubstBlock, FORCED_TEXT, FIRST_TEXT, placeText } from './solveScreen.js';
import { firstOpen } from './visit.js';
// Count it's counters Mat and its words, read-only, for the help at x alone (Build C, Part 3)
import { renderMat as renderCountersMat } from './mat.js';
import { feedbackText as countersText } from './feedback.js';
import { bigFeedbackText } from './bigFeedback.js';
import { bigNotes } from '../play/bigPlay.js';

const btn = (label, action, cls, attrs = {}) => html('button', cls, [label], { type: 'button', 'data-action': action, ...attrs });
const shown = (v) => (v ? v.replace('-', MINUS) : ' ');
const valid = (t) => /^-?\d+$/.test(t ?? '');

// ---------- the pop-ups: what the card says, now that there is no banner ----------

// The forced move (the problem after a correct guess): until the green Next or a move, the page greys out except the problem and the
// moves (and the move's preview while it is hovered).
export const introOpen = (s) => moveOwed(s) && !s.introSeen && !s.drill;
// The very first problem of a visit: "Find the value of x." until the first action.
const firstUp = (s) => firstOpen() && !s.drill && !s.mustMove && s.rows.length === 1 && s.history.length === 0 && !s.sub && !s.entry && s.stage === 'moves' && !s.scaffold;

// What the card says that needs no pop-up: the screen itself shows it (the blank, the rule line, the green button's word, x = live).
const SILENT = new Set(['dxMultPick', 'dxWholeAsk', 'dxMultAsk', 'dxFlipAsk', 'aTeachDo', 'aAloneBig', 'aPlace', 'aFindX', 'lxMustMove', 'aMustMove', 'aPickAmount', 'aAmountSet', 'aGreen', 'aSolvedBoard', 'aUndone', 'lxUndone',
  'aStartedOver', 'aPlugIn', 'aPlugCurrent', 'aGuessed', 'lxCombineAsk', 'lxCombined', 'lxCombinedAlone', 'aCorrect', 'aSimplerFirst',
  'aZeroUndone', 'aAloneCounters', 'aAloneCount', 'aAlonePB', 'aAloneRight', 'aUndoGuess', 'dxProducts', 'dxRight', 'dxCrossed', 'aTraded']);
// Input nudges with nothing to undo: a small pop-up next to where the student is, no dimming.
const NUDGE = {
  dxMultNo: 'newest',
  typeAnswer: 'answer', answerUnreadable: 'answer', aFinishMoveFirst: 'answer', aUndoFirst: 'answer', aPickKind: 'answer', typeCount: 'answer',
  aAmountBig: 'blank', aAmountZero: 'blank', aGoNotYet: 'forward', aOtherSide: 'forward',
  aTradeFirst: 'panel', aTradeNot: 'panel', aTradeIntro: 'panel', aLater: 'panel', aNotNeeded: 'panel', aChooseMoveFirst: 'panel', dxDragOnly: 'panel',
  lxXCross: 'newest', dxTapMinusFirst: 'newest', dxGroupCross: 'newest',
};

// A wrong seesaw move's words, from its picture's numbers (Build F, Part 3).
function slipFeedback(s) {
  const { a, b, kind } = s.slipPair;
  const pairs = kind === 'party' ? 0 : Math.min(Math.abs(a), Math.abs(b));
  return { key: 'aSlipPic', params: { a: signed(a), b: signed(b), sum: signed(a + b), pairs, kind } };
}

function popups(s, wrap) {
  const sp = s.drill ? null : spotOf(s, ADD_SPOT);
  const o = { root: wrap, find: findSolveTarget, undo: '.lx-undo', help: true, moveSel: (m) => `[data-move="${m}"]`, work: '.lb-main' };
  if (sp) { wrap.append(spotlightLayer(sp, { ...o, text: lightsFeedbackText(sp.kind === 'error' && sp.target === 'slip' && slipShown(s) ? slipFeedback(s) : s.feedback) })); return; }
  if (introOpen(s)) {
    const lit = ['newest', 'panel', 'forward', ...(s.ui?.preview ? ['preview'] : [])];
    wrap.append(spotlightLayer({ kind: 'intro', lit }, { ...o, text: FORCED_TEXT }));
    return;
  }
  // the seesaw just built and balanced: "Choose a move" with only the moves lit, the rest greyed (Build D-2, Part 5)
  if (s.scaffold && s.stage === 'moves' && s.feedback?.key === 'aBuilt' && !s.menu) {
    // (the equation and the seesaw it is about stay lit with the moves: never grey out what the question is about, Build H)
    wrap.append(spotlightLayer({ kind: 'intro', lit: ['panel', 'newest', 'board'] }, { ...o, text: lightsFeedbackText(s.feedback) }));
    return;
  }
  // combining two terms dropped together: they are lit with "Combine" over them, the box for their sum under them, the rest greyed
  if (s.lx.combine && !s.lx.combine.wrong) {
    wrap.append(spotlightLayer({ kind: 'intro', target: 'pair', label: 'Combine', labelTop: true, lit: ['sumbox', 'forward'] }, { ...o, text: null }));
    return;
  }
  // checking a value: everything greys out but the equation being checked and the checking space (and, while the value waits to be
  // dragged in, the value; once it is in, the green Next)
  if (s.sub && s.sub.step < solve.subTotal(s.sub)) {
    // (on the seesaw, the balance that mirrors the check is lit with it: it is what the check is drawn on)
    wrap.append(spotlightLayer({ kind: 'intro', lit: ['plugrow', 'check', ...(s.scaffold ? ['board'] : []), s.sub.placing ? 'answer' : 'forward'] }, { ...o, text: s.sub.placing ? placeText(s.sub.typed) : null }));
    return;
  }
  // Teach me: the move to make, in the Add move's blank, with Add lit; the green button says Do it
  if (s.teachFlow && blankOpen(s)) {
    wrap.append(spotlightLayer({ kind: 'hint', target: 'xnum', move: 'add', place: 'below' }, { ...o, text: lightsFeedbackText(s.feedback) }));
    return;
  }
  // the drill's end: a negative in front of x: a hint lights Flip everything
  if (s.drill && s.stage !== 'done' && !s.lx.mult && !s.lx.mopts && needsFlip(s.board)) {
    wrap.append(spotlightLayer({ kind: 'hint', target: 'newest', move: 'multiply', place: 'below' }, { ...o, text: lightsFeedbackText({ key: 'dxFlipHint' }) }));
    return;
  }
  const note = notePopup(s, { silent: SILENT, nudge: NUDGE, text: lightsFeedbackText, scaffold: s.scaffold ? 'board' : null });
  if (note) { wrap.append(spotlightLayer(note.spot, { ...o, text: note.text })); return; }
  if (firstUp(s)) wrap.append(spotlightLayer({ kind: 'note', place: 'below' }, { ...o, text: FIRST_TEXT }));
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
    out.push(t.kind === 'x' ? html('span', `lb-x${fresh}`, [body]) : html('span', `lb-num${fresh}`, [body]));
  });
  return out;
};

// The line a move leaves above the new equation: the amount (blue) on both sides, x's numbers struck as they combine.
const workEls = (items, negIds = []) => {
  const out = [];
  // a cross-off only where the numbers really cancel (+8 and −8), never +8 and +8 (Build D-2)
  const struckSum = items.filter((t) => t.struck && !t.x && !(t.term && t.term.kind !== 'num')).reduce((a, t) => a + (t.term ? t.term.v : t.v), 0);
  const cancels = struckSum === 0;
  items = items.map((t) => (t.struck && !cancels ? { ...t, struck: false } : t));
  items.forEach((t, i) => {
    if (t.term) {                                                   // (the drill writes its work rows with whole terms)
      const { op, body } = termText(t.term, i, negIds.includes(t.term.id));
      const cls = `${t.added ? ' is-added' : ''}${t.struck ? ' is-struck' : ''}`;
      if (op) out.push(html('span', `lb-plus${t.added ? ' is-added' : ''}`, [op]));
      out.push(html('span', `${t.term.kind === 'num' ? 'lb-num' : 'lb-x'}${cls}`, [body]));
      return;
    }
    const sub = i > 0 && !t.x && t.v < 0;
    if (i > 0) out.push(html('span', `lb-plus${t.added ? ' is-added' : ''}`, [sub ? MINUS : '+']));
    out.push(t.x ? html('span', 'lb-x', ['x']) : html('span', `lb-num${t.added ? ' is-added' : ''}${t.struck ? ' is-struck' : ''}`, [sub ? String(-t.v) : signed(t.v)]));
  });
  return out;
};

function eqRow(leftEls, rightEls, cls = '', attrs = {}) {
  const eq = html('div', `lb-eq ${cls}`.trim(), [], attrs);
  eq.append(html('div', 'lb-side lb-left', leftEls, { 'data-side': 'left' }), html('div', 'lb-border', [html('span', 'lb-equals', ['='])]), html('div', 'lb-side lb-right', rightEls, { 'data-side': 'right' }));
  return eq;
}
const eqClass = (chars) => (chars > 30 ? ' is-xlong' : chars > 20 ? ' is-long' : '');
const charsOf = (list) => list.map((x) => (x.term ? charsOf([x.term]) : x.kind === 'group' ? 6 + charsOf(x.inner) : x.kind === 'x' || x.x ? 2 : String(signed(x.v)).length + 3)).reduce((a, b) => a + b, 0);

// A token of the newest row: the whole signed term, grabbed with its sign. A subtracted number's minus (or, once tapped, the minus of
// the negative number) can be tapped to show the term as a negative number.
function token(s, t, i, side, held) {
  const neg = s.lx.negIds.includes(t.id) || Boolean(t.fresh);
  const { op, body, subtracted, neg: isNeg } = termText(t, i, neg);
  const kids = [];
  if (op) kids.push(html('span', 'lx-op', [op], subtracted ? { 'data-minus': t.id } : {}));
  const shownNeg = op === '+' && isNeg;                             // a negative shown on request: its minus taps back
  if (t.kind === 'group') kids.push(...groupEls(s, t, i, subtracted, shownNeg));
  else if (shownNeg) kids.push(html('span', 'lx-body lx-negnum', [html('span', 'lx-negsign', [MINUS], { 'data-minus': t.id }), body.slice(1)]));
  else kids.push(html('span', `lx-body${t.kind === 'x' ? ' lb-x' : ' lb-num'}`, [body]));
  const hint = (s.hint?.kind === 'cancel' && s.hint.id === t.id) || (s.hint?.kind === 'sum' && s.hint.ids.includes(t.id));
  const c = s.lx.combine;
  const said = op ? `${op === '+' ? 'plus' : 'minus'} ${body.replace(MINUS, 'negative ')}` : body.replace(MINUS, 'negative ');
  const lifted = s.ui?.drag?.id === t.id;                                          // the term being dragged leaves a dashed gap
  // an addition that did not cancel: the sum it made is drawn larger, under its spotlight (Build D-2)
  const big = ['aRed', 'aRed3'].includes(s.feedback?.key) && t.kind === 'num' && s.board[side].some((u) => u.kind === 'x');
  const el = html('span', `lx-tok${hint ? ' is-hint' : ''}${c && (c.a === t.id || c.b === t.id) ? ' is-pair' : ''}${held ? ' is-held' : ''}${lifted ? ' is-lifted' : ''}${big ? ' is-bigsum' : ''}${valueOfTerm(t) < 0 ? ' is-neg' : ' is-pos'}`, kids, {
    'data-tok': t.id, 'data-side': side, 'data-like': likeKey(t), 'data-fk': `tok:${t.id}`, tabindex: canGrab(s) ? '0' : undefined,
    role: 'button', 'aria-label': `${said}. Enter picks it up${subtracted || neg ? '; the minus key shows it as a negative number' : ''}.`,
  });
  if (s.ui?.focus === `tok:${t.id}` || held) el.dataset.lxFocus = '1';
  return el;
}

const valueOfTerm = (t) => (t.kind === 'num' ? t.v : t.kind === 'x' ? (t.coef ?? 1) : t.factor);

// A factor times a parenthesis (the drill): the factor is its own grab handle (dragged onto the parenthesis to distribute), the
// parenthesis is where it is dropped.
function groupEls(s, t, i, subtracted, shownNeg) {
  const carry = s.ui?.carry;
  const holding = carry?.id === `${t.id}:f`;
  const f = t.factor;
  const text = subtracted ? [String(-f)] : f < 0 ? [html('span', 'lx-negsign', [MINUS], i > 0 ? { 'data-minus': t.id } : {}), String(-f)] : [String(f)];
  const factor = html('span', `lx-factor${shownNeg ? ' lx-negnum' : ''}${holding ? ' is-held' : ''}`, text, {
    'data-tok': `${t.id}:f`, 'data-factor': t.id, 'data-side': findTerm(s.board, t.id)?.side, 'data-fk': `tok:${t.id}:f`, tabindex: canGrab(s) ? '0' : undefined, role: 'button',
    'aria-label': `The factor ${signed(f).replace(MINUS, 'negative ')}. Enter picks it up; drop it on the parenthesis to distribute.`,
  });
  if (holding || s.ui?.focus === `tok:${t.id}:f`) factor.dataset.lxFocus = '1';
  const paren = html('span', `lx-paren${holding && carry.slot?.paren ? ' is-combine-target' : ''}`, [`(${sideText(t.inner)})`], { 'data-paren': t.id });
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

// An animation plays once: a later render of the same state (typing a digit, say) draws it already settled.
let playedKey = null;

function rowsOf(s) {
  const last = s.rows.length - 1;
  const key = s.work && s.rows.length > 1 ? `w${s.rows.length}:${JSON.stringify(s.work)}` : s.sub?.kind === 'guess' ? `g${s.sub.typed}` : null;
  const settledNow = key !== null && key === playedKey;
  playedKey = key;
  return s.rows.map((row, i) => {
    // the move just made animates: its work row and the new equation (a combine or a reorder adds no work row, so only its row)
    const newest = s.rows.length > 1 && (i === last || (i === last - 1 && row.type === 'work'));
    const recent = i === last || (i === last - 1 && row.type === 'work');                   // earlier lines are drawn in lighter ink
    const cls = `lb-rowwrap${!newest || settledNow ? ' is-settled' : ''}${row.type === 'work' ? ' has-work' : ''}${recent ? '' : ' is-old'}`;
    if (row.type === 'times') {                               // the drill's flip or whole number: both sides times (−1), written out (Build D-2)
      const times = (terms) => [...(terms.length > 1 ? [html('span', 'lb-plus', ['(']), ...sideEls(terms, s.lx.negIds), html('span', 'lb-plus', [')'])] : sideEls(terms, s.lx.negIds)), html('span', 'lb-plus lx-times', ['×']), html('span', 'lb-num is-added', [`(${signed(row.factor ?? -1)})`])];
      return html('div', `${cls} has-work`, [eqRow(times(row.board.left), times(row.board.right), `lb-work${eqClass(charsOf([...row.board.left, ...row.board.right]) + 12)}`, { 'aria-label': `Both sides times ${signed(row.factor ?? -1).replace(MINUS, 'negative ')}` })]);
    }
    if (row.type === 'work') {
      return html('div', cls, [eqRow(workEls(row.work.left, s.lx.negIds), workEls(row.work.right, s.lx.negIds), `lb-work${eqClass(charsOf([...row.work.left, ...row.work.right]))}`, { 'aria-hidden': 'true' })]);
    }
    // the equation the value goes back into: the original, or, for a wrong guess after a move, the current one (the loop's rule)
    const plug = Boolean(s.sub) && i === (s.sub.target === 'current' ? last : 0);
    const live = i === last && !plug && s.stage !== 'done';
    const chars = eqClass(charsOf([...row.board.left, ...row.board.right]));
    let eq;
    if (live) eq = eqRow(liveSide(s, 'left'), liveSide(s, 'right'), `lx-live${chars}${s.ui?.carry ? ' is-carrying' : ''}`, { role: 'group', 'aria-label': 'The equation: its terms can be picked up' });
    else {
      // the equation being checked: the value is dragged into its x (or x is tapped), which then changes colour (Build D, Part 2)
      const side = (terms) => sideEls(terms, s.lx.negIds).map((el) => {
        if (!plug || !el.classList.contains('lb-x')) return el;
        if (s.sub.placing) return html('span', 'lb-x is-plugx is-droptarget', ['x'], { 'data-x': '1', 'data-action': 'placeValue', role: 'button', tabindex: '0', 'aria-label': 'Put your value into x' });
        return html('span', 'lb-x is-plugx is-placed', ['x'], { 'data-x': '1' });
      });
      eq = eqRow(side(row.board.left), side(row.board.right), chars, { role: 'img', 'aria-label': 'The equation' });
    }
    return html('div', `${cls}${plug ? ' is-plugrow' : ''}`, [eq]);
  });
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
      const xTerm = t.kind === 'x' ? [html('span', 'lb-x', ['x'])] : [];           // an x sum: only the number in front of x is typed
      els.push(html('span', 'lx-boxwrap', [box, ...xTerm]));
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

// The drill's products: one blank per term of the parenthesis, each labelled with what it is; every piece is typed, the x too (Build D-2).
function productRow(s) {
  const d = s.lx.distribute;
  const f = findTerm(s.board, d.group);
  const g = f.term;
  const labels = productLabels(g);
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
      const box = html('button', `lx-box is-sum${d.wrong === j ? ' is-wrong' : ''}${d.focus === j ? ' is-focus' : ''}${s.ui?.shake && d.focus === j ? ' is-shake' : ''}${text ? '' : ' is-empty'}${d.focus === j && !text ? ' is-blink' : ''}`, [shown(text)], {
        type: 'button', 'data-action': 'focus', 'data-target': 'dist', 'data-index': String(j), 'data-fk': `prod:${j}`, 'data-lx-field': '1', 'aria-label': `${labels[j]}: type the product`,
      });
      if (s.ui?.focus === `prod:${j}`) box.dataset.lxFocus = '1';
      els.push(html('span', 'lx-prod', [html('span', 'lx-prodlabel', [labels[j].replace('-', MINUS)]), html('span', 'lx-prodbox', [box])]));
      k += 1;
    });
  });
  const other = sideEls(s.board[f.side === 'left' ? 'right' : 'left'], s.lx.negIds);
  return html('div', 'lx-ghost is-chosen is-sum is-products', [eqRow(f.side === 'left' ? els : other, f.side === 'left' ? other : els, 'lx-ghosteq lx-sumeq')]);
}

// The drill's Multiply (Build D-2, Part 4: one button, three options): both sides times a whole number, 1 over a number, or −1, each
// side in parentheses. `kind` hovered only (no mult yet): the same row, dashed, as a preview.
function multRow(s, hovered = null) {
  const kind = hovered ?? s.lx.mult.kind ?? 'frac';
  const text = hovered ? '' : s.lx.mult.entry;
  let first = true;
  const box = (label) => {
    const live = !hovered && first;
    const b = html(hovered ? 'span' : 'button', `lx-box is-sum mo-blank${kind === 'frac' ? ' lx-frac1d' : ''}${text ? '' : ' is-empty'}${live && !text ? ' is-blink is-focus' : ''}`, [shown(text)],
      hovered ? { 'aria-hidden': 'true' } : { type: 'button', 'data-lx-field': '1', 'data-fk': first ? 'mult' : undefined, 'aria-label': label, ...(first ? {} : { tabindex: '-1', 'aria-hidden': 'true' }) });
    if (live && s.ui?.focus === 'mult') b.dataset.lxFocus = '1';
    first = false;
    return b;
  };
  const front = () => (kind === 'flip' ? html('span', 'lb-num', [`${MINUS}1`])
    : kind === 'whole' ? box('Multiply by this whole number')
      : html('span', 'lx-frac1', [html('span', 'lx-frac1n', ['1']), box('Multiply by 1 over this number')]));
  const side = (terms) => [front(), html('span', 'lb-plus lx-times', ['×']), html('span', 'lb-plus', ['(']), ...sideEls(terms, s.lx.negIds), html('span', 'lb-plus', [')'])];
  return html('div', `lx-ghost ${hovered ? 'is-preview' : 'is-chosen is-sum'}`, [eqRow(side(s.board.left), side(s.board.right), 'lx-ghosteq lx-sumeq')], hovered ? { 'aria-hidden': 'true' } : {});
}

function ghostRow(s) {
  if (s.lx.mult) return multRow(s);
  if (s.lx.mopts && ['whole', 'frac', 'flip'].includes(s.ui?.preview)) return multRow(s, s.ui.preview);
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
  const typing = open && amountMode(s);
  const text = open ? s.amountEntry : '';
  // the left box is the input; the right box mirrors it as typed
  const left = html('button', `lx-box${typing ? ' is-focus' : ''}${s.ui?.shake ? ' is-shake' : ''}${text ? '' : ' is-empty'}${typing && !text ? ' is-blink' : ''}`, [shown(text)], {
    type: 'button', 'data-action': 'focus', 'data-target': 'amount', 'data-blank': '1', 'data-fk': 'blank', 'data-lx-field': '1',
    'aria-label': 'The amount to add to both sides', ...(open ? {} : { tabindex: '-1' }),
  });
  if (open && s.ui?.focus === 'blank') left.dataset.lxFocus = '1';
  const right = html('span', `lx-box is-mirror${text ? '' : ' is-empty'}`, [shown(text)], { 'aria-hidden': 'true' });
  const plus = () => html('span', 'lb-plus lx-plus', ['+']);
  slot.append(eqRow([...sideEls(s.board.left, s.lx.negIds), plus(), left], [...sideEls(s.board.right, s.lx.negIds), plus(), right], 'lx-ghosteq'));
  if (!open) slot.setAttribute('aria-hidden', 'true');
  return slot;
}

// ---------- the work stack, with the rule lines of the moves applied ----------

// A move that helped is written under a solid rule line; one that waits for Undo has none. (The drill draws no rule lines.)
function workStack(s) {
  const rows = rowsOf(s);
  if (!s.drill) {
    s.rows.forEach((r, i) => {
      if (r.type === 'eq' && s.rows[i - 1]?.type === 'work' && !(i === s.rows.length - 1 && s.needUndo)) rows[i]?.classList.add('lx-ruled', 'is-solid');
    });
  }
  return html('div', 'lb-stack', [...rows, ghostRow(s)]);
}

// ---------- the one green button ----------

// What moving forward means now: { label, action, enabled }. The first that applies wins.
export function forwardOf(s) {
  const sp = s.drill ? null : spotOf(s, ADD_SPOT);
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
  if (s.sub?.placing) return { label: 'Next', action: 'nextLine', enabled: false };
  if (s.sub && s.sub.step < solve.subTotal(s.sub)) return { label: 'Next', action: 'nextLine', enabled: true };
  if (s.lx.mult) return { label: 'Go', action: 'go', enabled: s.lx.mult.kind === 'flip' || (valid(s.lx.mult.entry) && Number(s.lx.mult.entry) !== 0) };
  if (s.lx.distribute) return { label: 'Multiply', action: 'lxApply', enabled: s.lx.distribute.entries.every((e) => /\d|x/.test(e)) };
  if (s.lx.combine) return { label: 'Combine', action: 'lxApply', enabled: valid(s.lx.combine.entry) && !s.lx.combine.wrong };
  if (s.combining?.step === 'struck') return { label: 'Next', action: 'crossNext', enabled: true };
  if (s.combining) return { label: 'Check', action: 'check', enabled: false };
  if (s.teachFlow && blankOpen(s) && amountMode(s)) return { label: 'Go', action: 'go', enabled: valid(s.amountEntry) };   // (Karl: Go, as everywhere)
  if (s.scaffold && s.stage === 'moves' && s.menu === 'add') return { label: 'Go', action: 'go', enabled: (Boolean(s.pending?.both) && s.leftDelta === s.rightDelta) || (!s.pending && valid(s.amountEntry) && Number(s.amountEntry) !== 0) };
  if (blankOpen(s) && amountMode(s)) return { label: 'Go', action: 'go', enabled: valid(s.amountEntry) };
  if (!s.sub && (s.unfolded || s.pic)) return { label: 'Next', action: 'foldNext', enabled: true };   // (the loop: a move that folds, a picture)
  return { label: 'Check', action: 'check', enabled: lightsAnswerLive(s) && valid(s.entry) };
}

// ---------- the answer row: x = [ ] [the green button] ----------

function answerRow(s) {
  const live = lightsAnswerLive(s);
  const text = s.sub && !live ? String(s.sub.typed) : s.entry;
  // x = shows no cursor at first: it blinks once clicked (until anything else happens), and at the last step, x alone on its side
  const last = live && !amountMode(s) && (xAlone(s.board) || Boolean(s.ui?.fieldCursor));
  const placing = Boolean(s.sub?.placing);                 // the typed value is what is dragged into x
  const typed = html('button', `ab-typed lb-typed lx-field${text ? '' : ' is-empty'}${last ? ' is-focus' : ''}${last && !text ? ' is-blink' : ''}${live || placing ? '' : ' is-off'}${placing ? ' is-chip' : ''}`, [shown(text)], placing
    ? { type: 'button', 'data-chip': '1', 'data-fk': 'answer', 'data-lx-field': '1', 'aria-label': `Your value ${shown(text)}: drag it into x` }
    : { type: 'button', 'data-action': 'focus', 'data-target': 'answer', 'aria-label': 'Your answer for x', 'data-fk': 'answer', 'data-lx-field': '1' });
  typed.disabled = !live && !placing;
  if (live && s.ui?.focus === 'answer') typed.dataset.lxFocus = '1';
  const f = forwardButton(forwardOf(s));
  if (!f.disabled && ['next', 'nextLine', 'foldNext', 'introNext'].includes(f.dataset.action)) f.dataset.lxFocus = '1';   // the one thing to do
  return html('div', 'lb-answerrow lx-answer', [html('strong', `lb-prompt${live || placing ? '' : ' is-off'}`, ['x =']), typed, f]);
}

// The checking space: once the value is in x, the copy of the equation with the value in parentheses, then a line a press of the green
// Next, then Balanced or Not balanced. The loop's check, drawn by the shared renderer (view/solveScreen.js), as on every card.
const substBlock = (s) => sharedSubstBlock(s, solve);

// The corners: Undo bottom-left; Start over and the help, small and quiet, bottom-right. Teach me appears only after a second error on
// the problem (and flashes as it comes); I'm stuck starts to flash after 10 seconds with nothing done (view/helpTimer.js).
function corners(s) {
  const done = s.stage === 'done';
  const wrongGuess = s.sub?.kind === 'guess' && !s.sub.ok && s.sub.step >= solve.subTotal(s.sub);
  const undo = btn('↶ Undo', 'undo', 'btn lx-corner lx-undo', { 'data-key': 'u', 'data-fk': 'undo' });
  undo.disabled = done || !((s.history.length > 0 && !s.sub) || wrongGuess || s.lx.combine || s.lx.distribute);
  if (!undo.disabled && (s.needUndo || wrongGuess || s.lx.combine?.wrong)) undo.classList.add('is-target');
  const over = btn('Start over', 'startOver', 'btn lx-corner lx-startover', { 'data-fk': 'startOver' });
  over.disabled = done || !solve.startOverOk(s);                  // (the loop's rule: live once anything has been done)
  return html('div', 'lx-corners', [undo, html('div', 'lx-cornerright', [over, ...helpButtons(s)])]);
}
function helpButtons(s) {
  const off = Boolean(s.drill) || !solve.helpOk(s);              // (the drill has no help ladder)
  const stuck = btn('I’m stuck', 'stuck', 'btn lx-corner lx-help', { 'data-key': 's', 'data-fk': 'stuck' });
  stuck.disabled = off;
  const out = [stuck];
  if ((s.errors ?? 0) >= 2 || s.taught > 0) {
    const teach = btn('Teach me', 'teach', `btn lx-corner lx-help${s.taught > 0 ? '' : ' is-new'}`, { 'data-key': 't', 'data-fk': 'teach' });
    teach.disabled = off;
    out.push(teach);
  }
  return out;
}

// ---------- the panel: the move icons only ----------

function panel(s) {
  const building = s.stage === 'build';
  const disabled = building || s.stage === 'done' || Boolean(s.combining) || Boolean(s.pending) || Boolean(s.sub) || Boolean(s.lx.combine) || Boolean(s.lx.distribute) || (Boolean(s.lx.mult) && !s.drill);
  const menu = s.scaffold || blankOpen(s) ? s.menu : null;
  const moves = {
    add: {
      live: true, off: Boolean(s.drill), pressed: menu === 'add', preview: canChoose(s) && s.ui?.preview === true, near: canChoose(s) && s.ui?.preview === 'near',
      ring: moveOwed(s) && !blankOpen(s) && !tradePending(s), focus: s.ui?.focus === 'add',
    },
  };
  // Trade places is live from Level 4 when x is on the right; the first time, it is the move to click
  if (tradeAvailable(s)) moves.trade = { live: true, pulse: tradePending(s) };
  // the drill finishes with Flip everything and Multiply (Build D, Part 3)
  if (s.drill) {
    // one Multiply button: its three options beside it (Build D-2, Part 4); Flip everything is its −1
    moves.multiply = { live: true, action: 'multOpen', pressed: Boolean(s.lx.mult) || Boolean(s.lx.mopts), label: 'Multiply', flyout: s.lx.mopts ? multiplyOptions(['whole', 'frac', 'flip'], s.ui?.preview) : null };
  }
  const lights = building ? {} : { fewer: s.lights.fewer, fewerHand: s.lx.hand.fewer, solved: s.lights.solved };
  const flash = ['red', 'neutral'].includes(s.lights.fewer) && s.history.length > 0 ? ['fewer'] : [];
  const el = narrowPanel(moves, { disabled, lights, open: s.ui?.light ?? null, flash });
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

export function renderAddBothScreen(s) {
  const wrap = html('div', 'lb-game lb-eqcard ui-lights ui-grab ui-light');
  // no banner: the line is kept for screen readers only (while a pop-up is up, it holds the prompt)
  const sp = s.drill ? null : spotOf(s, ADD_SPOT);
  wrap.append(srLine(lightsFeedbackText(sp ? { key: ADD_SPOT.prompt(s), params: {} } : s.feedback)));
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
  return wrap;
}
