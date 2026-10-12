// The controls for Add to both sides: Undo and Start over, I'm stuck, Teach me, Check, and the pad. (The moves, Add to left /
// right / Go, Party or Battle and the checkboxes live on the Mat, in the Balancing moves panel.) Which rows show follows the session (the engine says what is going on); the pad types the amount, the count of a
// combination, or the answer, as the engine decides, and a line above it says which.

import { startTour } from './tour.js';
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

  const startOver = button('Start over', 'startOver', { cls: 'btn-quiet' });
  // "x = ?": a bold prompt and a boxed place for what is being typed (an underline blinks while it is empty)
  const setTyping = (prompt, value) => {
    const b = document.createElement('strong');
    b.textContent = prompt;
    const v = document.createElement('span');
    v.className = `ab-typed${value ? '' : ' is-empty'}`;
    v.textContent = value || '\u00a0';
    typing.replaceChildren(b, v);
  };
  const stuck = button('I’m stuck', 'stuck', { data: { key: 's' }, aria: 'I’m stuck (key S)' });
  const teach = button('Teach me step-by-step', 'teach', { data: { key: 't' }, aria: 'Teach me step-by-step (key T)' });
  const tourButton = button('?', 'tour', { cls: 'btn-tour', aria: 'Show me around' });
  const check = button('Check ✓', 'check', { cls: 'btn-primary' });
  const palette = row('palette-row', startOver, stuck, teach, tourButton, check);

  const keys = document.createElement('div');
  keys.className = 'pad';
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => button(String(d), 'digit', { cls: 'btn-pad', data: { digit: d } }));
  keys.append(button('±', 'toggleSign', { cls: 'btn-pad', aria: 'Change sign' }), ...digits, button('⌫', 'backspace', { cls: 'btn-pad', aria: 'Delete' }));

  root.append(typing, palette, keys);

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-action]');
    if (!b || b.disabled) return;
    if (b.dataset.action === 'tour') { startTour({ first: false }); return; }
    const { action, digit, move, side, value } = b.dataset;
    if (action === 'check' && b.dataset.cont) return dispatch({ type: 'continue' });
    if (action === 'check' && b.dataset.next) return dispatch({ type: 'next' });
    dispatch({ type: action, digit: digit === undefined ? undefined : Number(digit), move, side, value });
  });

  const apply = (s) => {
      delete check.dataset.cont;
      const stage = s.step === 'levelDone' ? 'levelDone' : s.stage;
      const done = stage === 'done' || stage === 'levelDone';
      const building = stage === 'build';
      const combining = Boolean(s.combining);
      const checking = s.early?.step === 'drag' || s.early?.step === 'check';

      // what the pad is typing right now
      const amountMode = s.menu === 'add' && (!s.pending || s.pending.second);
      typing.hidden = building || done || checking || (combining && s.combining.step !== 'count');
      if (combining) setTyping('How many are left?', s.combining.entry.replace('-', MINUS));
      else if (amountMode) setTyping('Amount to add:', (s.amountEntry ?? '').replace('-', MINUS));
      else setTyping('x =', s.entry.replace('-', MINUS));

      startOver.hidden = !s.startOver || done;
      const helpOk = !done && !building;
      stuck.disabled = teach.disabled = !helpOk;
      tourButton.disabled = done;
      const typingOk = !done && !building && !(checking) && !(combining && s.combining.step !== 'count');
      for (const b of keys.querySelectorAll('button')) b.disabled = !typingOk;
      check.disabled = !done && (!typingOk);
      check.innerHTML = done ? 'Next →' : 'Check ✓';
      if (done) check.dataset.next = '1'; else delete check.dataset.next;
  };

  return {
    update(s) {
      const tut = s.tut;
      if (!tut) return apply(s);
      // a tutorial is on: nothing here counts as help, and "next" means "continue" (the tutorial is never a barrier: Skip is on the Mat)
      if (tut.phase !== 'numeric') {
        apply(tut.eng);
        stuck.disabled = teach.disabled = tourButton.disabled = true;
        startOver.hidden = true;
        if (tut.eng.stage === 'done') { check.innerHTML = 'Continue ▸'; delete check.dataset.next; check.dataset.cont = '1'; check.disabled = false; }
        return;
      }
      const t = tut.t;
      const typingOk = t.kind === 'add' && t.menu === 'add' && t.stage === 'explore';
      delete check.dataset.cont;
      delete check.dataset.next;
      typing.hidden = !typingOk;
      setTyping('Amount to add:', t.amountEntry.replace('-', MINUS));
      startOver.hidden = true;
      stuck.disabled = teach.disabled = tourButton.disabled = check.disabled = true;
      check.innerHTML = 'Check ✓';
      for (const b of keys.querySelectorAll('button')) b.disabled = !typingOk;
    },
  };
}
