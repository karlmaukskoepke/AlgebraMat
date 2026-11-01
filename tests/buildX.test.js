// Build X (Karl, 2026-10-26): earned versus placed (Part 2) and metallic progress (Part 4).
import { describe, it, expect } from 'vitest';
import {
  newProgress, normalizeProgress, mergeProgress, completeLevel, placeLevels, levelState, isLevelUnlocked, encodeProgress, decodeProgress,
  doneCount, withLegacyCredit, isPackComplete,
} from '../src/engine/progress.js';
import { PACKS, SECTIONS, packById } from '../src/packs/index.js';
import { applyReadout } from '../src/engine/diagnostic.js';
import { buildRequest, takeFromSheet } from '../src/engine/sync.js';
import { FakeBook, gs } from './helpers/fakeSheet.js';

const states = (p, id) => p.packs[id].levels.map((_, i) => levelState(p, id, i + 1));
const E = 'earned';
const P = 'placed';
const N = 'none';

// A save from before Build X: v 1, finished levels as true, the legacy credit already written in (it was saved at each load).
const oldSave = () => {
  const p = newProgress(PACKS);
  p.v = 1;
  p.packs['one-step'].levels[2] = true;              // One-step ax = b → Divide it Level 2 (credited, saved as finished)
  p.packs['divide-it'].levels[1] = true;
  p.packs['flip-everything'].levels[1] = true;      // played on the card
  p.packs['two-step'].levels[0] = true;             // old Two-step L1 → new Two-step L1, never saved through (an edge: credited at load)
  return JSON.parse(JSON.stringify(p));
};

describe('Part 2: earned versus placed', () => {
  it('keeps every finished level of a device from before Build X as earned, legacy credit included', () => {
    const saved = oldSave();
    const p = normalizeProgress(saved, PACKS, { legacyEarned: saved.v !== 2 });
    expect(levelState(p, 'divide-it', 2)).toBe(E);
    expect(levelState(p, 'flip-everything', 2)).toBe(E);
    expect(levelState(p, 'two-step-equations', 1)).toBe(E);      // what showed as finished before stays finished, as earned
    expect(p.v).toBe(2);
    expect(JSON.stringify(p)).not.toContain('placed');
    // and from then on (a v 2 save) it reads the same
    expect(normalizeProgress(JSON.parse(JSON.stringify(p)), PACKS)).toEqual(p);
  });

  it('records credit made after Build X as placed: the placement quiz and the legacy credit', () => {
    // legacy: One-step ax = b finished now → Divide it Level 2 placed
    const p = withLegacyCredit(completeLevel(newProgress(PACKS), 'one-step', 3));
    expect(states(p, 'divide-it')).toEqual([N, P, N, N, N, N]);
    expect(isLevelUnlocked(p, 'divide-it', 3)).toBe(true);           // placed opens the next level, as the credit did
    // the quiz: Add to both sides started at saved Level 5 → Levels 2-4 placed (Level 1 is "See why it works": never placed)
    const q = applyReadout(newProgress(PACKS), [{ pack: 'add-both', rec: 5 }]);
    expect(states(q, 'add-both')).toEqual([E, P, P, P, N, N]);      // (Level 1 is the walkthrough the quiz has always marked done)
    expect(isLevelUnlocked(q, 'add-both', 5)).toBe(true);
    expect(isLevelUnlocked(q, 'add-both', 6)).toBe(false);
  });

  it('never places a hidden level or a walkthrough level', () => {
    let p = placeLevels(newProgress(PACKS), 'strange-solutions', 6);    // Strange solutions shows 3 of its 5
    expect(states(p, 'strange-solutions')).toEqual([P, P, P, N, N]);
    p = placeLevels(newProgress(PACKS), 'one-step', 5);                   // One-step shows saved 3-5
    expect(states(p, 'one-step')).toEqual([N, N, P, P, N]);
    p = placeLevels(newProgress(PACKS), 'divide-it', 3);                  // saved Level 1 is "See why it works"
    expect(states(p, 'divide-it')).toEqual([N, P, N, N, N, N]);
  });

  it('earns a placed level (one problem, or the level finished); placed never overwrites earned', () => {
    let p = placeLevels(newProgress(PACKS), 'two-step-equations', 4);
    expect(states(p, 'two-step-equations').slice(0, 4)).toEqual([P, P, P, N]);
    p = completeLevel(p, 'two-step-equations', 2);
    expect(states(p, 'two-step-equations').slice(0, 4)).toEqual([P, E, P, N]);
    expect(p.packs['two-step-equations'].placed[1]).toBe(false);
    p = placeLevels(p, 'two-step-equations', 4);                         // the quiz again: Level 2 stays earned
    expect(levelState(p, 'two-step-equations', 2)).toBe(E);
    expect(doneCount(p)).toBe(3);
  });

  it('merges two devices: earned beats placed beats none, either way round', () => {
    const a = placeLevels(newProgress(PACKS), 'flip-everything', 5);                 // 2, 3, 4 placed
    const b = completeLevel(completeLevel(newProgress(PACKS), 'flip-everything', 3), 'flip-everything', 6);
    for (const m of [mergeProgress(a, b), mergeProgress(b, a)]) expect(states(m, 'flip-everything')).toEqual([N, P, E, P, N, E]);
    expect(mergeProgress(a, a)).toEqual(a);
  });

  it('leaves a retired card\'s levels alone', () => {
    let p = newProgress(PACKS);
    p.packs.switch.levels = [true, true, false, true, false, false];
    p = normalizeProgress(p, PACKS);
    expect(p.packs.switch.levels).toEqual([true, true, false, true, false, false]);
    expect(p.packs.switch.placed).toBeUndefined();
    expect(states(p, 'add-both')).toEqual([N, N, N, P, P, N]);           // what it feeds is placed
  });

  it('round-trips every save-code layout, v1 to v20: a code carries earned levels and gives them back as earned', () => {
    const rand = (seed) => () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    for (let v = 1; v <= 20; v++) {
      const r = rand(v * 7919);
      for (let k = 0; k < 40; k++) {
        let p = newProgress(PACKS);
        for (const pack of PACKS) {
          if (!pack.levels || pack.comingSoon) continue;
          for (let l = 1; l <= pack.levels; l++) if (r() < 0.4) p = completeLevel(p, pack.id, l);
        }
        p = placeLevels(p, 'two-step-equations', 5);
        const code = encodeProgress(p, v);
        const back = decodeProgress(code, PACKS);
        expect(back, `v${v}`).not.toBeNull();
        // every earned level the layout carries comes back earned (codes v1-v8 predate the later packs; Combine it and Boxes & Circles
        // gained a level in the middle, read through normalizeProgress as before), and nothing comes back as more than it was
        if (v >= 8) expect(encodeProgress(back, v), `v${v}`).toBe(code);
        for (const pack of PACKS) {
          if (!back.packs[pack.id]) continue;
          back.packs[pack.id].levels.forEach((earned, i) => { if (earned && v >= 8) expect(p.packs[pack.id].levels[i], `v${v} ${pack.id} ${i + 1}`).toBe(true); });
        }
      }
    }
  });

  it('never moves a level from earned to placed or none, whatever happens to it', () => {
    const rand = ((seed) => () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; })(12345);
    const ids = PACKS.filter((p) => p.levels && !p.comingSoon).map((p) => p.id);
    let p = newProgress(PACKS);
    const earned = new Set();
    for (let step = 0; step < 600; step++) {
      const id = ids[Math.floor(rand() * ids.length)];
      const level = 1 + Math.floor(rand() * p.packs[id].levels.length);
      const pick = rand();
      if (pick < 0.3) p = completeLevel(p, id, level);
      else if (pick < 0.55) p = placeLevels(p, id, level + 1);
      else if (pick < 0.7) p = mergeProgress(p, placeLevels(newProgress(PACKS), id, level + 2));
      else if (pick < 0.8) p = normalizeProgress(JSON.parse(JSON.stringify(p)), PACKS);
      else if (pick < 0.9) p = mergeProgress(p, decodeProgress(encodeProgress(p), PACKS));
      else p = takeFromSheet(p, JSON.parse(JSON.stringify(buildRequest({ auth: { period: '1', number: '2' }, progress: p }).progress)), PACKS);
      for (const key of earned) { const [pid, l] = key.split('|'); expect(levelState(p, pid, Number(l)), `${key} at step ${step}`).toBe(E); }
      for (const pid of ids) p.packs[pid].levels.forEach((e, i) => { if (e) earned.add(`${pid}|${i + 1}`); });
    }
  });
});

describe('Part 2: the class sheet', () => {
  const auth = { period: '3', number: '12' };
  const send = (book, progress) => gs.handle({ v: 1, auth, progress }, book);

  it('keeps earned in the level columns and placed in its own column, and merges two devices', () => {
    const book = new FakeBook();
    // device A: Divide it Level 2 placed, Level 3 earned
    let a = completeLevel(placeLevels(newProgress(PACKS), 'divide-it', 3), 'divide-it', 3);
    let res = send(book, buildRequest({ auth, progress: a }).progress);
    const head = book.sheets.Progress.rows[0];
    const row = book.sheets.Progress.rows[1];
    expect(row[head.indexOf('divide-it-2')]).toBe(false);
    expect(row[head.indexOf('divide-it-3')]).toBe(true);
    expect(String(row[head.indexOf('divide-it-placed')])).toBe('2');
    expect(res.progress.packs['divide-it'].placed).toEqual([false, true, false, false, false, false]);
    // device B (fresh) catches up: placed stays placed, earned stays earned
    const b = takeFromSheet(newProgress(PACKS), res.progress, PACKS);
    expect(states(b, 'divide-it')).toEqual([N, P, E, N, N, N]);
    // device B earns Level 2: the sheet now has it earned and no longer placed
    res = send(book, buildRequest({ auth, progress: completeLevel(b, 'divide-it', 2) }).progress);
    expect(book.sheets.Progress.rows[1][head.indexOf('divide-it-2')]).toBe(true);
    expect(String(book.sheets.Progress.rows[1][book.sheets.Progress.rows[0].indexOf('divide-it-placed')])).toBe('');
    // device A, still saying placed, merges back to earned
    a = takeFromSheet(a, send(book, buildRequest({ auth, progress: a }).progress).progress, PACKS);
    expect(states(a, 'divide-it')).toEqual([N, E, E, N, N, N]);
  });

  it('works with a class sheet that has not been updated: placed stays on the device, earned goes to the sheet', () => {
    // an old sheet answers with the level columns only (it ignores `placed`)
    const p = completeLevel(placeLevels(newProgress(PACKS), 'add-both', 4), 'add-both', 4);
    const answer = { packs: { 'add-both': { levels: [false, false, false, true, false, false], open: 4 } } };
    const merged = takeFromSheet(p, answer, PACKS);
    expect(states(merged, 'add-both')).toEqual([N, P, P, E, N, N]);
    expect(buildRequest({ auth, progress: p }).progress.packs['add-both'].levels).toEqual([false, false, false, true, false, false]);
  });

  it('reads a placed cell the sheet stored as a number, and never adds a placed column for a card with nothing placed', () => {
    const book = new FakeBook();
    send(book, buildRequest({ auth, progress: completeLevel(newProgress(PACKS), 'flipit', 1) }).progress);
    expect(book.sheets.Progress.rows[0].some((k) => String(k).endsWith('-placed'))).toBe(false);
    const res = send(book, { packs: { 'two-step-equations': { levels: [false, false, false], placed: [false, false, true] } } });
    const head = book.sheets.Progress.rows[0];
    book.sheets.Progress.rows[1][head.indexOf('two-step-equations-placed')] = 3;      // what Sheets does with "3"
    expect(send(book, {}).progress.packs['two-step-equations'].placed.slice(0, 3)).toEqual([false, false, true]);
    expect(res.progress.packs['two-step-equations'].placed.slice(0, 3)).toEqual([false, false, true]);
  });
});

describe('Part 2: hidden levels', () => {
  it('Strange solutions\' Levels 4-5 and One-step\'s early levels stay unfinished, are never placed and never count against a card', () => {
    let p = applyReadout(newProgress(PACKS), [{ pack: 'one-step', rec: 5 }]);
    expect(states(p, 'one-step')).toEqual([N, N, P, P, N]);
    p = placeLevels(p, 'strange-solutions', 10);
    p = completeLevel(completeLevel(completeLevel(p, 'strange-solutions', 1), 'strange-solutions', 2), 'strange-solutions', 3);
    expect(isPackComplete(p, 'strange-solutions')).toBe(true);
    expect(p.packs['strange-solutions'].levels.slice(3)).toEqual([false, false]);
    expect(packById('strange-solutions').lastLevel).toBe(3);
    expect(SECTIONS.length).toBe(4);
  });
});
