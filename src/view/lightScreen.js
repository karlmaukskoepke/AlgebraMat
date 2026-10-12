// The Add to both sides screen, "light build" (SPEC-ADD-TO-BOTH-SIDES.md, revision 2). Bare: the line (the one place to read,
// above the equation), the equation with Undo under it, the move list with its Why? boxes, and (in the controls, below) the
// answer row. The scaffold (the seesaw with the equation as counters, the tray, the two-action move) is drawn only after
// I'm stuck or Teach me. Plain HTML, so every target is a real 44 px and the text can be big.

import { MINUS } from '../engine/expr.js';
import { signed } from '../engine/addBoth.js';
import { xSideOf } from '../engine/addBothMoves.js';
import { addBothFeedbackText } from './addBothFeedback.js';
import { boardBlock, trayFor, html, actionRow } from './addBothMat.js';

const btn = (label, action, cls = 'btn', data = {}) => html('button', cls, [label], { type: 'button', 'data-action': action, ...Object.fromEntries(Object.entries(data).map(([k, v]) => [`data-${k}`, v])) });

// The move list is the same on every card of the unit; only "Add ___ to both sides" is active here.
const MOVES = [
  ['add', 'Add ___ to both sides'],
  ['fraction', 'Take a fraction of both sides'],
  ['multiply', 'Multiply both sides by ___'],
  ['flip', 'Flip everything'],
  ['distribute', 'Distribute'],
  ['combine', 'Combine like terms'],
  ['trade', 'Trade places'],
  ['cross', 'Cross the border'],
];

// ---------- the line ----------

function lineBlock(s) {
  const line = html('div', `lb-line${s.feedback?.bad ? ' is-bad' : ''}${s.stage === 'done' ? ' is-good' : ''}`, [], { role: 'status', 'aria-live': 'polite' });
  line.append(html('p', 'lb-text', [addBothFeedbackText(s.feedback)]));
  const row = html('div', 'lb-linebtns');
  const atStart = s.stage === 'moves' && !s.scaffold && !s.path && !s.walk && !s.early && !s.canPutBack && s.history.length === 0 && s.feedback?.key === 'aChoose';
  if (atStart) {
    row.append(btn('Guess x', 'path', 'btn lb-choice', { value: 'guess' }), btn('Use a move', 'path', 'btn lb-choice', { value: 'move' }));
  }
  if (s.canPutBack) row.append(btn('Put it back in', 'putBack', 'btn lb-choice'));
  if (s.early?.step === 'drag') {
    row.append(html('button', 'ab-piece is-answer', [signed(s.early.typed)], { type: 'button', 'data-chip': '1', 'aria-label': `Your guess ${signed(s.early.typed)}` }));
  }
  if (s.early?.step === 'check') {
    const lines = s.early.lines.slice(0, s.early.shown + 1);
    const steps = html('ol', 'lb-steps', lines.map((text, i) => html('li', i === s.early.lines.length - 1 ? (text.includes('Unbalanced') ? 'is-bad' : 'is-good') : '', [text])));
    line.append(steps);
    row.append(btn('Next ▸', 'nextLine', 'btn btn-go'));
  }
  if (row.childNodes.length) line.append(row);
  return line;
}

// ---------- the bare equation ----------

function termsOf(side, s) {
  const out = [];
  side.forEach((t, i) => {
    if (i > 0) out.push(html('span', 'lb-plus', [' + ']));
    if (t.kind === 'x') {
      const target = s.early?.step === 'drag';
      out.push(html('span', `lb-x${target ? ' is-target' : ''}`, ['x'], { 'data-x': '1', ...(target ? { 'data-action': 'dropValue', role: 'button', tabindex: '0', 'aria-label': 'Put your guess in for x' } : {}) }));
    } else {
      out.push(html('span', 'lb-num', [signed(t.v)], { 'data-numval': t.v }));
    }
  });
  return out;
}

function bareBlock(s) {
  const block = html('div', 'lb-eqblock');
  const chars = [...s.board.left, ...s.board.right].map((x) => (x.kind === 'x' ? 1 : String(signed(x.v)).length + 3)).reduce((a, b) => a + b, 0);
  const eq = html('div', `lb-eq${chars > 30 ? ' is-xlong' : chars > 20 ? ' is-long' : ''}`, [], { role: 'img', 'aria-label': 'The equation' });
  eq.append(html('div', 'lb-side lb-left', termsOf(s.board.left, s)), html('div', 'lb-border', [html('span', 'lb-equals', ['='])]), html('div', 'lb-side lb-right', termsOf(s.board.right, s)));
  block.append(eq);
  const done = s.stage === 'done';
  const xSide = xSideOf(s.board);
  const otherTerms = s.board[xSide === 'left' ? 'right' : 'left'];
  const matchLabel = s.walk?.step === 'match'
    ? `${otherTerms.map((t) => signed(t.v)).join(' + ')} = ${signed(s.walk.typed)} ✓`
    : null;
  const row = actionRow({
    undo: !done && s.history.length > 0 && !s.early,
    go: s.walk?.step === 'match' ? matchLabel : s.stage === 'moves' && s.menu === 'add' ? 'Go ▶' : null,
    goAction: s.walk?.step === 'match' ? 'matchGuess' : 'go',
  });
  if (row) {
    const go = row.querySelector('.btn-go');
    if (go && (s.walk?.step === 'match' || s.walk?.step === 'go')) go.classList.add('is-target');
    block.append(row);
  }
  return block;
}

// ---------- the move panel ----------

function checkbox(state) {
  return html('span', `ab-checkbox is-${state}`, [state === 'green' ? '✓' : state === 'red' ? '✗' : state === 'neutral' ? '–' : ''], { 'aria-hidden': 'true' });
}

// The move panel: Move | Why?, one row a move, Solved for x last. `o`: { menu, typing, amountEntry, path, walkStep, disabled,
// lights: { fewer, solved }, off (draw the boxes as not yet available), sub (extra buttons under the list) }.
export function movePanel(o) {
  const panel = html('aside', 'lb-panel', [], { 'aria-label': 'Moves' });
  panel.append(html('div', 'lb-head', [html('span', '', ['Move']), html('span', '', ['Why?'])]));
  const blank = html('span', `ab-blank${o.menu === 'add' && o.typing !== 'answer' ? ' is-active' : ''}${o.amountEntry ? '' : ' is-empty'}`, [o.amountEntry ? o.amountEntry.replace('-', MINUS) : '\u00a0'], { 'data-blank': '1' });
  const fewer = o.off ? 'off' : o.lights.fewer;
  for (const [id, label] of MOVES) {
    const row = html('div', 'lb-row');
    if (id === 'add') {
      const b = html('button', `btn btn-move lb-move${o.menu === 'add' ? ' is-on' : ''}${o.path === 'move' && !o.menu && !o.walkStep ? ' is-target' : ''}${o.walkStep === 'move' ? ' is-target' : ''}`, ['Add ', blank, ' to both sides'], { type: 'button', 'data-action': 'choose', 'data-move': 'add' });
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
    disabled: building || s.stage === 'done' || Boolean(s.combining) || Boolean(s.pending) || Boolean(s.early),
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
