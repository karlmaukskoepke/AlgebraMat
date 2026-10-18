const { chromium } = require('/opt/node-tools/node_modules/playwright');
const BASE = process.argv[2], OUT = process.argv[3], H = Number(process.argv[4] || 768);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1366, height: H }, hasTouch: true });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  const u = `${BASE}?pack=add-both&level=3&seed=7&ui=lights&nosignin=1`;
  await p.goto(u); await p.evaluate(() => localStorage.clear()); await p.goto(u); await p.waitForTimeout(900);
  const c = async (sel) => { const r = await p.locator(sel).first().boundingBox(); return [r.x + r.width / 2, r.y + r.height / 2]; };
  const [tx, ty] = await c('.lx-live [data-tok]:has([data-minus])');
  const [bx] = await c('.lx-live .lb-border');
  const scroll0 = await p.evaluate(() => scrollY);
  // a tap on the minus (no movement): shows −4 as a negative
  await touch('touchStart', tx - 14, ty); await touch('touchEnd');
  await p.waitForTimeout(300);
  const afterTap = await p.textContent('.lx-live');
  await touch('touchStart', tx - 14, ty); await touch('touchEnd'); await p.waitForTimeout(300);
  // a finger drag across the line
  await touch('touchStart', tx, ty);
  for (let k = 1; k <= 12; k++) { await touch('touchMove', tx + (bx + 100 - tx) * k / 12, ty + 6 * Math.sin(k)); await p.waitForTimeout(16); }
  await p.waitForTimeout(200);
  await p.screenshot({ path: `${OUT}/lx2-15-touch-over-line-${H}.png` });
  const ghost = await p.evaluate(() => { const g = document.querySelector('.lx-dragghost'); return g ? { text: g.textContent, bottom: Math.round(g.getBoundingClientRect().bottom) } : null; });
  await touch('touchEnd'); await p.waitForTimeout(400);
  await p.screenshot({ path: `${OUT}/lx2-15b-touch-dropped-${H}.png` });
  // a light tapped open, then closed
  const [dx, dy] = await c('[data-light="fewer"]');
  await p.touchscreen.tap(dx, dy); await p.waitForTimeout(250);
  const open1 = await p.evaluate(() => document.querySelector('.lx-dot.is-open')?.dataset.light ?? null);
  await p.screenshot({ path: `${OUT}/lx2-15c-touch-light-${H}.png` });
  await p.touchscreen.tap(dx, dy); await p.waitForTimeout(250);
  const open2 = await p.evaluate(() => document.querySelector('.lx-dot.is-open')?.dataset.light ?? null);
  console.log({ afterTap, ghost, fingerY: ty, line: await p.textContent('.lb-text'), scrolled: (await p.evaluate(() => scrollY)) - scroll0, open1, open2 });
  await b.close();
})();
