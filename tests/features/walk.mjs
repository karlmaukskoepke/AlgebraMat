// Walks every "Features to check" item the way Karl would (public/test-links.json, "checks"): opens the item's link, does the steps
// one by one in a real browser, and checks the words on screen against "what you should see". It also saves a screenshot of each
// item's end state. A build is not finished until every item it added passes here (CLAUDE.md, Working with Karl).
//
//   node tests/features/walk.mjs [address] [screenshot folder] [item id ...]
//
// The address is the app's front door (default: Vite's dev server on port 5173; for the live site use
// https://karlmaukskoepke.github.io/AlgebraMat/). Playwright is found as in tests/parity/screens.mjs. Each item has one function
// below with the same id as in the data file: when you add an item, add its walk here, doing exactly what its steps say.

import { createRequire } from 'node:module';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const [, , addressArg, outArg, ...only] = process.argv;
const BASE = (addressArg || 'http://localhost:5173/').replace(/\/?$/, '/');
const OUT = outArg || path.join(ROOT, 'docs/build-j');
mkdirSync(OUT, { recursive: true });

function loadPlaywright() {
  const require = createRequire(import.meta.url);
  for (const p of ['playwright', process.env.PLAYWRIGHT_PATH, '/opt/node-tools/node_modules/playwright'].filter(Boolean)) {
    try { return require(p); } catch { /* try the next */ }
  }
  throw new Error('Playwright is not installed here (set PLAYWRIGHT_PATH).');
}

const data = JSON.parse(readFileSync(path.join(ROOT, 'public/test-links.json'), 'utf8'));
const checks = data.checks ?? [];

// ---- what a person does ----------------------------------------------------------------------------------------------------------
const act = (a) => `[data-action="${a}"]`;
const wait = (page, ms) => page.waitForTimeout(ms);
const DIV_BOX = '.mo-divpart:not(.is-mirror)';                  // the Divide blank's box, under the bar (Build O)
const DIV = '.lx-move[data-action="divPick"]';                   // the Divide button (Build O; its shown blank picks it too)

class Walk {
  constructor(page, item) { this.page = page; this.item = item; this.errors = []; page.on('pageerror', (e) => this.errors.push(String(e))); }
  async start(height = 768) {
    await this.page.setViewportSize({ width: 1366, height });
    // the button on the page: a fresh student, then the address the button opens
    const href = new URL(this.item.link.query, BASE).href;
    await this.page.goto(href);
    await this.page.evaluate(() => { try { localStorage.clear(); } catch { /* blocked */ } });
    await this.page.goto(href);
    await wait(this.page, 600);
  }
  // click the first visible match; a pop-up layer that sits on top of a button (Undo) is clicked at its place, as a finger would
  async click(sel, nth = 0) {
    const els = this.page.locator(sel);
    let seen = 0;
    for (let i = 0, n = await els.count(); i < n; i++) {
      const e = els.nth(i);
      if (!(await e.isVisible())) continue;
      if (seen++ < nth) continue;
      // (the pointer arrives first, as a hand's does: a click that lands the instant the pointer arrives can be lost while the panel redraws
      // for the hover, Build O)
      try { await e.hover({ timeout: 1500, force: true }); await wait(this.page, 120); } catch { /* covered: clicked at its place below */ }
      try { await e.click({ timeout: 2500 }); } catch { const b = await e.boundingBox(); await this.page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); }
      await wait(this.page, 250);
      return;
    }
    throw new Error(`nothing to click for ${sel} after step "${this.step}"`);
  }
  // the typed value picked up and carried toward x, not let go (Build I); then let go at a place on the page
  async hold() {
    const from = await this.page.locator('[data-chip]').first().boundingBox();
    const to = await this.page.locator('[data-x][data-action="placeValue"]').first().boundingBox();
    const m = this.page.mouse;
    await m.move(from.x + from.width / 2, from.y + from.height / 2);
    await m.down();
    await m.move(from.x + from.width / 2 + 10, from.y + from.height / 2 - 10, { steps: 3 });
    await m.move((from.x + to.x) / 2, (from.y + to.y) / 2 + 60, { steps: 10 });
    await wait(this.page, 700);
  }
  async letGo(x, y) { const m = this.page.mouse; await m.move(x, y, { steps: 6 }); await m.up(); await wait(this.page, 200); }
  // the check's first two lines read as given, and each blue value sits right under its blue x (centres within 3 px)
  async pairs(line1, line2) {
    const got = await this.page.evaluate(() => {
      const mid = (e) => { const r = e.getBoundingClientRect(); return (r.left + r.right) / 2; };
      const rows = [...document.querySelectorAll('.sv-checklist .sv-checkrow')];
      const xs = [...(rows[0]?.querySelectorAll('[data-pair]') ?? [])];
      const vs = [...(rows[1]?.querySelectorAll('[data-pair]') ?? [])];
      const blue = [...xs, ...vs].map((e) => getComputedStyle(e).color);
      return { l1: rows[0]?.innerText.replace(/\s+/g, ''), l2: rows[1]?.innerText.replace(/\s+/g, ''), off: xs.map((x, i) => Math.abs(mid(x) - mid(vs[i]))), blue, under: rows[1]?.getBoundingClientRect().top > rows[0]?.getBoundingClientRect().top };
    });
    if (got.l1 !== line1 || got.l2 !== line2) throw new Error(`the check should start ${line1}, then ${line2}: ${got.l1} / ${got.l2} after step "${this.step}"`);
    if (!got.off.length || got.off.some((d) => d > 3) || !got.under) throw new Error(`each value should sit right under its x: off by ${got.off} px after step "${this.step}"`);
    if (new Set(got.blue).size !== 1) throw new Error(`every x and its value should be the same blue: ${got.blue}`);
  }
  // the small questions at big numbers sit just under the two numbers (not over the work above them)
  async belowNumbers() {
    const nums = await this.box('.lx-live .lx-tok.is-hint');
    const b = await this.box('.spot-box.is-bubble');
    if (!nums || !b || b[1] < nums[3]) throw new Error(`the box should sit under the numbers: numbers ${nums}, box ${b}`);
  }
  // Flip everything's moves, as a person does them (Build J)
  async flip() { await this.click(act('flipPick')); await this.click(act('go')); await wait(this.page, 300); }
  // Multiply's Divide option (Build L): the number to divide by, one digit, a minus allowed (−3 is multiplying by −⅓)
  async divide(n) { await this.click(DIV); await this.type(n); await this.click(act('go')); await wait(this.page, 300); }
  async solve(v) { await this.click(act('focus')); await this.type(v); await this.enter(); await this.drag(); await this.click(act('nextLine')); await this.click(act('nextLine')); }
  async type(text) { await this.page.keyboard.type(String(text)); await wait(this.page, 200); }
  // what was typed shows in the field (Build N: and the field has the focus)
  async typedIn(selector, text) {
    const got = await this.page.evaluate((sel) => { const e = [...document.querySelectorAll(sel)].find((x) => x.offsetParent); return e ? { text: e.textContent.trim(), focused: document.activeElement === e } : null; }, selector);
    if (!got) throw new Error(`no field ${selector} on screen after step "${this.step}"`);
    if (got.text !== text) throw new Error(`the field should show ${text} but shows “${got.text}” after step "${this.step}"`);
    if (!got.focused) throw new Error(`the field showing ${text} should have the focus after step "${this.step}"`);
  }
  async enter(times = 1) { for (let i = 0; i < times; i++) { await this.page.keyboard.press('Enter'); await wait(this.page, 250); } }
  async drag() {                                    // the typed value, dragged from the x = box onto the x
    const from = await this.page.locator('[data-chip]').first().boundingBox();
    const to = await this.page.locator('[data-x][data-action="placeValue"]').first().boundingBox();
    const m = this.page.mouse;
    await m.move(from.x + from.width / 2, from.y + from.height / 2);
    await m.down();
    await m.move(from.x + from.width / 2 + 10, from.y + from.height / 2 - 10, { steps: 3 });
    await m.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
    await m.up();
    await wait(this.page, 400);
  }
  // the typed value dragged onto the x that matches `selector` (default: the first x that takes it)
  async dragTo(selector) {
    const from = await this.page.locator('[data-chip]').first().boundingBox();
    const to = await this.page.locator(selector).first().boundingBox();
    const m = this.page.mouse;
    await m.move(from.x + from.width / 2, from.y + from.height / 2);
    await m.down();
    await m.move(from.x + from.width / 2 + 10, from.y + from.height / 2 - 10, { steps: 3 });
    await m.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
    await m.up();
    await wait(this.page, 400);
  }
  // how bright (0-255) the middle of an element is on the screen as drawn: lit things are near 250, things greyed out by a pop-up near 120
  async brightness(selector, nth = 0) {
    const box = await this.page.locator(selector).nth(nth).boundingBox();
    if (!box) throw new Error(`nothing on the screen for ${selector}`);
    const png = await this.page.screenshot({ clip: { x: box.x, y: box.y, width: Math.max(2, box.width), height: Math.max(2, box.height) } });
    return this.page.evaluate(async (b64) => {
      const img = await new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = `data:image/png;base64,${b64}`; });
      const c = new OffscreenCanvas(img.width, img.height); const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, img.width, img.height).data; let sum = 0;
      for (let i = 0; i < d.length; i += 4) sum += (d[i] + d[i + 1] + d[i + 2]) / 3;
      return sum / (d.length / 4);
    }, png.toString('base64'));
  }
  async lit(selector, nth = 0) { const b = await this.brightness(selector, nth); if (b < 170) throw new Error(`${selector} should be lit but is greyed out (brightness ${Math.round(b)}) after step "${this.step}"`); }
  // one screenshot at each size Karl's laptops come in (the page redraws itself when the window changes)
  async both(name) {
    await this.page.setViewportSize({ width: 1366, height: 768 }); await wait(this.page, 700); await this.shot(`${name}-768`);
    await this.page.setViewportSize({ width: 1366, height: 650 }); await wait(this.page, 700); await this.shot(`${name}-650`);
    await this.page.setViewportSize({ width: 1366, height: 768 }); await wait(this.page, 300);
  }
  async text() { return (await this.page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' '); }
  async see(...words) {                             // every piece of text must be on the screen
    const t = await this.text();
    // (pieces of an equation drawn side by side can read as "−3 x" for "−3x": spaces are ignored when the plain match fails)
    const tight = t.replace(/\s+/g, '');
    for (const w of words) if (!t.includes(w) && !tight.includes(w.replace(/\s+/g, ''))) throw new Error(`expected to see "${w}" after step "${this.step}". On screen: ${t.slice(0, 400)}`);
  }
  async notSee(...words) {
    const t = await this.text();
    for (const w of words) if (t.includes(w)) throw new Error(`did not expect to see "${w}" after step "${this.step}"`);
  }
  async shot(name) { await this.page.screenshot({ path: path.join(OUT, `${name}.png`) }); }
  async lateLayer() { await wait(this.page, 2300); }   // a red picture fades in after about two seconds, on purpose
  at(step) { this.step = step; }
  // hands off (Build P): the pointer goes somewhere quiet, as a hand does, and nothing is touched for `ms`
  async idle(ms) { const m = this.page.mouse; await m.move(700, 300, { steps: 8 }); await m.move(300, 700, { steps: 8 }); await wait(this.page, ms); }
  // the nudge (Build P, Part 1): `n` things glow, and its pop-up says `words`
  async nudged(n, words) {
    const glow = await this.page.locator('.nudge-glow, .nudge-still').count();
    if (glow !== n) throw new Error(`${n} things should glow after waiting, found ${glow} after step "${this.step}"`);
    await this.see(words);
  }
  async noNudge() {
    if (await this.page.locator('.nudge-glow, .nudge-still, .is-nudgelayer').count()) throw new Error(`nothing should be nudged here, after step "${this.step}"`);
  }
  // quick helpers for the steps Karl repeats
  async add(n) { await this.click(`${act('choose')}[data-move="add"]`); await this.type(n); await this.click(act('go')); }
  async stuck(times = 1) { for (let i = 0; i < times; i++) await this.click(act('stuck')); }
  // the Two-step card (Build K): drag the first number on the side without x onto the second, type their sum, Enter
  async combine(sum) {
    const side = await this.page.evaluate(() => {
      const sides = [...document.querySelectorAll('.lx-live .lb-side')];
      return sides.findIndex((s) => !s.querySelector('[data-like="x"]'));
    });
    const toks = this.page.locator('.lx-live .lb-side').nth(side).locator('.lx-tok');
    const f = await toks.nth(0).boundingBox();
    const t = await toks.nth(1).boundingBox();
    const m = this.page.mouse;
    await m.move(f.x + f.width / 2, f.y + f.height / 2); await m.down();
    await m.move(f.x + f.width / 2 + 8, f.y + f.height / 2, { steps: 3 });
    await m.move(t.x + t.width / 2, t.y + t.height / 2, { steps: 12 }); await wait(this.page, 150); await m.up(); await wait(this.page, 400);
    await this.type(sum); await this.enter();
  }
  async addEnter(n) { await this.click(`${act('choose')}[data-move="add"]`); await this.type(n); await this.enter(); await wait(this.page, 300); }
  async divEnter(n) { await this.click(DIV); await this.type(n); await this.enter(); await wait(this.page, 300); }
  // (every check shows every step, Build P: the value is dragged into each x, one drop each, then Enter a line at a time)
  async answer(v, nexts) {
    await this.click(act('focus')); await this.type(v); await this.enter();
    for (let k = 0; k < 4 && await this.page.locator('[data-x][data-action="placeValue"]').count(); k++) await this.drag();
    await this.enter(nexts); await wait(this.page, 300);
  }
  // Distribute, combine, solve (Build M): the factor dragged onto its parenthesis, then each product typed (Enter goes to the next)
  async dragFactor(onParen = true) {
    const f = await this.page.locator('.lx-live .lx-factor').first().boundingBox();
    const p = await this.page.locator('.lx-live .lx-paren').first().boundingBox();
    const to = onParen ? { x: p.x + p.width / 2, y: p.y + p.height / 2 } : { x: f.x + f.width / 2, y: f.y + 200 };
    const m = this.page.mouse;
    await m.move(f.x + f.width / 2, f.y + f.height / 2); await m.down();
    await m.move(f.x + f.width / 2 + 10, f.y + f.height / 2, { steps: 3 });
    await m.move(to.x, to.y, { steps: 12 }); await wait(this.page, 150); await m.up(); await wait(this.page, 400);
  }
  async distribute(...products) { await this.dragFactor(); for (const v of products) { await this.type(v); await this.enter(); } await wait(this.page, 300); }
  // drag one term of the row onto another (by their text as written), type what they make, Enter
  async combineTerms(from, onto, typed) {
    const tok = (t) => this.page.locator('.lx-live .lx-tok').filter({ hasText: new RegExp(`^\\s*[+−]?\\s*${t.replace(/[−-]/g, '[−-]?')}\\s*$`) });
    const f = await tok(from).nth(from === onto ? 1 : 0).boundingBox();   // two alike: the second one onto the first
    const t = await tok(onto).first().boundingBox();
    const m = this.page.mouse;
    await m.move(f.x + f.width / 2, f.y + f.height / 2); await m.down();
    await m.move(f.x + f.width / 2 + 8, f.y + f.height / 2, { steps: 3 });
    await m.move(t.x + t.width / 2, t.y + t.height / 2, { steps: 12 }); await wait(this.page, 150); await m.up(); await wait(this.page, 400);
    if (typed !== undefined) { await this.type(typed); await this.enter(); }
  }
  // Variables on both sides (Build R): an x-term (by its text) dragged across the = and let go at the end of the other side
  async crossTerm(text, toSide) {
    const from = await this.page.locator(`.lx-live .lb-${toSide === 'left' ? 'right' : 'left'} .lx-tok`).filter({ hasText: new RegExp(`^\\s*[+−]?\\s*${text.replace(/[−-]/g, '[−-]?')}\\s*$`) }).first().boundingBox();
    const side = await this.page.locator(`.lx-live .lb-${toSide}`).first().boundingBox();
    const m = this.page.mouse;
    await m.move(from.x + from.width / 2, from.y + from.height / 2); await m.down();
    await m.move(from.x + from.width / 2 + (toSide === 'left' ? -10 : 10), from.y + from.height / 2, { steps: 3 });
    const to = toSide === 'left' ? side.x + side.width - 10 : side.x + side.width + 20;
    await m.move(to, side.y + side.height / 2, { steps: 14 }); await wait(this.page, 200); await m.up(); await wait(this.page, 500);
  }
  // Build S: while `act` runs, no row already on screen is taken off and put back, starts an animation again, or changes its text size
  async steady(act) {
    await this.page.evaluate(() => {
      window.__pre = new Set(document.querySelectorAll('.lb-stack .lb-rowwrap'));
      window.__preAnims = new Set(document.getAnimations());
      window.__preSizes = new Map([...window.__pre].map((r) => [r, getComputedStyle(r.querySelector('.lb-eq') ?? r).fontSize]));
    });
    await act();
    await wait(this.page, 150);
    const problems = await this.page.evaluate(() => {
      const out = [];
      for (const r of window.__pre) {
        const t = r.textContent.replace(/\s+/g, '');
        if (!r.isConnected) { if (r.dataset.rk && document.querySelector(`.lb-stack .lb-rowwrap[data-rk="${r.dataset.rk}"]`)) out.push(`the row ${t} was drawn again`); continue; }
        if (getComputedStyle(r.querySelector('.lb-eq') ?? r).fontSize !== window.__preSizes.get(r)) out.push(`the row ${t} changed size`);
      }
      for (const a of document.getAnimations()) {
        if (window.__preAnims.has(a) || !a.animationName || a.effect?.getComputedTiming?.().iterations === Infinity) continue;
        const row = a.effect?.target?.closest?.('.lb-rowwrap');
        if (row && window.__pre.has(row)) out.push(`the row ${row.textContent.replace(/\s+/g, '')} played ${a.animationName} again`);
      }
      return out;
    });
    if (problems.length) throw new Error(`${problems.join('; ')} after step "${this.step}"`);
  }
  // Build S: press on a term of the newest row (by its text), lift it above the row and hold; `check` runs while it is held; then let go
  // where it was
  async liftBack(text, check = null) {
    const tok = this.page.locator('.lx-live .lx-tok').filter({ hasText: new RegExp(`^\\s*[+−]?\\s*${text.replace(/[−-]/g, '[−-]?')}\\s*$`) }).first();
    const b = await tok.boundingBox();
    const m = this.page.mouse;
    const x = b.x + b.width / 2;
    const y = b.y + b.height / 2;
    await this.steady(async () => {
      await m.move(x, y); await m.down();
      await m.move(x + 8, y - 6, { steps: 3 }); await m.move(x + 10, y - 70, { steps: 6 }); await wait(this.page, 400);
    });
    const held = await this.page.evaluate(() => ({ ghost: document.querySelector('.lx-dragghost')?.textContent ?? null, gap: Boolean(document.querySelector('.lx-live .is-lifted, .lx-live .lx-tok.is-gap')) }));
    if (!held.ghost) throw new Error(`a copy of ${text} should ride above the pointer after step "${this.step}"`);
    if (!held.gap) throw new Error(`a dashed gap should stay where ${text} was after step "${this.step}"`);
    if (check) await check();
    await this.steady(async () => { await m.move(x, y, { steps: 6 }); await m.up(); await wait(this.page, 300); });
  }
  async rows() { return (await this.page.evaluate(() => [...document.querySelectorAll('.lb-stack .lb-rowwrap')].map((r) => r.innerText.replace(/\s+/g, '')))); }
  async row(text) { const rs = await this.rows(); const want = text.replace(/\s+/g, ''); if (!rs.some((r) => r.endsWith(want) || r === want)) throw new Error(`expected a row ${text} after step "${this.step}": ${rs.join(' | ')}`); }
  async box(selector) { return this.page.evaluate((s) => { const r = document.querySelector(s)?.getBoundingClientRect(); return r ? [r.left, r.top, r.right, r.bottom].map(Math.round) : null; }, selector); }
}

// ---- one walk per item (same id as in the data file) ---------------------------------------------------------------------------------
const WALKS = {
  // ---- Build S: redraws keep what is on screen, one text size a problem, drags that work, Flip's cross-off, Add's previews ----
  async 's-pickup'(w) {
    await w.start(); await w.see('7x = 4x + 15');
    w.at('drag the 4x across, wait'); await w.crossTerm('4x', 'left'); await w.row('7x − 4x = 15'); await wait(w.page, 3000);
    w.at('lift the 7x and hold it');
    await w.liftBack('7x', async () => {
      await w.row('7x = 4x + 15'); await w.row('7x − 4x = 4x + 15 − 4x');
      if ((await w.rows()).length !== 3) throw new Error('every row should still be on the screen while the 7x is held');
      await w.both('s-pickup');
    });
    w.at('let go where it was'); await w.row('7x − 4x = 15');
  },
  async 's-type-after-divide'(w) {
    await w.start(); await w.see('7x = 4x + 15');
    w.at('drag across, combine'); await w.crossTerm('4x', 'left'); await w.combineTerms('−4x', '7x', '3x'); await w.row('3x = 15');
    w.at('Divide 3, wait'); await w.divEnter(3); await w.row('x = (15) 3'); await wait(w.page, 3000);
    w.at('click x =, type 5'); await w.steady(async () => { await w.click(act('focus')); await w.type(5); });
    await w.row('x = (15) 3'); await w.both('s-type-after-divide');
  },
  async 's-fraction-bar'(w) {
    await w.start(); await w.see('3(x + 2) = 15');
    w.at('Divide 3, wait'); await w.divEnter(3); await w.row('x + 2 = (15) 3'); await wait(w.page, 3000);
    w.at('click the fraction bar'); await w.steady(async () => { await w.click('[data-action="lxCalc"]'); });
    if (!(await w.page.locator('[data-fk="calc"]').count())) throw new Error('a box for the answer should open');
    await w.row('3(x + 2) = 15'); await w.both('s-fraction-bar');
    w.at('type 5, Enter'); await w.type(5); await w.enter(); await wait(w.page, 300); await w.row('x + 2 = 5');
  },
  async 's-same-size'(w) {
    const sizes = new Set();
    const look = async () => { for (const z of await w.page.evaluate(() => [...document.querySelectorAll('.lb-stack .lb-rowwrap:not(.has-work):not(.is-fold) > .lb-eq')].map((e) => getComputedStyle(e).fontSize))) sizes.add(z); };
    await w.start(); await w.see('5x + 5 = 2x + 14'); await look(); await w.shot('s-same-size-1');
    w.at('drag the 2x across, combine'); await w.crossTerm('2x', 'left'); await look(); await w.combineTerms('−2x', '5x', '3x'); await look(); await w.row('3x + 5 = 14');
    w.at('Undo, combine again'); await w.click(act('undo')); await wait(w.page, 500); await look(); await w.combineTerms('−2x', '5x', '3x'); await look();
    w.at('Add −5, combine'); await w.addEnter(-5); await look(); await w.combine(9); await look(); await w.row('3x = 9'); await wait(w.page, 2500); await w.shot('s-same-size-2');
    w.at('Divide 3, check'); await w.divEnter(3); await look(); await w.answer(3, 5); await look(); await w.see('20 = 20', '✓ Balanced'); await w.shot('s-same-size-3');
    if (sizes.size !== 1) throw new Error(`the equation should keep one size, but it was ${[...sizes].join(', ')}`);
  },
  async 's-drag-right'(w) {
    await w.start(); await w.see('4x + 11 = 8x − 1');
    w.at('drag the 4x across, combine'); await w.crossTerm('4x', 'right'); await w.combineTerms('−4x', '8x', '4x'); await w.row('11 = 4x − 1');
    w.at('drag the −1 across'); await w.crossTerm('1', 'left'); await w.row('11 + 1 = 4x − 1 + 1'); await w.row('11 + 1 = 4x');
    await w.both('s-drag-right');
  },
  async 's-first-drag'(w) {
    await w.start(); await w.see('4(x − 3) = 2x − 6');
    w.at('distribute 4, −12'); await w.distribute(4, -12); await w.row('4x + −12 = 2x − 6');
    w.at('drag the 2x across, first try'); await w.crossTerm('2x', 'left'); await w.row('4x − 12 − 2x = 2x − 6 − 2x'); await w.row('4x + −12 − 2x = −6');
    await w.both('s-first-drag');
  },
  async 's-first-drag-distribute'(w) {
    await w.start(); await w.see('3(x + 2) = 15');
    w.at('distribute 3, 6'); await w.distribute(3, 6); await w.row('3x + 6 = 15');
    w.at('drag the 6 across, first try'); await w.crossTerm('6', 'right'); await w.row('3x + 6 − 6 = 15 − 6'); await w.row('3x = 15 − 6');
    await w.shot('s-first-drag-distribute');
  },
  async 's-flip-crossoff'(w) {
    await w.start(); await w.see('−x = 8');
    w.at('Flip, Go'); await w.flip();
    const t0 = Date.now();
    const frame = async (ms, name) => { await wait(w.page, Math.max(0, ms - (Date.now() - t0))); await w.shot(name); };
    await frame(1100, 's-flip-1');
    const marks = await w.page.locator('.lb-work .xo.is-minus').count();
    if (marks !== 2) throw new Error(`the two minus signs on the x side should be marked, found ${marks}`);
    await frame(2300, 's-flip-2');
    await frame(4300, 's-flip-3');
    await w.row('x = −(8)');
    const strokes = await w.page.evaluate(() => [...document.querySelectorAll('.lb-work .xo.is-minus')].map((e) => { const a = getComputedStyle(e, '::after'); return [a.borderLeftWidth, a.borderTopWidth, a.transform]; }));
    if (strokes.some(([l, t]) => l === '0px' || t !== '0px')) throw new Error(`each minus should get an up-and-down stroke: ${JSON.stringify(strokes)}`);
  },
  async 's-add-options'(w) {
    await w.start(); await w.see('8x − 14 = 5x + 10');
    w.at('Add'); await w.click(`${act('choose')}[data-move="add"]`);
    w.at('point at + ▢x'); await w.page.locator('[data-aopt="x"]').hover(); await wait(w.page, 300);
    if ((await w.page.locator('.lx-ghost.is-optpreview .lx-addx').count()) !== 2) throw new Error('the preview should print an x after each box');
    await w.both('s-add-options-x');
    w.at('point at + ▢'); await w.page.locator('[data-aopt="num"]').hover(); await wait(w.page, 300);
    if (!(await w.page.locator('.lx-ghost.is-optpreview').count()) || (await w.page.locator('.lx-ghost .lx-addx').count())) throw new Error('the preview should show the number form, with no x');
    await w.shot('s-add-options-num');
    await w.row('8x − 14 = 5x + 10');
  },
  // ---- Build R: Variables on both sides ----
  async 'r-level-1'(w) {
    await w.start(); await w.see('VARIABLES ON BOTH SIDES · Level 1', '7x = 4x + 15'); await w.both('r-level-1');
    w.at('drag the 4x across'); await w.crossTerm('4x', 'left'); await w.row('7x − 4x = 15');
    w.at('combine to 3x'); await w.combineTerms('−4x', '7x', '3x'); await w.row('3x = 15');
    w.at('Divide 3'); await w.divEnter(3); await w.row('x = (15) 3');
    w.at('type 5, drop in each x, Enter for each line'); await w.answer(5, 4);
    await w.see('7 × 5 = 4 × 5 + 15', '35 = 4 × 5 + 15', '35 = 20 + 15', '35 = 35', '✓ Balanced');
  },
  async 'r-level-2'(w) {
    await w.start(); await w.see('5x + 5 = 2x + 14'); await w.both('r-level-2');
    w.at('drag the 2x across'); await w.crossTerm('2x', 'left'); await w.row('5x + 5 − 2x = 14');
    w.at('combine to 3x'); await w.combineTerms('−2x', '5x', '3x'); await w.row('3x + 5 = 14');
    w.at('Add −5, combine'); await w.addEnter(-5); await w.row('3x = 14 − 5'); await w.combine(9); await w.row('3x = 9');
    w.at('Divide 3, type 3'); await w.divEnter(3); await w.row('x = (9) 3'); await w.answer(3, 5); await w.see('20 = 20', '✓ Balanced');
  },
  async 'r-level-3'(w) {
    await w.start(); await w.see('4x + 11 = 8x − 1'); await w.both('r-level-3');
    w.at('drag the 4x across'); await w.crossTerm('4x', 'right'); await w.row('11 = 8x − 1 − 4x');
    w.at('combine to 4x'); await w.combineTerms('−4x', '8x', '4x'); await w.row('11 = 4x − 1');
    w.at('Trade places'); await w.click(`${act('choose')}[data-move="trade"]`); await w.row('4x − 1 = 11');
    w.at('Add 1, combine, Divide 4'); await w.addEnter(1); await w.combine(12); await w.row('4x = 12'); await w.divEnter(4); await w.row('x = (12) 4');
  },
  async 'r-level-4'(w) {
    await w.start(); await w.see('2x − 5 = −2x + 11'); await w.both('r-level-4');
    w.at('Add, + ▢x, 2'); await w.click(`${act('choose')}[data-move="add"]`); await w.click(`${act('addPick')}[data-kind="x"]`); await w.type(2); await w.enter(); await wait(w.page, 300);
    await w.row('2x − 5 + 2x = 11');
    w.at('combine to 4x'); await w.combineTerms('2x', '2x', '4x'); await w.row('4x − 5 = 11');
    w.at('Add 5, combine'); await w.addEnter(5); await w.combine(16); await w.row('4x = 16');
    w.at('Divide 4, type 4'); await w.divEnter(4); await w.answer(4, 5); await w.see('2 × 4 − 5 = −2 × 4 + 11', '3 = 3', '✓ Balanced');
  },
  async 'r-level-5'(w) {
    await w.start(); await w.see('4(x − 3) = 2x − 6'); await w.both('r-level-5');
    w.at('distribute: 4, −12'); await w.distribute(4, -12); await w.row('4x + −12 = 2x − 6');
    w.at('Next'); await w.click(act('foldNext')); await wait(w.page, 300);
    w.at('drag the 2x across'); await w.crossTerm('2x', 'left'); await w.row('4x + −12 − 2x = −6');
    w.at('combine to 2x'); await w.combineTerms('−2x', '4x', '2x'); await w.row('2x + −12 = −6');
    w.at('Add 12, combine, Divide 2'); await w.addEnter(12); await w.combine(6); await w.row('2x = 6'); await w.divEnter(2); await w.row('x = (6) 2');
  },
  async 'r-cross-drag'(w) {
    await w.start(); await w.see('8x − 14 = 5x + 10');
    w.at('hold the 5x over the left side');
    const from = await w.page.locator('.lx-live .lb-right .lx-tok').first().boundingBox();
    const side = await w.page.locator('.lx-live .lb-left').first().boundingBox();
    const m = w.page.mouse;
    await m.move(from.x + from.width / 2, from.y + from.height / 2); await m.down();
    await m.move(from.x - 10, from.y + from.height / 2, { steps: 3 }); await m.move(side.x + side.width - 10, side.y + side.height / 2, { steps: 14 }); await wait(w.page, 400);
    await w.see('−5x');
    if (!(await w.page.locator('.lx-tok.is-crossing, .lx-tok.is-fresh, .is-crossing').count())) throw new Error('the term should turn red and read −5x over the left side');
    await w.both('r-cross-drag');
    w.at('let go'); await m.up(); await wait(w.page, 600); await w.row('8x − 14 − 5x = 10');
    if (!(await w.page.locator('[data-light="xone"].is-green').count())) throw new Error('x on one side should be green');
  },
  async 'r-add-xterm'(w) {
    await w.start(); await w.see('8x − 14 = 5x + 10');
    w.at('Add'); await w.click(`${act('choose')}[data-move="add"]`);
    if ((await w.page.locator('.ao-flyout .mo-opt').count()) !== 2) throw new Error('Add should show two options');
    w.at('+ ▢x, −5'); await w.click(`${act('addPick')}[data-kind="x"]`); await w.type(-5);
    if ((await w.page.locator('.lx-ghost .lx-addx').count()) !== 2) throw new Error('an x should be printed after each box');
    await w.both('r-add-menu');
    await w.enter(); await wait(w.page, 400); await w.row('8x − 14 − 5x = 10');
  },
  async 'r-x-greyed'(w) {
    await w.start(); await w.see('8x − 14 = 5x + 10', 'Get x on one side first.');
    w.at('type 8 in x ='); await w.click('[data-fk="answer"]').catch(() => {}); await w.type(8);
    if ((await w.page.locator('[data-fk="answer"]').innerText()).trim() === '8') throw new Error('x = should take nothing while x is on both sides');
    await w.both('r-x-greyed');
    w.at('drag the 5x across'); await w.crossTerm('5x', 'left'); await w.notSee('Get x on one side first.');
    w.at('type 8 again'); await w.click(act('focus')); await w.type(8);
    if ((await w.page.locator('[data-fk="answer"]').innerText()).trim() !== '8') throw new Error('x = should take the 8 now');
  },
  async 'r-combine-x'(w) {
    await w.start(); await w.see('8x − 14 = 5x + 10');
    w.at('drag the 5x across'); await w.crossTerm('5x', 'left');
    w.at('−5x onto 8x, 3'); await w.combineTerms('−5x', '8x', 3); await w.see('3 of what?');
    await w.both('r-combine-x');
    w.at('x, Enter'); await w.page.keyboard.press('x'); await wait(w.page, 200); await w.enter(); await w.row('3x − 14 = 10');
  },
  async 'r-two-x-check'(w) {
    await w.start(); await w.see('7x = 4x + 15');
    w.at('solve to x alone'); await w.crossTerm('4x', 'left'); await w.combineTerms('−4x', '7x', '3x'); await w.divEnter(3);
    w.at('type 5, drop on the second x'); await w.click(act('focus')); await w.type(5); await w.enter(); await w.dragTo('[data-x][data-xi="1"]');
    if ((await w.page.locator('[data-xi="1"] .lb-xcheck').count()) !== 1) throw new Error('the x in 4x should get a green check');
    if ((await w.page.locator('[data-xi="0"] .lb-xwait').count()) !== 1) throw new Error('the other x should show a faint 5 waiting');
    await w.both('r-two-x-midway');
    w.at('drop on the first x'); await w.dragTo('[data-x][data-xi="0"]');
    await w.pairs('7x=4x+15', '7×5=4×5+15');
    await w.both('r-two-x-complete');
    w.at('Enter four times'); await w.enter(4); await w.see('35 = 4 × 5 + 15', '35 = 20 + 15', '35 = 35', '✓ Balanced');
  },
  async 'student-both'(w) {
    await w.start(); await w.see('5x + 5 = 2x + 14');
    w.at('mistake 1: Add 2x'); await w.click(`${act('choose')}[data-move="add"]`); await w.click(`${act('addPick')}[data-kind="x"]`); await w.type(2); await w.enter(); await w.lateLayer();
    await w.see('did not eliminate the term', 'got bigger'); await w.shot('student-both-sign-lost');
    w.at('mistake 1: Undo'); await w.click(act('undo')); await wait(w.page, 800); await w.see('Move this x-term to the other side. Drag it across the =, or use Add.');
    await w.both('r-stuck');
    w.at('mistake 2: type 3 in x ='); await w.click(act('spotDismiss')).catch(() => {}); await w.click('[data-fk="answer"]').catch(() => {}); await w.type(3); await w.enter();
    await w.see('Get x on one side first.');
    if ((await w.page.locator('.sv-checklist .sv-checkrow').count())) throw new Error('nothing should be checked while x is on both sides');
    w.at('mistake 3: drag 2x across, combine as 7x'); await w.crossTerm('2x', 'left'); await w.combineTerms('−2x', '5x', '7x'); await w.lateLayer();
    await w.see('is not 7x'); await w.shot('student-both-sizes');
    w.at('mistake 3: Undo'); await w.click(act('undo')); await wait(w.page, 800);
    if ((await w.page.locator('.lx-live .lx-tok.is-hint').count()) !== 2) throw new Error('the 5x and the −2x should be outlined after Undo');
    await w.see('5x and −2x are like terms. Drag one onto the other to combine them.'); await w.shot('student-both-hint');
    w.at('last: pick up the 5 and drop it back'); await w.liftBack('5');
  },

  // ---- Build P: nudges, calculate a product, cross-off, moving between blanks, Distribute polish, full checks, one drop per x ----
  async 'p-combine-nudge'(w) {
    await w.start(); await w.see('TWO-STEP EQUATIONS · Level 1', '3x + 4 = 19');
    w.at('Add −4, Enter'); await w.addEnter(-4); await w.row('3x = 19 − 4');
    for (const h of [768, 650]) {                       // (each size on its own wait: the glow, then the pop-up)
      await w.page.setViewportSize({ width: 1366, height: h }); await w.page.keyboard.press('Shift'); await wait(w.page, 300);
      w.at('hands off for 3 seconds'); await w.idle(500); await wait(w.page, 2500);
      if ((await w.page.locator('.nudge-glow, .nudge-still').count()) !== 2) throw new Error('the 19 and the −4 should glow after about 2.5 seconds');
      await w.notSee('Drag one onto the other');
      await w.shot(`p-combine-nudge-glow-${h}`);
      w.at('hands off for 5 seconds'); await wait(w.page, 2000); await w.nudged(2, 'Drag one onto the other to combine them.');
      const glowing = await w.page.locator('.nudge-glow, .nudge-still').allInnerTexts();
      if (glowing.map((t) => t.replace(/\s+/g, '')).join('|') !== '19|−4') throw new Error(`the 19 and the −4 should glow: ${glowing}`);
      await w.shot(`p-combine-nudge-popup-${h}`);
      w.at('press a key'); await w.page.keyboard.press('Shift'); await wait(w.page, 300); await w.noNudge(); await w.notSee('Drag one onto the other');
    }
    await w.page.setViewportSize({ width: 1366, height: 768 });
  },
  async 'p-calc'(w) {
    await w.start(); await w.see('3(x + 2) = 15');
    w.at('Divide 3, Enter'); await w.divEnter(3); await w.row('x + 2 = (15) 3');
    for (const h of [768, 650]) {
      await w.page.setViewportSize({ width: 1366, height: h }); await w.page.keyboard.press('Shift'); await wait(w.page, 300);
      w.at('hands off for 3 seconds'); await w.idle(3000);
      if ((await w.page.locator('.nudge-glow, .nudge-still').count()) !== 1) throw new Error('the fraction bar should glow after about 2.5 seconds');
      await w.shot(`p-calc-nudge-glow-${h}`);
      w.at('hands off for 5 seconds'); await wait(w.page, 2000); await w.nudged(1, 'Click the fraction bar to divide 15 by 3.');
      await w.shot(`p-calc-nudge-popup-${h}`);
    }
    await w.page.setViewportSize({ width: 1366, height: 768 }); await wait(w.page, 300);
    w.at('click the fraction bar'); await w.click('[data-action="lxCalc"]');
    if (!(await w.page.locator('.lx-box.is-calc').count())) throw new Error('a box for the product should open');
    await w.lit('.lb-stack [data-calc]');
    await w.both('p-calc-blank');
    w.at('type 5, Enter'); await w.type(5); await w.enter(); await wait(w.page, 300); await w.row('x + 2 = 5');
    w.at('Add −2'); await w.addEnter(-2); await w.row('x = 5 − 2');
    w.at('type 3, check'); await w.answer(3, 3); await w.see('3(3 + 2) = 15', '3(5) = 15', '15 = 15', '✓ Balanced');
  },
  async 'p-calc-wrong'(w) {
    await w.start(); await w.see('3(x + 2) = 15');
    w.at('Multiply, the fraction, 1 3, Go'); await w.click(act('multOpen')); await w.click(`${act('multPick')}[data-kind="frac"]`); await w.type(1); await w.type(3); await w.click(act('go')); await wait(w.page, 400);
    await w.row('x + 2 = ⅓×(15)');
    w.at('click the ×, 45, Enter'); await w.click('[data-action="lxCalc"]'); await w.type(45); await w.enter(); await w.lateLayer();
    await w.see('⅓ × 15 is not 45. Press Undo and try again.', 'check this');
    await w.lit('.lb-stack [data-calc]');
    await w.both('p-calc-wrong');
    w.at('Undo'); await w.click(act('undo')); await wait(w.page, 1500);
    await w.see('⅓ × 15 is the same as 15 ÷ 3. Click the × and type it.');
    await w.both('p-calc-hint');
    w.at('the × again, 5, Enter'); await w.click('[data-action="lxCalc"]'); await w.type(5); await w.enter(); await wait(w.page, 300); await w.row('x + 2 = 5');
  },
  async 'p-cross-off'(w) {
    await w.start(); await w.see('3x + 4 = 19');
    w.at('Add −4, combine 15'); await w.addEnter(-4); await w.combine(15); await w.row('3x = 15');
    w.at('Divide 3, Enter, watch'); await w.divEnter(3); await wait(w.page, 2000);
    const struck = await w.page.locator('.lb-work .xo.is-struck').allInnerTexts();
    if (struck.join('|') !== '3|3') throw new Error(`the 3 in front of x and the 3 under it should be struck: ${struck}`);
    if (await w.page.locator('.lb-work .lb-right .xo.is-struck').count()) throw new Error('the 15 side should not be struck');
    await w.row('x = (15) 3');
    await w.both('p-cross-off');
  },
  async 'p-cross-off-flip'(w) {
    await w.start(); await w.see('−x = 8');
    w.at('Flip, Go, watch'); await w.flip(); await wait(w.page, 2000);
    const struck = await w.page.locator('.lb-work .xo.is-struck').allInnerTexts();
    if (struck.join('|') !== '−|−') throw new Error(`the two minus signs on the x side should be struck: ${struck}`);
    await w.see('x = −(8)');
    await w.both('p-cross-off-flip');
  },
  async 'p-tab-blanks'(w) {
    await w.start(); await w.see('3(x + 2) = 15');
    const boxes = async () => (await w.page.locator('.lx-ghost.is-products .lx-box').allInnerTexts()).map((t) => t.trim());
    const selected = async () => w.page.locator('.lx-ghost.is-products .lx-box.is-selected').innerText().catch(() => null);
    w.at('drag the 3, type 3, Tab, 6'); await w.dragFactor(); await w.type(3); await w.page.keyboard.press('Tab'); await wait(w.page, 200); await w.type(6);
    if ((await boxes()).join(',') !== '3,6') throw new Error(`the blanks should read 3 and 6: ${await boxes()}`);
    w.at('Shift+Tab'); await w.page.keyboard.press('Shift+Tab'); await wait(w.page, 200);
    if ((await selected())?.trim() !== '3') throw new Error('Shift+Tab should go back to the 3 and select it');
    await w.both('p-tab-blanks');
    w.at('type 4'); await w.type(4);
    if ((await boxes()).join(',') !== '4,6') throw new Error(`typing should replace the 3: ${await boxes()}`);
    w.at('right arrow, left arrow'); await w.page.keyboard.press('ArrowRight'); await wait(w.page, 150);
    if ((await selected())?.trim() !== '6') throw new Error('the right arrow should go to the 6 and select it');
    await w.page.keyboard.press('ArrowLeft'); await wait(w.page, 150);
    if ((await selected())?.trim() !== '4') throw new Error('the left arrow should go back to the 4 and select it');
    w.at('type 3, Enter'); await w.type(3); await w.enter(); await wait(w.page, 300); await w.row('3x + 6 = 15');
  },
  async 'p-tab-fraction'(w) {
    await w.start(); await w.see('5x = −15');
    const parts = async () => (await w.page.locator('.dv-fracpart:not(.is-mirror)').allInnerTexts()).map((t) => t.trim());
    const selected = async () => w.page.locator('.dv-fracpart.is-selected').innerText().catch(() => null);
    w.at('Multiply, the fraction, 1, 4'); await w.click(act('multOpen')); await w.click(`${act('multPick')}[data-kind="frac"]`); await w.type(1); await w.type(4);
    w.at('left arrow'); await w.page.keyboard.press('ArrowLeft'); await wait(w.page, 200);
    if ((await selected())?.trim() !== '1') throw new Error('the left arrow should go to the top and select the 1');
    await w.both('p-tab-fraction');
    w.at('right arrow, 5'); await w.page.keyboard.press('ArrowRight'); await wait(w.page, 200);
    if ((await selected())?.trim() !== '4') throw new Error('the right arrow should go to the bottom and select the 4');
    await w.type(5);
    if ((await parts()).join(',') !== '1,5') throw new Error(`typing should replace the 4: ${await parts()}`);
    w.at('Go'); await w.click(act('go')); await wait(w.page, 400); await w.see('⅕(5x) = ⅕(−15)');
  },
  async 'p-distribute-arcs'(w) {
    await w.start(); await w.see('3(x + 2) = 15');
    w.at('drag the 3 onto the parenthesis'); await w.dragFactor(); await wait(w.page, 300);
    if ((await w.page.locator('.dx-arcs .dx-arc').count()) !== 2) throw new Error('an arc should run to each of the two pieces');
    if ((await w.page.locator('.dx-arcs .dx-times').count()) !== 2) throw new Error('each arc should have a small ×');
    if (await w.page.locator('.lx-prodlabel:not(.is-hidden)').count()) throw new Error('the blanks should have no labels the first time');
    if (!(await w.page.locator('.lx-factor.is-distributing').count())) throw new Error('the 3 should be shown in colour');
    await w.see('3 groups of');
    await w.both('p-distribute-arcs');
    w.at('3, Enter, 5, Enter'); await w.type(3); await w.enter(); await w.type(5); await w.enter(); await w.lateLayer();
    await w.see('3 · 2 is not 5.');
    const labels = await w.page.locator('.lx-prodlabel:not(.is-hidden)').allInnerTexts();
    if (labels.join('|') !== '3 · x|3 · 2') throw new Error(`after a wrong product the labels should be 3 · x and 3 · 2: ${labels}`);
    await w.both('p-labels-after-wrong');
    w.at('Undo'); await w.click(act('undo')); await wait(w.page, 800);
    w.at('drag the 3 again'); await w.dragFactor(); await wait(w.page, 300);
    if ((await w.page.locator('.lx-prodlabel:not(.is-hidden)').count()) !== 2) throw new Error('the labels should stay for the rest of this problem');
  },
  async 'p-xboxes'(w) {
    await w.start(); await w.see('3(x + 2) + 2x = 41');
    w.at('distribute: 3, 6'); await w.distribute(3, 6); await w.row('3x + 6 + 2x = 41');
    w.at('drag 2x onto 3x, type 5, Enter'); await w.combineTerms('2x', '3x', 5); await wait(w.page, 300);
    await w.see('5 of what?');
    const boxes = await w.page.locator('.xb-svg .xb-box').count();
    if (boxes !== 5) throw new Error(`the picture should have three x boxes and two x boxes, found ${boxes}`);
    await w.row('3x + 6 + 2x = 41');
    await w.both('p-xboxes');
    w.at('x, Enter'); await w.page.keyboard.press('x'); await wait(w.page, 200); await w.enter(); await w.row('5x + 6 = 41');
  },
  async 'p-full-check-two-step'(w) {
    await w.start(); await w.see('4 − 3x = −11');
    w.at('type 5, Enter, drag'); await w.click(act('focus')); await w.type(5); await w.enter(); await w.drag();
    await w.pairs('4−3x=−11', '4−3×5=−11');
    w.at('Enter, Enter'); await w.enter(2); await w.see('4 − 15 = −11', '−11 = −11'); await w.notSee('Balanced');
    w.at('Enter'); await w.enter(); await w.see('✓ Balanced');
  },
  async 'p-full-check-distribute'(w) {
    await w.start(); await w.see('5 − 2(x + 2) = −7');
    w.at('type 4, Enter, drag'); await w.click(act('focus')); await w.type(4); await w.enter(); await w.drag();
    await w.see('5 − 2(4 + 2) = −7');
    w.at('Enter twice'); await w.enter(2); await w.see('5 − 2(6) = −7', '5 − 12 = −7'); await w.notSee('Balanced');
    w.at('Enter twice more'); await w.enter(2); await w.see('−7 = −7', '✓ Balanced');
    await w.both('p-full-check-distribute');
  },
  async 'p-two-x'(w) {
    await w.start(); await w.see('3(x + 2) + 2x = 41');
    w.at('type 7, Enter'); await w.click(act('focus')); await w.type(7); await w.enter();
    w.at('hold the 7'); await w.hold();
    const glowing = await w.page.evaluate(() => [...document.querySelectorAll('[data-x][data-action="placeValue"]')].filter((x) => x.closest('.is-carrying-value')).length);
    if (glowing !== 2) throw new Error(`both x's should glow while the 7 is held, found ${glowing}`);
    await w.shot('p-two-x-holding');
    const second = await w.page.locator('[data-x][data-xi="1"]').first().boundingBox();
    await w.letGo(second.x + second.width / 2, second.y + second.height / 2); await wait(w.page, 300);
    w.at('dropped on the second x');
    if ((await w.page.locator('[data-xi="1"] .lb-xcheck').count()) !== 1) throw new Error('the x in 2x should get a green check');
    if ((await w.page.locator('[data-xi="0"] .lb-xwait').count()) !== 1) throw new Error('the other x should show a faint 7 waiting');
    if (await w.page.locator('.sv-checklist .sv-checkrow').count()) throw new Error('the check should wait for the other x');
    await w.both('p-two-x-midway');
    w.at('drag onto the first x'); await w.dragTo('[data-x][data-xi="0"]');
    await w.see('3(7 + 2) + 2 × 7 = 41');
    w.at('Enter five times'); await w.enter(5); await w.see('3(9) + 2 × 7 = 41', '27 + 2 × 7 = 41', '27 + 14 = 41', '41 = 41', '✓ Balanced');
  },
  async 'p-divide-neg-popup'(w) {
    await w.start(); await w.see('−3x = 12');
    w.at('Divide −1, Go'); await w.click(DIV); await w.page.keyboard.press('-'); await w.type(1); await w.click(act('go')); await wait(w.page, 400);
    await w.see('(−3x) −1 = (12) −1', '3x = −12', 'Dividing by −1 does the same thing as multiplying by −1: every sign flips.');
    await w.notSee('Multiplying both sides by −1 flips every sign.');
    await w.both('p-divide-minus-one');
    w.at('Undo'); await w.click(act('undo')); await wait(w.page, 400);
    w.at('Divide −3, Go'); await w.click(DIV); await w.page.keyboard.press('-'); await w.type(3); await w.click(act('go')); await wait(w.page, 400);
    await w.see('(−3x) −3 = (12) −3'); await w.notSee('Dividing by −3 flips every sign');
  },
  async 'p-whole-explained'(w) {
    await w.start(); await w.see('5x = −15');
    w.at('Multiply, the first option'); await w.click(act('multOpen'));
    if (await w.page.locator('.mo-opt[data-kind="whole"].is-grey').count()) throw new Error('the whole number should not be greyed');
    await w.click(`.mo-opt${act('multPick')}[data-kind="whole"]`); await w.type(5); await w.click(act('go'));
    await w.see('5 × (5x) makes 25x: still not one x. Try dividing both sides.');
    await w.both('p-whole-explained');
    w.at('Multiply again, the first option, 1 / 5'); await w.click(act('multOpen')); await w.click(`.mo-opt${act('multPick')}[data-kind="whole"]`); await w.type(1); await w.page.keyboard.press('/'); await wait(w.page, 200); await w.type(5);
    const parts = (await w.page.locator('.dv-fracpart:not(.is-mirror)').allInnerTexts()).map((t) => t.trim());
    if (parts.join(',') !== '1,5') throw new Error(`1, / and 5 should make the fraction 1 over 5: ${parts}`);
    w.at('Go'); await w.click(act('go')); await wait(w.page, 400); await w.see('⅕(5x) = ⅕(−15)');
  },
  async 'p-lights-divide'(w) {
    await w.start(); await w.see('5x = −15');
    const dotsBeside = () => w.page.evaluate(() => {
      const grid = [...document.querySelector('.lx-pgrid').children];
      const out = {};
      grid.forEach((el, i) => { if (el.matches('.lx-move, .lx-movewrap')) out[el.querySelector('[data-move]')?.dataset.move ?? el.dataset.move] = [...(grid[i + 1]?.querySelectorAll('[data-light]') ?? [])].map((d) => `${d.dataset.light}:${[...d.classList].find((c) => /^is-(green|red|neutral|off)$/.test(c))}`); });
      return out;
    });
    const before = await dotsBeside();
    if ((before.fraction ?? []).length !== 1 || (before.div ?? []).length !== 2) throw new Error(`Multiply should have one dot and Divide two: ${JSON.stringify(before)}`);
    w.at('Divide 5, Enter'); await w.divEnter(5);
    const after = await dotsBeside();
    const div = after.div ?? [];
    if (div.join(',') !== 'smaller:is-green,onebox:is-green') throw new Error(`Divide's two dots should be green: ${JSON.stringify(after)}`);
    w.at('point at the dots'); await w.page.locator('[data-light="smaller"]').hover(); await wait(w.page, 300); await w.see('Smaller numbers');
    await w.both('p-lights-divide');
  },

  // ---- Build O: the Moves panel ----
  async 'o-panel'(w) {
    await w.start(); await w.see('TWO-STEP EQUATIONS · Level 1', '3x + 4 = 19', 'MOVES');
    const got = await w.page.evaluate(() => ({
      head: document.querySelector('.lx-panel .lx-head')?.textContent,
      symbols: [...document.querySelectorAll('.lx-pgrid .lx-symbol')].map((e) => e.getAttribute('aria-label')),
      width: Math.round(document.querySelector('.lx-panel').getBoundingClientRect().width),
    }));
    if (JSON.stringify(got.symbols) !== JSON.stringify(['Plus sign', 'Times sign', 'Division sign', 'Circle of two arrows', 'Double arrow'])) throw new Error(`the symbols should be + × ÷, two arrows in a circle, a double arrow: ${got.symbols}`);
    const names = ['Addition property of equality: add the same number to both sides', 'Multiplication property of equality', 'Division property of equality',
      'Multiplication property of equality: multiply both sides by −1', 'Symmetric property of equality: if a = b, then b = a'];
    const buttons = w.page.locator('.lx-pgrid .lx-move');
    for (let i = 0; i < 5; i++) {
      w.at(`point at button ${i + 1}`); await buttons.nth(i).hover(); await wait(w.page, 250);
      const tip = await buttons.nth(i).evaluate((b) => getComputedStyle(b, '::after').content);
      if (!tip.includes(names[i])) throw new Error(`button ${i + 1} should be named "${names[i]}" when pointed at, not ${tip}`);
      if (i === 0) await w.shot('o-panel-name-add');
    }
    console.log(`         (the panel is ${got.width} px wide)`);
    await w.both('o-panel');
  },
  async 'o-add-not-stuck'(w) {
    await w.start(); await w.see('3x + 4 = 19');
    w.at('Add, type 4'); await w.click(`${act('choose')}[data-move="add"]`); await w.type(4);
    if (!(await w.page.locator('.lb-move[data-move="add"].is-on').count())) throw new Error('Add should be yellow once clicked');
    await w.shot('o-add-not-stuck-before');
    w.at('Multiply'); await w.click(act('multOpen'));
    if (await w.page.locator('.lb-move[data-move="add"].is-on').count()) throw new Error('Add should no longer be yellow');
    if (await w.page.locator('.lx-ghost.is-chosen').count()) throw new Error('Add’s box should be gone from under the equation');
    if ((await w.page.locator('.mo-flyout .mo-opt').count()) !== 2) throw new Error('Multiply’s two options should be open');
    await w.both('o-add-not-stuck');
  },
  async 'o-preview-ends'(w) {
    await w.start(); await w.see('3x + 4 = 19');
    const preview = () => w.page.locator('.lx-ghost.is-preview, .lx-ghost.is-near').count();
    w.at('point at Add'); await w.page.hover('.lb-move[data-move="add"]'); await wait(w.page, 300);
    if (!(await preview())) throw new Error('pointing at Add should show its grey row');
    await w.shot('o-preview-ends-before');
    w.at('down onto Multiply'); const b = await w.page.locator(act('multOpen')).boundingBox();
    await w.page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 }); await wait(w.page, 300);
    if (await preview()) throw new Error('the grey row should be gone with the pointer on Multiply');
    await w.both('o-preview-ends');
    w.at('off the panel'); await w.page.mouse.move(700, 600, { steps: 8 }); await wait(w.page, 300);
    if (await preview()) throw new Error('the equation should be clean with the pointer away');
  },
  async 'o-preview-swaps'(w) {
    await w.start(); await w.see('FLIP EVERYTHING · Level 3', '−3x = 12');
    w.at('point at Divide'); await w.page.hover(DIV); await wait(w.page, 300);
    if (!(await w.page.locator('.lx-ghost.is-preview .is-division').count())) throw new Error('pointing at Divide should show the bars');
    w.at('down onto Flip everything'); const f = await w.page.locator(act('flipPick')).boundingBox();
    await w.page.mouse.move(f.x + f.width / 2, f.y + f.height / 2, { steps: 8 }); await wait(w.page, 300);
    if (await w.page.locator('.lx-ghost .is-division').count()) throw new Error('the bars should be gone');
    await w.see('−1 × (−3x) = −1 × (12)');
    await w.shot('o-preview-swaps-flip');
    w.at('off the panel'); await w.page.mouse.move(700, 600, { steps: 8 }); await wait(w.page, 300);
    if (await w.page.locator('.lx-ghost.is-preview').count()) throw new Error('the equation should be clean');
    w.at('click Divide, point at Flip'); await w.click(DIV); await w.page.hover(act('flipPick')); await wait(w.page, 300);
    if (!(await w.page.locator('.lx-ghost.is-chosen .is-division').count())) throw new Error('Divide’s solid row should stay');
    if (!(await w.page.locator(`${DIV}.is-on`).count())) throw new Error('Divide should stay yellow');
    await w.both('o-preview-swaps');
  },
  async 'o-divide-button'(w) {
    await w.start(); await w.see('DIVIDE IT · Level 2', '5x = −15');
    w.at('point at Divide'); await w.page.hover(DIV); await wait(w.page, 300);
    if (!(await w.page.locator('.lx-ghost.is-preview .is-division').count())) throw new Error('pointing at Divide should show the bars');
    await w.see('(5x) = (−15)');
    await w.both('o-divide-preview');
    w.at('click Divide, type 5'); await w.click(DIV); await w.type(5);
    const boxes = (await w.page.locator('.lx-ghost .mo-divpart').allInnerTexts()).map((t) => t.trim());
    if (boxes.join(',') !== '5,5') throw new Error(`both boxes should say 5: ${boxes}`);
    await w.see('Same as multiplying by ⅕.');
    w.at('Go'); await w.click(act('go')); await wait(w.page, 400);
    await w.row('(5x) 5 = (−15) 5 Same as multiplying by ⅕.'); await w.row('x = (−15) 5');
    await w.both('o-divide-button');
  },
  async 'o-divide-negative'(w) {
    await w.start(); await w.see('FLIP EVERYTHING · Level 3', '−3x = 12');
    w.at('Divide, −3'); await w.click(DIV); await w.page.keyboard.press('-'); await w.type(3);
    const boxes = (await w.page.locator('.lx-ghost .mo-divpart').allInnerTexts()).map((t) => t.trim());
    if (boxes.join(',') !== '−3,−3') throw new Error(`both boxes should say −3: ${boxes}`);
    await w.see('Same as multiplying by −⅓.');
    w.at('Go'); await w.click(act('go')); await wait(w.page, 400);
    await w.see('(−3x) −3 = (12) −3', 'x = (12) −3');
    if (await w.page.locator('.lx-dot.is-red').count()) throw new Error('nothing should turn red');
    await w.both('o-divide-negative');
  },
  async 'o-divide-minus-one'(w) {
    await w.start(); await w.see('−3x = 12');
    w.at('Divide, −1, Go'); await w.click(DIV); await w.page.keyboard.press('-'); await w.type(1); await w.click(act('go')); await wait(w.page, 400);
    // (Build P, Part 9: drawn as dividing, with its own pop-up; the same move underneath)
    await w.see('(−3x) −1 = (12) −1', 'Same as multiplying by −1.', '3x = −12', 'Dividing by −1 does the same thing as multiplying by −1: every sign flips.');
    w.at('Undo'); await w.click(act('undo')); await wait(w.page, 300);
    w.at('Flip, Go'); await w.flip();
    await w.see('−1 × (−3x) = −1 × (12)', '3x = −12');
    await w.both('o-divide-minus-one');
  },
  async 'o-fraction-back'(w) {
    await w.start(); await w.see('DIVIDE IT · Level 2', '5x = −15');
    w.at('Multiply'); await w.click(act('multOpen'));
    if ((await w.page.locator('.mo-flyout .mo-opt').count()) !== 2) throw new Error('Multiply should open two options');
    if (await w.page.locator('.mo-flyout .mo-sign').count()) throw new Error('the options should have no small × or ÷');
    await w.both('o-fraction-back-menu');
    w.at('the first option, 5, Go'); await w.click(`.mo-opt${act('multPick')}[data-kind="whole"]`); await w.type(5); await w.click(act('go'));
    await w.see('5 × (5x) makes 25x: still not one x. Try dividing both sides.');
    w.at('Multiply again, the fraction, 1 / 5'); await w.click(act('multOpen')); await w.click(`${act('multPick')}[data-kind="frac"]`); await w.type(1); await w.page.keyboard.press('/'); await wait(w.page, 200); await w.type(5);
    const boxes = (await w.page.locator('.dv-fracpart:not(.is-mirror)').allInnerTexts()).map((t) => t.trim());
    if (boxes.join(',') !== '1,5') throw new Error(`the fraction should be 1 over 5: ${boxes}`);
    w.at('Go'); await w.click(act('go')); await wait(w.page, 400);
    await w.see('⅕(5x) = ⅕(−15)', 'x = ⅕(−15)');
    if (await w.page.locator('.lb-divfrac').count()) throw new Error('a fraction row should be written as multiplying, not dividing');
    await w.both('o-fraction-back');
  },
  async 'o-hint-divide'(w) {
    await w.start(); await w.see('DIVIDE IT · Level 2', '5x = −15');
    w.at('type 4, check it'); await w.click(act('focus')); await w.type(4); await w.enter(); await w.drag();
    await w.click(act('nextLine')); await w.click(act('nextLine')); await w.lateLayer(); await w.see('not balanced');
    w.at('Undo'); await w.click(act('undo')); await wait(w.page, 800);
    await w.see('To get one x, divide both sides by 5 (that is, multiply by ⅕): one of the 5 x boxes is ⅕.');
    if (!(await w.page.locator(`${DIV}.is-preview`).count())) throw new Error('the Divide button should be lit');
    if (!(await w.page.locator('.lx-ghost .is-division').count())) throw new Error('Divide’s preview should be under the equation');
    if (await w.page.locator('.mo-flyout').count()) throw new Error('Multiply’s options should stay closed');
    await w.lit(DIV);
    await w.both('o-hint-divide');
    w.at('type 5, Go'); await w.type(5); await w.typedIn(DIV_BOX, '5'); await w.click(act('go')); await wait(w.page, 400);
    await w.see('(5x) 5 = (−15) 5');
  },
  async 'h-retype-fraction'(w) {
    await w.start(); await w.see('DIVIDE IT · Level 2');
    w.at('Multiply, the second choice, 1, 5'); await w.click(act('multOpen')); await w.click(`${act('multPick')}[data-kind="frac"]`); await w.type(1); await w.type(5);
    await w.see('Tap a box to retype it');
    const read = () => w.page.locator('.dv-fracpart:not(.is-mirror)').allInnerTexts().then((t) => t.map((x) => x.trim()));
    if ((await read()).join(',') !== '1,5') throw new Error(`the boxes should say 1 and 5: ${await read()}`);
    w.at('click the top box'); await w.click('.dv-fracpart[data-target="num"]');
    if ((await read()).join(',') !== ',5') throw new Error(`the top box should be empty and the bottom keep its 5: ${await read()}`);
    if (!(await w.page.locator('.dv-fracpart[data-target="num"].is-blink').count())) throw new Error('the cursor should be in the top box');
    w.at('click the bottom box'); await w.click('.dv-fracpart[data-target="den"]');
    if ((await read()).join(',') !== ',') throw new Error(`the bottom box should be empty too: ${await read()}`);
    if (!(await w.page.locator('.dv-fracpart[data-target="den"].is-blink').count())) throw new Error('the cursor should be in the bottom box');
    await w.both('h-retype-fraction');
  },
  // ---- Build M, Part 2: Distribute, combine, solve ----
  async 'm-level-1'(w) {
    await w.start(); await w.see('DISTRIBUTE, COMBINE, SOLVE · Level 1', '3(x + 2) = 15');
    await w.both('m-level-1');
    w.at('distribute: 3, 6'); await w.distribute(3, 6); await w.row('3x + 6 = 15');
    w.at('Add −6'); await w.addEnter(-6); await w.row('3x = 15 − 6');
    w.at('combine 15 and −6: 9'); await w.combine(9); await w.row('3x = 9');
    w.at('Divide by 3'); await w.divEnter(3); await w.row('x = (9) 3');
    w.at('type 3, check'); await w.answer(3, 3);
    await w.see('3(3 + 2) = 15', '✓ Balanced');
  },
  async 'm-level-2'(w) {
    await w.start(); await w.see('DISTRIBUTE, COMBINE, SOLVE · Level 2', '−2(x + 4) = −4');
    await w.both('m-level-2');
    w.at('distribute: −2, −8'); await w.distribute(-2, -8); await w.row('−2x + −8 = −4');
    w.at('Add 8, combine'); await w.addEnter(8); await w.row('−2x = −4 + 8'); await w.combine(4); await w.row('−2x = 4');
    w.at('Divide by −2'); await w.divEnter(-2); await w.row('x = (4) −2');
    w.at('type −2, check'); await w.answer(-2, 3); await w.see('✓ Balanced');
  },
  async 'm-level-3'(w) {
    await w.start(); await w.see('DISTRIBUTE, COMBINE, SOLVE · Level 3', '5 + 2(x + 3) = 17');
    await w.both('m-level-3');
    w.at('Multiply, Divide'); await w.click(DIV); await w.see('That move works once each side is one term.');
    w.at('distribute: 2, 6'); await w.distribute(2, 6); await w.row('5 + 2x + 6 = 17');
    w.at('combine 5 and 6: 11'); await w.combineTerms('5', '6', 11); await w.row('11 + 2x = 17');
    w.at('Add −11, combine, Divide'); await w.addEnter(-11); await w.combine(6); await w.row('2x = 6'); await w.divEnter(2); await w.row('x = (6) 2');
    w.at('type 3, drag it in, Enter for each line'); await w.answer(3, 4); await w.see('5 + 2(3 + 3) = 17', '5 + 2(6) = 17', '5 + 12 = 17', '17 = 17', 'Yes! x = 3');
  },
  async 'm-level-4'(w) {
    await w.start(); await w.see('DISTRIBUTE, COMBINE, SOLVE · Level 4', '5 − 2(x + 2) = −7');
    await w.both('m-level-4');
    w.at('tap the minus'); await w.click('.lx-live [data-minus]'); await w.row('5 + −2(x + 2) = −7');
    w.at('distribute: −2, −4'); await w.distribute(-2, -4); await w.row('5 + −2x + −4 = −7');
    w.at('combine 5 and −4: 1'); await w.combineTerms('5', '−4', 1); await w.row('1 + −2x = −7');
    w.at('Add −1, combine'); await w.addEnter(-1); await w.combine(-8); await w.row('−2x = −8');
    w.at('Divide by −2'); await w.divEnter(-2); await w.row('x = (−8) −2');
    w.at('type 4, drag it in, Enter for each line'); await w.answer(4, 4); await w.see('5 − 2(4 + 2) = −7', '5 − 2(6) = −7', '5 − 12 = −7', '−7 = −7', 'Yes! x = 4');
  },
  async 'm-level-5'(w) {
    await w.start(); await w.see('DISTRIBUTE, COMBINE, SOLVE · Level 5', '3(x + 2) + 2x = 41');
    await w.both('m-level-5');
    w.at('distribute: 3, 6'); await w.distribute(3, 6); await w.row('3x + 6 + 2x = 41');
    w.at('combine 2x onto 3x: 5x'); await w.combineTerms('2x', '3x', '5x'); await w.row('5x + 6 = 41');
    w.at('Add −6, combine, Divide'); await w.addEnter(-6); await w.combine(35); await w.row('5x = 35'); await w.divEnter(5); await w.row('x = (35) 5');
    w.at('type 7, drag it into each x, Enter for each line'); await w.answer(7, 5); await w.see('3(7 + 2) + 2 × 7 = 41', '3(9) + 2 × 7 = 41', '27 + 14 = 41', '41 = 41', 'Yes! x = 7');
  },
  async 'm-drag-labels'(w) {
    await w.start(); await w.see('3(x + 2) = 15');
    w.at('drag the 3 elsewhere'); await w.dragFactor(false);
    if (await w.page.locator('.lx-prod').count()) throw new Error('a drop away from the parenthesis should change nothing');
    w.at('drag the 3 onto the parenthesis'); await w.dragFactor();
    // (Build P: no labels the first time; the factor in colour, an arc to each piece, "3 groups of")
    if (await w.page.locator('.lx-prodlabel:not(.is-hidden)').count()) throw new Error('the blanks should have no labels the first time');
    if ((await w.page.locator('.dx-arcs .dx-arc').count()) !== 2) throw new Error('there should be an arc to each of the two pieces');
    await w.see('3 groups of');
    if (!(await w.page.locator('.lx-prod .lx-prodx').count())) throw new Error('the x should be printed after the first blank');
    await w.both('m-drag-labels');
    w.at('type 3, 6'); await w.type(3); await w.enter(); await w.type(6); await w.enter(); await w.row('3x + 6 = 15');
    if (!(await w.page.locator('[data-light="noparen"].is-green').count())) throw new Error('No parentheses should be green');
  },
  async 'm-tap-minus'(w) {
    await w.start(); await w.see('5 − 2(x + 2) = −7');
    w.at('drag the 2'); await w.dragFactor(); await w.see('Tap the minus first, so −2 is a negative number.');
    await w.both('m-tap-minus-refused');
    w.at('tap the minus'); await w.click('.lx-live [data-minus]'); await w.row('5 + −2(x + 2) = −7');
    w.at('drag the −2'); await w.dragFactor();
    if (await w.page.locator('.lx-prodlabel:not(.is-hidden)').count()) throw new Error('the blanks should have no labels the first time');
    await w.see('−2 groups of');
    await w.both('m-tap-minus');
  },
  async 'm-wrong-product'(w) {
    await w.start(); await w.see('3(x + 2) = 15');
    w.at('distribute: 3, 2'); await w.distribute(3, 2); await w.lateLayer();
    await w.see('3 · 2 is not 2. Multiply this piece too. Press Undo and try again.');
    await w.lit('.lx-prod.is-wrong .lx-box');
    await w.both('m-wrong-product');
    w.at('Undo'); await w.click(act('undo')); await wait(w.page, 900);
    await w.see('Drag the 3 onto the parenthesis to multiply it by each piece.');
    if (!(await w.page.locator('.lx-live .lx-factor.is-hint').count())) throw new Error('the 3 should be outlined');
    await w.both('m-wrong-product-hint');
  },
  async 'm-divide-first'(w) {
    await w.start(); await w.see('3(x + 2) = 15');
    w.at('Divide by 3'); await w.divEnter(3); await w.see('(3(x + 2)) 3 = (15) 3'); await w.row('x + 2 = (15) 3');
    if (await w.page.locator('.lx-dot.is-red').count()) throw new Error('dividing first should light nothing red');
    await w.both('m-divide-first');
    w.at('Add −2'); await w.addEnter(-2); await w.row('x = (15) 3 − 2');
    w.at('type 3, check'); await w.answer(3, 3); await w.see('3(3 + 2) = 15', '✓ Balanced');
    await w.both('m-check-group');
  },
  async 'm-combine-x'(w) {
    await w.start(); await w.see('3(x + 2) + 2x = 41');
    w.at('distribute: 3, 6'); await w.distribute(3, 6);
    w.at('drag 2x onto 3x, type 5'); await w.combineTerms('2x', '3x');
    await w.see('Combine'); await w.both('m-combine-x');
    await w.type(5); await w.enter(); await w.see('5 of what?');
    await w.both('m-combine-x-bare');
    w.at('press x, Enter'); await w.page.keyboard.press('x'); await wait(w.page, 200); await w.enter(); await w.row('5x + 6 = 41');
  },
  async 'm-ghost-hand'(w) {
    await w.start(); await w.see('3(x + 2) = 15');
    w.at('I’m stuck'); await w.stuck(); await w.see('Drag the 3 onto the parenthesis to multiply it by each piece.');
    w.at('wait 4 seconds'); await wait(w.page, 3300);
    if (!(await w.page.locator('.lx-handghost').count())) throw new Error('a faint copy of the 3 should be travelling to the parenthesis');
    await w.shot('m-ghost-hand-768');
  },
  async 'm-practice'(w) {
    await w.start(); await w.see('DISTRIBUTE, COMBINE, SOLVE · Level 1');
    w.at('Practice distributing first'); await w.click('#practice'); await wait(w.page, 700);
    await w.see('DISTRIBUTE, THEN COMBINE · Level 1');
    if (await w.page.locator('text=Skip tour').count()) await w.click('text=Skip tour');
    await w.both('m-practice');
    w.at('← Packs, Solve it'); await w.click('text=← Packs'); await wait(w.page, 500); await w.click('text=Solve it'); await wait(w.page, 600);
    await w.see('Distribute, combine, solve', 'Multiply each piece, then solve');
    await w.both('m-home');
  },
  async 'student-distribute'(w) {
    await w.start(); await w.see('5 + 2(x + 3) = 17');
    w.at('mistake 1: touch nothing for 11 seconds'); await wait(w.page, 11000);
    if (!(await w.page.locator('.lx-help.is-idle').count())) throw new Error('I’m stuck should be flashing after 10 seconds');
    await w.stuck(); await w.see('Drag the 2 onto the parenthesis to multiply it by each piece.');
    w.at('mistake 2: multiply only the first piece'); await w.distribute(2, 3); await w.lateLayer();
    await w.see('2 · 3 is not 3. Multiply this piece too.');
    w.at('mistake 2: Undo'); await w.click(act('undo')); await wait(w.page, 900); await w.see('Drag the 2 onto the parenthesis');
    w.at('distribute: 2, 6'); await w.distribute(2, 6); await w.row('5 + 2x + 6 = 17');
    w.at('mistake 3: Divide too early'); await w.click(DIV); await w.see('That move works once each side is one term.');
    w.at('mistake 4: Add 5'); await w.addEnter(5); await w.lateLayer(); await w.see('did not eliminate the term');
    w.at('mistake 4: Undo'); await w.click(act('undo')); await wait(w.page, 900);
    if (await w.page.locator(act('spotDismiss')).count()) await w.click(act('spotDismiss'));
    w.at('mistake 5: a wrong sum'); await w.combineTerms('5', '6', 12); await w.lateLayer(); await w.see('5 + 6 is not 12.');
    await w.both('student-distribute');
    w.at('mistake 5: Undo'); await w.click(act('undo')); await wait(w.page, 900);
    await w.see('5 and 6 are like terms. Drag one onto the other to combine them.');
    // mistake 6 (Build N): a mistake, Undo, then type in the blank, from a fresh start
    w.at('mistake 6: start again'); await w.start();
    w.at('mistake 6: distribute 2, 6'); await w.distribute(2, 6); await w.row('5 + 2x + 6 = 17');
    w.at('mistake 6: 5 onto 6, 11'); await w.combineTerms('5', '6', 11); await wait(w.page, 400);
    w.at('mistake 6: Add 11, Enter'); await w.addEnter(11); await w.lateLayer(); await w.see('did not eliminate the term');
    w.at('mistake 6: Undo, type −11, Enter'); await w.click(act('undo')); await wait(w.page, 800); await w.type('-11');
    await w.typedIn('[data-fk="blank"]', '−11');
    await w.enter(); await wait(w.page, 400); await w.see('11 + 2x − 11 = 17 − 11');
    await w.click(act('foldNext')); await wait(w.page, 400); await w.row('2x = 17 − 11'); await w.shot('student-distribute-typed-after-undo');
    w.at('wait 3 seconds and watch the nudge'); await w.idle(5000); await w.nudged(2, 'Drag one onto the other to combine them.'); await w.shot('student-distribute-nudge');
    w.at('last: pick up the 17 and drop it back'); await w.liftBack('17');
  },
  // ---- Build M, Part 1: the placement quiz ----
  async 'm-placement-old'(w) {
    await w.start();
    w.at('Solve it'); await w.click('.section-panel.sec-solve'); await wait(w.page, 600);
    const card = (await w.page.evaluate(() => [...document.querySelectorAll('.pack-card')].map((c) => c.innerText).find((x) => x.includes('Add, combine, then take a fraction')) ?? '')).replace(/\s+/g, ' ');
    const locked = (n) => new RegExp(`Level ${n} Locked`).test(card);
    for (const n of [1, 2, 3, 4, 5, 6]) if (locked(n)) throw new Error(`Level ${n} of Two-step equations should be open: ${card.slice(0, 300)}`);
    if (!locked(7)) throw new Error(`Level 7 should still be locked: ${card.slice(0, 300)}`);
    if (/done|✓/i.test(card)) throw new Error(`no level should be marked done: ${card.slice(0, 300)}`);
    await w.both('m-placement-old');
  },
  async 'm-placement-level1'(w) {
    await w.start(); await w.see('DIAGNOSTIC', '1 of 10');
    w.at('I don’t know, ten times'); for (let i = 0; i < 10; i++) await w.click('[data-go="skip"]');
    await w.see('RESULTS', 'One-step equations', 'Start at Level 1: ax = b'); await w.notSee('Level -1', 'Level −1', 'Level 0');
    await w.both('m-placement-level1');
    w.at('click the green button'); await w.click('.diag-go[data-pack="one-step"]'); await wait(w.page, 700);
    await w.see('ONE-STEP EQUATIONS · Level 1');
  },
  // ---- Build L: the Multiply menu is multiply / divide / fraction, and Flip leaves it ----
  async 'l-hint-divide'(w) {
    await w.start(); await w.see('TWO-STEP EQUATIONS · Level 1', '3x + 4 = 19');
    w.at('Add −4'); await w.addEnter(-4);
    w.at('combine, 15'); await w.combine(15); await w.see('3x = 15');
    w.at('type 15, drag, Enter twice'); await w.answer(15, 2); await w.lateLayer();
    await w.see('3 × 15 = 15', '45 = 15', 'not balanced');
    w.at('Undo'); await w.click(act('undo')); await wait(w.page, 900);
    await w.see('To get one x, divide both sides by 3 (that is, multiply by ⅓): one of the 3 x boxes is ⅓.');
    if (!(await w.page.locator('.spot-move[data-mopt="div"]').count())) throw new Error('the Divide option should be lit');
    if (!(await w.page.locator('.lx-ghost.is-preview .is-division').count())) throw new Error('Divide’s preview should be under 3x = 15');
    await w.both('l-hint-divide');
  },
  async 'l-placement'(w) {
    await w.start(); await w.see('DIAGNOSTIC', '1 of 10');
    const skip = () => w.click('[data-go="skip"]');
    w.at('I don’t know, twice'); await skip(); await skip();
    await w.see('3 of 10', '5x − 2 = 18');
    w.at('type 4, Next'); await w.type(4); await w.click('[data-go="next"]');
    await w.see('4 of 10', '2 − 3x = −16');
    w.at('I don’t know, seven times'); for (let i = 0; i < 7; i++) await skip();
    await w.see('RESULTS', 'Two-step equations', 'Getting there', 'Start at Level 4');
    await w.both('l-placement');
    w.at('Start at Level 4'); await w.click('.diag-go[data-pack="two-step-equations"]'); await wait(w.page, 700);
    await w.see('TWO-STEP EQUATIONS · Level 4');
    const open = await w.page.evaluate(() => JSON.parse(localStorage.getItem('mat.v1'))?.progress?.packs?.['two-step-equations']?.open ?? JSON.parse(localStorage.getItem('mat.v1'))?.packs?.['two-step-equations']?.open);
    if (open !== 4) throw new Error(`Levels 1 to 4 of the new card should be open: ${open}`);
  },

  // ---- Build K: the new Two-step equations card ----
  async 'k-worked'(w) {
    await w.start(); await w.see('TWO-STEP EQUATIONS · Level 1', '3x + 4 = 19');
    w.at('Add −4, Enter'); await w.addEnter(-4); await w.see('3x = 19 − 4');
    w.at('combine 19 and 4, type 15'); await w.combine(15); await w.see('3x = 15');
    w.at('Multiply, Divide, 3'); await w.divEnter(3); await w.see('x = (15) 3');
    await w.both('k-worked');
    w.at('type 5, drag, Enter three times'); await w.answer(5, 3);
    await w.see('3 × 5 + 4 = 19', '19 = 19', '✓ Balanced');
  },
  async 'k-boxes'(w) {
    await w.start();
    w.at('Add −4, combine'); await w.addEnter(-4); await w.combine(15); await w.see('3x = 15');
    w.at('Add −3'); await w.addEnter(-3); await w.lateLayer();
    await w.see('3x is three x boxes, not a 3 to cancel. Adding −3 does not take them away. To get one x, divide both sides by 3 (that is, multiply by ⅓): one of the three x boxes is ⅓.');
    await w.lit('.lx-live .lb-x');
    await w.both('k-boxes');
    w.at('Undo'); await w.click(act('undo')); await wait(w.page, 900);
    await w.see('divide both sides by 3 (that is, multiply by ⅓): one of the 3 x boxes is ⅓');
    if (!(await w.page.locator(`${DIV}.is-preview`).count())) throw new Error('the Divide button should be lit');
    if (!(await w.page.locator('.lx-ghost.is-preview .is-division').count())) throw new Error('Divide’s preview should be under the equation');
  },
  async 'k-frac-grey'(w) {
    await w.start();
    w.at('Multiply, Divide'); await w.click(DIV);
    await w.see('That move works once each side is one term.');
    await w.both('k-frac-grey');
    w.at('Add −4, Next, then Divide'); await w.addEnter(-4); await w.enter(); await w.click(DIV);
    await w.see('That move works once each side is one term.');
    if (await w.page.locator('.dv-fracblank').count()) throw new Error('Divide’s blank should not open while a side has two terms');
    w.at('combine, then Divide'); await w.combine(15); await w.click(DIV);
    if (!(await w.page.locator('.lx-ghost.is-chosen .is-division').count())) throw new Error('Divide’s blank should open at 3x = 15');
  },
  async 'k-trade'(w) {
    await w.start(); await w.see('TWO-STEP EQUATIONS · Level 3', '19 = 4 + 3x');
    await w.see('This is the symmetric property: if a = b, then b = a.');
    if (!(await w.page.locator('[data-move="trade"].is-target').count())) throw new Error('Trade places should have a ring');
    await w.both('k-trade');
    w.at('Trade places'); await w.click(`${act('choose')}[data-move="trade"]`); await w.see('4 + 3x = 19');
  },
  async 'k-bax-flip'(w) {
    await w.start(); await w.see('TWO-STEP EQUATIONS · Level 5', '4 − 3x = −11');
    w.at('Add −4, combine'); await w.addEnter(-4); await w.combine(-15); await w.see('−3x = −15');
    w.at('Flip everything, Go'); await w.click(act('flipPick')); await w.click(act('go')); await wait(w.page, 400);
    await w.see('Multiplying both sides by −1 flips every sign. −x becomes x.', '3x = 15');
    await w.both('k-bax-flip');
    w.at('⅓'); await w.divEnter(3); await w.see('x = (15) 3');
    w.at('type 5, drag, Enter for each line'); await w.answer(5, 3);
    await w.see('4 − 3x = −11', '4 − 3 × 5 = −11', '4 − 15 = −11', '−11 = −11', '✓ Balanced');
  },
  async 'k-flip-intro'(w) {
    await w.start(); await w.see('FLIP EVERYTHING · Level 1', '−x');
    w.at('flip, Go'); await w.flip();
    await w.see('Multiplying both sides by −1 flips every sign. −x becomes x.');
    await w.both('k-flip-intro');
    w.at('type −12, Enter, drag, Enter twice, Next problem'); await w.solve(-12); await w.see('✓ Balanced'); await w.click(act('next')); await wait(w.page, 500);
    w.at('flip on the second problem'); await w.flip();
    await w.notSee('Multiplying both sides by −1 flips every sign.');
    await w.see('x = −(');
  },
  async 'k-credit'(w) {
    await w.start(); await w.see('TWO-STEP EQUATIONS · Level 1', '2x + 5 = 17');
    if (await w.page.locator('text=Skip tour').count()) await w.click('text=Skip tour');
    for (const v of [6, 8, 1, 3, 2]) { w.at(`type ${v}, Enter, Enter`); await w.type(v); await w.enter(); await wait(w.page, 500); await w.enter(); await wait(w.page, 500); }
    await w.see('Level 1 complete');
    w.at('← Packs, Solve it'); await w.click('text=← Packs'); await wait(w.page, 500); await w.click('.section-panel.sec-solve'); await wait(w.page, 600);
    await w.see('Two-step equations', 'Add, combine, then take a fraction');
    const card = await w.page.evaluate(() => [...document.querySelectorAll('.pack-card, [class*="card"]')].map((c) => c.innerText).find((x) => x.includes('Add, combine, then take a fraction')) ?? '');
    if (!/Level 2(?!\s*Locked)/.test(card.replace(/\s+/g, ' ').replace('Level 2 Locked', 'Level 2Locked'))) throw new Error(`Level 2 of the new card should be open: ${card.replace(/\s+/g, ' ').slice(0, 200)}`);
    await w.both('k-home');
  },
  async 'k-level-1'(w) {
    await w.start(); await w.see('TWO-STEP EQUATIONS · Level 1', '3x + 4 = 19');
    await w.both('k-level-1');
    w.at('type 5, Enter, drag, Enter three times'); await w.answer(5, 3); await w.see('Yes! x = 5, and it balances.');
    w.at('Next problem'); await w.click(act('next')); await wait(w.page, 600);
    await w.see('5x + 8 = 18', 'Your mental math is very strong.');
    if (!(await w.page.locator('[data-move="add"].is-ring').count())) throw new Error('Add should have a steady ring');
  },
  async 'k-level-2'(w) {
    await w.start(); await w.see('TWO-STEP EQUATIONS · Level 2', '3x − 4 = 11');
    await w.both('k-level-2');
    w.at('Add 4'); await w.addEnter(4); await w.see('3x = 11 + 4');
    w.at('combine'); await w.combine(15); await w.see('3x = 15');
    w.at('⅓'); await w.divEnter(3); await w.see('x = (15) 3');
    w.at('type 5'); await w.answer(5, 3); await w.see('3 × 5 − 4 = 11', '11 = 11', '✓ Balanced');
  },
  async 'k-level-3'(w) {
    await w.start(); await w.see('TWO-STEP EQUATIONS · Level 3', '19 = 4 + 3x');
    await w.both('k-level-3');
    w.at('Add −4'); await w.addEnter(-4); await w.see('19 − 4 = 3x');
    if (await w.page.locator('.spot-layer.is-error').count()) throw new Error('Add first should not be red');
    w.at('hover the Fewer terms dot'); await w.page.hover('[data-light="fewer"]'); await wait(w.page, 300);
    if (!(await w.page.locator('[data-light="fewer"].is-green').count())) throw new Error('Fewer terms should be green');
    await w.see('Fewer terms');
  },
  async 'k-level-4'(w) {
    await w.start(); await w.see('TWO-STEP EQUATIONS · Level 4', '4 + 3x = 19');
    await w.both('k-level-4');
    w.at('Add −4'); await w.addEnter(-4); await w.see('3x = 19 − 4');
    w.at('combine'); await w.combine(15);
    w.at('⅓'); await w.divEnter(3);
    w.at('type 5, drag, Enter for each line'); await w.answer(5, 3); await w.see('4 + 3 × 5 = 19', '4 + 15 = 19', '19 = 19', '✓ Balanced');
  },
  async 'k-level-5'(w) {
    await w.start(); await w.see('TWO-STEP EQUATIONS · Level 5', '4 − 3x = −11');
    await w.both('k-level-5');
    w.at("I'm stuck"); await w.stuck(); await wait(w.page, 700);
    await w.see('Look at the +4 next to x. What would we add to both sides to eliminate it? Type it in the box.');
    await w.both('k-stuck');
    w.at("I'm stuck again"); await w.stuck(); await wait(w.page, 700);
    await w.see('Look at the +4 next to x.');
    if (await w.page.locator('.ab-boardwrap, .alone-tray, [data-action="teach"]').count()) throw new Error('no balance, counters or Teach me in basic form');
  },
  async 'k-level-6'(w) {
    await w.start(); await w.see('TWO-STEP EQUATIONS · Level 6', '3x + 4 = −11');
    await w.both('k-level-6');
    w.at('Add −4'); await w.addEnter(-4); await w.see('3x = −11 − 4');
    w.at('combine'); await w.combine(-15); await w.see('3x = −15');
    w.at('⅓'); await w.divEnter(3); await w.see('x = (−15) 3');
    w.at('type −5, drag, Enter for each line'); await w.answer(-5, 3); await w.see('3 × (−5) + 4 = −11', '−15 + 4 = −11', '−11 = −11', '✓ Balanced');
  },
  async 'k-level-7'(w) {
    await w.start(); await w.see('TWO-STEP EQUATIONS · Level 7', '19 = 4 − 3x');
    await w.both('k-level-7');
    w.at('Trade places'); await w.click(`${act('choose')}[data-move="trade"]`); await w.see('4 − 3x = 19');
    w.at('Add −4, combine'); await w.addEnter(-4); await w.combine(15); await w.see('−3x = 15');
    w.at('−⅓'); await w.divEnter(-3); await w.see('x = (15) −3');
    w.at('type −5, drag, Enter for each line'); await w.answer(-5, 3); await w.see('19 = 4 − 3 × (−5)', '19 = 4 + 15', '19 = 19', '✓ Balanced');
  },
  async 'student-two-step'(w) {
    await w.start();
    w.at('mistake 1: touch nothing for 11 seconds'); await wait(w.page, 11000);
    if (!(await w.page.locator('.lx-help.is-idle').count())) throw new Error('I’m stuck should be flashing after 10 seconds');
    w.at('mistake 2: type 15, drag, Enter three times'); await w.answer(15, 3); await w.lateLayer();
    await w.see('3 × 15 + 4 = 19', '49 = 19', 'not balanced');
    w.at('mistake 2: Undo'); await w.click(act('undo')); await wait(w.page, 800);
    await w.see('Look at the +4 next to x.'); await w.click(act('spotDismiss'));
    w.at('mistake 3: type 4 in the open Add box, Enter'); await w.type(4); await w.enter(); await w.lateLayer();
    await w.see('did not eliminate the term');
    w.at('mistake 3: Undo'); await w.click(act('undo')); await wait(w.page, 800); await w.click(act('spotDismiss'));
    w.at('mistake 4: Divide too early'); await w.click(DIV);
    await w.see('That move works once each side is one term.');
    w.at('mistake 5: type −4 in the open Add box, a wrong sum'); await w.type(-4); await w.enter(); await w.combine(23); await w.lateLayer();
    await w.see('19 − 4 is not 23. Press Undo and try again.');
    await w.lit('.lx-live .lx-tok.is-pair');
    await w.both('student-two-step');
    w.at('mistake 5: Undo'); await w.click(act('undo')); await wait(w.page, 800);
    await w.see('19 and −4 are on the same side. Put them together: drag one onto the other and type what they make.');
    // mistake 6 (Build N): a mistake, Undo, then type in the blank, from a fresh start
    w.at('mistake 6: start again'); await w.start();
    w.at('mistake 6: Add 4, Enter'); await w.addEnter(4); await w.lateLayer(); await w.see('did not eliminate the term');
    w.at('mistake 6: Undo, type −4, Enter'); await w.click(act('undo')); await wait(w.page, 800); await w.type('-4');
    await w.typedIn('[data-fk="blank"]', '−4');
    await w.enter(); await wait(w.page, 400); await w.see('3x + 4 − 4 = 19 − 4');
    await w.click(act('foldNext')); await wait(w.page, 400); await w.row('3x = 19 − 4'); await w.shot('student-two-step-typed-after-undo');
    w.at('wait 3 seconds and watch the nudge'); await w.idle(5000); await w.nudged(2, 'Drag one onto the other to combine them.'); await w.shot('student-two-step-nudge');
    w.at('last: pick up the 19 and drop it back'); await w.liftBack('19');
  },
  async 'f-no-0-1-minus1'(w) {
    await w.start();
    await w.see('ADD TO BOTH SIDES · Level 2', 'x', '3', '−1');
    const answers = [2, 10, -3, 7, -2];
    const adds = [3, 4, 6, 2, 5];                   // the number that cancels the one beside x
    const equations = ['x − 3 = −1', 'x − 4 = 6', 'x − 6 = −9', 'x − 2 = 5', 'x − 5 = −7'];
    for (let i = 0; i < 5; i++) {
      w.at(`problem ${i + 1}: click Add, type ${adds[i]}, Enter`);
      const eq = (await w.page.evaluate(() => [...document.querySelectorAll('.lb-eqblock .lb-stack > *')][0]?.innerText ?? '')).replace(/\s+/g, ' ');
      if (!eq.replace(/ /g, '').includes(equations[i].replace(/ /g, ''))) throw new Error(`problem ${i + 1} should be ${equations[i]} but the screen shows "${eq}"`);
      await w.click(`${act('choose')}[data-move="add"]`);
      await w.type(adds[i]); await w.enter();
      w.at(`problem ${i + 1}: type ${answers[i]}, Enter five times`);
      await w.type(answers[i]); await w.enter(5);
    }
    w.at('after the fifth problem');
    await w.see('Level 2 complete!');
    await w.shot('f-no-0-1-minus1');
  },

  async 'f-seesaw-beside-work'(w) {
    await w.start();
    w.at("I'm stuck once"); await w.stuck();
    await w.see('Look at the +8 next to x');
    w.at("I'm stuck a second time"); await w.stuck();
    await w.see('Build the equation');
    for (const height of [768, 614]) {                // 614 is what 125% zoom does to a 768-tall window; the window is resized in place
      w.at(`look at the layout at ${height} tall`);
      await w.page.setViewportSize({ width: 1366, height });
      await wait(w.page, 700);
      const work = await w.box('.sv-solve');
      const board = await w.box('.ab-boardwrap');
      const answer = await w.box('[data-fk="answer"]');
      if (!(work[2] <= board[0])) throw new Error(`the seesaw covers the work at ${height} tall: work ${work}, seesaw ${board}`);
      if (answer[3] > height || board[3] > height) throw new Error(`the seesaw or x = runs off the bottom at ${height} tall: ${board}, ${answer}`);
      const overlap = answer[0] < board[2] && answer[2] > board[0] && answer[1] < board[3] && answer[3] > board[1];
      if (overlap) throw new Error(`the seesaw covers x = at ${height} tall`);
      await w.shot(`f-seesaw-beside-work-${height}`);
    }
  },

  async 'f-divide-hint-after-undo'(w) {
    await w.start();
    await w.see('DIVIDE IT · Level 2', '5', '−15');
    w.at('type 4, Check'); await w.click(act('focus')); await w.type(4); await w.enter();
    w.at('drag the 4 onto x'); await w.drag();
    w.at('Next twice'); await w.click(act('nextLine')); await w.click(act('nextLine'));
    await w.lateLayer();
    await w.see('When x = 4, the equation is not balanced.');
    w.at('Undo'); await w.click(act('undo')); await wait(w.page, 800);
    await w.see('To get one x, divide both sides by 5 (that is, multiply by ⅕): one of the 5 x boxes is ⅕.', 'Got it');
    if (!(await w.page.locator('.spot-move[data-mopt="div"]').count())) throw new Error('the Divide option should be lit');
    if (!(await w.page.locator('.lx-ghost.is-preview .is-division').count())) throw new Error('Divide’s preview should be under the equation');
    await w.shot('f-divide-hint-after-undo');
  },

  async 'f-seesaw-wrong-move'(w) {
    await w.start();
    await w.see('x', '8', '−4');
    w.at("I'm stuck twice"); await w.stuck(2); await w.see('Which number would cancel the +8?');
    w.at('type −3, Go'); await w.type('-3'); await w.click(act('go'));
    await w.see('Look at the highlighted 8 and −3. Is this a Party or a Battle?');
    w.at('Battle!'); await w.click(`${act('kind')}[data-value="battle"]`);
    w.at('Next'); await w.click(act('crossNext'));
    await w.see('Battle! 8 and −3 make 5. Look at the highlighted −4 and −3.');
    w.at('Party!'); await w.click(`${act('kind')}[data-value="party"]`);
    await w.lateLayer();
    await w.see('Battle! 8 and −3: 3 pairs cancel (crossed off), but 5 is still beside x. Press Undo.', 'still here');
    await w.shot('f-seesaw-wrong-move');
    w.at('Undo'); await w.click(act('undo')); await wait(w.page, 800);
    await w.see('Look at the +8 next to x.');
  },

  async 'f-cross-off-at-x-alone'(w) {
    await w.start();
    await w.see('x', '5', '−3');
    w.at('Add, type 5, Enter'); await w.click(`${act('choose')}[data-move="add"]`); await w.type(5); await w.enter();
    await w.see('x = −3 + 5', 'x is alone. What is it? Type it.');
    w.at("I'm stuck"); await w.stuck(); await w.see('−3 + 5: party or battle?');
    w.at("I'm stuck again"); await w.stuck(); await w.see('Here are the two numbers as counters.', 'Party or Battle?');
    w.at('Battle!'); await w.click(`${act('cntChoose')}[data-value="battle"]`);
    await w.see('Cross off the pairs: tap a counter, or a whole box.');
    const before = await w.page.locator(act('counter')).count();
    w.at('tap one − counter'); await w.click(`${act('counter')}[data-zone="0"]`);
    const after = await w.page.locator(act('counter')).count();
    if (after !== before - 2) throw new Error(`tapping a counter should cross off two (a pair): ${before} then ${after}`);
    await w.shot('f-cross-off-one-pair');
    w.at('tap inside the + box'); const b = await w.page.locator(`${act('cntBox')}[data-box="1"]`).first().boundingBox();
    await w.page.mouse.click(b.x + b.width / 2, b.y + 8); await wait(w.page, 300);
    await w.see('Count who is left. Type it in x =.');
    const crossed = await w.page.locator('svg line.slash').count();
    if (crossed < 6) throw new Error(`the crossed-off counters should stay on the screen with a line through them (found ${crossed} lines, expected 6)`);
    w.at('type 2, Enter'); await w.type(2); await w.enter();
    await w.see('Let’s check that x = 2 is the solution.');
    await w.shot('f-cross-off-at-x-alone');
  },

  // ---- Build H ----
  async 'h-not-balanced-add'(w) {
    await w.start();
    await w.see('ADD TO BOTH SIDES · Level 3', 'x', '8', '−4');
    w.at('type −4, Enter'); await w.click(act('focus')); await w.type('-4'); await w.enter();
    w.at('drag the −4 onto x'); await w.drag();
    await w.see('(−4) + 8 = −4');
    const blue = await w.page.evaluate(() => ({ value: [...document.querySelectorAll('.sv-checklist .sv-line2 .is-blue')].map((e) => getComputedStyle(e).color), x: getComputedStyle(document.querySelector('.is-plugrow .lb-x')).color }));
    if (!blue.value.length || blue.value.some((c) => c !== blue.x)) throw new Error(`the dropped-in value should be the blue of the x (${blue.x}) but is ${blue.value}`);
    w.at('Next twice'); await w.click(act('nextLine')); await w.click(act('nextLine')); await w.lateLayer();
    await w.see('4 = −4', '✗ Not balanced', 'When x = −4, the equation is not balanced.');
    await w.lit('.sv-checklist .sv-checkrow:not(.sv-mark)', 2);          // the last line, 4 = −4 (under the equation and the line with the value)
    await w.lit('.sv-checklist .sv-mark');
    await w.both('h-not-balanced-add');
  },

  async 'h-not-balanced-divide'(w) {
    await w.start();
    await w.see('DIVIDE IT · Level 2', '5', '−15');
    w.at('type 4, Enter'); await w.click(act('focus')); await w.type(4); await w.enter();
    w.at('drag the 4 onto x'); await w.drag();
    await w.see('5 × 4 = −15');
    const blue = await w.page.evaluate(() => ({ value: [...document.querySelectorAll('.sv-checklist .sv-line2 .is-blue')].map((e) => getComputedStyle(e).color), x: getComputedStyle(document.querySelector('.is-plugrow .lb-x')).color }));
    if (!blue.value.length || blue.value.some((c) => c !== blue.x)) throw new Error(`the dropped-in value should be the blue of the x (${blue.x}) but is ${blue.value}`);
    w.at('Next twice'); await w.click(act('nextLine')); await w.click(act('nextLine')); await w.lateLayer();
    await w.see('20 = −15', '✗ Not balanced', 'When x = 4, the equation is not balanced.');
    await w.lit('.sv-checklist .sv-checkrow:not(.sv-mark)', 2);
    await w.lit('.sv-checklist .sv-mark');
    await w.both('h-not-balanced-divide');
  },

  async 'h-ghost-hint'(w) {
    await w.start();
    w.at('type −4, Enter'); await w.click(act('focus')); await w.type('-4'); await w.enter();
    const t0 = Date.now(); let at = null;
    while (Date.now() - t0 < 7000) { if (await w.page.locator('.sv-hintghost').count()) { at = Date.now() - t0; break; } await wait(w.page, 100); }
    if (at === null) throw new Error('no faint number started moving');
    if (at < 2000 || at > 3600) throw new Error(`the faint number should start after about 2.5 seconds, not ${(at / 1000).toFixed(1)}`);
    await wait(w.page, 800); await w.shot('h-ghost-hint');                    // (a moment later, so the faint number is on its way)
    w.at('click the x (it must not take the number)'); await w.page.locator('[data-x][data-action="placeValue"]').first().click({ force: true }); await wait(w.page, 300);
    if (!(await w.page.locator('[data-chip]').count())) throw new Error('a click on x should not have put the number in');
    w.at('drag it in'); await w.drag();
    await w.see('(−4) + 8 = −4');
  },

  async 'h-type-x-numbers'(w) {
    await w.start();
    await w.see('x', '5', '−3');
    w.at('Add, type 5, Enter'); await w.add(5); await w.see('x = −3 + 5');
    w.at("I'm stuck"); await w.stuck(); await w.see('−3 + 5: party or battle?');
    w.at('Battle!'); await w.click(`${act('kind')}[data-value="battle"]`); await wait(w.page, 500);
    await w.see('Yes, a battle: the bigger team wins. Now type x.');
    await w.lit('.lx-live .lx-tok.is-hint', 0);
    await w.lit('.lx-live .lx-tok.is-hint', 1);
    await w.both('h-type-x-numbers');
  },

  async 'h-drag-preview'(w) {
    await w.start(); await w.see('x', '8', '11');
    const tokens = await w.page.locator('.lx-live .lx-tok').evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { t: e.innerText.replace(/\s+/g, ''), x: r.x + r.width / 2, y: r.y + r.height / 2, side: e.dataset.side }; }));
    const eight = tokens.find((t) => t.t.includes('8')); const x = tokens.find((t) => t.t === 'x'); const eleven = tokens.find((t) => t.t === '11');
    const m = w.page.mouse;
    w.at('hold the +8 and drag it left of the x'); await m.move(eight.x, eight.y); await m.down(); await m.move(eight.x + 10, eight.y + 10, { steps: 3 }); await m.move(x.x - 40, x.y, { steps: 10 }); await wait(w.page, 350);
    const shown = () => w.page.evaluate(() => [...document.querySelectorAll('.lx-live .lx-tok.is-shadow, .lx-live .lx-tok.is-lifted')].map((e) => ({ text: e.innerText.replace(/\s+/g, ''), color: getComputedStyle(e.querySelector('.lx-body') ?? e).color, side: e.closest('.lb-side')?.dataset.side })));
    let g = await shown();
    if (!g.length || g.some((e) => /rgba\(0, 0, 0, 0\)|transparent/.test(e.color) || !e.text.includes('8'))) throw new Error(`left of x, the grey 8 should be drawn in place (it was an empty dashed box): ${JSON.stringify(g)}`);
    if (g[0].side !== 'left') throw new Error('the preview should be on the left side');
    await w.shot('h-drag-preview-left');
    w.at('drag it across the ='); await m.move(eleven.x + 70, eleven.y, { steps: 12 }); await wait(w.page, 350);
    g = await shown();
    if (!g.some((e) => e.side === 'right' && e.text.includes('8') && !/rgba\(0, 0, 0, 0\)/.test(e.color))) throw new Error(`on the right, a grey −8 should sit where it would land: ${JSON.stringify(g)}`);
    await w.shot('h-drag-preview-right');
    w.at('drag it back and let go'); await m.move(eight.x, eight.y + 25, { steps: 12 }); await wait(w.page, 350);
    g = await shown();
    if (!g.length || g.some((e) => /rgba\(0, 0, 0, 0\)/.test(e.color))) throw new Error(`back where it started, the grey 8 should still be drawn: ${JSON.stringify(g)}`);
    await m.up(); await wait(w.page, 400);
    await w.see('x + 8 = 11');
    await w.both('h-drag-preview');
  },


  async 'h-enter-go'(w) {
    await w.start(); await w.see('x', '8', '11');
    w.at("I'm stuck once"); await w.stuck(); await w.see('What would we add to both sides to eliminate it?');
    w.at('type −8, Enter'); await w.type('-8'); await w.enter();
    await w.see('x + 8 − 8 = 11 − 8');
    const first = await w.text();
    w.at('Enter again'); await w.enter();
    if ((await w.text()) !== first) throw new Error('a second Enter should do nothing');
    await w.notSee('Build the equation', 'Which number would cancel');
    await w.both('h-enter-go');
  },

  async 'h-counters-words'(w) {
    await w.start(); await w.see('x', '5', '−3');
    w.at('Add, type 5, Enter'); await w.add(5);
    w.at("I'm stuck twice"); await w.stuck(2);
    await w.see('Here are the two numbers as counters.', 'Party or Battle?');
    await w.notSee('Nice drawing');
    await w.both('h-counters-words');
  },

  async 'h-combine-wrong'(w) {
    await w.start(); await w.see('x', '8', '−4');
    w.at('Add, type −8, Go'); await w.click(`${act('choose')}[data-move="add"]`); await w.type('-8'); await w.click(act('go'));
    await w.see('x = −4 − 8');
    const tokens = await w.page.locator('.lx-live .lx-tok').evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, side: e.dataset.side }; }));
    const right = tokens.filter((t) => t.side === 'right'); const m = w.page.mouse;
    w.at('drag the −4 onto the −8'); await m.move(right[0].x, right[0].y); await m.down(); await m.move(right[0].x + 8, right[0].y + 8, { steps: 3 }); await m.move(right[1].x, right[1].y, { steps: 10 }); await wait(w.page, 300); await m.up(); await wait(w.page, 500);
    await w.see('What is −4 − 8?');
    w.at('type 5, Enter'); await w.type(5); await w.enter(); await wait(w.page, 2500);
    await w.see('−4 − 8 is not 5. Press Undo and try again.', 'check this');
    await w.lit('.lx-live .lx-tok.is-pair', 0); await w.lit('.lx-live .lx-tok.is-pair', 1);
    await w.both('h-combine-wrong');
  },

  async 'h-seesaw-mirrors-check'(w) {
    await w.start(); await w.see('x', '8', '−4');
    w.at("I'm stuck twice"); await w.stuck(2);
    w.at('type −8, Go'); await w.type('-8'); await w.click(act('go'));
    w.at('Battle!, Next, Party!'); await w.click(`${act('kind')}[data-value="battle"]`); await w.click(act('crossNext')); await w.click(`${act('kind')}[data-value="party"]`);
    w.at('type −12, Enter'); await w.type('-12'); await w.enter();
    await w.see('Let’s check that x = −12 is the solution.');
    const xBox = await w.page.locator('.ab-boardwrap .ab-x[data-action="placeValue"]').count();
    if (!xBox) throw new Error('the seesaw should show the original equation with an empty x box to drop the number on');
    if ((await w.page.locator('.ab-boardwrap .ab-group, .ab-boardwrap .ab-token').count()) !== 2) throw new Error('the seesaw should show the original equation x + 8 = −4: the x box, 8 counters and −4');
    await w.shot('h-seesaw-mirrors-check-0');
    w.at('drag the −12 onto the x box on the seesaw'); await w.dragTo('.ab-boardwrap .ab-x[data-action="placeValue"]');
    const counters = (sel) => w.page.locator(`.ab-boardwrap ${sel} .bm-mark`).count();
    if ((await counters('.ab-group.is-xgroup')) !== 12) throw new Error('the x box should become 12 minus counters in a box with a small x above');
    if ((await w.page.locator('.ab-boardwrap .ab-xlabel').textContent()) !== 'x') throw new Error('there should be a small x above the box');
    if ((await counters('.ab-group')) !== 12 + 8 + 4) throw new Error('the seesaw should show 12 minus counters, 8 plus and 4 minus');
    await w.shot('h-seesaw-mirrors-check-1');
    w.at('Next'); await w.click(act('nextLine'));
    if ((await counters('.ab-group')) !== 4 + 4) throw new Error('after the next line the seesaw should show 4 minus counters on each side');
    w.at('Next'); await w.click(act('nextLine'));
    await w.see('✓ Balanced');
    if (!(await w.page.locator('.ab-readout.is-good').count())) throw new Error('the seesaw should say Balanced');
    const angle = await w.page.locator('.ab-rot').first().evaluate((e) => e.style.transform);
    if (!/rotate\(0deg\)/.test(angle)) throw new Error(`the beam should be level at the end: ${angle}`);
    await w.both('h-seesaw-mirrors-check');
  },

  async 'h-seesaw-mirrors-big'(w) {
    await w.start(); await w.see('x', '2', '−15');
    w.at("I'm stuck twice"); await w.stuck(2);
    w.at('type 2, Go'); await w.type(2); await w.click(act('go'));
    w.at('Battle!, Next'); await w.click(`${act('kind')}[data-value="battle"]`); await w.click(act('crossNext'));
    w.at('Battle! for −15 and 2'); await w.click(`${act('kind')}[data-value="battle"]`);
    w.at('type −13, Enter'); await w.type('-13'); await w.enter();
    await w.see('Let’s check that x = −13 is the solution.');
    w.at('drag the −13 onto the x box on the seesaw'); await w.dragTo('.ab-boardwrap .ab-x[data-action="placeValue"]');
    if ((await w.page.locator('.ab-boardwrap .ab-token.is-xgroup').count()) !== 1) throw new Error('−13 should be one labelled box with a small x above it, not counters');
    if (!/−13/.test(await w.page.locator('.ab-boardwrap .ab-token.is-xgroup').textContent())) throw new Error('the box should say −13');
    await w.shot('h-seesaw-mirrors-big-1');
    w.at('Next, Next'); await w.click(act('nextLine')); await w.click(act('nextLine'));
    await w.see('✓ Balanced');
    if (!(await w.page.locator('.ab-readout.is-good').count())) throw new Error('the seesaw should say Balanced');
    await w.both('h-seesaw-mirrors-big');
  },

  async 'student-add'(w) {
    await w.start();
    await w.see('x', '8', '−4');
    w.at('mistake 1: touch nothing for 11 seconds'); await wait(w.page, 11000);
    if (!(await w.page.locator('.lx-help.is-idle').count())) throw new Error('I’m stuck should be flashing after 10 seconds');
    await w.shot('student-add-idle');
    w.at('mistake 2: type −4, Enter'); await w.click(act('focus')); await w.type('-4'); await w.enter();
    w.at('mistake 2: drag the −4 onto x'); await w.drag();
    w.at('mistake 2: Next twice'); await w.click(act('nextLine')); await w.click(act('nextLine'));
    await w.lateLayer();
    await w.see('(−4) + 8 = −4', 'When x = −4, the equation is not balanced.');
    w.at('mistake 2: Undo'); await w.click(act('undo')); await wait(w.page, 800);
    await w.see('Look at the +8 next to x.', 'Got it');
    w.at('mistake 2: Got it'); await w.click(act('spotDismiss'));
    w.at('mistake 3: type 8, Go'); await w.type(8); await w.click(act('go')); await w.lateLayer();
    await w.see('got bigger', '+8 + +8 did not eliminate the term.');
    await w.shot('student-add-worse');
    w.at('mistake 3: Undo, Got it'); await w.click(act('undo')); await wait(w.page, 800);
    await w.see('Look at the +8 next to x.');
    await w.click(act('spotDismiss'));
    w.at('mistake 4: type −5, Go'); await w.type('-5'); await w.click(act('go')); await w.lateLayer();
    await w.see('still here', '+8 was only partially canceled by the −5 you added.');
    await w.shot('student-add-half');
    w.at('mistake 4: Undo, Got it'); await w.click(act('undo')); await wait(w.page, 800); await w.click(act('spotDismiss'));
    w.at('mistake 5: I’m stuck, four times');
    const says = [];
    for (let i = 0; i < 4; i++) { await w.stuck(); says.push(await w.text()); }
    const clues = ['Look at the +8 next to x.', 'Which number would cancel the +8?', 'Choose "Add ___ to both sides" and pick an amount.', '−8 cancels the +8. Add it to both sides yourself.'];
    clues.forEach((c, i) => { if (!says[i].includes(c)) throw new Error(`press ${i + 1} of I’m stuck should say "${c}"`); });
    await w.shot('student-add-stuck');
    // mistake 6 (Build N): a mistake, Undo, then type in the blank, from a fresh start
    w.at('mistake 6: start again'); await w.start();
    w.at('mistake 6: Add 8, Go'); await w.add(8); await w.lateLayer(); await w.see('did not eliminate the term');
    w.at('mistake 6: Undo, type −8'); await w.click(act('undo')); await wait(w.page, 800); await w.type('-8');
    await w.typedIn('[data-fk="blank"]', '−8');
    w.at('mistake 6: Go'); await w.click(act('go')); await wait(w.page, 400); await w.see('x = −4 − 8'); await w.shot('student-add-typed-after-undo');
    w.at('wait 3 seconds and watch the nudge'); await w.idle(3500); await w.noNudge();
    w.at('last: type 1 into x = and take it back'); await w.steady(async () => { await w.click(act('focus')); await w.type(1); await w.page.keyboard.press('Backspace'); });
  },

  async 'student-divide'(w) {
    await w.start();
    await w.see('DIVIDE IT · Level 2', '5', '−15');
    w.at('mistake 1: touch nothing for 11 seconds'); await wait(w.page, 11000);
    if (!(await w.page.locator('.lx-help.is-idle').count())) throw new Error('I’m stuck should be flashing after 10 seconds');
    await w.shot('student-divide-idle');
    w.at('mistake 2: type −15, Enter'); await w.click(act('focus')); await w.type('-15'); await w.enter();
    w.at('mistake 2: drag the −15 onto x'); await w.drag();
    w.at('mistake 2: Next twice'); await w.click(act('nextLine')); await w.click(act('nextLine'));
    await w.lateLayer();
    await w.see('5 × (−15) = −15', '−75 = −15', 'When x = −15, the equation is not balanced.');
    await w.shot('student-divide-wrong-value');
    w.at('mistake 2: Undo, Got it'); await w.click(act('undo')); await wait(w.page, 800); await w.click(act('spotDismiss'));
    w.at('mistake 3: Multiply, the first option, 5, Go');
    await w.click(act('multOpen')); await w.click(`.mo-opt${act('multPick')}[data-kind="whole"]`); await w.type(5); await w.click(act('go'));
    await w.see('5 × (5x) makes 25x: still not one x. Try dividing both sides.');                 // (live but explained again: Build P)
    await w.shot('student-divide-whole');
    w.at('mistake 4: Divide, −1, Go');
    await w.click(DIV); await w.page.keyboard.press('-'); await w.type(1); await w.click(act('go'));
    await w.see('−1 × (5x) makes −5x: the sign changes, but there are still 5 x’s. Try dividing both sides.');
    w.at('mistake 5: Multiply, Divide, 2, Go');
    await w.click(DIV); await w.type(2); await w.click(act('go'));
    await w.lateLayer();
    await w.see('doesn’t split', '5 boxes can\'t make 2 equal groups');
    await w.shot('student-divide-half');
    w.at('mistake 5: Undo, Got it'); await w.click(act('undo')); await wait(w.page, 800);
    await w.see('We want only one of the five x boxes.', '½', '⅓', '¼', '⅕', '⅙');
    await w.click(act('spotDismiss'));
    w.at('mistake 6: I’m stuck, twice');
    await w.stuck(); const one = await w.text();
    await w.stuck(); const two = await w.text();
    if (!one.includes('5 boxes and 15 counters.')) throw new Error(`press 1 of I’m stuck should talk about the 5 boxes and 15 counters. On screen: ${one.slice(0, 300)}`);
    if (!two.includes('take ⅕ of both sides')) throw new Error(`press 2 of I’m stuck should say to take ⅕ of both sides. On screen: ${two.slice(0, 300)}`);
    await w.shot('student-divide-stuck');
    // mistake 7 (Build N): a mistake, Undo, then type in the blank, from a fresh start
    w.at('mistake 7: start again'); await w.start();
    w.at('mistake 7: type 3, check it'); await w.click(act('focus')); await w.type(3); await w.enter(); await w.drag();
    await w.click(act('nextLine')); await w.click(act('nextLine')); await w.lateLayer(); await w.see('not balanced');
    w.at('mistake 7: Undo, type 5'); await w.click(act('undo')); await wait(w.page, 800); await w.type(5);
    await w.typedIn(DIV_BOX, '5'); await w.see('Same as multiplying by ⅕.');
    w.at('mistake 7: Go'); await w.click(act('go')); await wait(w.page, 400); await w.see('(5x) 5 = (−15) 5'); await w.shot('student-divide-typed-after-undo');
    w.at('wait 3 seconds and watch the nudge'); await w.idle(3500); await w.noNudge();
    w.at('last: type 1 into x = and take it back'); await w.steady(async () => { await w.click(act('focus')); await w.type(1); await w.page.keyboard.press('Backspace'); });
  },

  // ---- Build I ----
  async 'i-check-shadow'(w) {
    await w.start(); await w.see('x', '8', '−4');
    w.at('type −12, Enter'); await w.click(act('focus')); await w.type('-12'); await w.enter();
    w.at('press and hold the −12, move toward x'); await w.hold();
    const shown = await w.page.evaluate(() => { const e = document.querySelector('.sv-shadowline'); const r = e?.getBoundingClientRect(); const c = document.querySelector('.sv-check')?.getBoundingClientRect(); return e ? { text: e.innerText.replace(/\s+/g, ' '), opacity: Number(getComputedStyle(e).opacity), inside: r.left >= c.left - 2 && r.top >= c.top - 2 } : null; });
    if (!shown || shown.text.replace(/ /g, '') !== 'x+8=−4' || shown.opacity > 0.6 || !shown.inside) throw new Error(`a faint copy of x + 8 = −4 should be in the space on the right: ${JSON.stringify(shown)}`);
    await w.both('i-check-shadow');
    w.at('let go on an empty part of the page'); await w.letGo(300, 330); await wait(w.page, 700);
    if (await w.page.locator('.sv-shadowline').count()) throw new Error('the faint copy should slide back and go');
    if (!(await w.page.locator('[data-chip]').count())) throw new Error('a drop off the x should change nothing: the −12 should still be waiting');
    w.at('drag the −12 onto x'); await w.drag();
    await w.see('(−12) + 8 = −4');
    const lines = await w.page.evaluate(() => [...document.querySelectorAll('.sv-checklist .sv-checkrow')].map((e) => e.innerText.replace(/\s+/g, '')));
    if (lines[0] !== 'x+8=−4' || lines[1] !== '(−12)+8=−4') throw new Error(`the check should start x + 8 = −4, then (−12) + 8 = −4: ${lines}`);
  },

  async 'i-check-pairs-add'(w) {
    await w.start();
    w.at('type −12, Enter, drag it onto x'); await w.click(act('focus')); await w.type('-12'); await w.enter(); await w.drag(); await wait(w.page, 300);
    await w.pairs('x+8=−4', '(−12)+8=−4');
    await w.both('i-check-pairs-add');
    w.at('Next twice'); await w.click(act('nextLine')); await w.click(act('nextLine'));
    await w.see('−4 = −4', '✓ Balanced');
  },

  async 'i-check-pairs-divide'(w) {
    await w.start(); await w.see('DIVIDE IT · Level 2', '5', '−15');
    w.at('type −3, Enter, drag it onto x'); await w.click(act('focus')); await w.type('-3'); await w.enter(); await w.drag(); await wait(w.page, 300);
    await w.pairs('5x=−15', '5×(−3)=−15');
    await w.both('i-check-pairs-divide');
    w.at('Next twice'); await w.click(act('nextLine')); await w.click(act('nextLine'));
    await w.see('−15 = −15', '✓ Balanced');
  },

  async 'i-big-battle'(w) {
    await w.start(); await w.see('x', '2', '−15');
    w.at('Add, type 2, Enter'); await w.add(2); await w.see('x = −15 + 2');
    w.at("I'm stuck, Battle!"); await w.stuck(); await w.click(`${act('kind')}[data-value="battle"]`); await wait(w.page, 500);
    await w.see('Who won? −15 or 2?'); await w.notSee('Subtract');
    if (await w.page.locator('.spot-box.is-bubble').count() !== 1) throw new Error('only one box should be there before who won is answered');
    await w.lit('.lx-live .lx-tok.is-hint', 0); await w.lit('.lx-live .lx-tok.is-hint', 1);
    await w.belowNumbers();
    await w.shot('i-big-battle-0');
    const first = await w.box('.spot-box.is-bubble[data-bubble="who"]');
    w.at('click +'); await w.click(`${act('whoWon')}[data-value="+"]`); await w.see('Not that one'); await w.notSee('Subtract');
    w.at('click −'); await w.click(`${act('whoWon')}[data-value="-"]`); await wait(w.page, 400);
    await w.see('Subtract 15 − 2 to find how many of the −15 are left.');
    const [one, two] = [await w.box('.spot-box.is-bubble[data-bubble="who"]'), await w.box('.spot-box.is-bubble[data-bubble="op"]')];
    if (JSON.stringify(one) !== JSON.stringify(first)) throw new Error(`the first box should stay where it was: ${first} then ${one}`);
    if (two[0] < one[2]) throw new Error('the second box should appear to the right of the first');
    if (!(await w.page.locator('.spot-box.is-bubble[data-bubble="who"] .is-picked[data-value="-"]').count())) throw new Error('the first box should still show the − picked');
    const typed = await w.page.locator('[data-fk="answer"]').innerText();
    if (typed.trim() !== '') throw new Error(`nothing should be written in x = for the student: "${typed}"`);
    await w.lit('.lx-live .lx-tok.is-hint', 0);
    await w.both('i-big-battle');
    w.at('type −13, Enter'); await w.type('-13'); await w.enter();
    await w.see('Let’s check that x = −13 is the solution.');
  },

  async 'i-big-party'(w) {
    await w.start(); await w.see('x', '13', '−2');
    w.at('Add, type −13, Enter'); await w.add(-13); await w.see('x = −2 − 13');
    w.at("I'm stuck, Party!"); await w.stuck(); await w.click(`${act('kind')}[data-value="party"]`); await wait(w.page, 500);
    await w.see('A party of what? Pick the sign.'); await w.notSee('Add 2 + 13', 'Who won');
    await w.lit('.lx-live .lx-tok.is-hint', 0); await w.lit('.lx-live .lx-tok.is-hint', 1);
    await w.belowNumbers();
    await w.shot('i-big-party-0');
    w.at('click +'); await w.click(`${act('whoWon')}[data-value="+"]`); await w.see('Not that one. Look at the signs of −2 and −13.'); await w.notSee('Add 2 + 13');
    w.at('click −'); await w.click(`${act('whoWon')}[data-value="-"]`); await wait(w.page, 400);
    await w.see('Add 2 + 13 to find how many negatives.');
    if (!(await w.page.locator('.spot-box.is-bubble[data-bubble="who"] .is-picked[data-value="-"]').count())) throw new Error('the first box should still show the − picked');
    const typed = await w.page.locator('[data-fk="answer"]').innerText();
    if (typed.trim() !== '') throw new Error(`nothing should be written in x = for the student: "${typed}"`);
    await w.both('i-big-party');
    w.at('type −15, Enter'); await w.type('-15'); await w.enter();
    await w.see('Let’s check that x = −15 is the solution.');
  },

  async 'i-party-neg-sign'(w) {
    await w.start(); await w.see('x', '13', '−2');
    w.at('Add, type −13, Enter'); await w.add(-13); await w.see('x = −2 − 13');
    w.at('type 15, Enter, drag, Next twice, wait'); await w.click(act('focus')); await w.type(15); await w.enter(); await w.drag();
    await w.click(act('nextLine')); await w.click(act('nextLine')); await w.lateLayer();
    await w.see('When x = 15, the equation is not balanced.');
    w.at('Undo'); await w.click(act('undo')); await wait(w.page, 800);
    await w.see('−2 and −13 are both negatives. A party of negatives makes ___');
    await w.lit('.lx-live .lx-tok.is-hint', 0); await w.lit('.lx-live .lx-tok.is-hint', 1);
    await w.both('i-party-neg-sign');
    w.at('click +'); await w.click(`.spot-layer ${act('whoWon')}[data-value="+"]`); await wait(w.page, 300);
    await w.see('Look again: −2 and −13 are both negatives. A party of negatives makes ___');
    w.at('click −'); await w.click(`.spot-layer ${act('whoWon')}[data-value="-"]`); await wait(w.page, 300);
    await w.see('Now type x, and keep the sign.');
    await w.lit('[data-fk="answer"]');
    w.at('type −15, Enter, drag, Next twice'); await w.type('-15'); await w.enter(); await w.drag();
    await w.click(act('nextLine')); await w.click(act('nextLine'));
    await w.see('✓ Balanced');
  },

  // ---- Build J: Flip everything ----
  async 'j-level-1'(w) {
    await w.start(); await w.see('FLIP EVERYTHING · Level 1', '−x', '12');
    await w.both('j-level-1');
    w.at('click Add'); await w.click(`${act('greyMove')}[data-move="add"]`); await w.see('That move unlocks on a later card.');
    w.at('click Multiply, the whole number'); await w.click(act('multOpen')); await w.click(`.mo-opt${act('multPick')}[data-kind="whole"]`); await w.see('That move unlocks on a later card.');
    w.at('the fraction'); await w.click(`${act('multPick')}[data-kind="frac"]`); await w.see('That move unlocks on a later level.');
    w.at('Divide'); await w.click(DIV); await w.see('That move unlocks on a later level.');
    if (await w.page.locator('.mo-flyout [data-kind="flip"]').count()) throw new Error('there should be no −1 option (Build L)');
    if (!(await w.page.locator('[data-action="flipPick"]').count())) throw new Error('Flip everything should be its own button');
  },
  async 'j-level-2'(w) {
    await w.start(); await w.see('FLIP EVERYTHING · Level 2', '12', '−x');
    await w.both('j-level-2');
    w.at('flip, Go'); await w.flip(); await w.see('−(12) = x');
    w.at('type −12, check'); await w.solve(-12);
    await w.see('✓ Balanced');
  },
  async 'j-level-3'(w) {
    await w.start(); await w.see('FLIP EVERYTHING · Level 3', '−3x', '12');
    await w.both('j-level-3');
    w.at('flip, Go, Next'); await w.flip(); await w.see('3x = −12'); await w.click(act('foldNext'));
    w.at('⅓'); await w.divide(3); await w.see('x = (−12) 3');
    w.at('type −4, check'); await w.solve(-4); await w.see('✓ Balanced');
  },
  async 'j-level-4'(w) {
    await w.start(); await w.see('FLIP EVERYTHING · Level 4', '12', '−3x');
    await w.both('j-level-4');
    w.at('⅓ first'); await w.divide(3); await w.see('4 = −x');
    if (await w.page.locator('.lx-dot.is-red').count()) throw new Error('dividing first should not light anything red');
    w.at('Next, flip'); await w.click(act('foldNext')); await w.flip(); await w.see('−(4) = x');
    w.at('type −4, check'); await w.solve(-4); await w.see('✓ Balanced');
  },
  async 'j-level-5'(w) {
    await w.start(); await w.see('FLIP EVERYTHING · Level 5', '−3x', '36');
    await w.both('j-level-5');
    w.at('flip, Next, ⅓'); await w.flip(); await w.click(act('foldNext')); await w.divide(3); await w.see('x = (−36) 3');
    w.at('type −12, check'); await w.solve(-12); await w.see('✓ Balanced');
  },
  async 'j-helpful-flip'(w) {
    await w.start();
    w.at('point at the Flip button'); await w.page.locator('[data-action="flipPick"]').hover(); await wait(w.page, 400);
    await w.see('−1 × (−x) = −1 × (12)');
    w.at('click it, Go'); await w.flip();
    await w.see('x = −(12)'); await w.notSee('x = −12 ');
    const lights = await w.page.evaluate(() => ['noopp', 'solved'].map((k) => document.querySelector(`[data-light="${k}"]`)?.className));
    if (!lights.every((c) => /is-green/.test(c ?? ''))) throw new Error(`No opposite box and Solved for x should be green: ${lights}`);
    await w.both('j-helpful-flip');
  },
  async 'j-worse-flip'(w) {
    await w.start();
    w.at('flip, Go, Next'); await w.flip(); await w.click(act('foldNext')); await w.see('3x = −12');
    w.at('flip again, Go, wait'); await w.flip(); await w.lateLayer();
    await w.see('x has a minus', 'Flipping 3x = −12 made −3x = 12: now x has a minus. Press Undo.');
    await w.lit('.lb-rowwrap .lb-front', 1);                                     // the new −3x, lit (the first is the original)
    await w.both('j-worse-flip');
    w.at('Undo'); await w.click(act('undo')); await wait(w.page, 800);
    await w.see('To get one x, divide both sides by 3 (that is, multiply by ⅓): one of the 3 x boxes is ⅓.');
    if (!(await w.page.locator('.spot-move[data-mopt="div"]').count())) throw new Error('the Divide option should be lit');
  },
  async 'j-one-move'(w) {
    await w.start();
    w.at('Multiply, Divide, −3, Go'); await w.divide(-3);
    await w.see('(−3x) −3 = (12) −3', 'x = (12) −3');
    if (await w.page.locator('.lx-dot.is-red').count()) throw new Error('−⅓ in one move should not light anything red');
    await w.both('j-one-move');
    w.at('type −4, check'); await w.solve(-4); await w.see('✓ Balanced');
  },
  async 'j-typed-12'(w) {
    await w.start();
    w.at('type 12, Enter, drag, Next twice, wait'); await w.click(act('focus')); await w.type(12); await w.enter(); await w.drag();
    await w.see('−(12) = 12'); await w.click(act('nextLine')); await w.click(act('nextLine')); await w.lateLayer();
    await w.see('−12 = 12', 'When x = 12, the equation is not balanced.');
    w.at('Undo'); await w.click(act('undo')); await wait(w.page, 800);
    await w.see('−x = 12 means the opposite of x is 12, so x is not 12. Flip everything: multiply both sides by −1.', '−1 × (−x) = −1 × (12)');
    if (!(await w.page.locator('.spot-move[data-move="flip"]').count())) throw new Error('the Flip button should be lit');
    await w.both('j-typed-12');
  },
  async 'j-trade'(w) {
    await w.start();
    await w.see('This is the symmetric property: if a = b, then b = a.');
    await w.both('j-trade');
    w.at('Trade places, flip'); await w.click(`${act('choose')}[data-move="trade"]`); await w.see('−x = 12'); await w.flip(); await w.see('x = −(12)');
    w.at('type −12, check'); await w.solve(-12); await w.see('✓ Balanced');
  },
  async 'j-check-negx'(w) {
    await w.start();
    w.at('flip, type −12, drag'); await w.flip(); await w.click(act('focus')); await w.type(-12); await w.enter(); await w.drag(); await wait(w.page, 300);
    await w.pairs('−x=12', '−(−12)=12');
    await w.both('j-check-negx');
    w.at('Next twice'); await w.click(act('nextLine')); await w.click(act('nextLine')); await w.see('12 = 12', '✓ Balanced');
  },
  async 'j-forced'(w) {
    await w.start();
    w.at('type −12 at once, check'); await w.click(act('focus')); await w.type(-12); await w.enter(); await w.drag();
    await w.click(act('nextLine')); await w.click(act('nextLine')); await w.see('✓ Balanced');
    w.at('Next problem'); await w.click(act('next')); await wait(w.page, 800);
    await w.see('Your mental math is very strong.', '−x', '3');
    if (!(await w.page.locator('[data-action="flipPick"].is-ring').count())) throw new Error('the Flip button should be ringed');
    await w.both('j-forced');
  },
  async 'student-flip'(w) {
    await w.start();
    w.at('mistake 1: touch nothing for 11 seconds'); await wait(w.page, 11000);
    if (!(await w.page.locator('.lx-help.is-idle').count())) throw new Error('I’m stuck should be flashing after 10 seconds');
    w.at('mistake 2: type 12, check'); await w.click(act('focus')); await w.type(12); await w.enter(); await w.drag();
    await w.click(act('nextLine')); await w.click(act('nextLine')); await w.lateLayer();
    await w.see('−3 × 12 = 12', '−36 = 12', 'When x = 12, the equation is not balanced.');
    w.at('mistake 2: Undo'); await w.click(act('undo')); await wait(w.page, 800);
    await w.see('In −3x = 12 the minus belongs to x. Flip everything first: multiply both sides by −1.');
    await w.click(act('spotDismiss'));
    w.at('mistake 3: ½'); await w.divide(2); await w.lateLayer();
    await w.see('3 boxes can\'t make 2 equal groups');
    w.at('mistake 3: Undo, ⅓'); await w.click(act('undo')); await wait(w.page, 800);
    await w.see('We want only one of the three x boxes.');
    await w.click(`${act('take')}[data-n="3"]`); await wait(w.page, 400); await w.see('−x = 4');
    w.at('mistake 4: type 4, check, Undo'); await w.click(act('focus')); await w.type(4); await w.enter(); await w.drag();
    await w.click(act('nextLine')); await w.click(act('nextLine')); await w.lateLayer();
    await w.click(act('undo')); await wait(w.page, 800);
    await w.see('−x = 4 means the opposite of x is 4, so x is not 4.');
    await w.click(act('spotDismiss'));
    w.at('mistake 5: I’m stuck twice'); await w.stuck(); const one = await w.text(); await w.stuck(); const two = await w.text();
    for (const t of [one, two]) if (!t.includes('−x means x has a minus. To get rid of it, multiply both sides by −1: Flip everything.')) throw new Error(`I’m stuck should give the reminder: ${t.slice(0, 300)}`);
    await w.shot('student-flip-stuck');
    // mistake 6 (Build N): a mistake, Undo, then type in the blank, from a fresh start
    w.at('mistake 6: start again'); await w.start();
    w.at('mistake 6: type 12, check'); await w.click(act('focus')); await w.type(12); await w.enter(); await w.drag();
    await w.click(act('nextLine')); await w.click(act('nextLine')); await w.lateLayer(); await w.see('not balanced');
    w.at('mistake 6: Undo, Got it'); await w.click(act('undo')); await wait(w.page, 800); await w.click(act('spotDismiss'));
    w.at('mistake 6: Multiply, Divide, click the box, −3'); await w.click(DIV);
    await w.click(DIV_BOX); await w.page.keyboard.press('-'); await w.type(3); await w.typedIn(DIV_BOX, '−3');
    w.at('mistake 6: Go'); await w.click(act('go')); await wait(w.page, 400); await w.see('(−3x) −3 = (12) −3'); await w.shot('student-flip-typed-after-undo');
    w.at('wait 3 seconds and watch the nudge'); await w.idle(3500); await w.noNudge();
    w.at('last: type 1 into x = and take it back'); await w.steady(async () => { await w.click(act('focus')); await w.type(1); await w.page.keyboard.press('Backspace'); });
  },
  // ---- Build N: typing after a mistake ----
  async 'n-type-after-mistake'(w) {
    await w.start(); await w.see('DIVIDE IT · Level 3', '3x = 6');
    w.at('type 9, check it'); await w.click(act('focus')); await w.type(9); await w.enter(); await w.drag();
    await w.click(act('nextLine')); await w.click(act('nextLine')); await w.lateLayer(); await w.see('When x = 9, the equation is not balanced.');
    w.at('Undo'); await w.click(act('undo')); await wait(w.page, 800);
    await w.see('divide both sides by 3');
    if (!(await w.page.locator(DIV_BOX).count())) throw new Error('the hint should show the Divide blank');
    await w.shot('n-hint-after-undo');
    w.at('type 3'); await w.type(3); await w.typedIn(DIV_BOX, '3'); await w.see('Same as multiplying by ⅓.');
    await w.both('n-type-after-mistake');
    w.at('click the box, Backspace, 3'); await w.click(DIV_BOX); await w.page.keyboard.press('Backspace'); await wait(w.page, 200); await w.type(3); await w.typedIn(DIV_BOX, '3');
    w.at('Go'); await w.click(act('go')); await wait(w.page, 400); await w.see('(3x) 3 = (6) 3', 'x = (6) 3');
  },
  async 'n-type-after-right'(w) {
    await w.start(); await w.see('DIVIDE IT · Level 3', '3x = 6');
    w.at('type 2, check it'); await w.click(act('focus')); await w.type(2); await w.enter(); await w.drag();
    await w.click(act('nextLine')); await w.click(act('nextLine')); await w.click(act('next')); await wait(w.page, 600);
    await w.see('2x = 30', 'Your mental math is very strong.');
    w.at('Next'); await w.click(act('introNext'));
    w.at('Multiply, Divide, 2'); await w.click(DIV); await w.type(2);
    await w.typedIn(DIV_BOX, '2'); await w.see('Same as multiplying by ½.');
    await w.both('n-type-after-right');
    w.at('Go'); await w.click(act('go')); await wait(w.page, 400); await w.see('(2x) 2 = (30) 2', 'x = (30) 2');
  },
};

// ---- the page itself: the section, the ticks, the Checked group ----------------------------------------------------------------------
async function checkThePage(page) {
  const url = new URL('test-links.html', BASE).href;
  const fail = (m) => { throw new Error(m); };
  const n = checks.length;
  const count = (sel) => page.locator(sel).count();
  await page.goto(url);
  await page.evaluate(() => localStorage.removeItem('mat.checks.v1'));
  await page.reload();
  await page.waitForSelector('.check');
  const first = await page.evaluate(() => document.querySelector('main h2')?.textContent);
  if (first !== 'Features to check') fail(`the first section should be "Features to check", not "${first}"`);
  if ((await count('#features .check')) !== n) fail(`expected ${n} items on the page`);
  if ((await count('#features details.checked-group')) !== 0) fail('the Checked group should not show while nothing is ticked');
  for (const c of checks) {
    const href = await page.locator(`#features .check:has(#tick-${c.id}) a.go`).getAttribute('href');
    if (!/nosignin=1/.test(href) || !/(pack|diag)=/.test(href) || !/seed=/.test(href)) fail(`the button for ${c.id} should carry the card (or the quiz), seed and sign-in skip: ${href}`);
    if (await count(`#features .check:has(#tick-${c.id}) ol.steps li`) !== c.steps.length) fail(`${c.id}: steps missing`);
  }
  // tick one: it drops into the collapsed Checked group
  await page.locator(`#tick-${checks[0].id}`).check();
  if ((await count('#features > .check')) !== n - 1) fail('a ticked item should leave the open list');
  if (await page.locator('details.checked-group').getAttribute('open') !== null) fail('the Checked group should be collapsed');
  const summary = await page.locator('details.checked-group summary').textContent();
  if (summary !== 'Checked (1)') fail(`the group should say "Checked (1)", not "${summary}"`);
  // ticks persist through a reload
  await page.reload();
  await page.waitForSelector('.check');
  if ((await count('#features > .check')) !== n - 1 || (await count('details.checked-group .check')) !== 1) fail('the tick should still be there after a reload');
  // Reset my progress leaves the ticks alone
  await page.locator('#reset').click();
  await page.reload();
  await page.waitForSelector('.check');
  if ((await count('details.checked-group .check')) !== 1) fail('Reset my progress should not clear ticks');
  // untick: it goes back to the open list
  await page.locator('details.checked-group summary').click();
  await page.locator(`#tick-${checks[0].id}`).uncheck();
  if ((await count('#features > .check')) !== n || (await count('details.checked-group')) !== 0) fail('an unticked item should go back to the open list');
  // two ticks, then Clear all ticks
  await page.locator(`#tick-${checks[1].id}`).check();
  await page.locator(`#tick-${checks[2].id}`).check();
  if ((await count('details.checked-group .check')) !== 2) fail('two ticked items should be in the Checked group');
  await page.locator('#clear-ticks').click();
  if ((await count('#features > .check')) !== n || (await count('details.checked-group')) !== 0) fail('Clear all ticks should bring everything back');
  await page.reload();
  await page.waitForSelector('.check');
  if ((await count('#features > .check')) !== n) fail('cleared ticks should stay cleared after a reload');
  await page.screenshot({ path: path.join(OUT, 'features-to-check-page.png') });
  await page.locator(`#tick-${checks[0].id}`).check();
  await page.locator('details.checked-group summary').click();
  await page.screenshot({ path: path.join(OUT, 'features-to-check-page-ticked.png'), fullPage: false });
  await page.evaluate(() => localStorage.removeItem('mat.checks.v1'));
}

// ---- the green checks above two x's (no card has two x's yet, so there is no button to click: the picture is drawn from a test state) ----
// Needs the app's own source files, so it runs against the dev server only (not the live site's built files).
async function checkTwoXs(page) {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto(new URL('?pack=add-both&level=4&seed=7&nosignin=1', BASE).href);
  await wait(page, 600);
  const ok = await page.evaluate(async () => {
    let m;
    try { m = await import('/src/view/solveScreen.js'); } catch { return 'no source'; }
    const board = { left: [{ kind: 'x' }, { kind: 'num', v: 3 }], right: [{ kind: 'x', coef: 2 }, { kind: 'num', v: -1 }] };       // x + 3 = 2x − 1
    const state = (sub) => ({ rows: [{ type: 'eq', board }], sub, feedback: null, stage: 'moves' });
    document.querySelectorAll('.spot-layer').forEach((n) => n.remove());
    const host = document.createElement('div');
    host.id = 'two-x';
    host.className = 'lb-game lb-eqcard ui-light';
    host.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:99;padding:90px 40px 0';
    const label = (t) => Object.assign(document.createElement('p'), { textContent: t, style: 'font:700 20px Lexend,system-ui,sans-serif;margin:30px 0 0;text-align:center' });
    for (const [text, sub] of [['The value is in the first x; the second is waiting for a drop', { placing: true, xs: 2, filled: [0], typed: 4, target: 'original', step: 0 }], ['The value is in both x’s', { placing: false, xs: 2, filled: [0, 1], typed: 4, target: 'original', step: 1 }]]) {
      const stack = document.createElement('div'); stack.className = 'lb-stack'; stack.style.minHeight = '0';
      stack.append(...m.stackRows(state(sub)));
      host.append(label(text), stack);
    }
    document.body.append(host);
    return 'ok';
  });
  if (ok === 'no source') return false;
  await wait(page, 300);
  const n = await page.locator('#two-x .lb-xcheck').count();
  if (n !== 3) throw new Error(`expected 3 green checks (one above the first x, then one above each x), found ${n}`);
  await page.screenshot({ path: path.join(OUT, 'two-x-checks.png') });
  // the check of the same equation (Build I, Part 1): the equation itself, every x blue, and under it the value under each x
  await page.evaluate(async () => {
    const m = await import('/src/view/solveScreen.js');
    const t = await import('/src/engine/solveTerms.js');
    const board = { left: [{ kind: 'x' }, { kind: 'num', v: 3 }], right: [{ kind: 'x', coef: 2 }, { kind: 'num', v: -1 }] };
    const host = document.querySelector('#two-x');
    host.replaceChildren();
    for (const v of [4, -4]) {
      const work = t.substitutionLines(board, v);
      const sub = { placing: false, xs: 2, filled: [0, 1], typed: v, target: 'original', step: 2, lines: work.lines, ok: false, kind: 'value' };
      const state = { rows: [{ type: 'eq', board }], board, sub, feedback: null, stage: 'moves' };
      const stack = document.createElement('div'); stack.className = 'lb-stack'; stack.style.cssText = 'min-height:0;display:flex;gap:60px;align-items:flex-start;margin-bottom:40px';
      stack.append(...m.stackRows(state), m.substBlock(state, { subView: () => ({ lines: work.lines.slice(0, 2), mark: null, last: 1 }) }));
      host.append(Object.assign(document.createElement('p'), { textContent: `x = ${v}`, style: 'font:700 20px Lexend,system-ui,sans-serif;margin:20px 0 0' }), stack);
    }
  });
  await wait(page, 500);
  const pairs = await page.evaluate(() => [...document.querySelectorAll('#two-x .sv-checklist')].map((list) => {
    const mid = (e) => { const r = e.getBoundingClientRect(); return (r.left + r.right) / 2; };
    const xs = [...list.querySelectorAll('.sv-line1 [data-pair]')];
    const vs = [...list.querySelectorAll('.sv-line2 [data-pair]')];
    return xs.map((x, i) => Math.round(Math.abs(mid(x) - mid(vs[i]))));
  }));
  if (pairs.length !== 2 || pairs.some((p) => p.length !== 2)) throw new Error(`expected two checks with two blue pairs each, found ${JSON.stringify(pairs)}`);
  await page.screenshot({ path: path.join(OUT, 'two-x-check-lines.png') });
  return pairs;
}

// ---- run ----------------------------------------------------------------------------------------------------------------------------
const pw = loadPlaywright();
const browser = await pw.chromium.launch();
let failed = 0;
if (!only.length || only.includes('page')) {
  const page = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  try { await checkThePage(page); console.log('PASS     the page: the section, ticks, Checked group, Clear all ticks'); }
  catch (e) { failed++; console.log(`FAIL     the page\n         ${String(e.message).split('\n')[0]}`); }
  await page.context().close();
}
if (!only.length || only.includes('two-x')) {
  const page = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  try {
    const done = await checkTwoXs(page);
    console.log(done ? `PASS     the green checks above two x’s, and the check's two lines (drawn from a test state; each x to its value, px: ${JSON.stringify(done)})` : 'SKIP     the green checks above two x’s (needs the dev server’s source files)');
  } catch (e) { failed++; console.log(`FAIL     the green checks above two x’s\n         ${String(e.message).split('\n')[0]}`); }
  await page.context().close();
}
for (const item of checks) {
  if (only.length && !only.includes(item.id)) continue;
  const walk = WALKS[item.id];
  if (!walk) { console.log(`MISSING  ${item.id}: no walk written for this item`); failed++; continue; }
  const page = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  const w = new Walk(page, item);
  try {
    await walk(w);
    if (w.errors.length) throw new Error(`the page reported an error: ${w.errors[0]}`);
    console.log(`PASS     ${item.id}`);
  } catch (e) {
    failed++;
    console.log(`FAIL     ${item.id}\n         ${String(e.message).split('\n')[0]}`);
  }
  await page.context().close();
}
await browser.close();
console.log(failed ? `\n${failed} item(s) did not pass.` : '\nEvery item passes.');
process.exit(failed ? 1 : 0);
