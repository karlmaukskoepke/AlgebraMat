// The Add to both sides screen, "light build" (SPEC-ADD-TO-BOTH-SIDES.md, revision 2.2). Bare: the line (a coloured box, the one
// place to read, above the equation), the equation with Undo and Go under it, the move list with its Why? boxes, and (in the
// controls, below) the answer row. The scaffold (the seesaw with the equation as counters, the tray, the two-action move) is
// drawn only after I'm stuck or Teach me. Whenever the next step is a button, that button is the one highlighted (pulsing).
// Plain HTML, so every target is a real 44 px and the text can be big.

import { MINUS } from '../engine/expr.js';
import { signed } from '../engine/addBoth.js';
import { xSideOf } from '../engine/addBothMoves.js';
import { addBothFeedbackText } from './addBothFeedback.js';
import { boardBlock, trayFor, html, actionRow } from './addBothMat.js';

const btn = (label, action, cls = 'btn', data = {}) => html('button', cls, [label], { type: 'button', 'data-action': action, ...Object.fromEntries(Object.entries(data).map(([k, v]) => [`data-${k}`, v])) });

// The move list is the same on every card of the unit; only "Add ___ to both sides" is active here (order decided 2026-10-12).
const MOVES = [
  ['add', 'Add ___ to both sides'],
  ['cross', 'Cross the border'],
  ['fraction', 'Take a fraction of both sides'],
  ['multiply', 'Multiply both sides by ___'],
  ['flip', 'Flip everything'],
  ['trade', 'Trade places'],
  ['distribute', 'Distribute'],
  ['combine', 'Combine like terms'],
];

export const validAmount = (entry) => /^-?\d+$/.test(entry ?? '') && Number(entry) !== 0;

// ---------- the line ----------

function lineBlock(s) {
  const line = html('div', `lb-line${s.feedback?.bad ? ' is-bad' : ''}${s.stage === 'done' ? ' is-good' : ''}`, [], { role: 'status', 'aria-live': 'polite' });
  line.append(html('p', 'lb-text', [addBothFeedbackText(s.feedback)]));
  const atStart = s.stage === 'moves' && !s.scaffold && !s.path && !s.walk && !s.guessCheck && s.history.length === 0 && s.feedback?.key === 'aChoose';
  if (atStart) line.append(html('div', 'lb-linebtns', [btn('Guess x', 'path', 'btn lb-choice', { value: 'guess' }), btn('Use a move', 'path', 'btn lb-choice', { value: 'move' })]));
  return line;
}

// ---------- the bare equation ----------

// A side as it stands: x, and numbers joined by plus signs (a negative number after a plus, as in the notes).
function termsOf(side, s) {
  const out = [];
  side.forEach((t, i) => {
    if (i > 0) out.push(html('span', 'lb-plus', ['+']));
    if (t.kind === 'x') {
      out.push(s.guessCheck
        ? html('span', 'lb-x lb-guess', [signed(s.guessCheck.typed)], { 'data-x': '1' })       // the guess slides onto x
        : html('span', 'lb-x', ['x'], { 'data-x': '1' }));
    } else out.push(html('span', 'lb-num', [signed(t.v)], { 'data-numval': t.v }));
  });
  return out;
}

// The line a move leaves above the new equation: the amount (coloured) on both sides, x's numbers struck as they combine.
export function workTerms(items) {
  const out = [];
  items.forEach((t, i) => {
    if (i > 0) out.push(html('span', 'lb-plus', ['+']));
    out.push(t.x ? html('span', 'lb-x', ['x']) : html('span', `lb-num${t.added ? ' is-added' : ''}${t.struck ? ' is-struck' : ''}`, [signed(t.v)]));
  });
  return out;
}

// An equation row: the left side, the border, the right side (each an array of elements).
export function equationRow(leftEls, rightEls, cls = '') {
  const eq = html('div', `lb-eq ${cls}`.trim());
  eq.append(html('div', 'lb-side lb-left', leftEls), html('div', 'lb-border', [html('span', 'lb-equals', ['='])]), html('div', 'lb-side lb-right', rightEls));
  return eq;
}

const eqClass = (chars) => (chars > 30 ? ' is-xlong' : chars > 20 ? ' is-long' : '');
const charsOf = (list) => list.map((x) => (x.kind === 'x' || x.x ? 1 : String(signed(x.v)).length + 3)).reduce((a, b) => a + b, 0);

// An animation plays once: a later render of the same state (typing a digit, say) draws it already settled.
let playedKey = null;

function bareBlock(s) {
  const key = s.guessCheck ? `g${s.guessCheck.typed}` : s.work ? `w${s.history.length}:${JSON.stringify(s.work)}` : null;
  const settled = key !== null && key === playedKey;
  playedKey = key;
  const block = html('div', `lb-eqblock${s.work && !s.guessCheck ? ' has-work' : ''}${settled ? ' is-settled' : ''}`);
  if (s.work && !s.guessCheck) {
    const w = html('div', `lb-eq lb-work${eqClass(charsOf([...s.work.left, ...s.work.right]))}`, [], { 'aria-hidden': 'true' });
    w.append(html('div', 'lb-side lb-left', workTerms(s.work.left)), html('div', 'lb-border', [html('span', 'lb-equals', ['='])]), html('div', 'lb-side lb-right', workTerms(s.work.right)));
    block.append(w);
  }
  const eq = html('div', `lb-eq${eqClass(charsOf([...s.board.left, ...s.board.right]))}`, [], { role: 'img', 'aria-label': 'The equation' });
  eq.append(html('div', 'lb-side lb-left', termsOf(s.board.left, s)), html('div', 'lb-border', [html('span', 'lb-equals', ['='])]), html('div', 'lb-side lb-right', termsOf(s.board.right, s)));
  block.append(eq);

  // the substitution under the equation: a step a click after a wrong guess; all at once after a wrong value
  let lines = [];
  if (s.guessCheck) lines = s.guessCheck.lines.slice(0, s.guessCheck.step);
  else if (s.subst) lines = s.subst;
  if (lines.length) {
    block.append(html('ol', 'lb-subst', lines.map((text, i) => html('li', i === 1 ? (text.includes('✗') ? 'is-bad' : 'is-good') : '', [text]))));
  }

  const done = s.stage === 'done';
  const xSide = xSideOf(s.board);
  const otherTerms = s.board[xSide === 'left' ? 'right' : 'left'];
  const matchLabel = s.walk?.step === 'match' ? `${otherTerms.map((t) => signed(t.v)).join(' + ')} = ${signed(s.walk.typed)} ✓` : null;
  const guessStep = s.guessCheck && s.guessCheck.step < 2;
  const row = actionRow({
    undo: !done && ((s.history.length > 0 && !s.guessCheck) || s.guessCheck?.step === 2),
    go: guessStep ? 'Next ▸' : s.walk?.step === 'match' ? matchLabel : s.stage === 'moves' && s.menu === 'add' && !s.guessCheck ? 'Go ▶' : null,
    goAction: guessStep ? 'nextLine' : s.walk?.step === 'match' ? 'matchGuess' : 'go',
    goDisabled: false,
  });
  if (row) {
    const go = row.querySelector('.btn-go');
    const undo = row.querySelector('.btn-undo');
    // the one next place to click is the one highlighted
    if (go && (guessStep || s.walk?.step === 'match' || s.walk?.step === 'go' || (s.menu === 'add' && validAmount(s.amountEntry)))) go.classList.add('is-target');
    if (undo && (s.undoCue || s.guessCheck?.step === 2)) undo.classList.add('is-target');
    block.append(row);
  }
  return block;
}

// ---------- the move panel ----------

function checkbox(state) {
  return html('span', `ab-checkbox is-${state}`, [state === 'green' ? '✓' : state === 'red' ? '✗' : state === 'neutral' ? '–' : ''], { 'aria-hidden': 'true' });
}

// The move panel: Move | Why?, one row (one line) a move, Solved for x last. `o`: { menu, typing, amountEntry, path, walkStep,
// disabled, lights: { fewer, solved }, off (draw the boxes as not yet available), flash, target (point at Add), sub }.
export function movePanel(o) {
  const panel = html('aside', 'lb-panel', [], { 'aria-label': 'Moves' });
  panel.append(html('div', 'lb-head', [html('span', '', ['Move']), html('span', '', ['Why?'])]));
  const blank = html('span', `ab-blank${o.menu === 'add' && o.typing !== 'answer' ? ' is-active' : ''}${o.amountEntry ? '' : ' is-empty'}`, [o.amountEntry ? o.amountEntry.replace('-', MINUS) : ' '], { 'data-blank': '1' });
  const fewer = o.off ? 'off' : o.lights.fewer;
  for (const [id, label] of MOVES) {
    const row = html('div', 'lb-row');
    if (id === 'add') {
      const target = o.target || o.walkStep === 'move';
      const b = html('button', `btn btn-move lb-move${o.menu === 'add' ? ' is-on' : ''}${target ? ' is-target' : ''}`, ['Add ', blank, ' to both sides'], { type: 'button', 'data-action': 'choose', 'data-move': 'add' });
      b.disabled = Boolean(o.disabled);
      row.append(b);
      row.append(html('ul', 'ab-goals', [html('li', `ab-goal is-${fewer}${o.flash ? ' is-flash' : ''}`, [checkbox(fewer), html('span', 'ab-goal-label', ['Fewer terms'])])]));
    } else {
      row.append(html('button', 'btn lb-move is-grey', [label], { type: 'button', 'data-action': 'greyMove', 'data-move': id, 'aria-disabled': 'true' }));
      row.append(html('span', 'lb-nowhy'));
    }
    panel.append(row);
  }
  const solved = o.off ? 'off' : o.lights.solved;
  panel.append(html('div', 'lb-row lb-solved', [html('span', 'lb-solved-label', ['Solved for x']), html('ul', 'ab-goals', [html('li', `ab-goal is-${solved}`, [checkbox(solved)])])]));
  if (o.sub) panel.append(o.sub);
  return panel;
}

function panelBlock(s) {
  const building = s.stage === 'build';
  let sub = null;
  // the scaffold's combining ritual
  if (s.combining) {
    sub = html('div', 'ab-sub');
    if (s.combining.step === 'kind') {
      sub.append(btn('Party!', 'kind', 'btn btn-party', { value: 'party' }), btn('Battle!', 'kind', 'btn btn-battle', { value: 'battle' }));
    } else if (!s.combining.crossed && s.combining.kind === 'battle') {
      sub.append(btn('Cross off for me', 'crossOff'));
    }
    sub.append(btn('Never mind', 'abandon', 'btn btn-quiet'));
  }
  return movePanel({
    menu: s.menu, typing: s.typing, amountEntry: s.amountEntry, path: s.path, walkStep: s.walk?.step,
    disabled: building || s.stage === 'done' || Boolean(s.combining) || Boolean(s.pending) || Boolean(s.guessCheck),
    target: s.path === 'move' && !s.menu && !s.walk && s.lights.solved !== 'green' && !s.undoCue && !s.guessCheck && s.stage === 'moves',
    lights: s.lights, off: building, flash: ['red', 'neutral'].includes(s.lights.fewer) && s.history.length > 0, sub,
  });
}

export function renderLightScreen(s) {
  const wrap = html('div', 'lb-game');
  wrap.append(lineBlock(s));
  const body = html('div', 'lb-body');
  const main = html('div', 'lb-main');
  if (s.scaffold) {
    main.append(boardBlock(s));
    const tray = trayFor(s);
    if (tray) main.append(tray);
  } else main.append(bareBlock(s));
  body.append(main, panelBlock(s));
  wrap.append(body);
  return wrap;
}
