// The Divide it screen (SPEC-DIVIDE-IT.md rev 2.1) on the shared Solve it loop: the line with its prompt, the work stack
// (the equation, each earlier move folded to one row, the current move's work, the x = [ ] row with Check under it, the substitution),
// the fractions row ("Take × ½ × ⅓ × ¼ × ⅕ × ⅙ of both sides", each stacked × ⅓ over ÷ 3, its room always kept), Undo, the help row,
// and the Move / Why? panel with "Take a fraction" active. The group diagram (counters scaffold; I'm stuck at x alone) draws in
// its own reserved area under the panel, so the work stack never leaves the screen.

import { html } from './addBothMat.js';
import { movePanel } from './lightScreen.js';
import { lineBlock, stackRows, answerBlock, helpRow, undoRow } from './solveScreen.js';
import { groupDiagram } from './groupDiagram.js';
import { divideFeedbackText } from './divideFeedback.js';
import { solve, xAlone, coefOf, pileSize, DEAL_ROUND_LEVEL, DIVIDE_SPOT } from '../engine/divideMoves.js';
import { spotOf } from '../engine/spotlight.js';
import { spotlightLayer, findSolveTarget } from './spotlight.js';
import { FRACTIONS } from '../engine/divide.js';
import { fractionText } from '../engine/solveTerms.js';

// "Take [½][⅓][¼][⅕][⅙] of both sides": live once the move is chosen; greyed (never hidden) before that and while counters are dealt.
function fractionRow(s) {
  const on = s.stage === 'moves' && s.menu === 'fraction' && !s.sub && !s.deal;
  const row = html('div', `lb-fractionrow${on ? '' : ' is-off'}`, [html('strong', '', ['Take'])]);
  const forcedOnly = s.forced && !xAlone(s.board) ? coefOf(s.board) : null;
  for (const n of FRACTIONS) {
    const b = html('button', `btn lb-frac-btn${s.hint?.kind === 'fraction' && s.hint.n === n && on ? ' is-target' : ''}`, [html('span', 'lb-frac-main', [`× ${fractionText(n)}`]), html('span', 'lb-frac-sub', [`÷ ${n}`])], { type: 'button', 'data-action': 'take', 'data-n': n, 'aria-label': `Take ${fractionText(n)} of both sides` });
    b.disabled = !on || (forcedOnly !== null && n !== forcedOnly);
    row.append(b);
  }
  row.append(html('strong', '', ['of both sides']));
  return row;
}

// ---------- the group diagram, in its reserved area ----------

function diagramOptions(s) {
  if (s.diag) {
    const d = s.diag;
    const got = d.groups ? d.groups.reduce((a, b) => a + b, 0) : 0;
    const even = d.groups && got === d.size && d.groups.every((c) => c === d.groups[0]);
    return {
      n: d.n, boxes: 0, size: d.size, neg: d.neg, groups: d.groups, pile: d.groups ? d.size - got : 0, kept: d.kept,
      tap: d.groups && d.kept === null ? (even ? 'keep' : 'deal') : null, dealt: got, even, round: d.groups && d.kept === null && got < d.size,
    };
  }
  const b = s.board;
  const size = pileSize(b);
  const neg = b.right[0].kind === 'num' && b.right[0].v < 0;
  if (s.deal) {
    const d = s.deal;
    const got = d.groups.reduce((a, c) => a + c, 0);
    const even = got === size && d.groups.every((c) => c === d.groups[0]);
    return { n: d.n, boxes: coefOf(b), size, neg, groups: d.groups, pile: size - got, kept: null, tap: even ? 'keep' : 'deal', dealt: got, even, round: got < size };
  }
  return { n: 1, boxes: coefOf(b), size, neg, groups: null, pile: size, kept: null, tap: null, outline: s.hint?.kind === 'coef' || s.scaffold, dealt: 0, even: false, round: false };
}

function diagramBlock(s) {
  const area = html('div', 'sv-diagram');
  // what the student made stays after the fraction is applied, the kept group marked, until Next folds the move (loop §6)
  if (s.pic && !s.scaffold) {
    const pc = s.pic;
    area.append(groupDiagram({ n: pc.n, boxes: pc.boxes, size: pc.size, neg: pc.neg, groups: pc.groups, pile: 0, kept: pc.kept, tap: null, caption: `You kept 1 of the ${pc.n} groups.` }));
    return area;
  }
  if (!s.scaffold) return area;
  const o = diagramOptions(s);
  // the groups' sizes are printed only while they are uneven; once they are even, the size of a group is what the student finds
  const readout = !o.groups || s.diag?.guided ? '' : (o.even || s.diag ? `${o.dealt} of ${o.size} shared` : `${o.dealt} of ${o.size} shared · groups hold ${o.groups.join(', ')}`);
  area.append(groupDiagram({ ...o, caption: readout }));
  const row = html('div', 'dv-actions');
  if (o.groups && o.even && o.tap === 'keep') row.append(html('p', 'dv-hint', ['Tap a group to keep it.']));
  else if (o.round && s.level >= DEAL_ROUND_LEVEL && o.size - o.dealt >= o.n) row.append(html('button', 'btn', ['Deal a round'], { type: 'button', 'data-action': 'dealRound' }));
  area.append(row);
  return area;
}

function bareBlock(s) {
  const block = html('div', 'lb-eqblock');
  block.append(html('div', 'lb-stack', [html('div', 'lb-rows', stackRows(s)), answerBlock(s, solve)]));
  const wrongGuess = s.sub?.kind === 'guess' && !s.sub.ok && s.sub.step >= solve.subTotal(s.sub);
  block.append(fractionRow(s), undoRow(s, { wrongGuess, cue: Boolean(s.fail) }));
  return block;
}

// "Solved for x" is green when x is alone; Smaller numbers and One box are judged after the move; every other Why? box is a faint outline.
function panelBlock(s) {
  const mapLight = (v) => (v === 'neutral' ? 'off' : v);
  return movePanel({
    active: 'fraction', menu: s.menu, typing: s.typing, amountEntry: '',
    disabled: s.stage === 'done' || Boolean(s.sub),
    locked: false,
    // the forced-move problem: the move is the one thing pointed at (a steady ring and the pulse) until one is made
    target: solve.moveOwed(s) && !s.menu && !s.sub && !xAlone(s.board) && !s.scaffold,
    lights: { fewer: 'off', solved: xAlone(s.board) ? 'green' : 'off' },
    whys: { fewer: 'off', nofrac: 'off', smaller: mapLight(s.lights.smaller), onebox: mapLight(s.lights.onebox), noopp: 'off', xleft: 'off', simple: 'off' },
  });
}

export function renderDivideScreen(s) {
  const wrap = html('div', 'lb-game lb-eqcard sv-card');
  // while a spotlight is up, its message is in the pop-up and the line holds the prompt only (Build C, Part 2)
  const sp = spotOf(s, DIVIDE_SPOT);
  wrap.append(lineBlock(sp ? { ...s, feedback: { key: DIVIDE_SPOT.prompt(s), params: {} } } : s, divideFeedbackText));
  const body = html('div', 'lb-body');
  const main = html('div', 'lb-main');
  main.append(bareBlock(s), helpRow(s, solve));
  const panel = panelBlock(s);
  if (solve.moveOwed(s)) panel.classList.add('is-owed');
  body.append(main, html('div', 'sv-side', [panel, diagramBlock(s)]));
  wrap.append(body);
  if (sp) {
    wrap.append(spotlightLayer(sp, {
      root: wrap, find: (root, target) => findSolveTarget(root, target, s), text: divideFeedbackText(s.feedback), undo: '.btn-undo',
      moveSel: (m) => `[data-move="${m}"]`,
    }));
  }
  return wrap;
}
