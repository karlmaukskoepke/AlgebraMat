// Build M's pictures that no Features to check item ends on (the items' own end states are saved by tests/features/walk.mjs):
// the brought-down row, I'm stuck (reminder only), the forced-move ring on the factor, and the tallest case at 1366×650.
//   node docs/build-m/take-shots.mjs [address]
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const pw = require(process.env.PLAYWRIGHT_PATH ?? '/opt/node-tools/node_modules/playwright');
const OUT = path.dirname(fileURLToPath(import.meta.url));
const BASE = (process.argv[2] || 'https://karlmaukskoepke.github.io/AlgebraMat/').replace(/\/?$/, '/');
const browser = await pw.chromium.launch();

async function open(q) {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const url = new URL(`${q}&nosignin=1`, BASE).href;
  await page.goto(url); await page.evaluate(() => localStorage.clear()); await page.goto(url); await page.waitForTimeout(800);
  const w = (ms = 350) => page.waitForTimeout(ms);
  const drag = async (a, b) => {
    const f = await page.locator(a).first().boundingBox(); const t = await page.locator(b).first().boundingBox(); const m = page.mouse;
    await m.move(f.x + f.width / 2, f.y + f.height / 2); await m.down(); await m.move(f.x + f.width / 2 + 10, f.y + f.height / 2, { steps: 3 });
    await m.move(t.x + t.width / 2, t.y + t.height / 2, { steps: 12 }); await w(150); await m.up(); await w();
  };
  const both = async (name) => {
    for (const h of [768, 650]) { await page.setViewportSize({ width: 1366, height: h }); await w(700); await page.screenshot({ path: path.join(OUT, `${name}-${h}.png`) }); }
    await page.setViewportSize({ width: 1366, height: 768 }); await w(300);
  };
  const key = async (t) => { await page.keyboard.type(String(t)); await page.keyboard.press('Enter'); await w(300); };
  return {
    page, w, drag, both, key,
    dist: async (...ps) => { await drag('.lx-live .lx-factor', '.lx-live .lx-paren'); for (const p of ps) await key(p); await w(400); },
    add: async (n) => { await page.click('[data-move="add"]'); await w(); await key(n); await w(300); },
    combine: async (side, sum) => { const s = `.lx-live .lb-side[data-side="${side}"] .lx-tok`; await drag(`${s} >> nth=0`, `${s} >> nth=1`); await key(sum); await w(300); },
    div: async (n) => { await page.click('[data-action="multOpen"]'); await w(); await page.click('[data-action="multPick"][data-kind="div"]'); await w(); await key(n); await w(300); },
  };
}

// the brought-down row: 5 + 2(x + 3) = 17 distributed, the 5 brought down
let t = await open('?pack=distribute-solve&level=3&seed=35');
await t.dist(2, 6);
await t.both('m-brought-down');
await t.page.close();

// I'm stuck, reminder only (the factor and the parenthesis outlined, the ghost hand)
t = await open('?pack=distribute-solve&level=4&seed=126');
await t.page.click('[data-action="stuck"]'); await t.w(900);
await t.both('m-stuck');
await t.page.close();

// the forced-move ring: a right guess with no move, then the next problem
t = await open('?pack=distribute-solve&level=1&seed=37');
await t.page.click('[data-action="focus"][data-target="answer"]'); await t.key(3);
if (await t.page.locator('[data-chip]').count()) await t.drag('[data-chip]', '[data-x][data-action="placeValue"]');
for (let i = 0; i < 3; i++) { await t.page.keyboard.press('Enter'); await t.w(300); }
await t.page.click('[data-action="next"]'); await t.w(900);
await t.both('m-forced');
await t.page.click('[data-action="introNext"]'); await t.w(600);
await t.both('m-forced-ring');
await t.page.close();

// the tallest case: Level 4, every move made with its rows unfolded where the screen keeps them, then a wrong value with the full check
t = await open('?pack=distribute-solve&level=4&seed=126');
await t.page.click('.lx-live [data-minus]'); await t.w();
await t.dist(-2, -4);
await t.drag('.lx-live .lb-side[data-side="left"] .lx-tok >> nth=0', '.lx-live .lb-side[data-side="left"] .lx-tok >> nth=2'); await t.key(1);
await t.add(-1);
await t.combine('right', -8);
await t.div(-2);
await t.page.click('[data-action="focus"][data-target="answer"]'); await t.key(5);
if (await t.page.locator('[data-chip]').count()) await t.drag('[data-chip]', '[data-x][data-action="placeValue"]');
for (let i = 0; i < 4; i++) { await t.page.keyboard.press('Enter'); await t.w(300); }   // (the check of 5 − 2(5 + 2) = −7: four lines, then the mark)
await t.w(2300);
await t.page.setViewportSize({ width: 1366, height: 650 }); await t.w(700);
await t.page.screenshot({ path: path.join(OUT, 'm-worst-650.png') });
const fits = await t.page.evaluate(() => [...document.querySelectorAll('.lb-stack .lb-rowwrap, .sv-checkrow, .lb-answerrow')].every((e) => e.getBoundingClientRect().bottom <= innerHeight));
console.log(`tallest case at 1366×650: ${fits ? 'every row on screen' : 'a row is cut off'}`);
await t.page.close();
await browser.close();
