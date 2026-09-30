// Pure geometry for the Group It Mat (SPEC-LASSO.md §2). No DOM, so it can be tested.
//
// The drawing is two columns in a 860 × 330 viewBox:
//   left  — the problem, what it means in words, and the student's final line;
//   right — the stack of groups (or the fraction bar), the − marks, and the count.
// Stacking everything in one column like the paper notes would shrink the
// groups below 44px on a Chromebook window.

export const LASSO_VIEW = { width: 860, height: 340 }; // the width grows for − groups (see wholeColumns)
export const STACK_X = 470;         // center of the groups / the fraction bar
export const COUNTER_PITCH = 30;    // counters inside a group
export const LASSO_PAD_X = 22;      // room between the end counters and the oval
export const LASSO_HEIGHT = 50;
export const LASSO_GAP = 8;
export const PART_HEIGHT = 48;      // one group of the fraction bar; they touch

// Counters sit 30 apart, closing up a little for 6 to 8 in a group.
export const counterPitch = (n) => (n <= 5 ? COUNTER_PITCH : Math.max(22, Math.floor(150 / n)));

// Oval width for a row of `count` counters (never narrower than 3).
export const lassoWidth = (count, pitch = COUNTER_PITCH) => Math.max(3, count) * pitch + 2 * LASSO_PAD_X;

// A group's width is set by what it should hold, so it doesn't change while filling.
export const groupWidth = (expected) => lassoWidth(expected, counterPitch(expected));

// If a student overfills a group, its counters squeeze to fit instead of growing.
export const rowPitch = (count, width, base) => Math.min(base, (width - 2 * LASSO_PAD_X) / Math.max(1, count));

export const CHAIN_WIDTH = 110;     // the arrow and count after the groups: → −20
export const MARK_X = 342;          // the − beside a group (− groups only)
export const ORIG_LEFT = 366;       // left edge of the original groups (− groups only)
export const FLIP_ARROW = 48;       // the arrow from a group to its redrawn opposite

// Where things go across the Mat, for groups of width `w`. + groups keep the
// centered stack. − groups draw the original on the left and, after a flip,
// the redrawn opposite (no −) to its right, then the count:
//   −  (original) → (redrawn) → count
export function wholeColumns(w, opposite) {
  if (!opposite) {
    return { origX: STACK_X, chainX: STACK_X + w / 2 + 18, width: LASSO_VIEW.width };
  }
  const origRight = ORIG_LEFT + w;
  const arrow = [origRight + 10, origRight + 10 + FLIP_ARROW];
  const redrawLeft = arrow[1] + 12;
  const chainX = redrawLeft + w + 16;
  return {
    origX: ORIG_LEFT + w / 2, markX: MARK_X, arrow, redrawX: redrawLeft + w / 2, chainX,
    width: Math.max(LASSO_VIEW.width, chainX + CHAIN_WIDTH + 10),
  };
}

// The same for the fraction bar (width `w`): the bar, its "take" bracket, then
// (− bars) an arrow to the parts taken, redrawn as opposites, and the count.
export function fractionColumns(w, opposite) {
  if (!opposite) {
    const left = STACK_X - w / 2;
    return { left, bx: left + w + 14, width: LASSO_VIEW.width };
  }
  const bx = ORIG_LEFT + w + 14;
  const arrow = [bx + 8, bx + 8 + 58];
  const redrawLeft = arrow[1] + 12;
  const chainX = redrawLeft + w + 16;
  return {
    left: ORIG_LEFT, bx, markX: MARK_X, arrow, redrawLeft, chainX,
    width: Math.max(LASSO_VIEW.width, chainX + CHAIN_WIDTH + 10),
  };
}

// Centers of `count` items of `height` with `gap`, centered between top and bottom.
export function stackCenters(count, { top = 0, bottom = LASSO_VIEW.height, height = LASSO_HEIGHT, gap = LASSO_GAP } = {}) {
  const total = count * height + Math.max(0, count - 1) * gap;
  const start = top + (bottom - top - total) / 2 + height / 2;
  return Array.from({ length: count }, (_, i) => start + i * (height + gap));
}

// x positions for `n` counters in a row centered on cx.
export const rowXs = (n, cx, pitch = COUNTER_PITCH) =>
  Array.from({ length: n }, (_, i) => cx + (i - (n - 1) / 2) * pitch);

// Contiguous runs of taken parts, for the "take" bracket: [[first, last], ...].
export function takenRuns(taken) {
  const runs = [];
  taken.forEach((t, i) => {
    if (!t) return;
    const last = runs[runs.length - 1];
    if (last && last[1] === i - 1) last[1] = i;
    else runs.push([i, i]);
  });
  return runs;
}
