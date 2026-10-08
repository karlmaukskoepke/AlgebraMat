import { describe, it, expect } from 'vitest';
import {
  newProgress, encodeProgress, decodeProgress, normalizeProgress, mergeProgress, CODE_ALPHABET,
} from '../src/engine/progress.js';
import { PACKS } from '../src/packs/index.js';

const bitsOf = (n, count, shift = 0) => Array.from({ length: count }, (_, i) => Boolean(n & (1 << (shift + i))));
// Flip It has five levels, Combine it five and Boxes & Circles six now; shorter lists (older saves) are filled out with unfinished levels.
const pad = (levels, n) => [...levels, ...Array(Math.max(0, n - levels.length)).fill(false)];
const state = (flipit, lasso = Array(7).fill(false), boxes = Array(6).fill(false), terms = Array(8).fill(false), combine = Array(5).fill(false), distribute = Array(5).fill(false)) => ({
  v: 1,
  packs: {
    combineit: { levels: pad(combine, 5) }, flipit: { levels: pad(flipit, 5) }, lasso: { levels: lasso }, boxes: { levels: pad(boxes, 6) },
    'groups-of-terms': { levels: terms }, 'distribute-combine': { levels: distribute }, value: { levels: [false, false, false, false] }, 'one-step': { levels: Array(5).fill(false) }, 'two-step': { levels: Array(7).fill(false) },
  },
});
const state3 = state;

const WITH_BOXES = PACKS.filter((p) => !p.comingSoon);

// Flip It and Group It together: 2^11 = 2048 states (what v2 codes carry).
const allStates = Array.from({ length: 2 ** 11 }, (_, n) => state(bitsOf(n, 4), bitsOf(n, 7, 4)));
// All three packs: 2^16 = 65,536 states.
const allStates3 = Array.from({ length: 2 ** 16 }, (_, n) => state3(bitsOf(n, 4), bitsOf(n, 7, 4), bitsOf(n, 5, 11)));
// A spread of them for the slower typo checks.
const sample = allStates3.filter((_, n) => n % 997 === 0 || n === 65535 || n === 15);

// What a code from before Boxes & Circles' read-the-model round (5 levels) comes back as: the round slots in at Level 2,
// counted as done once the old Level 2 was.
const fromFive = (p) => { const b = pad(p.packs.boxes.levels, 6).slice(0, 5); return { ...p, packs: { ...p.packs, boxes: { levels: [b[0], b[1], b[1], b[2], b[3], b[4]] } } }; };

describe('save code v11', () => {
  it('uses no look-alike characters', () => {
    expect(CODE_ALPHABET).toHaveLength(31);
    for (const ch of '01OIL') expect(CODE_ALPHABET).not.toContain(ch);
    expect(new Set(CODE_ALPHABET).size).toBe(31);
  });

  it('round-trips every progress state of all three packs', () => {
    const codes = new Set();
    for (const p of allStates3) {
      const code = encodeProgress(p);
      expect(code).toMatch(/^MAT-D[2-9A-HJKMNP-Z]{13}$/); // "D" is version 11
      expect(decodeProgress(code, WITH_BOXES)).toEqual(p);
      codes.add(code);
    }
    expect(codes.size).toBe(65536);
  }, 60_000); // 65,536 round trips: about 3s here, so a loaded CI runner needs more than the 5s default

  it('carries Groups of Terms progress, and drops it when the pack is not listed', () => {
    const p = state(bitsOf(0b1010, 4), bitsOf(0b11, 7), [true, false, false, false, false], [true, true, false, true, false, false, false, true]);
    expect(decodeProgress(encodeProgress(p), PACKS)).toEqual(p);
    const without = PACKS.filter((q) => q.id !== 'groups-of-terms');
    expect(decodeProgress(encodeProgress(p), without)).toEqual({ ...p, packs: { ...p.packs, 'groups-of-terms': undefined } });
    const all = state(Array(5).fill(true), Array(7).fill(true), Array(6).fill(true), Array(8).fill(true), Array(4).fill(true), Array(5).fill(true));
    expect(decodeProgress(encodeProgress(all), PACKS)).toEqual(all);
  });

  it('carries all five Distribute, then combine rounds, and still reads v5 codes (before it)', () => {
    const p = state(bitsOf(0b1010, 4), bitsOf(0b11, 7), [true, false, false, false, false], Array(8).fill(false), [true, true, false, true], [true, false, true, true, true]);
    expect(decodeProgress(encodeProgress(p), PACKS)).toEqual(p);
    const without = PACKS.filter((q) => q.id !== 'distribute-combine');
    expect(decodeProgress(encodeProgress(p), without)).toEqual({ ...p, packs: { ...p.packs, 'distribute-combine': undefined } });
    // A v5 code, written before this pack: the pack comes back unfinished, and Combine it's four old levels
    // are in their new places (the mixed round at Level 3 counts as done once the old Level 3 was).
    const old = state(bitsOf(0b1010, 4), bitsOf(0b11, 7), [true, false, false, false, false], Array(8).fill(false), [true, true, false, true, false]);
    const v5 = encodeProgress(old, 5);
    expect(v5).toMatch(/^MAT-7[2-9A-HJKMNP-Z]{7}$/);
    expect(decodeProgress(v5, PACKS)).toEqual({ ...fromFive(old), packs: { ...fromFive(old).packs, combineit: { levels: [true, true, false, false, true] } } });
  });

  it('brings Combine it\'s old four levels (v6 and earlier) into the five-level pack', () => {
    // Old levels: 1 battles, 2 parties, 3 three numbers, 4 big numbers. New: 1, 2, 3 mixed, 4 three numbers, 5 big.
    const at = (old) => {
      const p = state([], Array(7).fill(false), Array(6).fill(false), Array(8).fill(false), old.concat([false]));
      return decodeProgress(encodeProgress(p, 6), PACKS).packs.combineit.levels;
    };
    expect(at([true, true, false, false])).toEqual([true, true, false, false, false]);   // the mixed round is still ahead
    expect(at([true, true, true, false])).toEqual([true, true, true, true, false]);      // old Level 3 done: mixed counts as done
    expect(at([true, true, true, true])).toEqual([true, true, true, true, true]);
    expect(at([true, false, false, false])).toEqual([true, false, false, false, false]);
  });

  it('carries all five Combine it levels and Flip It\'s fifth', () => {
    const base = state(bitsOf(0b1010, 4), bitsOf(0b11, 7), [true, false, false, false, false], [true, false, false, false, false, false, false, false]);
    const full = {
      ...base,
      packs: { ...base.packs, flipit: { levels: [false, true, false, true, true] }, combineit: { levels: [true, true, false, true, true] } },
    };
    expect(decodeProgress(encodeProgress(full), PACKS)).toEqual(full);
    // A pack that isn't listed is read and dropped.
    const without = PACKS.filter((p) => p.id !== 'combineit');
    expect(decodeProgress(encodeProgress(full), without).packs.combineit).toBeUndefined();
  });

  it('still reads v4 codes (before Combine it)', () => {
    const p = state(bitsOf(0b0110, 4), bitsOf(0b1011, 7), [true, true, false, false, false], [true, false, true, false, false, false, false, false]);
    const v4 = encodeProgress(p, 4);
    expect(v4).toMatch(/^MAT-6[2-9A-HJKMNP-Z]{6}$/);
    expect(decodeProgress(v4, PACKS)).toEqual(fromFive(p));
    expect(decodeProgress(v4, PACKS).packs.combineit).toEqual({ levels: Array(5).fill(false) });
  });

  it('still reads v3 codes (before Groups of Terms)', () => {
    const p = state3(bitsOf(0b0110, 4), bitsOf(0b1011, 7), [true, true, true, false, false]);
    const v3 = encodeProgress(p, 3);
    expect(v3).toMatch(/^MAT-5[2-9A-HJKMNP-Z]{5}$/);
    expect(decodeProgress(v3, PACKS)).toEqual(fromFive(p));
    expect(decodeProgress(v3, PACKS).packs['groups-of-terms']).toEqual({ levels: Array(8).fill(false) });
  });

  it('carries Boxes & Circles progress', () => {
    const p = state3(bitsOf(0b1010, 4), bitsOf(0b11, 7), [true, true, false, false, false, true]);
    expect(decodeProgress(encodeProgress(p), PACKS)).toEqual(p);
  });

  it('brings Boxes & Circles\' old five levels (v7 and earlier) into the six-level pack, with the new Level 2 in the middle', () => {
    // Old: 1 + terms, 2 subtracting numbers, 3 negative x, 4 subtracting a negative, 5 mixed. New: 1, 2 read the model, 3..6 the old 2..5.
    const at = (old) => {
      const p = state([], Array(7).fill(false), old);
      return decodeProgress(encodeProgress(p, 7), PACKS).packs.boxes.levels;
    };
    expect(at([true, false, false, false, false])).toEqual([true, false, false, false, false, false]);   // the model round is still ahead
    expect(at([true, true, false, false, false])).toEqual([true, true, true, false, false, false]);      // old Level 2 done: the model round counts as done
    expect(at([true, true, true, true, true])).toEqual([true, true, true, true, true, true]);
    expect(at([false, false, false, false, false])).toEqual(Array(6).fill(false));
    // What was saved on the device (5 levels) and what a diagnostic opened shift the same way.
    const saved = normalizeProgress({ packs: { boxes: { levels: [true, true, false, false, false], open: 4 } } }, PACKS);
    expect(saved.packs.boxes).toEqual({ levels: [true, true, true, false, false, false], open: 5 });
    expect(normalizeProgress({ packs: { boxes: { levels: [true, false, false, false, false], open: 1 } } }, PACKS).packs.boxes.open).toBeUndefined();
    // New saves have six levels and are left alone.
    expect(normalizeProgress({ packs: { boxes: { levels: [true, false, true, false, false, false] } } }, PACKS).packs.boxes.levels).toEqual([true, false, true, false, false, false]);
  });

  it('is forgiving about case, spaces, dashes and the prefix', () => {
    const p = allStates3[12345];
    const code = encodeProgress(p);
    const body = code.slice(4);
    for (const typed of [code.toLowerCase(), ` ${code} `, `MAT ${body}`, body, body.toLowerCase(), `${body.slice(0, 2)}-${body.slice(2)}`]) {
      expect(decodeProgress(typed, WITH_BOXES)).toEqual(p);
    }
  });

  it('rejects every single-character mistake', () => {
    for (const p of sample) {
      const body = encodeProgress(p).slice(4);
      for (let i = 0; i < body.length; i++) {
        for (const ch of CODE_ALPHABET) {
          if (ch === body[i]) continue;
          const typo = body.slice(0, i) + ch + body.slice(i + 1);
          expect(decodeProgress(typo, WITH_BOXES), `${body} → ${typo}`).toBeNull();
        }
      }
    }
  });

  it('rejects swapped neighbors when they differ', () => {
    for (const p of sample) {
      const b = encodeProgress(p).slice(4);
      for (let i = 0; i < b.length - 1; i++) {
        if (b[i] === b[i + 1]) continue;
        expect(decodeProgress(b.slice(0, i) + b[i + 1] + b[i] + b.slice(i + 2), WITH_BOXES)).toBeNull();
      }
    }
  });

  it('rejects junk: wrong length, look-alikes, other text, unknown versions', () => {
    for (const junk of ['', 'MAT-', 'MAT-23', 'MAT-2345XY', 'MAT-O0I1Z', 'hello', 'FLP-7K2Q', null, 42]) {
      expect(decodeProgress(junk, PACKS)).toBeNull();
    }
    // A well-formed code with version symbol 4 (unknown), valid checksum.
    const values = [4, 0, 0, 0, 0];
    const check = values.reduce((s, v, i) => s + (i + 2) * v, 0) % 31;
    expect(decodeProgress(`MAT-${[...values, check].map((v) => CODE_ALPHABET[v]).join('')}`, PACKS)).toBeNull();
    // A version 3 code with the wrong number of symbols.
    const short = [3, 0, 0, 0];
    const shortCheck = short.reduce((s, v, i) => s + (i + 2) * v, 0) % 31;
    expect(decodeProgress(`MAT-${[...short, shortCheck].map((v) => CODE_ALPHABET[v]).join('')}`, PACKS)).toBeNull();
  });
});

describe('v2 codes (before Boxes & Circles) still work', () => {
  it('decode every Flip It and Group It state, with Boxes & Circles unfinished', () => {
    for (const p of allStates) {
      const v2 = encodeProgress(p, 2);
      expect(v2).toMatch(/^MAT-4[2-9A-HJKMNP-Z]{4}$/); // "4" is version 2
      expect(decodeProgress(v2, PACKS)).toEqual(p);
      expect(decodeProgress(v2, WITH_BOXES)).toEqual({ ...p, packs: { ...p.packs, boxes: { levels: Array(6).fill(false) } } });
    }
  });
});

describe('v1 codes (before Lasso) still work', () => {
  it('decode every Flip It state, with Lasso unfinished', () => {
    for (let n = 0; n < 16; n++) {
      const p = state(bitsOf(n, 4));
      const v1 = encodeProgress(p, 1);
      expect(v1).toMatch(/^MAT-3[2-9A-HJKMNP-Z]{3}$/); // "3" is version 1
      expect(decodeProgress(v1, PACKS)).toEqual(p);
    }
  });

  it('decode the code shown to students during the v1 build', () => {
    // MAT-3238 was Level 1 of Flip It finished (seen in the Step 6 run).
    expect(decodeProgress('MAT-3238', PACKS)).toEqual(state([true, false, false, false]));
  });
});

describe('normalizeProgress / mergeProgress', () => {
  it('keeps known packs and levels only, and fills gaps', () => {
    expect(normalizeProgress(null, PACKS)).toEqual(newProgress(PACKS));
    expect(normalizeProgress({ packs: { flipit: { levels: [true, 'yes', true] }, ghost: { levels: [true] } } }, PACKS))
      .toEqual(state([true, false, true, false]));
    expect(normalizeProgress({ packs: { flipit: { levels: Array(9).fill(true) } } }, PACKS))
      .toEqual(state([true, true, true, true, true]));   // extra levels are dropped
  });

  it('reads progress saved before Lasso existed', () => {
    expect(normalizeProgress({ v: 1, packs: { flipit: { levels: [true, true, false, false] } } }, PACKS))
      .toEqual(state([true, true, false, false]));
  });

  it('merges so no finished level is ever lost', () => {
    expect(mergeProgress(state([true, true, false, false]), state([true, false, true, false], [true, ...Array(6).fill(false)])))
      .toEqual(state([true, true, true, false], [true, ...Array(6).fill(false)]));
  });
});
