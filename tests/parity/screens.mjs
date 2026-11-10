// The screens part of the parity harness: the key states of Add to both sides and Divide it (and the opening of each later Solve it card), at 1366×768 and 1366×650, with the
// flags off and fixed seeds, taken from the real app (Vite's dev server) in Chromium. Animations and the blinking cursor are
// switched off so two runs of the same state give the same picture. Compared by pixel difference with a small tolerance.

import { createServer } from 'vite';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const SIZES = [[1366, 768], [1366, 650]];

// Playwright is not a dependency of the app: use one installed globally or at PLAYWRIGHT_PATH. Without it the screens are skipped.
async function loadPlaywright() {
  try { return await import('playwright'); } catch { /* not installed here */ }
  for (const p of [process.env.PLAYWRIGHT_PATH, '/opt/node-tools/node_modules/playwright'].filter(Boolean)) {
    try { return createRequire(import.meta.url)(p); } catch { /* try the next */ }
  }
  return null;
}

// A state is reached by opening a URL and clicking through. Steps: ['click', selector] or ['type', n].
const ADD4 = 'pack=add-both&level=4&seed=7';          // x + 8 = −4
const DIV3 = 'pack=divide-it&level=3&seed=7';          // 5x = −15
const add = (k) => [['click', '[data-action="choose"][data-move="add"]'], ['type', k], ['click', '[data-action="go"]']];
// Dividing by n, the way main does it now (2026-10-24, Build O, Part 0): Multiply, its Divide option, n, Go. (Before, these steps clicked
// a "Take a fraction" button that has not existed since Build D-2, so the div-* moves never happened and those pictures showed no move.)
// (Build O, Part 3: the Divide button, its own way in to the same move)
const take = (n) => [['click', '[data-action="divPick"]'], ['type', n], ['click', '[data-action="go"]']];
const stuck = ['click', '[data-action="stuck"]'];
const teach = ['click', '[data-action="teach"]'];
const next = ['click', '[data-action="nextLine"]'];
const check = ['click', '[data-action="check"]'];
const undo = ['click', '[data-action="undo"]'];
const place = ['click', '[data-action="placeValue"]'];          // (Build D: the value is dragged into x, or x is tapped)

export const STATES = {
  'add-opening': [ADD4, []],
  'add-helpful-move': [ADD4, [...add(-8)]],
  'add-red-move': [ADD4, [...add(8)]],
  'add-partial-move': [ADD4, [...add(-5)]],
  'add-stuck-1': [ADD4, [stuck]],
  'add-stuck-2': [ADD4, [stuck, stuck]],
  'add-stuck-3': [ADD4, [stuck, stuck, stuck]],
  'add-stuck-4': [ADD4, [stuck, stuck, stuck, stuck]],
  'add-teach': [ADD4, [teach]],
  'add-wrong-guess': [ADD4, [['type', 4], check, place, next, next]],
  'add-wrong-guess-undone': [ADD4, [['type', 4], check, place, next, next, undo]],
  'add-forced-move': [ADD4, [['type', -12], check, place, next, next, ['click', '[data-action="next"]']]],
  'add-end': [ADD4, [...add(-8), ['type', -12], check, place, next, next]],
  'add-partial-stuck-4': [ADD4, [...add(-5), stuck, stuck, stuck, stuck]],
  'add-partial-teach': [ADD4, [...add(-5), teach]],
  'add-alone-stuck-1': [ADD4, [...add(-8), stuck]],
  'add-alone-stuck-2': [ADD4, [...add(-8), stuck, stuck]],
  'add-alone-stuck-3': [ADD4, [...add(-8), stuck, stuck, stuck]],
  'add-alone-teach': [ADD4, [...add(-8), teach]],
  'add-red-stuck': [ADD4, [...add(8), stuck]],
  'add-L2-stuck-2': ['pack=add-both&level=2&seed=7', [stuck, stuck]],
  'div-opening': [DIV3, []],
  'div-helpful-move': [DIV3, [...take(5)]],
  'div-failed': [DIV3, [...take(2)]],
  'div-stuck-1': [DIV3, [stuck]],
  'div-stuck-2': [DIV3, [stuck, stuck]],
  'div-teach': [DIV3, [teach]],
  'div-wrong-guess': [DIV3, [['type', 4], check, ['click', '[data-action="placeValue"]'], next, next, next, next]],
  'div-end': [DIV3, [...take(5), ['type', -3], check, ['click', '[data-action="placeValue"]'], next, next, next, next]],
  'div-failed-stuck': [DIV3, [...take(2), stuck]],
  'div-alone-stuck-1': [DIV3, [...take(5), stuck]],
  // (Build O, Part 0: the Multiply menu, and the panel of every other Solve it card, so a change to the shared screen shows here)
  'div-menu': [DIV3, [['click', '[data-action="multOpen"]']]],
  'flip-opening': ['pack=flip-everything&level=4&seed=7', []],
  'two-opening': ['pack=two-step-equations&level=1&seed=7', []],
  'dist-opening': ['pack=distribute-solve&level=1&seed=7', []],
};


// ---------- Build AF, Part 3: the newer cards (Fractions of x, Strange solutions), the no-help choice, a placed level, the home screen and
// the card page, and Add's "See why it works" walkthrough. Taken in a context of their own with reduced motion (every animation at its end:
// the rewrite, the balance at rest), the clock fixed, and the same frozen styles. Steps, besides click and type:
//   ['press', key] a key; ['keys', text] typed on the keyboard; ['tap', sel] a real pointer click; ['hover', sel]; ['wait', ms];
//   ['act', action] the card's own action (the dev server's test hook, window.__mat, as tests/screenSweep.test.js uses it);
//   ['moves'] the honest moves until x is alone or gone; ['answer', text?] the answer typed (the problem's own, or `text`) and Check;
//   ['place'] the value dropped into every x; ['lines'] Next until the check ends (or Try a number's balance shows).
const FX = (level, seed) => `pack=fractions-of-x&level=${level}&seed=${seed}`;
const SS = (level, seed, problem) => `pack=strange-solutions&level=${level}&seed=${seed}${problem ? `&problem=${problem}` : ''}`;
const CHOOSE = 'pack=two-step-equations&level=1&seed=7&choose=1';
const MENU = 'menu=1&seed=7&choose=1';
const DEMO = 'menu=1&demo=menu&seed=7';
const WALK = 'pack=add-both&level=1&seed=7&problem=5';
const model = (n) => [['tap', '[data-action="mCut"][data-q="3"]'], ['tap', '[data-action="mPart"][data-i="0"]'], ['tap', '[data-action="mGo"]'],
  ...(n >= 3 ? [['tap', '[data-action="mPart"][data-i="1"]'], ['tap', '[data-action="mGo"]']] : []),
  ...(n >= 4 ? [['keys', '3'], ['press', 'Enter']] : []), ...(n >= 5 ? [['tap', '[data-action="mPart"][data-i="2"]']] : [])];
const solveIt = [['moves'], ['answer'], ['place'], ['lines']];
const tryIt = (text) => [['moves'], ['act', 'conclude'], ['act', { type: 'tryOpen' }], ['keys', text], ['press', 'Enter'], ['wait', 300]];
const noHelpTry = [['tap', '#dialog [data-choose="try"]'], ['wait', 600]];
const walk = (n) => [['tap', '[data-action="quiz"]'], ['tap', '[data-action="quizNext"]'], ['tap', '[data-action="wtChoose"], .is-target[data-action="choose"]'], ['tap', '[data-action="go"]'],
  ...Array.from({ length: n }, () => ['tap', '[data-action="wtNext"]'])];

export const NEW_STATES = {
  // Fractions of x: each level's opening (Level 3's box draws itself, once per device), the box model's five steps (the bridge row is
  // step 4), the rewrite both ways, the divide row's tall parentheses, a check, I'm stuck on a model-first and a move-first level, −1 first
  ...Object.fromEntries([1, 2, 3, 4, 5, 6].map((l) => [`fx-L${l}-opening`, [FX(l, 7), []]])),
  'fx-model-1': [FX(3, 5), []],
  'fx-model-2': [FX(3, 5), model(2)],
  'fx-model-3': [FX(3, 5), model(3)],
  'fx-model-4-bridge': [FX(3, 5), model(4)],
  'fx-model-5': [FX(3, 5), model(5)],
  'fx-rewrite-over': [FX(5, 10), [['tap', '[data-fx]'], ['wait', 3500]]],
  'fx-rewrite-times': [FX(5, 10), [['tap', '[data-fx]'], ['wait', 3500], ['tap', '[data-fx]'], ['wait', 3500]]],
  'fx-divide-parens': [FX(3, 5), [['click', '[data-action="divPick"]'], ['type', 2], ['click', '[data-action="go"]'], ['wait', 600]]],
  'fx-check': [FX(3, 5), [...model(5), ['answer'], ['place'], ['lines']]],
  'fx-stuck-model-first': [FX(1, 69), [['click', '[data-action="stuck"]']]],
  'fx-stuck-move-first': [FX(4, 9), [['click', '[data-action="stuck"]']]],
  'fx-negative': [FX(4, 11), [['click', '[data-action="stuck"]']]],
  // Strange solutions: Levels 3-5 opening, a fraction check with its simplified line, x gone with its two buttons, a right and a wrong pick,
  // Try a number mid-check and with the balance (no solution, infinitely many), and the one box (empty, typed 3/2)
  'ss-L3-opening': [SS(3, 7), []],
  'ss-L4-opening': [SS(4, 7), []],
  'ss-L5-opening': [SS(5, 7), []],
  'ss-check-fraction': [SS(1, 7), solveIt],
  'ss-gone': [SS(4, 1), [['moves']]],
  'ss-right-pick': [SS(4, 1), [['moves'], ['act', 'conclude']]],
  'ss-wrong-pick': [SS(4, 1), [['moves'], ['tap', '[data-pick="all"]'], ['wait', 600]]],
  'ss-try-none-mid': [SS(4, 1), tryIt('3/2')],
  'ss-try-none': [SS(4, 1), [...tryIt('3/2'), ['place'], ['lines']]],
  'ss-try-all-mid': [SS(4, 3), tryIt('4')],
  'ss-try-all': [SS(4, 3), [...tryIt('4'), ['place'], ['lines']]],
  'ss-box-empty': [SS(1, 7), [['moves']]],
  'ss-box-typed': [SS(1, 7), [['moves'], ['tap', '.lx-answer [data-target="answer"]'], ['keys', '3/2']]],
  // the no-help choice: an open level's panel, a locked door, problem 1 of 2, a miss turning help on; a placed level on problem 5 of 5
  'nh-chooser-open': [CHOOSE, []],
  'nh-locked-door': [MENU, [['tap', '.card-name[data-card="two-step-equations"]'], ['tap', '.card-view .level-btn[data-try-level="3"]']]],
  'nh-problem-1-of-2': [CHOOSE, noHelpTry],
  'nh-miss-help-on': [CHOOSE, [...noHelpTry, ...solveIt, ['press', 'Enter'], ['wait', 600], ['moves'], ['answer', '9'], ['place'], ['lines'], ['wait', 600]]],
  'placed-problem-5-of-5': [CHOOSE, [...noHelpTry, ...solveIt, ['press', 'Enter'], ['wait', 600], ...solveIt, ['wait', 2400], ['tap', '.card-view .level-btn[data-level="1"]'], ['wait', 600]]],
  // the home screen (a new student, and the test student who has done some of everything), a card page and a level popup
  'home-new': ['menu=1&seed=7', []],
  'home-demo': [DEMO, []],
  'card-page': [DEMO, [['tap', '.card-name[data-card="divide-it"]']]],
  'level-popup': [DEMO, [['tap', '[data-chev="divide-it"]']]],
  // Add's "See why it works", in columns (Build AF, Part 2): the −3 under each side, then crossed off, then the end
  'add-walk-columns': [WALK, walk(0)],
  'add-walk-crossed': [WALK, walk(1)],
  'add-walk-end': [WALK, walk(5)],
};

const FREEZE = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}';

// Takes every state at every size. Returns { name: pngBuffer } or null when Playwright is missing.
export async function takeScreens() {
  const pw = await loadPlaywright();
  if (!pw) return null;
  const server = await createServer({ root: ROOT, logLevel: 'silent', server: { port: 0, strictPort: false } });
  await server.listen();
  const base = server.resolvedUrls.local[0];
  const browser = await pw.chromium.launch();
  const shots = {};
  try {
    for (const [w, h] of SIZES) {
      const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
      for (const [name, [query, steps]] of Object.entries(STATES)) {
        await page.goto(`${base}?nosignin=1&${query}`);
        await page.evaluate(() => { try { localStorage.clear(); } catch { /* blocked */ } });
        await page.goto(`${base}?nosignin=1&${query}`);
        await page.addStyleTag({ content: FREEZE });
        await page.evaluate(() => document.fonts.ready);
        for (const [kind, arg] of steps) {
          if (kind === 'type') {
            for (const d of String(Math.abs(arg))) await click(page, `[data-action="digit"][data-digit="${d}"]`);
            if (arg < 0) await click(page, '[data-action="toggleSign"]');
          } else await click(page, arg);
        }
        await page.waitForTimeout(400);
        shots[`${name}@${w}x${h}`] = await page.screenshot();
      }
      await page.close();
    }
    for (const [w, h] of SIZES) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      await page.clock.setFixedTime(new Date('2026-11-10T15:00:00Z'));
      for (const [name, [query, steps]] of Object.entries(NEW_STATES)) {
        await page.goto(`${base}?nosignin=1&${query}`);
        await page.evaluate(() => { try { localStorage.clear(); } catch { /* blocked */ } });
        await page.goto(`${base}?nosignin=1&${query}`);
        await page.addStyleTag({ content: FREEZE });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(300);
        try { for (const step of steps) await doStep(page, step); }
        catch (e) { throw new Error(`screen ${name}: ${e.message.split('\n')[0]}`); }
        await page.mouse.move(2, h - 2);
        await page.waitForTimeout(400);
        shots[`${name}@${w}x${h}`] = await page.screenshot();
      }
      await ctx.close();
    }
  } finally {
    await browser.close();
    await server.close();
  }
  return shots;
}

// One step of a NEW_STATES entry (above). The card's own actions go through the dev server's test hook; nothing in the app changes.
async function doStep(page, [kind, arg]) {
  const mat = (fn, a) => page.evaluate(fn, a);
  if (kind === 'click') return click(page, arg);
  if (kind === 'type') {
    for (const d of String(Math.abs(arg))) await click(page, `[data-action="digit"][data-digit="${d}"]`);
    if (arg < 0) await click(page, '[data-action="toggleSign"]');
    return null;
  }
  if (kind === 'tap') { await page.locator(arg).locator('visible=true').first().click({ timeout: 5000 }); return page.waitForTimeout(250); }
  if (kind === 'hover') { await page.locator(arg).first().hover(); return page.waitForTimeout(400); }
  if (kind === 'press') { await page.keyboard.press(arg); return page.waitForTimeout(250); }
  if (kind === 'keys') { await page.keyboard.type(arg); return page.waitForTimeout(250); }
  if (kind === 'wait') return page.waitForTimeout(arg);
  if (kind === 'act') {
    await mat((a) => { const s = window.__mat.session(); window.__mat.dispatch(a === 'conclude' ? { type: 'conclude', pick: s.problem.type } : a); }, arg);
    return page.waitForTimeout(300);
  }
  if (kind === 'moves') {
    for (let k = 0; k < 16; k++) {
      const m = await mat(() => window.__mat.nextMove());
      if (!m) break;
      await mat((ms) => { for (const a of ms) window.__mat.dispatch(a); }, m);
      await page.waitForTimeout(150);
    }
    return page.waitForTimeout(300);
  }
  if (kind === 'answer') {
    await mat((text) => {
      const s = window.__mat.session();
      const f = s.problem.ans;
      const t = text ?? (f ? `${f.n}${f.d > 1 ? `/${f.d}` : ''}` : String(s.problem.x));
      const [top, bottom] = t.replace(/^-/, '').split('/');
      const digits = (d) => [...d].map((c) => ({ type: 'digit', digit: Number(c) }));
      const keys = [{ type: 'focus', target: 'answer' }, ...digits(top), ...(t.startsWith('-') ? [{ type: 'toggleSign' }] : []),
        ...(bottom ? [{ type: 'typeChar', ch: '/' }, ...digits(bottom)] : []), { type: 'check' }];
      for (const a of keys) window.__mat.dispatch(a);
    }, arg ?? null);
    return page.waitForTimeout(400);
  }
  if (kind === 'place') {
    await mat(() => { for (let i = 0; i < 6; i++) { const s = window.__mat.session(); const sub = s.trial?.sub ?? s.sub; if (!sub?.placing) break; window.__mat.dispatch({ type: 'placeValue', index: i }); } });
    return page.waitForTimeout(300);
  }
  if (kind === 'lines') {             // (Next until nothing more happens: the check's end, Not balanced included, or the balance)
    for (let k = 0; k < 20; k++) {
      const moved = await mat(() => { const before = window.__mat.session(); window.__mat.dispatch({ type: 'nextLine' }); return window.__mat.session() !== before; });
      if (!moved) break;
      await page.waitForTimeout(120);
    }
    return page.waitForTimeout(500);
  }
  throw new Error(`unknown step ${kind}`);
}

async function click(page, sel) {
  await page.evaluate((s) => {
    const b = [...document.querySelectorAll(s)].find((n) => !n.disabled && n.getClientRects().length) ?? document.querySelector(s);
    b?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }, sel);
  await page.waitForTimeout(120);
}

// The number of pixels that differ (any channel by more than PIXEL_THRESHOLD of 255), worked out in Chromium's own canvas; -1 for pictures
// of different sizes. A screen differs at FLAG_AT such pixels or more (run.mjs). Build AF, Part 3: it was the share of pixels off by 40.
export const PIXEL_THRESHOLD = 64;
export const FLAG_AT = 40;
let diffBrowser = null;
export async function pixelDiff(a, b) {
  const pw = await loadPlaywright();
  diffBrowser = diffBrowser ?? await pw.chromium.launch();
  const page = await diffBrowser.newPage();
  try {
    return await page.evaluate(async ([x, y, t]) => {
      const load = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = src; });
      const [i1, i2] = await Promise.all([load(x), load(y)]);
      if (i1.width !== i2.width || i1.height !== i2.height) return -1;
      const px = (img) => { const c = new OffscreenCanvas(img.width, img.height); const g = c.getContext('2d'); g.drawImage(img, 0, 0); return g.getImageData(0, 0, img.width, img.height).data; };
      const d1 = px(i1); const d2 = px(i2);
      let n = 0;
      for (let i = 0; i < d1.length; i += 4) if (Math.abs(d1[i] - d2[i]) > t || Math.abs(d1[i + 1] - d2[i + 1]) > t || Math.abs(d1[i + 2] - d2[i + 2]) > t) n++;
      return n;
    }, [`data:image/png;base64,${a.toString('base64')}`, `data:image/png;base64,${b.toString('base64')}`, PIXEL_THRESHOLD]);
  } finally {
    await page.close();
  }
}
export async function closeDiff() { await diffBrowser?.close(); diffBrowser = null; }
