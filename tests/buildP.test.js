// Build P: nudges for mechanical steps, calculate a product, cross-off, moving between blanks, Distribute polish, full checks, one drop
// per x, and Build O's follow-ups. Each describe names its Part.
import { describe, it, expect } from 'vitest';
import { makeDistSolve } from '../src/engine/distSolve.js';
import { newDistSolve, DIST_SPOT, DIST_LAYER } from '../src/engine/cards/distribute.js';
import { startLights } from '../src/engine/addBothLights.js';
import { withSpotlight } from '../src/engine/spotlight.js';
import { lineText } from '../src/engine/solveTerms.js';

const layer = withSpotlight(DIST_LAYER, DIST_SPOT);
const P = (o) => makeDistSolve({ level: 1, ...o });
const start = (p, opts = {}) => startLights(newDistSolve({ ...p, logLevel: p.level }, { level: p.level, ...opts }));
const digits = (n) => [...String(Math.abs(n))].map((d) => ({ type: 'digit', digit: Number(d) })).concat(n < 0 ? [{ type: 'toggleSign' }] : []);
const run = (s, actions) => actions.reduce((st, a) => layer(st, a), s);
const typeValue = (v) => [{ type: 'focus', target: 'answer' }, ...digits(v), { type: 'check' }];

describe('Part 7: the check shows every step, on every level', () => {
  it('Distribute at Level 4: the value is dropped, then the group is worked out a line a press, ending Balanced', () => {
    const p = P({ level: 4, n: 5, f: -2, c: 2, x: 4 });                 // 5 − 2(x + 2) = −7
    let s = run(start(p), typeValue(4));
    expect(s.sub.placing).toBe(true);
    s = run(s, [{ type: 'placeValue' }]);
    expect(s.sub.step).toBe(1);
    const texts = s.sub.lines.map(lineText);
    expect(texts.length).toBeGreaterThanOrEqual(4);                         // 5 − 2(4 + 2), 5 − 2(6), 5 − 12, −7 = −7
    for (let k = 0; k < texts.length; k++) s = run(s, [{ type: 'nextLine' }]);
    expect(s.stage).toBe('done');
  });
  it('the worked example 3(x + 2) = 15 shows 3(3 + 2) = 15, 3(5) = 15, 15 = 15 at every level', () => {
    for (const level of [1, 3, 5]) {
      const s = run(start({ ...P({ f: 3, c: 2, x: 3 }), level }), typeValue(3));
      expect(s.sub.lines.map(lineText)).toEqual(['3(3 + 2) = 15', '3(5) = 15', '15 = 15']);
    }
  });
});

describe('Part 8: several x\'s take one drop each', () => {
  const p = P({ level: 5, f: 3, c: 2, bx: 2, x: 7 });
  it('a drop fills the x it lands on only; the check begins when every x has the value', () => {
    let s = start(p);
    s = run(s, typeValue(s.problem.x));
    expect(s.sub.xs).toBe(2);
    s = run(s, [{ type: 'placeValue', index: 1 }]);
    expect(s.sub).toMatchObject({ placing: true, filled: [1], step: 0 });
    s = run(s, [{ type: 'placeValue', index: 1 }]);                          // the same x again: nothing more
    expect(s.sub).toMatchObject({ placing: true, filled: [1] });
    s = run(s, [{ type: 'placeValue', index: 0 }]);
    expect(s.sub).toMatchObject({ placing: false, step: 1 });
  });
});
