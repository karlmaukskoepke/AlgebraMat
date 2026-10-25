// The screen, played like a student, in a real browser (Build S, 2026-10-24). Karl found the screen redrawing and replaying its
// animations (a pickup, a typed value or a click on the fraction bar made the last row vanish and its cross-off play again), the text
// size jumping from step to step, and a drag that silently did nothing. Every walk had passed. This plays every Solve it card at every
// level through the honest path (engine/solveit/honest.js), in Chromium at 1366×768 on Vite's dev server, and at every state:
//   1. picks up every term of the newest row (holds it over the row, then drops it back), hovers the moves and a light, types a digit into
//      x = and takes it back, clicks a product's × or fraction bar and closes it, makes the move, presses Undo and makes it again, and goes
//      through the check. Each time: no row that was on screen before starts an animation, and no row is taken off and put back;
//   2. records the equation's text size: it never changes within a problem;
//   3. drags every term of the newest row to every kind of place (across the =, onto each other term, between terms, onto a
//      parenthesis, away from the equation): it works, or it puts the term back with its message; it never does nothing silently.
// Playwright is not a dependency of the app (as for npm run parity): without it this file is skipped and says so.

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
if (!pw) console.warn('screenSweep: SKIP (Playwright is not installed here; set PLAYWRIGHT_PATH)');

const CARDS = [
  ['Add to both sides', 'add-both', [2, 3, 4, 5, 6]],
  ['Divide it', 'divide-it', [2, 3, 4, 5, 6]],
  ['Flip everything', 'flip-everything', [2, 3, 4, 5, 6]],
  ['Two-step equations', 'two-step-equations', [1, 2, 3, 4, 5, 6, 7]],
  ['Distribute, combine, solve', 'distribute-solve', [1, 2, 3, 4, 5]],
  ['Variables on both sides', 'variables-both-sides', [1, 2, 3, 4, 5]],
];
const SEED = 7;

// ---- in the page: what was on screen before an action, and what changed --------------------------------------------------------------
function instrument() {
  let pre = new Set();
  let preAnims = new Set();
  window.__sweep = {
    mark() {
      pre = new Set(document.querySelectorAll('.lb-stack .lb-rowwrap'));
      preAnims = new Set(document.getAnimations());
    },
    // (only after an action: a row taken off and put back is a new element with the same key; a finite animation that started in a row
    // that was already there is a replay. Animations that repeat for ever, a glow or a pulse, are attention, not entrance)
    problems() {
      const out = [];
      for (const r of pre) {
        if (!r.isConnected && r.dataset.rk && document.querySelector(`.lb-stack .lb-rowwrap[data-rk="${r.dataset.rk}"]`)) out.push(`row taken off and put back: ${r.textContent.replace(/\s+/g, '')}`);
      }
      for (const a of document.getAnimations()) {
        if (preAnims.has(a) || !a.animationName) continue;
        if (a.effect?.getComputedTiming?.().iterations === Infinity) continue;
        const row = a.effect?.target?.closest?.('.lb-rowwrap');
        if (row && pre.has(row)) out.push(`animation ${a.animationName} played again in ${row.textContent.replace(/\s+/g, '')}`);
      }
      return out;
    },
    sizes() {
      return [...document.querySelectorAll('.lb-stack .lb-rowwrap:not(.has-work):not(.is-fold) > .lb-eq')].map((e) => getComputedStyle(e).fontSize);
    },
  };
}

const frames = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

async function playCard(browser, base, [name, pack, levels], report) {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(instrument);
  const fail = (lv, what) => report.push(`${name} Level ${lv}: ${what}`);
  const state = () => page.evaluate(() => {
    const s = window.__mat.session();
    return { board: JSON.stringify(s.board), rows: s.rows?.length ?? 0, combine: Boolean(s.lx?.combine), dist: Boolean(s.lx?.distribute), calc: Boolean(s.lx?.calc), key: s.feedback?.key ?? null, needUndo: Boolean(s.needUndo), sub: Boolean(s.sub), stage: s.stage, history: s.history?.length ?? 0 };
  });
  const dispatch = (actions) => page.evaluate((as) => { for (const a of as) window.__mat.dispatch(a); }, actions);
  const nextMove = () => page.evaluate(() => window.__mat.nextMove());
  // one action, judged: nothing on screen before it replays or is put back
  const watched = async (lv, label, act) => {
    await page.evaluate(() => window.__sweep.mark());
    await act();
    await frames(page);
    for (const p of await page.evaluate(() => window.__sweep.problems())) fail(lv, `${label}: ${p}`);
  };
  const center = async (loc) => { const b = await loc.boundingBox(); return b ? { x: b.x + b.width / 2, y: b.y + b.height / 2, b } : null; };
  const mouse = page.mouse;

  for (const lv of levels) {
    const url = `${base}?pack=${pack}&level=${lv}&seed=${SEED}&nosignin=1`;
    await page.goto(url);
    await page.evaluate(() => { try { localStorage.clear(); } catch { /* */ } });
    await page.goto(url);
    await page.waitForFunction(() => window.__mat?.session()?.board);
    // (a first problem's pop-up: Next)
    await dispatch([{ type: 'introNext' }]);
    const sizes = new Set();
    const record = async () => { for (const z of await page.evaluate(() => window.__sweep.sizes())) sizes.add(z); };
    const done = [];                                   // the moves made, to come back to this state after a drag that moved something
    const restore = async (want) => {
      if ((await state()).board === want.board && !(await state()).combine) return;
      await dispatch([{ type: 'lxCancel' }, { type: 'spotDismiss' }]);
      let s = await state();
      for (let k = 0; k < 3 && (s.board !== want.board || s.rows !== want.rows); k++) { await dispatch([{ type: 'undo' }, { type: 'spotDismiss' }]); s = await state(); }
      if (s.board === want.board) return;
      await page.goto(url);
      await page.waitForFunction(() => window.__mat?.session()?.board);
      await dispatch([{ type: 'introNext' }]);
      for (const m of done) await dispatch(m);
    };

    for (let step = 0; step < 10; step++) {
      await record();
      const live = page.locator('.lx-live [data-tok]');
      const n = await live.count();
      // 1a. every term picked up, held over the row, dropped back where it was
      for (let i = 0; i < n && i < 6; i++) {
        const before = await state();
        const c = await center(live.nth(i));
        if (!c) continue;
        await watched(lv, `pick up term ${i + 1}`, async () => {
          await mouse.move(c.x, c.y); await mouse.down();
          await mouse.move(c.x + 8, c.y - 4, { steps: 2 }); await mouse.move(c.x + 10, c.y - 70, { steps: 3 });
        });
        const held = await page.evaluate(() => ({ ghost: Boolean(document.querySelector('.lx-dragghost')), rows: document.querySelectorAll('.lb-stack .lb-rowwrap').length }));
        if (!held.ghost) fail(lv, `pick up term ${i + 1}: no lifted copy follows the pointer`);
        await watched(lv, `drop term ${i + 1} back`, async () => { await mouse.move(c.x, c.y, { steps: 3 }); await mouse.up(); });
        const after = await state();
        if (after.board !== before.board) { fail(lv, `term ${i + 1} dropped back where it was changed the equation`); await restore(before); }
      }
      // 1b. the pointer over the moves and a light, then away
      await watched(lv, 'hover a move and a light', async () => {
        for (const sel of ['.lx-move', '[data-light]']) { const l = page.locator(sel).first(); if (await l.count() && await l.isVisible()) { await l.hover({ force: true }); await page.waitForTimeout(60); } }
        await mouse.move(600, 740);
      });
      // 1c. a digit typed into x = and taken back
      const xField = page.locator('[data-action="focus"][data-target="answer"]:not([disabled])');
      if (await xField.count() && await xField.first().isVisible()) {
        await watched(lv, 'type a digit into x = and take it back', async () => { await xField.first().click(); await page.keyboard.press('5'); await page.keyboard.press('Backspace'); });
      }
      // 1d. a product's × (or fraction bar) clicked, then closed
      const calc = page.locator('[data-action="lxCalc"]');
      if (await calc.count() && await calc.first().isVisible()) {
        await watched(lv, 'click the fraction bar (or ×), then Escape', async () => { await calc.first().click(); await page.keyboard.press('Escape'); });
      }
      // 3. the drag sweep: every term, every kind of place
      await sweepDrags(page, lv, fail, state, restore);
      // the honest move, then Undo, then the move again
      const m = await nextMove();
      if (!m) break;
      const was = await state();
      await watched(lv, 'make the move', () => dispatch(m));
      let now = await state();
      if (now.board === was.board) { fail(lv, `the honest move ${JSON.stringify(m[0])} was refused (${now.key})`); break; }
      const undo = page.locator('.lx-undo:not([disabled])');
      if (await undo.count()) {
        await watched(lv, 'Undo', async () => { await undo.first().click(); });
        now = await state();
        // (the move again, as it stands now: a minus tapped before it may still be shown)
        if (now.board !== was.board) await restore(was);
        const again = await nextMove();
        await watched(lv, 'the move again after Undo', () => dispatch(again ?? m));
        if ((await state()).board === was.board) { fail(lv, `the honest move after Undo was refused (${(await state()).key})`); break; }
      }
      done.push(m);
      await record();
    }
    // the check, one step at a time
    const x = await page.evaluate(() => window.__mat.session().problem.x);
    const digits = [...String(Math.abs(x))].map((d) => ({ type: 'digit', digit: Number(d) })).concat(x < 0 ? [{ type: 'toggleSign' }] : []);
    await watched(lv, 'type x', () => dispatch([{ type: 'focus', target: 'answer' }, ...digits]));
    await record();
    await watched(lv, 'Check', () => dispatch([{ type: 'check' }]));
    // (the value to drag into x is not covered by the check's pop-up: Build S, the size chosen leaves it room)
    await page.waitForTimeout(450);
    const covered = await page.evaluate(() => {
      const chip = document.querySelector('[data-chip]');
      if (!chip) return null;
      const r = chip.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      const sb = document.querySelector('.spot-box')?.getBoundingClientRect();
      return chip.contains(top) ? null : `${top?.className || top?.tagName || 'something'} (value at ${Math.round(r.top)}, pop-up ${Math.round(sb?.top)}-${Math.round(sb?.bottom)}, text ${getComputedStyle(document.getElementById('mat')).getPropertyValue('--eq-size')}, window ${innerHeight}, rows ${[...document.querySelectorAll('.lb-stack .lb-rowwrap')].map((x) => x.textContent.replace(/\s+/g, '')).join(' | ')})`;
    });
    if (covered) fail(lv, `the value to drag into x is covered by ${covered}`);
    for (let k = 0; k < 6 && (await state()).sub && (await state()).stage !== 'done'; k++) {
      await watched(lv, `the check, step ${k + 1}`, () => dispatch([{ type: 'placeValue', index: k }, { type: 'nextLine' }]));
      await record();
    }
    if ((await state()).stage !== 'done') fail(lv, `the honest path did not end Balanced: ${JSON.stringify(await state())}`);
    if (sizes.size > 1) fail(lv, `the equation's text size changed within the problem: ${[...sizes].join(', ')}`);
  }
  for (const e of errors) report.push(`${name}: page error ${e}`);
  await page.close();
}

// Every term of the newest row dragged to every kind of place. Works (the equation, the rows or a blank changed), or puts the term back
// with a message on screen, or (dropped where it was, or away from the equation) simply goes back: anything else is a silent failure.
async function sweepDrags(page, lv, fail, state, restore) {
  const targets = await page.evaluate(() => {
    const row = document.querySelector('.lx-live');
    if (!row) return [];
    const box = (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, l: r.left, r: r.right }; };
    const toks = [...row.querySelectorAll('[data-tok]')].filter((t) => !t.classList.contains('is-gap') && t.getBoundingClientRect().width);
    const sides = Object.fromEntries(['left', 'right'].map((k) => [k, row.querySelector(`.lb-side[data-side="${k}"]`)]));
    const rb = row.getBoundingClientRect();
    return toks.map((t, i) => {
      const side = t.dataset.side ?? t.closest('[data-side]')?.dataset.side;
      const other = side === 'left' ? 'right' : 'left';
      const mine = toks.filter((u) => (u.dataset.side ?? u.closest('[data-side]')?.dataset.side) === side);
      const theirs = toks.filter((u) => (u.dataset.side ?? u.closest('[data-side]')?.dataset.side) === other);
      const ob = sides[other]?.getBoundingClientRect();
      const dests = [];
      if (ob) {
        dests.push({ kind: 'across, at the end', x: theirs.length ? box(theirs.at(-1)).r + 16 : ob.left + ob.width / 2, y: rb.top + rb.height / 2 });
        if (theirs.length) dests.push({ kind: 'across, at the start', x: box(theirs[0]).l - 10, y: rb.top + rb.height / 2 });
      }
      // (a parenthesis's own factor is part of it: dropped there, it is dropped where it was)
      mine.forEach((u) => { if (u !== t) dests.push({ kind: `onto ${u.textContent.trim()}`, ...box(u), back: u.contains(t) || t.contains(u) }); });
      for (let k = 0; k + 1 < mine.length; k++) if (mine[k] !== t && mine[k + 1] !== t) dests.push({ kind: 'between terms', x: (box(mine[k]).r + box(mine[k + 1]).l) / 2, y: rb.top + rb.height / 2 });
      row.querySelectorAll('[data-paren]').forEach((p) => { if (!t.contains(p)) dests.push({ kind: 'onto a parenthesis', ...box(p) }); });
      dests.push({ kind: 'away from the equation', x: rb.left + rb.width / 2, y: rb.bottom + 320, back: true });
      return { i, text: t.textContent.trim(), from: box(t), dests };
    });
  });
  for (const t of targets) {
    for (const d of t.dests) {
      const before = await state();
      if (before.sub || before.stage === 'done') return;
      // (the last drag's message is cleared first, so a drag that says the same thing again is heard)
      await page.evaluate(() => { const s = window.__mat.session(); if (s.feedback) s.feedback = null; document.querySelectorAll('#mat .spot-layer').forEach((n) => n.remove()); });
      const spot0 = '';
      const m = page.mouse;
      // (a term redrawn since the list was made is found again by its place)
      await m.move(t.from.x, t.from.y); await m.down();
      await m.move(t.from.x + 8, t.from.y - 4, { steps: 2 }); await m.move(d.x, d.y, { steps: 4 }); await m.up();
      await frames(page); await page.waitForTimeout(40);
      const after = await state();
      const spot = await page.evaluate(() => document.querySelector('.spot-layer .spot-text')?.textContent ?? '');
      const worked = after.board !== before.board || after.rows !== before.rows || after.combine || after.dist || after.history !== before.history;
      const said = Boolean(spot) || (after.key && !['aFindX', 'lxUndone'].includes(after.key));
      if (!worked && !said && !d.back) fail(lv, `dragging ${t.text} ${d.kind} did nothing and said nothing`);
      if (worked || said) await restore(before);
    }
  }
}

(pw ? describe : describe.skip)('Build S: the screen, played like a student (real browser)', () => {
  let server = null;
  let browser = null;
  let base = '';
  beforeAll(async () => {
    const { createServer } = await import('vite');
    server = await createServer({ root: ROOT, configFile: path.join(ROOT, 'vite.config.js'), logLevel: 'silent', server: { port: 0, hmr: false } });
    await server.listen();
    base = server.resolvedUrls.local[0];
    browser = await pw.chromium.launch();
  }, 60000);
  afterAll(async () => { await browser?.close(); await server?.close(); });

  it.concurrent.each(CARDS)('%s: nothing replays or is put back, the text size stays, every drag works or says why', async (...card) => {
    const report = [];
    await playCard(browser, base, card, report);
    expect(report).toEqual([]);
  }, 600000);
});
