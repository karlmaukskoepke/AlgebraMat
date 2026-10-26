// @vitest-environment happy-dom
// No times sign in written work (Karl, 2026-10-25; Build U, Part 1). A product is a dot (`3 · 4`, `5 · x`) or a number next to its
// parentheses (`−1(−x)`, `⅓(15)`). The × stays only on the Moves panel (its floating symbols and the Multiply menu's option drawings)
// and on the distribute arcs' small drawing. This test plays every Solve it card the way a student might (moves, wrong values, Undo,
// I'm stuck, the menus opened, previews hovered), draws the real screen at every state it reaches, and fails on a × in any row, preview,
// pop-up, hint or I'm stuck text outside those places. Divide it's numbers-only walkthrough and its numeric level are walked too.

import { describe, it, expect, afterEach } from 'vitest';
import { addBothPlay, divideMovesPlay, flipPlay, twoStepPlay, distSolvePlay, bothSidesPlay } from '../src/play/solveCards.js';
import { divideNumericPlay } from '../src/play/divideNumericPlay.js';
import { packById } from '../src/packs/index.js';
import { nextMove, xAlone } from '../src/engine/solveit/honest.js';

const CARDS = [
  ['add-both', addBothPlay, [2, 3, 4, 5, 6]],
  ['divide-it', divideMovesPlay, [2, 3, 4, 5, 6]],
  ['flip-everything', flipPlay, [2, 3, 4, 5, 6]],
  ['two-step-equations', twoStepPlay, [1, 2, 3, 4, 5, 6, 7]],
  ['distribute-solve', distSolvePlay, [1, 2, 3, 4, 5]],
  ['variables-both-sides', bothSidesPlay, [1, 2, 3, 4, 5]],
];
const TIMES = /×/;
const digits = (n) => [...String(Math.abs(n))].map((d) => ({ type: 'digit', digit: Number(d) })).concat(n < 0 ? [{ type: 'toggleSign' }] : []);
// the things a student can bring up or open at a state, each tried from it
const EXTRAS = [
  [{ type: 'stuck' }], [{ type: 'stuck' }, { type: 'stuck' }], [{ type: 'teach' }],
  [{ type: 'multOpen' }], [{ type: 'multOpen' }, { type: 'ui', patch: { preview: 'whole' } }], [{ type: 'multOpen' }, { type: 'ui', patch: { preview: 'unit' } }],
  [{ type: 'multOpen' }, { type: 'ui', patch: { preview: 'frac' } }], [{ type: 'ui', patch: { preview: 'div' } }], [{ type: 'ui', patch: { preview: 'flip' } }],
  [{ type: 'multOpen' }, { type: 'multPick', kind: 'whole' }, ...digits(5), { type: 'go' }],
  [{ type: 'multOpen' }, { type: 'multPick', kind: 'whole' }, ...digits(-1), { type: 'go' }],
  [{ type: 'flipPick' }, { type: 'go' }], [{ type: 'divPick' }, ...digits(-3), { type: 'go' }],
  [{ type: 'multOpen' }, { type: 'multPick', kind: 'frac' }, { type: 'digit', digit: 1 }, { type: 'digit', digit: 3 }, { type: 'go' }],
];

// one action (an action a card does not take leaves the state as it was)
const act = (P, s, a) => { const n = P.reduce(s, a); return n && typeof n === 'object' ? n : s; };
function run(P, s, actions) {
  for (const a of actions) s = act(P, s, a);
  return s;
}

// what is drawn, outside the Moves panel and the distribute arcs' drawing, and what each pop-up says
function writtenText(P, s) {
  const root = document.createElement('div');
  root.append(P.renderMat(s, {}));
  root.querySelectorAll('.lx-panel, .dx-times').forEach((e) => e.remove());
  const text = root.textContent;
  root.replaceChildren();
  return [text, s.feedback ? P.feedbackText(s.feedback) ?? '' : ''];
}

afterEach(() => { document.body.replaceChildren(); });

describe('Build U, Part 1: no times sign anywhere the problem is written out', () => {
  for (const [pack, P, levels] of CARDS) {
    it(`${pack}: every level, seeds 1-2 (two problems each), the honest path and what can be opened at each state`, async () => {
      const states = [];
      const look = (s, where) => states.push([s, where]);
      for (const lv of levels) for (const seed of [1, 2]) for (const p of packById(pack).generate(lv, seed).slice(0, 2)) {
        let s = run(P, P.newSession({ ...p, logLevel: lv }, {}), [{ type: 'introNext' }, { type: 'spotDismiss' }]);
        for (let guard = 0; guard < 14 && s.board && s.stage !== 'done'; guard++) {
          const where = `${pack} L${lv} seed ${seed}, step ${guard}`;
          look(s, where);
          for (const extra of EXTRAS) {
            const e = run(P, s, extra);
            if (e !== s) look(e, `${where} after ${JSON.stringify(extra[0])}…`);
          }
          if (xAlone(s.board)) {
            // a wrong value, its check and the hint after Undo, then the right one
            let w = run(P, s, [{ type: 'focus', target: 'answer' }, ...digits(s.problem.x + 1), { type: 'check' }]);
            for (let k = 0; k < 6 && w.sub?.placing; k++) w = act(P, w, { type: 'placeValue', index: k });
            for (let k = 0; k < 12 && w.sub; k++) { const n = act(P, w, { type: 'nextLine' }); look(n, `${where}, the check`); if (n === w) break; w = n; }
            look(act(P, w, { type: 'undo' }), `${where}, Undo after a wrong value`);
            break;
          }
          const m = nextMove(s, { grab: pack !== 'divide-it' && pack !== 'flip-everything' });
          if (!m) break;
          const before = JSON.stringify(s.board);
          s = run(P, s, m);
          if (JSON.stringify(s.board) === before || s.needUndo) break;
          look(s, `${where}, the move made`);
          if (s.unfolded && !xAlone(s.board)) s = act(P, s, { type: 'foldNext' });
        }
      }
      // (drawn after the walks, letting the page's timers go every few drawings: a drawing left waiting on a timer is a lot of memory)
      const fails = [];
      for (const [i, [s, where]] of states.entries()) {
        for (const text of writtenText(P, s)) if (TIMES.test(text)) fails.push(`${where}: ${text.slice(0, 160)}`);
        if (i % 20 === 19) await window.happyDOM?.abort?.();
      }
      expect(states.length).toBeGreaterThan(50);
      expect(fails, `${fails.length} texts with a ×:\n${fails.slice(0, 10).join('\n')}`).toEqual([]);
    }, 120000);
  }

  it("Divide it's numbers-only walkthrough and numeric level: every step", () => {
    const P = divideNumericPlay;
    const fails = [];
    for (const p of packById('divide-it').generate(1, 7)) {
      let s = P.newSession({ ...p, logLevel: 1 });
      for (let i = 0; i < 40 && s; i++) {
        for (const text of writtenText(P, s)) if (TIMES.test(text.replace(/× ⅓÷ 3/, ''))) fails.push(text.slice(0, 160));   // (the walkthrough's move button, "× ⅓ / ÷ 3")
        const next = ['wtNext', 'go', 'next', 'quizNext'].map((type) => P.reduce(s, { type })).find((n) => n && n !== s)
          ?? ['left', 'right'].map((side) => P.reduce(s, { type: 'takeSide', side })).find((n) => n && n !== s)
          ?? P.reduce(s, { type: 'quiz', value: 'keeps' });
        if (!next || next === s) break;
        s = next;
      }
    }
    expect(fails).toEqual([]);
  });
});
