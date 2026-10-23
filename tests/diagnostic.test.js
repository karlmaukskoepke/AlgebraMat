import { describe, it, expect, beforeEach } from 'vitest';
import { upgradePlacement, startLevelOf,
  PROBES, TOTAL, DIAGNOSTIC_SECTIONS, probesOf, totalOf, diagnosticItems, newDiagnostic, reduceDiagnostic, readout, applyReadout, itemAnswer, itemText, itemPad, isRight, STANDING,
} from '../src/engine/diagnostic.js';
import { loadDiag, saveDiag, clearDiag, readDiag, splitOldDiag, DIAG_KEY, OLD_DIAG_KEY } from '../src/diagStore.js';
import { PACKS, packById, levelNumber } from '../src/packs/index.js';
import { newProgress, normalizeProgress, mergeProgress, isLevelUnlocked, openLevels, completeLevel, newTwoStepLevel } from '../src/engine/progress.js';
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
  it('has about two problems from each card (three from Add to both sides), adding and subtracting first', () => {
    expect(PROBES.map((p) => p.pack)).toEqual(['combineit', 'flipit', 'lasso', 'boxes', 'groups-of-terms', 'distribute-combine', 'value', 'one-step', 'two-step', 'add-both', 'divide-it']);
    expect(PROBES.filter((p) => !['add-both', 'divide-it'].includes(p.pack)).every((p) => p.levels.length === 2 && p.levels[0] < p.levels[1])).toBe(true);
    expect(PROBES.find((p) => p.pack === 'add-both').levels).toEqual([3, 6, 6]);
    expect(PROBES.find((p) => p.pack === 'divide-it').levels).toEqual([3, 5, 6]);
    expect(TOTAL).toBe(24);
    const items = diagnosticItems(SEED);
    expect(items).toHaveLength(24);
    expect(items.map((i) => i.pack)).toEqual(PROBES.flatMap((p) => p.levels.map(() => p.pack)));
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
    expect(s).toMatchObject({ done: true, index: 24 });
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
    expect(r.map((x) => x.standing)).toEqual(Array(11).fill('strong'));
    expect(r.map((x) => [x.pack, x.rec])).toEqual([['combineit', 5], ['flipit', 5], ['lasso', 6], ['boxes', 6], ['groups-of-terms', 6], ['distribute-combine', 4], ['value', 4], ['one-step', 5], ['two-step-equations', 6], ['add-both', 6], ['divide-it', 6]]);
    expect(r[0].problems).toHaveLength(2);
    expect(r[0].problems.every((p) => p.right && p.text && p.answer)).toBe(true);
  });

  it('none right: start at the beginning', () => {
    const r = readout(SEED, answerAll(() => false).answers, ITEMS);
    expect(r.map((x) => x.standing)).toEqual(Array(11).fill('start'));
    expect(r.map((x) => x.rec)).toEqual([...Array(9).fill(1), 3, 2]);           // Add to both sides: L3 wrong opens L1–L3 (spec §8); Divide it: the first wrong opens L1–L2
    expect(r[0].problems.every((p) => p.skipped && !p.right)).toBe(true);
  });

  it('only the easier one right: the level after it; only the harder: back to the easier', () => {
    const items = ITEMS;
    const easier = readout(SEED, answerAll((it) => it.level === PROBES.find((p) => p.pack === it.pack).levels[0]).answers, items);
    expect(easier.map((x) => [x.standing, x.rec])).toEqual([['growing', 3], ['growing', 3], ['growing', 3], ['growing', 4], ['growing', 3], ['growing', 2], ['growing', 2], ['growing', 3], ['growing', 4], ['growing', 5], ['growing', 4]]);   // (Two-step: old Level 3 is the new card's Level 4, Build L)
    const harder = readout(SEED, answerAll((it) => it.level === PROBES.find((p) => p.pack === it.pack).levels[1]).answers, items);
    expect(harder.map((x) => x.rec)).toEqual([2, 2, 2, 3, 2, 1, 1, 2, 2, 3, 2]);
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
    expect(items.map((i) => [i.pack, i.level])).toEqual([['one-step', 2], ['one-step', 4], ['two-step', 2], ['two-step', 5], ['add-both', 3], ['add-both', 6], ['add-both', 6], ['divide-it', 3], ['divide-it', 5], ['divide-it', 6]]);
    expect(items.slice(0, 4).map((i) => i.problem.form)).toEqual(['x-a', 'x/a', 'ax-b', 'b-ax']);
    expect(items.map(itemLead)).toEqual(Array(10).fill('x ='));
    expect(itemLead(ITEMS[0])).toBe('=');
    const right = (i) => ({ typed: itemAnswer(items[i]).replace(/ /g, '').replace(/−/g, '-'), skipped: false });
    const r = readout(SEED, [{ typed: '', skipped: true }, right(1), right(2), right(3), right(4), right(5), right(6), right(7), right(8), right(9)], items, 'solve');
    expect(r.map((x) => [x.pack, x.standing, x.rec])).toEqual([['one-step', 'growing', 2], ['two-step-equations', 'strong', 6], ['add-both', 'strong', 6], ['divide-it', 'strong', 6]]);
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
    expect(JSON.parse(localStorage.getItem(DIAG_KEY))).toEqual({ all: { seed: SEED, answers: [{ typed: '4', skipped: false }, { typed: '', skipped: true }], v: 2 } });
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

  it('splits the cards between Count it (six problems), Build it (eight) and Solve it (ten), and together they are the whole list', () => {
    expect(DIAGNOSTIC_SECTIONS).toEqual(['count', 'build', 'solve']);
    expect(probesOf('count').map((p) => p.pack)).toEqual(['combineit', 'flipit', 'lasso']);
    expect(probesOf('build').map((p) => p.pack)).toEqual(['boxes', 'groups-of-terms', 'distribute-combine', 'value']);
    expect([totalOf('count'), totalOf('build'), totalOf('solve')]).toEqual([6, 8, 10]);
    expect(probesOf('solve').map((p) => p.pack)).toEqual(['one-step', 'two-step', 'add-both', 'divide-it']);
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

describe('Add to both sides\' diagnostic (SPEC-ADD-TO-BOTH-SIDES.md §8)', () => {
  const items = diagnosticItems(SEED, 'solve').filter((i) => i.pack === 'add-both');
  const answers = (right) => items.map((it, i) => (right[i] ? { typed: itemAnswer(it).replace(/ /g, '').replace(/−/g, '-'), skipped: false } : { typed: '', skipped: true }));
  const rec = (right) => readout(SEED, answers(right), items, 'solve').find((r) => r.pack === 'add-both');

  it('asks an x − a = b Battle, then a level-6 problem with x on the left and one with x on the right', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const [a, b, c] = diagnosticItems(seed, 'solve').filter((i) => i.pack === 'add-both').map((i) => i.problem);
      expect(a.form).toBe('x-a');
      expect(Boolean(b.mirror)).toBe(false);
      expect(Boolean(c.mirror)).toBe(true);
    }
  });
  it('opens L1–L3 when the first is wrong, L1–L5 when it is right and a level-6 is not, and all six when all are right', () => {
    expect(rec([false, true, true]).rec).toBe(3);
    expect(rec([false, false, false]).rec).toBe(3);
    expect(rec([true, false, true]).rec).toBe(5);
    expect(rec([true, true, false]).rec).toBe(5);
    expect(rec([true, false, false]).rec).toBe(5);
    expect(rec([true, true, true]).rec).toBe(6);
  });
  it('opens those levels in progress; a right x − a Battle skips the numeric Level 1, a wrong one leaves it to play', () => {
    const p = applyReadout(newProgress(PACKS), readout(SEED, answers([true, true, true]), items, 'solve'));
    expect([2, 3, 4, 5, 6].map((l) => isLevelUnlocked(p, 'add-both', l))).toEqual(Array(5).fill(true));
    expect(p.packs['add-both'].levels[0]).toBe(true);
    const q = applyReadout(newProgress(PACKS), readout(SEED, answers([false, true, true]), items, 'solve'));
    expect(q.packs['add-both'].levels[0]).toBe(false);
  });
});

describe('Divide it\'s diagnostic and credit (SPEC-DIVIDE-IT.md §8, on the light-build levels)', () => {
  const items = diagnosticItems(SEED, 'solve').filter((i) => i.pack === 'divide-it');
  const rec = (right) => readout(SEED, [...Array(7).fill({ typed: '', skipped: true }), ...items.map((it, i) => (right[i] ? { typed: itemAnswer(it).replace(/ /g, '').replace(/−/g, '-'), skipped: false } : { typed: '', skipped: true }))], diagnosticItems(SEED, 'solve'), 'solve').find((r) => r.pack === 'divide-it');
  it('opens L1–L2 on a wrong first, L1–L4 when only the first is right, L1–L5 when the third is wrong, L1–L6 when all are right', () => {
    expect([[false, true, true], [true, false, true], [true, true, false], [true, true, true]].map((r) => rec(r).rec)).toEqual([2, 4, 5, 6]);
  });
  it('a right first problem skips the numeric Level 1; a wrong one leaves it to play', () => {
    const p = applyReadout(newProgress(PACKS), [rec([true, false, false])]);
    expect(p.packs['divide-it'].levels[0]).toBe(true);
    expect(applyReadout(newProgress(PACKS), [rec([false, true, true])]).packs['divide-it'].levels[0]).toBe(false);
  });
});

// Build L, Part 5: the Two-step probes (the old card's Levels 2 and 5, the same problems in the same order) open the new Two-step card,
// each old level read through Build K's legacy-credit table. A result finished before Build L keeps what it opened then.
describe('Build L: the placement quiz opens the new Two-step card', () => {
  beforeEach(() => {
    const store = new Map();
    globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => { store.set(k, String(v)); }, removeItem: (k) => { store.delete(k); } };
  });
  const items = diagnosticItems(SEED, 'solve');
  const at = items.map((it, i) => [it, i]).filter(([it]) => it.pack === 'two-step').map(([, i]) => i);
  const answers = ([l2, l5]) => items.map((it, i) => ((i === at[0] && l2) || (i === at[1] && l5) ? { typed: itemAnswer(it).replace(/ /g, '').replace(/−/g, '-'), skipped: false } : { typed: '', skipped: true }));
  const row = (right) => readout(SEED, answers(right), items, 'solve').find((r) => r.pack === 'two-step-equations' || r.pack === 'two-step');
  const opened = (p) => [1, 2, 3, 4, 5, 6, 7].filter((l) => isLevelUnlocked(p, 'two-step-equations', l));

  it('keeps the probes and their order: the old card’s Levels 2 and 5, the same problems', () => {
    expect(PROBES.findIndex((p) => p.pack === 'two-step')).toBe(8);
    expect(items.filter((it) => it.pack === 'two-step').map((it) => [it.level, it.problem.form])).toEqual([[2, 'ax-b'], [5, 'b-ax']]);
  });
  it('reads each old level through the legacy-credit table', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map(newTwoStepLevel)).toEqual([1, 2, 4, 3, 5, 6, 7]);
  });
  it('what a new student placed at each result sees: neither right → Level 1; only b − ax right → 2; only ax − b right → 4; both → 6', () => {
    const cases = [[[false, false], 1, [1]], [[false, true], 2, [1, 2]], [[true, false], 4, [1, 2, 3, 4]], [[true, true], 6, [1, 2, 3, 4, 5, 6]]];
    for (const [right, rec, levels] of cases) {
      const r = row(right);
      expect([r.pack, r.rec, r.probed]).toEqual(['two-step-equations', rec, 'two-step']);
      const p = applyReadout(newProgress(PACKS), [r]);
      expect(opened(p)).toEqual(levels);
      expect(p.packs['two-step-equations'].levels.some(Boolean)).toBe(false);          // opened, not finished
      expect(p.packs['two-step'].open).toBeUndefined();                                 // (the retired card is no longer opened)
    }
  });
  // Build M, Part 1 (Karl, 2026-10-23): a result finished before Build L now opens the new card's levels it showed, with the same mapping
  // as a new placement, once, when the device loads it; nothing it opened is lost and nothing is credited as finished.
  it('a device with a result finished before Build L opens the new Two-step levels it showed: nothing lost, nothing credited', () => {
    const before = { seed: SEED, answers: answers([true, true]) };                      // (saved with no version: Build K's place)
    localStorage.setItem(DIAG_KEY, JSON.stringify({ solve: before }));
    const s = loadDiag('solve');
    expect([s.done, s.legacy]).toEqual([true, true]);
    // what that student's device held: Build K's placement (the old card's levels opened, the new card at Level 1), some levels done
    let old = applyReadout(newProgress(PACKS), readout(SEED, s.answers, items, 'solve'));
    old = openLevels(old, 'two-step', 6);
    delete old.packs['two-step-equations'].open;
    old.packs['add-both'].levels[1] = true;
    const p = upgradePlacement(old, readout(SEED, s.answers, items, 'solve'));
    expect(opened(p)).toEqual([1, 2, 3, 4, 5, 6]);                                      // the new card: what the quiz showed
    expect(p.packs['two-step'].open).toBe(6);                                           // nothing lost
    for (const [id, e] of Object.entries(p.packs)) expect(e.levels).toEqual(old.packs[id].levels);   // nothing credited
    for (const [right, levels] of [[[false, false], [1]], [[false, true], [1, 2]], [[true, false], [1, 2, 3, 4]]]) {
      const q = upgradePlacement(newProgress(PACKS), readout(SEED, answers(right), items, 'solve'));
      expect(opened(q)).toEqual(levels);
      expect(q.packs['two-step-equations'].levels.some(Boolean)).toBe(false);
    }
    // a level already open further is kept (opening never closes)
    expect(opened(upgradePlacement(openLevels(newProgress(PACKS), 'two-step-equations', 7), readout(SEED, answers([false, false]), items, 'solve')))).toEqual([1, 2, 3, 4, 5, 6, 7]);
    saveDiag({ ...s, legacy: false });                                                  // (main.js saves it as today's once upgraded)
    expect(loadDiag('solve').legacy).toBeUndefined();
    // a result saved part way before Build L, finished now, gets today's readout
    localStorage.setItem(DIAG_KEY, JSON.stringify({ solve: { seed: SEED, answers: before.answers.slice(0, 3) } }));
    const part = loadDiag('solve');
    expect(part.legacy).toBeUndefined();
    const done = before.answers.slice(3).reduce((st, a) => reduceDiagnostic(a.skipped ? st : { ...st, entry: a.typed }, { type: a.skipped ? 'skip' : 'next' }, items), part);
    expect(done.done).toBe(true);
    saveDiag(done);
    expect(loadDiag('solve').legacy).toBeUndefined();
  });
  // Build M, Part 1: One-step equations opens at saved Level 3, so a result recommending 1 or 2 read "Start at Level -1" (or 0)
  it('a result button never shows a level below 1 (One-step equations, both wrong)', () => {
    const one = packById('one-step');
    for (const rec of [1, 2, 3, 4, 5]) expect(levelNumber(one, startLevelOf(one, rec))).toBeGreaterThanOrEqual(1);
    expect(startLevelOf(one, 1)).toBe(3);
    expect(levelNumber(one, startLevelOf(one, 1))).toBe(1);
    const r = readout(SEED, items.map(() => ({ typed: '', skipped: true })), items, 'solve').find((x) => x.pack === 'one-step');
    expect(levelNumber(one, startLevelOf(one, r.rec))).toBe(1);
    expect(startLevelOf(packById('add-both'), 3)).toBe(3);                              // (a card whose recommendation is in range is unchanged)
    for (const pack of PACKS.filter((x) => x.levels)) for (let rec = 1; rec <= pack.levels; rec++) expect(levelNumber(pack, startLevelOf(pack, rec))).toBeGreaterThanOrEqual(1);
  });
  it('a result finished today is saved as today’s and reads back the same', () => {
    let s = newDiagnostic(SEED, 'solve');
    s = { ...s, answers: answers([true, false]), index: items.length, done: true };
    saveDiag(s);
    const back = loadDiag('solve');
    expect(back.legacy).toBeUndefined();
    expect(row([true, false])).toMatchObject({ pack: 'two-step-equations', rec: 4 });
  });
});
