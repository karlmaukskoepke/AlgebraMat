// Build AD (Karl, 2026-11-03): the check never carries a fraction that could be simpler (Part 1).
import { describe, it, expect } from 'vitest';
import { fractionLines } from '../src/engine/fractionCheck.js';
import { lineText } from '../src/engine/solveTerms.js';
import { nextMove } from '../src/engine/solveit/honest.js';
import { packById } from '../src/packs/index.js';
import * as cards from '../src/play/solveCards.js';

const x = (c = 1) => ({ kind: 'x', coef: c });
const n = (v) => ({ kind: 'num', v });
const lines = (b, v) => fractionLines(b, v).lines.map(lineText);

describe('Part 1: the simplifier', () => {
  it('a fraction equal to a whole number becomes that number on the next line (negatives, zero)', () => {
    expect(lines({ left: [x(3), n(7)], right: [x(6), n(15)] }, { n: -8, d: 3 }))
      .toEqual(['3(−8/3) + 7 = 6(−8/3) + 15', '−24/3 + 7 = −48/3 + 15', '−8 + 7 = −16 + 15', '−1 = −1']);
    expect(lines({ left: [x(3), n(7)], right: [x(6), n(14)] }, { n: -7, d: 3 }))
      .toEqual(['3(−7/3) + 7 = 6(−7/3) + 14', '−21/3 + 7 = −42/3 + 14', '−7 + 7 = −14 + 14', '0 = 0']);
    expect(lines({ left: [x(4)], right: [n(0)] }, { n: 0, d: 1 })).toEqual(['4(0) = 0', '0 = 0']);
  });
  it('a fraction not in lowest terms goes to lowest terms; a sum keeps its common bottom, then adds', () => {
    expect(lines({ left: [x(9), n(2)], right: [x(3), n(9)] }, { n: 7, d: 6 }))
      .toEqual(['9(7/6) + 2 = 3(7/6) + 9', '63/6 + 2 = 21/6 + 9', '21/2 + 2 = 7/2 + 9', '21/2 + 4/2 = 7/2 + 18/2', '25/2 = 25/2']);
  });
  it('a fraction already simplest stays, proper or improper, never a mixed number or a decimal', () => {
    expect(lines({ left: [x(3), n(4)], right: [x(1), n(9)] }, { n: 5, d: 2 }))
      .toEqual(['3(5/2) + 4 = 5/2 + 9', '15/2 + 4 = 5/2 + 9', '15/2 + 8/2 = 5/2 + 18/2', '23/2 = 23/2']);
    expect(lines({ left: [x(2), n(-5)], right: [n(42)] }, { n: 47, d: 2 })).toEqual(['2(47/2) − 5 = 42', '94/2 − 5 = 42', '47 − 5 = 42', '42 = 42']);
  });
  it('inside a product or parentheses too', () => {
    expect(lines({ left: [{ kind: 'group', factor: 2, inner: [x(), n(1)] }], right: [n(3)] }, { n: 1, d: 2 }))
      .toEqual(['2(1/2 + 1) = 3', '2(1/2 + 2/2) = 3', '2(3/2) = 3', '6/2 = 3', '3 = 3']);
    expect(lines({ left: [x(-1)], right: [{ kind: 'neg', inner: [{ kind: 'ratio', n: 15, d: 6 }] }] }, { n: -5, d: 2 }))
      .toEqual(['−(−5/2) = −(15/6)', '−(−5/2) = −(5/2)', '5/2 = −5/2']);
  });
  it('a wrong value (Not balanced) follows the same rule on both sides; the two sides are written over one bottom to compare', () => {
    const r = fractionLines({ left: [x(-1)], right: [{ kind: 'ratio', n: 15, d: 6 }] }, { n: -2, d: 1 });
    expect(r.lines.map(lineText)).toEqual(['−(−2) = 15/6', '−(−2) = 5/2', '2 = 5/2', '4/2 = 5/2']);
    expect(r.ok).toBe(false);
    expect(lines({ left: [x(5)], right: [n(7)] }, { n: 3, d: 2 })).toEqual(['5(3/2) = 7', '15/2 = 7', '15/2 = 14/2']);
  });
});

// Every card that substitutes a value, 200 seeds a level: no line carries a fraction the next line could write more simply, no decimals
const CARDS = {
  'add-both': cards.addBothPlay, 'divide-it': cards.divideMovesPlay, 'flip-everything': cards.flipPlay, 'fractions-of-x': cards.fractionsPlay,
  'two-step-equations': cards.twoStepPlay, 'distribute-solve': cards.distSolvePlay, 'variables-both-sides': cards.bothSidesPlay,
  'distribute-more': cards.distMorePlay, 'strange-solutions': cards.strangePlay,
};
const gcd = (a, b) => { let p = Math.abs(a); let q = Math.abs(b); while (q) [p, q] = [q, p % q]; return p; };
const keys = (v) => [...String(Math.abs(v))].map((d) => ({ type: 'digit', digit: Number(d) })).concat(v < 0 ? [{ type: 'toggleSign' }] : []);
const fracsOf = (line) => {
  const t = line.segs.map((s) => (s.stack ? `${s.stack.top.map((u) => u.text).join('')}/${s.stack.bot}` : s.text)).join('').replace(/−/g, '-');
  return [...t.matchAll(/(-?\d+)\/(\d+)/g)].map((m) => ({ n: Number(m[1]), d: Number(m[2]), text: m[0] }));
};
function checkOf(ad, p, level, v) {
  let s = ad.newSession({ ...p, logLevel: level }, { flags: { trade: true, flip: true, divneg: true, model: true, rewrite: true } });
  for (let g = 0; g < 12; g++) { const m = nextMove(s, { grab: ad.grab !== false }); if (!m) break; for (const a of [...m, { type: 'foldNext' }]) s = ad.reduce(s, a); }
  const typed = typeof v === 'object' ? [...keys(v.n), ...(v.d > 1 ? [{ type: 'typeChar', ch: '/' }, ...keys(v.d)] : [])] : keys(v);
  for (const a of [{ type: 'focus', target: 'answer' }, ...typed, { type: 'check' }]) s = ad.reduce(s, a);
  return s.sub?.lines ?? null;
}
describe('Part 1: every check, 200 seeds a level', () => {
  for (const [id, ad] of Object.entries(CARDS)) {
    const pack = packById(id);
    for (let level = pack.firstLevel ?? 1; level <= (pack.lastLevel ?? pack.levels); level++) {
      it(`${id} Level ${level}`, () => {
        const bad = [];
        let checks = 0;
        for (let seed = 1; seed <= 200; seed++) {
          const p = pack.generate(level, seed)[0];
          const values = p.ans ? [p.ans, { n: p.ans.n + p.ans.d, d: p.ans.d }] : [p.x, p.x + 1, p.x - 2];
          for (const v of values) {
            const L = checkOf(ad, p, level, v);
            if (!L) continue;
            checks += 1;
            L.forEach((line, i) => {
              const t = lineText(line);
              if (/\d\.\d/.test(t)) bad.push(`a decimal: ${t}`);
              if (i === L.length - 1) return;
              const next = fracsOf(L[i + 1]).map((f) => f.text);
              for (const f of fracsOf(line)) if (gcd(f.n, f.d) > 1 && next.includes(f.text)) bad.push(`${f.text} carried: ${L.map(lineText).join(' | ')}`);
            });
          }
        }
        expect(checks).toBeGreaterThan(0);
        expect(bad.slice(0, 5)).toEqual([]);
      }, 60000);
    }
  }
});
