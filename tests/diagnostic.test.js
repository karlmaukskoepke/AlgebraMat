import { describe, it, expect, beforeEach } from 'vitest';
import {
  PROBES, TOTAL, DIAGNOSTIC_SECTIONS, probesOf, totalOf, diagnosticItems, newDiagnostic, reduceDiagnostic, readout, applyReadout, itemAnswer, itemText, itemPad, isRight, STANDING,
} from '../src/engine/diagnostic.js';
import { loadDiag, saveDiag, clearDiag, readDiag, splitOldDiag, DIAG_KEY, OLD_DIAG_KEY } from '../src/diagStore.js';
import { PACKS } from '../src/packs/index.js';
import { newProgress, normalizeProgress, mergeProgress, isLevelUnlocked, openLevels, completeLevel } from '../src/engine/progress.js';
import { cardIdFor } from '../src/engine/lightCards.js';
import { itemLead } from '../src/engine/diagnostic.js';

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
  it('has about two problems from each of the nine cards, adding and subtracting first', () => {
    expect(PROBES.map((p) => p.pack)).toEqual(['combineit', 'flipit', 'lasso', 'boxes', 'groups-of-terms', 'distribute-combine', 'value', 'one-step', 'two-step']);
    expect(PROBES.every((p) => p.levels.length === 2 && p.levels[0] < p.levels[1])).toBe(true);
    expect(TOTAL).toBe(18);
    const items = diagnosticItems(SEED);
    expect(items).toHaveLength(18);
    expect(items.map((i) => i.pack)).toEqual(PROBES.flatMap((p) => [p.pack, p.pack]));
    for (const p of PROBES) for (const level of p.levels) expect(level).toBeLessThanOrEqual(PACKS.find((x) => x.id === p.pack).levels);
  });

  it('is seeded: the same seed gives the same problems, another seed others', () => {
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
    expect(s).toMatchObject({ done: true, index: 18 });
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
    expect(r.map((x) => x.standing)).toEqual(Array(9).fill('strong'));
    expect(r.map((x) => [x.pack, x.rec])).toEqual([['combineit', 5], ['flipit', 5], ['lasso', 6], ['boxes', 6], ['groups-of-terms', 6], ['distribute-combine', 4], ['value', 4], ['one-step', 5], ['two-step', 6]]);
    expect(r[0].problems).toHaveLength(2);
    expect(r[0].problems.every((p) => p.right && p.text && p.answer)).toBe(true);
  });

  it('none right: start at the beginning', () => {
    const r = readout(SEED, answerAll(() => false).answers, ITEMS);
    expect(r.map((x) => x.standing)).toEqual(Array(9).fill('start'));
    expect(r.map((x) => x.rec)).toEqual(Array(9).fill(1));
    expect(r[0].problems.every((p) => p.skipped && !p.right)).toBe(true);
  });

  it('only the easier one right: the level after it; only the harder: back to the easier', () => {
    const items = ITEMS;
    const easier = readout(SEED, answerAll((it) => it.level === PROBES.find((p) => p.pack === it.pack).levels[0]).answers, items);
    expect(easier.map((x) => [x.standing, x.rec])).toEqual([['growing', 3], ['growing', 3], ['growing', 3], ['growing', 4], ['growing', 3], ['growing', 2], ['growing', 2], ['growing', 3], ['growing', 3]]);
    const harder = readout(SEED, answerAll((it) => it.level === PROBES.find((p) => p.pack === it.pack).levels[1]).answers, items);
    expect(harder.map((x) => x.rec)).toEqual([2, 2, 2, 3, 2, 1, 1, 2, 2]);
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

describe('Solve it\'s diagnostic', () => {
  it('asks x − a = b and x / a = b, then ax − b = c and b − ax = c, and the answer line reads x =', () => {
    const items = diagnosticItems(SEED, 'solve');
    expect(items.map((i) => [i.pack, i.level])).toEqual([['one-step', 2], ['one-step', 4], ['two-step', 2], ['two-step', 5]]);
    expect(items.map((i) => i.problem.form)).toEqual(['x-a', 'x/a', 'ax-b', 'b-ax']);
    expect(items.map(itemLead)).toEqual(['x =', 'x =', 'x =', 'x =']);
    expect(itemLead(ITEMS[0])).toBe('=');
    const r = readout(SEED, [{ typed: '', skipped: true }, { typed: itemAnswer(items[1]), skipped: false }, { typed: itemAnswer(items[2]), skipped: false }, { typed: itemAnswer(items[3]), skipped: false }], items, 'solve');
    expect(r.map((x) => [x.pack, x.standing, x.rec])).toEqual([['one-step', 'growing', 2], ['two-step', 'strong', 6]]);
    expect(r[0].problems[0].lead).toBe('x =');
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

  it('is kept when progress is read back or merged, and the readout applies to all seven cards', () => {
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
    expect(loadDiag('all')).toBeNull();
    let s = run(newDiagnostic(SEED), ...typed('4'), { type: 'next' }, { type: 'skip' });
    saveDiag(s);
    expect(JSON.parse(localStorage.getItem(DIAG_KEY))).toEqual({ all: { seed: SEED, answers: [{ typed: '4', skipped: false }, { typed: '', skipped: true }] } });
    expect(loadDiag('all')).toMatchObject({ seed: SEED, index: 2, entry: '', done: false });
    clearDiag('all');
    expect(loadDiag('all')).toBeNull();
  });

  it('is done only when every problem is answered; bad data is ignored', () => {
    const full = { seed: 5, answers: Array(TOTAL).fill({ typed: '1', skipped: false }) };
    expect(readDiag(full).done).toBe(true);
    expect(readDiag({ seed: 5, answers: full.answers.slice(0, TOTAL - 1) }).done).toBe(false);
    expect(readDiag({ seed: 'x', answers: [] })).toBeNull();
    expect(readDiag(null)).toBeNull();
    expect(readDiag({ seed: 5, answers: [{ typed: 5 }, null] }).answers).toEqual([{ typed: '', skipped: false }, { typed: '', skipped: false }]);
    globalThis.localStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
    expect(loadDiag('count')).toBeNull();
    expect(() => saveDiag(newDiagnostic(1, 'count'))).not.toThrow();
  });
});

describe('a diagnostic for each section (Karl, 2026-10-04)', () => {
  beforeEach(() => {
    const store = new Map();
    globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => { store.set(k, String(v)); }, removeItem: (k) => { store.delete(k); } };
  });

  it('splits the cards between Count it (six problems), Build it (eight) and Solve it (four), and together they are the whole list', () => {
    expect(DIAGNOSTIC_SECTIONS).toEqual(['count', 'build', 'solve']);
    expect(probesOf('count').map((p) => p.pack)).toEqual(['combineit', 'flipit', 'lasso']);
    expect(probesOf('build').map((p) => p.pack)).toEqual(['boxes', 'groups-of-terms', 'distribute-combine', 'value']);
    expect([totalOf('count'), totalOf('build'), totalOf('solve')]).toEqual([6, 8, 4]);
    expect(probesOf('solve').map((p) => p.pack)).toEqual(['one-step', 'two-step']);
    const all = diagnosticItems(SEED).map(itemText);
    expect([...diagnosticItems(SEED, 'count'), ...diagnosticItems(SEED, 'build'), ...diagnosticItems(SEED, 'solve')].map(itemText)).toEqual(all);   // same problems, same seed
  });

  it('keeps each section\'s place apart, and reads its own readout', () => {
    saveDiag(run(newDiagnostic(SEED, 'count'), { type: 'skip' }));
    saveDiag(run(newDiagnostic(SEED + 1, 'build'), { type: 'skip' }, { type: 'skip' }));
    expect(loadDiag('count')).toMatchObject({ seed: SEED, section: 'count', index: 1 });
    expect(loadDiag('build')).toMatchObject({ seed: SEED + 1, section: 'build', index: 2 });
    clearDiag('count');
    expect(loadDiag('count')).toBeNull();
    expect(loadDiag('build')).not.toBeNull();
    const items = diagnosticItems(SEED, 'build');
    let s = newDiagnostic(SEED, 'build');
    for (let i = 0; i < items.length; i++) s = reduceDiagnostic(s, { type: 'skip' }, items);
    expect(s).toMatchObject({ done: true, index: 8 });
    expect(readout(SEED, s.answers, items, 'build').map((r) => r.pack)).toEqual(['boxes', 'groups-of-terms', 'distribute-combine', 'value']);
  });

  it('splits an old single diagnostic between the sections, keeping every problem the same', () => {
    const old = { seed: SEED, answers: Array.from({ length: 12 }, (_, i) => ({ typed: String(i), skipped: false })) };
    localStorage.setItem(OLD_DIAG_KEY, JSON.stringify(old));
    const count = loadDiag('count');
    const build = loadDiag('build');
    expect(count).toMatchObject({ seed: SEED, done: true, index: 6 });
    expect(count.answers.map((a) => a.typed)).toEqual(['0', '1', '2', '3', '4', '5']);
    expect(build).toMatchObject({ seed: SEED, done: false, index: 6 });          // Value it's two are new
    expect(build.answers.map((a) => a.typed)).toEqual(['6', '7', '8', '9', '10', '11']);
    expect(splitOldDiag(null)).toEqual({});
    expect(splitOldDiag({ seed: SEED, answers: [{ typed: '1' }] })).toEqual({ count: { seed: SEED, answers: [{ typed: '1' }] } });
    saveDiag({ ...build, answers: [...build.answers, { typed: '3', skipped: false }] });                                 // the new place wins
    expect(loadDiag('build').index).toBe(7);
  });
});
