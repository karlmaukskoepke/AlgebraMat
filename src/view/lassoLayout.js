// Pure geometry for the Lasso Mat (SPEC-LASSO.md §2). No DOM, so it can be tested.
//
// The drawing is two columns in a 860 × 330 viewBox:
//   left  — the problem, what it means in words, the whole group (fractions),
//           and the student's final line;
//   right — the lasso stack (or the split parts) and the arrow chain.
// Stacking everything in one column like the paper notes would shrink the
// lassos below 44px on a Chromebook window.

export const LASSO_VIEW = { width: 860, height: 330 };
export const LEFT_X = 150;          // center of the left column
export const STACK_X = 470;         // center of the lasso / parts stack
export const COUNTER_PITCH = 30;    // counters inside a lasso
export const LASSO_PAD_X = 22;      // room between the end counters and the oval
export const LASSO_HEIGHT = 50;
export const LASSO_GAP = 8;
export const PART_HEIGHT = 44;
export const PART_GAP = 10;
export const WHOLE_PER_ROW = 6;     // the whole group wraps after 6 counters

// Oval width for a row of `count` counters (never narrower than 3).
export const lassoWidth = (count) => Math.max(3, count) * COUNTER_PITCH + 2 * LASSO_PAD_X;

// Centers of `count` items of `height` with `gap`, centered between top and bottom.
export function stackCenters(count, { top = 0, bottom = LASSO_VIEW.height, height = LASSO_HEIGHT, gap = LASSO_GAP } = {}) {
  const total = count * height + Math.max(0, count - 1) * gap;
  const start = top + (bottom - top - total) / 2 + height / 2;
  return Array.from({ length: count }, (_, i) => start + i * (height + gap));
}

// x positions for `n` counters in a row centered on cx.
export const rowXs = (n, cx, pitch = COUNTER_PITCH) =>
  Array.from({ length: n }, (_, i) => cx + (i - (n - 1) / 2) * pitch);

// Row sizes for the whole group: at most 6 per row, as even as possible.
export function wholeRows(n, perRow = WHOLE_PER_ROW) {
  if (n <= 0) return [];
  const rows = Math.ceil(n / perRow);
  const base = Math.floor(n / rows);
  return Array.from({ length: rows }, (_, r) => base + (r < n % rows ? 1 : 0));
}

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
