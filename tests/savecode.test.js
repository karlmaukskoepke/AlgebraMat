import { describe, it, expect } from 'vitest';
import {
  newProgress, encodeProgress, decodeProgress, normalizeProgress, mergeProgress, CODE_ALPHABET,
} from '../src/engine/progress.js';
import { PACKS } from '../src/packs/index.js';

const withLevels = (levels) => ({ v: 1, packs: { flipit: { levels } } });
const allStates = Array.from({ length: 16 }, (_, n) => withLevels([0, 1, 2, 3].map((i) => Boolean(n & (1 << i)))));

describe('save code', () => {
  it('uses no look-alike characters', () => {
    expect(CODE_ALPHABET).toHaveLength(31);
    for (const ch of '01OIL') expect(CODE_ALPHABET).not.toContain(ch);
    expect(new Set(CODE_ALPHABET).size).toBe(31);
  });

  it('round-trips every progress state', () => {
    const codes = new Set();
    for (const p of allStates) {
      const code = encodeProgress(p);
      expect(code).toMatch(/^MAT-[2-9A-HJKMNP-Z]{4}$/);
      expect(decodeProgress(code, PACKS)).toEqual(p);
      codes.add(code);
    }
    expect(codes.size).toBe(16);
  });

  it('is forgiving about case, spaces, dashes and the prefix', () => {
    const p = allStates[5];
    const code = encodeProgress(p);
    const body = code.slice(4);
    for (const typed of [code.toLowerCase(), ` ${code} `, `MAT ${body}`, body, body.toLowerCase(), `${body.slice(0, 2)} ${body.slice(2)}`]) {
      expect(decodeProgress(typed, PACKS)).toEqual(p);
    }
  });

  it('rejects a bad checksum and every single-character mistake', () => {
    for (const p of allStates) {
      const body = encodeProgress(p).slice(4);
      for (let i = 0; i < 4; i++) {
        for (const ch of CODE_ALPHABET) {
          if (ch === body[i]) continue;
          const typo = body.slice(0, i) + ch + body.slice(i + 1);
          expect(decodeProgress(typo, PACKS), `${body} → ${typo}`).toBeNull();
        }
      }
    }
  });

  it('rejects swapped neighbors when they differ', () => {
    for (const p of allStates) {
      const b = encodeProgress(p).slice(4);
      for (let i = 0; i < 3; i++) {
        if (b[i] === b[i + 1]) continue;
        const swapped = b.slice(0, i) + b[i + 1] + b[i] + b.slice(i + 2);
        expect(decodeProgress(swapped, PACKS)).toBeNull();
      }
    }
  });

  it('rejects junk: wrong length, look-alikes, other text', () => {
    for (const junk of ['', 'MAT-', 'MAT-2345X', 'MAT-O0I1', 'hello', 'FLP-7K2Q', null, 42]) {
      expect(decodeProgress(junk, PACKS)).toBeNull();
    }
  });
});

describe('normalizeProgress / mergeProgress', () => {
  it('keeps known packs and levels only, and fills gaps', () => {
    expect(normalizeProgress(null, PACKS)).toEqual(newProgress(PACKS));
    expect(normalizeProgress({ packs: { flipit: { levels: [true, 'yes', true] }, ghost: { levels: [true] } } }, PACKS))
      .toEqual(withLevels([true, false, true, false]));
    expect(normalizeProgress({ packs: { flipit: { levels: [true, true, true, true, true, true] } } }, PACKS))
      .toEqual(withLevels([true, true, true, true]));
  });

  it('merges so no finished level is ever lost', () => {
    expect(mergeProgress(withLevels([true, true, false, false]), withLevels([true, false, true, false])))
      .toEqual(withLevels([true, true, true, false]));
  });
});
