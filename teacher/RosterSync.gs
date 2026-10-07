/**
 * The Mat roster: fills itself from your master list (Google Apps Script, for the roster file).
 *
 * Paste this into Extensions > Apps Script of "The Mat roster" (a Google Sheet made from The-Mat-roster.xlsx), save, and
 * reload the sheet: a "The Mat" menu appears. See SETUP.md, Part 5.
 *
 * It reads your master list (columns First, Last, Period, StudentID: nothing else is looked at) and keeps a Numbers tab:
 * every student gets a number in their period ONCE, and keeps it for good (a student who leaves keeps theirs, a new one gets
 * the next free number). A student who changes period gets a new number in the new period; the old one is kept. The
 * Roster tab is then written from it (sorted, current students only), and a "New students" tab lists whose slip hasn't
 * been printed yet. Student names live only in this file.
 */

var SHEETS = {
  settings: 'Settings',
  roster: 'Roster',
  numbers: 'Numbers',
  fresh: 'New students',
};
var NUMBERS_HEAD = ['StudentID', 'Period', 'Number', 'Name', 'FirstSeen', 'Printed', 'Active'];
var ROSTER_HEAD = ['Name', 'Period', 'Student number', 'StudentID'];

function onOpen() {
  SpreadsheetApp.getUi().createMenu('The Mat')
    .addItem('Sync from my master list', 'syncRoster')
    .addItem('Mark the new slips as printed', 'markPrinted')
    .addSeparator()
    .addItem('Turn on automatic daily sync', 'turnOnDailySync')
    .addItem('Turn off automatic sync', 'turnOffDailySync')
    .addToUi();
}

// ---------- The plan (pure: no sheets), so it can be tested ----------

function clean(v) { return String(v === undefined || v === null ? '' : v).replace(/\s+/g, ' ').trim(); }
function periodOf(v) { return clean(v).toUpperCase().replace(/[^A-Z0-9]/g, ''); }

// The master list's rows ([First, Last, Period, StudentID], any order of columns found by name) as clean students.
function readMaster(rows) {
  if (!rows.length) throw new Error('The master list tab is empty.');
  var head = rows[0].map(function (h) { return clean(h).toLowerCase(); });
  var col = {};
  ['first', 'last', 'period', 'studentid'].forEach(function (name) {
    col[name] = head.indexOf(name);
    if (col[name] < 0) throw new Error('I could not find a "' + name + '" column in the master list (first row should have First, Last, Period, StudentID).');
  });
  var seen = {};
  var out = [];
  rows.slice(1).forEach(function (r) {
    var id = clean(r[col.studentid]);
    var period = periodOf(r[col.period]);
    if (!id || !period) return;                          // a blank or unfinished row
    var key = id + '|' + period;
    if (seen[key]) return;                               // the same student listed twice
    seen[key] = true;
    out.push({ id: id, period: period, name: (clean(r[col.first]) + ' ' + clean(r[col.last])).trim() });
  });
  return out;
}

// assignments: [{ id, period, number, name, firstSeen, printed, active }]. Returns the updated list. New students get
// the next free number in their period; students no longer in the master list become inactive but keep their number.
function planSync(students, assignments, today) {
  var next = assignments.map(function (a) { return Object.assign({}, a); });
  var byKey = {};
  var highest = {};
  next.forEach(function (a) {
    byKey[a.id + '|' + a.period] = a;
    highest[a.period] = Math.max(highest[a.period] || 0, Number(a.number) || 0);
  });
  var present = {};
  students.forEach(function (s) {
    var key = s.id + '|' + s.period;
    present[key] = true;
    var a = byKey[key];
    if (a) { a.name = s.name; a.active = true; return; }
    highest[s.period] = (highest[s.period] || 0) + 1;
    a = { id: s.id, period: s.period, number: highest[s.period], name: s.name, firstSeen: today, printed: '', active: true };
    byKey[key] = a;
    next.push(a);
  });
  next.forEach(function (a) { if (!present[a.id + '|' + a.period]) a.active = false; });
  return next;
}

// A student who now has an active place in another period is shown only there (their old number is kept, not listed).
function currentRoster(assignments) {
  var active = assignments.filter(function (a) { return a.active === true; });
  return active.sort(function (a, b) {
    return a.period.localeCompare(b.period, undefined, { numeric: true })
      || lastName(a.name).localeCompare(lastName(b.name)) || a.name.localeCompare(b.name);
  });
}
function lastName(name) { var p = clean(name).split(' '); return p[p.length - 1] || ''; }

// ---------- The sheets ----------

function sheet(name, head) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var s = ss.getSheetByName(name) || ss.insertSheet(name);
  if (head && s.getLastRow() === 0) s.getRange(1, 1, 1, head.length).setValues([head]);
  return s;
}

function setting(label) {
  var s = sheet(SHEETS.settings);
  var rows = s.getRange(1, 1, Math.max(s.getLastRow(), 1), 2).getValues();
  for (var i = 0; i < rows.length; i++) if (clean(rows[i][0]).toLowerCase() === label.toLowerCase()) return clean(rows[i][1]);
  return '';
}

function loadAssignments() {
  var s = sheet(SHEETS.numbers, NUMBERS_HEAD);
  var last = s.getLastRow();
  if (last < 2) return [];
  return s.getRange(2, 1, last - 1, NUMBERS_HEAD.length).getValues().filter(function (r) { return clean(r[0]); }).map(function (r) {
    return { id: clean(r[0]), period: periodOf(r[1]), number: Number(r[2]), name: clean(r[3]), firstSeen: clean(r[4]), printed: clean(r[5]), active: r[6] === true || r[6] === 'TRUE' };
  });
}

function writeRows(s, head, rows) {
  var last = s.getLastRow();
  if (last > 1) s.getRange(2, 1, last - 1, Math.max(head.length, s.getLastColumn())).clearContent();
  s.getRange(1, 1, 1, head.length).setValues([head]);
  if (rows.length) s.getRange(2, 1, rows.length, head.length).setValues(rows);
}

function syncRoster() {
  var url = setting('Master list web address');
  var tabName = setting('Master list tab') || 'Roster Import';
  if (!url) throw new Error('Paste the web address of your master list in Settings, next to "Master list web address".');
  var source = SpreadsheetApp.openByUrl(url).getSheetByName(tabName);
  if (!source) throw new Error('The master list has no tab called "' + tabName + '".');
  var students = readMaster(source.getDataRange().getValues());
  var today = new Date().toISOString().slice(0, 10);
  var assignments = planSync(students, loadAssignments(), today);

  writeRows(sheet(SHEETS.numbers, NUMBERS_HEAD), NUMBERS_HEAD,
    assignments.map(function (a) { return [a.id, a.period, a.number, a.name, a.firstSeen, a.printed, a.active]; }));
  var roster = currentRoster(assignments);
  writeRows(sheet(SHEETS.roster, ROSTER_HEAD), ROSTER_HEAD, roster.map(function (a) { return [a.name, a.period, a.number, a.id]; }));
  var fresh = roster.filter(function (a) { return !a.printed; });
  writeRows(sheet(SHEETS.fresh, ROSTER_HEAD), ROSTER_HEAD, fresh.map(function (a) { return [a.name, a.period, a.number, a.id]; }));
  return { students: students.length, added: fresh.length };
}

// After you print the "Slips (new)" tab: those students no longer count as new.
function markPrinted() {
  var s = sheet(SHEETS.numbers, NUMBERS_HEAD);
  var last = s.getLastRow();
  if (last < 2) return;
  var today = new Date().toISOString().slice(0, 10);
  var rows = s.getRange(2, 1, last - 1, NUMBERS_HEAD.length).getValues();
  rows.forEach(function (r) { if (r[6] === true && !clean(r[5])) r[5] = today; });
  s.getRange(2, 1, rows.length, NUMBERS_HEAD.length).setValues(rows);
  syncRoster();
}

function turnOnDailySync() {
  turnOffDailySync();
  ScriptApp.newTrigger('syncRoster').timeBased().everyDays(1).atHour(6).create();
}
function turnOffDailySync() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'syncRoster') ScriptApp.deleteTrigger(t); });
}
