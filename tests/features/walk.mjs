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
const OUT = outArg || path.join(ROOT, 'docs/build-g');
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
