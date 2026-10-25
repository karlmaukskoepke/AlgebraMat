// @vitest-environment happy-dom
// Build O (2026-10-24): the Moves panel. Part 1, its two bugs: Add stayed selected (yellow) after another move was chosen, and a move's
// hover preview outlived the hover. The real screen and the real pointer, as a student does it.

import { describe, it, expect, afterEach } from 'vitest';
import { twoStepPlay, divideMovesPlay, flipPlay, addBothPlay, distSolvePlay } from '../src/play/solveCards.js';
import { boardText } from '../src/engine/solveTerms.js';
import { makeRecord } from '../src/engine/eventlog.js';
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

describe('Build O, Part 2: the panel', () => {
  it('is headed "Moves"; each move’s name is its property of equality; each has a drawn symbol with a name', async () => {
    m = await mat(twoStepPlay, twoStepPlay.newSession(problem('two-step-equations', 1), {}));
    expect(m.q('.lx-panel .lx-head').textContent).toBe('Moves');
    const names = [...m.root.querySelectorAll('.lx-pgrid .lx-move')].map((b) => b.getAttribute('aria-label'));
    expect(names.slice(0, 2)).toEqual(['Addition property of equality: add the same number to both sides', 'Multiplication property of equality']);
    expect(names).toContain('Symmetric property of equality: if a = b, then b = a');
    expect(names).toContain('Multiplication property of equality: multiply both sides by −1');
    const symbols = [...m.root.querySelectorAll('.lx-pgrid .lx-symbol')].map((e) => e.getAttribute('aria-label'));
    expect(symbols.slice(0, 2)).toEqual(['Plus sign', 'Times sign']);
    expect(symbols).toContain('Cycle between minus and plus');
    expect(symbols).toContain('Equals sign with two circling arrows');
    expect(m.root.textContent).not.toMatch(/[Ss]ubtract \S+ from both sides/);
  });
  it('the Multiply options have no small × or ÷ of their own', async () => {
    m = await mat(twoStepPlay, twoStepPlay.newSession(problem('two-step-equations', 1), {}));
    await m.run({ type: 'multOpen' });
    expect(m.q('.mo-flyout')).not.toBeNull();
    expect(m.q('.mo-flyout .mo-sign')).toBeNull();
  });
});

const DIV = '.lb-move[data-move="div"]';
const digit = (d) => ({ type: 'digit', digit: d });
const clean = (s) => JSON.stringify({ rows: s.rows.map(({ shown, ...r }) => r), board: s.board, lights: s.lights, history: s.history.length }).replace(/"id":"[^"]*"/g, '');
const solveTo = (play, s, v) => [{ type: 'foldNext' }, ...String(Math.abs(v)).split('').map((d) => digit(Number(d))), ...(v < 0 ? [{ type: 'toggleSign' }] : []), { type: 'check' }, { type: 'placeValue' },
  { type: 'nextLine' }, { type: 'nextLine' }, { type: 'nextLine' }, { type: 'nextLine' }].reduce(play.reduce, s);

describe('Build O, Part 3: the Divide button', () => {
  it('Divide it, 5x = −15: hovering Divide draws a big bar under each side with a blank beneath; the two blanks mirror', async () => {
    m = await mat(divideMovesPlay, divideMovesPlay.newSession(problem('divide-it', 3), {}));
    expect(boardText(m.s.board)).toBe('5x = −15');
    await m.over(DIV);
    expect(m.s.ui.preview).toBe('div');
    expect(m.q('.lx-ghost.is-preview .lx-ghosteq.is-division')).not.toBeNull();
    expect(m.root.querySelectorAll('.lx-ghost .lb-divfrac .mo-divpart').length).toBe(2);
    await m.leave(DIV);
    expect(m.s.ui.preview).toBeFalsy();
  });
  it('click Divide, type 5, Go: the row is in division form with "Same as multiplying by ⅕."; stored exactly as taking ⅕', async () => {
    m = await mat(divideMovesPlay, divideMovesPlay.newSession(problem('divide-it', 3), {}));
    await m.run({ type: 'divPick' });
    expect(m.q(DIV).classList.contains('is-on')).toBe(true);
    await m.run(digit(5));
    expect([...m.root.querySelectorAll('.lx-ghost .mo-divpart')].map((e) => e.textContent.trim())).toEqual(['5', '5']);
    expect(m.q('.lx-ghost .mo-sameas').textContent).toBe('Same as multiplying by ⅕.');
    await m.run({ type: 'go' });
    expect(boardText(m.s.board)).toBe('x = ⅕(−15)');                         // (what is stored and checked: ⅕ of both sides)
    const rows = [...m.root.querySelectorAll('.lb-stack .lb-rowwrap')].map((r) => r.textContent.replace(/\s+/g, ''));
    expect(rows.slice(1)).toEqual(['(5x)5=(−15)5Sameasmultiplyingby⅕.', 'x=(−15)5']);
    expect(m.q(DIV).classList.contains('is-on')).toBe(false);
    // the same move as the Fraction option: the same rows' boards, lights, history and class-sheet record
    const byFrac = [{ type: 'multOpen' }, { type: 'multPick', kind: 'frac' }, digit(1), digit(5), { type: 'go' }].reduce(divideMovesPlay.reduce, divideMovesPlay.newSession(problem('divide-it', 3), {}));
    expect(clean(m.s)).toBe(clean(byFrac));
    const rec = (s) => makeRecord(solveTo(divideMovesPlay, s, -3), { t: 0, pack: 'divide-it', level: 3, problem: '5x = −15' });
    expect(rec(m.s)).toEqual(rec(byFrac));
    expect(byFrac.rows.some((r) => r.shown)).toBe(false);                    // (a Fraction row is drawn as before: ⅕(5x))
  });
  it('a second digit says "Enter a one-digit number to divide by."; −1 is Flip everything (here, explained)', async () => {
    m = await mat(divideMovesPlay, divideMovesPlay.newSession(problem('divide-it', 3), {}));
    await m.run({ type: 'divPick' }, digit(5), digit(5));
    expect([m.s.mopts.entry, m.s.feedback.key]).toEqual(['5', 'dDivOneDigit']);
    expect(m.root.textContent).toContain('Enter a one-digit number to divide by.');
    const s = [{ type: 'divPick' }, { type: 'toggleSign' }, digit(1), { type: 'go' }].reduce(divideMovesPlay.reduce, divideMovesPlay.newSession(problem('divide-it', 3), {}));
    expect(s.feedback.key).toBe('dFlipNo');
  });
  it('Flip everything, dividing by −3: −3 under each bar; "Same as multiplying by −⅓."; dividing by −1 is the Flip button’s move', async () => {
    const s0 = flipPlay.newSession(problem('flip-everything', 4), {});
    m = await mat(flipPlay, s0);
    const a = Math.abs(s0.board.left.find((t) => t.kind === 'x')?.coef ?? s0.board.right.find((t) => t.kind === 'x').coef);
    await m.run({ type: 'divPick' }, { type: 'toggleSign' }, digit(a), { type: 'go' });
    expect(m.q('.lb-work .lb-divbot').textContent).toBe(`−${a}`);
    expect(m.root.textContent).toContain(`Same as multiplying by −`);
    const byDiv = [{ type: 'divPick' }, { type: 'toggleSign' }, digit(1), { type: 'go' }].reduce(flipPlay.reduce, s0);
    const byFlip = [{ type: 'flipPick' }, { type: 'go' }].reduce(flipPlay.reduce, s0);
    expect(clean(byDiv)).toBe(clean(byFlip));
  });
  it('Two-step: Divide is greyed until each side is one term (Build K’s words); the Add card greys every multiply-type move', async () => {
    m = await mat(twoStepPlay, twoStepPlay.newSession(problem('two-step-equations', 1), {}));
    expect(m.q(DIV).classList.contains('is-grey')).toBe(true);
    await m.run({ type: 'divPick' });
    expect(m.s.feedback.key).toBe('wOneTerm');
    await m.run({ type: 'ui', patch: { preview: 'div' } });
    expect(m.s.ui.preview).toBeFalsy();                                         // (a greyed move is not previewed)
    m.off(); m = await mat(addBothPlay, addBothPlay.newSession(problem('add-both', 4), {}));
    expect([m.q('.lb-move.is-grey[data-move="multiply"]'), m.q('.lb-move.is-grey[data-move="divide"]')].every(Boolean)).toBe(true);
    await m.run({ type: 'greyMove', move: 'divide' });
    expect(m.s.feedback.key).toBe('aLater');
  });
  it('Distribute, combine, solve: at a(x ± c) = b a parenthesis counts as one term, so Divide is live', async () => {
    m = await mat(distSolvePlay, distSolvePlay.newSession(problem('distribute-solve', 1), {}));
    expect(m.q(DIV).classList.contains('is-grey')).toBe(false);
  });
});

describe('Build O, Part 4: the Multiply menu has two options again', () => {
  it('Divide it: whole number live but explained (Build P, Part 9; it was greyed in Build O); Fraction live, drawn in multiplication form', async () => {
    m = await mat(divideMovesPlay, divideMovesPlay.newSession(problem('divide-it', 3), {}));
    await m.run({ type: 'multOpen' });
    expect([...m.root.querySelectorAll('.mo-opt')].map((b) => [b.dataset.kind, b.classList.contains('is-grey')])).toEqual([['whole', false], ['unit', false], ['frac', false]]);   // (Build Q: the middle option, one over a blank)
    await m.run({ type: 'multPick', kind: 'frac' }, digit(1), digit(5), { type: 'go' });
    expect(m.q('.lb-work').textContent.replace(/\s+/g, '')).toBe('⅕(5x)=⅕(−15)');
    expect(m.q('.lb-divfrac')).toBeNull();
  });
});

describe('Build O, Part 5: the hint after Undo lights the Divide button', () => {
  it('Divide it: after a wrong value and Undo, the Divide button is lit with its preview; no Multiply options; typing 5 goes into its blank', async () => {
    const s0 = divideMovesPlay.newSession(problem('divide-it', 3), {});
    const wrong = [digit(4), { type: 'check' }, { type: 'placeValue' }, { type: 'nextLine' }, { type: 'nextLine' }, { type: 'nextLine' }, { type: 'nextLine' }, { type: 'undo' }].reduce(divideMovesPlay.reduce, s0);
    m = await mat(divideMovesPlay, wrong);
    expect(m.s.feedback.key).toBe('dReminder');
    expect(m.root.textContent).toContain('divide both sides by 5 (that is, multiply by ⅕)');
    expect(m.q('.mo-flyout')).toBeNull();
    expect(m.q(DIV).classList.contains('is-preview')).toBe(true);
    expect(m.q('.lx-ghost .lx-ghosteq.is-division')).not.toBeNull();
    await m.run(digit(5));
    expect(m.s.mopts).toEqual({ kind: 'div', entry: '5' });
  });
});

describe('Build O: a fraction made with Divide stays in division form in the rows after it', () => {
  it('Distribute, combine, solve: divide 3(x + 2) = 15 by 3, then Add −2: x = (15)/3 − 2', async () => {
    const s0 = distSolvePlay.newSession(problem('distribute-solve', 1), {});
    const factor = s0.board.left.find((t) => t.kind === 'group')?.factor;
    m = await mat(distSolvePlay, s0);
    await m.run({ type: 'divPick' }, digit(factor), { type: 'go' });
    await m.run({ type: 'foldNext' });
    const c = m.s.board.left.find((t) => t.kind === 'num')?.v;
    await m.run({ type: 'choose', move: 'add' }, ...String(Math.abs(c)).split('').map((d) => digit(Number(d))), ...(c > 0 ? [{ type: 'toggleSign' }] : []), { type: 'go' });
    const last = [...m.root.querySelectorAll('.lb-stack .lb-rowwrap')].at(-1);
    expect(last.querySelector('.lb-divfrac')).not.toBeNull();
    expect(last.textContent).not.toMatch(/[½⅓¼⅕⅙]/);
  });
});

describe('Build O: clicking Divide again empties its blank for a new try', () => {
  it('Divide it: Divide, −1, Go (explained), then Divide again: the blank is empty and still open', () => {
    const s = [{ type: 'divPick' }, { type: 'toggleSign' }, digit(1), { type: 'go' }, { type: 'divPick' }].reduce(divideMovesPlay.reduce, divideMovesPlay.newSession(problem('divide-it', 3), {}));
    expect(s.mopts).toEqual({ kind: 'div', entry: '' });
    expect(boardText([digit(5), { type: 'go' }].reduce(divideMovesPlay.reduce, s).board)).toBe('x = ⅕(−15)');
  });
});
