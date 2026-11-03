// The rewrite toggle drawn (Build AC, Part 3; loop spec rev 2.16, §1D): a tap on a fraction of x writes the other form as its own row
// ("rewrite"), and that row shows why the two forms are the same before it is printed. In the new row's own space, the term goes through
// five frames, about 0.3 s each (1.5 s in all; `?animslow=1` four times slower, for testers):
//   ⅔x → 2x/3:  ⅔x (the x lifts off) · ⅔ x/1 (x written over 1) · ⅔ · x/1 (a dot) · 2·x over 3·1 (the tops and bottoms join) · 2x/3
//   2x/3 → ⅔x:  2x/3 · 2·x over 3 (the top separates) · ⅔ · x/1 (the x split out) · ⅔ · x (the /1 drops) · ⅔x
// (a unit fraction the same, the 1 on top absorbed: ⅓ · x/1, 1·x over 3·1, x/3). A minus in front stays where it is, outside the frames.
// Dots only, never a times sign. Then the printed term shows (it was there all along, hidden, so nothing moves).
//
// It plays once, when the row first appears after the tap: never on a redraw, a resize, Undo or a fold (the row is kept on screen by
// view/keepRows.js while it plays, and drawn still afterwards); a reload starts the problem again, so no rewrite row is ever redrawn
// fresh. Any key or click finishes it at once (finishRewrites, beside Flip's cross-off), and the key or click then does what it does: a
// second tap finishes it, then toggles. Reduced motion: no frames, the row simply appears (the CSS). Nothing is recorded.

import { html } from './addBothMat.js';

const slow = (() => { try { return new URLSearchParams(globalThis.location?.search ?? '').get('animslow') === '1'; } catch { return false; } })();
export const FRAME_S = slow ? 1.2 : 0.3;                 // one frame (s)
export const FRAMES = 5;
export const REWRITE_MS = Math.round(FRAME_S * FRAMES * 1000);

// rows (by their key) that have started, and when; rows that were finished early
const started = new Map();
const finished = new Set();
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

// Is this newest rewrite row still to be drawn playing? The first time it is drawn it starts; it stays playing until its time is up or it
// is finished, and is never started again.
export function rewritePlaying(key) {
  if (finished.has(key)) return false;
  if (!started.has(key)) {
    started.set(key, now());
    // (its time up, the row is drawn settled even if nothing redraws the screen)
    if (typeof document !== 'undefined') setTimeout(() => { for (const r of document.querySelectorAll('.lb-rowwrap.is-rewriteanim')) if (r.dataset.rk === key) r.classList.add('is-settled'); }, REWRITE_MS + 50);
  }
  return now() - started.get(key) < REWRITE_MS;
}
// Any key or click: every rewrite still playing ends now, drawn as it ends.
export function finishRewrites(root) {
  for (const row of root?.querySelectorAll?.('.lb-rowwrap.is-rewriteanim') ?? []) {
    if (row.dataset.rk) finished.add(row.dataset.rk);
    row.classList.add('is-settled');
  }
  for (const k of started.keys()) finished.add(k);
}

const X = (cls = '') => html('span', `lb-x${cls ? ` ${cls}` : ''}`, ['x']);
const dot = () => html('span', 'fa-dot', ['·']);
const stack = (top, bot, cls = '') => html('span', `lx-sfrac lb-fxfrac${cls ? ` ${cls}` : ''}`, [html('span', 'lx-sfrac-top', top), html('span', 'lx-sfrac-bar'), html('span', 'lx-sfrac-bot', bot)]);
const n = (v) => html('span', 'lb-fxtop', [String(v)]);

// The five frames for a term rewritten from `from` ('times' or 'over'), its top's size `a` and its bottom `q`
export function rewriteFrames(from, a, q) {
  const topOver = () => (a === 1 ? [X()] : [n(a), X()]);
  const frames = from === 'times'
    ? [
      [stack([n(a)], [String(q)]), X('fa-lift')],
      [stack([n(a)], [String(q)]), stack([X()], ['1'], 'fa-new')],
      [stack([n(a)], [String(q)]), dot(), stack([X()], ['1'])],
      [stack([n(a), dot(), X()], [String(q), dot(), '1'])],
      [stack(topOver(), [String(q)])],
    ]
    : [
      [stack(topOver(), [String(q)])],
      [stack([n(a), dot(), X()], [String(q)])],
      [stack([n(a)], [String(q)]), dot(), stack([X()], ['1'])],
      [stack([n(a)], [String(q)]), dot(), stack([X()], ['1'], 'fa-drop')],
      [stack([n(a)], [String(q)]), X()],
    ];
  return frames.map((kids, i) => html('span', `fa-frame${i === frames.length - 1 ? ' is-last' : ''}`, kids, { 'aria-hidden': 'true', style: `--fa-i:${i}` }));
}

// The term's ink (its stack and x, after any minus) laid in one cell with the frames over it; `side` says which way the cell grows
export function animatedTerm(realKids, t, side) {
  const real = html('span', 'fa-real', realKids);
  const from = t.form === 'over' ? 'times' : 'over';                  // (the row shows the new form; the frames start from the old one)
  return html('span', `fa-grid is-${side === 'left' ? 'left' : 'right'}`, [real, ...rewriteFrames(from, Math.abs(t.coef), t.den)], { style: `--fa-t:${FRAME_S}s` });
}
