import { describe, it, expect } from 'vitest';
import {
  LASSO_VIEW, lassoWidth, stackCenters, rowXs, wholeRows, takenRuns,
  LASSO_HEIGHT, LASSO_GAP, PART_HEIGHT, PART_GAP, STACK_X,
} from '../src/view/lassoLayout.js';
import { CHAIN_WIDTH } from '../src/view/lassoMat.js';
import { MAX_GROUPS, MAX_SINGLE_GROUP, MAX_DEAL, MAX_DENOMINATOR } from '../src/engine/generateLasso.js';

describe('lasso layout', () => {
  it('fits the largest stack of lassos in the drawing', () => {
    const ys = stackCenters(MAX_GROUPS);
    expect(ys[0] - LASSO_HEIGHT / 2).toBeGreaterThanOrEqual(0);
    expect(ys[ys.length - 1] + LASSO_HEIGHT / 2).toBeLessThanOrEqual(LASSO_VIEW.height);
    for (let i = 1; i < ys.length; i++) expect(ys[i] - ys[i - 1]).toBe(LASSO_HEIGHT + LASSO_GAP);
  });

  it('fits the most parts (sixths) in the drawing', () => {
    const ys = stackCenters(MAX_DENOMINATOR, { height: PART_HEIGHT, gap: PART_GAP });
    expect(ys[0] - PART_HEIGHT / 2).toBeGreaterThanOrEqual(0);
    expect(ys[ys.length - 1] + PART_HEIGHT / 2).toBeLessThanOrEqual(LASSO_VIEW.height);
  });

  it('keeps the widest lasso clear of the left column and the edge', () => {
    const w = lassoWidth(MAX_SINGLE_GROUP);
    expect(STACK_X - w / 2).toBeGreaterThan(300);                    // left column ends near 300
    expect(STACK_X + w / 2 + 18 + CHAIN_WIDTH).toBeLessThanOrEqual(LASSO_VIEW.width); // "→ −20  opp. → 20"
  });

  it('centers a row of counters', () => {
    expect(rowXs(1, 100)).toEqual([100]);
    expect(rowXs(2, 100)).toEqual([85, 115]);
    expect(rowXs(3, 100)).toEqual([70, 100, 130]);
  });

  it('wraps the whole group into even rows of at most 6', () => {
    expect(wholeRows(0)).toEqual([]);
    expect(wholeRows(6)).toEqual([6]);
    expect(wholeRows(7)).toEqual([4, 3]);
    expect(wholeRows(MAX_DEAL)).toEqual([6, 6]);
    expect(wholeRows(10)).toEqual([5, 5]);
  });

  it('keeps the fraction chain on the drawing with the widest parts (halves of 12)', () => {
    const bx = STACK_X + lassoWidth(6) / 2 + 14;
    expect(bx + 76 + CHAIN_WIDTH).toBeLessThanOrEqual(LASSO_VIEW.width);
  });

  it('finds runs of taken parts for the bracket', () => {
    expect(takenRuns([true, true, false])).toEqual([[0, 1]]);
    expect(takenRuns([false, true, false, true, true])).toEqual([[1, 1], [3, 4]]);
    expect(takenRuns([false, false])).toEqual([]);
  });
});
