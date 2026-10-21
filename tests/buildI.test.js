import { describe, it, expect } from 'vitest';
import { equationSegs, substitutionLines } from '../src/engine/solveTerms.js';

const text = (segs) => segs.map((s) => s.text).join('');
const blues = (segs) => segs.filter((s) => s.cls.split(' ').includes('is-blue'));

describe('Build I, Part 1: the check writes the equation itself, then the value under each x', () => {
  it('line 1 is the equation as written, with every x blue and numbered left to right', () => {
    const cases = [
      [{ left: [{ kind: 'x' }, { kind: 'num', v: 8 }], right: [{ kind: 'num', v: -4 }] }, 'x + 8 = −4'],
      [{ left: [{ kind: 'x', coef: 5 }], right: [{ kind: 'num', v: -15 }] }, '5x = −15'],
      [{ left: [{ kind: 'num', v: 12 }], right: [{ kind: 'x', coef: -1 }] }, '12 = −x'],
      [{ left: [{ kind: 'num', v: 7 }], right: [{ kind: 'x' }, { kind: 'num', v: 3 }] }, '7 = x + 3'],
      [{ left: [{ kind: 'x' }, { kind: 'num', v: 3 }], right: [{ kind: 'x', coef: 2 }, { kind: 'num', v: -1 }] }, 'x + 3 = 2x − 1'],
    ];
    for (const [board, written] of cases) {
      const segs = equationSegs(board);
      expect(text(segs)).toBe(written);
      expect(blues(segs).map((s) => s.text).every((t) => t === 'x')).toBe(true);
      expect(blues(segs).map((s) => s.xi)).toEqual([...Array(blues(segs).length).keys()]);
    }
  });
  it('line 2 has one blue value for each blue x of line 1, in the same order (so each can sit under its x)', () => {
    const board = { left: [{ kind: 'x' }, { kind: 'num', v: 3 }], right: [{ kind: 'x', coef: 2 }, { kind: 'num', v: -1 }] };
    for (const v of [4, -4]) {
      const line2 = substitutionLines(board, v).lines[0].segs;
      expect(blues(line2)).toHaveLength(blues(equationSegs(board)).length);
    }
    expect(text(substitutionLines({ left: [{ kind: 'x', coef: 3 }], right: [{ kind: 'num', v: -12 }] }, -4).lines[0].segs)).toBe('3 × (−4) = −12');
  });
});
