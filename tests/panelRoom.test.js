// Nothing collides with the Moves panel (Build W, Part 1.6). Build W made the panel's buttons large and square; this plays every Solve it
// card's honest path in a real browser at 1366×650 with the touch keypad (and at 1366×768 with a keyboard) and, at every state, with the
// keypad open where a field is in use, with the Multiply options open once, and through the check:
//   - the panel does not overlap the touch keypad, the answer row (Strange solutions' two boxes too), the work or the check space, or any
//     pop-up; the page does not scroll;
//   - no pop-up covers the value waiting to be dragged into x (Build V's fix).
// It also records the panel's size and the equation's text size on each card, for the report. Without Playwright it is skipped.

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
if (!pw) console.warn('panelRoom: SKIP (Playwright is not installed here; set PLAYWRIGHT_PATH)');

const CARDS = [
  ['Add to both sides', 'add-both', [2, 5]],
  ['Divide it', 'divide-it', [2, 4]],
  ['Flip everything', 'flip-everything', [2, 4]],
  ['Two-step equations', 'two-step-equations', [1, 5]],
  ['Distribute, combine, solve', 'distribute-solve', [1, 5]],
  ['Variables on both sides', 'variables-both-sides', [1, 5]],
  ['Distribute more', 'distribute-more', [1, 5]],
  ['Strange solutions', 'strange-solutions', [1, 2, 3, 4, 5]],
  ['Fractions of x', 'fractions-of-x', [1, 3, 6]],
];
const SIZES = [[650, true], [768, false]];

// in the page: every overlap with the panel, and whether the value to drag is covered
function look() {
  const out = [];
  const panel = document.querySelector('.lx-panel');
  if (!panel) return ['no Moves panel'];
  const P = panel.getBoundingClientRect();
  const hit = (r) => r.width > 0 && r.height > 0 && r.left < P.right - 1 && r.right > P.left + 1 && r.top < P.bottom - 1 && r.bottom > P.top + 1;
  const shown = (e) => e && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden';
  const pad = document.querySelector('#controls');
  if (shown(pad) && hit(pad.getBoundingClientRect())) out.push('the keypad overlaps the panel');
  for (const [sel, what] of [['.lx-answer', 'the answer row'], ['.sv-work', 'the work and check space'], ['.lx-corners', 'the corner buttons'], ['.spot-box', 'a pop-up']]) {
    for (const e of document.querySelectorAll(sel)) if (shown(e) && !panel.contains(e) && hit(e.getBoundingClientRect())) out.push(`${what} overlaps the panel`);
  }
  if (P.bottom > innerHeight + 1 || P.right > innerWidth + 1) out.push(`the panel runs off the window (${Math.round(P.bottom)} of ${innerHeight})`);
  if (document.documentElement.scrollHeight > innerHeight + 1) out.push(`the page scrolls (${document.documentElement.scrollHeight} of ${innerHeight})`);
  const chip = document.querySelector('[data-chip]');
  if (chip) {
    const r = chip.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    if (top && !chip.contains(top)) out.push(`the value to drag is covered by ${top.className || top.tagName}`);
  }
  return out;
}

async function playCard(browser, base, [name, pack, levels], [h, touch], report, sizes) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: h }, hasTouch: touch });
  const page = await ctx.newPage();
  const fail = (lv, at, what) => report.push(`${name} Level ${lv} at 1366×${h}${touch ? ' (touch)' : ''}, ${at}: ${what}`);
  const dispatch = (as) => page.evaluate((a) => { for (const x of a) window.__mat.dispatch(x); }, as);
  const check = async (lv, at) => {
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.waitForTimeout(60);
    for (const p of await page.evaluate(look)) fail(lv, at, p);
  };
  for (const lv of levels) {
    const url = `${base}?pack=${pack}&level=${lv}&seed=7&nosignin=1`;
    await page.goto(url);
    await page.evaluate(() => { try { localStorage.clear(); } catch { /* */ } });
    await page.goto(url);
    await page.waitForFunction(() => window.__mat?.session()?.board);
    if (touch) await page.evaluate(() => { document.body.dataset.input = 'touch'; });
    await page.waitForTimeout(150);
    await check(lv, 'the first screen');
    sizes.push(await page.evaluate(([n, l, hh]) => {
      const r = (s) => { const e = document.querySelector(s); const b = e?.getBoundingClientRect(); return b ? `${Math.round(b.width)}×${Math.round(b.height)}` : '–'; };
      return `${n} L${l} @${hh}: panel ${r('.lx-panel')}, button ${r('.lx-panel .lx-move')}, text ${getComputedStyle(document.getElementById('mat')).getPropertyValue('--eq-size').trim()}`;
    }, [name, lv, h]));
    await dispatch([{ type: 'introNext' }]);
    let menuSeen = false;
    for (let step = 0; step < 12; step++) {
      // a field in use (the keypad pops up on touch): x = while it is live
      await dispatch([{ type: 'focus', target: 'answer' }]);
      await check(lv, `step ${step + 1}, x = in use`);
      // the Multiply options, once, where Multiply is live
      const mult = page.locator('.lx-panel [data-action="multOpen"]:not([disabled])');
      if (!menuSeen && await mult.count()) {
        menuSeen = true;
        await mult.first().click();
        await check(lv, `step ${step + 1}, the Multiply options open`);
        await page.keyboard.press('Escape');
        await dispatch([{ type: 'lxCancel' }]);
      }
      const m = await page.evaluate(() => window.__mat.nextMove());
      if (!m) break;
      // the move's own blank open (its keypad on touch): the first action of the move alone, then the rest
      await dispatch(m.slice(0, 1));
      await check(lv, `step ${step + 1}, the move open`);
      await dispatch(m.slice(1));
      await check(lv, `step ${step + 1}, after the move`);
    }
    const x = await page.evaluate(() => window.__mat.session().problem.x);
    const f = await page.evaluate(() => window.__mat.session().problem.ans ?? null);
    const digitsOf = (v) => [...String(Math.abs(v))].map((d) => ({ type: 'digit', digit: Number(d) })).concat(v < 0 ? [{ type: 'toggleSign' }] : []);
    const digits = f ? [...digitsOf(f.n), ...(f.d > 1 ? [{ type: 'typeChar', ch: '/' }, ...digitsOf(f.d)] : [])] : digitsOf(x);
    await dispatch([{ type: 'focus', target: 'answer' }, ...digits]);
    await check(lv, 'x typed');
    await dispatch([{ type: 'check' }]);
    await page.waitForTimeout(450);
    await check(lv, 'the value waiting to be dragged');
    for (let k = 0; k < 14; k++) {
      const s = await page.evaluate(() => ({ sub: Boolean(window.__mat.session().sub), done: window.__mat.session().stage === 'done' }));
      if (!s.sub || s.done) break;
      await dispatch([{ type: 'placeValue', index: k }, { type: 'nextLine' }]);
      await check(lv, `the check, step ${k + 1}`);
    }
  }
  await ctx.close();
}

(pw ? describe : describe.skip)('Build W: nothing collides with the Moves panel (real browser)', () => {
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

  const runs = CARDS.flatMap((c) => SIZES.map((z) => [`${c[0]} at 1366×${z[0]}${z[1] ? ' with touch' : ''}`, c, z]));
  it.concurrent.each(runs)('%s', async (_, card, size) => {
    const report = [];
    const sizes = [];
    await playCard(browser, base, card, size, report, sizes);
    console.log(`panelRoom: ${sizes.join('; ')}`);
    expect(report).toEqual([]);
  }, 300000);
});

// The Add cross-out measured on screen (Build W, Part 3; Build AB, Part 1): at 1366×768, 1366×650 and at browser zoom 125% (1366×768
// seen as 1093×614 CSS pixels at 1.25 device pixels each), on number pairs (`+8` and `−8`, `−3` and `+3`, `−13` and `+13`), a stacked
// x-term pair (`4x` over `−4x`) and Distribute more's x-terms. The term's ink box is worked out from the glyphs themselves (each text's
// measured ink at its baseline). Each stroke runs lower left to upper right at 25-35°, its midpoint within 5% of the ink box's centre (so
// it crosses sign and digits, never below them or between them), it runs past the ink at both ends by about 0.05em, it rises no more
// than 15% above the ink unless it is already at its shallowest, it is about 0.075em heavy, and it lies behind the glyphs.
const XO_VIEWS = [['1366×768', { width: 1366, height: 768 }, 1], ['1366×650', { width: 1366, height: 650 }, 1], ['zoom 125%', { width: 1093, height: 614 }, 1.25]];
const XO_CASES = [['Add to both sides, x + 8 = 11', 'add-both', 2, 7], ['Add to both sides, x − 3 = −1', 'add-both', 3, 7], ['Add to both sides, two digits', 'add-both', 6, 2], ['Variables on both sides, a stacked x-term pair', 'variables-both-sides', 1, 7], ['Distribute more', 'distribute-more', 1, 7]];
function measureXo() {
  const cv = document.createElement('canvas').getContext('2d');
  return [...document.querySelectorAll('.lb-work .lx-xo')].map((e) => {
    let L = Infinity, R = -Infinity, T = Infinity, B = -Infinity;
    const walker = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent.trim()) continue;
      const el = n.parentElement;
      const cs = getComputedStyle(el);
      cv.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const m = cv.measureText(n.textContent);
      const r = document.createRange();
      r.selectNodeContents(n);
      const x0 = r.getBoundingClientRect().left;
      const probe = document.createElement('span');
      probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
      el.append(probe);
      const base = probe.getBoundingClientRect().top;
      probe.remove();
      L = Math.min(L, x0 - m.actualBoundingBoxLeft); R = Math.max(R, x0 + m.actualBoundingBoxRight);
      T = Math.min(T, base - m.actualBoundingBoxAscent); B = Math.max(B, base + m.actualBoundingBoxDescent);
    }
    const mk = e.querySelector('.lx-xo-line');
    const font = parseFloat(getComputedStyle(e).fontSize);
    if (!mk) return { text: e.textContent.replace(/\s+/g, ''), font, missing: true };
    const mr = mk.getBoundingClientRect();
    const b = getComputedStyle(mk, '::before');
    const w = mr.width;
    const h = parseFloat(b.height);
    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;width:var(--xo-w);height:0';
    e.append(probe);
    const weight = probe.getBoundingClientRect().width;
    probe.remove();
    return { text: e.textContent.replace(/\s+/g, ''), font, angle: (Math.atan2(h, w) * 180) / Math.PI, length: Math.hypot(w, h), rise: h, left: mr.left, right: mr.right, midX: mr.left + w / 2, midY: mr.top,
      ink: { L, R, T, B }, weight, behind: getComputedStyle(mk).zIndex === '-1' && getComputedStyle(e).isolation === 'isolate', bg: b.backgroundImage };
  });
}
(pw ? describe : describe.skip)('Build W and AB: the Add cross-out on screen (real browser)', () => {
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

  it.each(XO_VIEWS)('at %s: every cancelling term crossed by one 25-35° stroke through the middle of its ink, lower left to upper right, behind its glyphs', async (label, viewport, scale) => {
    const report = [];
    const seen = [];
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: scale });
    const page = await ctx.newPage();
    for (const [name, pack, level, seed] of XO_CASES) {
      const url = `${base}?pack=${pack}&level=${level}&seed=${seed}&nosignin=1`;
      await page.goto(url);
      await page.evaluate(() => { try { localStorage.clear(); } catch { /* */ } });
      await page.goto(url);
      await page.waitForFunction(() => window.__mat?.session()?.board);
      await page.evaluate(() => window.__mat.dispatch({ type: 'introNext' }));
      // the honest path up to the first move that crosses something out
      for (let k = 0; k < 6 && !(await page.locator('.lb-work .lx-xo').count()); k++) {
        const m = await page.evaluate(() => window.__mat.nextMove());
        if (!m) break;
        await page.evaluate((as) => { for (const a of as) window.__mat.dispatch(a); }, m);
        await page.waitForTimeout(80);
      }
      await page.waitForTimeout(1600);
      const xs = await page.evaluate(measureXo);
      if (!xs.length) report.push(`${name}: no cross-out found`);
      for (const x of xs) {
        if (x.missing) { report.push(`${name} ${x.text}: no stroke`); continue; }
        const iw = x.ink.R - x.ink.L;
        const ih = x.ink.B - x.ink.T;
        const em = x.font;
        seen.push(`${name} ${x.text}: ${x.angle.toFixed(1)}°, ${Math.round(x.length)} px long, ${x.weight.toFixed(1)} px, midpoint ${(x.midX - (x.ink.L + x.ink.R) / 2).toFixed(1)}, ${(x.midY - (x.ink.T + x.ink.B) / 2).toFixed(1)} px from the ink's centre, rise ${(x.rise / ih).toFixed(2)} × the ink`);
        if (x.angle < 25 - 0.2 || x.angle > 35) report.push(`${name} ${x.text}: angle ${x.angle.toFixed(1)}°`);
        // (within 5% of the ink box, and never asked for less than a pixel: a lone digit, a stacked `3` since Build Y, is 12 px wide)
        if (Math.abs(x.midX - (x.ink.L + x.ink.R) / 2) > Math.max(1, 0.05 * iw) || Math.abs(x.midY - (x.ink.T + x.ink.B) / 2) > Math.max(1, 0.05 * ih)) report.push(`${name} ${x.text}: midpoint off the ink's centre (${(x.midX - (x.ink.L + x.ink.R) / 2).toFixed(1)}, ${(x.midY - (x.ink.T + x.ink.B) / 2).toFixed(1)} px)`);
        if (!(x.left < x.ink.L && x.right > x.ink.R)) report.push(`${name} ${x.text}: does not cross the whole term (${Math.round(x.left)}-${Math.round(x.right)} over ink ${Math.round(x.ink.L)}-${Math.round(x.ink.R)})`);
        if (x.ink.L - x.left > 0.12 * em || x.right - x.ink.R > 0.12 * em) report.push(`${name} ${x.text}: overshoots too far (${(x.ink.L - x.left).toFixed(1)}, ${(x.right - x.ink.R).toFixed(1)} px)`);
        if (x.angle > 25.2 && x.rise > 1.15 * ih + 1) report.push(`${name} ${x.text}: rises ${(x.rise / ih).toFixed(2)} × the term's height`);
        if (!(x.weight >= 2 && x.weight <= 0.08 * em + 0.5)) report.push(`${name} ${x.text}: weight ${x.weight}`);
        if (!x.behind) report.push(`${name} ${x.text}: not behind the glyphs`);
        if (!/to right bottom|to bottom right/.test(x.bg)) report.push(`${name} ${x.text}: not the lower-left to upper-right diagonal (${x.bg.slice(0, 60)})`);
      }
    }
    console.log(`crossOut ${label}: ${seen.join('; ')}`);
    await ctx.close();
    expect(report).toEqual([]);
  }, 120000);
});
