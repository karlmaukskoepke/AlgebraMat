// An in-memory stand-in for a Google Sheet and the Apps Script in teacher/Code.gs, for tests.
import { readFileSync } from 'node:fs';

export class FakeSheet {
  constructor(name) { this.name = name; this.rows = []; }
  getLastRow() { return this.rows.length; }
  getLastColumn() { return this.rows.reduce((m, r) => Math.max(m, r.length), 0); }
  getRange(r, c, nr = 1, nc = 1) {
    const sheet = this;
    const at = (i, j) => (sheet.rows[r - 1 + i] ?? [])[c - 1 + j];
    return {
      getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => at(i, j) ?? '')),
      getValue: () => at(0, 0) ?? '',
      setValues: (vals) => vals.forEach((row, i) => row.forEach((v, j) => { (sheet.rows[r - 1 + i] ??= [])[c - 1 + j] = v; })),
      setValue: (v) => { (sheet.rows[r - 1] ??= [])[c - 1] = v; },
    };
  }
  appendRow(row) { this.rows.push([...row]); }
}
export class FakeBook {
  constructor() { this.sheets = {}; }
  getSheetByName(n) { return this.sheets[n] ?? null; }
  insertSheet(n) { return (this.sheets[n] = new FakeSheet(n)); }
}


import { createHash, createHmac, randomUUID } from 'node:crypto';

const code = readFileSync(new URL('../../teacher/Code.gs', import.meta.url), 'utf8');

// The script with Google's services stood in for: script properties, URL fetching (Google's token check) and hashing.
// `tokens` maps an ID token to what Google would say about it; `properties` are the script properties.
export function makeScript({ properties = {}, tokens = {} } = {}) {
  const props = { ...properties };
  const bytes = (buf) => [...buf].map((b) => (b > 127 ? b - 256 : b));
  const stubs = {
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props[k] ?? null, setProperty: (k, v) => { props[k] = v; } }) },
    UrlFetchApp: {
      fetch: (url) => {
        const token = decodeURIComponent(url.split('id_token=')[1]);
        const info = tokens[token];
        return { getResponseCode: () => (info ? 200 : 400), getContentText: () => JSON.stringify(info ?? { error: 'invalid_token' }) };
      },
    },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (text) => ({ text, setMimeType() { return this; } }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' },
      computeDigest: (algo, text) => bytes(createHash('sha256').update(text, 'utf8').digest()),
      computeHmacSha256Signature: (text, key) => bytes(createHmac('sha256', key).update(text, 'utf8').digest()),
      getUuid: () => randomUUID(),
    },
  };
  const names = Object.keys(stubs);
  const script = new Function(...names, `${code}; return { handle, identify, safe, splitKey, doGet, doPost, studentKey, isRetired };`)(...names.map((n) => stubs[n]));
  return { ...script, props };
}

export const gs = makeScript();

// The roster script (teacher/RosterSync.gs): its planning functions need only hashing.
const rosterCode = readFileSync(new URL('../../teacher/RosterSync.gs', import.meta.url), 'utf8');
const hashing = {
  computeHmacSha256Signature: (text, key) => [...createHmac('sha256', key).update(text, 'utf8').digest()].map((b) => (b > 127 ? b - 256 : b)),
};
export const roster = new Function('Utilities', `${rosterCode}; return { readMaster, buildRoster, studentKey, periodOf, clean };`)(hashing);
