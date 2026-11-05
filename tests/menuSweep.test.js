// The main menu, in a real browser (Build X, Part 3; Build AB). Clicks every card name (straight into the card); opens each card's popup of
// levels by pointing (not on a quick pass), by its chevron, by the keyboard (Tab to the name, then the chevron; Enter, the arrows, Escape)
// and by tapping (a touch screen with no hover); checks where it opens (beside the name, on the left near the right edge, inside the window,
// never over a card name below), that it closes, that a level in it opens, each section's footer (Find my level, Timed challenges); that the "3 of 5" on a card name, its shape and the card's own dots agree, that the page never scrolls
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

  // ---- Build AB: a popup of each card's levels (pointer, chevron, keyboard, touch), and each section's footer ----
  const popOpen = (page) => page.evaluate(() => document.querySelector('.lv-pop:not([hidden])')?.dataset.pop ?? null);
  const popInfo = (page) => page.evaluate(() => {
    const p = document.querySelector('.lv-pop:not([hidden])');
    if (!p) return null;
    const r = p.getBoundingClientRect();
    const row = document.querySelector(`.card-row[data-row="${p.dataset.pop}"]`)?.getBoundingClientRect();
    const names = [...document.querySelectorAll('.card-row')].map((e) => e.getBoundingClientRect());
    const hit = (a, b) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
    return {
      id: p.dataset.pop, side: p.dataset.side, rows: [...p.querySelectorAll('.pop-level')].map((e) => ({ text: e.innerText.replace(/\s+/g, ' ').trim(), cls: e.className, label: e.getAttribute('aria-label'), level: e.dataset.level ?? null, locked: e.dataset.locked ?? null })),
      head: p.querySelector('.pop-head')?.innerText.replace(/\s+/g, ' ').trim(), role: p.getAttribute('role'),
      inside: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
      coversOwnRow: row ? hit(r, row) : null,
      // the card names in the same column as its own, below it (the ones the pointer may still be moving to)
      coversNamesBelow: row ? names.filter((n) => Math.abs(n.left - row.left) < 2 && n.top > row.top).some((n) => hit(r, n)) : null,
      animations: p.getAnimations().length,
    };
  });

  it('a card name shows its levels in a popup by pointing (not on a quick pass); the popup lists each level and its status, a level in it opens the level', async () => {
    const { page, context, errors } = await open('&demo=menu');
    const name = await page.locator('.card-name[data-card="divide-it"]').boundingBox();
    // a quick pass over the name, on the way down the list
    await page.mouse.move(name.x + 30, name.y + 8);
    await wait(page, 80);
    await page.mouse.move(name.x + 30, name.y + 260, { steps: 4 });
    await page.mouse.move(name.x + 30, name.y - 90, { steps: 4 });      // (on up to the section's words, where there is no name)
    await wait(page, 400);
    expect(await popOpen(page)).toBe(null);
    // resting on it
    await page.mouse.move(name.x + 30, name.y + name.height / 2);
    await wait(page, 450);
    const info = await popInfo(page);
    expect(info?.id).toBe('divide-it');
    expect(info.role).toBe('menu');
    expect(info.side).toBe('right');
    expect(info.inside).toBe(true);
    expect(info.coversOwnRow).toBe(false);
    expect(info.coversNamesBelow).toBe(false);
    expect(info.head).toBe('Divide it 3 of 5');
    // Divide it in this state: Levels 1-2 earned, 3 placed, 4 the current one, 5 locked; then See why it works
    expect(info.rows.map((r) => r.cls.match(/is-(earned|placed|none|locked)/)?.[1] ?? 'why')).toEqual(['earned', 'earned', 'placed', 'none', 'locked', 'why']);
    expect(info.rows[0].text).toMatch(/^Level 1 ax = b, a = 2 or 3$/);
    expect(info.rows[2].text).toContain('One problem earns it');
    expect(info.rows[3].cls).toContain('is-current');
    expect(info.rows[4].text).toBe('Level 5 all mixed');                      // (greyed, with a lock; its note shows on pointing)
    expect(info.rows[4].label).toBe('Level 5, all mixed, locked. Finish Level 4 or tap to skip ahead.');   // (a Solve it card: Build Z; shorter since Build AD)
    expect(info.rows[4].locked).toBe('6');
    expect(info.rows[5].text).toBe('? See why it works');
    expect(await page.locator('.card-chev[data-chev="divide-it"]').getAttribute('aria-expanded')).toBe('true');
    // a locked row, pointed at: its note shows
    await page.hover('.lv-pop:not([hidden]) .pop-level.is-locked');
    await wait(page, 200);
    expect(await page.locator('.lv-pop:not([hidden]) .pop-level.is-locked .pop-tip').evaluate((e) => getComputedStyle(e).visibility)).toBe('visible');
    // moving about inside the popup keeps it; leaving both the name and the popup closes it
    await page.hover('.lv-pop:not([hidden]) .pop-level >> nth=1');
    await wait(page, 300);
    expect(await popOpen(page)).toBe('divide-it');
    await page.mouse.move(700, 760, { steps: 6 });
    await wait(page, 400);
    expect(await popOpen(page)).toBe(null);
    // resting on another name moves the popup there
    await page.hover('.card-name[data-card="add-both"]');
    await wait(page, 450);
    expect(await popOpen(page)).toBe('add-both');
    // a level in the popup opens that level
    await page.click('.lv-pop:not([hidden]) .pop-level[data-level="4"]');
    await wait(page, 600);
    expect(await page.locator('#home').isHidden()).toBe(true);
    expect(await page.locator('#title').textContent()).toBe('ADD TO BOTH SIDES · Level 3');
    expect(errors).toEqual([]);
    await context.close();
  }, 60000);

  it.each([768, 650])('near the right edge the popup opens on the left; it stays inside the window and never covers a card name below (1366×%i)', async (height) => {
    const { page, context } = await open('&demo=menu', {}, height);
    for (const id of ['combineit', 'distribute-combine', 'distribute-solve', 'variables-both-sides', 'strange-solutions']) {
      await page.mouse.move(5, 5);
      await wait(page, 300);
      await page.hover(`.card-name[data-card="${id}"]`);
      await wait(page, 450);
      const info = await popInfo(page);
      expect(info?.id, id).toBe(id);
      expect(info.side, id).toBe(['variables-both-sides', 'strange-solutions'].includes(id) ? 'left' : 'right');
      expect(info.inside, id).toBe(true);
      expect(info.coversOwnRow, id).toBe(false);
      expect(info.coversNamesBelow, id).toBe(false);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await context.close();
  }, 60000);

  it('works from the keyboard: Tab reaches the name, then its chevron; Enter opens the popup, the arrows move, Escape closes, Enter opens a level', async () => {
    const { page, context } = await open('&demo=menu');
    let found = false;
    for (let i = 0; i < 20 && !found; i++) {
      await page.keyboard.press('Tab');
      found = await page.evaluate(() => document.activeElement?.dataset.card === 'combineit');
    }
    expect(found).toBe(true);
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.dataset.chev)).toBe('combineit');
    expect(await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))).toBe('Combine it: show its levels');
    await page.keyboard.press('Enter');
    await wait(page, 150);
    expect(await popOpen(page)).toBe('combineit');
    expect(await page.evaluate(() => document.activeElement?.getAttribute('role'))).toBe('menuitem');
    const first = await page.evaluate(() => document.activeElement?.dataset.level);
    await page.keyboard.press('ArrowDown');
    expect(await page.evaluate(() => document.activeElement?.dataset.level)).toBe(String(Number(first) + 1));
    await page.keyboard.press('ArrowUp');
    expect(await page.evaluate(() => document.activeElement?.dataset.level)).toBe(first);
    await page.keyboard.press('Escape');
    await wait(page, 150);
    expect(await popOpen(page)).toBe(null);
    expect(await page.evaluate(() => document.activeElement?.dataset.chev)).toBe('combineit');
    // Space opens it too; Tab from inside it goes on to the next card name, and the popup closes
    await page.keyboard.press(' ');
    await wait(page, 150);
    expect(await popOpen(page)).toBe('combineit');
    await page.keyboard.press('Tab');
    await wait(page, 150);
    expect(await popOpen(page)).toBe(null);
    expect(await page.evaluate(() => document.activeElement?.dataset.card)).toBe('flipit');
    // back to the chevron, open, down to Level 2, Enter: the level opens
    await page.keyboard.press('Shift+Tab');
    expect(await page.evaluate(() => document.activeElement?.dataset.chev)).toBe('combineit');
    await page.keyboard.press('Enter');
    await wait(page, 150);
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await wait(page, 600);
    expect(await page.locator('#home').isHidden()).toBe(true);
    expect(await page.locator('#title').textContent()).toBe('COMBINE IT · Level 2');
    await context.close();
  }, 60000);

  it('works on a touch screen: the chevron opens and closes the popup, a tap outside closes it, a tap on a name opens the card, a locked row shows its note (Count it) or asks to skip ahead (Solve it)', async () => {
    const { page, context } = await open('&demo=menu', { hasTouch: true, isMobile: true });
    expect(await page.evaluate(() => matchMedia('(hover: none)').matches)).toBe(true);
    const chev = await page.locator('.card-chev[data-chev="flip-everything"]').boundingBox();
    expect(chev.width).toBeGreaterThanOrEqual(44);
    await page.tap('.card-chev[data-chev="flip-everything"]');
    await wait(page, 250);
    expect(await popOpen(page)).toBe('flip-everything');
    const info = await popInfo(page);
    expect(info.inside).toBe(true);
    // a tap on a locked row of a Solve it card asks to skip ahead (Build Z): the popup goes, the panel opens; Not now closes it
    await page.tap('.lv-pop:not([hidden]) .pop-level.is-locked');
    await wait(page, 250);
    expect(await popOpen(page)).toBe(null);
    expect(await page.locator('#dialog[open]').innerText()).toContain('Want to try it? Solve 2 problems here to skip ahead.');
    await page.tap('#dialog [data-close]');
    await wait(page, 200);
    // on a Count it card a tap on a locked row still shows its note and keeps the popup
    await page.tap('.card-chev[data-chev="lasso"]');
    await wait(page, 250);
    await page.tap('.lv-pop:not([hidden]) .pop-level.is-locked', { force: true });   // (aria-disabled: Playwright waits for it to be enabled; a finger does not)
    await wait(page, 200);
    expect(await popOpen(page)).toBe('lasso');
    expect(await page.locator('.lv-pop:not([hidden]) .pop-level.is-tipping .pop-tip').count()).toBe(1);
    expect(await page.locator('#dialog[open]').count()).toBe(0);
    // a second tap on the chevron closes it
    await page.tap('.card-chev[data-chev="lasso"]');
    await wait(page, 250);
    expect(await popOpen(page)).toBe(null);
    // a tap outside closes it
    await page.tap('.card-chev[data-chev="flip-everything"]');
    await wait(page, 250);
    await page.tap('.home-head .tagline');
    await wait(page, 250);
    expect(await popOpen(page)).toBe(null);
    // a tap on the name opens the card, as before
    await page.tap('.card-name[data-card="distribute-more"]');
    await wait(page, 300);
    expect(await page.locator('.card-view .pack-head h2').textContent()).toBe('Distribute more');
    await context.close();
  }, 60000);

  it.each([[390, 844], [900, 700]])('on a narrow window (%i×%i) the popup stays inside the window and the page never scrolls sideways', async (width, height) => {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: true, isMobile: width < 500 });
    const page = await context.newPage();
    await page.goto(`${base}?nosignin=1&menu=1&demo=menu`);
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${base}?nosignin=1&menu=1&demo=menu`);
    await wait(page, 500);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    for (const id of ['combineit', 'two-step-equations', 'strange-solutions']) {
      await page.locator(`.card-chev[data-chev="${id}"]`).scrollIntoViewIfNeeded();
      await page.tap(`.card-chev[data-chev="${id}"]`);
      await wait(page, 250);
      const info = await popInfo(page);
      expect(info?.id, id).toBe(id);
      expect(info.inside, id).toBe(true);
      expect(info.coversOwnRow, id).toBe(false);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), id).toBe(true);
      await page.locator('.sec-count .section-blurb').scrollIntoViewIfNeeded(); await page.tap('.sec-count .section-blurb');
      await wait(page, 200);
    }
    await context.close();
  }, 60000);

  it.each([768, 650])('each section has a footer: Find my level on Count it, Build it and Solve it (not Solve it Plus), Timed challenges on Count it only (1366×%i)', async (height) => {
    const { page, context } = await open('', {}, height);
    const feet = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('.section-panel')].map((p) => [p.dataset.section, [...p.querySelectorAll('.section-foot .foot-btn')].map((b) => b.textContent.trim())])));
    expect(feet).toEqual({ count: ['Find my level', '⏱ Timed challenges'], build: ['Find my level'], solve: ['Find my level'], 'solve-plus': [] });
    expect(await page.locator('.sec-solve-plus .section-foot').count()).toBe(0);
    expect(await page.evaluate(() => document.body.innerText.includes('no placement quiz'))).toBe(false);
    // the footer never crowds the panel: the page does not scroll at all at 1366×650 or 768, and every footer sits inside its panel
    const fit = await page.evaluate(() => ({
      tall: document.documentElement.scrollHeight <= innerHeight, wide: document.documentElement.scrollWidth <= innerWidth,
      inside: [...document.querySelectorAll('.section-foot')].every((f) => { const a = f.getBoundingClientRect(); const b = f.closest('.section-panel').getBoundingClientRect(); return a.bottom <= b.bottom - 8 && a.left >= b.left; }),
    }));
    expect(fit).toEqual({ tall: true, wide: true, inside: true });
    // the section titles are plain headings now: nothing expands from them
    expect(await page.locator('.section-title').evaluateAll((els) => els.every((e) => e.tagName === 'H2' && !e.closest('button')))).toBe(true);
    await page.hover('.sec-solve .section-title');
    await wait(page, 450);
    expect(await page.locator('.section-sheet, .is-expanded').count()).toBe(0);
    // Timed challenges: its list, then one starts
    await page.click('.foot-chal-btn');
    await wait(page, 200);
    expect(await popOpen(page)).toBe('chal-count');
    expect(await page.locator('.chal-pop .pop-name').allTextContents()).toEqual(['Adding', 'Subtracting', 'Add & subtract', 'Multiplying', 'Big multiplying', 'Everything']);
    expect((await popInfo(page)).inside).toBe(true);
    await page.keyboard.press('Escape');
    await wait(page, 150);
    expect(await popOpen(page)).toBe(null);
    await page.click('.foot-chal-btn');
    await page.click('.chal-pop [data-fluency="add"]');
    await wait(page, 500);
    expect(await page.locator('#home').isHidden()).toBe(true);
    expect(await page.locator('#quiz').isVisible()).toBe(true);
    // Find my level opens the section's placement quiz
    await page.goto(`${base}?nosignin=1&menu=1`);
    await wait(page, 500);
    await page.click('.sec-build .foot-quiz');
    await wait(page, 500);
    expect(await page.locator('#quiz').isVisible()).toBe(true);
    expect(await page.evaluate(() => /1 of \d+/.test(document.body.innerText))).toBe(true);
    await context.close();
  }, 60000);

  it('under reduced motion the popup simply appears (nothing animates)', async () => {
    const { page, context } = await open('&demo=menu', { reducedMotion: 'reduce' });
    await page.hover('.card-name[data-card="lasso"]');
    await wait(page, 450);
    const info = await popInfo(page);
    expect(info?.id).toBe('lasso');
    expect(info.animations).toBe(0);
    await context.close();
  }, 60000);

  it('shines once what improved, stops at a key, and never moves under reduced motion; smooth on a slowed processor', async () => {
    const { page, context } = await open('&demo=shine');
    const cdp = await context.newCDPSession(page);
    // (what shines on screen: a popup still closed keeps its rows' shine until it opens, Build AB)
    const shining = () => page.$$eval('.is-shining', (els) => els.filter((e) => !e.closest('.lv-pop[hidden]')).map((e) => e.dataset.card ?? e.dataset.section ?? e.className));
    const first = await shining();
    expect(first).toContain('strange-solutions');
    expect(first).toContain('solve-plus');
    expect(first).toContain('divide-it');
    // a key stops it at once
    await page.keyboard.press('Shift');
    expect(await shining()).toEqual([]);
    // Divide it's Level 1 (saved level 2) went from placed to earned: it shines in the popup when the popup opens (Build AB)
    await page.hover('.card-name[data-card="divide-it"]');
    await wait(page, 450);
    expect(await page.locator('.lv-pop:not([hidden]) .pop-level.is-shining').evaluateAll((els) => els.map((e) => e.dataset.level))).toEqual(['2']);
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
