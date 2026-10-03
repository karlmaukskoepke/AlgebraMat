import { describe, it, expect } from 'vitest';
import {
  LASSO_VIEW, lassoWidth, stackCenters, rowXs, takenRuns, counterPitch, groupWidth, rowPitch,
  wholeColumns, fractionColumns, LASSO_HEIGHT, LASSO_GAP, PART_HEIGHT, STACK_X, MARK_X, ORIG_LEFT, CHAIN_WIDTH,
} from '../src/view/lassoLayout.js';
import { MAX_GROUPS, MAX_SINGLE_GROUP, DENOMINATORS } from '../src/engine/generateLasso.js';
import { MAX_PARTS } from '../src/engine/lassoMoves.js';

describe('Group It layout', () => {
  it('fits the largest stack of groups in the drawing', () => {
    const ys = stackCenters(MAX_GROUPS);
    expect(ys[0] - LASSO_HEIGHT / 2).toBeGreaterThanOrEqual(0);
    expect(ys[ys.length - 1] + LASSO_HEIGHT / 2).toBeLessThanOrEqual(LASSO_VIEW.height);
    for (let i = 1; i < ys.length; i++) expect(ys[i] - ys[i - 1]).toBe(LASSO_HEIGHT + LASSO_GAP);
  });

  it('lets the bar have one part more than the most the problems use (eighths)', () => {
    expect(Math.max(...DENOMINATORS)).toBeLessThanOrEqual(MAX_PARTS);   // the Mat squeezes the parts to fit a tall bar
    expect(MAX_PARTS).toBe(8);
  });

  it('keeps the widest + group and the count clear of the edge, and the − clear of the left column', () => {
    const w = groupWidth(MAX_SINGLE_GROUP);
    expect(STACK_X + w / 2 + 18 + CHAIN_WIDTH).toBeLessThanOrEqual(LASSO_VIEW.width); // "→ −20"
    expect(MARK_X - 27).toBeGreaterThan(300 - 12);                   // the − and its tap ring start right of the left column
    expect(lassoWidth(3)).toBe(3 * 30 + 44);
  });

  it('centers a row of counters', () => {
    expect(rowXs(1, 100)).toEqual([100]);
    expect(rowXs(2, 100)).toEqual([85, 115]);
    expect(rowXs(3, 100)).toEqual([70, 100, 130]);
  });

  it('keeps the fraction count on the drawing with the widest bar (halves of 12)', () => {
    const w = groupWidth(6);
    const bx = STACK_X + w / 2 + 14;
    expect(bx + 76 + CHAIN_WIDTH).toBeLessThanOrEqual(LASSO_VIEW.width);
  });

  it('closes counters up a little for 6 to 8 in a group, so widths stay reasonable', () => {
    expect([1, 3, 5].map(counterPitch)).toEqual([30, 30, 30]);
    expect([6, 7, 8].map(counterPitch)).toEqual([25, 22, 22]);
    expect(groupWidth(8)).toBe(8 * 22 + 44);
    expect(groupWidth(2)).toBe(groupWidth(3)); // never narrower than 3
  });

  it('squeezes an overfilled group into its width instead of growing it', () => {
    const w = groupWidth(3);
    expect(rowPitch(3, w, 30)).toBe(30);
    expect(rowPitch(12, w, 30)).toBeCloseTo((w - 44) / 12);
  });

  it('draws − groups, their redrawn opposites and the count in a widened drawing', () => {
    const plain = wholeColumns(groupWidth(5), false);
    expect(plain).toMatchObject({ origX: STACK_X, width: LASSO_VIEW.width });
    for (const expected of [1, 3, 5, 8]) {
      const w = groupWidth(expected);
      const cols = wholeColumns(w, true);
      expect(cols.markX).toBe(MARK_X);
      expect(cols.origX - w / 2).toBe(ORIG_LEFT);
      expect(cols.arrow[0]).toBeGreaterThan(cols.origX + w / 2);          // the arrow starts after the original
      expect(cols.redrawX - w / 2).toBeGreaterThan(cols.arrow[1]);         // and ends before the redrawn group
      expect(cols.chainX).toBeGreaterThan(cols.redrawX + w / 2);
      expect(cols.chainX + CHAIN_WIDTH).toBeLessThanOrEqual(cols.width);   // the count fits
      expect(cols.width).toBeLessThan(1040);                              // scale stays big enough to tap
    }
  });

  it('draws a − fraction bar, its taken parts redrawn, and the count in a widened drawing', () => {
    for (const each of [2, 3, 4, 6]) {
      const w = groupWidth(each);
      const cols = fractionColumns(w, true);
      expect(cols.left + w).toBeLessThan(cols.bx);
      expect(cols.arrow[0]).toBeGreaterThan(cols.bx);
      expect(cols.redrawLeft).toBeGreaterThan(cols.arrow[1]);
      expect(cols.chainX + CHAIN_WIDTH).toBeLessThanOrEqual(cols.width);
      expect(cols.width).toBeLessThan(1060);
    }
    expect(fractionColumns(groupWidth(6), false).width).toBe(LASSO_VIEW.width);
  });

  it('finds runs of taken parts for the bracket', () => {
    expect(takenRuns([true, true, false])).toEqual([[0, 1]]);
    expect(takenRuns([false, true, false, true, true])).toEqual([[1, 1], [3, 4]]);
    expect(takenRuns([false, false])).toEqual([]);
  });
});
