// teacher/RosterSync.gs: the master list becomes stable student numbers. (Only the planning is tested here: the sheet
// reading and writing around it needs Google.)
import { describe, it, expect } from 'vitest';
import { roster } from './helpers/fakeSheet.js';

const HEAD = ['First', 'Last', 'Period', 'StudentID'];
const master = (...rows) => [HEAD, ...rows];
const sync = (rows, before = [], day = '2026-10-08') => roster.planSync(roster.readMaster(rows), before, day);
const numbers = (list) => Object.fromEntries(list.map((a) => [`${a.id}@${a.period}`, a.number]));

describe('the master list', () => {
  it('reads First, Last, Period and StudentID by their names, in any order, and ignores unfinished rows and repeats', () => {
    const rows = [['StudentID', 'Period', 'Last', 'First', 'Extra'], ['s1', ' 3 ', 'Rivera', 'Alex', 'x'], ['', '3', 'No', 'Id', ''], ['s2', '', 'No', 'Period', ''], ['s1', '3', 'Rivera', 'Alex', ''], ['s3', 'b', 'Lee', 'Sam', '']];
    expect(roster.readMaster(rows)).toEqual([{ id: 's1', period: '3', name: 'Alex Rivera' }, { id: 's3', period: 'B', name: 'Sam Lee' }]);
  });

  it('says what is wrong when a column is missing or the tab is empty', () => {
    expect(() => roster.readMaster([['First', 'Last', 'Period']])).toThrow(/"studentid" column/);
    expect(() => roster.readMaster([])).toThrow(/empty/);
  });
});

describe('numbering', () => {
  const FIRST = master(['Alex', 'Rivera', '3', 'a'], ['Bo', 'Chen', '3', 'b'], ['Cy', 'Diaz', '5', 'c'], ['Di', 'Evans', '3', 'd']);

  it('numbers each period from 1, once', () => {
    const a = sync(FIRST);
    expect(numbers(a)).toEqual({ 'a@3': 1, 'b@3': 2, 'c@5': 1, 'd@3': 3 });
    expect(a.every((x) => x.active && x.printed === '' && x.firstSeen === '2026-10-08')).toBe(true);
  });

  it('never changes a number: a student added in the middle gets the next free one', () => {
    const before = sync(FIRST);
    const after = sync(master(['Alex', 'Rivera', '3', 'a'], ['Ann', 'Baker', '3', 'new'], ['Bo', 'Chen', '3', 'b'], ['Cy', 'Diaz', '5', 'c'], ['Di', 'Evans', '3', 'd']), before, '2026-11-01');
    expect(numbers(after)).toEqual({ 'a@3': 1, 'b@3': 2, 'c@5': 1, 'd@3': 3, 'new@3': 4 });
    expect(after.find((x) => x.id === 'new').firstSeen).toBe('2026-11-01');
    expect(after.find((x) => x.id === 'a').firstSeen).toBe('2026-10-08');
  });

  it('a student who leaves keeps their number, and nobody takes it', () => {
    const before = sync(FIRST);
    const gone = sync(master(['Alex', 'Rivera', '3', 'a'], ['Cy', 'Diaz', '5', 'c'], ['Di', 'Evans', '3', 'd']), before);
    expect(gone.find((x) => x.id === 'b')).toMatchObject({ number: 2, active: false });
    const newer = sync(master(['Alex', 'Rivera', '3', 'a'], ['Cy', 'Diaz', '5', 'c'], ['Di', 'Evans', '3', 'd'], ['Eve', 'Fox', '3', 'e']), gone);
    expect(newer.find((x) => x.id === 'e').number).toBe(4);
    const back = sync(FIRST, newer);
    expect(back.find((x) => x.id === 'b')).toMatchObject({ number: 2, active: true });     // coming back gets the same number
  });

  it('a student who changes period gets a new number there; the old one is kept', () => {
    const before = sync(FIRST);
    const moved = sync(master(['Alex', 'Rivera', '5', 'a'], ['Bo', 'Chen', '3', 'b'], ['Cy', 'Diaz', '5', 'c'], ['Di', 'Evans', '3', 'd']), before);
    expect(moved.filter((x) => x.id === 'a').map((x) => [x.period, x.number, x.active])).toEqual([['3', 1, false], ['5', 2, true]]);
    expect(roster.currentRoster(moved).map((x) => [x.name, x.period, x.number])).toEqual([['Bo Chen', '3', 2], ['Di Evans', '3', 3], ['Cy Diaz', '5', 1], ['Alex Rivera', '5', 2]]);
  });

  it('keeps the printed date, updates a changed name, and does not touch the list it was given', () => {
    const before = sync(FIRST).map((x) => (x.id === 'a' ? { ...x, printed: '2026-10-09' } : x));
    const frozen = JSON.stringify(before);
    const after = sync(master(['Alexandra', 'Rivera', '3', 'a'], ['Bo', 'Chen', '3', 'b'], ['Cy', 'Diaz', '5', 'c'], ['Di', 'Evans', '3', 'd']), before);
    expect(JSON.stringify(before)).toBe(frozen);
    expect(after.find((x) => x.id === 'a')).toMatchObject({ name: 'Alexandra Rivera', printed: '2026-10-09', number: 1 });
  });

  it('the roster lists current students by period, then last name', () => {
    const a = sync(FIRST);
    expect(roster.currentRoster(a).map((x) => `${x.period}:${x.name}`)).toEqual(['3:Bo Chen', '3:Di Evans', '3:Alex Rivera', '5:Cy Diaz']);
  });
});
