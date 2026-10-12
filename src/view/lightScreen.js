// The Add to both sides screen, "light build" (SPEC-ADD-TO-BOTH-SIDES.md, revision 2.2). Bare: the line (a coloured box, the one
// place to read, above the equation), the equation with Undo and Go under it, the move list with its Why? boxes, and (in the
// controls, below) the answer row. The scaffold (the seesaw with the equation as counters, the tray, the two-action move) is
// drawn only after I'm stuck or Teach me. Whenever the next step is a button, that button is the one highlighted (pulsing).
// Plain HTML, so every target is a real 44 px and the text can be big.

import { MINUS } from '../engine/expr.js';
import { signed } from '../engine/addBoth.js';
import { xSideOf, answerLive, helpOk } from '../engine/addBothMoves.js';
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
  const atStart = s.stage === 'moves' && !s.scaffold && !s.path;
  if (atStart) line.append(html('div', 'lb-linebtns', [btn('Guess x', 'path', 'btn lb-choice', { value: 'guess' }), btn('Use a move', 'path', 'btn lb-choice', { value: 'move' })]));
  return line;
}

// ---------- the bare equation ----------

// A side as it stands: x, and numbers joined by plus signs (a negative number after a plus, as in the notes). Only the newest
// equation is live: its numbers can be dragged, the guess slides onto its x, the number next to x can be highlighted.
function termsOf(side, s, live) {
  const out = [];
  side.forEach((t, i) => {
    if (i > 0) out.push(html('span', 'lb-plus', ['+']));
    if (t.kind === 'x') {
      out.push(live && s.sub?.kind === 'guess'
        ? html('span', 'lb-x lb-guess', [signed(s.sub.typed)], { 'data-x': '1' })              // the guess slides onto x
        : html('span', 'lb-x', ['x'], { 'data-x': '1' }));
    } else {
      const hint = live && s.hint?.kind === 'cancel' && s.hint.id === t.id;
      out.push(html('span', `lb-num${hint ? ' is-hint' : ''}`, [signed(t.v)], live ? { 'data-numval': t.v } : {}));
    }
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

// The work stack (§3I): the equation, then each move made beneath it, the x = [ ] row with Check, the substitution in colour.
// Rows are added beneath as the work happens and stay until the next problem. Room for about seven rows is reserved.
function stackRows(s) {
  const last = s.rows.length - 1;
  const key = s.work && s.rows.length > 1 ? `w${s.rows.length}:${JSON.stringify(s.work)}` : s.sub?.kind === 'guess' ? `g${s.sub.typed}` : null;
  const settledNow = key !== null && key === playedKey;
  playedKey = key;
  return s.rows.map((row, i) => {
    const newest = i >= last - 1 && s.rows.length > 1;           // the move just made (its work row and the new equation) animates
    const cls = `lb-rowwrap${!newest || settledNow ? ' is-settled' : ''}${row.type === 'work' ? ' has-work' : ''}`;
    if (row.type === 'work') {
      const w = html('div', `lb-eq lb-work${eqClass(charsOf([...row.work.left, ...row.work.right]))}`, [], { 'aria-hidden': 'true' });
      w.append(html('div', 'lb-side lb-left', workTerms(row.work.left)), html('div', 'lb-border', [html('span', 'lb-equals', ['='])]), html('div', 'lb-side lb-right', workTerms(row.work.right)));
      return html('div', cls, [w]);
    }
    const live = i === last;
    const eq = html('div', `lb-eq${eqClass(charsOf([...row.board.left, ...row.board.right]))}`, [], { role: 'img', 'aria-label': 'The equation' });
    eq.append(html('div', 'lb-side lb-left', termsOf(row.board.left, s, live)), html('div', 'lb-border', [html('span', 'lb-equals', ['='])]), html('div', 'lb-side lb-right', termsOf(row.board.right, s, live)));
    return html('div', cls, [eq]);
  });
}

// "x = [ ▁ ]  Check ✓", the substitution under it (a line a click, then the mark), and the green Next. Used on the bare screen and
// after the scaffold (it ends with the pad).
export function answerBlock(s) {
  const block = html('div', 'lb-answerblock');
  const done = s.stage === 'done';
  const counting = s.combining?.step === 'count';
  const live = answerLive(s);
  const text = counting ? s.combining.entry : s.sub && !live ? String(s.sub.typed) : s.entry;
  const ready = live && /^-?\d+$/.test(text);
  const row = html('div', `lb-answerrow${live ? '' : ' is-dim'}`);
  row.append(html('strong', 'lb-prompt', [s.combining ? 'How many are left?' : 'x =']));
  const typed = html('button', `ab-typed lb-typed${text ? '' : ' is-empty'}${live && !text ? ' is-blink' : ''}`, [text ? text.replace('-', MINUS) : ' '], { type: 'button', 'data-action': 'focus', 'data-target': 'answer', 'aria-label': 'Your answer for x' });
  typed.disabled = !live;
  const check = html('button', `btn lb-check${ready ? ' btn-go is-target' : ' btn-primary'}`, ['Check ✓'], { type: 'button', 'data-action': 'check' });
  check.disabled = !ready;
  row.append(typed, check);
  block.append(row);

  // the substitution: a line a click, then Balanced or Not balanced on its own line
  if (s.sub) {
    const shown = s.sub.lines.slice(0, Math.min(s.sub.step, 2));
    const list = html('ol', 'lb-subst', shown.map((line) => html('li', '', [line])));
    if (s.sub.step >= 3) list.append(html('li', s.sub.ok ? 'is-good' : 'is-bad', [s.sub.ok ? '✓ Balanced' : '✗ Not balanced']));
    block.append(list);
  } else block.append(html('ol', 'lb-subst'));
  return block;
}

// The one green Next: a line a click while the substitution is stepped, "Ready for the next problem" at the end (§3G).
function nextButton(s) {
  const stepping = s.sub && s.sub.step < 3;
  const done = s.stage === 'done';
  if (!stepping && !done) return null;
  const b = html('button', 'btn btn-go is-target lb-next', [done ? 'Ready for the next problem' : 'Next ▸'], { type: 'button', 'data-action': done ? 'next' : 'nextLine' });
  return b;
}

// The help row (§1 item 5): permanent, always in the same place; whatever is not an option is greyed.
export function helpRow(s) {
  const done = s.stage === 'done';
  const off = done || (s.stage === 'build' && s.scaffold) || !helpOk(s);
  const row = html('div', 'lb-helprow');
  const mk = (label, action, key, extra = {}) => {
    const b = html('button', `btn ${extra.cls ?? ''}`.trim(), [label], { type: 'button', 'data-action': action, ...(key ? { 'data-key': key } : {}) });
    b.disabled = extra.off ?? off;
    return b;
  };
  row.append(mk('I’m stuck', 'stuck', 's'), mk('Teach me step-by-step', 'teach', 't'), mk('Start over', 'startOver', null, { cls: 'btn-quiet', off: done || !s.startOver }));
  return row;
}

function bareBlock(s) {
  const block = html('div', 'lb-eqblock');
  block.append(html('div', 'lb-stack', [...stackRows(s), answerBlock(s)]));
  const done = s.stage === 'done';
  const next = nextButton(s);
  const row = actionRow({
    undo: true,
    go: !next && s.stage === 'moves' && s.menu === 'add' && !s.sub ? 'Go ▶' : null,
    goAction: 'go',
    goDisabled: !validAmount(s.amountEntry),
  });
  const go = row.querySelector('.btn-go');
  const undo = row.querySelector('.btn-undo');
  const wrongGuess = s.sub?.kind === 'guess' && !s.sub.ok && s.sub.step >= 3;
  undo.disabled = done || !((s.history.length > 0 && !s.sub) || wrongGuess);
  // the one next place to click is the one highlighted
  if (go && validAmount(s.amountEntry)) go.classList.add('is-target');
  if (!undo.disabled && (s.undoCue || wrongGuess)) undo.classList.add('is-target');
  if (next) row.append(next);                                   // Next takes Go's place
  block.append(row);
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
      const b = html('button', `btn btn-move lb-move${o.menu === 'add' ? ' is-on' : ''}${target ? ' is-target' : ''}${o.locked ? ' is-grey' : ''}`, ['Add ', blank, ' to both sides'], { type: 'button', 'data-action': 'choose', 'data-move': 'add' });
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
    menu: s.menu, typing: s.typing, amountEntry: s.amountEntry, path: s.path,
    disabled: building || s.stage === 'done' || Boolean(s.combining) || Boolean(s.pending) || Boolean(s.sub),
    locked: !s.scaffold && s.stage === 'moves' && s.path !== 'move',                  // before the choice, and on the guess path
    target: s.path === 'move' && !s.menu && s.lights.solved !== 'green' && !s.undoCue && !s.sub && s.stage === 'moves' && !s.hint,
    lights: s.lights, off: building, flash: ['red', 'neutral'].includes(s.lights.fewer) && s.history.length > 0, sub,
  });
}

export function renderLightScreen(s) {
  const wrap = html('div', 'lb-game lb-eqcard');
  wrap.append(lineBlock(s));
  const body = html('div', 'lb-body');
  const main = html('div', 'lb-main');
  if (s.scaffold) {
    main.append(boardBlock(s));
    const tray = trayFor(s);
    if (tray) main.append(tray);
    if (s.stage !== 'build') {
      main.append(answerBlock(s));
      const next = nextButton(s);
      if (next) main.append(html('div', 'ab-actions', [html('span'), next]));
    }
  } else main.append(bareBlock(s));
  main.append(helpRow(s));
  body.append(main, panelBlock(s));
  wrap.append(body);
  return wrap;
}
