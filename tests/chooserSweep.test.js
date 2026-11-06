// Build AE: the no-help choice at the start of every level, in a real browser (Chromium on Vite's dev server). When the chooser opens and
// when it does not; its keys, focus and room on screen; an Enter held or mashed through it never starts a no-help attempt; a pass, a miss,
// Give up and leaving on an open level; the locked-level door. Playwright is not a dependency of the app: without it this file is skipped
// and says so.

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
if (!pw) console.warn('chooserSweep: SKIP (Playwright is not installed here; set PLAYWRIGHT_PATH)');

const keys = (n) => [...String(Math.abs(n))].map((d) => ({ type: 'digit', digit: Number(d) })).concat(n < 0 ? [{ type: 'toggleSign' }] : []);
async function dispatch(page, actions) { await page.evaluate((as) => { for (const a of as) window.__mat.dispatch(a); }, actions); }
// a value checked to the end of its check (the right one unless asked); `moves`: the honest moves first, to x alone
async function check(page, value = null, { moves = false } = {}) {
  for (let i = 0; moves && i < 20; i++) {
    const m = await page.evaluate(() => window.__mat.nextMove());
    if (!m) break;
    await dispatch(page, [...m, { type: 'foldNext' }]);
  }
  const p = await page.evaluate(() => window.__mat.session().problem);
  await dispatch(page, [{ type: 'focus', target: 'answer' }, ...keys(value ?? p.x), { type: 'check' }]);
  for (let k = 0; k < 14; k++) {
    const s = await page.evaluate(() => { const x = window.__mat.session(); return x && { sub: Boolean(x.sub), done: x.stage === 'done' || x.step === 'done', bad: x.sub && !x.sub.ok && x.sub.step >= x.sub.lines.length + 1 }; });
    if (!s?.sub || s.done || s.bad) break;
    await dispatch(page, [{ type: 'placeValue', index: k }, { type: 'nextLine' }]);
  }
}
const isOpen = (page) => page.evaluate(() => document.getElementById('dialog').open);
const playing = (page) => page.evaluate(() => ({ play: !document.getElementById('play').hidden, noHelp: document.getElementById('play').classList.contains('is-testout') }));
async function go(page, base, query, { clear = true } = {}) {
  const url = new URL(query, base).href;
  await page.goto(url);
  if (clear) { await page.evaluate(() => localStorage.clear()); await page.goto(url); }
  await page.waitForTimeout(300);
}
const card = async (page, id) => { await page.click(`.card-name[data-card="${id}"]`); await page.waitForTimeout(200); };

describe.skipIf(!pw)('Build AE: the chooser, in a real browser', () => {
  let server; let browser; let base;
  beforeAll(async () => {
    const { createServer } = await import('vite');
    server = await createServer({ root: ROOT, configFile: path.join(ROOT, 'vite.config.js'), logLevel: 'silent', server: { port: 0, hmr: false } });
    await server.listen();
    base = server.resolvedUrls.local[0];
    browser = await pw.chromium.launch();
  }, 60000);
  afterAll(async () => { await browser?.close(); await server?.close(); });

  it('opens on a fresh open level from the card page: named, Start with help focused, room on screen; Escape and a tap outside close it', async () => {
    for (const [w, h] of [[1366, 768], [1366, 650], [390, 844]]) {
      const page = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: w < 600 });
      await go(page, base, '?menu=1&nosignin=1');
      await card(page, 'two-step-equations');
      await page.click('.card-view .level-btn[data-level="1"]');
      expect(await isOpen(page)).toBe(true);
      expect(await page.locator('#dialog').getAttribute('aria-label')).toBe('Start Level 1');
      const texts = (await page.locator('#dialog button').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
      expect(texts).toEqual(['Start with help', 'Try with no help 2 problems']);
      expect(await page.evaluate(() => document.activeElement?.dataset.choose)).toBe('help');
      const boxes = await page.evaluate(() => [...document.querySelectorAll('#dialog, #dialog button')].map((e) => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom, r.height]; }));
      for (const [l, t, r, b, ht] of boxes) {
        expect(l, `${w}x${h}`).toBeGreaterThanOrEqual(0);
        expect(t).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThanOrEqual(w);
        expect(b).toBeLessThanOrEqual(h);
        expect(ht).toBeGreaterThanOrEqual(44);
      }
      const [a, c] = boxes.slice(1);
      const overlap = !(a[2] <= c[0] || c[2] <= a[0] || a[3] <= c[1] || c[3] <= a[1]);
      expect(overlap, 'the two buttons overlap').toBe(false);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.screenshot({ path: `/tmp/ae-chooser-${w}x${h}.png` }).catch(() => {});
      await page.keyboard.press('Escape');
      await page.waitForTimeout(150);
      expect(await isOpen(page)).toBe(false);
      expect(await page.evaluate(() => document.activeElement?.dataset.level)).toBe('1');        // focus back where it came from
      expect((await playing(page)).play).toBe(false);
      await page.click('.card-view .level-btn[data-level="1"]');
      await page.mouse.click(6, h - 6);                                                          // a tap outside
      await page.waitForTimeout(150);
      expect(await isOpen(page)).toBe(false);
      expect((await playing(page)).play).toBe(false);
      await page.close();
    }
  }, 90000);

  it('Enter, pressed or mashed through, starts with help, never a no-help attempt; arrows and Tab move between the two', async () => {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await go(page, base, '?menu=1&nosignin=1');
    await card(page, 'two-step-equations');
    await page.focus('.card-view .level-btn[data-level="1"]');
    for (let i = 0; i < 6; i++) await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    expect(await playing(page)).toEqual({ play: true, noHelp: false });
    // (held down: repeats)
    await go(page, base, '?menu=1&nosignin=1');
    await card(page, 'fractions-of-x');
    await page.focus('.card-view .level-btn[data-level="1"]');
    await page.keyboard.down('Enter');
    for (let i = 0; i < 8; i++) await page.keyboard.down('Enter');
    await page.keyboard.up('Enter');
    await page.waitForTimeout(400);
    expect((await playing(page)).noHelp).toBe(false);
    // arrows and Tab
    await go(page, base, '?menu=1&nosignin=1');
    await card(page, 'two-step-equations');
    await page.click('.card-view .level-btn[data-level="1"]');
    await page.keyboard.press('ArrowRight');
    expect(await page.evaluate(() => document.activeElement?.dataset.choose)).toBe('try');
    await page.keyboard.press('ArrowLeft');
    expect(await page.evaluate(() => document.activeElement?.dataset.choose)).toBe('help');
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.dataset.choose)).toBe('try');
    await page.waitForTimeout(450);
    await page.keyboard.press('Enter');                                                           // (chosen on purpose: it starts)
    await page.waitForTimeout(400);
    expect(await playing(page)).toEqual({ play: true, noHelp: true });
    await page.close();
  }, 60000);

  it('opens from the level popup, from Next level, and from a link; not on a level in progress, placed or earned, nor with seed= or choose=0', async () => {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    // the popup
    await go(page, base, '?menu=1&nosignin=1');
    await page.click('[data-chev="two-step-equations"]');
    await page.click('.lv-pop:not([hidden]) .pop-level[data-level="1"]');
    expect(await isOpen(page)).toBe(true);
    // a link with no seed: the card page opens with the chooser over it
    await go(page, base, '?pack=fractions-of-x&level=1&nosignin=1');
    expect(await isOpen(page)).toBe(true);
    expect(await page.locator('.card-view').count()).toBe(1);
    // start with help: today's level, five problems, help there
    await page.click('#dialog [data-choose="help"]');
    await page.waitForTimeout(300);
    expect(await playing(page)).toEqual({ play: true, noHelp: false });
    expect(await page.locator('#dots .dot').count()).toBe(5);
    expect(await page.locator('[data-action="stuck"]').first().isVisible()).toBe(true);
    // in progress: a reload resumes, and the card page opens it straight into play
    await page.goto(new URL('?nosignin=1', base).href);
    await page.waitForTimeout(300);
    expect(await isOpen(page)).toBe(false);
    expect((await playing(page)).play).toBe(true);
    await page.click('#back');
    await card(page, 'fractions-of-x');
    await page.click('.card-view .level-btn[data-level="1"]');
    expect(await isOpen(page)).toBe(false);
    expect((await playing(page)).play).toBe(true);
    // a seed, or choose=0: never
    await go(page, base, '?pack=two-step-equations&level=1&seed=7&nosignin=1');
    expect(await isOpen(page)).toBe(false);
    await go(page, base, '?pack=two-step-equations&level=1&choose=0&nosignin=1');
    expect(await isOpen(page)).toBe(false);
    // placed and earned (the test student who has done some of everything)
    await go(page, base, '?menu=1&demo=menu&nosignin=1');
    await card(page, 'flip-everything');
    await page.click('.card-view .level-btn.is-placed');
    expect(await isOpen(page)).toBe(false);
    expect((await playing(page)).play).toBe(true);
    // Count it and Build it keep today's behaviour
    for (const id of ['combineit', 'distribute-combine']) {
      await go(page, base, '?menu=1&choose=1&nosignin=1');
      await page.click('[data-section="count"], [data-section="build"]').catch(() => {});
      await page.evaluate((cid) => document.querySelector(`.card-name[data-card="${cid}"]`)?.click(), id);
      await page.waitForTimeout(200);
      await page.evaluate(() => document.querySelector('.card-view .level-btn[data-level]:not([disabled])')?.click());
      await page.waitForTimeout(300);
      expect(await isOpen(page), id).toBe(false);
    }
    await page.close();
  }, 90000);

  it('Next level at the end of a level asks too (choose=1 on a test link)', async () => {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await go(page, base, '?pack=two-step-equations&level=1&seed=7&choose=1&nosignin=1');
    await page.click('#dialog [data-choose="help"]');
    await page.waitForTimeout(300);
    for (let i = 0; i < 5; i++) {
      await check(page, null, { moves: true });
      await page.waitForTimeout(150);
      if (i < 4) { await dispatch(page, [{ type: 'next' }]); await page.waitForTimeout(150); }
    }
    await dispatch(page, [{ type: 'next' }]);
    await page.waitForSelector('.level-done');
    await page.click('.level-done [data-go="next"], .level-done button:has-text("Next level")');
    await page.waitForTimeout(300);
    expect(await isOpen(page)).toBe(true);
    expect(await page.locator('#dialog').getAttribute('aria-label')).toBe('Start Level 2');
    expect(await page.locator('.card-view').count()).toBe(1);
    await page.close();
  }, 90000);

  it('a pass on an open level: silver, the next level open, the warm message; gold after one more problem', async () => {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await go(page, base, '?pack=two-step-equations&level=1&seed=7&choose=1&nosignin=1');
    await page.click('#dialog [data-choose="try"]');
    await page.waitForFunction(() => window.__mat?.session()?.board);
    expect(await page.locator('#testout-bar').innerText()).toContain('No help · Level 1');
    await check(page);
    await dispatch(page, [{ type: 'next' }]);
    await check(page);
    await page.waitForSelector('.home-note.is-warm', { timeout: 5000 });
    expect(await page.locator('.home-note').innerText()).toBe('No help needed! Do one more problem on Level 1 to make it gold.');
    const states = await page.evaluate(() => [...document.querySelectorAll('.card-view .level-btn')].map((b) => (b.classList.contains('is-placed') ? 'placed' : b.dataset.tryLevel ? 'try' : 'open')));
    expect(states.slice(0, 3)).toEqual(['placed', 'open', 'try']);
    const log = await page.evaluate(() => JSON.parse(localStorage.getItem('mat.events.v1')));
    expect(log.map((r) => r.supports)).toEqual([['test-out-pass'], ['test-out-pass']]);
    await page.click('.card-view .level-btn[data-level="1"]');
    expect(await isOpen(page)).toBe(false);                                                       // a placed level opens as today
    await check(page);
    await page.waitForTimeout(300);
    expect(await page.locator('#earned-note').innerText()).toContain('Level 1 earned!');
    await page.close();
  }, 60000);

  it('a miss on an open level: help comes on, the same problem carries on, the earlier problem counts; the rows say test-out-fail', async () => {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await go(page, base, '?pack=two-step-equations&level=1&seed=7&choose=1&nosignin=1');
    await page.click('#dialog [data-choose="try"]');
    await page.waitForFunction(() => window.__mat?.session()?.board);
    await check(page);
    await dispatch(page, [{ type: 'next' }]);
    const p2 = await page.evaluate(() => window.__mat.session().problem);
    await check(page, p2.x + 1);
    await page.waitForTimeout(300);
    expect(await playing(page)).toEqual({ play: true, noHelp: false });
    expect(await page.locator('#testout-bar').isHidden()).toBe(true);
    expect(await page.locator('.spot-layer.is-error').innerText()).toContain('not balanced');
    expect(await page.locator('#dots .dot').count()).toBe(5);
    expect(await page.locator('#dots .dot.done').count()).toBe(1);
    expect(JSON.stringify(await page.evaluate(() => window.__mat.session().problem))).toBe(JSON.stringify(p2));
    expect(await page.locator('[data-action="stuck"]').first().isVisible()).toBe(true);
    await dispatch(page, [{ type: 'undo' }]);
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.__mat.session().spot?.kind)).toBe('hint');          // the usual hint after Undo
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('mat.events.v1') ?? '[]').length)).toBe(0);   // (held until it ends)
    await dispatch(page, [{ type: 'spotDismiss' }, { type: 'startOver' }]);
    await check(page);
    await page.waitForTimeout(300);
    const log = await page.evaluate(() => JSON.parse(localStorage.getItem('mat.events.v1')));
    expect(log.map((r) => r.supports.filter((w) => w.startsWith('test-out')))).toEqual([['test-out-fail'], ['test-out-fail']]);
    await dispatch(page, [{ type: 'next' }]);
    await check(page, null, { moves: true });                                                    // (a correct guess owes a move next)
    await page.waitForTimeout(300);
    const log2 = await page.evaluate(() => JSON.parse(localStorage.getItem('mat.events.v1')));
    expect(log2.length).toBe(3);
    expect(log2[2].supports.some((w) => w.startsWith('test-out'))).toBe(false);                 // the rest of the level logs as usual
    // the level is in progress: no chooser next time (choose is not on this address)
    await page.goto(new URL('?menu=1&nosignin=1', base).href);
    await card(page, 'two-step-equations');
    await page.click('.card-view .level-btn[data-level="1"]');
    expect(await isOpen(page)).toBe(false);
    await page.close();
  }, 60000);

  it('Give up on an open level carries on with help; leaving mid-try logs a give-up and the level then opens with no chooser', async () => {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await go(page, base, '?pack=fractions-of-x&level=1&seed=7&choose=1&nosignin=1');
    await page.click('#dialog [data-choose="try"]');
    await page.waitForFunction(() => window.__mat?.session()?.board);
    const p1 = await page.evaluate(() => window.__mat.session().problem);
    expect(await page.locator('.fm-model').count()).toBe(0);
    await page.click('[data-giveup]');
    await page.waitForTimeout(300);
    expect(await playing(page)).toEqual({ play: true, noHelp: false });
    expect(JSON.stringify(await page.evaluate(() => window.__mat.session().problem))).toBe(JSON.stringify(p1));
    expect(await page.locator('.testout-done').count()).toBe(0);
    expect(await page.evaluate(() => localStorage.getItem('mat.fxmodel.v1'))).toBe(null);       // the model memory untouched
    await page.click('#back');
    await page.waitForTimeout(300);
    let log = await page.evaluate(() => JSON.parse(localStorage.getItem('mat.events.v1')));
    expect(log.map((r) => r.supports.filter((w) => w.startsWith('test-out')))).toEqual([['test-out-fail']]);
    // leaving mid-try
    await go(page, base, '?pack=two-step-equations&level=1&seed=7&choose=1&nosignin=1');
    await page.click('#dialog [data-choose="try"]');
    await page.waitForFunction(() => window.__mat?.session()?.board);
    await page.click('#back');
    await page.waitForTimeout(300);
    log = await page.evaluate(() => JSON.parse(localStorage.getItem('mat.events.v1')));
    expect(log.map((r) => r.supports)).toEqual([['test-out-fail']]);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mat.v1')).packs['two-step-equations']);
    expect(saved.placed).toBeUndefined();
    await page.goto(new URL('?menu=1&nosignin=1', base).href);
    await card(page, 'two-step-equations');
    await page.click('.card-view .level-btn[data-level="1"]');
    expect(await isOpen(page)).toBe(false);
    expect((await playing(page)).play).toBe(true);
    await page.close();
  }, 60000);

  it('the locked-level door: Try with no help and Not now (focused), Enter never starts; a miss, Give up and leaving as Build Z built them', async () => {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await go(page, base, '?menu=1&seed=7&nosignin=1');
    await card(page, 'two-step-equations');
    await page.focus('.card-view .level-btn[data-try-level="3"]');
    for (let i = 0; i < 6; i++) await page.keyboard.press('Enter');                             // open, Not now, open, Not now…
    await page.waitForTimeout(300);
    expect((await playing(page)).play).toBe(false);
    if (await isOpen(page)) await page.keyboard.press('Escape');
    await page.click('.card-view .level-btn[data-try-level="3"]');
    expect(await page.evaluate(() => document.activeElement?.textContent)).toBe('Not now');
    await page.click('#dialog [data-choose="try"]');
    await page.waitForFunction(() => window.__mat?.session()?.board);
    expect(await page.locator('#testout-bar').innerText()).toContain('No help · Level 3');
    await page.click('[data-giveup]');
    await page.waitForSelector('.testout-done');
    expect(await page.locator('.testout-done').innerText()).toContain('Not yet.');
    await page.click('[data-go="retry"]');
    await page.waitForFunction(() => window.__mat?.session()?.board);
    const p = await page.evaluate(() => window.__mat.session().problem);
    await check(page, p.x + 1);
    await page.waitForSelector('.testout-done', { timeout: 5000 });
    expect(await page.locator('.testout-done').innerText()).toContain('Try Level 1 first.');
    await page.close();
  }, 60000);
});
