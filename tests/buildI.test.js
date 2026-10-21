import { describe, it, expect } from 'vitest';
import { equationSegs, substitutionLines } from '../src/engine/solveTerms.js';

const text = (segs) => segs.map((s) => s.text).join('');
const blues = (segs) => segs.filter((s) => s.cls.split(' ').includes('is-blue'));

describe('Build I, Part 1: the check writes the equation itself, then the value under each x', () => {
  it('line 1 is the equation as written, with every x blue and numbered left to right', () => {
    const cases = [
      [{ left: [{ kind: 'x' }, { kind: 'num', v: 8 }], right: [{ kind: 'num', v: -4 }] }, 'x + 8 = −4'],
      [{ left: [{ kind: 'x', coef: 5 }], right: [{ kind: 'num', v: -15 }] }, '5x = −15'],
      [{ left: [{ kind: 'num', v: 12 }], right: [{ kind: 'x', coef: -1 }] }, '12 = −x'],
      [{ left: [{ kind: 'num', v: 7 }], right: [{ kind: 'x' }, { kind: 'num', v: 3 }] }, '7 = x + 3'],
      [{ left: [{ kind: 'x' }, { kind: 'num', v: 3 }], right: [{ kind: 'x', coef: 2 }, { kind: 'num', v: -1 }] }, 'x + 3 = 2x − 1'],
    ];
    for (const [board, written] of cases) {
      const segs = equationSegs(board);
      expect(text(segs)).toBe(written);
      expect(blues(segs).map((s) => s.text).every((t) => t === 'x')).toBe(true);
      expect(blues(segs).map((s) => s.xi)).toEqual([...Array(blues(segs).length).keys()]);
    }
  });
  it('line 2 has one blue value for each blue x of line 1, in the same order (so each can sit under its x)', () => {
    const board = { left: [{ kind: 'x' }, { kind: 'num', v: 3 }], right: [{ kind: 'x', coef: 2 }, { kind: 'num', v: -1 }] };
    for (const v of [4, -4]) {
      const line2 = substitutionLines(board, v).lines[0].segs;
      expect(blues(line2)).toHaveLength(blues(equationSegs(board)).length);
    }
    expect(text(substitutionLines({ left: [{ kind: 'x', coef: 3 }], right: [{ kind: 'num', v: -12 }] }, -4).lines[0].segs)).toBe('3 × (−4) = −12');
  });
});

// ---------- Part 3: a party of negatives, typed without its sign ----------
import { generateAddBothLevel } from '../src/engine/generateAddBoth.js';
import { constantOf } from '../src/engine/addBoth.js';
import { reduceAddBoth } from '../src/engine/cards/add.js';
import { newLightsSession, withLights, ADD_SPOT } from '../src/engine/addBothLights.js';
import { negativeParty, otherNums } from '../src/engine/addBothMoves.js';
import { withSpotlight, spotOf } from '../src/engine/spotlight.js';
import { makeRecord } from '../src/engine/eventlog.js';
import { addBothFeedbackText } from '../src/view/addBothFeedback.js';

const add = withSpotlight(withLights(reduceAddBoth), ADD_SPOT);
const go = (s, ...actions) => actions.reduce(add, s);
const keys = (text) => [...String(text)].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'toggleSign' }));
// the right move, to x alone with the two numbers still on screen (Trade places first where a level asks for it)
function toXAlone(p, level) {
  let s = newLightsSession(p, { level });
  if (s.feedback?.key === 'aTradeIntro') s = go(s, { type: 'choose', move: 'trade' });
  return go(s, { type: 'choose', move: 'add' }, ...keys(-constantOf(p)), { type: 'go' });
}
// type a value, drop it into x, press Next to the end
function checkValue(s, v) {
  s = go(s, ...keys(v), { type: 'check' }, { type: 'placeValue' });
  for (let i = 0; i < 6 && s.sub && s.stage !== 'done' && !spotOf(s, ADD_SPOT)?.kind?.startsWith('error'); i++) s = go(s, { type: 'nextLine' });
  return s;
}
function shapes() {
  const out = [];
  for (let level = 2; level <= 6; level++) for (let seed = 1; seed <= 40; seed++) for (const p of generateAddBothLevel(level, seed)) out.push({ p: { ...p, logLevel: level }, level });
  return out;
}
const said = (fb) => addBothFeedbackText(fb);

describe('Build I, Part 3: a party of negatives typed without its sign', () => {
  const all = shapes().map(({ p, level }) => ({ p, level, s: toXAlone(p, level) }));
  const parties = all.filter(({ s }) => negativeParty(s.board));
  const battles = all.filter(({ s }) => { const n = otherNums(s.board); return n.length === 2 && Math.sign(n[0].v) !== Math.sign(n[1].v); });
  it('the generators make parties of negatives and battles at x alone (so the tests below test something)', () => {
    expect(parties.length).toBeGreaterThan(50);
    expect(battles.length).toBeGreaterThan(50);
  });
  it('every party of negatives, typed +sum: Not balanced, then after Undo the sign question at the two numbers', () => {
    for (const { p, s: start } of parties) {
      const s = checkValue(start, -p.x);
      expect(spotOf(s, ADD_SPOT)?.kind).toBe('error');
      expect(s.sub.tag).toBe('party-neg-sign');
      const u = go(s, { type: 'undo' });
      const sp = spotOf(u, ADD_SPOT);
      expect(sp).toMatchObject({ kind: 'ask', target: 'otherSide', choiceAction: 'whoWon' });
      expect(sp.choices.map(([, v]) => v)).toEqual(['+', '-']);
      const [a, b] = negativeParty(u.board);
      expect(said(u.feedback)).toBe(`−${-a.v} and −${-b.v} are both negatives. A party of negatives makes ___`);
      expect(u.supportsShown).toContain('hint');
    }
  });
  it('a wrong pick is nudged and asked again; the right pick says "Now type x, and keep the sign." with x = lit, and the student retypes', () => {
    const { p, s: start } = parties[0];
    let s = go(checkValue(start, -p.x), { type: 'undo' }, { type: 'whoWon', value: '+' });
    expect([s.alone.step, s.feedback.key, s.feedback.bad]).toEqual(['sign', 'aNegSignWrong', true]);
    expect(spotOf(s, ADD_SPOT)).toMatchObject({ kind: 'ask', choiceAction: 'whoWon' });
    s = go(s, { type: 'whoWon', value: '-' });
    expect(said(s.feedback)).toBe('Now type x, and keep the sign.');
    expect(spotOf(s, ADD_SPOT)).toMatchObject({ kind: 'ask', target: 'answer', lit: ['otherSide'] });
    expect(s.entry).toBe('');                                                        // the app never writes the value
    s = checkValue(s, p.x);
    expect(s.stage).toBe('done');
    const rec = makeRecord(s, { t: 0, pack: 'add-both', level: 3, problem: 'x' });
    expect(rec.supports).toEqual(['hint']);                                           // the existing word, nothing new
  });
  it('every party of negatives, typed −sum, is correct', () => {
    for (const { p, s } of parties) expect(checkValue(s, p.x).stage).toBe('done');
  });
  it('a battle never gets it (its sign slip keeps today\'s hint), nor a wrong size with the wrong sign', () => {
    for (const { p, s } of battles) {
      const w = checkValue(s, -p.x);
      expect(w.sub.tag).not.toBe('party-neg-sign');
      const u = go(w, { type: 'undo' });
      expect(u.alone?.step).not.toBe('sign');
    }
    for (const { p, s } of parties.slice(0, 20)) {
      const w = checkValue(s, -p.x + 2);
      expect(w.sub.tag).not.toBe('party-neg-sign');
      expect(go(w, { type: 'undo' }).alone?.step).not.toBe('sign');
    }
  });
  it('typed at the first state (x not alone yet), 15 is the old sign-flipped slip, with no sign question', () => {
    const { p, level } = parties[0];
    const s = checkValue(newLightsSession(p, { level }), -p.x);
    expect(s.sub.tag).not.toBe('party-neg-sign');
  });
});
