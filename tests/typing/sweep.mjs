// Can a student type? (Build N, 2026-10-24.) A student on Divide it could not type in the Divide blank, and every Features to check
// walk passed, because the walks follow the intended steps. This plays the card the way a student might, in a real browser at
// 1366×768, and after each state asks the one question: open Divide, press a digit; does the digit land in the blank, with the focus
// on it? Run it on a laptop setup (a mouse and a keyboard) and on a touch setup (a touchscreen in tablet mode, with the keypad and
// with a keyboard too).
//
//   node tests/typing/sweep.mjs [address] [--touch] [--random N] [--no-named] [--levels 2,3] [--pack divide-it] [--seed 7] [--shots folder]
//
// The address is the app's front door (default: Vite's dev server on port 5173). Prints one line a state (PASS, FAIL or "not
// offered": the screen rightly offers no Divide there, like an error waiting for Undo), then the failures with the steps to reach
// them. Exits 1 when anything fails. `level` is the saved level: Divide it's displayed Levels 1-5 are saved 2-6.

import { createRequire } from 'node:module';

const args = process.argv.slice(2);
const flag = (name, dflt) => { const i = args.indexOf(name); return i < 0 ? dflt : args[i + 1]; };
const BASE = (args.find((a) => /^https?:/.test(a)) || 'http://localhost:5173/').replace(/\/?$/, '/');
const TOUCH = args.includes('--touch');
const RANDOM = Number(flag('--random', 0));
const PACK = flag('--pack', 'divide-it');
const SEED = Number(flag('--seed', 7));
const LEVELS = flag('--levels', '2,3,4,5,6').split(',').map(Number);
const SHOTS = flag('--shots', null);
const NAMED = !args.includes('--no-named');           // (the random runs alone)

function loadPlaywright() {
  const require = createRequire(import.meta.url);
  for (const p of ['playwright', process.env.PLAYWRIGHT_PATH, '/opt/node-tools/node_modules/playwright'].filter(Boolean)) {
    try { return require(p); } catch { /* try the next */ }
  }
  throw new Error('Playwright is not installed here (set PLAYWRIGHT_PATH).');
}

const act = (a) => `[data-action="${a}"]`;
const DIV_BOX = '.mo-divblank:not(.is-mirror) .mo-divpart';
const pause = (page, ms = 120) => page.waitForTimeout(ms);

// ---- what a student does --------------------------------------------------------------------------------------------------------
async function visible(page, sel) {
  const els = page.locator(sel);
  for (let i = 0, n = await els.count(); i < n; i++) if (await els.nth(i).isVisible()) return els.nth(i);
  return null;
}
// click the first visible match; a pop-up layer on top of a button (Undo) is clicked at its place, as a finger would
async function click(page, sel) {
  const e = await visible(page, sel);
  if (!e) return false;
  if (await e.isDisabled().catch(() => false)) return false;
  try { await e.click({ timeout: 1500 }); } catch { const b = await e.boundingBox(); if (!b) return false; await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); }
  await pause(page);
  return true;
}
const press = async (page, key, times = 1) => { for (let i = 0; i < times; i++) { await page.keyboard.press(key); await pause(page, 90); } };
// the equation's x-number (5 in 5x = −15), read from the first row
async function coef(page) {
  const t = (await page.locator('.lb-stack').first().innerText().catch(() => '')).replace(/\s+/g, '');
  const m = t.match(/(−|-)?(\d*)x/);
  return m ? Number(m[2] || 1) : 1;
}
const nonSplit = (a) => [2, 3, 4, 5, 6].find((n) => a % n !== 0) ?? 7;
async function openDivide(page) {
  if (!(await visible(page, '[data-mopt="div"]'))) await click(page, act('multOpen'));
  return click(page, '[data-mopt="div"]');
}
async function typeDivide(page, n) { if (await openDivide(page)) { await press(page, String(n)); await click(page, act('go')); } }
async function dismiss(page) { await click(page, act('spotDismiss')); }
async function undo(page) { if (!(await click(page, '.spot-undo'))) await click(page, act('undo')); await pause(page, 250); }
// a value typed in x = and checked to the end (Enter through the lines, and the value carried onto x)
async function guess(page, v) {
  await click(page, act('focus'));
  await page.keyboard.type(String(v));
  await press(page, 'Enter');
  await pause(page, 250);
  for (let i = 0; i < 8; i++) { if (await visible(page, '.spot-layer.is-error')) break; await press(page, 'Enter'); await pause(page, 200); }
}
// the answer of the current problem, from the board: a x = b, so x = b / a
async function answer(page) {
  const t = (await page.locator('.lb-stack').first().innerText()).replace(/\s+/g, '').replace(/−/g, '-');
  const m = t.match(/^(-?\d*)x=(-?\d+)/);
  if (!m) return 1;
  const a = m[1] === '' ? 1 : m[1] === '-' ? -1 : Number(m[1]);
  return Number(m[2]) / a;
}

// ---- the states (each from a fresh student on the same problem) -----------------------------------------------------------------
const STATES = {
  'a fresh problem': async () => {},
  'after clicking the Divide box first': async (page) => { await openDivide(page); await click(page, DIV_BOX); },
  'after a wrong divide number and Undo': async (page) => { await typeDivide(page, nonSplit(await coef(page))); await pause(page, 2200); await undo(page); },
  'after the fraction does not split, Undo, Got it': async (page) => { await typeDivide(page, nonSplit(await coef(page))); await pause(page, 2200); await undo(page); await dismiss(page); },
  'after a divide number that is not allowed (0, 8)': async (page) => { await typeDivide(page, 0); await openDivide(page); await press(page, '8'); await click(page, act('go')); },
  'after a wrong guess and Undo': async (page) => { await guess(page, 99); await undo(page); },
  'after the hint after Undo (Got it)': async (page) => { await guess(page, 99); await undo(page); await dismiss(page); },
  'after the one-digit pop-up': async (page) => { await openDivide(page); await press(page, '1'); await press(page, '2'); },
  'after typing and clearing': async (page) => { await openDivide(page); await press(page, '3'); await press(page, 'Backspace'); },
  'after opening and closing Multiply 5 times': async (page) => { for (let i = 0; i < 5; i++) await click(page, act('multOpen')); },
  'after choosing Multiply, then Divide': async (page) => { await click(page, act('multOpen')); await click(page, '[data-mopt="whole"]'); await press(page, '2'); await click(page, act('multOpen')); },
  'after a whole number that does not help': async (page) => { await click(page, act('multOpen')); await click(page, '[data-mopt="whole"]'); await press(page, '5'); await click(page, act('go')); },
  'after tapping the greyed fraction option': async (page) => { await click(page, act('multOpen')); await click(page, '[data-kind="frac"]'); },
  'after I’m stuck once': async (page) => { await click(page, act('stuck')); },
  'after I’m stuck twice': async (page) => { await click(page, act('stuck')); await click(page, act('stuck')); },
  'after I’m stuck three times': async (page) => { for (let i = 0; i < 3; i++) await click(page, act('stuck')); },
  'after I’m stuck four times': async (page) => { for (let i = 0; i < 4; i++) await click(page, act('stuck')); },
  'after Teach me': async (page) => { await guess(page, 99); await undo(page); await dismiss(page); await guess(page, 98); await undo(page); await dismiss(page); await click(page, act('teach')); },
  'after a move and Start over': async (page) => { const a = await coef(page); await typeDivide(page, a); await click(page, act('startOver')); await pause(page, 300); await click(page, '.spot-layer button:not(.spot-undo)'); },
  'after a correct move and Undo': async (page) => { const a = await coef(page); await typeDivide(page, a); await undo(page); },
  'after a check and Undo': async (page) => { const a = await coef(page); await typeDivide(page, a); await press(page, 'Enter'); await guess(page, 99); await undo(page); },
  'after switching tabs and back': async (page, ctx) => { await openDivide(page); const other = await ctx.newPage(); await other.goto('about:blank'); await other.bringToFront(); await pause(other, 300); await other.close(); await page.bringToFront(); await page.evaluate(() => { window.dispatchEvent(new Event('blur')); window.dispatchEvent(new Event('focus')); document.dispatchEvent(new Event('visibilitychange')); }); },
  'on the problem after a correct guess (a move first)': async (page) => { const x = await answer(page); await guess(page, x); for (let i = 0; i < 6; i++) { await press(page, 'Enter'); await pause(page, 250); } },
};

// ---- the one question --------------------------------------------------------------------------------------------------------------
// Open Divide (if the screen offers it), press a digit (or tap it on the keypad), and see where it went.
async function canType(page, { tapPad = false } = {}) {
  if (await visible(page, '.spot-layer.is-error')) return { offered: false, why: 'an error waits for Undo' };
  if (!(await visible(page, DIV_BOX))) await openDivide(page);
  let box = await visible(page, DIV_BOX);
  let field = DIV_BOX;
  let name = 'the Divide blank';
  if (!box) {
    // no Divide here: then x = is the field, when it is waiting for a value (x alone, or clicked)
    const x = await visible(page, '[data-fk="answer"]:not(:disabled):not(.is-chip)');   // (not the value being checked, carried onto x)
    const said = (await page.locator('.spot-box').allInnerTexts().catch(() => [])).join(' / ').replace(/\s+/g, ' ');
    if (!x) return { offered: false, why: said ? `the screen says: ${said}` : 'no Divide option and no x = here' };
    await x.click(); await pause(page);
    box = await visible(page, '[data-fk="answer"]');
    field = '[data-fk="answer"]';
    name = 'x =';
  }
  const before = (await box.innerText()).trim();
  if (before) { await press(page, 'Backspace', 3); }
  const digit = '3';
  if (tapPad) {
    const key = await visible(page, `#controls .pad button[data-digit="${digit}"]`);
    if (!key) return { offered: true, ok: false, why: `the keypad did not come up for ${name}` };
    if (await key.isDisabled()) return { offered: true, ok: false, why: `the keypad came up for ${name} but its keys were off` };
    await key.tap().catch(() => key.click()); await pause(page, 150);
  } else await press(page, digit);
  const after = ((await (await visible(page, field))?.innerText()) ?? '').trim();
  const focused = await page.evaluate((sel) => document.activeElement?.matches?.(sel) ?? false, field);
  if (!after.endsWith(digit)) return { offered: true, ok: false, why: `KEY LOST: pressed ${digit}; ${name} shows “${after || 'nothing'}”` };
  if (!tapPad && !focused) return { offered: true, ok: false, why: `no focus: the ${digit} landed in ${name}, but the focus is on ${await page.evaluate(() => document.activeElement?.className || document.activeElement?.tagName)}` };
  return { offered: true, ok: true, why: name };
}

// ---- the run -------------------------------------------------------------------------------------------------------------------
const { chromium } = loadPlaywright();
const browser = await chromium.launch();
// A touchscreen in tablet mode: the main pointer is a finger and nothing hovers. (A touchscreen laptop with its trackpad reports a
// fine pointer that hovers, and is a keyboard device to the app.)
const TOUCH_INIT = () => {
  const real = window.matchMedia.bind(window);
  window.matchMedia = (q) => (/pointer:\s*coarse/.test(q) ? { matches: true, media: q, addEventListener() {}, removeEventListener() {} }
    : /hover:\s*hover/.test(q) ? { matches: false, media: q, addEventListener() {}, removeEventListener() {} } : real(q));
};
async function fresh(level) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, hasTouch: TOUCH });
  if (TOUCH) await ctx.addInitScript(TOUCH_INIT);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const href = `${BASE}?pack=${PACK}&level=${level}&seed=${SEED}&nosignin=1`;
  await page.goto(href);
  await page.evaluate(() => { try { localStorage.clear(); } catch { /* blocked */ } });
  await page.goto(href);
  await pause(page, 600);
  return { ctx, page, errors, href };
}

// random student actions, for the wide sweep
const RANDOM_ACTS = [
  ['open Multiply', (p) => click(p, act('multOpen'))],
  ['pick Divide', (p) => click(p, '[data-mopt="div"]')],
  ['pick Multiply', (p) => click(p, '[data-mopt="whole"]')],
  ['tap the greyed fraction', (p) => click(p, '[data-kind="frac"]')],
  ['click the Divide box', (p) => click(p, DIV_BOX)],
  ['type a digit', (p) => press(p, String(Math.floor(Math.random() * 10)))],
  ['press minus', (p) => press(p, '-')],
  ['press Backspace', (p) => press(p, 'Backspace')],
  ['press Enter', (p) => press(p, 'Enter')],
  ['click Go', (p) => click(p, act('go'))],
  ['click Undo', (p) => undo(p)],
  ['click Got it', (p) => dismiss(p)],
  ['click I’m stuck', (p) => click(p, act('stuck'))],
  ['click Teach me', (p) => click(p, act('teach'))],
  ['click Start over', (p) => click(p, act('startOver'))],
  ['click x =', (p) => click(p, act('focus'))],
  ['click a fraction', (p) => click(p, '[data-action="take"]')],
  ['click Next', (p) => click(p, '.btn-forward')],
  ['wait 2 seconds', (p) => pause(p, 2000)],
  ['press Tab', (p) => press(p, 'Tab')],
  ['click the equation', (p) => click(p, '.lb-stack')],
];

const results = [];
const say = (r) => console.log(`${r.ok === undefined ? 'not offered' : r.ok ? 'PASS' : 'FAIL'}  L${r.level} ${r.state}${r.ok ? (r.why === 'x =' ? ' (x =)' : '') : `: ${r.why}`}`);
for (const level of NAMED ? LEVELS : []) {
  for (const [state, reach] of Object.entries(STATES)) {
    for (const tapPad of TOUCH ? [true, false] : [false]) {
      const { ctx, page, errors } = await fresh(level);
      let r;
      try {
        await reach(page, ctx);
        const got = await canType(page, { tapPad });
        r = { level, state: `${state}${TOUCH ? (tapPad ? ' (keypad)' : ' (keyboard)') : ''}`, ok: got.offered ? got.ok : undefined, why: got.why };
      } catch (e) { r = { level, state, ok: false, why: `the script could not do it: ${String(e).split('\n')[0]}` }; }
      if (errors.length) { r.ok = false; r.why = `page error: ${errors[0]}`; }
      if (SHOTS && r.ok === false) await page.screenshot({ path: `${SHOTS}/fail-L${level}-${state.replace(/[^a-z0-9]+/gi, '-')}.png` });
      results.push(r); say(r);
      await ctx.close();
    }
  }
}
// the wide sweep: random orders of student actions, then the question
for (let run = 0; run < RANDOM; run++) {
  const level = LEVELS[run % LEVELS.length];
  const { ctx, page, errors } = await fresh(level);
  const steps = [];
  let r;
  try {
    for (let k = 0, n = 3 + Math.floor(Math.random() * 10); k < n; k++) {
      const [name, f] = RANDOM_ACTS[Math.floor(Math.random() * RANDOM_ACTS.length)];
      steps.push(name);
      await f(page);
    }
    const got = await canType(page, { tapPad: TOUCH && Math.random() < 0.5 });
    r = { level, state: `random #${run + 1}: ${steps.join(', ')}`, ok: got.offered ? got.ok : undefined, why: got.why };
  } catch (e) { r = { level, state: `random #${run + 1}: ${steps.join(', ')}`, ok: false, why: `the script could not do it: ${String(e).split('\n')[0]}` }; }
  if (errors.length) { r.ok = false; r.why = `page error: ${errors[0]}`; }
  results.push(r);
  if (r.ok === false || (run + 1) % 100 === 0) say(r);
  await ctx.close();
}
await browser.close();
const fails = results.filter((r) => r.ok === false);
const offered = results.filter((r) => r.ok !== undefined).length;
console.log(`\n${results.length} states, Divide offered in ${offered}: ${offered - fails.length} pass, ${fails.length} fail${TOUCH ? ' (touch)' : ''}.`);
for (const f of fails) console.log(`  FAIL L${f.level} ${f.state}: ${f.why}`);
process.exit(fails.length ? 1 : 0);
