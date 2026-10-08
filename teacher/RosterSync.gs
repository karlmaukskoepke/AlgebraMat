/**
 * The Mat roster: fills itself from your master list (Google Apps Script, for the roster file).
 *
 * Paste this into Extensions > Apps Script of "The Mat roster" (a Google Sheet made from The-Mat-roster.xlsx), save, and
 * reload the sheet: a "The Mat" menu appears. See SETUP.md, Part 5.
 *
 * It reads your master list (columns First, Last, Period, StudentID: nothing else is looked at) and does two things:
 *   1. writes the Roster tab (names, periods, IDs, and each student's scrambled id), here, privately;
 *   2. writes the class list (scrambled id and period, no names, no real IDs) into the Directory tab of the class sheet,
 *      which is how the class sheet knows a student's period and who is allowed to sign in.
 * The scrambled id is made with the secret key in this file's Script properties (ID_KEY), the SAME key as in the class
 * sheet's script, so both make the same id for the same student. Students sign in with their school Google account; they
 * type nothing.
 */

var SHEETS = { settings: 'Settings', roster: 'Roster' };
var ROSTER_HEAD = ['Name', 'Period', 'StudentID', 'Key'];
var DIRECTORY_HEAD = ['StudentID', 'Period'];

function onOpen() {
  SpreadsheetApp.getUi().createMenu('The Mat')
    .addItem('Sync from my master list', 'syncFromMenu')
    .addSeparator()
    .addItem('Turn on automatic daily sync', 'turnOnDailySync')
    .addItem('Turn off automatic sync', 'turnOffDailySync')
    .addToUi();
}

// ---------- The plan (pure: no sheets), so it can be tested ----------

function clean(v) { return String(v === undefined || v === null ? '' : v).replace(/\s+/g, ' ').trim(); }
function periodOf(v) { return clean(v).toUpperCase().replace(/[^A-Z0-9]/g, ''); }

function toHex(bytes) {
  return bytes.map(function (b) { return ('0' + (b < 0 ? b + 256 : b).toString(16)).slice(-2); }).join('');
}

// A student's scrambled id: S- and 10 characters of an HMAC of the school ID. The class sheet's script makes the same one.
// A short fingerprint of the key, written next to the class list (Directory, D2) so the class sheet can tell whether the
// list was made with ITS key. (The class sheet's script makes the same one.)
function keyFingerprint(secret) {
  if (!secret || secret.length < 20) throw new Error('Set ID_KEY in this file\'s Script properties (the same long secret as in the class sheet\'s script).');
  return toHex(Utilities.computeHmacSha256Signature('key-check', secret)).slice(0, 8);
}

function studentKey(schoolId, secret) {
  if (!secret || secret.length < 20) throw new Error('Set ID_KEY in this file\'s Script properties (the same long secret as in the class sheet\'s script).');
  return 'S-' + toHex(Utilities.computeHmacSha256Signature(String(schoolId), secret)).slice(0, 10);
}

// The master list's rows (columns found by their names, in any order) as clean students. A blank row is skipped; a
// student listed twice is kept once (the first), and counted in `repeats`.
function readMaster(rows) {
  if (!rows.length) throw new Error('The master list tab is empty.');
  var head = rows[0].map(function (h) { return clean(h).toLowerCase(); });
  var col = {};
  ['first', 'last', 'period', 'studentid'].forEach(function (name) {
    col[name] = head.indexOf(name);
    if (col[name] < 0) throw new Error('I could not find a "' + name + '" column in the master list (first row should have First, Last, Period, StudentID).');
  });
  var seen = {};
  var students = [];
  var repeats = 0;
  rows.slice(1).forEach(function (r) {
    var id = clean(r[col.studentid]);
    var period = periodOf(r[col.period]);
    if (!id || !period) return;
    if (seen[id]) { repeats++; return; }
    seen[id] = true;
    students.push({ id: id, period: period, name: (clean(r[col.first]) + ' ' + clean(r[col.last])).trim() });
  });
  students.repeats = repeats;
  return students;
}

function lastName(name) { var p = clean(name).split(' '); return p[p.length - 1] || ''; }

// The roster: current students by period, then last name, each with their scrambled id.
function buildRoster(students, secret) {
  return students.map(function (s) { return { name: s.name, period: s.period, id: s.id, key: studentKey(s.id, secret) }; })
    .sort(function (a, b) {
      return a.period.localeCompare(b.period, undefined, { numeric: true })
        || lastName(a.name).localeCompare(lastName(b.name)) || a.name.localeCompare(b.name);
    });
}

// ---------- The sheets ----------

function setting(label) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var s = ss.getSheetByName(SHEETS.settings);
  if (!s) return '';
  var rows = s.getRange(1, 1, Math.max(s.getLastRow(), 1), 2).getValues();
  for (var i = 0; i < rows.length; i++) if (clean(rows[i][0]).toLowerCase() === label.toLowerCase()) return clean(rows[i][1]);
  return '';
}

function writeRows(sheet, head, rows) {
  var last = sheet.getLastRow();
  if (last > 0) sheet.getRange(1, 1, last, Math.max(head.length, sheet.getLastColumn())).clearContent();
  sheet.getRange(1, 1, 1, head.length).setValues([head]);
  if (rows.length) sheet.getRange(2, 1, rows.length, head.length).setValues(rows);
}

function syncRoster() {
  var url = setting('Master list web address');
  var tabName = setting('Master list tab') || 'Roster Import';
  if (!url) throw new Error('Paste the web address of your master list in Settings, next to "Master list web address".');
  var source = SpreadsheetApp.openByUrl(url).getSheetByName(tabName);
  if (!source) throw new Error('The master list has no tab called "' + tabName + '".');
  var students = readMaster(source.getDataRange().getValues());
  var roster = buildRoster(students, PropertiesService.getScriptProperties().getProperty('ID_KEY') || '');

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  writeRows(ss.getSheetByName(SHEETS.roster) || ss.insertSheet(SHEETS.roster), ROSTER_HEAD,
    roster.map(function (r) { return [r.name, r.period, r.id, r.key]; }));

  var classUrl = setting('Class sheet web address');
  var sent = 0;
  if (classUrl) {
    var classBook = SpreadsheetApp.openByUrl(classUrl);
    var dir = classBook.getSheetByName('Directory') || classBook.insertSheet('Directory');
    writeRows(dir, DIRECTORY_HEAD, roster.map(function (r) { return [r.key, r.period]; }));
    dir.getRange(1, 4, 2, 1).setValues([['KeyCheck'], [keyFingerprint(PropertiesService.getScriptProperties().getProperty('ID_KEY') || '')]]);
    sent = roster.length;
  }
  return { students: roster.length, repeats: students.repeats, sentToClassSheet: sent };
}

// The menu's version: says what happened (the daily trigger runs syncRoster quietly).
function syncFromMenu() {
  var r = syncRoster();
  var text = r.students + ' students read from the master list'
    + (r.repeats ? ' (' + r.repeats + ' listed twice, kept once)' : '')
    + (r.sentToClassSheet ? '; the class list in the class sheet now holds ' + r.sentToClassSheet + '.' : '. The class sheet web address is not set, so nothing was sent there.');
  SpreadsheetApp.getUi().alert(text);
}

function turnOnDailySync() {
  turnOffDailySync();
  ScriptApp.newTrigger('syncRoster').timeBased().everyDays(1).atHour(6).create();
}
function turnOffDailySync() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'syncRoster') ScriptApp.deleteTrigger(t); });
}
