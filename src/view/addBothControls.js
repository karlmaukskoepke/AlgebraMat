// The controls for Add to both sides, "light build": the "Amount to add" row (only while a move is waiting for its number) and the
// number pad. The answer row (x = [  ] with Check) lives in the work stack on the Mat and the help row (I'm stuck, Teach me, Start
// over) sits at the bottom of the equation mat (SPEC-ADD-TO-BOTH-SIDES.md §1, revision 2.3). The pad types into the amount blank
// while the move is open and into the answer otherwise.

import { MINUS } from '../engine/expr.js';
import { answerLive } from '../engine/addBothMoves.js';

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

export function buildAddBothControls(root, dispatch) {
  root.innerHTML = '';
  // "Amount to add: [   ]": only while a move is selected and waiting for its number
  const amountRow = document.createElement('div');
  amountRow.className = 'lb-answerrow lb-amountrow';
  const amountPrompt = document.createElement('strong');
  amountPrompt.textContent = 'Amount to add:';
  const amountValue = document.createElement('span');
  amountValue.className = 'ab-typed';
  amountRow.append(amountPrompt, amountValue);
  amountRow.hidden = true;

  const keys = document.createElement('div');
  keys.className = 'pad';
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => button(String(d), 'digit', { cls: 'btn-pad', data: { digit: d } }));
  keys.append(button('±', 'toggleSign', { cls: 'btn-pad', aria: 'Change sign' }), ...digits, button('⌫', 'backspace', { cls: 'btn-pad', aria: 'Delete' }));

  root.append(amountRow, keys);

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-action]');
    if (!b || b.disabled) return;
    const { action, digit } = b.dataset;
    dispatch({ type: action, digit: digit === undefined ? undefined : Number(digit) });
  });

  return {
    update(s) {
      const done = s.stage === 'done' || s.step === 'levelDone';
      const amountMode = !done && s.stage === 'moves' && s.menu === 'add' && s.typing !== 'answer' && !s.combining;
      amountRow.hidden = !amountMode;
      amountValue.textContent = (s.amountEntry ?? '').replace('-', MINUS) || ' ';
      amountValue.classList.toggle('is-empty', !s.amountEntry);
      amountValue.classList.toggle('is-blink', !s.amountEntry);
      // the pad is live for the amount (once the move is open) and for the answer (once it is live); greyed otherwise
      const on = !done && s.step !== 'levelDone' && (amountMode || answerLive(s));
      for (const b of keys.querySelectorAll('button')) b.disabled = !on;
    },
  };
}
