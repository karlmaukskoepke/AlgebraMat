// @vitest-environment happy-dom
// Build AF, Part 1 (Karl, 2026-11-09): one box for a fraction answer, typed as it is written (`3/2`), in Strange solutions' answer and in
// Try a number. The typing sweep's cases (Build N) on both places, by the keyboard and by the touch keypad: 5, −4, 3/2, −3/2, a slash
// first, a second slash, 3/ then Enter, 3/0, Backspace across the slash. Also: the unsimplified nudge on 15/6 records as before, and the
// no-help mode treats the box the same. The real screen and the real keys, as tests/buildN.test.js draws them.

import { describe, it, expect, afterEach } from 'vitest';
import { strangePlay as P } from '../src/play/solveCards.js';
import { packById } from '../src/packs/index.js';
import { nextMove } from '../src/engine/solveit/honest.js';
import { makeRecord } from '../src/engine/eventlog.js';
import { setNoHelp } from '../src/engine/noHelp.js';

const settle = () => new Promise((r) => setTimeout(r, 0));
const problem = (level, seed, i = 0) => ({ ...packById('strange-solutions').generate(level, seed)[i], logLevel: level });
const act = (s, a) => { const n = P.reduce(s, a); return n && typeof n === 'object' ? n : s; };
// the honest moves until x is alone (or gone), as a student would make them
function toEnd(s) {
  s = act(act(s, { type: 'introNext' }), { type: 'spotDismiss' });
  for (let k = 0; k < 14; k++) { const m = nextMove(s); if (!m) break; for (const a of m) s = act(s, a); }
  return s;
}
// the answer's place: Level 1, seed 7, x alone. Try a number's place: Level 4, seed 931, problem 4 (5 + x + x = 2x + 5), picked, opened.
const ANSWER = () => toEnd(P.newSession(problem(1, 7), {}));
const TRY = () => {
  const s = toEnd(P.newSession(problem(4, 931, 3), {}));
  return act(act(s, { type: 'conclude', pick: s.problem.type }), { type: 'tryOpen' });
};

async function mat(s) {
  document.body.replaceChildren();
  const root = document.createElement('div');
  root.id = 'mat';
  const pad = document.createElement('div');
  pad.id = 'controls';
  document.body.append(root, pad);
  const m = { s, root, pad };
  const controls = P.buildControls(pad, (a) => m.dispatch(a));
  m.dispatch = (a) => {
    const n = P.reduce(m.s, a);
    if (!n || typeof n !== 'object' || n === m.s) return;
    m.s = n;
    controls.update(m.s);
    root.replaceChildren(P.renderMat(m.s, {}));
  };
  m.off = P.bindMat(root, m.dispatch, () => m.s);
  root.addEventListener('click', (e) => {                    // the page's clicks on the Mat (main.js)
    const b = e.target.closest('[data-action]');
    const a = b && P.matAction(b.dataset);
    if (a) m.dispatch(a);
  });
  controls.update(m.s);
  root.replaceChildren(P.renderMat(m.s, {}));
  await settle();
  m.box = () => root.querySelector('.sv-trybox') ?? root.querySelector('.lx-answer .sv-ansbox:not(.sv-fracchip)');
  m.text = () => m.box()?.textContent.trim() ?? null;
  m.green = () => root.querySelector('.btn-forward');
  m.click = async (el) => { el.focus(); el.click(); await settle(); };
  m.key = async (key) => { (document.activeElement ?? document.body).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })); await settle(); };
  m.padKey = async (sel) => { const b = pad.querySelector(sel); expect(b && !b.disabled && !b.hidden, `the keypad's ${sel}`).toBe(true); b.click(); await settle(); };
  return m;
}

// a value typed one key at a time: by the keyboard (the minus key) or the keypad (±, the digits, the / key, ⌫)
async function type(m, text, how) {
  for (const ch of text) {
    if (how === 'keys') await m.key(ch === '<' ? 'Backspace' : ch);
    else if (ch === '-') await m.padKey('[data-action="toggleSign"]');
    else if (ch === '/') await m.padKey('[data-action="typeChar"][data-ch="/"]');
    else if (ch === '<') await m.padKey('[data-action="backspace"]');
    else await m.padKey(`[data-action="digit"][data-digit="${ch}"]`);
  }
}

let m = null;
afterEach(() => { m?.off?.(); m = null; setNoHelp(false); document.body.replaceChildren(); });

const CASES = [
  ['5', '5', true], ['-4', '−4', true], ['3/2', '3/2', true], ['-3/2', '−3/2', true],
  ['/', '', false],                       // a slash first: ignored
  ['3//2', '3/2', true],                  // a second slash: ignored
  ['3/', '3/', false],                    // the green button waits for the bottom
  ['3/2<<', '3', true],                   // Backspace across the slash
  ['3/2<<<5/4', '5/4', true],
];

for (const [place, start, checked] of [['the answer', ANSWER, (s) => Boolean(s.sub)], ['Try a number', TRY, (s) => Boolean(s.trial?.sub)]]) {
  describe(`Build AF: one box, ${place}`, () => {
    for (const how of ['keys', 'pad']) {
      for (const [typed, shows, ready] of CASES) {
        it(`${how === 'keys' ? 'keyboard' : 'touch keypad'}: ${typed.replace(/</g, '⌫')} shows “${shows}”; the green button ${ready ? 'is on' : 'waits'}`, async () => {
          m = await mat(start());
          await m.click(m.box());
          await type(m, typed, how);
          expect(m.text()).toBe(shows || '');
          expect(m.green().disabled).toBe(!ready);
          expect(m.box().getAttribute('aria-label')).toBe('x equals');
          await m.key('Enter');
          expect(checked(m.s)).toBe(ready);
          if (typed === '3/') expect(m.text()).toBe('3/');          // (3/ then Enter: nothing checked, nothing said)
        });
      }
      it(`${how === 'keys' ? 'keyboard' : 'touch keypad'}: 3/0 then Enter is refused: “The bottom of a fraction can’t be 0.”`, async () => {
        m = await mat(start());
        await m.click(m.box());
        await type(m, '3/0', how);
        expect(m.text()).toBe('3/0');
        await m.key('Enter');
        expect(checked(m.s)).toBe(false);
        expect(m.root.textContent).toContain('The bottom of a fraction can’t be 0.');
      });
    }
    it('the keyboard: a minus after the front and letters are ignored, with no message', async () => {
      m = await mat(start());
      await m.click(m.box());
      await type(m, '3-q/-2', 'keys');
      expect(m.text()).toBe('3/2');
    });
    it('the keypad has its / key here; the box is one field, named “x equals”, with no number shown before anything is typed', async () => {
      m = await mat(start());
      expect(m.pad.querySelector('[data-ch="/"]').hidden).toBe(false);
      expect(m.box().closest('.sv-tryrow, .lx-answer').querySelectorAll('.sv-ansbox').length).toBe(1);
      expect(m.text()).toBe('');
      expect(m.box().getAttribute('placeholder')).toBe(null);
    });
  });
}

describe('Build AF: what does not change', () => {
  it('after Enter, the value is drawn stacked in the check, and the box keeps it as typed', async () => {
    m = await mat(ANSWER());
    await m.click(m.box());
    await type(m, '3/2', 'keys');
    await m.key('Enter');
    const chip = m.root.querySelector('.sv-fracchip');
    expect(chip.textContent.trim()).toBe('3/2');
    expect(chip.querySelector('.lx-sfrac')).toBe(null);
    m.dispatch({ type: 'placeValue', index: 0 });
    m.dispatch({ type: 'placeValue', index: 1 });
    await settle();
    expect(m.root.querySelector('.sv-checklist .lx-sfrac, .lb-stack .lx-sfrac')).not.toBe(null);
  });
  it('15/6: “Can you simplify this further?”, recorded as before (15/6 → unsimplified)', async () => {
    m = await mat(ANSWER());
    await m.click(m.box());
    await type(m, '15/6', 'keys');
    await m.key('Enter');
    expect(m.root.textContent).toContain('Can you simplify this further?');
    expect(m.text()).toBe('15/6');                                    // (the box keeps it, to look at)
    expect(makeRecord(m.s, { t: 0, pack: 'strange-solutions', level: 1, problem: 'p' }).answers).toEqual([{ typed: '15/6', tag: 'unsimplified' }]);
    await type(m, '5', 'keys');                                        // (the first digit starts again)
    expect(m.text()).toBe('5');
  });
  it('the no-help mode types the same', async () => {
    setNoHelp(true);
    m = await mat(ANSWER());
    await m.click(m.box());
    await type(m, '-3/2', 'keys');
    expect(m.text()).toBe('−3/2');
    await type(m, '/', 'keys');
    expect(m.text()).toBe('−3/2');
  });
});
