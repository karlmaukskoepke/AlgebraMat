// Build V2, Parts 3 and 4: "Try a number" and the balance. The balance's tilt and its words agree with a direct computation (exact
// fractions) on 200 seeds, and a no-solution problem's "heavier by" never changes from one try to the next.
import { describe, it, expect } from 'vitest';
import { generateStrangeLevel, makeStrange } from '../src/engine/generateStrange.js';
import { compareAt, balanceLine, patternLine, readTry, reduceTry, sideValue } from '../src/engine/strangeTry.js';
import { tiltFor, sideModel, MAX_TILT } from '../src/view/balance.js';
import { linear, formatBoth } from '../src/engine/bothSides.js';
import { strangePlay as SP } from '../src/play/solveCards.js';
import { honestPath } from '../src/engine/solveit/honest.js';

const SEEDS = 200;
const X = (c) => ({ k: 'x', c });
const N = (v) => ({ k: 'n', v });
const act = (s, a) => { const n = SP.reduce(s, a); return n && typeof n === 'object' ? n : s; };
const run = (s, as) => as.reduce(act, s);
const start = (p) => run(SP.newSession({ ...p, logLevel: p.level }, {}), [{ type: 'introNext' }, { type: 'spotDismiss' }]);
const keys = (t) => [...String(t)].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : ch === '-' ? { type: 'toggleSign' } : { type: 'typeChar', ch }));
// the sides worked out directly: a·x + b over a common bottom, compared by cross-multiplying
const direct = (p, v) => {
  const at = (side) => { const { a, b } = linear(side); return (a * v.n + b * v.d) / v.d; };
  return { left: at(p.left), right: at(p.right) };
};
const TRIES = [{ n: 3, d: 1 }, { n: -2, d: 1 }, { n: 0, d: 1 }, { n: 3, d: 2 }, { n: -7, d: 3 }, { n: 10, d: 1 }];

describe('the balance agrees with a direct computation', () => {
  it('200 seeds of Levels 4-5, six tries each: the heavier side, the amount, the tilt’s direction and the words', () => {
    for (const level of [4, 5]) for (let seed = 1; seed <= SEEDS; seed++) for (const p of generateStrangeLevel(level, seed)) {
      if (p.type === 'one') continue;
      const amounts = new Set();
      for (const v of TRIES) {
        const c = compareAt(p, v);
        const d = direct(p, v);
        const want = d.left > d.right ? 'left' : d.left < d.right ? 'right' : 'balanced';
        const where = `${formatBoth(p)}, x = ${v.n}/${v.d}`;
        if (c.heavier !== want) throw new Error(`heavier ${c.heavier}, want ${want}: ${where}`);
        expect(Math.abs(c.diff.n / c.diff.d - Math.abs(d.left - d.right))).toBeLessThan(1e-9);
        const tilt = tiltFor({ n: c.left.n * c.right.d - c.right.n * c.left.d, d: c.left.d * c.right.d });
        if (want === 'balanced') expect(tilt).toBe(0);
        else expect(Math.sign(tilt)).toBe(want === 'left' ? -1 : 1);             // (the heavier side goes down)
        expect(Math.abs(tilt)).toBeLessThanOrEqual(MAX_TILT);
        const line = balanceLine(v, c);
        expect(line.startsWith(`x = ${v.d === 1 ? (v.n < 0 ? `−${-v.n}` : v.n) : `${v.n < 0 ? '−' : ''}${Math.abs(v.n)}/${v.d}`}.`)).toBe(true);
        if (want === 'balanced') expect(line.endsWith(' Balanced.')).toBe(true);
        else expect(line).toContain(`${want === 'left' ? 'Left' : 'Right'} side is heavier by `);
        amounts.add(`${c.heavier}:${c.diff.n}/${c.diff.d}`);
      }
      // no solution: the same side heavier by the same amount on every try; infinitely many: balanced every time
      expect(amounts.size, formatBoth(p)).toBe(1);
      expect([...amounts][0].startsWith('balanced')).toBe(p.type === 'all');
    }
  }, 60000);
  it('the words: Karl’s lines, from exact values (fractions stay fractions)', () => {
    const p = makeStrange({ level: 4, left: [X(4), N(2)], right: [X(4), N(6)] });
    expect(balanceLine({ n: 3, d: 2 }, compareAt(p, { n: 3, d: 2 }))).toBe('x = 3/2. Right side is heavier by 4.');
    expect(patternLine('none', compareAt(p, { n: 3, d: 2 }))).toBe('Try another number: it is still heavier by 4.');
    const q = makeStrange({ level: 4, left: [X(2), N(9)], right: [X(2), N(1)] });
    expect(balanceLine({ n: 2, d: 1 }, compareAt(q, { n: 2, d: 1 }))).toBe('x = 2. Left side is heavier by 8.');
    const r = makeStrange({ level: 4, left: [X(3), N(3)], right: [X(3), N(3)] });
    expect(balanceLine({ n: 3, d: 1 }, compareAt(r, { n: 3, d: 1 }))).toBe('x = 3. Balanced.');
    expect(patternLine('all', compareAt(r, { n: 3, d: 1 }))).toBe('Try another number: it balances every time.');
    expect(sideValue([X(4), N(2)], { n: 3, d: 2 })).toEqual({ n: 8, d: 1 });
  });
  it('the tilt grows with the difference and stops at the cap', () => {
    expect(tiltFor({ n: 0, d: 1 })).toBe(0);
    expect(Math.abs(tiltFor({ n: 1, d: 1 }))).toBeLessThan(Math.abs(tiltFor({ n: 8, d: 1 })));
    expect(Math.abs(tiltFor({ n: 10, d: 1 }))).toBe(MAX_TILT);
    expect(Math.abs(tiltFor({ n: 500, d: 1 }))).toBe(MAX_TILT);
  });
  it('a side as Karl’s model: the x-groups as written and one net number', () => {
    expect(sideModel([N(5), X(1), X(1)])).toEqual({ groups: [1, 1], c: 5, constFirst: true });
    expect(sideModel([{ k: 'g', f: -2, a: 1, c: -3 }, N(4)])).toEqual({ groups: [-2], c: 10, constFirst: false });
  });
  it('a typed try: whole, fraction, decimal (read exactly), unreadable', () => {
    expect(readTry('3', '')).toEqual({ value: { n: 3, d: 1 } });
    expect(readTry('-6', '4')).toEqual({ value: { n: -3, d: 2 } });
    expect(readTry('1.5', '')).toEqual({ value: { n: 3, d: 2 } });
    expect(readTry('1.5', '2').key).toBe('tUnreadable');
  });
});

describe('Try a number on the card', () => {
  const solved = (p) => honestPath(SP.reduce, start(p)).at(-1);
  it('only after a right pick; the original equation is checked with the student’s number, a drop per x, every step; nothing recorded', () => {
    const p = makeStrange({ level: 4, left: [X(4), N(2)], right: [X(4), N(6)] });
    let s = solved(p);
    expect(s.stage).toBe('done');
    const before = { answers: s.answers, tags: s.tags, supports: s.supportsShown, wrongs: s.wrongs };
    s = run(s, [{ type: 'tryOpen' }, ...keys('3/2'), { type: 'check' }]);
    expect(s.trial.sub.target).toBe('original');
    expect(s.trial.sub.xs).toBe(2);
    expect(s.trial.sub.placing).toBe(true);
    s = run(s, [{ type: 'placeValue', index: 0 }, { type: 'placeValue', index: 1 }]);
    for (let k = 0; k < 10 && !s.trial.result; k++) s = act(s, { type: 'nextLine' });
    expect(s.trial.result.line).toBe('x = 3/2. Right side is heavier by 4.');
    expect(s.trial.result.after).toBe('Try another number: it is still heavier by 4.');
    expect(s.trial.result.work).toEqual({ left: '4(3/2) + 2 = 8', right: '4(3/2) + 6 = 12' });
    expect({ answers: s.answers, tags: s.tags, supports: s.supportsShown, wrongs: s.wrongs }).toEqual(before);
    expect(s.stage).toBe('done');
    // again, with another number: still heavier by 4
    s = run(s, [{ type: 'tryAgain' }, ...keys('-5'), { type: 'check' }, { type: 'placeValue', index: 0 }, { type: 'placeValue', index: 1 }]);
    for (let k = 0; k < 10 && !s.trial.result; k++) s = act(s, { type: 'nextLine' });
    expect(s.trial.result.line).toBe('x = −5. Right side is heavier by 4.');
    expect(s.trials).toHaveLength(2);
  });
  it('not before the problem is solved, and not on an ordinary problem', () => {
    const p = makeStrange({ level: 4, left: [X(4), N(2)], right: [X(4), N(6)] });
    expect(reduceTry(structuredClone(start(p)), { type: 'tryOpen' })).toBeUndefined();
    const q = makeStrange({ level: 4, left: [X(4), N(1)], right: [X(1), N(5)] });
    expect(reduceTry(structuredClone(solved(q)), { type: 'tryOpen' })).toBeUndefined();
  });
});
