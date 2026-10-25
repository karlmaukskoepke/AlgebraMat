// @vitest-environment happy-dom
// Build T, Part 2: help talks in the form on the screen. Once a row has been divided, every reminder, hint after Undo, I'm stuck rung,
// refused drag, product pop-up and wrong-value pop-up says it as a division if the row was made with the Divide button (drawn with a
// fraction bar), and as a fraction of a number if it was made with the Fraction option (drawn `⅓(15)`). Every card and level, both forms.

import { describe, it, expect } from 'vitest';
import { bothSidesPlay, twoStepPlay, distSolvePlay, divideMovesPlay, flipPlay } from '../src/play/solveCards.js';
import { packById } from '../src/packs/index.js';
import { nextMove, xAlone } from '../src/engine/solveit/honest.js';

const digits = (n) => [...String(Math.abs(n))].map((d) => ({ type: 'digit', digit: Number(d) })).concat(n < 0 ? [{ type: 'toggleSign' }] : []);
// fraction words: a unit fraction, "of both sides", "fraction" (the fraction bar is the division's own drawing: the exception)
const FRACTION_WORDS = /[½⅓¼⅕⅙]|\b1\/\d|fraction(?! bar)|of both sides/i;
// division words
const DIVIDE_WORDS = /divid|÷/i;

// the move that divides by a, in the form asked for
const divideBy = (a, form) => (form === 'div' ? [{ type: 'divPick' }, ...(a < 0 ? [{ type: 'typeChar', ch: '-' }] : []), ...digits(Math.abs(a)), { type: 'go' }]
  : [{ type: 'multOpen' }, { type: 'multPick', kind: 'frac' }, ...(a < 0 ? [{ type: 'typeChar', ch: '-' }] : []), { type: 'digit', digit: 1 }, ...digits(Math.abs(a)), { type: 'go' }]);
const isDivide = (m) => m?.[0]?.type === 'divPick';

// a run of actions, Got it and pop-ups answered first, as a student would
function run(P, s, actions) {
  for (const a of [{ type: 'introNext' }, { type: 'spotDismiss' }, ...actions]) s = P.reduce(s, a);
  return s;
}
const fracTerms = (s) => [...(s.board?.left ?? []), ...(s.board?.right ?? [])].filter((t) => t.kind === 'frac' || (t.kind === 'neg' && s.divIds?.includes(t.id)));

// every help text a student can bring up at this state
function helpTexts(P, s) {
  const out = [];
  const said = (st) => { if (st?.feedback) out.push(P.feedbackText(st.feedback)); };
  said(s);
  let h = s;
  for (let i = 0; i < 3; i++) { h = P.reduce(h, { type: 'stuck' }); said(h); }
  said(P.reduce(s, { type: 'teach' }));
  // each term dragged across the = (a refusal says why)
  for (const side of ['left', 'right']) for (const t of s.board[side]) said(P.reduce(s, { type: 'lxDrop', id: t.id, slot: { side: side === 'left' ? 'right' : 'left', at: 0 }, how: 'pointer' }));
  // a product worked out wrong, then Undo, then I'm stuck
  for (const t of fracTerms(s)) {
    let c = P.reduce(s, { type: 'lxCalc', id: t.id });
    if (c === s) continue;
    c = run(P, c, [...digits(97), { type: 'lxApply' }]); said(c);
    c = P.reduce(c, { type: 'undo' }); said(c);
    said(P.reduce(c, { type: 'stuck' }));
  }
  // a wrong value checked, then Undo, then the hint
  if (Number.isInteger(s.problem?.x)) {
    let w = run(P, s, [{ type: 'focus', target: 'answer' }, ...digits(s.problem.x + 1), { type: 'check' }]);
    for (let k = 0; k < 6 && w.sub?.placing; k++) w = P.reduce(w, { type: 'placeValue', index: k });
    for (let k = 0; k < 12 && w.sub; k++) { const n = P.reduce(w, { type: 'nextLine' }); if (n === w) break; w = n; }
    said(w);
    w = P.reduce(w, { type: 'undo' }); said(w);
    said(P.reduce(w, { type: 'stuck' }));
  }
  return out.filter(Boolean);
}

const CARDS = [['divide-it', divideMovesPlay, [3, 4, 5, 6]], ['flip-everything', flipPlay, [4, 5, 6]], ['two-step-equations', twoStepPlay, [1, 2, 3, 4, 5, 6, 7]],
  ['distribute-solve', distSolvePlay, [1, 2, 3, 4, 5]], ['variables-both-sides', bothSidesPlay, [1, 2, 3, 4, 5]]];

describe('Build T, Part 2: after dividing, help uses the form on the screen', () => {
  for (const [pack, P, levels] of CARDS) {
    it(`${pack}: every level, seeds 1-2, both forms`, () => {
      let checked = 0;
      for (const lv of levels) for (const seed of [1, 2]) for (const p of packById(pack).generate(lv, seed)) for (const form of ['div', 'frac']) {
        let s = P.newSession({ ...p, logLevel: lv }, {});
        // Distribute: divide first when the parenthesis is alone (the Q shapes), as well as the honest path's divide at the end
        const group = [...s.board.left, ...s.board.right].find((t) => t.kind === 'group');
        const first = pack === 'distribute-solve' && group && s.board.left.length === 1 && s.board.right.length === 1 && Math.abs(group.factor) <= 6 ? divideBy(group.factor, form) : null;
        for (let guard = 0; guard < 14 && s.board && !xAlone(s.board) && s.stage !== 'done'; guard++) {
          const m = first && guard === 0 ? first : nextMove(s, { grab: pack !== 'divide-it' && pack !== 'flip-everything' });
          if (!m) break;
          const before = JSON.stringify(s.board);
          s = run(P, s, isDivide(m) ? divideBy(Number(m.filter((a) => a.type === 'digit').map((a) => a.digit).join('')) * (m.some((a) => a.type === 'typeChar' || a.type === 'toggleSign') ? -1 : 1), form) : m);
          if (JSON.stringify(s.board) === before || s.needUndo) break;
          if (s.unfolded && !xAlone(s.board)) s = P.reduce(s, { type: 'foldNext' });
          if (!fracTerms(s).length) continue;
          const div = fracTerms(s).every((t) => s.divIds?.includes(t.id));
          for (const text of helpTexts(P, s)) {
            const where = `${pack} L${lv} seed ${seed} (${form}) at ${JSON.stringify(s.board).length}: “${text}”`;
            if (div) expect(text, where).not.toMatch(FRACTION_WORDS); else expect(text, where).not.toMatch(DIVIDE_WORDS);
            checked += 1;
          }
        }
        if (s.board && xAlone(s.board) && fracTerms(s).length) {
          const div = fracTerms(s).every((t) => s.divIds?.includes(t.id));
          for (const text of helpTexts(P, s)) {
            const where = `${pack} L${lv} seed ${seed} (${form}) at x alone: “${text}”`;
            if (div) expect(text, where).not.toMatch(FRACTION_WORDS); else expect(text, where).not.toMatch(DIVIDE_WORDS);
            checked += 1;
          }
        }
      }
      expect(checked).toBeGreaterThan(20);
    });
  }
});
