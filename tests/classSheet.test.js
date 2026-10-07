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

// ---------- Google sign-in with the school account ----------
import { makeScript } from './helpers/fakeSheet.js';

const CLIENT = '1234567890-abc.apps.googleusercontent.com';
const KEY = 'a-long-secret-the-teacher-made-up-0123456789';
const good = (email, extra = {}) => ({ aud: CLIENT, sub: '1099', iss: 'https://accounts.google.com', exp: String(Math.floor(Date.now() / 1000) + 3000), hd: 'school.org', email, email_verified: 'true', ...extra });
const TOKEN = 'T'.repeat(40);
const PROPS = { GOOGLE_CLIENT_ID: CLIENT, ALLOWED_DOMAIN: 'school.org', ID_KEY: KEY };
const google = (token = TOKEN) => ({ mode: 'google', idToken: token });
const setup = (props = {}, tokens = { [TOKEN]: good('s1234567@school.org') }, directory = [['1234567', '3'], ['7654321', '5']]) => {
  const script = makeScript({ properties: { ...PROPS, ...props }, tokens });
  const book = new FakeBook();
  const dir = book.insertSheet('Directory');
  dir.appendRow(['StudentID', 'Period']);
  for (const [id, period] of directory) dir.appendRow([script.studentKey(id), period]);
  return { script, book };
};

describe('Google sign-in with the school account', () => {
  it('tells the app whether Google sign-in is on, whether a number alone still works, and whether this has retired', () => {
    expect(JSON.parse(makeScript().doGet().text)).toMatchObject({ ok: true, google: null, numberSignin: true, retired: false });
    expect(JSON.parse(setup().script.doGet().text)).toMatchObject({ google: CLIENT, numberSignin: false });
    expect(JSON.parse(setup({ ALLOW_NUMBER_SIGNIN: 'yes' }).script.doGet().text)).toMatchObject({ google: CLIENT, numberSignin: true });
    expect(JSON.parse(setup({ RETIRE_ON: '2020-01-01' }).script.doGet().text).retired).toBe(true);
  });

  it('finds the student ID in the email, takes the period from the class list, and keeps only a scrambled id', () => {
    const { script, book } = setup();
    const res = script.handle({ v: 1, auth: google(), progress: { packs: { flipit: { levels: [true] } } } }, book);
    expect(res.ok).toBe(true);
    expect(res.period).toBe('3');
    expect(res.device.id).toBe(script.studentKey('1234567'));
    expect(res.device.id).toMatch(/^S-[0-9a-f]{10}$/);
    expect(res.device.token).toHaveLength(64);
    expect(book.sheets.Students.rows[1].slice(0, 3)).toEqual([res.device.id, '3', '']);
    const everything = JSON.stringify([...Object.values(book.sheets).map((s) => s.rows)]);
    for (const secret of ['s1234567', '1234567', '@school.org', '1099', res.device.token]) expect(everything, secret).not.toContain(secret);
  });

  it('the same student is the same on any device, and another student is another', () => {
    const { script, book } = setup({}, { [TOKEN]: good('s1234567@school.org'), [`${TOKEN}2`]: good('s1234567@school.org'), [`${TOKEN}3`]: good('s7654321@school.org', { sub: '2200' }) });
    const a = script.handle({ v: 1, auth: google(), progress: { packs: { flipit: { levels: [true] } } } }, book);
    const b = script.handle({ v: 1, auth: google(`${TOKEN}2`), progress: { packs: {} } }, book);
    const c = script.handle({ v: 1, auth: google(`${TOKEN}3`), progress: { packs: {} } }, book);
    expect(b.device.id).toBe(a.device.id);
    expect(b.progress.packs.flipit.levels).toEqual([true]);
    expect(c.device.id).not.toBe(a.device.id);
    expect(c.period).toBe('5');
    expect(c.progress.packs.flipit.levels.some(Boolean)).toBe(false);
    expect(b.device.token).not.toBe(a.device.token);
  });

  it('a student who changes period gets the new one from the class list, keeping their progress', () => {
    const { script, book } = setup();
    const first = script.handle({ v: 1, auth: google(), progress: { packs: { flipit: { levels: [true] } } } }, book);
    book.sheets.Directory.rows[1][1] = '6';                                       // the roster file wrote the new period
    const again = script.handle({ v: 1, auth: { mode: 'device', ...first.device }, progress: { packs: {} } }, book);
    expect(again.period).toBe('6');
    expect(again.progress.packs.flipit.levels).toEqual([true]);
    expect(book.sheets.Students.rows[1].slice(0, 2)).toEqual([first.device.id, '6']);
  });

  it('after the first sign-in the device token is enough; a wrong one is an auth problem; a student removed from the list is refused', () => {
    const { script, book } = setup();
    const first = script.handle({ v: 1, auth: google(), progress: { packs: {} } }, book);
    const again = script.handle({ v: 1, auth: { mode: 'device', ...first.device }, progress: { packs: { value: { levels: [true] } } }, events: [ev(5)] }, book);
    expect(again.ok).toBe(true);
    expect(again.device).toBeUndefined();
    expect(again.progress.packs.value.levels).toEqual([true]);
    expect(() => script.handle({ v: 1, auth: { mode: 'device', id: first.device.id, token: 'nope' } }, book)).toThrow(/sign in again/);
    try { script.handle({ v: 1, auth: { mode: 'device', id: first.device.id, token: 'nope' } }, book); } catch (e) { expect(e.code).toBe('auth'); }
    book.sheets.Directory.rows.length = 1;
    book.sheets.Directory.appendRow([script.studentKey('7654321'), '5']);
    expect(() => script.handle({ v: 1, auth: { mode: 'device', ...first.device } }, book)).toThrow(/not on the class list/);
  });

  it('refuses a token Google does not know, one for another app, an expired one, another school, and an unverified email', () => {
    const attempt = (tokens, props = {}) => () => { const { script, book } = setup(props, tokens); return script.handle({ v: 1, auth: google() }, book); };
    expect(attempt({})).toThrow(/did not work/);
    expect(attempt({ [TOKEN]: good('s1234567@school.org', { aud: 'someone-else' }) })).toThrow(/did not work/);
    expect(attempt({ [TOKEN]: good('s1234567@school.org', { exp: '1000' }) })).toThrow(/did not work/);
    expect(attempt({ [TOKEN]: good('s1234567@school.org', { iss: 'evil.example' }) })).toThrow(/did not work/);
    expect(attempt({ [TOKEN]: good('s1234567@other.org', { hd: 'other.org' }) })).toThrow(/school account/);
    expect(attempt({ [TOKEN]: good('s1234567@school.org', { email_verified: 'false' }) })).toThrow(/school account/);
    expect(attempt({ [TOKEN]: good('s1234567@school.org') }, { ALLOWED_DOMAIN: 'School.org' })).not.toThrow();
    expect(() => makeScript().handle({ v: 1, auth: google() }, new FakeBook())).toThrow(/not set up/);
  });

  it('refuses an account that is not a student ID email, one not on the class list, and an empty class list', () => {
    const attempt = (token, props, directory) => () => { const { script, book } = setup(props, { [TOKEN]: token }, directory); return script.handle({ v: 1, auth: google() }, book); };
    expect(attempt(good('kmauk@school.org'))).toThrow(/student account/);
    expect(attempt(good('s12@school.org'))).toThrow(/student account/);
    expect(attempt(good('x1234567@school.org'))).toThrow(/student account/);
    expect(attempt(good('s9999999@school.org'))).toThrow(/not on the class list/);
    expect(attempt(good('s1234567@school.org'), {}, [])).toThrow(/not set up the class list/);
  });

  it('lets a listed teacher account in for testing, kept apart as TEST', () => {
    const { script, book } = setup({ TEST_EMAILS: 'Kmauk@school.org, other@school.org' }, { [TOKEN]: good('kmauk@school.org') });
    const res = script.handle({ v: 1, auth: google() }, book);
    expect(res.period).toBe('TEST');
    expect(res.device.id).toMatch(/^T-[0-9a-f]{10}$/);
    expect(JSON.stringify(book.sheets.Students.rows)).not.toContain('kmauk');
    const again = script.handle({ v: 1, auth: { mode: 'device', ...res.device }, progress: { packs: {} } }, book);
    expect(again.period).toBe('TEST');
  });

  it('needs the secret key, and uses the email prefix the teacher sets', () => {
    expect(() => { const { script, book } = setup({ ID_KEY: '' }); return script.handle({ v: 1, auth: google() }, book); }).toThrow(/ID_KEY/);
    const { script, book } = setup({ ID_EMAIL_PREFIX: 'stu' }, { [TOKEN]: good('stu1234567@school.org') });
    expect(script.handle({ v: 1, auth: google() }, book).device.id).toBe(script.studentKey('1234567'));
  });

  it('with Google on, a number alone is refused unless ALLOW_NUMBER_SIGNIN is yes', () => {
    const book = new FakeBook();
    expect(() => setup().script.handle({ v: 1, auth: { period: '3', number: '12' } }, book)).toThrow(/signs in with Google/);
    expect(setup({ ALLOW_NUMBER_SIGNIN: 'yes' }).script.handle({ v: 1, auth: { period: '3', number: '12' } }, book).ok).toBe(true);
  });

  it('stops taking data once it has retired, with a reason the app can show', () => {
    const { script, book } = setup({ RETIRE_ON: '2020-01-01' });
    try { script.handle({ v: 1, auth: google() }, book); expect.unreachable(); } catch (e) { expect(e.code).toBe('retired'); expect(e.message).toMatch(/retired/); }
    expect(script.isRetired(new Date('2019-12-31'))).toBe(false);
    expect(script.isRetired(new Date('2020-01-02'))).toBe(true);
  });
});
