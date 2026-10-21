// The screen pieces every card of the Solve it loop shares (SPEC-SOLVE-IT-LOOP.md §2-§4): the line, the work stack (the equation, each folded move as one row, the current move's work, a failed attempt in red), the
// x = [▁] row with Check under it and Next beside it, the substitution written a line a click with the step highlighted, the
// value placed on x by a drag (or a tap), and the help row. A card (view/divideScreen.js, ...) composes these and adds only its own
// pictures. Cards never draw these themselves. Plain HTML, so every target is a real 44 px and the text can be big.

import { html, actionRow } from './addBothMat.js';
import { equationRow } from './lightScreen.js';
import { MINUS } from '../engine/expr.js';
import { signed, fractionText, boardText } from '../engine/solveTerms.js';

// ---------- the line: actions only, one sentence ----------

// The operation is blue wherever it shows (loop §3D): on this card, the fractions ½ ⅓ ¼ ⅕ ⅙ in any sentence of the line.
const FRACTION_GLYPHS = /([½⅓¼⅕⅙])/;
export const blueFractions = (text) => String(text).split(FRACTION_GLYPHS).map((part) => (FRACTION_GLYPHS.test(part) ? html('span', 'is-blue', [part]) : part));

export function lineBlock(s, textOf) {
  const line = html('div', `lb-line${s.feedback?.bad ? ' is-bad' : ''}${s.stage === 'done' ? ' is-good' : ''}`, [], { role: 'status', 'aria-live': 'polite' });
  line.append(html('p', 'lb-text', blueFractions(textOf(s.feedback))));
  return line;
}

// ---------- terms: x with its number in front, numbers, and a fraction of a part (the fraction in blue) ----------

function termsOf(side, s, o) {
  const out = [];
  side.forEach((t, i) => {
    if (i > 0) out.push(html('span', 'lb-plus', [t.kind === 'num' && t.v < 0 ? MINUS : '+']));
    if (t.kind === 'frac') {
      out.push(html('span', 'lb-frac', [html('span', 'is-blue', [fractionText(t.n)]), '(', ...termsOf(t.inner, s, { ...o, live: false, plug: false }), ')']));
    } else if (t.kind === 'x') {
      const xi = o.xi ? o.xi.n++ : 0;                           // which x of the equation this is, left to right
      const filled = Boolean(o.plug && s.sub && (!s.sub.placing || s.sub.filled?.includes(xi)));
      const dropOn = o.plug && s.sub?.placing && !filled;
      const c = t.coef ?? 1;
      // the value is dragged into each x of the equation being checked; an x it went into changes colour (Build D, Part 2). With more
      // than one x, each x that has the value gets a small green check above it: a shape, not colour alone (Build H, Part 1)
      const manyX = o.plug && (s.sub?.xs ?? 1) > 1;
      const xel = html('span', `lb-x${o.plug ? ' is-plugx' : ''}${dropOn ? ' is-droptarget' : ''}${filled ? ' is-placed' : ''}${manyX ? ' has-xmark' : ''}`, ['x'], { 'data-x': '1', 'data-xi': String(xi), ...(dropOn ? { 'data-action': 'placeValue', role: 'button', tabindex: '0', 'aria-label': 'Put your value into x' } : {}) });
      if (manyX && filled) xel.append(html('span', 'lb-xcheck', ['✓'], { 'aria-label': 'This x has the value' }));
      if (c > 1) out.push(html('span', 'lb-coef', [o.live && s.hint?.kind === 'coef' ? html('span', 'lb-hintbox', [String(c)]) : String(c), xel]));
      else out.push(xel);
    } else {
      out.push(html('span', 'lb-num', [i > 0 && t.v < 0 ? String(-t.v) : signed(t.v)]));
    }
  });
  return out;
}

const charsOf = (list) => list.map((x) => (x.kind === 'frac' ? 5 + charsOf(x.inner) : x.kind === 'x' ? ((x.coef ?? 1) > 1 ? 2 : 1) : String(signed(x.v)).length + 3)).reduce((a, b) => a + b, 0);
const eqClass = (chars) => (chars > 30 ? ' is-xlong' : chars > 20 ? ' is-long' : '');

const sideEls = (board, s, o) => { const oo = { ...o, xi: { n: 0 } }; return [termsOf(board.left, s, oo), termsOf(board.right, s, oo)]; };
// A side as written, inert (the move's preview row).
export const sideTerms = (terms, s) => termsOf(terms, s, { live: false, plug: false });

// The work stack. Every row stays settled (no entrance animation: a re-render never replays one).
export function stackRows(s) {
  const boardRows = s.rows.map((r, i) => (r.type === 'eq' || r.type === 'fold' ? i : -1)).filter((i) => i >= 0);
  const last = boardRows.at(-1);
  const plugIdx = s.sub ? (s.sub.target === 'current' ? last : 0) : -1;
  return s.rows.map((row, i) => {
    if (row.type === 'work') {
      // a move written as an equation: the fraction of both whole sides (a failed try is marked)
      const [l, r] = sideEls(row.board, s, { live: false, plug: false });
      const w = equationRow(l, r, `lb-work${row.failed ? ' is-failed' : ''}${eqClass(charsOf([...row.board.left, ...row.board.right]))}`);
      w.setAttribute('aria-hidden', 'true');
      if (row.failed) w.append(html('span', 'lb-failmark', ['✗']));
      return html('div', 'lb-rowwrap has-work is-settled', [w]);
    }
    const plug = i === plugIdx;
    const [l, r] = sideEls(row.board, s, { live: i === last, plug });
    const eq = equationRow(l, r, eqClass(charsOf([...row.board.left, ...row.board.right])));
    eq.setAttribute('role', 'img');
    eq.setAttribute('aria-label', 'The equation');
    const kids = [];                                                // which equation is being checked is said on its own line above the check rows
    if (row.type === 'fold') kids.push(html('span', 'lb-foldtag', [html('span', 'is-blue', [fractionText(row.label.n)]), ' of both sides']));
    kids.push(eq);
    return html('div', `lb-rowwrap is-settled${row.type === 'fold' ? ' is-fold' : ''}${plug ? ' is-plugrow' : ''}`, kids);
  });
}

// ---------- the answer row, Check, Next, the substitution ----------

// The substitution lines, in the checking space beside the equation being checked (Build D, Part 2): the first is the copy of the
// equation with the value in parentheses in place of each x; then one operation a press of the green Next, the operation about to
// happen bold in the accent colour; then Balanced or Not balanced. No labels.
function substList(s, sub, view) {
  return checkSpace(view.lines.map((line) => line.segs.map((seg) => (seg.cls ? html('span', seg.cls, [seg.text]) : seg.text))), view.mark ? sub.ok : null, view.last);
}

// The checking space's rows (shared by every Solve it card): `lines` is a list of rows (each a list of nodes or text), `mark` is true
// (Balanced), false (Not balanced) or null (not yet), `current` the row being worked.
export function checkSpace(lines, mark, current = lines.length - 1) {
  const list = html('ol', 'lb-subst sv-checklist');
  lines.forEach((kids, i) => list.append(html('li', `sv-checkrow lb-sline${i === current ? ' is-current' : ''}`, kids)));
  if (mark !== null) list.append(html('li', `sv-checkrow sv-mark ${mark ? 'is-good' : 'is-bad'}`, [mark ? '✓ Balanced' : '✗ Not balanced']));
  return list;
}

export function nextButton(s, loop) {
  const stepping = s.sub && !s.sub.placing && s.sub.step < loop.subTotal(s.sub);
  const done = s.stage === 'done';
  // a move that left a picture (or an unfolded move) waits for Next, which folds it and clears the picture (loop §3A, §6)
  const folding = !s.sub && !done && (s.unfolded || Boolean(s.pic));
  if (!stepping && !done && !folding) return null;
  return html('button', `btn btn-go lb-next${folding ? '' : ' is-target'}`, [done ? 'Next problem ▸' : 'Next ▸'], { type: 'button', 'data-action': done ? 'next' : folding ? 'foldNext' : 'nextLine' });
}

// The x = [ ] row with Check directly under it (and Next beside Check). Greyed whenever it is not an option.
export function answerRow(s, loop) {
  const block = html('div', 'lb-answerrows');
  const live = loop.answerLive(s);
  const placing = Boolean(s.sub?.placing);
  const text = s.sub && !live ? String(s.sub.typed) : s.entry;
  const ready = live && /^-?\d+$/.test(text);
  const row = html('div', `lb-answerrow${live || placing ? '' : ' is-dim'}`);
  row.append(html('strong', 'lb-prompt', ['x =']));
  const typed = html('button', `ab-typed lb-typed${text ? '' : ' is-empty'}${live && !text ? ' is-blink' : ''}${placing ? ' is-chip' : ''}`, [text ? text.replace('-', MINUS) : ' '], { type: 'button', ...(placing ? { 'data-chip': '1', 'aria-label': `Your value ${text}: drag it onto x` } : { 'data-action': 'focus', 'data-target': 'answer', 'aria-label': 'Your answer for x' }) });
  typed.disabled = !live && !placing;
  const check = html('button', `btn lb-check${ready ? ' btn-go is-target' : ' btn-primary'}`, ['Check ✓'], { type: 'button', 'data-action': 'check' });
  check.disabled = !ready;
  row.append(typed);
  const next = nextButton(s, loop);
  block.append(row, html('div', 'lb-checkrow', next ? [check, next] : [check]));
  return block;
}

// The check rows (the substitution, a line a click, then the mark), written in the work stack.
export const substBlock = (s, loop) => (s.sub ? substList(s, s.sub, loop.subView(s.sub)) : html('ol', 'lb-subst'));

export function answerBlock(s, loop) {
  const block = html('div', 'lb-answerblock');
  block.append(...answerRow(s, loop).childNodes, substBlock(s, loop));
  return block;
}

// The value is dragged onto x (Build D-2, Part 2: dragging only; a click on x no longer places it, though Enter still does, for the
// keyboard). While the value is a chip, a pointer drag carries a copy of it; letting go over x places it. After about 2.5 seconds with
// nothing done, a faint copy of the value travels from x = to the first x, again and again until the student acts.
const HINT_WAIT = 2500;
const HINT_EVERY = 2600;
const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function bindValueDrag(root, dispatch) {
  let ghost = null;
  let idleSince = Date.now();
  let lastHint = 0;
  let chipSeen = false;
  const move = (e) => { if (ghost) { ghost.style.left = `${e.clientX}px`; ghost.style.top = `${e.clientY}px`; } };
  const end = (e) => {
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', end);
    document.removeEventListener('pointercancel', end);
    if (!ghost) return;
    ghost.remove();
    ghost = null;
    // letting go over x, or anywhere on the outlined equation, places the value (a kind drop zone; small fingers, small x)
    const over = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-x][data-action="placeValue"], .is-plugrow');
    if (over && root.contains(over)) dispatch({ type: 'placeValue', ...(over.dataset?.xi !== undefined && over.matches('[data-x]') ? { index: Number(over.dataset.xi) } : {}) });
  };
  const down = (e) => {
    const chip = e.target.closest('[data-chip]');
    if (!chip || e.button > 0) return;
    e.preventDefault();
    ghost = html('div', 'sv-ghost', [chip.textContent]);
    document.body.append(ghost);
    move(e);
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', end);
    document.addEventListener('pointercancel', end);
  };
  // a pointer click on x does nothing now (a keyboard's Enter, a click with no pointer behind it, still places the value)
  const click = (e) => {
    if (e.detail > 0 && e.target.closest?.('[data-x][data-action="placeValue"]')) { e.preventDefault(); e.stopImmediatePropagation(); }
  };
  // x = shows its cursor once clicked; a press anywhere else, or the focus moving on, takes it away
  // (on the click, after whatever it pressed has had its turn, and only while the cursor still shows: a redraw on the press itself
  // would lose the click)
  const cursorOn = () => Boolean(root.querySelector('[data-fk="answer"].is-blink'));
  const away = (e) => {
    if (cursorOn() && !e.target.closest?.('[data-fk="answer"]')) dispatch({ type: 'ui', patch: { fieldCursor: false } });
  };
  let tabbing = false;                          // the focus moving on by the keyboard (a click's focus waits for its click)
  const pressed = () => { idleSince = Date.now(); tabbing = false; };
  const awayFocus = (e) => {
    if (tabbing && cursorOn() && e.target instanceof Element && root.contains(e.target) && !e.target.closest('[data-fk="answer"]')) dispatch({ type: 'ui', patch: { fieldCursor: false } });
  };
  const acted = (e) => { idleSince = Date.now(); if (e.key === 'Tab') tabbing = true; };
  const hint = () => {
    const chip = root.isConnected && !root.closest('[hidden]') ? root.querySelector('[data-chip]') : null;
    if (!chip) { chipSeen = false; return; }
    if (!chipSeen) { chipSeen = true; idleSince = Date.now(); }
    const now = Date.now();
    if (ghost || now - idleSince < HINT_WAIT || now - lastHint < HINT_EVERY) return;
    const x = root.querySelector('[data-x][data-action="placeValue"]');
    if (!x) return;
    lastHint = now;
    const a = chip.getBoundingClientRect();
    const b = x.getBoundingClientRect();
    const g = html('div', 'sv-ghost sv-hintghost', [chip.textContent], { 'aria-hidden': 'true' });
    document.body.append(g);
    const at = (r) => `translate(${r.left + r.width / 2}px, ${r.top + r.height / 2}px) translate(-50%, -50%)`;
    g.style.left = '0px';
    g.style.top = '0px';
    const still = reduceMotion();
    const anim = g.animate(still
      ? [{ transform: at(b), opacity: 0 }, { transform: at(b), opacity: 0.45 }, { transform: at(b), opacity: 0 }]
      : [{ transform: at(a), opacity: 0 }, { transform: at(a), opacity: 0.6, offset: 0.15 }, { transform: at(b), opacity: 0.6, offset: 0.8 }, { transform: at(b), opacity: 0 }],
    { duration: 1800, easing: 'ease-in-out' });
    anim.onfinish = () => g.remove();
    anim.oncancel = () => g.remove();
  };
  const timer = setInterval(hint, 250);
  root.addEventListener('pointerdown', down);
  root.addEventListener('click', click, true);
  document.addEventListener('pointerdown', pressed, true);
  document.addEventListener('click', away);
  document.addEventListener('focusin', awayFocus);
  window.addEventListener('keydown', acted, true);
  return () => {
    clearInterval(timer);
    root.removeEventListener('pointerdown', down);
    root.removeEventListener('click', click, true);
    document.removeEventListener('pointerdown', pressed, true);
    document.removeEventListener('click', away);
    document.removeEventListener('focusin', awayFocus);
    window.removeEventListener('keydown', acted, true);
    ghost?.remove();
    document.querySelectorAll('.sv-hintghost').forEach((g) => g.remove());
  };
}

// ---------- the help row: permanent, always in the same place; whatever is not an option is greyed ----------

export function helpRow(s, loop) {
  const done = s.stage === 'done';
  const off = done || !loop.helpOk(s);
  const row = html('div', 'lb-helprow');
  const mk = (label, action, key, extra = {}) => {
    const b = html('button', `btn ${extra.cls ?? ''}`.trim(), [label], { type: 'button', 'data-action': action, ...(key ? { 'data-key': key } : {}) });
    b.disabled = extra.off ?? off;
    return b;
  };
  row.append(mk('I’m stuck', 'stuck', 's'), mk('Teach me step-by-step', 'teach', 't'), mk('Start over', 'startOver', null, { cls: 'btn-quiet', off: done || !loop.startOverOk(s) }));
  return row;
}

// Undo, directly under the stack: live for the current unfolded move or a wrong guess; pulsing when it is the next place to click.
export function undoRow(s, { wrongGuess, cue }) {
  const done = s.stage === 'done';
  const row = actionRow({ undo: true });
  const undo = row.querySelector('.btn-undo');
  undo.disabled = done || !((s.history.length > 0 && !s.sub) || wrongGuess);
  if (!undo.disabled && (cue || wrongGuess)) undo.classList.add('is-target');
  return row;
}

// ---------- the light design (Build D, Part 1): no banner, one green button ----------

// The pop-up texts of the light design's two openings: the very first problem of a visit, and the problem after a correct guess.
export const FIRST_TEXT = 'Find the value of x.';
// The check (Build D-2, Part 2): the value is named, then where it goes.
export const placeText = (v) => `Let’s check that x = ${String(v).replace('-', MINUS)} is the solution.\nDrag the ${String(v).replace('-', MINUS)} onto an x above.`;
export const FORCED_TEXT = 'Your mental math is very strong.\nLet’s try solving this next problem using a move first.';

// The line, kept for screen readers only: what the card says is shown in pop-ups now.
export const srLine = (text) => html('div', 'lb-line sr-only', [html('p', 'lb-text', [text])], { role: 'status', 'aria-live': 'polite' });

// The one forward button: big, green, in the same place on every screen (right of x =). Only its word changes; it is greyed when there
// is nothing to move forward. f: { label, action, enabled }.
export function forwardButton(f) {
  const b = html('button', `btn btn-go btn-forward${f.enabled ? '' : ' is-off'}`, [f.label], { type: 'button', 'data-action': f.action, 'data-fk': 'forward' });
  b.disabled = !f.enabled;
  return b;
}

// What the card says, as a pop-up with nothing dimmed (errors, hints and questions are the spotlight's): a NUDGE (type a number, too
// big...) next to where the student is, or a NOTE below the work (beside the scaffold's picture while it is up). Messages the screen
// already shows say nothing. o: { silent: Set, nudge: { key: target }, text(fb), scaffold: target of the scaffold's picture, or null }.
export function notePopup(s, o) {
  const fb = s.feedback;
  if (!fb?.key || s.stage === 'done' || o.silent.has(fb.key)) return null;
  const text = o.text(fb);
  if (!text) return null;
  const target = o.nudge[fb.key];
  if (target) return { spot: { kind: 'nudge', target, place: ['panel', 'newest', 'fractions'].includes(target) ? 'beside' : 'field' }, text };
  return { spot: o.scaffold ? { kind: 'note', target: o.scaffold, place: 'beside' } : { kind: 'note', place: 'below' }, text };
}

// Enter presses the green button, wherever the focus is on the Mat (a field, the problem), unless it is on another action button
// (Undo, a move, I'm stuck), which keeps its own Enter.
// The help corner's buttons never keep an Enter of their own: a student who clicks I'm stuck, types a number and presses Enter gets the
// green button (Go with the number in the blank, else Next, else Check), never another clue (Build H, Part 1; rev 0.1's order).
export const HELP_BUTTONS = '[data-action="stuck"], [data-action="teach"], [data-action="startOver"]';

export function bindForwardKey(root) {
  const onKey = (e) => {
    if (e.key !== 'Enter' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (!root.isConnected || root.closest('[hidden]') || document.querySelector('dialog[open]') || document.querySelector('.spot-layer.is-error')) return;
    const f = root.querySelector('.btn-forward');
    if (!f) return;
    const a = document.activeElement;
    if (a instanceof HTMLElement && a !== f && a.matches('button, a, [role="button"]') && !a.matches(HELP_BUTTONS) && !a.dataset.lxField && !a.closest('#controls') && !a.matches('[data-action="focus"], [data-x]')) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (!f.disabled) f.click();
    else root.querySelector('[data-x][data-action="placeValue"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));   // (an x on the seesaw is SVG: no .click())     // the keyboard's way to put the value into x
  };
  window.addEventListener('keydown', onKey, true);
  return () => window.removeEventListener('keydown', onKey, true);
}
