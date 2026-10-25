import { describe, it, expect } from 'vitest';
import { makeAddBoth } from '../src/engine/addBoth.js';
import { boardText } from '../src/engine/addBothMoves.js';
import { reduceAddBoth } from '../src/engine/cards/add.js';
import { newLightsSession, withLights, lightsAnswerLive, canGrab, lightsSummary } from '../src/engine/addBothLights.js';
import { slotsFor, outcomeOf, termText, sideText, crossedText, AUTO_COMBINE_FROM_LEVEL } from '../src/engine/lightsGrab.js';

// Round 2 of the lights experiment, Part B (SPEC-LIGHTS-EXPERIMENT-ADD-rev02.md): grabbing the terms of the newest row.
const reduce = withLights(reduceAddBoth);
const run = (s, ...actions) => actions.reduce(reduce, s);
const typed = (text) => [...text].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'toggleSign' }));
const plus = () => newLightsSession({ ...makeAddBoth('x+a', 8, 3), logLevel: 2 }, { level: 2 });    // x + 8 = 11
const minus = () => newLightsSession({ ...makeAddBoth('x-a', 4, 1), logLevel: 3 }, { level: 3 });   // x − 4 = −3
const id = (s, side, i) => s.board[side][i].id;
const drop = (s, side, i, slot, how = 'pointer') => run(s, { type: 'lxDrop', id: id(s, side, i), slot, how });

describe('rows are written as they are said (B4)', () => {
  it('a negative number after the first term is subtraction; the first term keeps its sign', () => {
    const s = minus();
    expect(sideText(s.board.left)).toBe('x − 4');
    expect(sideText(s.board.right)).toBe('−3');
    expect(sideText(s.board.left, [id(s, 'left', 1)])).toBe('x + −4');
    expect(termText({ kind: 'num', v: -2 }, 0).body).toBe('−2');
    expect([crossedText(-2), crossedText(8)]).toEqual(['+ 2', '− 8']);
  });
});

describe('cross the border (B2)', () => {
  it('dropping the number across writes the same rows as the Add move, and is judged as one', () => {
    expect(boardText(drop(plus(), 'left', 1, { side: 'right', at: 0 }).board)).toBe('x = −8 + 11');   // it lands where it is dropped (Build D)
    const s = drop(plus(), 'left', 1, { side: 'right', at: 1 });
    expect(boardText(s.board)).toBe('x = 11 + −8');
    expect(s.rows.map((r) => r.type)).toEqual(['eq', 'work', 'eq']);
    expect(s.work.amount).toBe(-8);
    expect(s.lights).toEqual({ fewer: 'green', solved: 'green' });
    expect(s.needUndo).toBe(false);
    expect(s.lx.log.outcomes).toMatchObject({ cross: 1, keyboard: 0 });
    expect(s.lx.log.drags).toBe(1);
    // the same as choosing Add and typing −8
    const t = run(plus(), { type: 'choose', move: 'add' }, ...typed('-8'), { type: 'go' });
    expect([boardText(t.board), t.rows.length, t.lights, t.work]).toEqual([boardText(s.board), s.rows.length, s.lights, s.work]);
  });
  it('a subtracted number crosses as its opposite: x − 4 = −3 → x − 4 + 4 = −3 + 4', () => {
    const s = drop(minus(), 'left', 1, { side: 'right', at: 1 });
    expect(s.work.amount).toBe(4);
    expect(boardText(s.board)).toBe('x = −3 + 4');
  });
  it('only numbers cross: x snaps back with one line, nothing else changes', () => {
    const s0 = plus();
    const s = drop(s0, 'left', 0, { side: 'right', at: 1 });
    expect(s.board).toEqual(s0.board);
    expect(s.feedback.key).toBe('lxXCross');
    expect(s.lx.log.outcomes.snapBack).toBe(1);
    expect(outcomeOf(s0.board, id(s0, 'left', 0), { side: 'right', at: 0 }).kind).toBe('snapX');
  });
  it('the keyboard route: a carried term dropped with Enter is counted as keyboard', () => {
    const s0 = plus();
    const slots = slotsFor(s0.board, id(s0, 'left', 1));
    expect(slots.map((x) => `${x.side}:${x.at ?? `onto ${x.onto}`}`)).toEqual(['left:0', 'left:1', 'right:0', 'right:1']);
    let s = run(s0, { type: 'ui', patch: { carry: { id: id(s0, 'left', 1), slot: slots[2] } } });
    expect(s.ui.carry.slot.side).toBe('right');
    s = run(s, { type: 'lxDrop', id: id(s0, 'left', 1), slot: slots[2], how: 'key' });
    expect(s.lx.log.outcomes).toMatchObject({ cross: 1, keyboard: 1 });
    expect(s.ui.carry).toBe(null);
  });
  it('Esc puts a carried term back', () => {
    const s0 = plus();
    const s = run(s0, { type: 'ui', patch: { carry: { id: id(s0, 'left', 1), slot: { side: 'right', at: 0 } } } }, { type: 'lxCancel' });
    expect([s.ui.carry, s.board]).toEqual([null, s0.board]);
  });
});

describe('reorder (B1) and the minus (B4)', () => {
  it('reordering replaces the newest row in place, is never judged, and Undo takes it back', () => {
    const s0 = plus();
    const s = drop(s0, 'left', 1, { side: 'left', at: 0 });
    expect(boardText(s.board)).toBe('8 + x = 11');
    expect(s.rows.length).toBe(1);
    expect(s.rows[0].board).toBe(s.board);
    expect(s.lights).toEqual(s0.lights);
    const u = run(s, { type: 'undo' });
    expect(boardText(u.board)).toBe('x + 8 = 11');
    expect([u.menu, u.feedback.key]).toEqual([null, 'lxUndone']);
  });
  it('dropping a term back where it was does nothing (a snap back)', () => {
    const s0 = plus();
    const s = drop(s0, 'left', 1, { side: 'left', at: 1 });
    expect(s.board).toEqual(s0.board);
    expect(s.lx.log.outcomes.snapBack).toBe(1);
  });
  it('tapping a subtracted number\'s minus shows it as a negative, tapping again restores it; Undo covers it; no light changes', () => {
    const s0 = minus();
    const t = id(s0, 'left', 1);
    let s = run(s0, { type: 'lxMinus', id: t });
    expect(s.lx.negIds).toEqual([t]);
    expect(s.feedback.key).toBe('lxNegShown');
    expect(s.lights).toEqual(s0.lights);
    expect(run(s, { type: 'lxMinus', id: t }).lx.negIds).toEqual([]);
    expect(run(s, { type: 'undo' }).lx.negIds).toEqual([]);
    expect(lightsSummary(run(s, { type: 'lxMinus', id: t })).minusTaps).toBe(2);
    // a first term, or a positive one, has no minus to tap
    expect(run(s0, { type: 'lxMinus', id: id(s0, 'right', 0) })).toBe(s0);
    expect(run(plus(), { type: 'lxMinus', id: id(plus(), 'left', 1) }).lx.negIds).toEqual([]);
  });
});

describe('combine like terms (B3)', () => {
  const crossed = () => run(drop(plus(), 'left', 1, { side: 'right', at: 1 }), { type: 'lxNext' });   // x = 11 + −8, committed
  it('a number dropped onto a like term opens a blank for the sum; the pad types into it; x = waits', () => {
    const c = crossed();
    const s = drop(c, 'right', 1, { side: 'right', onto: id(c, 'right', 0) });
    expect(s.lx.combine).toMatchObject({ a: id(c, 'right', 1), b: id(c, 'right', 0), entry: '' });
    expect(s.feedback).toMatchObject({ key: 'lxCombineAsk', params: { sum: '11 − 8' } });
    expect(lightsAnswerLive(s)).toBe(false);
    expect(canGrab(s)).toBe(false);
    expect(run(s, ...typed('3')).lx.combine.entry).toBe('3');
  });
  it('a wrong sum is red and named, and counted; the next key starts again; Undo goes back to the empty blank, a second Undo closes it', () => {
    const c = crossed();
    let s = run(drop(c, 'right', 1, { side: 'right', onto: id(c, 'right', 0) }), ...typed('5'), { type: 'lxApply' });
    expect(s.feedback).toMatchObject({ key: 'lxCombineWrong', bad: true, params: { sum: '11 − 8', typed: '5' } });
    expect(s.lx.combine.wrong).toBe(true);
    expect(lightsSummary(s).sumsWrong).toBe(1);
    expect(run(s, ...typed('3')).lx.combine).toMatchObject({ entry: '3', wrong: false });
    s = run(s, { type: 'undo' });                                                   // (Build T, Part 3: back to the blank)
    expect(s.lx.combine).toMatchObject({ entry: '', wrong: false });
    expect([s.feedback.key, s.ui.focus]).toEqual(['lxCombineRetry', 'sum']);
    s = run(s, { type: 'undo' });
    expect([s.lx.combine, boardText(s.board)]).toEqual([null, 'x = 11 + −8']);
  });
  it('the right sum writes a new row with one term; the by-hand Fewer terms and Solved for x light; Undo takes it back', () => {
    const c = crossed();
    const s = run(drop(c, 'right', 1, { side: 'right', onto: id(c, 'right', 0) }), ...typed('3'), { type: 'go' });
    expect(boardText(s.board)).toBe('x = 3');
    expect(s.rows.length).toBe(c.rows.length + 1);
    expect(s.lx.hand.fewer).toBe('green');
    expect(s.lights.solved).toBe('green');
    expect(s.lights.fewer).toBe(c.lights.fewer);
    expect(lightsAnswerLive(s)).toBe(true);
    const u = run(s, { type: 'undo' });
    expect([boardText(u.board), u.rows.length, u.lx.hand.fewer]).toEqual(['x = 11 + −8', c.rows.length, 'off']);
  });
  it('combining is never automatic in this round', () => {
    expect(AUTO_COMBINE_FROM_LEVEL).toBe(Infinity);
  });
});

describe('logging (rev 0.2)', () => {
  it('light and move hovers are counted once per look, by which', () => {
    let s = run(plus(), { type: 'ui', patch: { light: 'fewer' } }, { type: 'ui', patch: { light: 'fewer' } }, { type: 'ui', patch: { light: null } }, { type: 'ui', patch: { light: 'solved' } });
    s = run(s, { type: 'ui', patch: { hoverMove: 'flip' } });
    const l = lightsSummary(s);
    expect(l.lightHovers).toEqual({ fewer: 1, solved: 1 });
    expect(l.moveHovers).toEqual({ flip: 1 });
  });
});
