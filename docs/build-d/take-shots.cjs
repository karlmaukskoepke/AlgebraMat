// Build D acceptance screenshots (bd-NN-…), 1366×768 and 1366×650, from a running dev server:
//   node docs/build-d/take-shots.cjs http://localhost:5173/ docs/build-d
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const BASE = process.argv[2], OUT = process.argv[3];
(async () => {
  const b = await chromium.launch();
  for (const H of [768, 650]) {
    const p = await b.newPage({ viewport: { width: 1366, height: H } });
    const open = async (q) => { await p.goto(BASE + q); await p.evaluate(() => localStorage.clear()); await p.goto(BASE + q); await p.waitForTimeout(900); };
    const shot = async (n, wait = 700) => { await p.waitForTimeout(wait); await p.screenshot({ path: `${OUT}/bd-${n}-${H}.png` }); };
    const away = () => p.mouse.move(5, H - 5);
    const L2 = '?pack=add-both&level=2&seed=7&nosignin=1';
    const L3 = '?pack=add-both&level=3&seed=7&nosignin=1';
    const L4 = '?pack=add-both&level=4&seed=7&nosignin=1';
    const D3 = '?pack=divide-it&level=3&seed=7&nosignin=1';
    const enter = async (n = 1) => { for (let i = 0; i < n; i++) { await p.keyboard.press('Enter'); await p.waitForTimeout(200); } };
    const addMove = async (n) => { await p.click('[data-move="add"]'); await p.keyboard.type(String(n)); };
    const tok = async (sel) => (await p.$(sel)).boundingBox();
    const dragTo = async (a, x, y, hold = false) => { await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await p.mouse.down(); await p.mouse.move(a.x, a.y + 12, { steps: 3 }); await p.mouse.move(x, y, { steps: 10 }); if (!hold) { await p.mouse.up(); await p.waitForTimeout(300); } };

    await open(L2); await away(); await shot('01-opening-no-banner');
    await open(L4); await addMove(-8); await away(); await shot('02-green-go');
    await enter(); await away(); await shot('03-green-next', 1800);
    await enter(); await p.keyboard.type('-12'); await away(); await shot('04-green-check');
    await open(L4); await addMove(8); await enter(); await away(); await shot('05-error-arrow-below-work', 2600);
    await open(L2); await p.keyboard.type('3'); await enter(); await away(); await shot('06-check-drag-into-x');
    const chip = await tok('[data-chip]'); const x = await tok('[data-x][data-action="placeValue"]');
    await dragTo(chip, x.x + x.width / 2, x.y + x.height / 2, true); await shot('07-check-dragging', 200);
    await p.mouse.up(); await away(); await shot('08-check-copy-on-the-right');
    await enter(); await shot('09-check-stepping'); await enter(); await shot('10-check-balanced');
    await open(L4); await p.keyboard.type('4'); await enter(); await enter(); await enter(2); await away(); await shot('11-not-balanced');
    await enter(); await shot('12-other-wrong-hint');
    await open(L2); await p.keyboard.type('-8'); await enter(); await enter(); await enter(2); await away(); await shot('13-opposite-error');
    await enter(); await shot('14-opposite-hint');
    await open(L2); await addMove(-8); await enter(); await p.waitForTimeout(300); await enter(); await p.keyboard.type('19'); await enter(); await enter(); await enter(2); await away(); await shot('15-sizes-added-error');
    await enter(); await shot('16-sizes-added-party-or-battle', 1800);
    await open(L4); await p.keyboard.type('-12'); await enter(); await enter(); await enter(2); await enter(); await away(); await shot('17-forced-move', 900);
    await open(L2); const plus = await tok('.lx-live [data-like="num"][data-side="left"]'); const r = await tok('.lx-live [data-side="right"] [data-like="num"]');
    await dragTo(plus, r.x - 6, r.y + r.height / 2, true); await shot('18-drag-red-over-the-line', 200);
    await p.mouse.up(); await p.waitForTimeout(1800);
    await open(L3); const m4 = await tok('.lx-live [data-like="num"][data-side="left"]'); const m3 = await tok('.lx-live [data-side="right"] [data-like="num"]');
    await dragTo(m4, m3.x + m3.width + 40, m3.y + m3.height / 2); await p.waitForTimeout(1800); await enter();
    const nums = await p.$$('.lx-live [data-side="right"] [data-like="num"]'); const n1 = await nums[1].boundingBox(); const n0 = await nums[0].boundingBox();
    await dragTo(n1, n0.x + n0.width / 2, n0.y + n0.height / 2); await away(); await shot('19-combine');
    await open(D3); await p.click('[data-move="fraction"]'); await p.keyboard.type('1/2'); await enter(); await away(); await shot('20-divide-half-fails', 900);
    await enter(); await shot('21-divide-half-crossed');
    await p.click('.dv-choice[data-n="3"]'); await shot('22-divide-third-fails', 900);
    await enter(); await shot('23-divide-half-and-third-crossed');
    await p.click('.dv-choice[data-n="5"]'); await away(); await shot('24-divide-fifth-applied');
    await open(L4); await p.click('[data-action="stuck"]'); await p.waitForTimeout(200); await p.click('[data-action="stuck"]');
    await addMove(-8); await p.click('[data-action="addTo"][data-side="left"]'); await p.click('[data-action="addTo"][data-side="right"]'); await enter();
    await away(); await shot('25-party-or-battle-at-the-counters', 900);
    await p.click('.spot-choices [data-value="battle"]'); await away(); await shot('26-battle-pairs-crossed-off');
    await open(L2); await addMove(-8); await enter(); await p.waitForTimeout(300); await enter();
    await p.click('[data-action="stuck"]'); await p.waitForTimeout(1800); await p.click('.spot-choices [data-value="battle"]'); await p.click('[data-action="stuck"]');
    const tapZone = async (z, n) => { for (let i = 0; i < n; i++) await p.evaluate((zz) => document.querySelector(`.alone-tray [data-action="zone"][data-zone="${zz}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true })), z); };
    await p.click('.alone-tray [data-sign="+"]'); await tapZone(0, 11); await p.click('.alone-tray [data-sign="-"]'); await tapZone(1, 8); await p.click('.alone-tray [data-action="cntCheck"]');
    for (let k = 0; k < 5; k++) for (const z of [0, 1]) await p.evaluate((zz) => [...document.querySelectorAll(`.alone-tray [data-action="counter"][data-zone="${zz}"]`)].find((g) => !g.querySelector('.is-canceled'))?.dispatchEvent(new MouseEvent('click', { bubbles: true })), z);
    await away(); await shot('27-counters-crossed-off');
    await open(L4); await addMove(8); await enter(); await p.waitForTimeout(2600); await enter(); await p.waitForTimeout(300);
    await p.keyboard.press('Escape'); await p.waitForTimeout(200); await addMove(8); await enter(); await p.waitForTimeout(2600); await enter(); await p.waitForTimeout(300);
    await p.click('[data-action="teach"]'); await away(); await shot('28-teach-me');
    await p.close();
  }
  await b.close();
})();
