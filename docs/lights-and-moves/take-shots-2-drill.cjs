const { chromium } = require('/opt/node-tools/node_modules/playwright');
const BASE = process.argv[2], OUT = process.argv[3], H = Number(process.argv[4] || 768);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1366, height: H } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const u = `${BASE}?ui=lights&drill=distribute&nosignin=1`;
  await p.goto(u); await p.evaluate(() => localStorage.clear()); await p.goto(u); await p.waitForTimeout(900);
  const shot = async (n) => { await p.waitForTimeout(350); await p.screenshot({ path: `${OUT}/lx2-12${n}-${H}.png` }); };
  const c = async (sel, i = 0) => { const r = await p.locator(sel).nth(i).boundingBox(); return [r.x + r.width / 2, r.y + r.height / 2]; };
  const drag = async (from, to, hold) => { await p.mouse.move(...from); await p.mouse.down(); for (let k = 1; k <= 10; k++) await p.mouse.move(from[0] + (to[0] - from[0]) * k / 10, from[1] + (to[1] - from[1]) * k / 10); if (hold) await hold(); await p.mouse.up(); await p.waitForTimeout(300); };
  const line = async () => (await p.textContent('.lb-text')).trim();
  const row = async () => (await p.textContent('.lx-live')).replace(/\s+/g, ' ');
  const log = [];
  await shot('a-drill-start'); log.push(`start: ${await row()} | ${await line()}`);
  // the factor dragged before the minus is tapped: refused
  await drag(await c('.lx-live [data-factor]'), await c('.lx-live [data-paren]'));
  await shot('b-refused'); log.push(`refused: ${await line()}`);
  await p.click('.lx-live [data-minus]'); await shot('c-minus-tapped'); log.push(`minus: ${await row()}`);
  await drag(await c('.lx-live [data-factor]'), await c('.lx-live [data-paren]'), async () => { await shot('d-factor-over-paren'); });
  await shot('e-two-blanks'); log.push(`blanks: ${await line()}`);
  await p.keyboard.type('-2'); await p.keyboard.press('Enter'); await p.keyboard.type('-4'); await shot('f-blanks-typed');
  await p.keyboard.press('Enter'); await shot('g-brought-down'); log.push(`brought down: ${await row()} | ${await line()}`);
  // combine 5 and −4
  await drag(await c('.lx-live [data-side="left"] [data-tok]', 2), await c('.lx-live [data-side="left"] [data-tok]', 0));
  await p.keyboard.type('1'); await p.keyboard.press('Enter'); log.push(`combined: ${await row()}`);
  // the 1 across the line
  const [bx, by] = await c('.lx-live .lb-border');
  await drag(await c('.lx-live [data-side="left"] [data-tok]', 0), [bx + 80, by]); log.push(`crossed: ${await row()}`);
  await drag(await c('.lx-live [data-side="right"] [data-tok]', 1), await c('.lx-live [data-side="right"] [data-tok]', 0));
  await p.keyboard.type('2'); await p.keyboard.press('Enter'); log.push(`combined: ${await row()}`);
  await p.click('[data-fk="answer"]'); await p.keyboard.type('-1'); await p.keyboard.press('Enter'); await shot('h-solved'); log.push(`fit: ${await p.evaluate(() => document.documentElement.scrollHeight)}`); log.push(`answer: ${await line()}`);
  await p.click('[data-action="next"]'); await p.waitForTimeout(500); log.push(`problem 2: ${await row()} | ${await line()}`); await shot('j-problem2');
  console.log(log.join('\n'), errs);
  await b.close();
})();
