// The controls for Add to both sides: the moves menu, the amount and Add to left / Add to right / Go, Party or Battle for
// two groups being combined, the steps of the early-answer check, Undo and Start over, I'm stuck, Teach me, Check, and the
// pad. Which rows show follows the session (the engine says what is going on); the pad types the amount, the count of a
// combination, or the answer, as the engine decides, and a line above it says which.

import { startTour } from './tour.js';
import { MOVES_BY_LEVEL } from '../engine/addBothMoves.js';
import { MINUS } from '../engine/expr.js';

function button(label, action, extra = {}) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `btn ${extra.cls ?? ''}`.trim();
  b.innerHTML = label;
  b.dataset.action = action;
  for (const [k, v] of Object.entries(extra.data ?? {})) b.dataset[k] = v;
  if (extra.aria) b.setAttribute('aria-label', extra.aria);
  return b;
}

function row(cls, ...children) {
  const r = document.createElement('div');
  r.className = `ab-row ${cls}`;
  r.append(...children);
  return r;
}

export function buildAddBothControls(root, dispatch) {
  root.innerHTML = '';
  const typing = document.createElement('p');
  typing.className = 'ab-typing';
  typing.setAttribute('aria-live', 'polite');

  const menu = row('ab-menu',
    button('Add ___ to both sides', 'choose', { data: { move: 'add' }, cls: 'btn-move' }),
    button('Trade places', 'choose', { data: { move: 'trade' }, cls: 'btn-move' }),
    button('Cross the border', 'choose', { data: { move: 'cross' }, cls: 'btn-move' }));
  const add = row('ab-add',
    button('Add to left', 'addTo', { data: { side: 'left' } }),
    button('Add to right', 'addTo', { data: { side: 'right' } }),
    button('Go ▶', 'go', { cls: 'btn-primary' }));
  const combine = row('ab-combine',
    button('Party!', 'kind', { data: { value: 'party' }, cls: 'btn-party' }),
    button('Battle!', 'kind', { data: { value: 'battle' }, cls: 'btn-battle' }),
    button('Cross off for me', 'crossOff'),
    button('Never mind', 'abandon', { cls: 'btn-quiet' }));
  const earlyRow = row('ab-early', button('Next ▸', 'nextLine', { cls: 'btn-primary' }));

  const undo = button('↶ Undo', 'undo', { cls: 'btn-quiet', data: { key: 'u' } });
  const startOver = button('Start over', 'startOver', { cls: 'btn-quiet' });
  const stuck = button('I’m stuck', 'stuck', { data: { key: 's' }, aria: 'I’m stuck (key S)' });
  const teach = button('Teach me step-by-step', 'teach', { data: { key: 't' }, aria: 'Teach me step-by-step (key T)' });
  const tourButton = button('?', 'tour', { cls: 'btn-tour', aria: 'Show me around' });
  const check = button('Check ✓', 'check', { cls: 'btn-primary' });
  const palette = row('palette-row', undo, startOver, stuck, teach, tourButton, check);

  const keys = document.createElement('div');
  keys.className = 'pad';
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => button(String(d), 'digit', { cls: 'btn-pad', data: { digit: d } }));
  keys.append(button('±', 'toggleSign', { cls: 'btn-pad', aria: 'Change sign' }), ...digits, button('⌫', 'backspace', { cls: 'btn-pad', aria: 'Delete' }));

  root.append(typing, menu, add, combine, earlyRow, palette, keys);

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-action]');
    if (!b || b.disabled) return;
    if (b.dataset.action === 'tour') { startTour({ first: false }); return; }
    const { action, digit, move, side, value } = b.dataset;
    if (action === 'check' && b.dataset.next) return dispatch({ type: 'next' });
    dispatch({ type: action, digit: digit === undefined ? undefined : Number(digit), move, side, value });
  });

  return {
    update(s) {
      const stage = s.step === 'levelDone' ? 'levelDone' : s.stage;
      const done = stage === 'done' || stage === 'levelDone';
      const building = stage === 'build';
      const combining = Boolean(s.combining);
      const checking = s.early?.step === 'drag' || s.early?.step === 'check';
      const mid = Boolean(s.pending);
      const choosing = !building && !done && !combining && !mid && !checking;

      // what the pad is typing right now
      const amountMode = s.menu === 'add' && (!s.pending || s.pending.second);
      typing.hidden = building || done || checking || (combining && s.combining.step !== 'count');
      if (combining) typing.textContent = `Typing: how many are left ${s.combining.entry ? `= ${s.combining.entry.replace('-', MINUS)}` : ''}`.trim();
      else if (amountMode) typing.textContent = `Typing: the amount to add = ${s.amountEntry ? s.amountEntry.replace('-', MINUS) : '?'}`;
      else typing.textContent = 'Typing: your answer for x';

      const allowed = MOVES_BY_LEVEL(s.level);
      menu.hidden = !choosing || stage !== 'moves';
      for (const b of menu.querySelectorAll('button')) {
        b.hidden = !allowed.includes(b.dataset.move);
        b.classList.toggle('is-on', s.menu === b.dataset.move);
      }
      const crossing = s.pending?.kind === 'cross';
      add.hidden = !(s.menu === 'add' || crossing) || combining || done || (!choosing && !mid);
      const [toLeft, toRight, go] = add.querySelectorAll('button');
      toLeft.hidden = toRight.hidden = crossing;
      toLeft.disabled = Boolean(mid && s.pending.side === 'left');
      toRight.disabled = Boolean(mid && s.pending.side === 'right');
      go.disabled = !(mid && s.pending.both) || s.leftDelta !== s.rightDelta;
      combine.hidden = !combining;
      if (combining) {
        const [party, battle, cross] = combine.querySelectorAll('button');
        const inKind = s.combining.step === 'kind';
        party.hidden = battle.hidden = !inKind;
        cross.hidden = inKind || s.combining.crossed || s.combining.kind !== 'battle';
      }
      earlyRow.hidden = s.early?.step !== 'check';
      undo.hidden = building || done || !s.history.length;
      startOver.hidden = !s.startOver || done;
      const helpOk = !done && !building;
      stuck.disabled = teach.disabled = !helpOk;
      tourButton.disabled = done;
      const typingOk = !done && !building && !(checking) && !(combining && s.combining.step !== 'count');
      for (const b of keys.querySelectorAll('button')) b.disabled = !typingOk;
      check.disabled = !done && (!typingOk);
      check.innerHTML = done ? 'Next →' : 'Check ✓';
      if (done) check.dataset.next = '1'; else delete check.dataset.next;
    },
  };
}
