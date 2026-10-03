import { describe, it, expect, beforeEach } from 'vitest';
import {
  PROBES, TOTAL, diagnosticItems, newDiagnostic, reduceDiagnostic, readout, applyReadout, itemAnswer, itemText, itemPad, isRight, STANDING,
} from '../src/engine/diagnostic.js';
import { loadDiag, saveDiag, clearDiag, readDiag, DIAG_KEY } from '../src/diagStore.js';
import { PACKS } from '../src/packs/index.js';
import { newProgress, normalizeProgress, mergeProgress, isLevelUnlocked, openLevels, completeLevel } from '../src/engine/progress.js';
import { cardIdFor } from '../src/engine/lightCards.js';

const SEED = 4242;
const ITEMS = diagnosticItems(SEED);
const typed = (text, pad = 'integer') => [...text.replace(/−/g, '-')].map((ch) => (ch === '-' && pad === 'integer' ? { type: 'toggleSign' } : /\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'typeChar', ch }));
const run = (s, ...actions) => actions.reduce((t, a) => reduceDiagnostic(t, a, s.seed === SEED ? ITEMS : undefined), s);
const answerAll = (right) => {
  let s = newDiagnostic(SEED);
  ITEMS.forEach((it) => { s = run(s, ...(right(it) ? typed(itemAnswer(it).replace(/ /g, ''), itemPad(it)) : []), { type: 'next' }); });
  return s;
};

describe('the diagnostic', () => {
  it('has about two problems from each of the six cards, adding and subtracting first', () => {
    expect(PROBES.map((p) => p.pack)).toEqual(['combineit', 'flipit', 'lasso', 'boxes', 'groups-of-terms', 'distribute-combine']);
    expect(PROBES.every((p) => p.levels.length === 2 && p.levels[0] < p.levels[1])).toBe(true);
    expect(TOTAL).toBe(12);
    const items = diagnosticItems(SEED);
    expect(items).toHaveLength(12);
    expect(items.map((i) => i.pack)).toEqual(PROBES.flatMap((p) => [p.pack, p.pack]));
    for (const p of PROBES) for (const level of p.levels) expect(level).toBeLessThanOrEqual(PACKS.find((x) => x.id === p.pack).levels);
  });

  it('is seeded: the same seed gives the same twelve problems, another seed others', () => {
    const text = (seed) => diagnosticItems(seed).map(itemText);
    expect(text(SEED)).toEqual(text(SEED));
    expect(text(SEED)).not.toEqual(text(SEED + 1));
    for (const it of diagnosticItems(SEED)) expect(itemText(it)).toMatch(/\S/);
  });

  it('every probe has a card that can check a typed answer, with the right pad', () => {
    for (let seed = 1; seed <= 20; seed++) {
      for (const it of diagnosticItems(seed)) {
        expect(cardIdFor(it.pack, it.level)).toBeTruthy();
        expect(isRight(it, itemAnswer(it).replace(/ /g, '').replace(/−/g, '-')), `${it.pack} L${it.level}: ${itemText(it)}`).toBe(true);
        expect(isRight(it, '')).toBe(false);
        expect(['integer', 'algebra']).toContain(itemPad(it));
      }
    }
  });

  it('types, then Next records the answer and moves on, saying nothing about right or wrong', () => {
    let s = run(newDiagnostic(SEED), { type: 'digit', digit: 7 });
    expect(s.entry).toBe('7');
    s = run(s, { type: 'next' });
    expect(s).toMatchObject({ index: 1, entry: '', answers: [{ typed: '7', skipped: false }], done: false });
    expect(Object.keys(s)).not.toContain('feedback');
  });

  it('an empty Next and "I don\'t know" are both skips', () => {
    let s = run(newDiagnostic(SEED), { type: 'next' });
    expect(s.answers[0]).toEqual({ typed: '', skipped: true });
    s = run(s, { type: 'digit', digit: 3 }, { type: 'skip' });
    expect(s.answers[1]).toEqual({ typed: '', skipped: true });
  });

  it('is done after the last problem, and not before', () => {
    const items = diagnosticItems(SEED);
    let s = newDiagnostic(SEED);
    for (let i = 0; i < items.length - 1; i++) s = run(s, { type: 'next' });
    expect(s.done).toBe(false);
    s = run(s, { type: 'next' });
    expect(s).toMatchObject({ done: true, index: 12 });
    expect(run(s, { type: 'digit', digit: 1 })).toBe(s);
  });

  it('the pad follows the problem: algebra problems type x, +, −', () => {
    const items = diagnosticItems(SEED);
    const at = items.findIndex((i) => itemPad(i) === 'algebra');
    let s = newDiagnostic(SEED);
    for (let i = 0; i < at; i++) s = run(s, { type: 'next' });
    expect(run(s, { type: 'typeChar', ch: 'x' }).entry).toBe('x');
  });
});

describe('the readout', () => {
  it('all right: every card strong, recommending the level after the harder one', () => {
    const s = answerAll(() => true);
    const r = readout(SEED, s.answers, ITEMS);
    expect(r.map((x) => x.standing)).toEqual(Array(6).fill('strong'));
    expect(r.map((x) => [x.pack, x.rec])).toEqual([['combineit', 5], ['flipit', 5], ['lasso', 6], ['boxes', 6], ['groups-of-terms', 6], ['distribute-combine', 4]]);
    expect(r[0].problems).toHaveLength(2);
    expect(r[0].problems.every((p) => p.right && p.text && p.answer)).toBe(true);
  });

  it('none right: start at the beginning', () => {
    const r = readout(SEED, answerAll(() => false).answers, ITEMS);
    expect(r.map((x) => x.standing)).toEqual(Array(6).fill('start'));
    expect(r.map((x) => x.rec)).toEqual(Array(6).fill(1));
    expect(r[0].problems.every((p) => p.skipped && !p.right)).toBe(true);
  });

  it('only the easier one right: the level after it; only the harder: back to the easier', () => {
    const items = ITEMS;
    const easier = readout(SEED, answerAll((it) => it.level === PROBES.find((p) => p.pack === it.pack).levels[0]).answers, items);
    expect(easier.map((x) => [x.standing, x.rec])).toEqual([['growing', 3], ['growing', 3], ['growing', 3], ['growing', 4], ['growing', 3], ['growing', 2]]);
    const harder = readout(SEED, answerAll((it) => it.level === PROBES.find((p) => p.pack === it.pack).levels[1]).answers, items);
    expect(harder.map((x) => x.rec)).toEqual([2, 2, 2, 3, 2, 1]);
  });

  it('shows what was typed, and the right answer, for each problem', () => {
    let s = newDiagnostic(SEED);
    s = run(s, ...typed('5'), { type: 'next' });
    const r = readout(SEED, s.answers, ITEMS);
    expect(r[0].problems[0]).toMatchObject({ typed: '5', skipped: false });
    expect(r[0].problems[1]).toMatchObject({ typed: '', right: false });     // not reached yet: counts as not right
  });

  it('has a name for each standing', () => {
    expect(STANDING).toEqual({ strong: 'Strong', growing: 'Getting there', start: 'Start here' });
  });
});

describe('opening levels', () => {
  const base = () => newProgress(PACKS);

  it('opens a pack up to the recommended level, without marking anything done', () => {
    const p = openLevels(base(), 'lasso', 6);
    expect([1, 2, 3, 4, 5, 6].every((l) => isLevelUnlocked(p, 'lasso', l))).toBe(true);
    expect(isLevelUnlocked(p, 'lasso', 7)).toBe(false);
    expect(p.packs.lasso.levels.some(Boolean)).toBe(false);
    expect(isLevelUnlocked(base(), 'lasso', 2)).toBe(false);                    // the original is untouched
  });

  it('never closes what was open, caps at the pack, and level 1 opens nothing extra', () => {
    let p = openLevels(base(), 'boxes', 4);
    p = openLevels(p, 'boxes', 2);
    expect(isLevelUnlocked(p, 'boxes', 4)).toBe(true);
    expect(openLevels(base(), 'boxes', 99).packs.boxes.open).toBe(6);
    expect(openLevels(base(), 'boxes', 1).packs.boxes.open).toBeUndefined();
    expect(openLevels(base(), 'nope', 3)).toEqual(base());
  });

  it('is kept when progress is read back or merged, and the readout applies to all six cards', () => {
    const p = openLevels(base(), 'flipit', 3);
    expect(normalizeProgress(JSON.parse(JSON.stringify(p)), PACKS).packs.flipit.open).toBe(3);
    expect(normalizeProgress({ packs: { flipit: { levels: [], open: 99 } } }, PACKS).packs.flipit.open).toBe(5);
    expect(normalizeProgress({ packs: { flipit: { levels: [], open: 'x' } } }, PACKS).packs.flipit.open).toBeUndefined();
    expect(mergeProgress(p, openLevels(base(), 'flipit', 4)).packs.flipit.open).toBe(4);
    const all = applyReadout(base(), readout(SEED, answerAll(() => true).answers, ITEMS));
    expect(isLevelUnlocked(all, 'distribute-combine', 4)).toBe(true);
    expect(isLevelUnlocked(all, 'lasso', 6)).toBe(true);
    expect(completeLevel(p, 'flipit', 1).packs.flipit.open).toBe(3);
  });
});

describe('the diagnostic\'s saved place', () => {
  beforeEach(() => {
    const store = new Map();
    globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => { store.set(k, String(v)); }, removeItem: (k) => { store.delete(k); } };
  });

  it('saves the seed and the answers, and picks up where it left off', () => {
    expect(loadDiag()).toBeNull();
    let s = run(newDiagnostic(SEED), ...typed('4'), { type: 'next' }, { type: 'skip' });
    saveDiag(s);
    expect(JSON.parse(localStorage.getItem(DIAG_KEY))).toEqual({ seed: SEED, answers: [{ typed: '4', skipped: false }, { typed: '', skipped: true }] });
    expect(loadDiag()).toMatchObject({ seed: SEED, index: 2, entry: '', done: false });
    clearDiag();
    expect(loadDiag()).toBeNull();
  });

  it('is done only when every problem is answered; bad data is ignored', () => {
    const full = { seed: 5, answers: Array(TOTAL).fill({ typed: '1', skipped: false }) };
    expect(readDiag(full).done).toBe(true);
    expect(readDiag({ seed: 5, answers: full.answers.slice(0, 11) }).done).toBe(false);
    expect(readDiag({ seed: 'x', answers: [] })).toBeNull();
    expect(readDiag(null)).toBeNull();
    expect(readDiag({ seed: 5, answers: [{ typed: 5 }, null] }).answers).toEqual([{ typed: '', skipped: false }, { typed: '', skipped: false }]);
    globalThis.localStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
    expect(loadDiag()).toBeNull();
    expect(() => saveDiag(newDiagnostic(1))).not.toThrow();
  });
});
