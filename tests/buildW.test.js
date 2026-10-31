// @vitest-environment happy-dom
// Build W (2026-10-26, Karl): the Moves panel simplified (five square buttons, one large plain symbol each, no floating symbols, no lights
// on screen; ?lights=1 shows them as before), the Multiply menu without floating symbols, the goal words without the lights, and the Add
// cancel mark as a diagonal cross-out (its geometry here; measured on screen in tests/panelRoom.test.js).

import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { addBothPlay, divideMovesPlay, flipPlay, twoStepPlay, distSolvePlay, bothSidesPlay, distMorePlay, strangePlay } from '../src/play/solveCards.js';
import { packById } from '../src/packs/index.js';
import { setShowLights, showLights } from '../src/view/narrowPanel.js';
import { crossGeometry, OVERSHOOT_EM, MIN_WEIGHT_PX } from '../src/view/crossOut.js';
import { lightsFeedbackText } from '../src/view/addBothLightsFeedback.js';

const problem = (pack, level, i = 0, seed = 7) => ({ ...packById(pack).generate(level, seed)[i], logLevel: level });
const settle = () => new Promise((r) => setTimeout(r, 0));
const digit = (d) => ({ type: 'digit', digit: d });
const play = (p, s, ...actions) => actions.reduce(p.reduce, s);

// the Mat, as the app draws it (the same as Build O's test)
async function mat(p, s) {
  document.body.replaceChildren();
  const root = document.createElement('div');
  const pad = document.createElement('div');
  document.body.append(root, pad);
  const m = { s, root };
  const controls = p.buildControls(pad, (a) => m.dispatch(a));
  m.dispatch = (a) => {
    const n = p.reduce(m.s, a);
    if (n === m.s) return;
    m.s = n;
    controls.update(m.s);
    root.replaceChildren(p.renderMat(m.s, {}));
  };
  m.off = p.bindMat(root, m.dispatch, () => m.s);
  controls.update(m.s);
  root.replaceChildren(p.renderMat(m.s, {}));
  m.run = async (...actions) => { for (const a of actions) m.dispatch(a); await settle(); };
  m.q = (sel) => root.querySelector(sel);
  await settle();
  return m;
}
const CSS_FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/style.css');
let m = null;
afterEach(() => { m?.off?.(); m = null; setShowLights(false); document.body.replaceChildren(); });

const CARDS = [['add-both', addBothPlay, 2], ['divide-it', divideMovesPlay, 2], ['flip-everything', flipPlay, 3], ['two-step-equations', twoStepPlay, 1],
  ['distribute-solve', distSolvePlay, 1], ['variables-both-sides', bothSidesPlay, 1], ['distribute-more', distMorePlay, 1], ['strange-solutions', strangePlay, 1]];
const GLYPHS = ['Plus sign', 'Times sign', 'Division sign', 'Times negative one', 'Two curved arrows making a circle'];

describe('Build W, Part 1: five square buttons, one plain symbol each', () => {
  it.each(CARDS)('%s: Add, Multiply, Divide, Flip everything, Trade places; one named symbol on each; nothing beside them', async (pack, p, level) => {
    m = await mat(p, p.newSession(problem(pack, level), {}));
    const buttons = [...m.root.querySelectorAll('.lx-panel .lx-pgrid > .lx-move, .lx-panel .lx-pgrid > .lx-movewrap > .lx-move')];
    expect(buttons.length).toBe(5);
    expect(buttons.map((b) => b.querySelectorAll('.lx-glyph').length)).toEqual([1, 1, 1, 1, 1]);
    expect(buttons.map((b) => b.querySelector('.lx-glyph').getAttribute('aria-label'))).toEqual(GLYPHS);
    // the formal property names stay on hover and focus, and as each button's name
    expect(buttons.every((b) => b.getAttribute('aria-label') === b.dataset.tip && /property of equality/.test(b.dataset.tip))).toBe(true);
    // nothing else drawn on a button (no equation form), nothing floating beside it, no lights
    expect(m.root.querySelectorAll('.lx-panel .lx-symbol, .lx-panel .lx-symcell, .lx-panel .lx-mini, .lx-panel .lx-dot, .lx-panel .lx-dots, .lx-hand, .lx-solvedrow').length).toBe(0);
    expect([...m.root.querySelector('.lx-panel .lx-pgrid').children].every((c) => c.matches('.lx-move, .lx-movewrap'))).toBe(true);
    expect(m.q('.lx-panel .lx-head').textContent).toBe('Moves');
    expect(m.q('.lx-panel').getAttribute('aria-label')).toBe('Moves');
  });
  it('the greyed look (still tappable for its message) and the selected state are unchanged', async () => {
    m = await mat(bothSidesPlay, bothSidesPlay.newSession(problem('variables-both-sides', 1), {}));
    const divide = m.q('.lx-panel [data-move="div"]');
    expect(divide.classList.contains('is-grey')).toBe(true);
    expect(divide.getAttribute('aria-disabled')).toBe('true');
    expect(divide.disabled).toBe(false);
    await m.run({ type: 'choose', move: 'add' });
    const add = m.q('.lx-panel [data-move="add"]');
    expect(add.classList.contains('is-on')).toBe(true);
    expect(add.getAttribute('aria-pressed')).toBe('true');
  });
  it('the Multiply menu: three options, each its own equation form, no floating symbol', async () => {
    m = await mat(divideMovesPlay, divideMovesPlay.newSession(problem('divide-it', 3), {}));
    await m.run({ type: 'multOpen' });
    const rows = [...m.root.querySelectorAll('.mo-flyout .mo-optrow')];
    expect(rows.map((r) => r.children.length)).toEqual([1, 1, 1]);
    expect(rows.map((r) => r.querySelector('.mo-opt').textContent.replace(/\s+/g, ''))).toEqual(['()=()', '1()=1()', '()=()']);
    expect(m.root.querySelectorAll('.mo-flyout svg, .mo-flyout .lx-symbol').length).toBe(0);
  });
  it('the panel styles: square buttons of at least 56 px, the symbol scaled to the button', () => {
    const css = readFileSync(CSS_FILE, 'utf8');
    const block = css.slice(css.indexOf('Build W (Karl, 2026-10-26): the Moves panel simplified'));
    expect(block).toMatch(/--mv: 76px/);
    expect(block).toMatch(/min-height: 740px\) \{ \.ui-light \.lx-panel \{ --mv: 88px; \}/);
    expect(block).toMatch(/\.lx-move, \.ui-light \.lx-panel \.lx-movewrap \{ width: var\(--mv\); height: var\(--mv\); \}/);
    expect(block).toMatch(/min-width: 56px; min-height: 56px;/);
  });
});

describe('Build W, Part 2: the lights are not on screen; ?lights=1 shows them', () => {
  it('off by default; on, every card’s panel has the dots, the by-hand row and Solved for x as before', async () => {
    expect(showLights()).toBe(false);
    setShowLights(true);
    for (const [pack, p, level] of CARDS) {
      m = await mat(p, p.newSession(problem(pack, level), {}));
      expect(m.q('.lx-panel').classList.contains('has-lights')).toBe(true);
      expect(m.root.querySelectorAll('.lx-pgrid > .lx-dots').length).toBe(5);
      expect(m.q('.lx-hand [data-light="simple"]')).not.toBeNull();
      expect(m.q('.lx-solvedrow [data-light="solved"]')).not.toBeNull();
      m.off(); m = null;
    }
  });
  it('the lights are still worked out (the judgement, the class sheet and the nudges use them)', async () => {
    const p = addBothPlay;
    let s = p.newSession(problem('add-both', 2), {});
    m = await mat(p, s);
    expect(m.s.lights).toBeDefined();
    expect(Object.keys(m.s.lights)).toContain('fewer');
  });
  it('no message names a goal light: "Fewer terms:" is gone from the words', () => {
    expect(lightsFeedbackText({ key: 'aGreen' })).toBe('That move helped: the equation has fewer terms now. Press Next.');
  });
});

describe('Build W, Part 3: the Add cross-out is a diagonal', () => {
  it.each([[38, 27, 46], [60, 27, 46], [24, 18, 26], [80, 30, 32]])('a term %i × %i px at %i px: one stroke, lower left to upper right, 45°, across the whole term', (w, h, font) => {
    const g = crossGeometry(w, h, font);
    expect(g.angle).toBeGreaterThanOrEqual(40);
    expect(g.angle).toBeLessThanOrEqual(50);
    expect(g.x1).toBeLessThan(0);                                          // starts left of the term's first glyph
    expect(g.x2).toBeGreaterThan(w);                                       // ends right of its last
    expect(g.y1).toBeGreaterThan(g.y2);                                    // lower left to upper right
    expect(g.x2 - g.x1).toBeCloseTo(w + OVERSHOOT_EM * font, 6);
    expect(g.weight).toBeGreaterThan(4);                                   // heavier than the old 4 px line
    expect(g.weight).toBeGreaterThanOrEqual(MIN_WEIGHT_PX);
  });
  it('the styles draw that square: the term’s width plus the overshoot, a stripe on the 45° diagonal, still under reduced motion', () => {
    const css = readFileSync(CSS_FILE, 'utf8');
    const block = css.slice(css.indexOf('Build W, Part 3 (Karl, 2026-10-26)'));
    expect(block).toMatch(new RegExp(`width: calc\\(100% \\+ ${OVERSHOOT_EM}em\\); height: auto; aspect-ratio: 1 / 1;`));
    expect(block).toMatch(/linear-gradient\(to bottom right,/);
    expect(block).toMatch(/max\(6px, 0\.16em\)/);
    expect(block).toMatch(/prefers-reduced-motion: reduce\) \{ \.lx-xo::after \{ animation: none; \}/);
    expect(block).not.toMatch(/\.lx-xo::after \{[^}]*clip-path/);                // (drawn whole whenever it does not animate)
  });
  it('Add to both sides: the cancelling pair is crossed out sign and all (+8 and −8), one stroke each', async () => {
    const p = addBothPlay;
    m = await mat(p, p.newSession(problem('add-both', 2), {}));
    const t = m.s.board.left.find((x) => x.kind === 'num');
    await m.run({ type: 'lxDrop', id: t.id, slot: { side: 'right', at: m.s.board.right.length }, how: 'pointer' });
    const xo = [...m.root.querySelectorAll('.lb-work .lx-xo')];
    expect(xo.length).toBe(2);
    expect(xo.map((e) => e.querySelector('.lb-plus')?.textContent ?? '')).toEqual(['+', '−']);
    expect(xo.every((e) => e.querySelectorAll('.is-struck').length === 1)).toBe(true);
  });
  it('a stacked x-term Add (Build T): both partners crossed the same way', async () => {
    const p = bothSidesPlay;
    m = await mat(p, p.newSession(problem('variables-both-sides', 1), {}));
    const t = m.s.board.right.find((x) => x.kind === 'x');
    await m.run({ type: 'lxDrop', id: t.id, slot: { side: 'left', at: 1 }, how: 'pointer' });
    const xo = [...m.root.querySelectorAll('.lb-work .lx-xo')];
    expect(xo.length).toBe(2);
    expect(xo.some((e) => e.closest('.lx-under'))).toBe(true);
    expect(xo.map((e) => e.textContent.replace(/\s+/g, ''))).toEqual(expect.arrayContaining([expect.stringMatching(/x$/), expect.stringMatching(/^−\d*x$/)]));
  });
});
