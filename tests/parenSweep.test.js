// Parentheses as tall as what is inside them (Build AC, Part 4), measured in a real browser at 1366×768, 1366×650 and 125% zoom (the
// 1366×768 window zoomed: 1093×614 CSS pixels at 1.25 device pixels each). Every place a stacked fraction sits in parentheses is visited:
// Fractions of x's divide row and its preview, its multiply row and its preview, its flip row, and a fraction value in Strange solutions'
// check. In each, every tall pair is at least as tall as the stacked things inside it (1 px tolerance), and no font parenthesis is left
// beside a stacked fraction. Without Playwright it is skipped.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function loadPlaywright() {
  const require = createRequire(import.meta.url);
  for (const p of ['playwright', process.env.PLAYWRIGHT_PATH, '/opt/node-tools/node_modules/playwright'].filter(Boolean)) {
    try { return require(p); } catch { /* try the next */ }
  }
  return null;
}
const pw = loadPlaywright();
if (!pw) console.warn('parenSweep: SKIP (Playwright is not installed here; set PLAYWRIGHT_PATH)');

const k = (t) => [...String(t)].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'typeChar', ch }));
const PLACES = [
  ['the divide row', 'fractions-of-x', 3, 5, [{ type: 'divPick' }, ...k(2), { type: 'go' }]],
  ['the divide preview', 'fractions-of-x', 3, 5, [{ type: 'divPick' }]],
  ['the multiply row', 'fractions-of-x', 2, 4, [{ type: 'multOpen' }, { type: 'multPick', kind: 'whole' }, ...k(3), { type: 'go' }]],
  ['the multiply preview', 'fractions-of-x', 2, 4, [{ type: 'multOpen' }, { type: 'multPick', kind: 'whole' }, ...k(3)]],
  ['the flip row', 'fractions-of-x', 4, 11, [{ type: 'flipPick' }, { type: 'go' }]],
  ['a fraction value in the check', 'strange-solutions', 1, 1, 'check'],
];
const SIZES = [['1366×768', { width: 1366, height: 768 }, 1], ['1366×650', { width: 1366, height: 650 }, 1], ['125% zoom', { width: 1093, height: 614 }, 1.25]];

function measure() {
  const TALL = '.lx-sfrac, .lb-divfrac, .lb-ratio';
  const out = { groups: 0, bad: [], loose: 0 };
  for (const g of document.querySelectorAll('.lb-pgroup')) {
    out.groups += 1;
    const inside = [...g.querySelector('.lb-pin').querySelectorAll(TALL)].concat(g.querySelector('.lb-pin').matches(TALL) ? [g.querySelector('.lb-pin')] : []);
    const top = Math.min(...inside.map((e) => e.getBoundingClientRect().top));
    const bottom = Math.max(...inside.map((e) => e.getBoundingClientRect().bottom));
    for (const ink of g.querySelectorAll(':scope > .lb-pp > .lb-pp-ink')) {
      const r = ink.getBoundingClientRect();
      if (r.top > top + 1 || r.bottom < bottom - 1) out.bad.push(`${Math.round(r.height)} px tall beside ${Math.round(bottom - top)} px of fraction`);
    }
  }
  // a font parenthesis right before a stacked fraction (outside any tall pair) would be a place missed
  for (const f of document.querySelectorAll('.lx-sfrac, .lb-divfrac')) {
    if (f.closest('.lb-pgroup, .fm-model, .lb-fx, .lx-sfrac-top')) continue;
    const prev = f.previousSibling;
    const t = prev?.nodeType === 3 ? prev.nodeValue : prev?.textContent ?? '';
    if (t.endsWith('(')) out.loose += 1;
  }
  return out;
}

(pw ? describe : describe.skip)('Build AC, Part 4: parentheses as tall as what is inside them (real browser)', () => {
  let server = null;
  let browser = null;
  let base = '';
  beforeAll(async () => {
    const { createServer } = await import('vite');
    server = await createServer({ root: ROOT, configFile: path.join(ROOT, 'vite.config.js'), logLevel: 'silent', server: { port: 0, hmr: false } });
    await server.listen();
    base = server.resolvedUrls.local[0];
    browser = await pw.chromium.launch();
  }, 60000);
  afterAll(async () => { await browser?.close(); await server?.close(); });

  for (const [sizeName, viewport, dsf] of SIZES) {
    it(`every place at ${sizeName}`, async () => {
      const ctx = await browser.newContext({ viewport, deviceScaleFactor: dsf });
      const page = await ctx.newPage();
      const problems = [];
      for (const [name, pack, level, seed, actions] of PLACES) {
        const url = `${base}?pack=${pack}&level=${level}&seed=${seed}&nosignin=1`;
        await page.goto(url);
        await page.evaluate(() => { try { localStorage.clear(); localStorage.setItem('mat.fxmodel.v1', '[1,3]'); } catch { /* */ } });
        await page.goto(url);
        await page.waitForFunction(() => window.__mat?.session()?.board);
        const run = (as) => page.evaluate((a) => { for (const x of a) window.__mat.dispatch(x); }, as);
        await run([{ type: 'introNext' }]);
        if (actions === 'check') {
          for (let i = 0; i < 12; i++) { const m = await page.evaluate(() => window.__mat.nextMove()); if (!m) break; await run(m); }
          const f = await page.evaluate(() => window.__mat.session().problem.ans);
          await run([{ type: 'focus', target: 'answer' }, ...k(f.n), { type: 'typeChar', ch: '/' }, ...k(f.d), { type: 'check' }]);
          for (let i = 0; i < 3; i++) await run([{ type: 'placeValue', index: i }]);
          await run([{ type: 'nextLine' }]);
        } else await run(actions);
        await page.waitForTimeout(250);
        const m = await page.evaluate(measure);
        if (!m.groups) problems.push(`${name}: no tall pair drawn`);
        for (const b of m.bad) problems.push(`${name}: a parenthesis ${b}`);
        if (m.loose) problems.push(`${name}: ${m.loose} font parenthesis beside a stacked fraction`);
      }
      await ctx.close();
      expect(problems).toEqual([]);
    }, 120000);
  }
});
