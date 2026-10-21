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
const OUT = outArg || path.join(ROOT, 'docs/build-h');
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
      try { await e.click({ timeout: 2500 }); } catch { const b = await e.boundingBox(); await this.page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); }
      await wait(this.page, 250);
      return;
    }
    throw new Error(`nothing to click for ${sel}`);
  }
  async type(text) { await this.page.keyboard.type(String(text)); await wait(this.page, 200); }
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
    for (const w of words) if (!t.includes(w)) throw new Error(`expected to see "${w}" after step "${this.step}". On screen: ${t.slice(0, 400)}`);
  }
  async notSee(...words) {
    const t = await this.text();
    for (const w of words) if (t.includes(w)) throw new Error(`did not expect to see "${w}" after step "${this.step}"`);
  }
  async shot(name) { await this.page.screenshot({ path: path.join(OUT, `${name}.png`) }); }
  async lateLayer() { await wait(this.page, 2300); }   // a red picture fades in after about two seconds, on purpose
  at(step) { this.step = step; }
  // quick helpers for the steps Karl repeats
  async add(n) { await this.click(`${act('choose')}[data-move="add"]`); await this.type(n); await this.click(act('go')); }
  async stuck(times = 1) { for (let i = 0; i < times; i++) await this.click(act('stuck')); }
  async box(selector) { return this.page.evaluate((s) => { const r = document.querySelector(s)?.getBoundingClientRect(); return r ? [r.left, r.top, r.right, r.bottom].map(Math.round) : null; }, selector); }
}

// ---- one walk per item (same id as in the data file) ---------------------------------------------------------------------------------
const WALKS = {
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
    await w.see('To get one x, take a fraction of both sides: one of the 5 x boxes is ⅕.', 'Got it');
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
    const blue = await w.page.evaluate(() => ({ value: [...document.querySelectorAll('.sv-checklist .sv-checkrow:first-child .is-blue')].map((e) => getComputedStyle(e).color), x: getComputedStyle(document.querySelector('.is-plugrow .lb-x')).color }));
    if (!blue.value.length || blue.value.some((c) => c !== blue.x)) throw new Error(`the dropped-in value should be the blue of the x (${blue.x}) but is ${blue.value}`);
    w.at('Next twice'); await w.click(act('nextLine')); await w.click(act('nextLine')); await w.lateLayer();
    await w.see('4 = −4', '✗ Not balanced', 'When x = −4, the equation is not balanced.');
    await w.lit('.sv-checklist .sv-checkrow:not(.sv-mark)', 1);          // the last line, 4 = −4
    await w.lit('.sv-checklist .sv-mark');
    await w.both('h-not-balanced-add');
  },

  async 'h-not-balanced-divide'(w) {
    await w.start();
    await w.see('DIVIDE IT · Level 2', '5', '−15');
    w.at('type 4, Enter'); await w.click(act('focus')); await w.type(4); await w.enter();
    w.at('drag the 4 onto x'); await w.drag();
    await w.see('5 × 4 = −15');
    const blue = await w.page.evaluate(() => ({ value: [...document.querySelectorAll('.sv-checklist .sv-checkrow:first-child .is-blue')].map((e) => getComputedStyle(e).color), x: getComputedStyle(document.querySelector('.is-plugrow .lb-x')).color }));
    if (!blue.value.length || blue.value.some((c) => c !== blue.x)) throw new Error(`the dropped-in value should be the blue of the x (${blue.x}) but is ${blue.value}`);
    w.at('Next twice'); await w.click(act('nextLine')); await w.click(act('nextLine')); await w.lateLayer();
    await w.see('20 = −15', '✗ Not balanced', 'When x = 4, the equation is not balanced.');
    await w.lit('.sv-checklist .sv-checkrow:not(.sv-mark)', 1);
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

  async 'h-slash-fraction'(w) {
    await w.start(); await w.see('DIVIDE IT · Level 2', '5', '−15');
    w.at('Multiply, the first choice'); await w.click(act('multOpen')); await w.click(`${act('multPick')}[data-kind="whole"]`);
    w.at('type 1, /, 5'); await w.type(1); await w.page.keyboard.press('/'); await wait(w.page, 300); await w.type(5);
    const boxes = await w.page.locator('.dv-fracpart:not(.is-mirror)').allInnerTexts();
    if (boxes.join(',').replace(/\s/g, '') !== '1,5') throw new Error(`1, / and 5 should make the fraction 1/5 but the boxes say ${JSON.stringify(boxes)}`);
    await w.see('Go');
    await w.both('h-slash-fraction');
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
    await w.shot('h-retype-fraction-top');
    w.at('click the bottom box'); await w.click('.dv-fracpart[data-target="den"]');
    if ((await read()).join(',') !== ',') throw new Error(`the bottom box should be empty too: ${await read()}`);
    if (!(await w.page.locator('.dv-fracpart[data-target="den"].is-blink').count())) throw new Error('the cursor should be in the bottom box');
    await w.both('h-retype-fraction');
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

  async 'h-big-battle'(w) {
    await w.start(); await w.see('x', '2', '−15');
    w.at('Add, type 2, Enter'); await w.add(2); await w.see('x = −15 + 2');
    w.at("I'm stuck"); await w.stuck(); await w.see('−15 + 2: party or battle?');
    w.at('Battle!'); await w.click(`${act('kind')}[data-value="battle"]`); await wait(w.page, 500);
    await w.see('Who won? −15 or 2?', 'Subtract 15 − 2 to find how many are left.');
    await w.lit('.lx-live .lx-tok.is-hint', 0); await w.lit('.lx-live .lx-tok.is-hint', 1);
    const dim = await w.page.locator('.spot-box.is-bubble[data-bubble="op"]').evaluate((e) => ({ cls: e.className, opacity: getComputedStyle(e).opacity }));
    if (!/is-dim/.test(dim.cls) || Number(dim.opacity) > 0.6) throw new Error(`the subtract box should be dimmed until who won is answered: ${JSON.stringify(dim)}`);
    await w.shot('h-big-battle-0');
    w.at('click +'); await w.click(`${act('whoWon')}[data-value="+"]`); await w.see('Not that one');
    w.at('click −'); await w.click(`${act('whoWon')}[data-value="-"]`);
    const after = await w.page.locator('.spot-box.is-bubble[data-bubble="op"]').evaluate((e) => ({ cls: e.className, opacity: getComputedStyle(e).opacity }));
    if (/is-dim/.test(after.cls) || Number(after.opacity) < 0.9) throw new Error(`the subtract box should wake up: ${JSON.stringify(after)}`);
    const typed = await w.page.locator('[data-fk="answer"]').innerText();
    if (typed.trim() !== '') throw new Error(`nothing should be written in x = for the student: "${typed}"`);
    await w.lit('.lx-live .lx-tok.is-hint', 0);
    await w.both('h-big-battle');
    w.at('type −13, Enter'); await w.type('-13'); await w.enter();
    await w.see('Let’s check that x = −13 is the solution.');
  },

  async 'h-big-party'(w) {
    await w.start(); await w.see('x', '13', '−2');
    w.at('Add, type −13, Enter'); await w.click(`${act('choose')}[data-move="add"]`); await w.type('-13'); await w.click(act('go')); await w.see('x = −2 − 13');
    w.at("I'm stuck"); await w.stuck(); await w.see('−2 − 13: party or battle?');
    w.at('Party!'); await w.click(`${act('kind')}[data-value="party"]`); await wait(w.page, 500);
    await w.see('Add 2 + 13 to find how many in all.');
    await w.notSee('Who won');
    await w.lit('.lx-live .lx-tok.is-hint', 0); await w.lit('.lx-live .lx-tok.is-hint', 1);
    const typed = await w.page.locator('[data-fk="answer"]').innerText();
    if (typed.trim() !== '') throw new Error(`nothing should be written in x = for the student: "${typed}"`);
    await w.both('h-big-party');
    w.at('type −15, Enter'); await w.type('-15'); await w.enter();
    await w.see('Let’s check that x = −15 is the solution.');
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
    w.at('mistake 3: the first option, 5, Go');
    await w.click(`${act('multPick')}[data-kind="whole"]`); await w.type(5); await w.click(act('go'));
    await w.see('5 × (5x) makes 25x: still not one x. Try a fraction.');
    await w.shot('student-divide-whole');
    w.at('mistake 4: Multiply, −1 × ( ), Go');
    await w.click(act('multOpen')); await w.click(`${act('multPick')}[data-kind="flip"]`); await w.click(act('go'));
    await w.see('−1 × (5x) makes −5x: the sign changes, but there are still 5 x’s. Try a fraction.');
    w.at('mistake 5: Multiply, ▢ over ▢, 1, 2, Go');
    await w.click(act('multOpen')); await w.click(`${act('multPick')}[data-kind="frac"]`); await w.type(1); await w.type(2); await w.click(act('go'));
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
    if (!/nosignin=1/.test(href) || !/pack=/.test(href) || !/seed=/.test(href)) fail(`the button for ${c.id} should carry the pack, seed and sign-in skip: ${href}`);
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
  return true;
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
    console.log(done ? 'PASS     the green checks above two x’s (drawn from a test state)' : 'SKIP     the green checks above two x’s (needs the dev server’s source files)');
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
