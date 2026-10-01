import { describe, it, expect } from 'vitest';
import {
  newProgress, encodeProgress, decodeProgress, normalizeProgress, mergeProgress, CODE_ALPHABET,
} from '../src/engine/progress.js';
import { PACKS } from '../src/packs/index.js';

const bitsOf = (n, count, shift = 0) => Array.from({ length: count }, (_, i) => Boolean(n & (1 << (shift + i))));
const state = (flipit, lasso = Array(7).fill(false)) => ({ v: 1, packs: { flipit: { levels: flipit }, lasso: { levels: lasso } } });
const state3 = (flipit, lasso, boxes) => ({ v: 1, packs: { flipit: { levels: flipit }, lasso: { levels: lasso }, boxes: { levels: boxes } } });

// Boxes & Circles isn't playable yet, so it isn't in PACKS; its codes still carry its 5 levels.
const WITH_BOXES = [...PACKS.filter((p) => !p.comingSoon), { id: 'boxes', levels: 5 }];

// Flip It and Group It together: 2^11 = 2048 states (what v2 codes carry).
const allStates = Array.from({ length: 2 ** 11 }, (_, n) => state(bitsOf(n, 4), bitsOf(n, 7, 4)));
// All three packs: 2^16 = 65,536 states.
const allStates3 = Array.from({ length: 2 ** 16 }, (_, n) => state3(bitsOf(n, 4), bitsOf(n, 7, 4), bitsOf(n, 5, 11)));
// A spread of them for the slower typo checks.
const sample = allStates3.filter((_, n) => n % 997 === 0 || n === 65535 || n === 15);

describe('save code v3', () => {
  it('uses no look-alike characters', () => {
    expect(CODE_ALPHABET).toHaveLength(31);
    for (const ch of '01OIL') expect(CODE_ALPHABET).not.toContain(ch);
    expect(new Set(CODE_ALPHABET).size).toBe(31);
  });

  it('round-trips every progress state of all three packs', () => {
    const codes = new Set();
    for (const p of allStates3) {
      const code = encodeProgress(p);
      expect(code).toMatch(/^MAT-5[2-9A-HJKMNP-Z]{5}$/); // "5" is version 3
      expect(decodeProgress(code, WITH_BOXES)).toEqual(p);
      codes.add(code);
    }
    expect(codes.size).toBe(65536);
  });

  it('keeps Boxes & Circles progress out of the game until the pack is playable', () => {
    const p = state3(bitsOf(0b1010, 4), bitsOf(0b11, 7), [true, true, false, false, false]);
    const back = decodeProgress(encodeProgress(p), PACKS);
    expect(back).toEqual(state(bitsOf(0b1010, 4), bitsOf(0b11, 7)));
    expect(back.packs.boxes).toBeUndefined();
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
      expect(decodeProgress(v2, WITH_BOXES)).toEqual({ ...p, packs: { ...p.packs, boxes: { levels: Array(5).fill(false) } } });
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
      .toEqual(state([true, true, true, true]));
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
