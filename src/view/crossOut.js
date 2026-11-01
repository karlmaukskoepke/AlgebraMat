// The cancel mark of the addition property. A cancelling term, sign and all (`+8`, `−3x`), is wrapped in one element with one straight
// stroke from the lower left to the upper right, in the red of every cancel. It draws itself from the lower left once, when its row first
// appears (Build S: never again on a redraw), and is drawn still under reduced motion. The term's ink fades as before.
//
// Build W (2026-10-26) made it a 45° stroke, 6 px heavy. Build AB, Part 1 (Karl, 2026-11-01: "too big and thick and sometimes hides the
// numbers; on a negative number it lands between the minus and the digit and above the number"): the stroke is shallower (30°, and
// shallower still, down to 25°, on a wide term so it rises no more than about 15% above the term's height), its midpoint sits on the
// centre of the term's ink box (sign included), it is half as heavy (0.075em, 3 px at the largest 40 px text), overshoots each end by only
// 0.05em, and it is drawn behind the glyphs.
//
// How it is drawn (style.css, "Build AB, Part 1"): the wrapper holds a mark element (`.lx-xo-mark`, no text, hidden from screen readers),
// as wide as the term plus the overshoot, sitting on the vertical middle of the digits' ink. It is a size container, so its ::before can
// take a height worked out from its own width: clamp(width × tan 25°, the term's height × 1.15, width × tan 30°). A linear gradient
// `to bottom right` draws a stripe from that box's lower-left corner to its upper-right corner (the gradient's 50% line always runs
// corner to corner), so the stroke's angle is atan(height ÷ width) and its weight is the stripe's. The wrapper isolates its layers and
// the mark sits underneath, so the digits are painted over the stroke. `crossGeometry` is the same rule in numbers, for the tests and for
// anyone measuring it.

import { html } from './addBothMat.js';

export const OVERSHOOT_EM = 0.05;       // how far the stroke runs past the term's ink at each end
export const WEIGHT_EM = 0.075;         // the stroke's weight (3 px at 40 px), never below MIN_WEIGHT_PX
export const MIN_WEIGHT_PX = 2;
export const ANGLE_DEG = 30;            // the angle it takes when the term is narrow enough
export const MIN_ANGLE_DEG = 25;        // the shallowest it gets on a wide term
export const RISE_MAX = 1.15;           // the stroke's rise is at most the term's ink height times this (while the angle allows)
export const INK_EM = 0.75;             // the digits' ink height in the hand font, as the styles assume it (measured: 0.75em)

// `els`: the term's elements (its sign, then its number or x-term). `cls`: more classes on the wrapper. A term that starts with its own
// sign element (`+`, `−`) is marked `has-sign`: the sign's outer margin moves to the wrapper, so the wrapper's box is the term's ink.
export function crossOut(els, cls = '') {
  const signed = els[0]?.classList?.contains('lb-plus');
  const mark = html('span', 'lx-xo-mark', []);
  mark.setAttribute('aria-hidden', 'true');
  return html('span', `lx-xo${signed ? ' has-sign' : ''}${cls ? ` ${cls}` : ''}`, [...els, mark]);
}

const RAD = Math.PI / 180;

// The stroke for a term whose ink is `width` px wide and `height` px tall at a font size of `fontPx`: its two ends (the term's ink box from
// 0,0 at the top left), its midpoint, its angle above the horizontal, its rise, its length, the overshoot at each end and its weight.
export function crossGeometry(width, height, fontPx) {
  const run = width + 2 * OVERSHOOT_EM * fontPx;
  const fit = Math.atan((RISE_MAX * height) / run) / RAD;
  const angle = Math.min(ANGLE_DEG, Math.max(MIN_ANGLE_DEG, fit));
  const rise = run * Math.tan(angle * RAD);
  const cx = width / 2;
  const cy = height / 2;
  const x1 = cx - run / 2;
  const y1 = cy + rise / 2;
  const x2 = cx + run / 2;
  const y2 = cy - rise / 2;
  return { x1, y1, x2, y2, mid: { x: (x1 + x2) / 2, y: (y1 + y2) / 2 }, angle, rise, length: Math.hypot(run, rise), overshoot: OVERSHOOT_EM * fontPx, weight: Math.max(MIN_WEIGHT_PX, WEIGHT_EM * fontPx) };
}
