// The parity harness (tests/parity/README.md). One command:
//   npm run parity                  compare everything with the baseline; PASS / FAIL per check
//   npm run parity -- --no-screens  the same without the screenshots (no browser needed)
//   npm run parity -- --list        print every difference (not just the first 15)
//   npm run parity -- --record      write a new baseline (only on purpose: it accepts whatever the code does now)
//   npm run parity -- --record-screens   the same for the screens only (the four data families are left as they are)
// A difference is a failure unless INTENDED-CHANGES.md lists its key.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collect } from './collect.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASE = path.join(HERE, 'baseline');
const SHOTS = path.join(BASE, 'screens');
const OUT = path.join(HERE, 'out');
const args = new Set(process.argv.slice(2));
const recordScreens = args.has('--record-screens');
const record = args.has('--record');
const list = args.has('--list');                         // print every difference, not the first 15
const screens = !args.has('--no-screens');
const TOLERANCE = 0.002;                                  // a screen may differ in at most 0.2% of its pixels

const FAMILIES = ['problems', 'savecodes', 'events', 'traces'];
const t0 = Date.now();
const now = collect();

// The keys INTENDED-CHANGES.md allows to differ: the first cell of each table row that starts with `. "#N-" allows step N on.
// Everything after the HISTORY line is the record of earlier re-baselined changes, and allows nothing.
export const HISTORY = '<!-- history: nothing below this line is read by the harness -->';
function intended() {
  const file = path.join(HERE, 'INTENDED-CHANGES.md');
  if (!fs.existsSync(file)) return [];
  const live = fs.readFileSync(file, 'utf8').split(HISTORY)[0];
  return [...live.matchAll(/^\|\s*`([^`]+)`\s*\|/gm)].map((m) => m[1]);
}
const allowed = intended();
const matchOf = (key) => allowed.find((a) => {
  const from = a.match(/^(.*)#(\d+)-$/);
  if (from) { const m = key.match(/^(.*)#(\d+)$/); return Boolean(m) && m[1] === from[1] && Number(m[2]) >= Number(from[2]); }
  return a === key;
});
const isAllowed = (key) => matchOf(key) !== undefined;
const used = new Set();

if (record) {
  fs.mkdirSync(BASE, { recursive: true });
  for (const f of FAMILIES) fs.writeFileSync(path.join(BASE, `${f}.json`), `${JSON.stringify(now[f], null, 1)}\n`);
  console.log(`Recorded the data baseline (${FAMILIES.join(', ')}).`);
} else {
  for (const f of FAMILIES) {
    const file = path.join(BASE, `${f}.json`);
    if (!fs.existsSync(file)) { console.log(`FAIL  ${f}: no baseline (run with --record on purpose)`); process.exitCode = 1; continue; }
    report(f, compareFamily(f, JSON.parse(fs.readFileSync(file, 'utf8')), now[f]));
  }
}

// Every key of one family; traces are compared a step at a time, so a change shows where it starts.
function compareFamily(family, before, after) {
  const diffs = [];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const k of keys) {
    if (family === 'traces') {
      const a = before[k] ?? [];
      const b = after[k] ?? [];
      for (let i = 0; i < Math.max(a.length, b.length); i++) {
        if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) diffs.push({ key: `trace:${k}#${i}`, before: a[i], after: b[i] });
      }
    } else if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) {
      diffs.push({ key: `${family.replace(/s$/, '')}:${k}`, before: before[k], after: after[k] });
    }
  }
  return diffs;
}

function report(name, diffs) {
  const bad = diffs.filter((d) => !isAllowed(d.key));
  for (const d of diffs) if (isAllowed(d.key)) used.add(matchOf(d.key));
  const ok = diffs.length - bad.length;
  console.log(`${bad.length ? 'FAIL' : 'PASS'}  ${name}${ok ? ` (${ok} intended change${ok === 1 ? '' : 's'})` : ''}`);
  for (const d of list ? bad : bad.slice(0, 15)) {
    console.log(`      ${d.key}`);
    if (d.before !== undefined || d.after !== undefined) console.log(`        before: ${short(d.before)}\n        after:  ${short(d.after)}`);
  }
  if (!list && bad.length > 15) console.log(`      … and ${bad.length - 15} more`);
  if (bad.length) process.exitCode = 1;
}
function short(v) { const s = JSON.stringify(v?.state?.feedback ?? v) ?? 'none'; return s.length > 200 ? `${s.slice(0, 200)}…` : s; }

if (screens) {
  const { takeScreens, pixelDiff } = await import('./screens.mjs');
  const shots = await takeScreens();
  if (!shots) console.log('SKIP  screens: no Playwright here (set PLAYWRIGHT_PATH, or run with --no-screens)');
  else if (record || recordScreens) {
    fs.mkdirSync(SHOTS, { recursive: true });
    for (const f of fs.readdirSync(SHOTS)) if (f.endsWith('.png')) fs.rmSync(path.join(SHOTS, f));
    for (const [n, png] of Object.entries(shots)) fs.writeFileSync(path.join(SHOTS, `${n}.png`), png);
    console.log(`Recorded ${Object.keys(shots).length} screens.`);
  } else {
    fs.mkdirSync(OUT, { recursive: true });
    const diffs = [];
    for (const [n, png] of Object.entries(shots)) {
      fs.writeFileSync(path.join(OUT, `${n}.png`), png);
      const file = path.join(SHOTS, `${n}.png`);
      if (!fs.existsSync(file)) { diffs.push({ key: `screen:${n}`, before: 'no baseline' }); continue; }
      const share = await pixelDiff(fs.readFileSync(file), png);
      if (share > TOLERANCE) diffs.push({ key: `screen:${n}`, before: `${(share * 100).toFixed(2)}% of pixels differ (see tests/parity/out/${n}.png)` });
    }
    // a recorded screen that is no longer taken is a difference too
    for (const f of fs.readdirSync(SHOTS)) if (f.endsWith('.png') && !(f.slice(0, -4) in shots)) diffs.push({ key: `screen:${f.slice(0, -4)}`, before: 'recorded', after: 'no longer taken' });
    report(`screens (${Object.keys(shots).length})`, diffs);
  }
}

if (!record && !recordScreens) {
  const stale = allowed.filter((a) => !used.has(a));
  if (stale.length) console.log(`NOTE  listed in INTENDED-CHANGES.md but nothing differed there: ${stale.join(', ')}`);
}
console.log(`(${((Date.now() - t0) / 1000).toFixed(1)} s)`);
