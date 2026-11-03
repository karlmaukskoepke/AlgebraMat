// Build Z: test out of a locked level, in a real browser (Chromium on Vite's dev server, 1366×768). For every Solve it and Solve it Plus
// card: a locked level tapped opens the panel, Try it starts "Problem 1 of 2", and in the attempt NO help of any kind ever appears: a move
// that makes things worse (one that opens the error pop-up on the card as students play it), help asked for anyway, Undo, and 5 seconds of
// nothing (a nudge would glow at 2.5 s) leave no pop-up, no hint, no nudge, no outlined move and no help button on screen. Then both problems
// are solved: the card opens with the warm message and the levels in silver. Also a fail, Give up and Try again. Playwright is not a
// dependency of the app: without it this file is skipped and says so.

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
if (!pw) console.warn('testOutSweep: SKIP (Playwright is not installed here; set PLAYWRIGHT_PATH)');

const SEED = 7;
// [card, the saved level tried]
const CARDS = [
  ['add-both', 4], ['divide-it', 4], ['flip-everything', 4], ['fractions-of-x', 4], ['two-step-equations', 3], ['distribute-solve', 3],
  ['variables-both-sides', 3], ['distribute-more', 3], ['strange-solutions', 3],
];
const keys = (n) => [...String(Math.abs(n))].map((d) => ({ type: 'digit', digit: Number(d) })).concat(n < 0 ? [{ type: 'toggleSign' }] : []);
// moves a student might make that make things worse (each card answers one of them with its error pop-up)
const BAD = (n, a) => [
  [{ type: 'choose', move: 'add' }, ...keys(n), { type: 'go' }],
  ...[Math.abs(a) + 1, 4, 5].filter((d) => Math.abs(a) % d !== 0).map((d) => [{ type: 'divPick' }, ...keys(d), { type: 'go' }]),
  [{ type: 'flipPick' }, { type: 'go' }, { type: 'flipPick' }, { type: 'go' }],
  [{ type: 'multOpen' }, { type: 'multPick', kind: 'whole' }, { type: 'digit', digit: 2 }, { type: 'go' }],
  [{ type: 'flipPick' }, { type: 'go' }],
];

// What would be help, on screen now: any spotlight layer but the check's own, a help button, a nudge, an idle flash, an outlined move
function helpOnScreen() {
  const out = [];
  for (const l of document.querySelectorAll('.spot-layer')) if (!l.classList.contains('is-intro')) out.push(`a pop-up (${l.className}): "${l.innerText.slice(0, 80)}"`);
  for (const e of document.querySelectorAll('[data-action="stuck"], [data-action="teach"]')) if (e.offsetParent) out.push(`the ${e.dataset.action} button`);
  if (document.querySelector('.nudge-glow, .nudge-still, .nudge-ghost, .is-nudgelayer')) out.push('a nudge');
  if (document.querySelector('.is-idle')) out.push('I’m stuck flashing');
  if (document.querySelector('.fm-model')) out.push('the model picture');
  const s = window.__mat.session();
  if (s?.hint) out.push(`an outlined move (${JSON.stringify(s.hint).slice(0, 60)})`);
  if (s?.spot) out.push('a hint spot');
  const words = document.querySelector('#mat .lb-line')?.innerText ?? '';
  if (words && !/^(Find x\.|Find the value of x\.)?$/.test(words.trim()) && !s?.sub) out.push(`the line says "${words}"`);
  return out;
}

async function dispatch(page, actions) { await page.evaluate((as) => { for (const a of as) window.__mat.dispatch(a); }, actions); }
async function solve(page, value = null) {
  for (let i = 0; i < 20; i++) {
    const m = await page.evaluate(() => window.__mat.nextMove());
    if (!m) break;
    await dispatch(page, [...m, { type: 'foldNext' }]);
  }
  const p = await page.evaluate(() => window.__mat.session().problem);
  const f = value === null ? p.ans ?? null : null;
  const v = value ?? p.x;
  const digits = f ? [...keys(f.n), ...(f.d > 1 ? [{ type: 'typeChar', ch: '/' }, ...keys(f.d)] : [])] : keys(v);
  await dispatch(page, [{ type: 'focus', target: 'answer' }, ...digits, { type: 'check' }]);
  for (let k = 0; k < 14; k++) {
    const s = await page.evaluate(() => { const x = window.__mat.session(); return x && { sub: Boolean(x.sub), done: x.stage === 'done' }; });
    if (!s?.sub || s.done) break;
    await dispatch(page, [{ type: 'placeValue', index: k }, { type: 'nextLine' }]);
  }
}
async function freshMenu(page, base) {
  const url = new URL(`?menu=1&seed=${SEED}&nosignin=1`, base).href;
  await page.goto(url);
  await page.evaluate(() => localStorage.clear());
  await page.goto(url);
}
async function tryLevel(page, pack, level) {
  await page.click(`.card-name[data-card="${pack}"]`);
  await page.click(`.level-btn[data-try-level="${level}"]`);
  await page.click('#dialog [data-try]');
  await page.waitForFunction(() => window.__mat?.session()?.board);
}

describe.skipIf(!pw)('Build Z: test out, in a real browser', () => {
  let server; let browser; let base;
  beforeAll(async () => {
    const { createServer } = await import('vite');
    server = await createServer({ root: ROOT, configFile: path.join(ROOT, 'vite.config.js'), logLevel: 'silent', server: { port: 0, hmr: false } });
    await server.listen();
    base = server.resolvedUrls.local[0];
    browser = await pw.chromium.launch();
  }, 60000);
  afterAll(async () => { await browser?.close(); await server?.close(); });

  it('a locked level, tapped in the card or in its popup, opens the panel; Not now closes it; Count it and Build it keep their note', async () => {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await freshMenu(page, base);
    await page.click('.card-name[data-card="two-step-equations"]');
    expect(await page.locator('.level-btn[data-try-level="3"]').innerText()).toContain('Tap to skip ahead');
    await page.click('.level-btn[data-try-level="3"]');
    expect(await page.locator('#dialog[open]').innerText()).toContain('Want to try it? Solve 2 problems here to skip ahead.');
    expect(await page.locator('#dialog[open] button').allInnerTexts()).toEqual(['Not now', 'Try it']);
    await page.click('#dialog [data-close]');
    expect(await page.locator('#dialog[open]').count()).toBe(0);
    await page.click('[data-back]');
    await page.click('[data-chev="divide-it"]');
    await page.click('.lv-pop:not([hidden]) .pop-level[data-try-level="4"]');
    expect(await page.locator('#dialog[open]').innerText()).toContain('Divide it · Level 3');
    await page.click('#dialog [data-close]');
    await page.click('[data-chev="combineit"]');
    expect(await page.locator('.lv-pop:not([hidden]) [data-try-pack]').count()).toBe(0);
    await page.close();
  }, 60000);

  it.concurrent.each(CARDS)('%s: no help of any kind in a test-out, then a pass places the levels', async (pack, level) => {
    const report = [];
    const errors = [];
    // the same problem as students play it: which bad move opens its error pop-up
    const normal = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await normal.goto(new URL(`?pack=${pack}&level=${level}&seed=${SEED}&nosignin=1`, base).href);
    await normal.waitForFunction(() => window.__mat?.session()?.board);
    // (the number beside x, added again: twice as far from x alone)
    const nums = await normal.evaluate(() => {
      const s = window.__mat.session();
      const side = s.board.left.some((t) => t.kind === 'x' || t.kind === 'group') ? s.board.left : s.board.right;
      const all = [...s.board.left, ...s.board.right];
      return { n: (side.find((t) => t.kind === 'num') ?? all.find((t) => t.kind === 'num'))?.v ?? 3, a: all.find((t) => t.kind === 'x')?.coef ?? 1 };
    });
    let bad = null;
    for (const seq of BAD(nums.n, nums.a)) {
      await dispatch(normal, seq);
      await normal.waitForTimeout(200);
      if (await normal.locator('.spot-layer.is-error').count()) { bad = seq; break; }
      await dispatch(normal, [{ type: 'undo' }, { type: 'startOver' }, { type: 'spotDismiss' }]);
    }
    await normal.close();
    if (!bad) report.push('no bad move found that opens the error pop-up on the card');

    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    page.on('pageerror', (e) => errors.push(String(e)));
    await freshMenu(page, base);
    await tryLevel(page, pack, level);
    const look = async (when) => { for (const h of await page.evaluate(helpOnScreen)) report.push(`${when}: ${h}`); };
    if (!(await page.locator('#testout-bar').innerText()).includes('Problem 1 of 2')) report.push('the bar should say Problem 1 of 2');
    await look('at the start');
    if (bad) {
      await dispatch(page, bad);
      await page.waitForTimeout(300);
      await look('after a move that makes it worse');
      const before = await page.evaluate(() => JSON.stringify(window.__mat.session().rows.length));
      await dispatch(page, [{ type: 'stuck' }, { type: 'teach' }]);
      await page.keyboard.press('s');
      await page.waitForTimeout(200);
      await look('after asking for help anyway');
      const st = await page.evaluate(() => { const s = window.__mat.session(); return { stuck: s.stuck, taught: s.taught, rows: s.rows.length }; });
      if (st.stuck || st.taught) report.push(`help was taken: ${JSON.stringify(st)}`);
      if (String(st.rows) !== before) report.push('asking for help changed the work');
      await dispatch(page, [{ type: 'undo' }]);
      await page.waitForTimeout(300);
      await look('after Undo');
    }
    await page.mouse.move(700, 300);
    await page.waitForTimeout(5000);
    await look('after 5 seconds of nothing');
    await solve(page);
    await page.waitForTimeout(200);
    await look('problem 1 solved');
    await page.click('[data-action="next"]');
    await page.waitForTimeout(300);
    if (!(await page.locator('#testout-bar').innerText()).includes('Problem 2 of 2')) report.push('the bar should say Problem 2 of 2');
    await solve(page);
    await page.waitForSelector('.home-note.is-warm', { timeout: 5000 }).catch(() => report.push('no warm message after the pass'));
    const note = await page.locator('.home-note').innerText().catch(() => '');
    if (!/^You skipped ahead! Do one more problem on Level \d to make it gold\.$/.test(note)) report.push(`the message: "${note}"`);
    const placed = await page.locator('.card-view .level-btn.is-placed').count();
    const first = pack === 'add-both' || pack === 'divide-it' || pack === 'flip-everything' ? 2 : 1;
    if (placed !== level - first + 1) report.push(`${placed} levels placed, expected ${level - first + 1}`);
    const last = pack === 'strange-solutions' ? 3 : null;
    if (level !== last && await page.locator(`.card-view .level-btn[data-level="${level + 1}"]:not([disabled])`).count() !== 1) report.push('the next level should be open');
    const log = await page.evaluate(() => JSON.parse(localStorage.getItem('mat.events.v1')));
    if (log.length !== 2 || !log.every((r) => r.supports.includes('test-out-pass') && r.level === level && r.pack === pack)) report.push(`the class-sheet rows: ${JSON.stringify(log)}`);
    for (const e of errors) report.push(`page error ${e}`);
    await page.close();
    expect(report).toEqual([]);
  }, 120000);

  it('a fail ends the attempt ("Not yet. Try Level 1 first."); Try again starts at once with new problems; Give up; nothing is lowered', async () => {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await freshMenu(page, base);
    await tryLevel(page, 'two-step-equations', 5);
    const first = await page.evaluate(() => window.__mat.session().problem);
    await solve(page, first.x + 1);
    await page.waitForSelector('.testout-done', { timeout: 5000 });
    const text = await page.locator('.testout-done').innerText();
    expect(text).toContain('Not yet.');
    expect(text).toContain('Try Level 1 first.');
    expect(text).toContain(`x = ${String(first.x + 1).replace('-', '−')} did not balance.`);
    let log = await page.evaluate(() => JSON.parse(localStorage.getItem('mat.events.v1')));
    expect(log.map((r) => r.supports)).toEqual([['test-out-fail']]);
    expect(log[0].answers[0].typed).toBe(String(first.x + 1));
    await page.click('[data-go="retry"]');
    await page.waitForFunction(() => window.__mat?.session()?.board);
    const again = await page.evaluate(() => window.__mat.session().problem);
    expect(JSON.stringify(again)).not.toBe(JSON.stringify(first));
    expect(await page.locator('#testout-bar').innerText()).toContain('Problem 1 of 2');
    await page.click('[data-giveup]');
    await page.waitForSelector('.testout-done');
    log = await page.evaluate(() => JSON.parse(localStorage.getItem('mat.events.v1')));
    expect(log.map((r) => r.supports)).toEqual([['test-out-fail'], ['test-out-fail']]);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mat.v1')).packs['two-step-equations']);
    expect(saved.placed).toBeUndefined();
    expect(saved.levels.every((x) => x === false)).toBe(true);
    await page.click('[data-go="suggested"]');
    expect(await page.locator('#title').innerText()).toContain('Level 1');
    expect(await page.locator('#testout-bar').isHidden()).toBe(true);
    expect(await page.locator('[data-action="stuck"]').first().isVisible()).toBe(true);    // help is back on the level itself
    await page.close();
  }, 60000);
});
