import { describe, it, expect, beforeEach } from 'vitest';
import {
  CHALLENGES, CARD_CHALLENGES, DURATION_MS, PAUSE_MS, tierOf, makeFluencyProblem, newFluency, reduceFluency, timeLeft, challengeById,
} from '../src/engine/fluency.js';
import { mulberry32 } from '../src/engine/generate.js';
import { periodStart, addRun, topRuns, bestScore, readRuns, PERIODS, RUN_CAP } from '../src/engine/highscores.js';
import { loadRuns, saveRun, FLUENCY_KEY } from '../src/fluencyStore.js';
import { typeInto } from '../src/engine/entry.js';

// Evaluate a problem's text independently: terms with + or −, or n/d(B) with an optional leading −.
const U = (s) => s.replace(/−/g, '-');
function evalText(text) {
  const t = U(text);
  const frac = /^(-?)(\d+)\/(\d+)\((-?\d+)\)$/.exec(t);
  if (frac) return (frac[1] ? -1 : 1) * Number(frac[2]) * Number(frac[4]) / Number(frac[3]);
  const mult = /^(-?\d+)\((-?\d+)\)$/.exec(t);
  if (mult) return Number(mult[1]) * Number(mult[2]);
  const parts = t.replace(/\(/g, '').replace(/\)/g, '').match(/-?\d+|[+-](?=\s)/g);
  let sum = Number(parts[0]);
  for (let i = 1; i < parts.length; i += 2) sum += (parts[i] === '-' ? -1 : 1) * Number(parts[i + 1]);
  return sum;
}
const rngOf = (seed) => mulberry32(seed);

describe('fluency tiers', () => {
  it('steps up every 5 correct, to a cap', () => {
    expect([0, 4, 5, 9, 10, 15, 20, 99].map((n) => tierOf('add', n))).toEqual([0, 0, 1, 1, 2, 3, 4, 4]);
    expect([0, 5, 10, 15, 16, 99].map((n) => tierOf('multiply-concept', n))).toEqual([0, 1, 2, 3, 3, 3]);
  });
  it('lists the six challenges, and which card each belongs on', () => {
    expect(CHALLENGES.map((c) => c.id)).toEqual(['add', 'subtract', 'addsub', 'multiply-concept', 'multiply-large', 'mixed']);
    for (const ids of Object.values(CARD_CHALLENGES)) for (const id of ids) expect(challengeById(id)).toBeTruthy();
  });
});

describe('fluency problems', () => {
  it('every problem\'s stated answer matches its text, for every challenge and tier', () => {
    for (const { id } of CHALLENGES) {
      for (const correct of [0, 5, 10, 15, 20, 30]) {
        for (let seed = 1; seed <= 150; seed++) {
          const p = makeFluencyProblem(id, correct, rngOf(seed));
          expect(Number.isInteger(p.answer), `${id} ${p.text}`).toBe(true);
          expect(evalText(p.text), `${id} @${correct}: ${p.text}`).toBe(p.answer);
        }
      }
    }
  });

  it('adding stays small at first and grows; a third number comes in at tier 3', () => {
    const biggest = (correct) => Math.max(...Array.from({ length: 200 }, (_, i) => Math.max(...(U(makeFluencyProblem('add', correct, rngOf(i + 1)).text).match(/\d+/g).map(Number)))));
    expect(biggest(0)).toBeLessThanOrEqual(9);
    expect(biggest(5)).toBeLessThanOrEqual(15);
    expect(biggest(5)).toBeGreaterThan(9);
    expect(biggest(20)).toBeGreaterThan(40);
    const terms = (correct) => new Set(Array.from({ length: 80 }, (_, i) => (makeFluencyProblem('add', correct, rngOf(i + 1)).text.match(/\d+/g) ?? []).length));
    expect([...terms(10)]).toEqual([2]);
    expect([...terms(15)]).toEqual([3]);
  });

  it('subtracting subtracts, add & subtract uses both', () => {
    for (let i = 1; i <= 60; i++) expect(makeFluencyProblem('subtract', 0, rngOf(i)).text).toContain('−');
    const ops = new Set(Array.from({ length: 80 }, (_, i) => (makeFluencyProblem('addsub', 0, rngOf(i + 1)).text.includes('+') ? '+' : '−')));
    expect(ops.size).toBe(2);
  });

  it('multiplying (concepts): positive multipliers first, negative after 5, unit fractions after 10, other fractions after 15', () => {
    const kinds = (correct) => {
      const seen = { negMultiplier: false, unit: false, nonUnit: false, fractionNeg: false };
      for (let i = 1; i <= 400; i++) {
        const t = U(makeFluencyProblem('multiply-concept', correct, rngOf(i)).text);
        const frac = /^(-?)(\d+)\/(\d+)\(/.exec(t);
        if (frac) { if (frac[2] === '1') seen.unit = true; else seen.nonUnit = true; if (frac[1]) seen.fractionNeg = true; }
        else if (t.startsWith('-')) seen.negMultiplier = true;
      }
      return seen;
    };
    expect(kinds(0)).toEqual({ negMultiplier: false, unit: false, nonUnit: false, fractionNeg: false });
    expect(kinds(5)).toMatchObject({ negMultiplier: true, unit: false, nonUnit: false });
    expect(kinds(10)).toMatchObject({ negMultiplier: true, unit: true, nonUnit: false });
    expect(kinds(15)).toMatchObject({ unit: true, nonUnit: true, fractionNeg: true });
  });

  it('concept multiplying keeps the numbers small; the large one has multipliers 6 to 12 and bigger denominators', () => {
    for (let i = 1; i <= 300; i++) {
      for (const correct of [0, 5, 15]) {
        const nums = U(makeFluencyProblem('multiply-concept', correct, rngOf(i)).text).match(/\d+/g).map(Number);
        expect(Math.max(...nums)).toBeLessThanOrEqual(12);
      }
    }
    const multipliers = new Set();
    const dens = new Set();
    for (let i = 1; i <= 600; i++) {
      const t = U(makeFluencyProblem('multiply-large', 0, rngOf(i)).text);
      multipliers.add(Math.abs(Number(t.split('(')[0])));
      const f = /\/(\d+)\(/.exec(U(makeFluencyProblem('multiply-large', 15, rngOf(i)).text));
      if (f) dens.add(Number(f[1]));
    }
    for (const a of [6, 7, 8, 9, 10, 11, 12]) expect(multipliers.has(a)).toBe(true);
    expect(Math.max(...dens)).toBe(8);
  });

  it('is seeded: the same inputs give the same problem', () => {
    expect(makeFluencyProblem('mixed', 7, rngOf(5))).toEqual(makeFluencyProblem('mixed', 7, rngOf(5)));
  });
});

describe('a fluency round', () => {
  const start = (id = 'add', seed = 3) => reduceFluency(newFluency(id, seed), { type: 'start', now: 1000 });
  const type = (s, text, now) => [...text].reduce((t, ch) => reduceFluency(t, ch === '-' ? { type: 'toggleSign', now } : { type: 'digit', digit: Number(ch), now }), s);

  it('starts on the start screen, and Start begins a 60 second round with a problem', () => {
    const ready = newFluency('add', 3);
    expect(ready).toMatchObject({ status: 'ready', problem: null });
    expect(reduceFluency(ready, { type: 'digit', digit: 1, now: 0 })).toBe(ready);
    const s = start();
    expect(s).toMatchObject({ status: 'playing', correct: 0, endsAt: 1000 + DURATION_MS });
    expect(s.problem.text).toMatch(/\d/);
    expect(timeLeft(s)).toBe(DURATION_MS);
    expect(reduceFluency(s, { type: 'start', now: 2000 })).toBe(s);       // already playing
  });

  it('a right answer scores and moves on; a wrong one flashes the right answer and pauses', () => {
    let s = start();
    const first = s.problem;
    s = type(s, String(first.answer), 2000);
    s = reduceFluency(s, { type: 'check', now: 2000 });
    expect(s).toMatchObject({ correct: 1, wrong: 0, entry: '', flash: null });
    expect(s.problem.text).not.toBe(first.text);
    const second = s.problem;
    s = type(s, String(second.answer + 1), 3000);
    s = reduceFluency(s, { type: 'check', now: 3000 });
    expect(s).toMatchObject({ correct: 1, wrong: 1, flash: { answer: second.answer, until: 3000 + PAUSE_MS } });
    expect(reduceFluency(s, { type: 'digit', digit: 1, now: 3100 })).toBe(s);         // paused: typing does nothing
    expect(reduceFluency(s, { type: 'check', now: 3100 })).toBe(s);
    s = reduceFluency(s, { type: 'tick', now: 3000 + PAUSE_MS });
    expect(s.flash).toBeNull();
    expect(s.problem.text).not.toBe(second.text);
  });

  it('a wrong answer costs time, not points', () => {
    let s = start();
    s = reduceFluency(type(s, '999', 2000), { type: 'check', now: 2000 });
    expect(s.correct).toBe(0);
    expect(s.endsAt).toBe(1000 + DURATION_MS);                  // the clock never stops
  });

  it('empty or unreadable checks do nothing', () => {
    const s = start();
    expect(reduceFluency(s, { type: 'check', now: 2000 })).toBe(s);
    const dash = reduceFluency(s, { type: 'toggleSign', now: 2000 });
    expect(reduceFluency(dash, { type: 'check', now: 2100 })).toBe(dash);
  });

  it('the round ends when the time is up, even mid-pause, and then nothing moves', () => {
    let s = start();
    expect(reduceFluency(s, { type: 'tick', now: 1000 + DURATION_MS - 1 }).status).toBe('playing');
    s = reduceFluency(type(s, '999', 59000), { type: 'check', now: 59000 });         // a pause that runs past the end
    s = reduceFluency(s, { type: 'tick', now: 1000 + DURATION_MS });
    expect(s).toMatchObject({ status: 'ended', flash: null, entry: '' });
    expect(timeLeft(s)).toBe(0);
    expect(reduceFluency(s, { type: 'digit', digit: 1, now: 70000 })).toBe(s);
  });

  it('climbs a tier after 5 correct and remembers the highest', () => {
    let s = start('add');
    for (let i = 0; i < 5; i++) s = reduceFluency(type(s, String(s.problem.answer), 2000 + i), { type: 'check', now: 2000 + i });
    expect(s).toMatchObject({ correct: 5, tier: 1, topTier: 1 });
  });

  it('types like the integer pad: − first or ±, digits, backspace, a short cap', () => {
    expect(typeInto('', { type: 'typeChar', ch: '-' }, 'integer')).toBe('-');
    expect(typeInto('5', { type: 'typeChar', ch: '-' }, 'integer')).toBe('5');
    expect(typeInto('12', { type: 'toggleSign' }, 'integer')).toBe('-12');
    expect(typeInto('1234', { type: 'digit', digit: 5 }, 'integer')).toBe('1234');
    expect(typeInto('-1234', { type: 'digit', digit: 5 }, 'integer')).toBe('-1234');
    expect(typeInto('2x', { type: 'typeChar', ch: '+' }, 'algebra')).toBe('2x+');
    expect(typeInto('2x', { type: 'toggleSign' }, 'algebra')).toBe('2x');
    expect(typeInto('', { type: 'backspace' }, 'integer')).toBe('');
  });
});

describe('high scores', () => {
  const at = (y, m, d) => new Date(y, m - 1, d, 12).getTime();
  const NOW = at(2026, 10, 3);

  it('a month starts on the 1st, a school year on September 1, all time at the beginning', () => {
    expect(periodStart('month', NOW)).toBe(at(2026, 10, 1) - 12 * 3600000);
    expect(periodStart('year', NOW)).toBe(new Date(2026, 8, 1).getTime());
    expect(periodStart('year', at(2027, 3, 15))).toBe(new Date(2026, 8, 1).getTime());   // still the 2026–27 year in March
    expect(periodStart('year', at(2027, 8, 31))).toBe(new Date(2026, 8, 1).getTime());   // until September 1
    expect(periodStart('year', at(2027, 9, 1))).toBe(new Date(2027, 8, 1).getTime());
    expect(periodStart('all', NOW)).toBe(0);
    expect(PERIODS.map((p) => p.id)).toEqual(['month', 'year', 'all']);
  });

  it('lists the best runs of a challenge in a period, best first, newer first on a tie', () => {
    const runs = [
      { c: 'add', s: 10, t: at(2026, 10, 1), tier: 1 }, { c: 'add', s: 14, t: at(2026, 9, 5), tier: 2 }, { c: 'add', s: 14, t: at(2026, 9, 20), tier: 2 },
      { c: 'add', s: 30, t: at(2025, 11, 1), tier: 4 }, { c: 'subtract', s: 99, t: at(2026, 10, 2), tier: 4 },
    ];
    expect(topRuns(runs, 'add', 'month', NOW).map((r) => r.s)).toEqual([10]);
    expect(topRuns(runs, 'add', 'year', NOW).map((r) => [r.s, r.t])).toEqual([[14, at(2026, 9, 20)], [14, at(2026, 9, 5)], [10, at(2026, 10, 1)]]);
    expect(topRuns(runs, 'add', 'all', NOW).map((r) => r.s)).toEqual([30, 14, 14, 10]);
    expect(topRuns(runs, 'add', 'all', NOW, 2)).toHaveLength(2);
    expect(bestScore(runs, 'add', 'all', NOW)).toBe(30);
    expect(bestScore(runs, 'mixed', 'all', NOW)).toBe(0);
  });

  it('keeps the newest runs and reads saved data defensively', () => {
    let runs = [];
    for (let i = 0; i < RUN_CAP + 3; i++) runs = addRun(runs, { c: 'add', s: i, t: i });
    expect(runs).toHaveLength(RUN_CAP);
    expect(runs[0].s).toBe(3);
    expect(readRuns('x')).toEqual([]);
    expect(readRuns([{ c: 'add', s: 5, t: 1 }, { c: 3, s: 1, t: 1 }, { c: 'add', s: -1, t: 1 }, null, { c: 'add', s: 2, t: NaN }])).toEqual([{ c: 'add', s: 5, t: 1, tier: 0 }]);
  });

  describe('on this device', () => {
    beforeEach(() => {
      const store = new Map();
      globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => { store.set(k, String(v)); }, removeItem: (k) => { store.delete(k); } };
    });
    it('saves and loads runs, and survives a store that throws', () => {
      expect(loadRuns()).toEqual([]);
      saveRun({ c: 'add', s: 12, t: 5, tier: 2 });
      expect(saveRun({ c: 'add', s: 15, t: 6, tier: 3 })).toHaveLength(2);
      expect(JSON.parse(localStorage.getItem(FLUENCY_KEY))).toHaveLength(2);
      globalThis.localStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
      expect(loadRuns()).toEqual([]);
      expect(() => saveRun({ c: 'add', s: 1, t: 1 })).not.toThrow();
    });
  });
});
