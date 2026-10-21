import { describe, it, expect } from 'vitest';
import { makeAddBoth } from '../src/engine/addBoth.js';
import { boardText } from '../src/engine/addBothMoves.js';
import { reduceAddBoth, newAddBoth } from '../src/engine/cards/add.js';
import { ADD_SPOT } from '../src/engine/addBothLights.js';
import { spotOf } from '../src/engine/spotlight.js';
import { makeRecord } from '../src/engine/eventlog.js';
import { addBothFeedbackText } from '../src/view/addBothFeedback.js';

// Build H, Part 3; Build I, Part 2: past 12 there are no counters. After the right Party or Battle at x = b + k, two small questions at the
// numbers, one at a time: the sign first (who won; a party of what?), and only once that is right the sum; then the student types x.
const run = (s, ...a) => a.reduce(reduceAddBoth, s);
const typed = (text) => [...text].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'toggleSign' }));
const atX = (form, a, x) => run(newAddBoth({ ...makeAddBoth(form, a, x), logLevel: 5 }, { level: 5 }), { type: 'choose', move: 'add' }, ...typed(String(form === 'x-a' ? a : -a)), { type: 'go' });
const spot = (s) => spotOf(s, ADD_SPOT);
const say = (key, params) => addBothFeedbackText({ key, params });

describe('a battle at big numbers: x = 22 − 9', () => {
  const start = () => run(atX('x+a', 9, 13), { type: 'stuck' });
  it('after the right pick asks who won; the sum is not there yet (no dimmed placeholder)', () => {
    expect(boardText(start().board)).toBe('x = 22 + −9');
    let s = run(start(), { type: 'kind', value: 'battle' });
    expect([s.alone.step, s.alone.sizes, s.feedback.key]).toEqual(['who', true, 'aAloneWho']);
    const sp = spot(s);
    expect(sp).toMatchObject({ kind: 'ask', target: 'otherSide', lit: [] });
    expect(sp.bubbles.map((b) => [b.id, b.key])).toEqual([['who', 'aBubbleWho']]);
    expect(say(sp.bubbles[0].key, sp.bubbles[0].params)).toBe('Who won? 22 or −9?');
    expect(sp.bubbles[0].choices.map(([, v]) => v)).toEqual(['+', '-']);
  });
  it('a wrong sign is told why and asked again; the right sign opens the sum and x =; the value is never written', () => {
    let s = run(start(), { type: 'kind', value: 'battle' }, { type: 'whoWon', value: '-' });
    expect([s.alone.step, s.feedback.key, s.feedback.bad]).toEqual(['who', 'aWhoWrong', true]);
    expect(spot(s).bubbles[0].key).toBe('aBubbleWhoWrong');
    s = run(s, { type: 'whoWon', value: '+' });
    expect([s.alone.step, s.alone.who, s.typing, s.entry]).toEqual(['type', '+', 'answer', '']);
    const sp = spot(s);
    expect(sp.lit).toEqual(['answer']);
    expect(sp.bubbles.map((b) => [b.id, Boolean(b.dim), b.picked ?? null])).toEqual([['who', false, '+'], ['op', false, null]]);
    expect(say(sp.bubbles[1].key, sp.bubbles[1].params)).toBe('Subtract 22 − 9 to find how many of the 22 are left.');
    expect(boardText(s.board)).toBe('x = 22 + −9');
  });
  it('typing x ends the questions; the walk (counters) and the class-sheet words are as before', () => {
    let s = run(start(), { type: 'kind', value: 'battle' }, { type: 'whoWon', value: '+' }, ...typed('13'));
    expect([s.alone.step, spot(s), s.entry]).toEqual(['typing', null, '13']);
    s = run(s, { type: 'check' }, { type: 'placeValue' }, { type: 'nextLine' }, { type: 'nextLine' });
    expect(s.stage).toBe('done');
    expect(makeRecord(s, { t: 0, pack: 'add-both', level: 5, problem: 'x + 9 = 22' }).supports).toEqual(['hint']);
  });
  it('typing straight away (before answering who won) also ends them; another I\'m stuck goes on to the big-number walk', () => {
    expect(spot(run(start(), { type: 'kind', value: 'battle' }, ...typed('1')))).toBe(null);
    const s = run(start(), { type: 'kind', value: 'battle' }, { type: 'stuck' });
    expect(s.alone.step).toBe('big');
  });
  it('the sign is told by the bigger team, whichever side it is on', () => {
    const s = run(atX('x-a', 14, -2), { type: 'stuck' });                                
    expect(boardText(s.board)).toBe('x = −16 + 14');
    const q = run(s, { type: 'kind', value: 'battle' }, { type: 'whoWon', value: '+' });
    expect(q.feedback.key).toBe('aWhoWrong');
    expect(run(q, { type: 'whoWon', value: '-' }).alone.step).toBe('type');
  });
});

describe('a party at big numbers: x = −13 − 9 (Build I, Part 2: the same two boxes, so the sign is not lost)', () => {
  const party = () => run(atX('x+a', 9, -22), { type: 'stuck' }, { type: 'kind', value: 'party' });
  it('asks "a party of what?" first, with the + and −; the add is not there yet', () => {
    const s = party();
    expect(boardText(s.board)).toBe('x = −13 + −9');
    expect([s.alone.step, s.feedback.key]).toEqual(['who', 'aAloneParty']);
    const sp = spot(s);
    expect(sp.bubbles.map((b) => [b.id, b.key])).toEqual([['who', 'aBubbleParty']]);
    expect(say(sp.bubbles[0].key, sp.bubbles[0].params)).toBe('A party of what? Pick the sign.');
    expect(sp.bubbles[0].choices.map(([, v]) => v)).toEqual(['+', '-']);
  });
  it('a wrong sign gets a short nudge and is asked again; the right one keeps its box and opens the add, worded with the sign', () => {
    let s = run(party(), { type: 'whoWon', value: '+' });
    expect([s.alone.step, s.feedback.key, s.feedback.bad]).toEqual(['who', 'aPartyWrong', true]);
    expect(say(spot(s).bubbles[0].key, spot(s).bubbles[0].params)).toBe('Not that one. Look at the signs of −13 and −9.');
    expect(spot(s).bubbles).toHaveLength(1);
    s = run(s, { type: 'whoWon', value: '-' });
    expect([s.alone.step, s.alone.who, s.typing, s.feedback.key]).toEqual(['type', '-', 'answer', 'aPartyRight']);
    const sp = spot(s);
    expect(sp.lit).toEqual(['answer']);
    expect(sp.bubbles.map((b) => [b.id, b.picked ?? null])).toEqual([['who', '-'], ['op', null]]);
    expect(say(sp.bubbles[1].key, sp.bubbles[1].params)).toBe('Add 13 + 9 to find how many negatives.');
    expect(boardText(s.board)).toBe('x = −13 + −9');                                          // never the value
  });
  it('a party of positives says positives', () => {
    const s = run(atX('x-a', 9, 22), { type: 'stuck' }, { type: 'kind', value: 'party' }, { type: 'whoWon', value: '+' });
    expect(boardText(s.board)).toBe('x = 13 + 9');
    expect(say(spot(s).bubbles[1].key, spot(s).bubbles[1].params)).toBe('Add 13 + 9 to find how many positives.');
  });
});

describe('up to 12 is as it was: a plain "Now type x"', () => {
  it('x = 11 − 8 has no bubbles', () => {
    const s = run(newAddBoth({ ...makeAddBoth('x+a', 8, 3), logLevel: 2 }, { level: 2 }), { type: 'choose', move: 'add' }, ...typed('-8'), { type: 'go' }, { type: 'stuck' }, { type: 'kind', value: 'battle' });
    expect([s.alone.step, s.alone.sizes ?? false, s.feedback.key]).toEqual(['type', false, 'aAloneRight']);
    expect(spot(s)).toMatchObject({ kind: 'ask', target: 'answer', lit: ['otherSide'] });
    expect(spot(s).bubbles).toBeUndefined();
  });
});
