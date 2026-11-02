// @vitest-environment happy-dom
// Build Y (Karl, 2026-11-01): Add's number written in a column, as the standard on every card with Add. Drawn with each card's own renderer:
// the open boxes and the hover preview (under the first number of each side; at the end of a side with no number), the work row after
// Go (the amount under the number, the cancelling pair crossed out), two numbers on a side, a group side, and Build T's x-term column as
// it was. Where the boxes sit on screen, typing and the sizes are in the real-browser sweeps and the walks.

import { describe, it, expect, afterEach } from 'vitest';
import { addBothPlay, twoStepPlay, distSolvePlay, bothSidesPlay, distMorePlay, strangePlay } from '../src/play/solveCards.js';
import { packById } from '../src/packs/index.js';
import { workStacks } from '../src/view/addBothScreen.js';

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
let m = null;
afterEach(() => { m?.off?.(); m = null; document.body.replaceChildren(); });
const digits = (n) => [...String(Math.abs(n))].map((d) => ({ type: 'digit', digit: Number(d) })).concat(n < 0 ? [{ type: 'toggleSign' }] : []);
// open Add's number option (the cards with an x-term option ask which; Add to both sides opens the number at once)
async function openNum(mm) {
  await mm.run({ type: 'choose', move: 'add' });
  if (mm.q('[data-action="addPick"][data-kind="num"]')) await mm.run({ type: 'addPick', kind: 'num' });
}
const text = (e) => e.textContent.replace(/\s+/g, '');
// a side of a row: [what is on top of each column, what is under it] and the terms in line
function side(row, k) {
  const el = row.querySelector(`.lb-${k}`);
  const cols = [...el.querySelectorAll(':scope > .lx-col')].map((c) => [text(c.firstElementChild), text(c.lastElementChild)]);
  return { cols, all: text(el), tail: [...el.children].filter((c) => !c.classList.contains('lx-col')).map(text).join('') };
}

describe('Build Y: the open boxes sit under the first number of each side', () => {
  it('Add to both sides, x + 8 = 11: a box under the +8 and under the 11, either takes the keys, the other mirrors it', async () => {
    m = await mat(addBothPlay, addBothPlay.newSession(problem('add-both', 2), {}));
    await openNum(m);
    const row = m.q('.lx-ghost .lx-ghosteq');
    expect(m.q('.lx-ghost').classList.contains('is-stacked')).toBe(true);
    expect(side(row, 'left').cols).toEqual([['+8', '+']]);
    expect(side(row, 'right').cols).toEqual([['11', '+']]);
    const boxes = [...m.root.querySelectorAll('.lx-ghost .lx-box.is-stackbox')];
    expect(boxes.map((b) => b.dataset.side)).toEqual(['left', 'right']);
    expect(boxes.map((b) => b.dataset.fk)).toEqual(['blank', 'blank:right']);
    await m.run(...digits(-8));
    expect([...m.root.querySelectorAll('.lx-ghost .lx-box')].map(text)).toEqual(['−8', '−8']);
    // the right box takes the keys too; the left mirrors it
    await m.run({ type: 'focus', target: 'amount', side: 'right' }, ...digits(-3));
    expect(m.s.amountSide).toBe('right');
    expect([...m.root.querySelectorAll('.lx-ghost .lx-box')].map(text)).toEqual(['−3', '−3']);
    expect(m.q('.lx-ghost .lx-box[data-side="right"]').classList.contains('is-focus')).toBe(true);
  });
  it('a side with no number gets its box at the end of its line, in line (6x = 4x + 10)', async () => {
    m = await mat(bothSidesPlay, bothSidesPlay.newSession(problem('variables-both-sides', 1), {}));
    await openNum(m);
    const row = m.q('.lx-ghost .lx-ghosteq');
    expect(side(row, 'left').cols).toEqual([]);
    expect(side(row, 'left').all).toBe('6x+');
    expect(row.querySelector('.lb-left > .lx-box')).not.toBeNull();
    expect(side(row, 'right').cols).toEqual([['+10', '+']]);
  });
  it('a side that is a group: its box at the end of its line; the other side stacks under its number (2(x + 4) = 26)', async () => {
    m = await mat(distSolvePlay, distSolvePlay.newSession(problem('distribute-solve', 1), {}));
    await openNum(m);
    if (!m.q('.lx-ghost.is-chosen')) return;          // (the card asks to distribute first: no Add yet on its first row)
    const row = m.q('.lx-ghost .lx-ghosteq');
    expect(side(row, 'left').cols).toEqual([]);
    expect(side(row, 'right').cols.length).toBe(1);
  });
  it('the hover preview shows both placements before an amount is chosen', async () => {
    m = await mat(bothSidesPlay, bothSidesPlay.newSession(problem('variables-both-sides', 1), {}));
    await m.run({ type: 'choose', move: 'add' });
    // (the number option pointed at: the screen's hover state, set as the pointer sets it)
    const s = structuredClone(m.s);
    s.ui = { ...(s.ui ?? {}), preview: 'addNum' };
    m.root.replaceChildren(bothSidesPlay.renderMat(s, {}));
    const g = m.q('.lx-ghost.is-optpreview');
    expect(g).not.toBeNull();
    expect(g.querySelectorAll('.lx-box.is-mirror').length).toBe(2);
    expect(side(g, 'right').cols).toEqual([['+10', '+']]);
    expect(g.querySelector('.lb-left > .lx-box')).not.toBeNull();
  });
});

describe('Build Y: the work row writes the amount where its box was', () => {
  it('x + 8 = 11, add −8: −8 under the +8 (both crossed out), −8 under the 11; the new row as before', async () => {
    m = await mat(addBothPlay, addBothPlay.newSession(problem('add-both', 2), {}));
    await openNum(m);
    await m.run(...digits(-8), { type: 'go' });
    const work = m.q('.lb-work');
    expect(work.classList.contains('is-stacked')).toBe(true);
    expect(side(work, 'left').cols).toEqual([['+8', '+−8']]);
    expect(side(work, 'right').cols).toEqual([['11', '+−8']]);
    expect([...work.querySelectorAll('.lb-left .lx-xo')].map(text)).toEqual(['+8', '−8']);
    expect(work.querySelectorAll('.lb-right .lx-xo').length).toBe(0);
    expect(m.s.rows.at(-1).board.right.length).toBe(2);                 // x = 11 − 8: the other side's amount left to combine
    expect(workStacks(m.s.rows.at(-2).work)).toBe(true);
  });
  it('the stored move is unchanged: the work row has no new fields (the column is worked out when drawn)', async () => {
    m = await mat(addBothPlay, addBothPlay.newSession(problem('add-both', 2), {}));
    await openNum(m);
    await m.run(...digits(-8), { type: 'go' });
    const work = m.s.rows.find((r) => r.type === 'work').work;
    expect(JSON.stringify(work)).not.toMatch(/under|stack/);
  });
  it('a side with no number keeps the amount at the end of its line (6x = 4x + 10, add −10)', async () => {
    m = await mat(bothSidesPlay, bothSidesPlay.newSession(problem('variables-both-sides', 1), {}));
    await openNum(m);
    await m.run(...digits(-10), { type: 'go' });
    const work = m.q('.lb-work');
    expect(side(work, 'left').cols).toEqual([]);
    expect(side(work, 'left').all).toBe('6x−10');
    expect(side(work, 'right').cols).toEqual([['+10', '+−10']]);
    expect(work.querySelectorAll('.lb-right .lx-xo').length).toBe(2);
  });
  it('two numbers on a side: under the first (workStacks on a stored row)', () => {
    const work = { left: [{ x: true, coef: 1 }, { v: 3, struck: false }, { v: 5, struck: false }, { v: -3, added: true, struck: true }], right: [{ v: 9 }, { v: -3, added: true }], amount: -3 };
    expect(workStacks(work)).toBe(true);
    expect(workStacks({ left: [{ x: true, coef: 2 }, { v: 4, added: true }], right: [{ x: true, coef: 5 }, { v: 4, added: true }] })).toBe(false);
  });
  it('an x-term is still added under the x-term (Build T), not under a number', async () => {
    m = await mat(bothSidesPlay, bothSidesPlay.newSession(problem('variables-both-sides', 2), {}));
    await m.run({ type: 'choose', move: 'add' }, { type: 'addPick', kind: 'x' }, ...digits(-4), { type: 'go' });
    const work = m.q('.lb-work');
    expect(work.querySelectorAll('.lx-col.is-num').length).toBe(0);
    expect([...work.querySelectorAll('.lx-col')].map((c) => text(c.lastElementChild))).toEqual(['+−4x', '+−4x']);
  });
  it.each([['two-step-equations', twoStepPlay, 1], ['distribute-more', distMorePlay, 1], ['strange-solutions', strangePlay, 1]])('%s: the number option opens its boxes in a column too', async (pack, p, level) => {
    m = await mat(p, p.newSession(problem(pack, level), {}));
    await openNum(m);
    if (!m.q('.lx-ghost.is-chosen')) return;
    expect(m.q('.lx-ghost').classList.contains('is-stacked')).toBe(true);
    expect(m.root.querySelectorAll('.lx-ghost .lx-box').length).toBe(2);
  });
});
