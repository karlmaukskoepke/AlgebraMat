import { describe, it, expect } from 'vitest';
import { makeAddBoth } from '../src/engine/addBoth.js';
import { reduceAddBoth, newAddBoth, boardText } from '../src/engine/addBothMoves.js';
import { makeRecord } from '../src/engine/eventlog.js';

// Help at x alone (Build C, Part 3): Party/Battle at the two numbers, then x =, then Count it's counters walk on them (read-only).
const run = (s, ...a) => a.reduce(reduceAddBoth, s);
const typed = (text) => [...text].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'toggleSign' }));
const cnt = (act) => ({ type: 'cnt', act });
const alone = () => run(newAddBoth(makeAddBoth('x+a', 8, 3), { level: 2 }), { type: 'choose', move: 'add' }, ...typed('-8'), { type: 'go' });   // x = 11 + −8
const draw = (s, sign, zone, n) => run(s, cnt({ type: 'pickSign', sign }), ...Array(n).fill(cnt({ type: 'tapZone', zone })));

describe('the counters walk at x = 11 + −8', () => {
  it('runs Count it\'s walk on the two numbers: draw, Party/Battle (skipped once answered), cancel, then x = is typed', () => {
    let s = run(alone(), { type: 'stuck' }, { type: 'kind', value: 'battle' }, { type: 'stuck' });
    expect(s.alone.walk.step).toBe('draw');
    s = draw(draw(s, '+', 0, 11), '-', 1, 8);
    s = run(s, cnt({ type: 'check' }));
    expect(s.alone.walk.step).toBe('cancel');                                           // Battle was answered at the numbers
    for (let k = 0; k < 8; k++) s = run(s, cnt({ type: 'tapCounter', zone: 0, index: k }), cnt({ type: 'tapCounter', zone: 1, index: k }));
    expect([s.alone.walk.step, s.feedback.key, s.entry]).toEqual(['answer', 'aAloneCount', '']);   // never the value
    expect(run(s, cnt({ type: 'digit', digit: 3 }))).toBe(s);                         // the value goes in x =, not the walk
    s = run(s, ...typed('3'), { type: 'check' }, { type: 'nextLine' }, { type: 'nextLine' }, { type: 'nextLine' });
    expect(s.stage).toBe('done');
    const r = makeRecord(s, { t: 0, pack: 'add-both', level: 2, problem: 'x + 8 = 11' });
    expect(r.supports).toEqual(['hint', 'model', 'crossoff']);                          // the existing words only; crossoff because they cancelled
    expect(r.answers).toEqual([]);                                                      // the walk's tries stay in the walk
  });
  it('Teach me starts at the counters and keeps the walk\'s own Party/Battle (it was not answered)', () => {
    let s = run(alone(), { type: 'teach' });
    s = run(draw(draw(s, '+', 0, 11), '-', 1, 8), cnt({ type: 'check' }));
    expect(s.alone.walk.step).toBe('partyBattle');
    expect(run(s, cnt({ type: 'choose', choice: 'battle' })).alone.walk.step).toBe('cancel');
  });
  it('numbers past Count it\'s 12 a side get the sum in words instead; Undo clears the help', () => {
    let s = run(newAddBoth(makeAddBoth('x+a', 3, 11), { level: 4 }), { type: 'choose', move: 'add' }, ...typed('-3'), { type: 'go' });   // x = 14 + −3
    s = run(s, { type: 'stuck' }, { type: 'stuck' });
    expect([boardText(s.board), s.alone, s.feedback.key]).toEqual(['x = 14 + −3', null, 'aStuckSum']);
    const u = run(run(alone(), { type: 'stuck' }), { type: 'undo' });
    expect(u.alone).toBe(null);
  });
});
