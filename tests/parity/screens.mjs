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
  } finally {
    await browser.close();
    await server.close();
  }
  return shots;
}

async function click(page, sel) {
  await page.evaluate((s) => {
    const b = [...document.querySelectorAll(s)].find((n) => !n.disabled && n.getClientRects().length) ?? document.querySelector(s);
    b?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }, sel);
  await page.waitForTimeout(120);
}

// The share of pixels that differ (any channel by more than 40 of 255), worked out in Chromium's own canvas.
export async function pixelDiff(a, b) {
  const pw = await loadPlaywright();
  const browser = await pw.chromium.launch();
  try {
    const page = await browser.newPage();
    return await page.evaluate(async ([x, y]) => {
      const load = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = src; });
      const [i1, i2] = await Promise.all([load(x), load(y)]);
      if (i1.width !== i2.width || i1.height !== i2.height) return 1;
      const px = (img) => { const c = new OffscreenCanvas(img.width, img.height); const g = c.getContext('2d'); g.drawImage(img, 0, 0); return g.getImageData(0, 0, img.width, img.height).data; };
      const d1 = px(i1); const d2 = px(i2);
      let n = 0;
      for (let i = 0; i < d1.length; i += 4) if (Math.abs(d1[i] - d2[i]) > 40 || Math.abs(d1[i + 1] - d2[i + 1]) > 40 || Math.abs(d1[i + 2] - d2[i + 2]) > 40) n++;
      return n / (d1.length / 4);
    }, [`data:image/png;base64,${a.toString('base64')}`, `data:image/png;base64,${b.toString('base64')}`]);
  } finally {
    await browser.close();
  }
}
