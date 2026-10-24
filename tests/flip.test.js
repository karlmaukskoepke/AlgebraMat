import { describe, it, expect } from 'vitest';
import { makeFlip, formatFlip, tagFlip } from '../src/engine/flip.js';
import { generateFlipLevel, worstCaseRows, slipCollisions, stackRowsFor } from '../src/engine/generateFlip.js';
import { newFlip, reduceFlip, FLIP_MENU, FLIP_SPOT, applyFlip, startBoard } from '../src/engine/cards/flip.js';
import { withSpotlight, spotOf } from '../src/engine/spotlight.js';
import { boardText, substitutionLines, lineText } from '../src/engine/solveTerms.js';
import { shapeOf, shapeOfBoard, lightsOf } from '../src/engine/solveit/shape.js';
import { flipFeedbackText } from '../src/view/flipFeedback.js';
import { addBothFeedbackText } from '../src/view/addBothFeedback.js';
import { makeRecord } from '../src/engine/eventlog.js';
import { PACKS, SECTIONS, flipEverything } from '../src/packs/index.js';
import { newProgress, encodeProgress, decodeProgress, CODE_VERSION } from '../src/engine/progress.js';

// Build J: Flip everything in basic form, a configuration of the shared loop.
const r = withSpotlight(FLIP_MENU.withMenu(reduceFlip), FLIP_SPOT);
const go = (s, ...a) => a.reduce(r, s);
const keys = (t) => [...String(t)].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'typeChar', ch }));
const flip = [{ type: 'flipPick' }, { type: 'go' }];
// (Build L: taking 1/3 is dividing by 3 on Multiply's Divide option, and −1/3 is dividing by −3)
const frac = (text) => { const [top, n] = text.split('/'); return [{ type: 'divPick' }, ...(top.startsWith('-') ? [{ type: 'typeChar', ch: '-' }] : []), ...keys(n), { type: 'go' }]; };
const check = (v) => [...keys(v), { type: 'check' }, { type: 'placeValue' }, { type: 'nextLine' }, { type: 'nextLine' }];
const said = (s) => flipFeedbackText(s.feedback);
const seeds = 200;

describe('the generator: every level, 200 seeds', () => {
  for (let level = 2; level <= 6; level++) {
    it(`saved Level ${level}: verified, whole answers never 0, ±1 or ±a, no repeats, both signs of b`, () => {
      for (let seed = 1; seed <= seeds; seed++) {
        const set = generateFlipLevel(level, seed);
        expect(set).toHaveLength(5);
        expect(new Set(set.map((p) => p.x)).size).toBe(5);                                   // no repeated answers (so no repeated equations)
        expect(set.filter((p) => p.b > 0).length).toBeGreaterThanOrEqual(2);
        expect(set.filter((p) => p.b < 0).length).toBeGreaterThanOrEqual(2);
        for (const p of set) {
          expect(-p.a * p.x).toBe(p.b);                                                       // verified by substitution
          expect(substitutionLines(startBoard(p), p.x).ok).toBe(true);
          expect([0, 1, -1]).not.toContain(p.x);
          if (p.a > 1) expect([p.a, -p.a]).not.toContain(p.x);
          expect(Math.abs(p.b)).toBeLessThanOrEqual(36);
          expect(Number.isInteger(p.x)).toBe(true);
        }
        if (level === 2) expect(set.every((p) => p.a === 1 && !p.mirror)).toBe(true);
        if (level === 3) expect(set.every((p) => p.a === 1 && p.mirror)).toBe(true);
        if (level === 4) { expect(set.every((p) => p.a > 1 && !p.mirror)).toBe(true); expect(new Set(set.map((p) => p.a)).size).toBeGreaterThanOrEqual(3); }
        if (level >= 5) {
          for (const [a1, m] of [[true, false], [true, true], [false, false], [false, true]]) expect(set.some((p) => (p.a === 1) === a1 && p.mirror === m)).toBe(true);
          expect(set.filter((p) => p.mirror).length).toBeGreaterThanOrEqual(2);
        }
        if (level === 6) expect(set.filter((p) => Math.abs(p.x) >= 8).length).toBeGreaterThanOrEqual(3);
      }
    });
  }
  it('saved Level 1 (numbers only, not built) plays the first equation level; the worst case and the slip collisions are reported', () => {
    expect(generateFlipLevel(1, 7)).toEqual(generateFlipLevel(2, 7));
    expect([2, 3, 4, 5, 6].map((l) => worstCaseRows(l).total)).toEqual([9, 10, 10, 11, 11]);
    expect(stackRowsFor(makeFlip(3, -4, true))).toEqual({ moves: 5, answer: 2, check: 4, total: 11 });
    expect(slipCollisions(2).counts).toEqual({ 'sign-flipped = ignored-front': 1000 });       // for −x = b, b is the opposite of x
    expect(slipCollisions(4).counts).toEqual({});
  });
  it('makeFlip refuses a banned answer', () => {
    expect(() => makeFlip(1, 1)).toThrow();
    expect(() => makeFlip(3, -3)).toThrow();
    expect(() => makeFlip(2, 0)).toThrow();
  });
});

describe('the check renders as the loop spec says (§4)', () => {
  const lines = (p, v) => substitutionLines(startBoard(p), v).lines.map(lineText);
  it('−x = 12, x = −12; 12 = −x, x = −12; −3x = 12, x = −4', () => {
    expect(formatFlip(makeFlip(1, -12))).toBe('−x = 12');
    expect(lines(makeFlip(1, -12), -12)).toEqual(['−(−12) = 12', '12 = 12']);
    expect(lines(makeFlip(1, -12, true), -12)).toEqual(['12 = −(−12)', '12 = 12']);
    expect(lines(makeFlip(3, -4), -4)).toEqual(['−3 × (−4) = 12', '12 = 12']);
  });
});

describe('the moves', () => {
  it('a flip on −x = 12 writes −1 × (−x) = −1 × (12), then x = −(12) (never evaluated); the student types −12', () => {
    let s = go(newFlip(makeFlip(1, -12), { level: 2 }), ...flip);
    expect(s.rows.map((row) => boardText(row.board))).toEqual(['−x = 12', '−1 × (−x) = −1 × (12)', 'x = −(12)']);
    expect(s.lights).toEqual({ noopp: 'green', solved: 'green' });
    expect(spotOf(s, FLIP_SPOT)).toBe(null);
    s = go(s, ...check(-12));
    expect(s.stage).toBe('done');
  });
  it('−3x = 12: flip then ⅓, ⅓ then flip, and −⅓ in one move are all helpful and finish', () => {
    const p = makeFlip(3, -4);
    const a = go(newFlip(p, { level: 4 }), ...flip, { type: 'foldNext' }, ...frac('1/3'));
    expect(boardText(a.board)).toBe('x = ⅓(−12)');
    const b = go(newFlip(p, { level: 4 }), ...frac('1/3'));
    expect([boardText(b.board), b.needUndo, b.lights.noopp]).toEqual(['−x = 4', false, 'neutral']);
    expect(boardText(go(b, { type: 'foldNext' }, ...flip).board)).toBe('x = −(4)');
    const c = go(newFlip(p, { level: 4 }), ...frac('-1/3'));
    expect([boardText(c.board), c.needUndo, c.lights]).toEqual(['x = −⅓(12)', false, { noopp: 'green', solved: 'green' }]);
    for (const s of [a, c]) expect(go(s, ...check(-4)).stage).toBe('done');
  });
  it('a flip of x with no minus (3x = −12) is unhelpful: the spotlight with the real numbers, Undo, then the hint', () => {
    let s = go(newFlip(makeFlip(3, -4), { level: 4 }), ...flip, { type: 'foldNext' }, ...flip);
    expect(boardText(s.board)).toBe('−3x = 12');
    expect(spotOf(s, FLIP_SPOT)).toMatchObject({ kind: 'error', target: 'coef' });
    expect(said(s)).toBe('Flipping 3x = −12 made −3x = 12: now x has a minus. Press Undo.');
    expect(s.lights.noopp).toBe('red');
    expect(go(s, { type: 'check' })).toBe(s);                                                // only Undo
    s = go(s, { type: 'undo' });
    expect(boardText(s.board)).toBe('3x = −12');
    expect(spotOf(s, FLIP_SPOT)).toMatchObject({ kind: 'hint', move: 'divOption' });
    expect(said(s)).toBe('To get one x, divide both sides by 3 (that is, multiply by ⅓): one of the 3 x boxes is ⅓.');
    expect([s.mopts, s.ui.preview]).toEqual([{ kind: null, entry: '', lit: 'div' }, 'div']);   // (Build O: the Divide button lit)
  });
  it('a fraction that does not split gets the shared Divide feedback, and the fraction cycle after Undo', () => {
    let s = go(newFlip(makeFlip(3, -4), { level: 4 }), ...frac('1/2'));
    expect(shapeOf(s).id).toBe('FF');
    expect(said(s)).toBe("3 boxes can't make 2 equal groups. Press Undo and try another fraction.");
    s = go(s, { type: 'undo' });
    expect(spotOf(s, FLIP_SPOT)).toMatchObject({ kind: 'hint', choose: true });
  });
  it('Multiply here (Build O): the whole number is greyed; Divide and the fraction are greyed until saved Level 4; no −1 option', () => {
    const l2 = go(newFlip(makeFlip(1, -5), { level: 2 }), { type: 'multOpen' });
    expect(l2.mopts).toEqual({ kind: null, entry: '' });
    expect(go(l2, { type: 'multPick', kind: 'whole' }).feedback.key).toBe('aLater');
    expect(go(l2, { type: 'divPick' }).feedback.key).toBe('aLaterLevel');
    expect(go(l2, { type: 'multPick', kind: 'frac' }).feedback.key).toBe('aLaterLevel');
    expect(go(l2, { type: 'multPick', kind: 'flip' }).mopts).toBe(null);                       // (not an option: it closes the menu, nothing else)
    expect(boardText(go(newFlip(makeFlip(1, -5), { level: 2 }), ...flip).board)).toBe('x = −(5)');
    expect(go(newFlip(makeFlip(1, -5), { level: 2 }), { type: 'greyMove', move: 'add' }).feedback.key).toBe('aLater');
    expect(addBothFeedbackText({ key: 'aLater' })).toBe('That move unlocks on a later card.');
  });
  it('Trade places on b = −x (from saved Level 3): either order is helpful; the first time it is pointed out, with the symmetric property', () => {
    const p = makeFlip(1, 7, true);
    const s0 = newFlip(p, { level: 3, introTrade: true });
    expect(addBothFeedbackText(s0.feedback)).toBe('x is on the right. Click “Trade places” to rewrite the equation with x on the left. This is the symmetric property: if a = b, then b = a.');
    const traded = go(s0, { type: 'choose', move: 'trade' });
    expect(boardText(traded.board)).toBe('−x = −7');
    expect(boardText(go(traded, ...flip).board)).toBe('x = −(−7)');
    const flipped = go(s0, ...flip);                                                          // flip first, x stays on the right
    expect([boardText(flipped.board), flipped.needUndo]).toEqual(['−(−7) = x', false]);
    expect(go(flipped, ...check(7)).stage).toBe('done');
    expect(go(newFlip(makeFlip(1, 7, true), { level: 2 }), { type: 'choose', move: 'trade' }).feedback.key).toBe('aTradeNot');   // not live before saved Level 3
  });
  it("Divide it's Smaller numbers compares by size, so −3x to −x lights it (and positive coefficients are as before)", () => {
    const b = (coef) => ({ left: [{ kind: 'x', coef }], right: [{ kind: 'num', v: 6 }] });
    expect(lightsOf(shapeOfBoard(b(-3)), shapeOfBoard(b(-1))).smaller).toBe('green');
    expect(lightsOf(shapeOfBoard(b(4)), shapeOfBoard(b(2))).smaller).toBe('green');
    expect(lightsOf(shapeOfBoard(b(2)), shapeOfBoard(b(4))).smaller).toBe('off');
  });
  it('applyFlip leaves the other side as the opposite of the number only when x is alone', () => {
    expect(boardText(applyFlip(startBoard(makeFlip(1, 4, true))).next)).toBe('−(−4) = x');
    expect(boardText(applyFlip(startBoard(makeFlip(2, 4))).next)).toBe('2x = 8');
  });
});

describe('the help (basic form: the reminder only)', () => {
  it("I'm stuck lights Flip everything with its preview and says why in the real numbers, every time", () => {
    let s = go(newFlip(makeFlip(1, -12), { level: 2 }), { type: 'stuck' });
    expect([said(s), s.ui.preview]).toEqual(['−x means x has a minus. To get rid of it, multiply both sides by −1: Flip everything.', 'flip']);
    s = go(s, { type: 'stuck' });
    expect(s.stuck).toBe(2);
    expect(said(s)).toMatch(/^−x means x has a minus/);
    const t = go(newFlip(makeFlip(3, -4), { level: 4 }), { type: 'stuck' });
    expect(said(t)).toBe('−3x has a minus. To get rid of it, multiply both sides by −1: Flip everything. Then divide both sides by 3 (that is, multiply by ⅓).');
    const u = go(newFlip(makeFlip(1, -12), { level: 2 }), ...flip, { type: 'stuck' });
    expect(said(u)).toBe('x is alone. −(12) means the opposite of 12. Work it out and type x.');
    expect(s.supportsShown).toEqual(['hint']);
  });
  it('typed 12 for −x = 12 (the sign ignored): Not balanced, then after Undo the hint lights Flip everything with its preview', () => {
    let s = go(newFlip(makeFlip(1, -12), { level: 2 }), ...check(12));
    expect([s.sub.tag, spotOf(s, FLIP_SPOT).kind]).toEqual(['sign-flipped', 'error']);
    s = go(s, { type: 'undo' });
    expect(spotOf(s, FLIP_SPOT)).toMatchObject({ kind: 'hint', move: 'flip' });
    expect(s.ui.preview).toBe('flip');
    expect(said(s)).toBe('−x = 12 means the opposite of x is 12, so x is not 12. Flip everything: multiply both sides by −1.');
    const rec = makeRecord(go(s, ...flip, ...check(-12)), { t: 0, pack: 'flip-everything', level: 2, problem: '−x = 12' });
    expect(rec.supports).toEqual(['hint']);
  });
  it('typed 4 for −3x = 12 (the wrong sign): the same hint; the tags are the existing words', () => {
    const p = makeFlip(3, -4);
    let s = go(newFlip(p, { level: 4 }), ...check(4));
    expect(s.sub.tag).toBe('sign-flipped');
    s = go(s, { type: 'undo' });
    expect(spotOf(s, FLIP_SPOT)).toMatchObject({ kind: 'hint', move: 'flip' });
    expect(said(s)).toBe('In −3x = 12 the minus belongs to x. Flip everything first: multiply both sides by −1.');
    expect([12, -12, 3, -3, 5].map((v) => tagFlip(p, v))).toEqual(['ignored-front', 'ignored-front', 'gave-boxes', 'gave-boxes', 'unmatched']);
  });
  it('the forced move: after a correct first guess, x = waits for a move and the needed move is ringed', () => {
    const s = newFlip(makeFlip(1, -5), { level: 2, forceMove: true });
    expect(s.mustMove).toBe(true);
    expect(go(s, ...keys('-5'))).toBe(s);                                                     // x = is greyed until a move is made
    expect(go(s, ...flip, ...check(-5)).stage).toBe('done');
  });
});

describe('the pack, the home screen and the save codes', () => {
  it('a new card in Solve it, after Divide it and before One-step equations, with six saved levels and no "See why it works" yet', () => {
    expect(SECTIONS.find((x) => x.id === 'solve').packs.slice(0, 4)).toEqual(['add-both', 'divide-it', 'flip-everything', 'one-step']);
    expect(flipEverything).toMatchObject({ id: 'flip-everything', title: 'Flip everything', levels: 6, firstLevel: 2 });
    expect(flipEverything.whyLevel).toBeUndefined();
    expect(PACKS.find((p) => p.id === 'flipit').title).not.toBe('Flip everything');
  });
  it('v15 codes carry its six levels; v14 codes decode exactly as before', () => {
    expect(CODE_VERSION).toBe(18);                                                          // (v18: Variables on both sides, Build R)                                                          // (v16 appends the Two-step card, Build K; v17 Distribute, Build M)
    const prog = newProgress(PACKS);
    prog.packs['flip-everything'].levels = [false, true, true, false, true, false];
    prog.packs['divide-it'].levels = [true, true, false, false, false, false];
    const code = encodeProgress(prog, 15);
    expect(code).toMatch(/^MAT-H/);
    expect(decodeProgress(code, PACKS).packs['flip-everything'].levels).toEqual([false, true, true, false, true, false]);
    const v14 = encodeProgress(prog, 14);
    const back = decodeProgress(v14, PACKS);
    expect(back.packs['divide-it'].levels).toEqual([true, true, false, false, false, false]);
    expect(back.packs['flip-everything'].levels.every((d) => !d)).toBe(true);                // v14 has no room for it
  });
});

// Build J: the v15 layout is appended at the end, so every code written before it still means the same: each of the parity harness's
// 72 recorded v14 codes decodes, re-encodes as the same v14 code, and carries over into v15 with the same levels.
import { readFileSync } from 'node:fs';
describe('older save codes keep their meaning', () => {
  const baseline = JSON.parse(readFileSync(new URL('./parity/baseline/savecodes.json', import.meta.url), 'utf8'));
  it('every recorded v14 code decodes to the same progress, and v15 carries it unchanged', () => {
    expect(Object.keys(baseline)).toHaveLength(72);
    for (const [name, { code, roundTrip }] of Object.entries(baseline)) {
      const p = decodeProgress(code, PACKS);
      expect(p, name).toBeTruthy();
      if (roundTrip) expect(encodeProgress(p, 14), name).toBe(code);
      const again = decodeProgress(encodeProgress(p), PACKS);
      for (const id of Object.keys(p.packs)) expect(again.packs[id].levels, `${name} ${id}`).toEqual(p.packs[id].levels);
    }
  });
});
