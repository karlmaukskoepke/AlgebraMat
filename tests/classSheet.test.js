// teacher/Code.gs is Google Apps Script. Here it runs against a small in-memory stand-in for the sheet, so its merging,
// de-duplication and clean-up are tested for real (the Google-side deployment is not).
import { describe, it, expect } from 'vitest';

import { FakeBook, gs } from './helpers/fakeSheet.js';

const auth = { period: '3', number: '12' };
const ev = (t, extra = {}) => ({ t, pack: 'value', level: 1, problem: '2x + 6, x = 4', answers: [{ typed: '30', tag: 'no-parens' }], supports: ['substitute'], stuck: 0, taught: 0, clean: false, ...extra });
const send = (book, req) => gs.handle({ v: 1, auth, ...req }, book);

describe('the class sheet script', () => {
  it('knows a student by period and number, cleaned up, and refuses anything else', () => {
    expect(gs.identify({ period: ' 3 ', number: 'a12' })).toEqual({ id: '3-A12', period: '3', number: 'A12' });
    expect(() => gs.identify({ period: '3', number: '' })).toThrow();
    expect(() => gs.identify({ period: '3', number: 'a b' })).toThrow();
    expect(() => gs.identify(null)).toThrow();
  });

  it('refuses another protocol version', () => {
    expect(() => gs.handle({ v: 2, auth }, new FakeBook())).toThrow(/version/);
  });

  it('adds a student, their levels, and answers with the merged progress', () => {
    const book = new FakeBook();
    const res = send(book, { progress: { packs: { flipit: { levels: [true, true, false] }, 'groups-of-terms': { levels: [true], open: 3 } } } });
    expect(res.ok).toBe(true);
    expect(res.progress.packs.flipit.levels).toEqual([true, true, false]);
    expect(res.progress.packs['groups-of-terms']).toEqual({ levels: [true], open: 3 });
    expect(book.sheets.Students.rows).toHaveLength(2);
    expect(book.sheets.Students.rows[1].slice(0, 3)).toEqual(['3-12', '3', '12']);
    expect(book.sheets.Progress.rows[0].slice(0, 4)).toEqual(['StudentID', 'Period', 'Number', 'LastSync']);
  });

  it('keeps a level finished on either device, and never loses one', () => {
    const book = new FakeBook();
    send(book, { progress: { packs: { flipit: { levels: [true, false, false] } } } });
    const res = send(book, { progress: { packs: { flipit: { levels: [false, true, false] } } } });
    expect(res.progress.packs.flipit.levels).toEqual([true, true, false]);
    expect(send(book, { progress: { packs: {} } }).progress.packs.flipit.levels).toEqual([true, true, false]);
    expect(book.sheets.Students.rows).toHaveLength(2);       // still one student
  });

  it('keeps students apart, and a new level adds a column', () => {
    const book = new FakeBook();
    send(book, { progress: { packs: { flipit: { levels: [true] } } } });
    gs.handle({ v: 1, auth: { period: '4', number: '7' }, progress: { packs: { flipit: { levels: [false, true] } } } }, book);
    expect(book.sheets.Progress.rows).toHaveLength(3);
    expect(book.sheets.Progress.rows[0]).toContain('flipit-2');
    const again = send(book, {});
    expect(again.progress.packs.flipit.levels).toEqual([true, false]);
  });

  it('adds each problem and run once, however often the phone sends them', () => {
    const book = new FakeBook();
    const req = { events: [ev(1000), ev(2000, { clean: true })], runs: [{ c: 'adding', s: 14, t: 3000, tier: 2 }] };
    expect(send(book, req).added).toEqual({ events: 2, runs: 1 });
    expect(send(book, req).added).toEqual({ events: 0, runs: 0 });
    expect(send(book, { events: [ev(1000), ev(4000)] }).added.events).toBe(1);
    const log = book.sheets.Log.rows;
    expect(log).toHaveLength(4);
    expect(log[1].slice(2, 7)).toEqual(['value', 1, '2x + 6, x = 4', '30 → no-parens', 'substitute']);
    expect(log[2][9]).toBe(true);
    expect(book.sheets.Fluency.rows[1].slice(0, 6)).toEqual(['3-12', new Date(3000).toISOString(), 'adding', 14, 2, '3-12|3000|adding']);
  });

  it('keeps anything that looks like a formula as text, and ignores junk', () => {
    expect(gs.safe('=1+1')).toBe("'=1+1");
    expect(gs.safe('−3x')).toBe('−3x');
    const book = new FakeBook();
    const res = send(book, { events: [ev(1, { problem: '=HYPERLINK("x")' }), null, { t: 'no' }], runs: [{ c: 5, s: 1, t: 1 }, 'x'], progress: { packs: { 'BAD PACK': { levels: [true] } } } });
    expect(res.added).toEqual({ events: 1, runs: 0 });
    expect(book.sheets.Log.rows[1][4]).toBe("'=HYPERLINK(\"x\")");
    expect(book.sheets.Progress.rows[0]).toHaveLength(4);
  });

  it('reads the pack and level out of a column name', () => {
    expect(gs.splitKey('groups-of-terms-3')).toEqual({ pack: 'groups-of-terms', level: 3 });
    expect(gs.splitKey('boxes-open')).toEqual({ pack: 'boxes', open: true });
    expect(gs.splitKey('StudentID')).toBe(null);
  });
});
