// The screen pieces every card of the Solve it loop shares (SPEC-SOLVE-IT-LOOP.md §2-§4): the line with the one choice prompt and its two
// buttons, the work stack (the equation, each folded move as one row, the current move's work, a failed attempt in red), the
// x = [▁] row with Check under it and Next beside it, the substitution written a line a click with the step highlighted, the
// value placed on x by a drag (or a tap), and the help row. A card (view/divideScreen.js, ...) composes these and adds only its own
// pictures. Cards never draw these themselves. Plain HTML, so every target is a real 44 px and the text can be big.

import { html, actionRow } from './addBothMat.js';
import { equationRow } from './lightScreen.js';
import { MINUS } from '../engine/expr.js';
import { signed, fractionText, boardText } from '../engine/solveTerms.js';
import { CHOICE_BUTTONS } from '../engine/solveLoop.js';

// ---------- the line: actions only, one sentence, and the choice ----------

// The operation is blue wherever it shows (loop §3D): on this card, the fractions ½ ⅓ ¼ ⅕ ⅙ in any sentence of the line.
const FRACTION_GLYPHS = /([½⅓¼⅕⅙])/;
export const blueFractions = (text) => String(text).split(FRACTION_GLYPHS).map((part) => (FRACTION_GLYPHS.test(part) ? html('span', 'is-blue', [part]) : part));

export function lineBlock(s, textOf, loop) {
  const line = html('div', `lb-line${s.feedback?.bad ? ' is-bad' : ''}${s.stage === 'done' ? ' is-good' : ''}`, [], { role: 'status', 'aria-live': 'polite' });
  line.append(html('p', 'lb-text', blueFractions(textOf(s.feedback))));
  const choosing = s.stage === 'moves' && !s.path && !loop.alone(s) && !s.sub && !s.needUndo;
  if (choosing) {
    line.append(html('div', 'lb-linebtns', CHOICE_BUTTONS.map(([label, value]) => html('button', 'btn lb-choice', [label], { type: 'button', 'data-action': 'path', 'data-value': value }))));
  }
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
      const dropOn = o.plug && s.sub?.placing;
      const c = t.coef ?? 1;
      // the value has landed on this x: it takes x's place in the row (blue, in parentheses when negative) until Next writes the first check row
      if (o.plug && s.sub?.landed) {
        const v = s.sub.typed;
        out.push(html('span', 'lb-landed', [c > 1 ? `${c} × ` : '', html('span', 'is-blue lb-landed-val', [v < 0 ? `(${signed(v)})` : String(v)])]));
        return;
      }
      const xel = html('span', `lb-x${o.plug ? ' is-plugx' : ''}${dropOn ? ' is-droptarget' : ''}`, ['x'], { 'data-x': '1', ...(dropOn ? { 'data-action': 'placeValue', role: 'button', tabindex: '0', 'aria-label': 'Put your value on x' } : {}) });
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

const sideEls = (board, s, o) => [termsOf(board.left, s, o), termsOf(board.right, s, o)];

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

// The substitution lines: the operation about to happen is bold in the accent colour, and the result of the one before shares it.
// The equation being checked is named on its own line above the check rows ("Checking in 3x = 12"), never over an equation row.
function substList(s, sub, view) {
  const list = html('ol', 'lb-subst');
  const target = sub.target === 'current' ? s.board : s.rows[0].board;
  list.append(html('li', 'lb-checkhead', [`Checking in ${boardText(target)}`]));
  view.lines.forEach((line, i) => {
    const marks = i === view.last ? ' is-current' : '';
    list.append(html('li', `lb-sline${marks}`, line.segs.map((seg) => (seg.cls ? html('span', seg.cls, [seg.text]) : seg.text))));
  });
  if (view.mark) list.append(html('li', sub.ok ? 'is-good' : 'is-bad', [sub.ok ? '✓ Balanced' : '✗ Not balanced']));
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

// The value is dragged onto x (every drag has a tap alternative: tap x). While the value is a chip, a pointer drag carries a copy
// of it; letting go over x places it.
export function bindValueDrag(root, dispatch) {
  let ghost = null;
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
    if (over && root.contains(over)) dispatch({ type: 'placeValue' });
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
  root.addEventListener('pointerdown', down);
  return () => { root.removeEventListener('pointerdown', down); ghost?.remove(); };
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

// The tucked layout's one helper row: I'm stuck, Teach me, Undo, Start over, in that order.
export function helperRow(s, loop, undoOpts) {
  const help = helpRow(s, loop);
  const undo = undoRow(s, undoOpts).querySelector('.btn-undo');
  const [stuck, teach, startOver] = help.children;
  const row = html('div', 'lb-helprow tk-helper');
  row.append(stuck, teach, undo, startOver);
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
