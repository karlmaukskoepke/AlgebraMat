// The main menu, in a real browser (Build X, Part 3). Clicks every card name (straight into the card), expands a section by pointing, by
// the keyboard (Tab onto a title, Tab on to a card name, Enter) and by tapping (a touch screen with no hover), checks that a quick pass over
// a title does not expand it, that the "3 of 5" on a card name, its shape and the card's own dots agree, that the page never scrolls
// sideways, and that the one-time shine plays once (and not at all under reduced motion), smoothly on a slowed-down processor (a stand-in
// for a low-end Chromebook). Without Playwright it is skipped, like the other real-browser sweeps.

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
if (!pw) console.warn('menuSweep: SKIP (Playwright is not installed here; set PLAYWRIGHT_PATH)');

const wait = (page, ms) => page.waitForTimeout(ms);
const expandedId = (page) => page.evaluate(() => document.querySelector('.section-panel.is-expanded')?.dataset.section ?? null);

(pw ? describe : describe.skip)('Build X: the main menu (real browser)', () => {
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

  async function open(query, ctx = {}, height = 768) {
    const context = await browser.newContext({ viewport: { width: 1366, height }, ...ctx });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(`${base}?nosignin=1&menu=1${query}`);
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${base}?nosignin=1&menu=1${query}`);
    await wait(page, 500);
    return { page, context, errors };
  }

  it.each([768, 650])('every card name opens its card, and the counts, shapes and dots agree (1366×%i)', async (height) => {
    const { page, context, errors } = await open('&demo=menu', {}, height);
    const names = await page.$$eval('.card-name[data-card]', (els) => els.map((e) => ({
      id: e.dataset.card, label: e.querySelector('.card-label').textContent, count: e.querySelector('.card-count').textContent, status: [...e.classList].find((c) => c.startsWith('st-')),
    })));
    expect(names.length).toBe(16);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    for (const n of names) {
      await page.click(`.card-name[data-card="${n.id}"]`);
      await wait(page, 150);
      const card = await page.evaluate(() => {
        const v = document.querySelector('.card-view');
        if (!v) return null;
        const dots = [...v.querySelectorAll('.pack-head .dot')];
        return {
          title: v.querySelector('.pack-head h2').textContent, badge: v.querySelector('.status-badge .st-count').textContent,
          badgeStatus: [...v.querySelector('.status-badge').classList].find((c) => c.startsWith('st-')),
          dots: dots.length, done: dots.filter((d) => d.matches('.is-earned, .is-placed')).length, earned: dots.filter((d) => d.matches('.is-earned')).length,
          buttons: v.querySelectorAll('.level-btn').length, focused: document.activeElement?.matches('.level-btn') ?? false,
        };
      });
      expect(card, n.label).not.toBeNull();
      expect(card.title).toBe(n.label);
      expect(card.badge).toBe(n.count);
      expect(card.badgeStatus).toBe(n.status);
      expect(`${card.done} of ${card.dots}`).toBe(n.count);
      expect(card.buttons).toBe(card.dots);
      if (n.status === 'st-gold') expect(card.earned).toBe(card.dots);
      await page.click('[data-back]');
      await wait(page, 150);
      expect(await page.locator('.landing').count()).toBe(1);
    }
    expect(errors).toEqual([]);
    await context.close();
  }, 120000);

  it('expands a section by pointing at its title, not by a quick pass, and collapses when the pointer leaves', async () => {
    const { page, context } = await open('');
    const head = await page.locator('.sec-solve .section-title').boundingBox();
    // a quick pass over the title, on the way to a card name
    await page.mouse.move(head.x + 20, head.y + 10);
    await wait(page, 80);
    await page.mouse.move(head.x + 20, head.y + 400, { steps: 3 });
    await wait(page, 400);
    expect(await expandedId(page)).toBe(null);
    // resting on it
    await page.mouse.move(head.x + 20, head.y + 10);
    await wait(page, 450);
    expect(await expandedId(page)).toBe('solve');
    expect(await page.locator('.sec-solve .section-head').getAttribute('aria-expanded')).toBe('true');
    // moving about inside the expanded section keeps it; a level button in it opens the level
    await page.mouse.move(700, 400, { steps: 5 });
    await wait(page, 200);
    expect(await expandedId(page)).toBe('solve');
    // leaving it collapses it
    await page.mouse.move(1360, 760, { steps: 5 });
    await page.mouse.move(5, 760, { steps: 5 });
    await wait(page, 300);
    expect(await expandedId(page)).toBe(null);
    // a click on a title opens it too, and its Close button closes it
    await page.click('.sec-build .section-title');
    await wait(page, 200);
    expect(await expandedId(page)).toBe('build');
    await page.click('.sec-build .sheet-close');
    await wait(page, 200);
    expect(await expandedId(page)).toBe(null);
    await context.close();
  }, 60000);

  it('works from the keyboard: Tab onto a title expands it, Tab on to a card name collapses it, Enter opens the card, Escape goes back', async () => {
    const { page, context } = await open('');
    let found = false;
    for (let i = 0; i < 12 && !found; i++) {
      await page.keyboard.press('Tab');
      found = await page.evaluate(() => document.activeElement?.matches('.sec-count .section-head'));
    }
    expect(found).toBe(true);
    await wait(page, 200);
    expect(await expandedId(page)).toBe('count');
    // Enter on the open title steps into it
    await page.keyboard.press('Enter');
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest('.section-sheet')))).toBe(true);
    await page.keyboard.press('Escape');
    await wait(page, 200);
    expect(await expandedId(page)).toBe(null);
    expect(await page.evaluate(() => document.activeElement?.matches('.card-name'))).toBe(true);
    // from the title, Tab goes to the first card name and the section collapses
    await page.keyboard.press('Shift+Tab');
    await wait(page, 200);
    expect(await expandedId(page)).toBe('count');
    await page.keyboard.press('Tab');
    await wait(page, 200);
    expect(await expandedId(page)).toBe(null);
    expect(await page.evaluate(() => document.activeElement?.dataset.card)).toBe('combineit');
    await page.keyboard.press('Enter');
    await wait(page, 200);
    expect(await page.locator('.card-view .pack-head h2').textContent()).toBe('Combine it');
    await page.keyboard.press('Escape');
    await wait(page, 200);
    expect(await page.evaluate(() => document.activeElement?.dataset.card)).toBe('combineit');
    await context.close();
  }, 60000);

  it('works on a touch screen: a tap expands, a second tap collapses, a tap on a card name opens it', async () => {
    const { page, context } = await open('', { hasTouch: true, isMobile: true });
    expect(await page.evaluate(() => matchMedia('(hover: none)').matches)).toBe(true);
    await page.tap('.sec-solve-plus .section-title');
    await wait(page, 250);
    expect(await expandedId(page)).toBe('solve-plus');
    await page.tap('.sec-solve-plus .diag-none');
    await wait(page, 200);
    expect(await expandedId(page)).toBe('solve-plus');            // a tap inside it keeps it
    // the title, now at the top of the expanded section: a second tap collapses it
    await page.tap('.sec-solve-plus .sheet-title-btn');
    await wait(page, 250);
    expect(await expandedId(page)).toBe(null);
    // and a tap outside it does too
    await page.tap('.sec-solve-plus .section-title');
    await wait(page, 250);
    expect(await expandedId(page)).toBe('solve-plus');
    await page.tap('.home-head .tagline');
    await wait(page, 250);
    expect(await expandedId(page)).toBe(null);
    await page.tap('.card-name[data-card="distribute-more"]');
    await wait(page, 250);
    expect(await page.locator('.card-view .pack-head h2').textContent()).toBe('Distribute more');
    await context.close();
  }, 60000);

  it('shines once what improved, stops at a key, and never moves under reduced motion; smooth on a slowed processor', async () => {
    const { page, context } = await open('&demo=shine');
    const cdp = await context.newCDPSession(page);
    const shining = () => page.$$eval('.is-shining', (els) => els.map((e) => e.dataset.card ?? e.dataset.section ?? e.className));
    const first = await shining();
    expect(first).toContain('strange-solutions');
    expect(first).toContain('solve-plus');
    expect(first).toContain('divide-it');
    // a key stops it at once
    await page.keyboard.press('Shift');
    expect(await shining()).toEqual([]);
    // shown once: the next visit to the menu has nothing to shine
    await page.goto(`${base}?nosignin=1&menu=1`);
    await wait(page, 400);
    expect(await shining()).toEqual([]);
    // a slowed processor (6× slower, about a low-end Chromebook): the frames while it shines
    await page.evaluate(() => localStorage.clear());
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
    await page.goto(`${base}?nosignin=1&menu=1&demo=shine`);
    await wait(page, 2500);                                             // (the page loaded and drawn; then the shine again, measured)
    const frames = await page.evaluate(() => new Promise((resolve) => {
      const marked = [...document.querySelectorAll('.card-name, .section-panel, .dot')].slice(0, 30);
      marked.forEach((e) => e.classList.add('is-shining'));
      let last = performance.now(); const out = []; const end = last + 1600;
      const tick = (t) => { out.push(t - last); last = t; if (t < end) requestAnimationFrame(tick); else resolve(out); };
      requestAnimationFrame(tick);
    }));
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    frames.sort((x, y) => x - y);
    const median = frames[frames.length >> 1];
    const p95 = frames[Math.floor(frames.length * 0.95)];
    console.log(`menuSweep: while 30 things shine on a processor 6× slower: ${frames.length} frames in 1.6 s, median ${Math.round(median)} ms, 95th percentile ${Math.round(p95)} ms, longest ${Math.round(frames.at(-1))} ms`);
    // (run alone it is about 17 ms a frame; beside the other real-browser sweeps the machine is busy, so the bar is 30 frames a second)
    expect(median).toBeLessThan(34);
    await context.close();
    // reduced motion: marked, but nothing animates
    const still = await open('&demo=shine', { reducedMotion: 'reduce' });
    const anims = await still.page.evaluate(() => document.getAnimations().filter((a) => a.effect?.target?.closest?.('.home')).length);
    expect(anims).toBe(0);
    await still.context.close();
  }, 90000);

  it('says "New levels added!" once when a card shows more levels than before, and works out its status over all of them', async () => {
    const { page, context } = await open('&demo=grew');
    const item = await page.evaluate(() => {
      const li = document.querySelector('.card-name[data-card="strange-solutions"]').closest('.card-item');
      return { text: li.innerText.replace(/\s+/g, ' '), status: [...li.querySelector('.card-name').classList].find((c) => c.startsWith('st-')) };
    });
    expect(item.text).toContain('New levels added!');
    expect(item.text).toContain('2 of 3');
    expect(item.status).toBe('st-silver');
    await page.goto(`${base}?nosignin=1&menu=1`);
    await wait(page, 400);
    expect(await page.locator('.new-levels').count()).toBe(0);
    await context.close();
  }, 60000);
});
