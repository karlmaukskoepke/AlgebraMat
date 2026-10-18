// Acceptance screenshots for round 2 (lx2-NN-…), real build, 1366×768 and 1366×650.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const BASE = process.argv[2], OUT = process.argv[3], H = Number(process.argv[4] || 768);
const L2 = `${BASE}?pack=add-both&level=2&seed=7&ui=lights&nosignin=1`;
const L3 = `${BASE}?pack=add-both&level=3&seed=7&ui=lights&nosignin=1`;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1366, height: H } });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const shot = async (n) => { await p.waitForTimeout(350); await p.screenshot({ path: `${OUT}/lx2-${n}-${H}.png` }); };
  const open = async (u) => { await p.goto(u); await p.evaluate(() => localStorage.clear()); await p.goto(u); await p.waitForTimeout(900); };
  const tok = (text) => p.locator('.lx-live [data-tok]', { hasText: text }).first();
  const centre = async (loc) => { const r = await loc.boundingBox(); return [r.x + r.width / 2, r.y + r.height / 2]; };
  const line = async () => (await p.textContent('.lb-text')).trim();
  const border = async () => centre(p.locator('.lx-live .lb-border'));
  async function dragTo(loc, x, y, { hold = null } = {}) {
    const [x0, y0] = await centre(loc);
    await p.mouse.move(x0, y0); await p.mouse.down();
    await p.mouse.move(x0 + 10, y0 - 4, { steps: 3 });
    for (let k = 1; k <= 8; k++) await p.mouse.move(x0 + (x - x0) * k / 8, y0 + (y - y0) * k / 8);
    if (hold) await hold();
    await p.mouse.up();
  }
  const log = [];

  // 1 opening, narrow panel (L2 and L3); 4 the line in front of "="
  await open(L2); await shot('01-opening-L2');
  const width = await p.evaluate(() => Math.round(document.querySelector('.lx-panel').getBoundingClientRect().width));
  const stack = await p.evaluate(() => Math.round(document.querySelector('.lb-main').getBoundingClientRect().width));
  log.push(`panel ${width}px, main column ${stack}px`);
  await open(L3); await shot('01-opening-L3');
  await p.locator('.lx-live .lb-border').screenshot({ path: `${OUT}/lx2-04-line-in-front-${H}.png` });
  // 2 a light expanded on hover
  await p.hover('[data-light="fewer"]'); await shot('02-light-hover');
  await p.hover('[data-light="smaller"]'); await shot('02b-light-hover-multiply');
  await p.mouse.move(10, 10);

  // 5, 6, 7: drag "− 4" (L3: x − 4 = −3): lifted, over the line, dropped
  const [bx] = await border();
  const t = tok('4');
  const [tx, ty] = await centre(t);
  await dragTo(t, tx - 60, ty - 30, { hold: async () => { await shot('05-drag-lifted'); } });
  log.push(`after a drop on its own side: ${await line()}`);
  await open(L3);
  await dragTo(tok('4'), bx + 90, ty, { hold: async () => { await shot('06-over-the-line'); } });
  await shot('07-after-drop'); log.push(`after the cross: ${await line()}`);

  // 8 combine: Next, then −3 dropped onto +4 (x = −3 + 4)
  await p.click('[data-action="lxNext"]');
  const right = p.locator('.lx-live [data-side="right"] [data-tok]');
  await dragTo(right.nth(1), ...(await centre(right.nth(0))));
  await shot('08a-combine-blank'); log.push(`combine: ${await line()}`);
  await p.keyboard.type('5'); await p.keyboard.press('Enter'); await shot('08b-combine-wrong'); log.push(`wrong: ${await line()}`);
  await p.keyboard.type('1'); await shot('08c-combine-typed');
  await p.keyboard.press('Enter'); await shot('08d-combine-right'); log.push(`right: ${await line()}`);

  // 9 reorder: "+ 8" to before x (L2)
  await open(L2);
  const [x0] = await centre(tok('x'));
  const [, y8] = await centre(tok('8'));
  await dragTo(tok('8'), x0 - 40, y8); await shot('09-reorder'); log.push(`reorder row: ${await p.textContent('.lx-live')}`);
  // 10 x across: snaps back
  await open(L2);
  await dragTo(tok('x'), bx + 90, y8); await shot('10-x-snaps-back'); log.push(`x across: ${await line()}`);

  // 11 the minus (L3): tap, and back
  await open(L3);
  await p.click('.lx-live [data-minus]'); await shot('11a-minus-tapped'); log.push(`minus: ${await p.textContent('.lx-live')} | ${await line()}`);
  await p.click('.lx-live [data-minus]'); await shot('11b-minus-back'); log.push(`back: ${await p.textContent('.lx-live')}`);

  // 13 keyboard only: Tab to "− 4", Enter, → → , Enter
  await open(L3);
  await p.click('.lb-line'); 
  let k = 0;
  while (k++ < 30) { await p.keyboard.press('Tab'); if (await p.evaluate(() => document.activeElement?.dataset?.tok && document.activeElement.textContent.includes('4'))) break; }
  await shot('13a-keyboard-focus');
  await p.keyboard.press('Enter'); await shot('13b-keyboard-picked');
  await p.keyboard.press('ArrowRight'); await shot('13c-keyboard-right1');
  await p.keyboard.press('ArrowRight'); await shot('13d-keyboard-over-line');
  await p.keyboard.press('Enter'); await shot('13e-keyboard-dropped'); log.push(`keyboard: ${await line()} | tabs ${k}`);

  // 3 forced move: a correct guess on problem 1 (x + 8 = 11), then the next problem
  await open(L2);
  await p.keyboard.type('3'); await p.keyboard.press('Enter');
  for (let i = 0; i < 3; i++) { await p.waitForTimeout(250); await p.keyboard.press('Enter'); }
  await p.waitForTimeout(400); await p.keyboard.press('Enter');
  await shot('03a-forced-move'); log.push(`forced: ${await line()} | x= disabled ${await p.isDisabled('[data-fk="answer"]')}`);
  const r2 = p.locator('.lx-live [data-side="left"] [data-tok]');
  await dragTo(r2.nth(1), bx + 90, (await centre(r2.nth(1)))[1]);
  await shot('03b-forced-after-move');
  await p.click('[data-action="lxNext"]'); await shot('03c-forced-x-live'); log.push(`after Next: x= disabled ${await p.isDisabled('[data-fk="answer"]')}`);

  // 14 the same Add L2 screen without the flag
  await open(L2.replace('&ui=lights', '')); await shot('14-noflag-L2');
  console.log(log.join('\n')); console.log('errors', errs);
  await b.close();
})();
