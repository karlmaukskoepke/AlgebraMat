// The Add to both sides screen under ?ui=lights (SPEC-LIGHTS-EXPERIMENT-ADD.md §1–§4, rev 0.2), Levels 2–3. Top to bottom of the left
// column: the line ("Find x." and every message), the work stack with a reserved ghost row under the newest equation (the preview,
// then the blank the amount is typed into, or the blank for a sum being combined), the bottom row [I'm stuck] x = [ ] [Check]
// [Teach me], the substitution under it, and the small Undo and Start over in the corners. The narrow Moves / Goals panel is on the
// right (rev 0.2 A3). Everything is scoped under .ui-lights.
//
// Rev 0.2 writes every row the way it is said: a negative number after the first term is subtraction, "x − 2" (B4: its minus can be
// tapped to show "x + −2"). The terms of the newest row are tokens that can be grabbed (B0, view/lightsGrabPointer.js).

import { MINUS } from '../engine/expr.js';
import { signed } from '../engine/addBoth.js';
import { helpOk } from '../engine/addBothMoves.js';
import { lightsAnswerLive, blankOpen, canChoose, moveOwed, amountMode, canGrab } from '../engine/addBothLights.js';
import { termText, findTerm, likeKey, crossedText } from '../engine/lightsGrab.js';
import { lightsFeedbackText } from './addBothLightsFeedback.js';
import { boardBlock, trayFor, html } from './addBothMat.js';
import { moveIcon } from './lightScreen.js';

const btn = (label, action, cls, attrs = {}) => html('button', cls, [label], { type: 'button', 'data-action': action, ...attrs });
const shown = (v) => (v ? v.replace('-', MINUS) : ' ');

// ---------- the line: only what to do, no choice buttons ----------

function line(s) {
  const el = html('div', `lb-line${s.feedback?.bad ? ' is-bad' : ''}${s.stage === 'done' ? ' is-good' : ''}`, [], { role: 'status', 'aria-live': 'polite' });
  el.append(html('p', 'lb-text', [lightsFeedbackText(s.feedback)]));
  return el;
}

// ---------- the rows, written as they are said ----------

// A side of an inert row (an older equation, the ghost row): "x − 2", or "x + −2" for the terms whose minus was tapped.
const sideEls = (terms, negIds = []) => {
  const out = [];
  terms.forEach((t, i) => {
    const { op, body } = termText(t, i, negIds.includes(t.id));
    if (op) out.push(html('span', 'lb-plus', [op]));
    out.push(t.kind === 'x' ? html('span', 'lb-x', [body]) : html('span', 'lb-num', [body]));
  });
  return out;
};

// The line a move leaves above the new equation: the amount (blue) on both sides, x's numbers struck as they combine.
const workEls = (items) => {
  const out = [];
  items.forEach((t, i) => {
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
const charsOf = (list) => list.map((x) => (x.kind === 'x' || x.x ? 1 : String(signed(x.v)).length + 3)).reduce((a, b) => a + b, 0);

// A token of the newest row (B0): the whole signed term, grabbed with its sign. A subtracted number's minus (or, once tapped, the
// minus of the negative number) is the tap target of B4.
function token(s, t, i, side, held) {
  const neg = s.lx.negIds.includes(t.id);
  const { op, body, subtracted } = termText(t, i, neg);
  const kids = [];
  if (op) kids.push(html('span', 'lx-op', [op], subtracted ? { 'data-minus': t.id } : {}));
  if (t.kind === 'num' && neg) kids.push(html('span', 'lx-body lx-negnum', [html('span', 'lx-negsign', [MINUS], { 'data-minus': t.id }), String(-t.v)]));
  else kids.push(html('span', `lx-body${t.kind === 'x' ? ' lb-x' : ' lb-num'}`, [body]));
  const hint = (s.hint?.kind === 'cancel' && s.hint.id === t.id) || (s.hint?.kind === 'sum' && s.hint.ids.includes(t.id));
  const c = s.lx.combine;
  const said = op ? `${op === '+' ? 'plus' : 'minus'} ${body.replace(MINUS, 'negative ')}` : body.replace(MINUS, 'negative ');
  const el = html('span', `lx-tok${hint ? ' is-hint' : ''}${c && (c.a === t.id || c.b === t.id) ? ' is-dim' : ''}${held ? ' is-held' : ''}`, kids, {
    'data-tok': t.id, 'data-side': side, 'data-like': likeKey(t), 'data-fk': `tok:${t.id}`, tabindex: canGrab(s) ? '0' : undefined,
    role: 'button', 'aria-label': `${said}. Enter picks it up${subtracted || neg ? '; the minus key shows it as a negative number' : ''}.`,
  });
  if (s.ui?.focus === `tok:${t.id}` || held) el.dataset.lxFocus = '1';
  return el;
}

// The newest row's side as tokens. While a term is carried by the keyboard (B0), it is drawn lifted at the slot it is over: in a
// gap, beside a like term it would combine with, or on the other side showing its opposite sign (B2).
function liveSide(s, side) {
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
    const cls = `lb-rowwrap${!newest || settledNow ? ' is-settled' : ''}${row.type === 'work' ? ' has-work' : ''}`;
    if (row.type === 'work') {
      return html('div', cls, [eqRow(workEls(row.work.left), workEls(row.work.right), `lb-work${eqClass(charsOf([...row.work.left, ...row.work.right]))}`, { 'aria-hidden': 'true' })]);
    }
    const plug = i === 0 && Boolean(s.sub);                    // the original equation is the one the value goes back into
    const live = i === last && !plug && s.stage !== 'done';
    const chars = eqClass(charsOf([...row.board.left, ...row.board.right]));
    let eq;
    if (live) eq = eqRow(liveSide(s, 'left'), liveSide(s, 'right'), `lx-live${chars}${s.ui?.carry ? ' is-carrying' : ''}`, { role: 'group', 'aria-label': 'The equation: its terms can be picked up' });
    else {
      const side = (terms) => (plug && s.sub.kind === 'guess'
        ? sideEls(terms).map((el) => (el.classList.contains('lb-x') ? html('span', 'lb-x lb-guess', [signed(s.sub.typed)]) : el))
        : sideEls(terms, i === last ? s.lx.negIds : []));
      eq = eqRow(side(row.board.left), side(row.board.right), chars, { role: 'img', 'aria-label': 'The equation' });
    }
    return html('div', `${cls}${plug ? ' is-plugrow' : ''}`, plug ? [html('span', 'lb-plugtag', ['plugging back into this equation']), eq] : [eq]);
  });
}

// ---------- the ghost row: the move's preview and blank (§2), or the blank for a sum (B3) ----------

function sumRow(s) {
  const c = s.lx.combine;
  const text = c.entry;
  const valid = /^-?\d+$/.test(text);
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
      els.push(valid && !c.wrong ? html('span', 'lx-boxwrap', [box, btn('✓', 'lxApply', 'btn lx-apply', { 'aria-label': 'Apply the sum', 'data-fk': 'apply' })]) : box);
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

function ghostRow(s) {
  if (s.lx.combine) return sumRow(s);
  const open = blankOpen(s);
  const preview = !open && canChoose(s) && s.ui?.preview;
  const usable = open || canChoose(s);
  const slot = html('div', `lx-ghost${open ? ' is-chosen' : preview ? ' is-preview' : ''}${usable ? ' is-usable' : ''}`);
  if (!usable) return slot;
  const typing = open && amountMode(s);
  const text = open ? s.amountEntry : '';
  const valid = open && /^-?\d+$/.test(text);
  // the left box is the input; the right box mirrors it as typed
  const left = html('button', `lx-box${typing ? ' is-focus' : ''}${s.ui?.shake ? ' is-shake' : ''}${text ? '' : ' is-empty'}${typing && !text ? ' is-blink' : ''}`, [shown(text)], {
    type: 'button', 'data-action': 'focus', 'data-target': 'amount', 'data-blank': '1', 'data-fk': 'blank', 'data-lx-field': '1',
    'aria-label': 'The amount to add to both sides', ...(open ? {} : { tabindex: '-1' }),
  });
  if (open && s.ui?.focus === 'blank') left.dataset.lxFocus = '1';
  const right = html('span', `lx-box is-mirror${text ? '' : ' is-empty'}`, [shown(text)], { 'aria-hidden': 'true' });
  const plus = () => html('span', 'lb-plus lx-plus', ['+']);
  const leftEls = [...sideEls(s.board.left, s.lx.negIds), plus(), left];
  if (valid) leftEls[leftEls.length - 1] = html('span', 'lx-boxwrap', [left, btn('✓', 'go', 'btn lx-apply', { 'aria-label': 'Apply: add it to both sides', 'data-fk': 'apply' })]);
  slot.append(eqRow(leftEls, [...sideEls(s.board.right, s.lx.negIds), plus(), right], 'lx-ghosteq'));
  if (!open) slot.setAttribute('aria-hidden', 'true');
  return slot;
}

// ---------- the work stack, with the rule lines and the Next of the move just applied ----------

function workStack(s) {
  const rows = rowsOf(s);
  const lx = s.lx;
  for (const r of lx.rules) rows[r]?.classList.add('lx-ruled', 'is-solid');
  if (lx.awaitNext !== null && rows[lx.awaitNext]) {
    const row = rows[lx.awaitNext];
    row.classList.add('lx-ruled');
    const next = btn('Next ▸', 'lxNext', 'btn btn-go lx-next', { 'data-fk': 'next' });
    if (s.ui?.focus === 'next') next.dataset.lxFocus = '1';
    row.append(next);
  }
  return html('div', 'lb-stack', [...rows, ghostRow(s)]);
}

// ---------- the bottom row: [I'm stuck] x = [ ] [Check] [Teach me] ----------

function bottomRow(s) {
  const done = s.stage === 'done';
  const helpOff = done || (s.stage === 'build' && s.scaffold) || !helpOk(s);
  const counting = s.combining?.step === 'count';
  const live = lightsAnswerLive(s);
  const owed = moveOwed(s);
  const text = counting ? s.combining.entry : s.sub && !live ? String(s.sub.typed) : s.entry;
  const focused = live && !amountMode(s);
  const ready = live && /^-?\d+$/.test(text);
  const stuck = btn('I’m stuck', 'stuck', 'btn lx-help', { 'data-key': 's', 'data-fk': 'stuck' });
  stuck.disabled = helpOff;
  const teach = btn('Teach me', 'teach', 'btn lx-help', { 'data-key': 't', 'data-fk': 'teach' });
  teach.disabled = helpOff;
  const typed = html('button', `ab-typed lb-typed lx-field${text ? '' : ' is-empty'}${focused ? ' is-focus' : ''}${focused && !text ? ' is-blink' : ''}`, [shown(text)], {
    type: 'button', 'data-action': 'focus', 'data-target': 'answer', 'aria-label': 'Your answer for x', 'data-fk': 'answer', 'data-lx-field': '1',
  });
  typed.disabled = !live;
  if (live && s.ui?.focus === 'answer') typed.dataset.lxFocus = '1';
  const check = btn('Check ✓', 'check', `btn lb-check${ready ? ' btn-go' : ' btn-primary'}`, { 'data-fk': 'check' });
  check.disabled = !ready;
  const kids = [html('strong', 'lb-prompt', ['x =']), typed, check];
  // the problem after a correct guess (A1): x = waits for one move, and says so in one line
  if (owed) kids.push(html('span', 'lx-owednote', ['Make one move first.']));
  const answer = html('div', `lb-answerrow lx-answer${live ? '' : ' is-dim'}`, kids);
  return html('div', 'lx-bottom', [stuck, answer, teach]);
}

// the substitution (a line a click, then Balanced or Not balanced) with its green Next, or the next problem
function substBlock(s) {
  const sub = s.sub;
  const list = html('ol', 'lb-subst lx-subst');
  if (sub) {
    const lines = sub.lines.slice(0, Math.min(sub.step, 2));
    lines.forEach((l, i) => list.append(html('li', '', i === 0 && sub.parts ? sub.parts.map((p) => (p.blue ? html('span', 'is-blue', [p.text]) : p.text)) : [l])));
    if (sub.step >= 3) list.append(html('li', sub.ok ? 'is-good' : 'is-bad', [sub.ok ? '✓ Balanced' : '✗ Not balanced']));
  }
  const stepping = s.sub && s.sub.step < 3;
  const done = s.stage === 'done';
  const kids = [list];
  if (stepping || done) {
    const next = btn(done ? 'Next problem ▸' : 'Next ▸', done ? 'next' : 'nextLine', 'btn btn-go is-target lb-next', { 'data-fk': done ? 'nextProblem' : 'nextLine' });
    next.dataset.lxFocus = '1';                                  // the one thing to do: it has the focus
    kids.push(next);
  }
  return html('div', 'lx-substblock', kids);
}

// the small corner buttons: Undo bottom-left, Start over bottom-right
function corners(s) {
  const done = s.stage === 'done';
  const wrongGuess = s.sub?.kind === 'guess' && !s.sub.ok && s.sub.step >= 3;
  const undo = btn('↶ Undo', 'undo', 'btn lx-corner lx-undo', { 'data-key': 'u', 'data-fk': 'undo' });
  undo.disabled = done || !((s.history.length > 0 && !s.sub) || wrongGuess || s.lx.combine);
  if (!undo.disabled && (s.undoCue || wrongGuess || s.lx.combine?.wrong)) undo.classList.add('is-target');
  const over = btn('Start over', 'startOver', 'btn lx-corner lx-startover', { 'data-fk': 'startOver' });
  over.disabled = done || !s.startOver;
  return html('div', 'lx-corners', [undo, over]);
}

// ---------- the panel (rev 0.2 A3): four narrow moves, lights as dots, Goals ----------

// The four moves (properties of equality), in order; each light sits beside the move it goes with. Only Add is live on these levels.
const PANEL = [
  { id: 'add', label: 'Add ___ to both sides', lights: [['fewer', 'Fewer terms']] },
  { id: 'multiply', label: 'Multiply both sides by ___', lights: [['nofrac', 'No fractions'], ['smaller', 'Smaller numbers'], ['onebox', 'One box']] },
  { id: 'flip', label: 'Flip everything (× −1)', lights: [['noopp', 'No opposite box']] },
  { id: 'trade', label: 'Trade places', lights: [['xleft', 'x on the left']] },
];
// The goals now reached by hand (a drag, not a button): no icon, a small group under the moves.
const BY_HAND = [['simple', 'Each side simplified'], ['fewerHand', 'Fewer terms (by hand)']];

// Narrow pictograms (about 52 px): the shape of the move, the part that changes in blue.
const SVG_NS = 'http://www.w3.org/2000/svg';
const GREY = '#8a8576';
const BLUE = '#0072b2';
function svgEl(name, attrs = {}, kids = []) {
  const n = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  n.append(...kids);
  return n;
}
const txt = (x, y, text, fill = GREY, size = 12) => svgEl('text', { x, y, 'text-anchor': 'middle', fill, 'font-size': size, 'font-weight': 700, 'font-family': 'Lexend, system-ui, sans-serif' }, [text]);
const dashBox = (x, y) => svgEl('rect', { x, y, width: 8, height: 11, rx: 2, fill: 'none', stroke: BLUE, 'stroke-width': 1.5, 'stroke-dasharray': '2 1.5' });
const MINI = {
  add: () => [txt(5, 18, '+', BLUE, 13), dashBox(10, 8), txt(26, 18, '=', GREY, 13), txt(37, 18, '+', BLUE, 13), dashBox(42, 8)],
  multiply: () => [txt(5, 18, 'n', BLUE, 12), txt(13, 18, '( )', GREY, 11), txt(26, 18, '=', GREY, 13), txt(35, 18, 'n', BLUE, 12), txt(43, 18, '( )', GREY, 11)],
  flip: () => [txt(9, 18, '−x', GREY, 12), svgEl('path', { d: 'M19 14 H31', stroke: BLUE, 'stroke-width': 1.8, 'marker-end': 'url(#lx-ah)' }), txt(42, 18, 'x', BLUE, 13)],
};
function miniIcon(id) {
  if (id === 'trade') { const svg = moveIcon('trade'); svg.setAttribute('width', 44); svg.setAttribute('height', 30); return svg; }
  const svg = svgEl('svg', { class: 'lb-icon lx-mini', viewBox: '0 0 52 26', width: 52, height: 26, 'aria-hidden': 'true', focusable: 'false' });
  svg.append(svgEl('defs', {}, [svgEl('marker', { id: 'lx-ah', markerWidth: 6, markerHeight: 6, refX: 4.5, refY: 3, orient: 'auto' }, [svgEl('path', { d: 'M0 0 L6 3 L0 6 z', fill: BLUE })])]), ...MINI[id]());
  return svg;
}

const MARK = { green: '✓', red: '✗', neutral: '–', off: '' };
const SAID = { green: 'reached', red: 'went the wrong way', neutral: 'no change', off: 'not judged here' };
// A light: a small round dot; hover, keyboard focus or a tap opens it in place into a pill with its goal (one at a time).
function dot(s, key, name, state, flash = false) {
  const open = s.ui?.light === key;
  return html('button', `lx-dot is-${state}${open ? ' is-open' : ''}${flash ? ' is-flash' : ''}`, [html('span', 'lx-mark', [MARK[state]]), html('span', 'lx-pill', [name])], {
    type: 'button', 'data-light': key, 'data-fk': `light:${key}`, 'aria-label': `${name}: ${SAID[state]}`, 'aria-expanded': String(open),
  });
}

function panel(s) {
  const building = s.stage === 'build';
  const judged = { fewer: building ? 'off' : s.lights.fewer, fewerHand: building ? 'off' : s.lx.hand.fewer, solved: building ? 'off' : s.lights.solved };
  const flash = ['red', 'neutral'].includes(s.lights.fewer) && s.history.length > 0;
  const disabled = building || s.stage === 'done' || Boolean(s.combining) || Boolean(s.pending) || Boolean(s.sub) || Boolean(s.lx.combine);
  const el = html('aside', 'lb-panel lx-panel', [], { 'aria-label': 'Moves and goals' });
  el.append(html('div', 'lx-phead', [html('span', '', ['Moves']), html('span', '', ['Goals'])]));
  const grid = html('div', 'lx-pgrid');
  for (const m of PANEL) {
    let b;
    if (m.id === 'add') {
      const menu = s.scaffold || blankOpen(s) ? s.menu : null;
      const target = moveOwed(s) && !blankOpen(s) && s.lx.awaitNext === null;
      b = html('button', `btn btn-move lb-move lx-move${menu === 'add' ? ' is-on' : ''}${canChoose(s) && s.ui?.preview ? ' is-preview' : ''}${target ? ' is-target is-ring' : ''}`, [miniIcon('add')], {
        type: 'button', 'data-action': 'choose', 'data-move': 'add', 'aria-label': m.label, 'data-fk': 'add', 'aria-pressed': String(menu === 'add'),
      });
      b.disabled = disabled;
      if (s.ui?.focus === 'add') b.dataset.lxFocus = '1';
    } else {
      b = html('button', 'btn lb-move lx-move is-grey', [miniIcon(m.id)], { type: 'button', 'data-action': 'greyMove', 'data-move': m.id, 'aria-disabled': 'true', 'aria-label': m.label, 'data-tip': m.label });
    }
    grid.append(b, html('div', 'lx-dots', m.lights.map(([key, name]) => dot(s, key, name, judged[key] ?? 'off', key === 'fewer' && flash))));
  }
  el.append(grid);
  el.append(html('div', 'lx-hand', [html('div', 'lx-dots is-row', BY_HAND.map(([key, name]) => dot(s, key, name, judged[key] ?? 'off')))], { 'aria-label': 'Goals reached by hand' }));
  el.append(html('div', 'lx-solvedrow', [html('span', 'lx-solvedlabel', ['Solved for x']), dot(s, 'solved', 'Solved for x', judged.solved)]));
  if (s.combining?.step === 'kind') {
    el.append(html('div', 'ab-sub', [
      html('button', 'btn btn-party', ['Party!'], { type: 'button', 'data-action': 'kind', 'data-value': 'party' }),
      html('button', 'btn btn-battle', ['Battle!'], { type: 'button', 'data-action': 'kind', 'data-value': 'battle' }),
    ]));
  }
  return el;
}

export function renderLightsScreen(s) {
  const wrap = html('div', 'lb-game lb-eqcard ui-lights');
  wrap.append(line(s));
  const body = html('div', 'lb-body');
  const main = html('div', 'lb-main');
  if (s.scaffold) {
    main.append(boardBlock(s));
    const tray = trayFor(s);
    if (tray) main.append(tray);
  } else {
    main.append(html('div', 'lb-eqblock', [workStack(s)]));
  }
  main.append(bottomRow(s), substBlock(s), corners(s));
  body.append(main, panel(s));
  wrap.append(body);
  return wrap;
}
