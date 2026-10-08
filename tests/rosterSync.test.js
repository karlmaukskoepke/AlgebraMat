// teacher/RosterSync.gs: the master list becomes a private roster and a class list of scrambled ids. (Only the planning
// is tested here: the sheet reading and writing around it needs Google.)
import { describe, it, expect } from 'vitest';
import { roster, makeScript, FakeBook } from './helpers/fakeSheet.js';

const KEY = 'a-long-secret-the-teacher-made-up-0123456789';
const HEAD = ['First', 'Last', 'Period', 'StudentID'];
const master = (...rows) => [HEAD, ...rows];

describe('the master list', () => {
  it('reads First, Last, Period and StudentID by their names, in any order, and ignores unfinished rows', () => {
    const rows = [['StudentID', 'Period', 'Last', 'First', 'Extra'], ['1234567', ' 3 ', 'Rivera', 'Alex', 'x'], ['', '3', 'No', 'Id', ''], ['2', '', 'No', 'Period', ''], ['7654321', 'b', 'Lee', 'Sam', '']];
    expect([...roster.readMaster(rows)]).toEqual([{ id: '1234567', period: '3', name: 'Alex Rivera' }, { id: '7654321', period: 'B', name: 'Sam Lee' }]);
  });

  it('keeps a student listed twice once (the first), and says how many repeats', () => {
    const students = roster.readMaster(master(['Alex', 'Rivera', '3', '1'], ['Alex', 'Rivera', '5', '1'], ['Bo', 'Chen', '3', '2']));
    expect([...students].map((s) => [s.id, s.period])).toEqual([['1', '3'], ['2', '3']]);
    expect(students.repeats).toBe(1);
  });

  it('says what is wrong when a column is missing or the tab is empty', () => {
    expect(() => roster.readMaster([['First', 'Last', 'Period']])).toThrow(/"studentid" column/);
    expect(() => roster.readMaster([])).toThrow(/empty/);
  });
});

describe('the roster and the scrambled ids', () => {
  const students = roster.readMaster(master(['Di', 'Evans', '3', '1000004'], ['Alex', 'Rivera', '3', '1000001'], ['Cy', 'Diaz', '5', '1000003'], ['Bo', 'Chen', '3', '1000002']));

  it('lists current students by period, then last name, each with a scrambled id and no way to read the school ID from it', () => {
    const list = roster.buildRoster(students, KEY);
    expect(list.map((r) => `${r.period}:${r.name}`)).toEqual(['3:Bo Chen', '3:Di Evans', '3:Alex Rivera', '5:Cy Diaz']);
    for (const r of list) expect(r.key).toMatch(/^S-[0-9a-f]{10}$/);
    expect(new Set(list.map((r) => r.key)).size).toBe(4);
    expect(list.map((r) => r.key).join('')).not.toContain('1000001');
  });

  it('makes the SAME id as the class sheet script for the same student and key (that is how the two files meet)', () => {
    const script = makeScript({ properties: { ID_KEY: KEY } });
    for (const r of roster.buildRoster(students, KEY)) expect(r.key).toBe(script.studentKey(r.id));
  });

  it('another key makes other ids, and a missing or short key is an error', () => {
    expect(roster.studentKey('1000001', KEY)).not.toBe(roster.studentKey('1000001', `${KEY}x`));
    expect(() => roster.studentKey('1000001', '')).toThrow(/ID_KEY/);
    expect(() => roster.studentKey('1000001', 'short')).toThrow(/ID_KEY/);
  });

  it('writes the same key fingerprint as the class sheet script, and another key makes another', () => {
    const script = makeScript({ properties: { ID_KEY: KEY } });
    expect(roster.keyFingerprint(KEY)).toBe(script.keyFingerprint());
    expect(roster.keyFingerprint(KEY)).toMatch(/^[0-9a-f]{8}$/);
    expect(roster.keyFingerprint(`${KEY}x`)).not.toBe(roster.keyFingerprint(KEY));
    expect(() => roster.keyFingerprint('short')).toThrow(/ID_KEY/);
  });

  it('ties together: a student on the class list can sign in, and gets the period the roster gave', () => {
    const script = makeScript({
      properties: { ID_KEY: KEY, GOOGLE_CLIENT_ID: 'c', ALLOWED_DOMAIN: 'school.org' },
      tokens: { [`${'T'.repeat(40)}`]: { aud: 'c', sub: '1', iss: 'https://accounts.google.com', exp: String(Math.floor(Date.now() / 1000) + 3000), hd: 'school.org', email: 's1000003@school.org', email_verified: 'true' } },
    });
    const book = new FakeBook();
    const dir = book.insertSheet('Directory');
    dir.appendRow(['StudentID', 'Period']);
    for (const r of roster.buildRoster(students, KEY)) dir.appendRow([r.key, r.period]);
    const res = script.handle({ v: 1, auth: { mode: 'google', idToken: 'T'.repeat(40) }, progress: { packs: {} } }, book);
    expect(res.period).toBe('5');
  });
});
