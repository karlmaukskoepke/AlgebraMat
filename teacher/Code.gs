/**
 * The Mat: class sheet endpoint (Google Apps Script).
 *
 * Paste this into the Apps Script editor of a Google Sheet made from "The Mat class sheet" template
 * (Extensions > Apps Script), then Deploy > New deployment > Web app: Execute as "Me", Who has access "Anyone".
 * See SETUP.md.
 *
 * Students sign in with their school Google account, and nothing else: the script reads the account's email only to find
 * the student ID in it (such as s1234567@yourdistrict.org), scrambles that ID with a secret key, and keeps only the scrambled
 * version. No name, email or real ID is ever stored here. The roster file (private, yours) holds the same key, so only you
 * can match a scrambled ID to a name.
 *
 * What it does, and all it does: a student's phone POSTs its progress, recent problems and fluency runs; this merges the
 * progress with what the sheet already has (a level finished anywhere stays finished), adds the new problems and runs
 * (never twice), and answers with the merged progress so another device can catch up.
 */

var TABS = {
  students: { name: 'Students', head: ['StudentID', 'Period', 'Number', 'FirstSeen', 'LastSync'] },
  progress: { name: 'Progress', head: ['StudentID', 'Period', 'Number', 'LastSync'] },   // then one column per pack-level, added as needed
  log: { name: 'Log', head: ['StudentID', 'Time', 'Pack', 'Level', 'Problem', 'Answers', 'Supports', 'Stuck', 'Taught', 'Clean', 'Key'] },
  fluency: { name: 'Fluency', head: ['StudentID', 'Time', 'Challenge', 'Score', 'Tier', 'Key'] },
};
var LIMITS = { events: 300, runs: 300, text: 200, levels: 20, packs: 30 };
var PROTOCOL = 1;
var DEVICES = { name: 'Devices', head: ['StudentID', 'TokenHash', 'Created'] };
var DIRECTORY = { name: 'Directory', head: ['StudentID', 'Period'] };   // scrambled ids and periods, written by the roster file

// Settings live in Project Settings > Script properties (see SETUP.md), not in the code:
//   GOOGLE_CLIENT_ID     the OAuth client ID. Set: students sign in with Google.
//   ALLOWED_DOMAIN       the district's email domain (pcsdny.org): only accounts of that domain are accepted.
//   ID_KEY               a long secret you make up (30+ random characters), the SAME one in the roster file. It scrambles student IDs.
//   ID_EMAIL_PREFIX      the letter before the student ID in the email (default "s").
//   TEST_EMAILS          optional: teacher emails (comma separated) allowed to sign in to test; they are kept apart as "TEST".
//   RETIRE_ON            optional: a date (2028-06-30). After it the sheet stops taking data, and says so.
//   ALLOW_NUMBER_SIGNIN  "yes" keeps a period-and-number sign-in alongside Google's. (Without a client ID it always works.)
function setting(name) {
  return PropertiesService.getScriptProperties().getProperty(name) || '';
}

function isRetired(now) {
  var on = setting('RETIRE_ON');
  return /^\d{4}-\d{2}-\d{2}$/.test(on) && (now || new Date()).toISOString().slice(0, 10) > on;
}

// What the app asks first: is Google sign-in on, may a student still sign in with only a number, has this retired?
function doGet() {
  var client = setting('GOOGLE_CLIENT_ID');
  return json({ ok: true, app: 'The Mat class sheet', protocol: PROTOCOL, google: client || null, numberSignin: !client || setting('ALLOW_NUMBER_SIGNIN') === 'yes', retired: isRetired() });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var req = JSON.parse(e.postData.contents);
    return json(handle(req, SpreadsheetApp.getActiveSpreadsheet()));
  } catch (err) {
    return json({ ok: false, error: String(err && err.message ? err.message : err), code: err && err.code ? err.code : undefined });
  } finally {
    lock.releaseLock();
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ---------- The request ----------

function idPart(v, what) {
  var t = clean(v, 12).toUpperCase();
  if (!/^[A-Z0-9]{1,12}$/.test(t)) throw new Error('Use letters and numbers only for the ' + what);
  return t;
}

// Who this is. Three ways in:
//   number  a period and a student number (the id is "3-12"); allowed when Google sign-in is off, or ALLOW_NUMBER_SIGNIN is yes.
//   google  a Google ID token, checked with Google. Only the opaque account id ("sub") is used, hashed with a secret salt, as the
//           id ("G-1a2b3c4d5e"); no email or name is kept. The student also gives a period and number (so you can tell who is
//           who), and gets a device token back so the phone doesn't need Google again for every sync.
//   device  that token, from then on.
function identify(auth, ss) {
  if (!auth || typeof auth !== 'object') throw new Error('Missing sign-in');
  var mode = auth.mode || 'number';
  if (mode === 'number') {
    if (setting('GOOGLE_CLIENT_ID') && setting('ALLOW_NUMBER_SIGNIN') !== 'yes') throw authError('This class signs in with Google.');
    var period = idPart(auth.period, 'period and the student number');
    var number = idPart(auth.number, 'period and the student number');
    return { id: period + '-' + number, period: period, number: number };
  }
  if (mode === 'google') {
    var who = studentFromGoogle(verifyGoogle(auth.idToken), ss);
    who.newDevice = true;
    return who;
  }
  if (mode === 'device') {
    var id = clean(auth.id, 20);
    if (!id || !checkDevice(ss, id, clean(auth.token, 100))) throw authError('Please sign in again.');
    return { id: id, period: id.charAt(0) === 'S' ? classPeriod(ss, id) : 'TEST', number: '' };
  }
  throw new Error('Unknown sign-in');
}

function authError(message) {
  var e = new Error(message);
  e.code = 'auth';
  return e;
}

function toHex(bytes) {
  return bytes.map(function (b) { return ('0' + (b < 0 ? b + 256 : b).toString(16)).slice(-2); }).join('');
}
function sha256Hex(text) {
  return toHex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8));
}
// The secret key that scrambles a student ID: the same text in the roster file's script properties. Without it an id
// cannot be turned back into a student (school ids are short numbers, so they could be guessed without a key).
function idKey() {
  var key = setting('ID_KEY');
  if (key.length < 20) throw new Error('The class sheet is not finished being set up (ID_KEY). Tell your teacher.');
  return key;
}
function hmacHex(text) {
  return toHex(Utilities.computeHmacSha256Signature(text, idKey()));
}
// A student's id in this sheet: S- and 10 characters of the scrambled school id. (The roster file makes the same one.)
function studentKey(schoolId) {
  return 'S-' + hmacHex(String(schoolId)).slice(0, 10);
}

// Ask Google whether this ID token is real, for this app, and not out of date. Returns { email, verified, domain }.
function verifyGoogle(idToken) {
  var client = setting('GOOGLE_CLIENT_ID');
  if (!client) throw new Error('Google sign-in is not set up for this class');
  if (typeof idToken !== 'string' || idToken.length < 20 || idToken.length > 4000) throw authError('Google sign-in did not work. Try again.');
  var res = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken), { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw authError('Google sign-in did not work. Try again.');
  var info = JSON.parse(res.getContentText());
  if (info.aud !== client || !info.sub || Number(info.exp) * 1000 < Date.now()
    || (info.iss !== 'accounts.google.com' && info.iss !== 'https://accounts.google.com')) throw authError('Google sign-in did not work. Try again.');
  return { email: String(info.email || '').toLowerCase(), verified: info.email_verified === true || info.email_verified === 'true', domain: String(info.hd || '').toLowerCase() };
}

// Who a verified Google account is: the student ID in a school email like s1234567@yourdistrict.org, scrambled; or a
// teacher's test account. The email is looked at here and then forgotten.
function studentFromGoogle(info, ss) {
  var domain = setting('ALLOWED_DOMAIN').toLowerCase();
  if (!domain) throw new Error('The class sheet is not finished being set up (ALLOWED_DOMAIN). Tell your teacher.');
  if (!info.verified || info.domain !== domain || info.email.slice(-(domain.length + 1)) !== '@' + domain) throw authError('Please sign in with your school account.');
  var prefix = (setting('ID_EMAIL_PREFIX') || 's').toLowerCase();
  var local = info.email.slice(0, info.email.length - domain.length - 1);
  var m = local.indexOf(prefix) === 0 ? /^\d{3,12}$/.exec(local.slice(prefix.length)) : null;
  if (m) {
    return listedStudent(ss, m[0]);
  }
  var tests = setting('TEST_EMAILS').toLowerCase().split(',').map(function (t) { return t.trim(); });
  if (tests.indexOf(info.email) >= 0) return { id: 'T-' + hmacHex(info.email).slice(0, 10), period: 'TEST', number: '' };
  throw authError('Please sign in with your student account.');
}

// A student on the class list (the Directory the roster file keeps here: scrambled id, period). The id in the email is
// tried as it is, and without leading zeros (a spreadsheet turns an id like 0123456 into the number 123456), so either way
// the list was written finds the student. A student who isn't on it can't sign in; the refusal carries the scrambled
// code, so the teacher can look for exactly that one in the roster file's Key column.
function listedStudent(ss, digits) {
  var sheet = tab(ss, DIRECTORY);
  var last = sheet.getLastRow();
  if (last < 2) throw authError('Your teacher has not set up the class list yet.');
  var rows = sheet.getRange(2, 1, last - 1, 2).getValues();
  var tries = [digits];
  var stripped = digits.replace(/^0+/, '');
  if (stripped && stripped !== digits) tries.push(stripped);
  for (var t = 0; t < tries.length; t++) {
    var id = studentKey(tries[t]);
    for (var i = 0; i < rows.length; i++) {
      if (clean(rows[i][0], 40) === id) return { id: id, period: clean(rows[i][1], 12).toUpperCase(), number: '' };
    }
  }
  if (directoryKeyCheck(sheet) === 'different') throw authError('The class list was made with a different secret key (ID_KEY) than this class sheet. Tell your teacher.');
  throw authError('Your account is not on the class list. Ask your teacher. (Code ' + studentKey(digits).slice(2) + ')');
}

// A short fingerprint of ID_KEY: the roster file writes the same one next to the class list (Directory, D2), so the two
// can be compared without showing the key. 'match', 'different', or 'missing' (a class list from before this check).
function keyFingerprint() {
  return hmacHex('key-check').slice(0, 8);
}
function directoryKeyCheck(sheet) {
  var written = String(sheet.getRange(2, 4).getValue() || '').trim();
  if (!written) return 'missing';
  return written === keyFingerprint() ? 'match' : 'different';
}

// What a teacher needs to know when a student says they are on the class list but can't sign in: how many students the
// class list holds, whether it was made with this sheet's key, and (given a student ID number) whether that student is
// on it. Nothing here is kept or shown to students.
function classListReport(ss, digits) {
  var sheet = tab(ss, DIRECTORY);
  var rows = Math.max(sheet.getLastRow() - 1, 0);
  var out = { rows: rows, keyCheck: directoryKeyCheck(sheet), listed: null, period: '' };
  if (digits) {
    try {
      var who = listedStudent(ss, String(digits).replace(/\D/g, ''));
      out.listed = true;
      out.period = who.period;
    } catch (e) {
      out.listed = false;
    }
  }
  return out;
}

function reportText(r, digits) {
  var lines = ['The class list holds ' + r.rows + ' students.'];
  if (r.keyCheck === 'match') lines.push('Its secret key matches this class sheet: good.');
  else if (r.keyCheck === 'different') lines.push('PROBLEM: it was made with a DIFFERENT secret key (ID_KEY) than this class sheet. Make ID_KEY exactly the same in both scripts, then run The Mat > Sync in the roster file.');
  else lines.push('It has no key check yet (made before this check existed). Run The Mat > Sync from my master list in the roster file, then check again.');
  if (digits) lines.push(r.listed ? 'That student IS on the class list (period ' + r.period + ').' : 'That student is NOT on the class list. If they are in your master list, run The Mat > Sync from my master list in the roster file (and check the master list shows their ID with every digit).');
  return lines.join('\n');
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('The Mat')
    .addItem('Check the class list', 'checkClassList')
    .addItem('Check one student by ID number', 'checkOneStudent')
    .addToUi();
}
function checkClassList() {
  SpreadsheetApp.getUi().alert(reportText(classListReport(SpreadsheetApp.getActiveSpreadsheet())));
}
function checkOneStudent() {
  var ui = SpreadsheetApp.getUi();
  var answer = ui.prompt('Check one student', 'Type the student ID number (the digits after the s in their email). It is looked up here and not kept.', ui.ButtonSet.OK_CANCEL);
  if (answer.getSelectedButton() !== ui.Button.OK) return;
  var digits = String(answer.getResponseText()).replace(/\D/g, '');
  ui.alert(reportText(classListReport(SpreadsheetApp.getActiveSpreadsheet(), digits), digits));
}

// The period of a student already known by their scrambled id (a device that signed in before).
function classPeriod(ss, id) {
  var sheet = tab(ss, DIRECTORY);
  var last = sheet.getLastRow();
  if (last < 2) throw authError('Your teacher has not set up the class list yet.');
  var rows = sheet.getRange(2, 1, last - 1, 2).getValues();
  for (var i = 0; i < rows.length; i++) if (clean(rows[i][0], 40) === id) return clean(rows[i][1], 12).toUpperCase();
  throw authError('Your account is not on the class list. Ask your teacher.');
}

// ---------- Device tokens ----------

function checkDevice(ss, id, token) {
  if (!token) return false;
  var sheet = tab(ss, DEVICES);
  var last = sheet.getLastRow();
  if (last < 2) return false;
  var hash = sha256Hex(token);
  var rows = sheet.getRange(2, 1, last - 1, 2).getValues();
  for (var i = 0; i < rows.length; i++) if (rows[i][0] === id && rows[i][1] === hash) return true;
  return false;
}

function newDevice(ss, id, now) {
  var token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  tab(ss, DEVICES).appendRow([id, sha256Hex(token), now]);
  return token;
}

function clean(v, max) {
  return String(v === undefined || v === null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max === undefined ? LIMITS.text : max);
}

// A cell that starts with = + - @ would be read as a formula by the sheet: keep it text.
function safe(v) {
  var s = clean(v);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function handle(req, ss) {
  if (!req || req.v !== PROTOCOL) throw new Error('This app and this sheet are not the same version');
  if (isRetired()) throw Object.assign(new Error('This class sheet has been retired. Your progress is still saved on this device.'), { code: 'retired' });
  var who = identify(req.auth, ss);
  var now = new Date().toISOString();
  var device = who.newDevice ? { id: who.id, token: newDevice(ss, who.id, now) } : undefined;
  touchStudent(ss, who, now);
  var merged = syncProgress(ss, who, req.progress, now);
  var logged = addEvents(ss, who, req.events);
  var runs = addRuns(ss, who, req.runs);
  return { ok: true, progress: merged, added: { events: logged, runs: runs }, now: now, device: device, period: who.period };
}

// ---------- Sheets ----------

function tab(ss, spec) {
  var sheet = ss.getSheetByName(spec.name);
  if (!sheet) {
    sheet = ss.insertSheet(spec.name);
    sheet.getRange(1, 1, 1, spec.head.length).setValues([spec.head]);
  }
  return sheet;
}

function headers(sheet) {
  var n = sheet.getLastColumn();
  return n === 0 ? [] : sheet.getRange(1, 1, 1, n).getValues()[0];
}

// The row of a student in a sheet (row number, 1-based), or 0.
function findRow(sheet, id) {
  var last = sheet.getLastRow();
  if (last < 2) return 0;
  var ids = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) if (ids[i][0] === id) return i + 2;
  return 0;
}

function touchStudent(ss, who, now) {
  var sheet = tab(ss, TABS.students);
  var row = findRow(sheet, who.id);
  if (row) {
    sheet.getRange(row, 5).setValue(now);
    if (who.period) { sheet.getRange(row, 2).setValue(who.period); sheet.getRange(row, 3).setValue(who.number); }
    else { var known = sheet.getRange(row, 2, 1, 2).getValues()[0]; who.period = known[0]; who.number = known[1]; }
  } else sheet.appendRow([who.id, who.period, who.number, now, now]);
}

// ---------- Progress ----------

function columnFor(sheet, key) {
  var head = headers(sheet);
  var at = head.indexOf(key);
  if (at >= 0) return at + 1;
  sheet.getRange(1, head.length + 1).setValue(key);
  return head.length + 1;
}

// "groups-of-terms-3" is pack "groups-of-terms", level 3; "groups-of-terms-open" is how many levels the diagnostic opened.
function splitKey(key) {
  var at = String(key).lastIndexOf('-');
  if (at < 1) return null;
  var last = key.slice(at + 1);
  var pack = key.slice(0, at);
  if (last === 'open') return { pack: pack, open: true };
  return /^\d+$/.test(last) ? { pack: pack, level: Number(last) } : null;
}

// What the sheet has for a student, as the app's progress object.
function readProgress(sheet, row) {
  var head = headers(sheet);
  var values = sheet.getRange(row, 1, 1, head.length).getValues()[0];
  var packs = {};
  head.forEach(function (key, i) {
    var part = splitKey(key);
    if (!part) return;
    var entry = packs[part.pack] || (packs[part.pack] = { levels: [] });
    if (part.open) { if (Number(values[i]) > 1) entry.open = Number(values[i]); return; }
    entry.levels[part.level - 1] = values[i] === true || values[i] === 'TRUE';
  });
  Object.keys(packs).forEach(function (p) {
    var levels = packs[p].levels;
    for (var i = 0; i < levels.length; i++) levels[i] = levels[i] === true;
  });
  return { packs: packs };
}

// Merge what the phone sent into the student's row: a level done on either side stays done.
function syncProgress(ss, who, sent, now) {
  var sheet = tab(ss, TABS.progress);
  var row = findRow(sheet, who.id);
  if (!row) {
    sheet.appendRow([who.id, who.period, who.number, now]);
    row = sheet.getLastRow();
  }
  var packs = sent && sent.packs && typeof sent.packs === 'object' ? sent.packs : {};
  Object.keys(packs).slice(0, LIMITS.packs).forEach(function (pack) {
    if (!/^[a-z0-9-]{1,40}$/.test(pack)) return;
    var entry = packs[pack] || {};
    var levels = Array.isArray(entry.levels) ? entry.levels.slice(0, LIMITS.levels) : [];
    levels.forEach(function (done, i) {
      var col = columnFor(sheet, pack + '-' + (i + 1));
      var cell = sheet.getRange(row, col);
      if (done === true || cell.getValue() === true) cell.setValue(true); else if (cell.getValue() === '') cell.setValue(false);
    });
    if (Number.isInteger(entry.open) && entry.open > 1) {
      var ocol = columnFor(sheet, pack + '-open');
      var ocell = sheet.getRange(row, ocol);
      if (!(Number(ocell.getValue()) >= entry.open)) ocell.setValue(entry.open);
    }
  });
  sheet.getRange(row, 4).setValue(now);
  return readProgress(sheet, row);
}

// ---------- Problems and runs (each added once) ----------

function existingKeys(sheet, col) {
  var last = sheet.getLastRow();
  var seen = {};
  if (last < 2) return seen;
  sheet.getRange(2, col, last - 1, 1).getValues().forEach(function (r) { seen[r[0]] = true; });
  return seen;
}

function addEvents(ss, who, events) {
  var sheet = tab(ss, TABS.log);
  var seen = existingKeys(sheet, TABS.log.head.indexOf('Key') + 1);
  var added = 0;
  (Array.isArray(events) ? events.slice(0, LIMITS.events) : []).forEach(function (ev) {
    if (!ev || !isFinite(ev.t)) return;
    var key = who.id + '|' + ev.t + '|' + clean(ev.pack, 40) + '|' + clean(ev.problem, 80);
    if (seen[key]) return;
    seen[key] = true;
    var answers = (Array.isArray(ev.answers) ? ev.answers : []).map(function (a) { return clean(a && a.typed, 20) + ' → ' + clean(a && a.tag, 30); }).join('; ');
    sheet.appendRow([
      who.id, new Date(Number(ev.t)).toISOString(), safe(ev.pack), ev.level === null || ev.level === undefined ? '' : Number(ev.level) || '',
      safe(ev.problem), safe(answers), safe((Array.isArray(ev.supports) ? ev.supports : []).join(', ')),
      Number(ev.stuck) || 0, Number(ev.taught) || 0, ev.clean === true, key,
    ]);
    added++;
  });
  return added;
}

function addRuns(ss, who, runs) {
  var sheet = tab(ss, TABS.fluency);
  var seen = existingKeys(sheet, TABS.fluency.head.indexOf('Key') + 1);
  var added = 0;
  (Array.isArray(runs) ? runs.slice(0, LIMITS.runs) : []).forEach(function (r) {
    if (!r || !isFinite(r.t) || !isFinite(r.s) || typeof r.c !== 'string') return;
    var key = who.id + '|' + r.t + '|' + clean(r.c, 40);
    if (seen[key]) return;
    seen[key] = true;
    sheet.appendRow([who.id, new Date(Number(r.t)).toISOString(), safe(r.c), Number(r.s), Number(r.tier) || 0, key]);
    added++;
  });
  return added;
}
