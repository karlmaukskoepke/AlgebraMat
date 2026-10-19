import { describe, it, expect } from 'vitest';
import { generateAddBothLevel, worstCaseRows as addRows, slipCollisions as addCollisions, allowedAnswer } from '../src/engine/generateAddBoth.js';
import { generateDivideLevel, worstCaseRows as divRows, slipCollisions as divCollisions } from '../src/engine/generateDivide.js';

// Build F, Part 1: no banned answer (0, 1 or −1) on either card, at any level, over 200 seeds; and the generators' two reports.
const SEEDS = 200;
describe('Build F: banned answers', () => {
  for (let level = 2; level <= 6; level++) {
    it(`Add Level ${level}: no answer of 0, 1 or −1 in ${SEEDS} seeds, and still five different answers a set`, () => {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const set = generateAddBothLevel(level, seed);
        for (const p of set) expect(allowedAnswer(p.x), `L${level} seed ${seed}: x = ${p.x}`).toBe(true);
        expect(new Set(set.map((p) => p.x)).size).toBe(set.length);
      }
    });
  }
  for (let level = 1; level <= 5; level++) {
    it(`Divide generator level ${level}: no answer of 0, 1 or −1 in ${SEEDS} seeds`, () => {
      for (let seed = 1; seed <= SEEDS; seed++) for (const p of generateDivideLevel(level, seed)) expect(Math.abs(p.x)).toBeGreaterThanOrEqual(2);
    });
  }
});

describe('Build F: the generators report their worst-case rows and their slip collisions', () => {
  it('worst-case rows fit the reserved stack (at most 9 rows) on both cards', () => {
    for (let level = 2; level <= 6; level++) expect(addRows(level).total).toBeLessThanOrEqual(9);
    for (let level = 1; level <= 5; level++) expect(divRows(level).total).toBeLessThanOrEqual(9);
  });
  it('slip collisions are counted (the tag order decides them; the report says how often)', () => {
    const add = addCollisions(4);
    expect(add.problems).toBe(1000);
    expect(Object.keys(add.counts)).toContain('wrong-op = sizes-added');      // a Battle's added sizes are also b + c
    expect(divCollisions(2).problems).toBe(1000);
  });
});
