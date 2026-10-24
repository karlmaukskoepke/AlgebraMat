// The screen pieces every card of the Solve it loop shares (SPEC-SOLVE-IT-LOOP.md §2-§4): the line, the work stack (the equation, each folded move as one row, the current move's work, a failed attempt in red), the
// x = [▁] row with Check under it and Next beside it, the substitution written a line a click with the step highlighted, the
// value placed on x by a drag (or a tap), and the help row. A card (view/divideScreen.js, ...) composes these and adds only its own
// pictures. Cards never draw these themselves. Plain HTML, so every target is a real 44 px and the text can be big.

import { html, actionRow } from './addBothMat.js';
import { equationRow } from './lightScreen.js';
import { MINUS } from '../engine/expr.js';
import { signed, fractionText, boardText, equationSegs } from '../engine/solveTerms.js';

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
    const subGroup = i > 0 && t.kind === 'group' && t.factor < 0;                  // `5 − 2(x + 2)` (Build M)
    if (o.swap?.[t.id]) { if (i > 0) out.push(html('span', 'lb-plus', ['+'])); out.push(o.swap[t.id]); return; }   // (a blank in its place: Build P)
    if (i > 0) out.push(html('span', 'lb-plus', [(t.kind === 'num' && t.v < 0) || subGroup ? MINUS : '+']));
    if (t.kind === 'group') {
      // a factor times a parenthesis, written as it is: `3(x + 2)`, `−2(x − 4)` (Build M)
      const f = subGroup ? -t.factor : t.factor;
      out.push(html('span', 'lb-frac lb-group', [f === 1 ? '' : f === -1 ? MINUS : String(f).replace('-', MINUS), '(', ...termsOf(t.inner, s, { ...o, live: false }), ')']));
    } else if (t.kind === 'frac' && (o.div || s?.divIds?.includes(t.id))) {
      // a row made with the Divide button, in division form (Build O, display only): the side in parentheses over a bar, n beneath.
      // A product that can be worked out (Build P, Part 2): the bar is the button
      const calc = o.calc === t.id;
      const bar = calc ? calcButton(t, 'lb-divbar is-calc', 'Divide: work it out') : null;
      const el = divisionEl(termsOf(t.inner, s, { ...o, live: false, plug: false }), `${t.sign < 0 ? MINUS : ''}${t.n}`, bar);
      if (calc || o.calcOn === t.id) el.dataset.calc = t.id;
      out.push(el);
    } else if (t.kind === 'frac') {
      // a product that can be worked out (Build P, Part 2): a small × between the fraction and its number is the button
      const calc = o.calc === t.id;
      const dot = calc ? [calcButton(t, 'lb-calcdot', 'Multiply: work it out', '×')] : [];
      const el = html('span', 'lb-frac', [html('span', 'is-blue', [`${t.sign < 0 ? MINUS : ''}${fractionText(t.n)}`]), ...dot, '(', ...termsOf(t.inner, s, { ...o, live: false, plug: false }), ')']);
      if (calc || o.calcOn === t.id) el.dataset.calc = t.id;
      out.push(el);
    } else if (t.kind === 'times') {
      // both sides times a number, written out: `−1 × (−x)` (Flip everything's work row, Build J); the number in blue (loop §3D)
      out.push(html('span', 'lb-frac', [html('span', 'is-blue', [`${signed(t.f)} ×`]), ' (', ...termsOf(t.inner, s, { ...o, live: false, plug: false }), ')']));
    } else if (t.kind === 'neg') {
      // the opposite of a number, left unsimplified at x alone: `x = −(12)` (Build J)
      out.push(html('span', 'lb-frac lb-neg', [html('span', 'is-blue', [MINUS]), '(', ...termsOf(t.inner, s, { ...o, live: false, plug: false }), ')']));
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
      else if (manyX && dropOn && s.sub.filled?.length) xel.append(waitingGhost(s.sub.typed));
      // the number in front of x, with its sign (`−x`, `−3x`: Flip everything, Build J)
      const front = c > 1 || c < -1 ? String(c).replace('-', MINUS) : c === -1 ? MINUS : null;
      // (a negative one is its own piece, so a spotlight on it covers the minus too; Divide's positive ones are as before)
      const piece = c < 0 ? html('span', 'lb-num lb-front', [front]) : front;
      if (front) out.push(html('span', 'lb-coef', [o.live && s.hint?.kind === 'coef' ? html('span', 'lb-hintbox', [front]) : piece, xel]));
      else out.push(xel);
    } else {
      out.push(html('span', 'lb-num', [i > 0 && t.v < 0 ? String(-t.v) : signed(t.v)]));
    }
  });
  return out;
}

// An x still waiting for the value once another x has it: a faint ghost of the value above it (Build P, Part 8)
export const waitingGhost = (v) => html('span', 'lb-xwait', [signed(v)], { 'aria-hidden': 'true' });

const charsOf = (list) => list.map((x) => (x.kind === 'frac' || x.kind === 'neg' || x.kind === 'group' ? 5 + charsOf(x.inner) : x.kind === 'times' ? 7 + charsOf(x.inner) : x.kind === 'x' ? ((x.coef ?? 1) > 1 ? 2 : (x.coef ?? 1) < 0 ? String(x.coef).length : 1) : String(signed(x.v)).length + 3)).reduce((a, b) => a + b, 0);
const eqClass = (chars) => (chars > 30 ? ' is-xlong' : chars > 20 ? ' is-long' : '');

const sideEls = (board, s, o) => { const oo = { ...o, xi: { n: 0 } }; return [termsOf(board.left, s, oo), termsOf(board.right, s, oo)]; };
const isDiv = (row) => row.shown === 'div';
// A side as written, inert (the move's preview row). `div`: its fractions in division form (a row made with the Divide button, Build O).
export const sideTerms = (terms, s, o = {}) => termsOf(terms, s, { live: false, plug: false, ...o });

// Division form (Build O): `(5x)` over a bar, the divisor under it in the operation's blue. `top` is the side's elements; `bottom` the
// divisor's text, or an element (the Divide button's blank).
export function divisionEl(top, bottom, bar = null) {
  return html('span', 'lb-frac lb-divfrac', [html('span', 'lb-divtop', ['(', ...top, ')']), bar ?? html('span', 'lb-divbar'), typeof bottom === 'string' ? html('span', 'lb-divbot is-blue', [bottom]) : bottom]);
}
// The × (or the fraction bar) of a product that can be worked out: a button (Build P, Part 2)
function calcButton(t, cls, label, text = '') {
  return html('button', cls, text ? [text] : [], { type: 'button', 'data-action': 'lxCalc', 'data-id': t.id, 'aria-label': label });
}
// The small line under a Divide row: "Same as multiplying by ⅕." (−⅓ for a divisor of −3)
export function sameAsLine(n, sign = 1) {
  return html('p', 'mo-sameas', ['Same as multiplying by ', html('span', 'is-blue', [`${sign < 0 ? MINUS : ''}${fractionText(n)}`]), '.']);
}
// the divisor of a row made with the Divide button (its first fraction), or null
export function divisorOf(row) {
  if (row?.shown !== 'div' || row.failed) return null;
  const f = [...row.board.left, ...row.board.right].find((t) => t.kind === 'frac');
  return f ? { n: f.n, sign: f.sign < 0 ? -1 : 1 } : null;
}

// What a folded move says it did, above its equation: `⅓ of both sides`, `−⅓ of both sides`, `−1 × both sides` (Build J).
export function foldTag(label) {
  if (label.shown === 'div') return html('span', 'lb-foldtag', ['both sides ', html('span', 'is-blue', [`÷ ${label.sign < 0 ? MINUS : ''}${label.n}`])]);   // (made with Divide, Build O)
  if (label.dist !== undefined) return html('span', 'lb-foldtag', [html('span', 'is-blue', [`${signed(label.dist)} ·`]), ' each piece']);   // a distribute (Build M)
  if (label.flip) return html('span', 'lb-foldtag', [html('span', 'is-blue', [`${MINUS}1 ×`]), ' both sides']);
  return html('span', 'lb-foldtag', [html('span', 'is-blue', [`${label.sign < 0 ? MINUS : ''}${fractionText(label.n)}`]), ' of both sides']);
}

// The work stack. Every row stays settled (no entrance animation: a re-render never replays one).
export function stackRows(s) {
  const boardRows = s.rows.map((r, i) => (r.type === 'eq' || r.type === 'fold' ? i : -1)).filter((i) => i >= 0);
  const last = boardRows.at(-1);
  const plugIdx = s.sub ? (s.sub.target === 'current' ? last : 0) : -1;
  return s.rows.map((row, i) => {
    if (row.type === 'work') {
      // a move written as an equation: the fraction of both whole sides (a failed try is marked)
      const [l, r] = sideEls(row.board, s, { live: false, plug: false, div: isDiv(row) });
      const w = equationRow(l, r, `lb-work${row.failed ? ' is-failed' : ''}${isDiv(row) ? ' is-division' : ''}${eqClass(charsOf([...row.board.left, ...row.board.right]))}`);
      w.setAttribute('aria-hidden', 'true');
      if (row.failed) w.append(html('span', 'lb-failmark', ['✗']));
      const d = divisorOf(row);
      return html('div', 'lb-rowwrap has-work is-settled', [w, ...(d ? [sameAsLine(d.n, d.sign)] : [])]);
    }
    const plug = i === plugIdx;
    const [l, r] = sideEls(row.board, s, { live: i === last, plug, div: isDiv(row) });
    const eq = equationRow(l, r, `${isDiv(row) ? 'is-division ' : ''}` + eqClass(charsOf([...row.board.left, ...row.board.right])));
    eq.setAttribute('role', 'img');
    eq.setAttribute('aria-label', 'The equation');
    const kids = [];                                                // which equation is being checked is said on its own line above the check rows
    if (row.type === 'fold') kids.push(foldTag(row.label));
    kids.push(eq);
    return html('div', `lb-rowwrap is-settled${row.type === 'fold' ? ' is-fold' : ''}${plug ? ' is-plugrow' : ''}`, kids);
  });
}

// ---------- the answer row, Check, Next, the substitution ----------

// The check, in the checking space beside the equation being checked (Build I, Part 1): the first line is that equation exactly as it
// is, every x in the blue of the x it is; directly under it, the same equation with the value in each x's place, each value set under
// the x it replaced so the blue pairs read "this x became this number"; then one operation a press of the green Next, the operation
// about to happen bold in the accent colour; then Balanced or Not balanced. No labels. While the value waits to be dropped in, the space
// keeps the first line ready (hidden): picking the value up slides a faint copy of it in (bindValueDrag).
function substList(s, sub, view) {
  const target = sub.target === 'current' ? s.board : s.rows[0].board;
  const head = equationSegs(target).map((seg) => (seg.xi !== undefined ? html('span', seg.cls, [seg.text], { 'data-pair': String(seg.xi) }) : seg.cls ? html('span', seg.cls, [seg.text]) : seg.text));
  if (!view.lines.length) {
    const list = checkSpace([], view.mark ? sub.ok : null);
    if (sub.placing) list.append(html('div', 'sv-line1src', head, { hidden: '', 'aria-hidden': 'true' }));
    return list;
  }
  const lines = view.lines.map((line, i) => (i === 0 ? pairedSegs(line.segs) : line.segs.map((seg) => (seg.cls ? html('span', seg.cls, [seg.text]) : seg.text))));
  const list = checkSpace([head, ...lines], view.mark ? sub.ok : null, view.last + 1);
  list.children[0].classList.add('sv-line1');
  list.children[1].classList.add('sv-line2');
  list.children[0].setAttribute('aria-label', `The equation: ${equationSegs(target).map((seg) => seg.text).join('')}`);
  alignPairs(list);
  return list;
}

// The line with the value in place of x: each value (the blue segment) is numbered as the x it replaced, and a spacer sits before it (or
// before its "2 × " or "−(") so the value can be moved right under its x.
function pairedSegs(segs) {
  const out = [html('span', 'sv-pad')];
  let k = 0;
  segs.forEach((seg, j) => {
    const value = seg.cls.split(' ').includes('is-blue');
    const prefix = !value && segs[j + 1]?.cls.split(' ').includes('is-blue') && /×\s$|\($/.test(seg.text);
    if (k > 0 && (prefix || (value && !/×\s$|\($/.test(segs[j - 1]?.text ?? '')))) out.push(html('span', 'sv-pad'));
    out.push(value ? html('span', seg.cls, [seg.text], { 'data-pair': String(k++) }) : seg.cls ? html('span', seg.cls, [seg.text]) : seg.text);
  });
  return out;
}

// Each value straight under its x (measured once the check is on screen, and again when the fonts arrive). A value wider than x moves
// the rest of its line, never the pair; if the first value reaches left of where the line starts, the first line moves right as a whole
// (never stretched or squeezed).
function alignPairs(list) {
  const run = () => {
    if (!list.isConnected) return;
    const top = list.querySelector('.sv-line1');
    const sub = list.querySelector('.sv-line2');
    if (!top || !sub) return;
    top.style.marginLeft = '';
    const pads = [...sub.querySelectorAll('.sv-pad')];
    pads.forEach((p) => { p.style.width = '0px'; });
    const xs = [...top.querySelectorAll('[data-pair]')];
    const vs = [...sub.querySelectorAll('[data-pair]')];
    const mid = (e) => { const r = e.getBoundingClientRect(); return (r.left + r.right) / 2; };
    for (let i = 0; i < Math.min(xs.length, vs.length, pads.length); i++) {
      const d = mid(xs[i]) - mid(vs[i]);
      if (i === 0 && d < 0) top.style.marginLeft = `${-d}px`;
      else if (d > 0) pads[i].style.width = `${d}px`;
    }
  };
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
  if (typeof document !== 'undefined') document.fonts?.ready.then(run);
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
// Picking the value up (Build I, Part 1): a faint copy of the equation being checked slides from it into the checking space, to the place
// the check's first line will take. Dropping the value on x makes it solid (the check is drawn there); dropping it anywhere else slides it
// back. Returns { solid, back }, or null when there is nowhere for it to go.
function slideShadow(root) {
  const src = root.querySelector('.sv-line1src');
  const list = src?.parentElement;
  const from = root.querySelector('.lb-rowwrap.is-plugrow .lb-eq') ?? root.querySelector('.is-plugrow');
  if (!src || !list || !from) return null;
  const to = list.getBoundingClientRect();
  const pad = parseFloat(getComputedStyle(list).paddingTop) || 0;
  const line = html('div', 'sv-shadowline', [...src.cloneNode(true).childNodes], { 'aria-hidden': 'true' });
  line.style.font = getComputedStyle(list).font;
  list.parentElement.append(line);
  const a = from.getBoundingClientRect();
  const end = `translate(${to.left}px, ${to.top + pad}px)`;
  const start = `translate(${a.left}px, ${a.top}px)`;
  const still = reduceMotion();
  line.style.transform = end;
  const anim = line.animate(still ? [{ opacity: 0 }, { opacity: 0.45 }] : [{ transform: start, opacity: 0 }, { transform: end, opacity: 0.45 }], { duration: still ? 200 : 450, easing: 'ease-out', fill: 'forwards' });
  return {
    solid: () => { anim.cancel(); line.style.opacity = '1'; },
    back: () => {
      anim.cancel();
      const out = line.animate(still ? [{ opacity: 0.45 }, { opacity: 0 }] : [{ transform: end, opacity: 0.45 }, { transform: start, opacity: 0 }], { duration: still ? 200 : 400, easing: 'ease-in', fill: 'forwards' });
      out.onfinish = () => line.remove();
      out.oncancel = () => line.remove();
    },
  };
}

const HINT_WAIT = 2500;
const HINT_EVERY = 2600;
const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// The empty x nearest a drop on the row being checked (its number left to right), or undefined
function nearestX(root, x) {
  let best;
  let gap = Infinity;
  root.querySelectorAll('[data-x][data-action="placeValue"]').forEach((el) => {
    const r = el.getBoundingClientRect();
    const d = Math.abs((r.left + r.right) / 2 - x);
    if (d < gap) { gap = d; best = Number(el.dataset.xi); }
  });
  return best;
}

export function bindValueDrag(root, dispatch) {
  let ghost = null;
  let shadow = null;
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
    root.classList.remove('is-carrying-value');
    const over = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-x][data-action="placeValue"], .is-plugrow');
    const sh = shadow;
    shadow = null;
    if (over && root.contains(over)) {
      // with more than one x, a drop fills one x only (loop spec rev 2.5): the x it landed on, or on the row, the empty x nearest the drop
      const at = over.matches('[data-x]') ? Number(over.dataset.xi) : nearestX(root, e.clientX);
      const empties = root.querySelectorAll('[data-x][data-action="placeValue"]').length;
      if (empties <= 1) sh?.solid(); else sh?.back();                      // the copy stays and turns solid once the last x has the value
      dispatch({ type: 'placeValue', ...(Number.isInteger(at) ? { index: at } : {}) });
    } else sh?.back();                                                     // anywhere else: the copy slides back, and nothing changes
  };
  const down = (e) => {
    const chip = e.target.closest('[data-chip]');
    if (!chip || e.button > 0) return;
    e.preventDefault();
    ghost = html('div', 'sv-ghost', [chip.textContent]);
    document.body.append(ghost);
    root.classList.add('is-carrying-value');                              // every x still waiting for the value glows as a drop target
    shadow = slideShadow(root);
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
    shadow?.back();
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
