import { describe, it, expect } from 'vitest';
import { counterPositions, COUNTER_PITCH as P } from '../src/view/layout.js';

describe('counterPositions', () => {
  it('centers a single row on the anchor', () => {
    expect(counterPositions(1)).toEqual([{ x: 0, y: -0 }]);
    expect(counterPositions(2).map((p) => p.x)).toEqual([-P / 2, P / 2]);
  });

  it('puts 5 per row and stacks extra rows upward', () => {
    const ps = counterPositions(12);
    expect(ps).toHaveLength(12);
    expect(ps.slice(0, 5).every((p) => p.y === 0)).toBe(true);
    expect(ps.slice(5, 10).every((p) => p.y === -P)).toBe(true);
    expect(ps.slice(10).map((p) => p.y)).toEqual([-2 * P, -2 * P]);
    // the short top row is centered too
    expect(ps.slice(10).map((p) => p.x)).toEqual([-P / 2, P / 2]);
  });

  it('keeps counters a full touch target apart', () => {
    const ps = counterPositions(7);
    for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
      const d = Math.hypot(ps[i].x - ps[j].x, ps[i].y - ps[j].y);
      expect(d).toBeGreaterThanOrEqual(44);
    }
  });

  it('rejects counts outside 0–12', () => {
    expect(() => counterPositions(13)).toThrow();
    expect(() => counterPositions(-1)).toThrow();
    expect(counterPositions(0)).toEqual([]);
  });
});
