import { describe, it, expect } from 'vitest';
import { counterPositions, readingPositions, rowSizes, COUNTER_PITCH as P } from '../src/view/layout.js';

describe('rowSizes', () => {
  it('keeps up to 4 in a single row', () => {
    expect(rowSizes(0)).toEqual([]);
    expect(rowSizes(1)).toEqual([1]);
    expect(rowSizes(4)).toEqual([4]);
  });

  it('makes a balanced grid, never more than 4 across, wider rows at the bottom', () => {
    expect(rowSizes(5)).toEqual([3, 2]);
    expect(rowSizes(6)).toEqual([3, 3]);
    expect(rowSizes(7)).toEqual([4, 3]);
    expect(rowSizes(8)).toEqual([4, 4]);
    expect(rowSizes(9)).toEqual([3, 3, 3]);
    expect(rowSizes(10)).toEqual([4, 3, 3]);
    expect(rowSizes(11)).toEqual([4, 4, 3]);
    expect(rowSizes(12)).toEqual([4, 4, 4]);
  });

  it('always accounts for every counter', () => {
    for (let n = 0; n <= 12; n++) {
      const rows = rowSizes(n);
      expect(rows.reduce((a, b) => a + b, 0)).toBe(n);
      expect(Math.max(0, ...rows)).toBeLessThanOrEqual(4);
      expect(Math.max(0, ...rows) - Math.min(Infinity, ...rows)).toBeLessThanOrEqual(1);
    }
  });
});

describe('counterPositions', () => {
  it('centers each row on the anchor and stacks rows upward', () => {
    expect(counterPositions(2)).toEqual([{ x: -P / 2, y: 0 }, { x: P / 2, y: 0 }]);
    const ps = counterPositions(7); // rows of 4 then 3
    expect(ps.slice(0, 4).map((p) => p.y)).toEqual([0, 0, 0, 0]);
    expect(ps.slice(4).map((p) => p.y)).toEqual([-P, -P, -P]);
    expect(ps.slice(4).map((p) => p.x)).toEqual([-P, 0, P]);
  });

  it('keeps counters a full touch target apart', () => {
    for (let n = 2; n <= 12; n++) {
      const ps = counterPositions(n);
      for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
        expect(Math.hypot(ps[i].x - ps[j].x, ps[i].y - ps[j].y)).toBeGreaterThanOrEqual(44);
      }
    }
  });

  it('rejects counts outside 0–12', () => {
    expect(() => counterPositions(13)).toThrow();
    expect(() => counterPositions(-1)).toThrow();
    expect(counterPositions(0)).toEqual([]);
  });
});

describe('readingPositions (while drawing)', () => {
  it('never moves a placed counter when another is added', () => {
    for (let n = 1; n < 12; n++) {
      expect(readingPositions(n + 1).slice(0, n)).toEqual(readingPositions(n));
    }
  });

  it('fills rows of 4 from the bottom', () => {
    const ps = readingPositions(6);
    expect(ps.slice(0, 4).map((p) => p.y)).toEqual([0, 0, 0, 0]);
    expect(ps.slice(4).map((p) => [p.x, p.y])).toEqual([[-1.5 * P, -P], [-0.5 * P, -P]]);
  });
});
