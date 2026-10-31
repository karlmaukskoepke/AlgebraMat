// The cancel mark of the addition property (Build W, Part 3; Karl, 2026-10-26: "the cancel mark often looks like an underline, and the
// slash is not diagonal enough"). A cancelling term, sign and all (`+8`, `−3x`), is wrapped in one element; its mark is a single straight
// stroke from the lower left to the upper right at 45°, long enough to cross every glyph of the term with a small overshoot, in the red of
// every cancel, heavier than the old 4 px line. It draws itself from the lower left once, when its row first appears (Build S: never
// again on a redraw), and is drawn still under reduced motion. The term's ink fades as before; the stroke stays at full strength.
//
// How it is drawn (style.css, "Build W, Part 3"): the wrapper's ::after is a square, centred on the term, a little wider than the term
// (OVERSHOOT_EM on each side together); a linear gradient `to bottom right` draws a stripe along the square's other diagonal, which in a
// square runs at exactly 45°. `crossGeometry` is the same rule in numbers, for the tests and for anyone measuring it.

import { html } from './addBothMat.js';

export const OVERSHOOT_EM = 0.2;        // the square is the term's width plus this (half on each side)
export const WEIGHT_EM = 0.16;          // the stroke's weight, never below MIN_WEIGHT_PX (the old line was 4 px)
export const MIN_WEIGHT_PX = 6;
export const ANGLE_DEG = 45;

// `els`: the term's elements (its sign, then its number or x-term). `cls`: more classes on the wrapper.
export const crossOut = (els, cls = '') => html('span', `lx-xo${cls ? ` ${cls}` : ''}`, els);

// The stroke for a term `width` px wide and `height` px tall at a font size of `fontPx`: its two ends (the term's box from 0,0 at the top
// left), its angle above the horizontal, its length and weight.
export function crossGeometry(width, height, fontPx) {
  const side = width + OVERSHOOT_EM * fontPx;
  const cx = width / 2;
  const cy = height / 2;
  const x1 = cx - side / 2;
  const y1 = cy + side / 2;
  const x2 = cx + side / 2;
  const y2 = cy - side / 2;
  const angle = (Math.atan2(y1 - y2, x2 - x1) * 180) / Math.PI;
  return { x1, y1, x2, y2, angle, length: Math.hypot(x2 - x1, y1 - y2), weight: Math.max(MIN_WEIGHT_PX, WEIGHT_EM * fontPx) };
}
