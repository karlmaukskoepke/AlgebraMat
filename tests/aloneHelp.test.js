import { describe, it, expect } from 'vitest';
import { makeAddBoth } from '../src/engine/addBoth.js';
import { boardText } from '../src/engine/addBothMoves.js';
import { reduceAddBoth, newAddBoth } from '../src/engine/cards/add.js';
import { makeRecord } from '../src/engine/eventlog.js';

// Help at x alone (Build C, Part 3): Party/Battle at the two numbers, then x =, then Count it's counters walk on them (read-only).
const run = (s, ...a) => a.reduce(reduceAddBoth, s);
const typed = (text) => [...text].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'toggleSign' }));
const cnt = (act) => ({ type: 'cnt', act });
const alone = () => run(newAddBoth(makeAddBoth('x+a', 8, 3), { level: 2 }), { type: 'choose', move: 'add' }, ...typed('-8'), { type: 'go' });   // x = 11 + −8

describe('the counters walk at x = 11 + −8', () => {
  it('runs Count it\'s walk on the two numbers, drawn (Build F, Part 3): Party/Battle (skipped once answered), the student crosses off, then x = is typed', () => {
    let s = run(alone(), { type: 'stuck' }, { type: 'kind', value: 'battle' }, { type: 'stuck' });
    expect([s.alone.walk.step, s.alone.walk.zones.map((z) => z.length)]).toEqual(['cancel', [11, 8]]);   // Battle was answered at the numbers
    const crossed = (q) => q.alone.walk.zones.map((z) => z.filter((c) => c.canceled).length);
    s = run(s, cnt({ type: 'tapCounter', zone: 1, index: 0 }));                         // a counter: it and an opposite one
    expect([crossed(s), s.alone.walk.step]).toEqual([[1, 1], 'cancel']);
    expect(run(s, cnt({ type: 'tapCounter', zone: 1, index: 0 }))).toBe(s);             // a crossed-off counter: nothing
    s = run(s, cnt({ type: 'tapBox', zone: 0 }));                                       // a whole box: every pair it can
    expect(crossed(s)).toEqual([8, 8]);                                                 // crossed off, and still there
    expect([s.alone.walk.step, s.feedback.key, s.entry]).toEqual(['answer', 'aAloneCount', '']);   // never the value
    expect(run(s, cnt({ type: 'tapBox', zone: 0 }))).toBe(s);                           // nothing left to cross off
    expect(run(s, cnt({ type: 'digit', digit: 3 }))).toBe(s);                         // the value goes in x =, not the walk
    s = run(s, ...typed('3'), { type: 'check' }, { type: 'placeValue' }, { type: 'nextLine' }, { type: 'nextLine' });
    expect(s.stage).toBe('done');
    const r = makeRecord(s, { t: 0, pack: 'add-both', level: 2, problem: 'x + 8 = 11' });
    expect(r.supports).toEqual(['hint', 'model', 'crossoff']);                          // the existing words only; crossoff because they cancelled
    expect(r.answers).toEqual([]);                                                      // the walk's tries stay in the walk
  });
  it('Teach me asks party or battle first; asked again, the counters keep the walk\'s own Party/Battle (it was not answered)', () => {
    let s = run(alone(), { type: 'teach' });
    expect(s.alone.step).toBe('pb');                                                    // Build D: the bubble at the numbers first
    s = run(s, { type: 'teach' });
    expect(s.alone.walk.step).toBe('partyBattle');                                      // drawn, then the walk's own question
    expect(run(s, cnt({ type: 'choose', choice: 'battle' })).alone.walk.step).toBe('cancel');
  });
  it('numbers past Count it\'s 12 a side get Count it\'s big-number walk (Build D): the add or subtract and the sign, never the value', () => {
    let s = run(newAddBoth(makeAddBoth('x+a', 3, 11), { level: 4 }), { type: 'choose', move: 'add' }, ...typed('-3'), { type: 'go' });   // x = 14 + −3
    s = run(s, { type: 'stuck' }, { type: 'kind', value: 'battle' }, { type: 'stuck' });
    expect([boardText(s.board), s.alone.step, s.alone.big.step, s.feedback.key]).toEqual(['x = 14 + −3', 'big', 'addSub', 'aAloneBig']);
    s = run(s, cnt({ type: 'chooseOp', op: 'subtract' }), cnt({ type: 'chooseSign', sign: '+' }));
    expect([s.alone.big.step, s.feedback.key, s.entry]).toEqual(['answer', 'aAloneCount', '']);
    const u = run(run(alone(), { type: 'stuck' }), { type: 'undo' });
    expect(u.alone).toBe(null);
  });
});
