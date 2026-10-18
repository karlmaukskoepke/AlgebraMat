// Build A acceptance screenshots (docs/build-a/ba-NN-*.png), driven through the real app like the parity screens.
// Run: node docs/build-a/take-shots.mjs (needs Playwright; the path below is the cloud sessions' copy).
import { createServer } from 'vite';
import { createRequire } from 'node:module';
const pw = createRequire(import.meta.url)('/opt/node-tools/node_modules/playwright');
const OUT = '/home/user/AlgebraMat/docs/build-a/';
const server = await createServer({ root: '/home/user/AlgebraMat', logLevel: 'silent', server: { port: 0 } });
await server.listen();
const base = server.resolvedUrls.local[0];
const browser = await pw.chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
const log = [];
const click = async (sel) => { const ok = await page.evaluate((s) => { const b = [...document.querySelectorAll(s)].find((n) => !n.disabled && n.getClientRects().length) ?? document.querySelector(s); if (!b) return false; b.dispatchEvent(new MouseEvent('click', { bubbles: true })); return true; }, sel); if (!ok) log.push('MISSING ' + sel); await page.waitForTimeout(150); };
const type = async (n) => { for (const d of String(Math.abs(n))) await click(`[data-action="digit"][data-digit="${d}"]`); if (n < 0) await click('[data-action="toggleSign"]'); };
const go = async (q) => { await page.goto(`${base}?nosignin=1&seed=7&${q}`); await page.evaluate(() => { try { localStorage.clear(); } catch {} }); await page.goto(`${base}?nosignin=1&seed=7&${q}`); await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' }); await page.evaluate(() => document.fonts.ready); };
const shot = async (name) => { await page.waitForTimeout(500); const line = await page.evaluate(() => document.querySelector('.lb-text')?.textContent ?? ''); await page.screenshot({ path: `${OUT}${name}.png` }); log.push(`${name}\t${line}`); };
const move = () => click('[data-action="path"][data-value="move"]');
const add = async (k) => { await click('[data-action="choose"][data-move="add"]'); await type(k); await click('[data-action="go"]'); };
const stuck = () => click('[data-action="stuck"]');
const L4 = 'pack=add-both&level=4';    // x + 8 = −4
const L2 = 'pack=add-both&level=2';    // x + 8 = 11
const seesawPartial = async () => { await go(L4); await stuck(); await stuck(); await click('[data-action="choose"][data-move="add"]'); await type(-5); await click('[data-action="addTo"][data-side="left"]'); await click('[data-action="addTo"][data-side="right"]'); await click('[data-action="go"]'); await click('[data-action="kind"][data-value="battle"]'); await click('[data-action="kind"][data-value="party"]'); };

// 1. a partial move, then I'm stuck x4: on the bare screen it says Undo first; in the seesaw the guided rung offers the current number
await go(L4); await move(); await add(-5); for (let i = 0; i < 4; i++) await stuck(); await shot('ba-01a-L4-bare-partial-stuck4-undo-first');
await seesawPartial(); await shot('ba-01b-L4-seesaw-partial-move'); await stuck(); await stuck(); await shot('ba-01c-L4-seesaw-partial-guided-current-number');
// 2. the same seesaw state, Teach me: the amount that works
await seesawPartial(); await click('[data-action="teach"]'); await shot('ba-02a-L4-seesaw-partial-teach');
await click('[data-action="addTo"][data-side="left"]'); await click('[data-action="addTo"][data-side="right"]'); await shot('ba-02b-L4-seesaw-partial-teach-accepted');
// 3. x = b + k, then I'm stuck x3 and Teach me (L2: x + 8 = 11, a battle)
await go(L2); await move(); await add(-8); await stuck(); await shot('ba-03a-L2-alone-stuck1'); await stuck(); await shot('ba-03b-L2-alone-stuck2'); await stuck(); await shot('ba-03c-L2-alone-stuck3');
await go(L2); await move(); await add(-8); await click('[data-action="teach"]'); await shot('ba-03d-L2-alone-teach');
// 4. Party/Battle in the seesaw: wrong, then right (confirms, does not combine)
await go(L4); await stuck(); await stuck(); await click('[data-action="choose"][data-move="add"]'); await type(-8); await click('[data-action="addTo"][data-side="left"]'); await click('[data-action="addTo"][data-side="right"]'); await click('[data-action="go"]'); await click('[data-action="kind"][data-value="battle"]');
await click('[data-action="kind"][data-value="battle"]'); await shot('ba-04a-L4-other-side-wrong-pick');
await click('[data-action="kind"][data-value="party"]'); await shot('ba-04b-L4-other-side-right-pick-not-combined');
// 5. the grey line after a partial move names the number left
await go(L4); await move(); await add(-5); await shot('ba-05-L4-partial-names-plus-3');
// 6. red move, I'm stuck (Undo first), Undo, I'm stuck again; the same on Divide
await go(L4); await move(); await add(8); await stuck(); await shot('ba-06a-L4-red-stuck-undo-first'); await click('[data-action="undo"]'); await shot('ba-06b-L4-after-undo'); await stuck(); await shot('ba-06c-L4-stuck-again-rung0');
await go('pack=divide-it&level=3'); await move(); await click('[data-action="choose"][data-move="fraction"]'); await click('[data-action="take"][data-n="2"]'); await stuck(); await shot('ba-06d-div-failed-stuck-undo-first');
await click('[data-action="undo"]'); await shot('ba-06e-div-after-undo'); await stuck(); await shot('ba-06f-div-stuck-again');
// 7. the panel: only Fewer terms and Solved for x
await go(L4); await move(); await add(-8); await shot('ba-07-L4-panel-two-lights');
console.log(log.join('\n'));
await browser.close(); await server.close();
