// @vitest-environment happy-dom
// Build N (2026-10-24): a student could not type in Divide it's Divide blank. One test for each way typing failed, found by the sweep
// (tests/typing/sweep.mjs) and by the standing test (tests/canType.test.js): the real screen, the real keys, as a student does it.

import { describe, it, expect, afterEach } from 'vitest';
import { addBothPlay, divideMovesPlay, flipPlay, twoStepPlay, distSolvePlay } from '../src/play/solveCards.js';
import { packById } from '../src/packs/index.js';

const problem = (pack, level, i = 0, seed = 7) => ({ ...packById(pack).generate(level, seed)[i], logLevel: level });
const settle = () => new Promise((r) => setTimeout(r, 0));

// the Mat and the keypad, as the app draws them, with the card's keys bound
async function mat(play, s) {
  document.body.replaceChildren();
  const root = document.createElement('div');
  const pad = document.createElement('div');
  document.body.append(root, pad);
  const m = { s, root, pad };
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
    const a = b && play.matAction(b.dataset);
    if (a) m.dispatch(a);
  });
  controls.update(m.s);
  root.replaceChildren(play.renderMat(m.s, {}));
  m.press = async (...keys) => { for (const key of keys) { (document.activeElement ?? document.body).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })); await settle(); } };
  m.click = async (sel) => { const e = root.querySelector(sel); e.focus(); e.click(); await settle(); };   // (a click focuses a button)
  m.run = async (...actions) => { for (const a of actions) m.dispatch(a); await settle(); };
  m.text = (sel) => root.querySelector(sel)?.textContent.trim() ?? null;
  m.padOn = () => [...pad.querySelectorAll('button[data-digit]')].every((b) => !b.disabled);
  await settle();
  return m;
}
const DIV_BOX = '.mo-divblank:not(.is-mirror) .mo-divpart';
const openDivide = [{ type: 'multOpen' }, { type: 'multPick', kind: 'div' }];
let m = null;
afterEach(() => { m?.off?.(); m = null; document.body.replaceChildren(); });

describe('Build N: the Divide blank takes a typed number', () => {
  for (const [name, play, pack] of [['Divide it', divideMovesPlay, 'divide-it'], ['Flip everything', flipPlay, 'flip-everything']]) {
    it(`${name}: click the Divide box, then type 3 (the focus stayed on the box and the page skipped every key)`, async () => {
      m = await mat(play, play.newSession(problem(pack, 4), {}));
      await m.run(...openDivide);
      await m.click(DIV_BOX);
      await m.press('3');
      expect(m.text(DIV_BOX)).toBe('3');
      expect(document.activeElement).toBe(m.root.querySelector(DIV_BOX));
    });
    it(`${name}: on the problem after a correct guess (a move first), the Divide blank takes the 3 and the keypad is on`, async () => {
      m = await mat(play, play.newSession(problem(pack, 4), { forceMove: true }));
      await m.run(...openDivide);
      expect(play.padOpen(m.s)).toBe(true);
      expect(m.padOn()).toBe(true);
      await m.press('3');
      expect(m.text(DIV_BOX)).toBe('3');
    });
  }

  it('Divide it: after a wrong answer and Undo, the hint shows the Divide blank; typing 3 goes into it, not into x =', async () => {
    const p = problem('divide-it', 4);                       // 3x = 6
    m = await mat(divideMovesPlay, divideMovesPlay.newSession(p, {}));
    await m.run({ type: 'focus', target: 'answer' }, { type: 'digit', digit: 9 }, { type: 'check' }, { type: 'placeValue' }, ...Array(4).fill({ type: 'nextLine' }));
    await m.run({ type: 'undo' });
    expect(m.s.ui.preview).toBe('div');                      // the hint lights Divide and shows its blank
    await m.press('3');
    expect(m.text(DIV_BOX)).toBe('3');
    expect(m.s.entry).toBe('');                              // nothing went into x =
    expect(document.activeElement).toBe(m.root.querySelector(DIV_BOX));
  });

  // (Two-step divides once each side is one term: tests/canType.test.js reaches it there)
  for (const [name, play, pack, level] of [['Divide it', divideMovesPlay, 'divide-it', 4], ['Flip everything', flipPlay, 'flip-everything', 4],
    ['Distribute, combine, solve', distSolvePlay, 'distribute-solve', 1]]) {
    it(`${name}: on touch, the keypad comes up for the Divide blank and the Multiply blank`, async () => {
      let opened = 0;
      const s0 = play.newSession(problem(pack, level), {});
      for (const kind of ['div', 'whole']) {
        const s = [{ type: 'multOpen' }, { type: 'multPick', kind }].reduce(play.reduce, s0);
        if (s.mopts?.kind !== kind) continue;                // (an option greyed on this card or level)
        opened += 1;
        expect(play.padOpen(s), `${name} ${kind}`).toBe(true);
      }
      expect(opened).toBeGreaterThan(0);
    });
  }

  it('Divide it: while an error waits for Undo, the keypad stays down', async () => {
    const s = [...openDivide, { type: 'digit', digit: 4 }, { type: 'go' }].reduce(divideMovesPlay.reduce, divideMovesPlay.newSession(problem('divide-it', 4), {}));
    expect(s.fail).toBeTruthy();
    expect(divideMovesPlay.padOpen({ ...s, typing: 'answer' })).toBe(false);
  });
});

describe('Build N: x = keeps the cursor while the keys go into it', () => {
  it('Divide it: click x =, type 1: x = still shows the cursor and has the focus', async () => {
    m = await mat(divideMovesPlay, divideMovesPlay.newSession(problem('divide-it', 4), {}));
    await m.click('[data-fk="answer"]');
    await m.press('1');
    const x = m.root.querySelector('[data-fk="answer"]');
    expect(x.textContent.trim()).toBe('1');
    expect(x.classList.contains('is-focus')).toBe(true);
    expect(document.activeElement).toBe(x);
  });

  it('Two-step equations: after a combine, a Backspace that only clears the message leaves x = its cursor', async () => {
    const p = problem('two-step-equations', 1);
    let s = twoStepPlay.newSession(p, {});
    s = { ...s, ui: { ...s.ui, focus: 'answer' }, feedback: { key: 'lxCombined', params: {} } };
    m = await mat(twoStepPlay, s);
    await m.press('Backspace');
    expect(m.s.ui.focus).toBe('answer');
    await m.press('3');
    expect(m.text('[data-fk="answer"]')).toBe('3');
    expect(m.root.querySelector('[data-fk="answer"]').classList.contains('is-focus')).toBe(true);
  });
});

describe('Build N: the Add blank and the blanks under it', () => {
  for (const [name, play, pack, level] of [['Add to both sides', addBothPlay, 'add-both', 4], ['Two-step equations', twoStepPlay, 'two-step-equations', 1]]) {
    it(`${name}: Add, click x =, Go with the box empty: the box shakes and the keys go back to it`, async () => {
      m = await mat(play, play.newSession(problem(pack, level), {}));
      await m.run({ type: 'choose', move: 'add' }, { type: 'focus', target: 'answer' }, { type: 'go' });
      await m.press('3');
      expect(m.text('[data-fk="blank"]')).toBe('3');
      expect(m.s.entry).toBe('');
      expect(document.activeElement).toBe(m.root.querySelector('[data-fk="blank"]'));
    });
  }

  it('Add to both sides: with x alone, Add, then Esc: the focus goes to x =, where the keys go (it went back to the Add button)', async () => {
    const p = problem('add-both', 4);
    const s = [{ type: 'choose', move: 'add' }, ...[...String(Math.abs(p.a))].map((d) => ({ type: 'digit', digit: Number(d) })), ...(p.a > 0 ? [{ type: 'toggleSign' }] : []), { type: 'go' }]
      .reduce(addBothPlay.reduce, addBothPlay.newSession(p, {}));
    m = await mat(addBothPlay, s);
    await m.run({ type: 'choose', move: 'add' }, { type: 'lxCancel' });
    expect(m.s.ui.focus).toBe('add');
    await m.press('3');
    expect(m.text('[data-fk="answer"]')).toBe('3');
    expect(document.activeElement).toBe(m.root.querySelector('[data-fk="answer"]'));
  });

  it('Distribute, combine, solve: Multiply opened while the distribute blanks are open closes them; the Divide blank takes the keys', async () => {
    const p = problem('distribute-solve', 1);
    const s0 = distSolvePlay.newSession(p, {});
    const g = [...s0.board.left, ...s0.board.right].find((t) => t.kind === 'group');
    m = await mat(distSolvePlay, s0);
    await m.run({ type: 'lxDistribute', id: g.id });
    expect(m.s.lx.distribute).toBeTruthy();
    await m.run(...openDivide);
    expect(m.s.lx.distribute).toBeFalsy();
    await m.press('3');
    expect(m.text(DIV_BOX)).toBe('3');
    expect(document.activeElement).toBe(m.root.querySelector(DIV_BOX));
  });

  it('Distribute, combine, solve: the Divide preview is not drawn over an open distribute blank (it hid the blank the keys go to)', async () => {
    const p = problem('distribute-solve', 1);
    const s0 = distSolvePlay.newSession(p, {});
    const g = [...s0.board.left, ...s0.board.right].find((t) => t.kind === 'group');
    const s = [{ type: 'lxDistribute', id: g.id }, { type: 'ui', patch: { preview: 'div' } }].reduce(distSolvePlay.reduce, s0);
    expect(s.ui.preview).toBeFalsy();
  });
});
