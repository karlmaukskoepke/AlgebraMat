// @vitest-environment happy-dom
// Build O (2026-10-24): the Moves panel. Part 1, its two bugs: Add stayed selected (yellow) after another move was chosen, and a move's
// hover preview outlived the hover. The real screen and the real pointer, as a student does it.

import { describe, it, expect, afterEach } from 'vitest';
import { twoStepPlay } from '../src/play/solveCards.js';
import { packById } from '../src/packs/index.js';

const problem = (pack, level, i = 0, seed = 7) => ({ ...packById(pack).generate(level, seed)[i], logLevel: level });
const settle = () => new Promise((r) => setTimeout(r, 0));

// the Mat, as the app draws it, with the card's pointer and keys bound
async function mat(play, s) {
  document.body.replaceChildren();
  const root = document.createElement('div');
  const pad = document.createElement('div');
  document.body.append(root, pad);
  const m = { s, root };
  const controls = play.buildControls(pad, (a) => m.dispatch(a));
  m.dispatch = (a) => {
    const n = play.reduce(m.s, a);
    if (n === m.s) return;
    m.s = n;
    controls.update(m.s);
    root.replaceChildren(play.renderMat(m.s, {}));
  };
  m.off = play.bindMat(root, m.dispatch, () => m.s);
  root.addEventListener('click', (e) => {                    // the page's clicks on the Mat (main.js)
    const b = e.target.closest('[data-action]');
    const a = b && (play.matAction(b.dataset) ?? (b.dataset.action === 'choose' ? { type: 'choose', move: b.dataset.move } : null));
    if (a) m.dispatch(a);
  });
  controls.update(m.s);
  root.replaceChildren(play.renderMat(m.s, {}));
  m.run = async (...actions) => { for (const a of actions) m.dispatch(a); await settle(); };
  m.q = (sel) => root.querySelector(sel);
  // the mouse goes onto an element (from another one, or from nowhere), or leaves it for another (or for nowhere)
  m.over = async (sel, from = null) => {
    const to = m.q(sel);
    const was = from ? m.q(from) : null;
    if (was) was.dispatchEvent(new PointerEvent('pointerout', { bubbles: true, pointerType: 'mouse', relatedTarget: to }));
    to.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse', relatedTarget: was }));
    await settle();
  };
  m.leave = async (sel) => { m.q(sel).dispatchEvent(new PointerEvent('pointerout', { bubbles: true, pointerType: 'mouse', relatedTarget: document.body })); await settle(); };
  m.ghost = () => m.q('.lx-ghost')?.className ?? '';
  await settle();
  return m;
}
const ADD = '.lb-move[data-move="add"]';
const MULT = '.lb-move[data-action="multOpen"]';
let m = null;
afterEach(() => { m?.off?.(); m = null; document.body.replaceChildren(); });

describe('Build O, Part 1: only one move is selected', () => {
  it('Two-step: click Add, then Multiply: Add is no longer selected, its box is gone, the options are open', async () => {
    m = await mat(twoStepPlay, twoStepPlay.newSession(problem('two-step-equations', 1), {}));
    await m.run({ type: 'choose', move: 'add' }, { type: 'digit', digit: 4 });
    expect(m.q(ADD).classList.contains('is-on')).toBe(true);
    await m.run({ type: 'multOpen' });
    expect([m.s.menu, m.s.amountEntry, Boolean(m.s.mopts)]).toEqual([null, '', true]);
    expect(m.q(ADD).classList.contains('is-on')).toBe(false);
    expect(m.q(ADD).getAttribute('aria-pressed')).toBe('false');
    expect(m.ghost()).not.toContain('is-chosen');               // no Add box left open under the equation
  });
  it('Two-step: click Add, then Undo-free cancel (Esc) clears it; applying it clears it too', async () => {
    m = await mat(twoStepPlay, twoStepPlay.newSession(problem('two-step-equations', 1), {}));
    await m.run({ type: 'choose', move: 'add' }, { type: 'lxCancel' });
    expect(m.q(ADD).classList.contains('is-on')).toBe(false);
    await m.run({ type: 'choose', move: 'add' }, { type: 'digit', digit: 4 }, { type: 'toggleSign' }, { type: 'go' });
    expect(m.q(ADD).classList.contains('is-on')).toBe(false);
  });
});

describe('Build O, Part 1: a preview lasts only as long as the hover', () => {
  it('hover Add, then leave: the preview ends at once (no faint row is left)', async () => {
    m = await mat(twoStepPlay, twoStepPlay.newSession(problem('two-step-equations', 1), {}));
    await m.over(ADD);
    expect(m.s.ui.preview).toBe(true);
    expect(m.ghost()).toContain('is-preview');
    await m.leave(ADD);
    expect(m.s.ui.preview).toBeFalsy();
    expect(m.ghost()).not.toMatch(/is-preview|is-near/);
  });
  it('hover Add, then Multiply: Add’s preview ends (Multiply opens its options only when clicked)', async () => {
    m = await mat(twoStepPlay, twoStepPlay.newSession(problem('two-step-equations', 1), {}));
    await m.over(ADD);
    await m.over(MULT, ADD);
    expect(m.s.ui.preview).toBeFalsy();
    expect(m.ghost()).not.toMatch(/is-preview|is-near/);
    // and a move of the pointer near Add while it is on Multiply does not bring the faint preview back
    m.q(MULT).dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse', clientX: 0, clientY: 0 }));
    await settle();
    expect(m.s.ui.preview).toBeFalsy();
  });
  it('select Add, then hover another move: Add keeps its own solid row and stays selected', async () => {
    m = await mat(twoStepPlay, twoStepPlay.newSession(problem('two-step-equations', 1), {}));
    await m.run({ type: 'choose', move: 'add' }, { type: 'digit', digit: 4 });
    await m.over(MULT, ADD);
    await m.run({ type: 'ui', patch: { preview: 'div' } });   // (a hover on another move's preview, while Add is selected, is ignored)
    expect(m.ghost()).toContain('is-chosen');
    expect(m.q('.lx-ghost [data-blank]').textContent.trim()).toBe('4');
    expect(m.q(ADD).classList.contains('is-on')).toBe(true);
  });
});
