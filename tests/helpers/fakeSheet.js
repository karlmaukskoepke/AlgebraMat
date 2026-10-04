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


const code = readFileSync(new URL('../../teacher/Code.gs', import.meta.url), 'utf8');
export const gs = new Function(`${code}; return { handle, identify, safe, splitKey, doGet, doPost };`)();
