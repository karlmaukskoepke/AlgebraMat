// The Add to both sides screen, every equation level (the lights experiment's round 1, made the default in Build C). Top to bottom of
// the left column:
// the line ("Find x." and every message), the work stack with a reserved ghost row under the newest equation (the preview, then the
// blank the amount is typed into), the bottom row [I'm stuck] x = [ ] [Check] [Teach me], the substitution under it, and the small
// Undo and Start over in the corners. The Move / Why? panel stays on the right, with Trade places live from Level 5 when x is on the
// right. Everything is scoped under .ui-lights. (?ui=grab draws round 2's screen instead: view/grabScreen.js.)

import { MINUS } from '../engine/expr.js';
import { signed } from '../engine/addBoth.js';
import { helpOk, tradeAvailable, tradePending } from '../engine/addBothMoves.js';
import { lightsAnswerLive, blankOpen, canChoose, moveOwed, amountMode } from '../engine/addBothLights.js';
import { lightsFeedbackText } from './addBothLightsFeedback.js';
import { spotlightLayer, findSolveTarget } from './spotlight.js';
import { spotOf } from '../engine/spotlight.js';
import { ADD_SPOT } from '../engine/addBothLights.js';
import { boardBlock, trayFor, html } from './addBothMat.js';
import { stackRows, movePanel } from './lightScreen.js';

const btn = (label, action, cls, attrs = {}) => html('button', cls, [label], { type: 'button', 'data-action': action, ...attrs });
const shown = (v) => (v ? v.replace('-', MINUS) : ' ');

// ---------- the line: only what to do, no choice buttons ----------

// While a spotlight is up, its message is in the pop-up and the line holds the prompt only (Build C, Part 2).
function line(s) {
  const spot = spotOf(s, ADD_SPOT);
  const fb = spot ? { key: ADD_SPOT.prompt(s), params: {} } : s.feedback;
  const el = html('div', `lb-line${fb?.bad ? ' is-bad' : ''}${s.stage === 'done' ? ' is-good' : ''}`, [], { role: 'status', 'aria-live': 'polite' });
  el.append(html('p', 'lb-text', [lightsFeedbackText(fb)]));
  return el;
}

// The spotlight: an error (dimmed page, the wrong thing lit, Undo the only way out) or the hint after it.
function spot(s, wrap) {
  const sp = spotOf(s, ADD_SPOT);
  if (!sp) return;
  wrap.append(spotlightLayer(sp, {
    root: wrap, find: findSolveTarget, text: lightsFeedbackText(s.feedback), undo: '.lx-undo',
    moveSel: (m) => `[data-move="${m}"]`,
  }));
}

// ---------- the ghost row (§2): the newest equation with a box after each side ----------

const sideEls = (terms) => {
  const out = [];
  terms.forEach((t, i) => {
    if (i > 0) out.push(html('span', 'lb-plus', ['+']));
    out.push(t.kind === 'x' ? html('span', 'lb-x', ['x']) : html('span', 'lb-num', [signed(t.v)]));
  });
  return out;
};

function ghostRow(s) {
  const open = blankOpen(s);
  const preview = !open && canChoose(s) && s.ui?.preview;
  const usable = open || canChoose(s);                       // a dragged number can open it from S0 (shown only while dragging)
  const slot = html('div', `lx-ghost${open ? ' is-chosen' : preview ? ' is-preview' : ''}${usable ? ' is-usable' : ''}`);
  if (!usable) return slot;
  const typing = open && amountMode(s);
  const text = open ? s.amountEntry : '';
  const valid = open && /^-?\d+$/.test(text);
  // the left box is the input (a drop target for a dragged number too); the right box mirrors it as typed
  const left = html('button', `lx-box${typing ? ' is-focus' : ''}${s.ui?.shake ? ' is-shake' : ''}${text ? '' : ' is-empty'}${typing && !text ? ' is-blink' : ''}`, [shown(text)], {
    type: 'button', 'data-action': 'focus', 'data-target': 'amount', 'data-blank': '1', 'data-fk': 'blank', 'data-lx-field': '1',
    'aria-label': 'The amount to add to both sides', ...(open ? {} : { tabindex: '-1' }),
  });
  if (open && s.ui?.focus === 'blank') left.dataset.lxFocus = '1';
  const right = html('span', `lx-box is-mirror${text ? '' : ' is-empty'}`, [shown(text)], { 'aria-hidden': 'true' });
  const plus = () => html('span', 'lb-plus lx-plus', ['+']);
  const leftEls = [...sideEls(s.board.left), plus(), left];
  // ✓ appears once the box holds a number, just under it (floating, so nothing shifts when it does)
  if (valid) leftEls[leftEls.length - 1] = html('span', 'lx-boxwrap', [left, btn('✓', 'go', 'btn lx-apply', { 'aria-label': 'Apply: add it to both sides', 'data-fk': 'apply' })]);
  const eq = html('div', 'lb-eq lx-ghosteq');
  eq.append(html('div', 'lb-side lb-left', leftEls), html('div', 'lb-border', [html('span', 'lb-equals', ['='])]), html('div', 'lb-side lb-right', [...sideEls(s.board.right), plus(), right]));
  slot.append(eq);
  if (!open) slot.setAttribute('aria-hidden', 'true');
  return slot;
}

// ---------- the work stack, with the rule lines and the Next of the move just applied ----------

function workStack(s) {
  const rows = stackRows(s);
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
  // the problem after a correct guess: x = waits for one move, and says so in one line
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
  undo.disabled = done || !((s.history.length > 0 && !s.sub) || wrongGuess);
  if (!undo.disabled && (s.undoCue || wrongGuess)) undo.classList.add('is-target');
  const over = btn('Start over', 'startOver', 'btn lx-corner lx-startover', { 'data-fk': 'startOver' });
  over.disabled = done || !s.startOver;
  return html('div', 'lx-corners', [undo, over]);
}

// ---------- the panel: Add live from the start; only Fewer terms and Solved for x are judged ----------

const OFF = { nofrac: 'off', smaller: 'off', onebox: 'off', noopp: 'off', xleft: 'off', simple: 'off' };

function panel(s) {
  const building = s.stage === 'build';
  let sub = null;
  if (s.combining?.step === 'kind') {
    sub = html('div', 'ab-sub', [
      html('button', 'btn btn-party', ['Party!'], { type: 'button', 'data-action': 'kind', 'data-value': 'party' }),
      html('button', 'btn btn-battle', ['Battle!'], { type: 'button', 'data-action': 'kind', 'data-value': 'battle' }),
    ]);
  }
  const el = movePanel({
    menu: s.scaffold || blankOpen(s) ? s.menu : null, noTip: true, preview: canChoose(s) && s.ui?.preview,
    disabled: building || s.stage === 'done' || Boolean(s.combining) || Boolean(s.pending) || Boolean(s.sub),
    locked: false, target: moveOwed(s) && !blankOpen(s) && s.lx.awaitNext === null && !tradePending(s),
    tradeOn: tradeAvailable(s), tradeTarget: tradePending(s),
    lights: s.lights, off: building, whys: OFF,
    flash: ['red', 'neutral'].includes(s.lights.fewer) && s.history.length > 0, sub,
  });
  if (s.ui?.focus === 'add') el.querySelector('[data-fk="add"]')?.setAttribute('data-lx-focus', '1');
  if (moveOwed(s)) el.classList.add('is-owed');                   // the forced move: the needed move has a steady ring and the pulse
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
  spot(s, wrap);
  return wrap;
}
