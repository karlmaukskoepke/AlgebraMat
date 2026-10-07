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

// ---------- Google sign-in ----------
import { makeScript } from './helpers/fakeSheet.js';

const CLIENT = '1234567890-abc.apps.googleusercontent.com';
const good = (sub, extra = {}) => ({ aud: CLIENT, sub, iss: 'https://accounts.google.com', exp: String(Math.floor(Date.now() / 1000) + 3000), hd: 'school.org', email: 'kid@school.org', ...extra });
const TOKEN = 'T'.repeat(40);
const google = (extra = {}) => ({ mode: 'google', idToken: TOKEN, period: '3', number: '12', ...extra });

describe('Google sign-in', () => {
  const setup = (props = {}, tokens = { [TOKEN]: good('1099') }) => makeScript({ properties: { GOOGLE_CLIENT_ID: CLIENT, ...props }, tokens });

  it('tells the app whether Google sign-in is on, and whether a number alone still works', () => {
    expect(JSON.parse(makeScript().doGet().text)).toMatchObject({ ok: true, google: null, numberSignin: true });
    expect(JSON.parse(setup().doGet().text)).toMatchObject({ google: CLIENT, numberSignin: false });
    expect(JSON.parse(setup({ ALLOW_NUMBER_SIGNIN: 'yes' }).doGet().text)).toMatchObject({ google: CLIENT, numberSignin: true });
  });

  it('answers a first sign-in with a device token, and the student is a hashed id with no email anywhere', () => {
    const g = setup();
    const book = new FakeBook();
    const res = g.handle({ v: 1, auth: google(), progress: { packs: { flipit: { levels: [true] } } } }, book);
    expect(res.ok).toBe(true);
    expect(res.device.id).toMatch(/^G-[0-9a-f]{10}$/);
    expect(res.device.token).toHaveLength(64);
    expect(book.sheets.Students.rows[1].slice(0, 3)).toEqual([res.device.id, '3', '12']);
    const everything = JSON.stringify([...Object.values(book.sheets).map((s) => s.rows), g.props]);
    expect(everything).not.toContain('kid@school.org');
    expect(everything).not.toContain('1099');
    expect(everything).not.toContain(res.device.token);                   // only its hash is kept
    expect(g.props.ID_SALT).toBeTruthy();
  });

  it('the same Google account is the same student on any device, and a different account is another', () => {
    const g = setup({}, { [TOKEN]: good('1099'), [`${TOKEN}2`]: good('1099'), [`${TOKEN}3`]: good('2200') });
    const book = new FakeBook();
    const a = g.handle({ v: 1, auth: google(), progress: { packs: { flipit: { levels: [true] } } } }, book);
    const b = g.handle({ v: 1, auth: google({ idToken: `${TOKEN}2` }), progress: { packs: {} } }, book);
    const c = g.handle({ v: 1, auth: google({ idToken: `${TOKEN}3`, number: '13' }), progress: { packs: {} } }, book);
    expect(b.device.id).toBe(a.device.id);
    expect(b.progress.packs.flipit.levels).toEqual([true]);
    expect(c.device.id).not.toBe(a.device.id);
    expect(c.progress.packs.flipit.levels.some(Boolean)).toBe(false);
    expect(b.device.token).not.toBe(a.device.token);                      // each device has its own
  });

  it('after that the device token is enough, and a wrong one is refused as an auth problem', () => {
    const g = setup();
    const book = new FakeBook();
    const first = g.handle({ v: 1, auth: google(), progress: { packs: {} } }, book);
    const again = g.handle({ v: 1, auth: { mode: 'device', ...first.device }, progress: { packs: { value: { levels: [true] } } }, events: [ev(5)] }, book);
    expect(again.ok).toBe(true);
    expect(again.device).toBeUndefined();
    expect(again.progress.packs.value.levels).toEqual([true]);
    expect(book.sheets.Students.rows[1].slice(0, 3)).toEqual([first.device.id, '3', '12']);   // still known, not blanked
    expect(book.sheets.Progress.rows[1].slice(0, 3)).toEqual([first.device.id, '3', '12']);
    expect(() => g.handle({ v: 1, auth: { mode: 'device', id: first.device.id, token: 'nope' } }, book)).toThrow(/sign in again/);
    expect(() => g.handle({ v: 1, auth: { mode: 'device', id: 'G-0000000000', token: first.device.token } }, book)).toThrow();
    try { g.handle({ v: 1, auth: { mode: 'device', id: first.device.id, token: 'nope' } }, book); } catch (e) { expect(e.code).toBe('auth'); }
  });

  it('refuses a token Google does not know, one for another app, an expired one, and (when asked) another school', () => {
    const book = new FakeBook();
    const bad = (tokens, props = {}) => () => makeScript({ properties: { GOOGLE_CLIENT_ID: CLIENT, ...props }, tokens }).handle({ v: 1, auth: google() }, book);
    expect(bad({})).toThrow(/did not work/);
    expect(bad({ [TOKEN]: good('1', { aud: 'someone-else' }) })).toThrow(/did not work/);
    expect(bad({ [TOKEN]: good('1', { exp: '1000' }) })).toThrow(/did not work/);
    expect(bad({ [TOKEN]: good('1', { iss: 'evil.example' }) })).toThrow(/did not work/);
    expect(bad({ [TOKEN]: good('1', { hd: 'other.org' }) }, { ALLOWED_DOMAIN: 'school.org' })).toThrow(/school account/);
    expect(bad({ [TOKEN]: good('1') }, { ALLOWED_DOMAIN: 'School.org' })).not.toThrow();
    expect(() => makeScript().handle({ v: 1, auth: google() }, book)).toThrow(/not set up/);
  });

  it('wants a period and a number with the Google sign-in, so the teacher can tell who is who', () => {
    const g = setup();
    expect(() => g.handle({ v: 1, auth: google({ number: '' }) }, new FakeBook())).toThrow(/letters and numbers/);
  });

  it('with Google on, a number alone is refused unless ALLOW_NUMBER_SIGNIN is yes', () => {
    const book = new FakeBook();
    expect(() => setup().handle({ v: 1, auth: { period: '3', number: '12' } }, book)).toThrow(/signs in with Google/);
    expect(setup({ ALLOW_NUMBER_SIGNIN: 'yes' }).handle({ v: 1, auth: { period: '3', number: '12' } }, book).ok).toBe(true);
  });
});
