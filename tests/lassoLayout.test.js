import { describe, it, expect } from 'vitest';
import {
  LASSO_VIEW, lassoWidth, stackCenters, rowXs, takenRuns,
  LASSO_HEIGHT, LASSO_GAP, PART_HEIGHT, STACK_X,
} from '../src/view/lassoLayout.js';
import { CHAIN_WIDTH } from '../src/view/lassoMat.js';
import { MAX_GROUPS, MAX_SINGLE_GROUP, MAX_DENOMINATOR } from '../src/engine/generateLasso.js';
import { MAX_PARTS } from '../src/engine/lassoMoves.js';

describe('Group It layout', () => {
  it('fits the largest stack of groups in the drawing', () => {
    const ys = stackCenters(MAX_GROUPS);
    expect(ys[0] - LASSO_HEIGHT / 2).toBeGreaterThanOrEqual(0);
    expect(ys[ys.length - 1] + LASSO_HEIGHT / 2).toBeLessThanOrEqual(LASSO_VIEW.height);
    for (let i = 1; i < ys.length; i++) expect(ys[i] - ys[i - 1]).toBe(LASSO_HEIGHT + LASSO_GAP);
  });

  it('fits the tallest fraction bar (sixths, even one part too many) in the drawing', () => {
    expect(MAX_DENOMINATOR).toBeLessThan(MAX_PARTS);
    expect(MAX_PARTS * PART_HEIGHT).toBeLessThanOrEqual(LASSO_VIEW.height);
  });

  it('keeps the widest group and its − clear of the left column and the edge', () => {
    const w = lassoWidth(MAX_SINGLE_GROUP);
    expect(STACK_X - w / 2 - 24 - 12).toBeGreaterThan(280);         // the − mark; the left column's text ends before 280
    expect(STACK_X + w / 2 + 18 + CHAIN_WIDTH).toBeLessThanOrEqual(LASSO_VIEW.width); // "→ −20"
  });

  it('centers a row of counters', () => {
    expect(rowXs(1, 100)).toEqual([100]);
    expect(rowXs(2, 100)).toEqual([85, 115]);
    expect(rowXs(3, 100)).toEqual([70, 100, 130]);
  });

  it('keeps the fraction count on the drawing with the widest bar (halves of 12)', () => {
    const bx = STACK_X + lassoWidth(6) / 2 + 14;
    expect(bx + 76 + CHAIN_WIDTH).toBeLessThanOrEqual(LASSO_VIEW.width);
  });

  it('finds runs of taken parts for the bracket', () => {
    expect(takenRuns([true, true, false])).toEqual([[0, 1]]);
    expect(takenRuns([false, true, false, true, true])).toEqual([[1, 1], [3, 4]]);
    expect(takenRuns([false, false])).toEqual([]);
  });
});
