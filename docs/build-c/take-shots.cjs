// Build C acceptance screenshots (bc-NN-…), 1366×768 and 1366×650, from a running dev server:
//   node docs/build-c/take-shots.cjs http://localhost:5173/ docs/build-c
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const BASE = process.argv[2], OUT = process.argv[3];
(async () => {
  const b = await chromium.launch();
  for (const H of [768, 650]) {
    const p = await b.newPage({ viewport: { width: 1366, height: H } });
    const open = async (q) => { await p.goto(BASE + q); await p.evaluate(() => localStorage.clear()); await p.goto(BASE + q); await p.waitForTimeout(900); };
    const shot = async (n, wait = 600) => { await p.waitForTimeout(wait); await p.screenshot({ path: `${OUT}/bc-${n}-${H}.png` }); };
    const L2 = '?pack=add-both&level=2&seed=7&nosignin=1';
    const L4 = '?pack=add-both&level=4&seed=7&nosignin=1';
    const addMove = async (n) => { await p.click('[data-move="add"]'); await p.keyboard.type(String(n)); await p.keyboard.press('Enter'); };
    await open(L2); await shot('01-add-L1-opening');
    await open(L4); await shot('02-add-L3-opening');
    await p.hover('[data-move="add"]'); await shot('03-preview-on-hover');
    await p.mouse.move(5, 5); await addMove(8); await shot('04-red-move-spotlight', 2400);
    await p.keyboard.press('Enter'); await shot('05-hint-after-undo');
    await open(L4); await p.keyboard.type('4'); await p.keyboard.press('Enter');
    for (let i = 0; i < 3; i++) { await p.waitForTimeout(250); await p.keyboard.press('Enter'); }
    await shot('06-wrong-guess');
    await open('?pack=divide-it&level=3&seed=7&nosignin=1'); await shot('07-divide-opening');
    await open(L4); await p.keyboard.type('12'); await p.keyboard.press('-'); await p.keyboard.press('Enter');
    for (let i = 0; i < 4; i++) { await p.waitForTimeout(250); await p.keyboard.press('Enter'); }
    await p.mouse.move(5, 5); await shot('08-forced-move');
    await open(L2); await addMove(-8); await p.waitForTimeout(300); await p.click('[data-action="lxNext"]');
    await p.click('[data-action="stuck"]'); await shot('09-x-alone-1-party-or-battle');
    await p.click('.spot-choices [data-value="battle"]'); await shot('10-x-alone-2-now-type-x');
    await p.click('[data-action="stuck"]');
    const tapZone = async (z, n) => { for (let i = 0; i < n; i++) await p.evaluate((zz) => document.querySelector(`.alone-tray [data-action="zone"][data-zone="${zz}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true })), z); };
    await p.click('.alone-tray [data-sign="+"]'); await tapZone(0, 11); await p.click('.alone-tray [data-sign="-"]'); await tapZone(1, 8);
    await shot('11-x-alone-3-counters');
    await p.click('.alone-tray [data-action="cntCheck"]');
    for (let k = 0; k < 8; k++) for (const z of [0, 1]) await p.evaluate((zz) => [...document.querySelectorAll(`.alone-tray [data-action="counter"][data-zone="${zz}"]`)].find((g) => !g.querySelector('.is-canceled'))?.dispatchEvent(new MouseEvent('click', { bubbles: true })), z);
    await shot('12-x-alone-3-counted');
    await p.close();
  }
  await b.close();
})();
